const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import database connection
const pool = require('./db/connection');
const { moderateContent } = require('./utils/moderation');

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Health Check Route ───────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// ─── Database Test Route ───────────────────────────────────────────────────────
app.get('/api/db-test', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [rows] = await connection.query('SELECT 1 as test');
    connection.release();
    res.json({ status: 'Database connection successful', data: rows });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', message: error.message });
  }
});

// ─── Get All Users ────────────────────────────────────────────────────────────
app.get('/api/users', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT id, name, email, join_date, is_admin FROM users');
    connection.release();
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users', message: error.message });
  }
});

// ─── Login Route ───────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const connection = await pool.getConnection();
    const [users] = await connection.query('SELECT id, name, email, password, is_admin, join_date FROM users WHERE email = ?', [email]);
    connection.release();

    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = users[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Return user data without password
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      is_admin: user.is_admin,
      join_date: user.join_date
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed', message: error.message });
  }
});

// ─── Create New User ───────────────────────────────────────────────────────────
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields: name, email, password' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, FALSE)',
      [name, email, hashedPassword]
    );
    connection.release();
    
    res.status(201).json({ 
      id: result.insertId,
      name,
      email,
      is_admin: false,
      join_date: new Date()
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user', message: error.message });
  }
});

// ─── Get All Items ────────────────────────────────────────────────────────────
app.get('/api/items', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [items] = await connection.query(`
      SELECT i.*, u.name as posted_by_name 
      FROM items i 
      LEFT JOIN users u ON i.posted_by = u.id 
      ORDER BY i.date_posted DESC
    `);
    connection.release();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items', message: error.message });
  }
});

// ─── Create New Item ───────────────────────────────────────────────────────────
app.post('/api/items', async (req, res) => {
  try {
    const { title, description, location, status, category, tags, posted_by, image_emoji } = req.body;
    
    console.log('📦 POST /api/items received:', { title, description, location, status, category, tags, posted_by, image_emoji });
    
    if (!title || !location || !posted_by) {
      return res.status(400).json({ error: 'Missing required fields: title, location, posted_by' });
    }

    const connection = await pool.getConnection();
    const tagsJson = tags ? JSON.stringify(tags) : JSON.stringify([]);
    const [result] = await connection.query(
      'INSERT INTO items (title, description, location, status, category, tags, posted_by, image_emoji) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [title, description || null, location, status || 'lost', category || 'other', tagsJson, posted_by, image_emoji || '📦']
    );
    connection.release();
    
    const newItem = {
      id: result.insertId,
      title,
      description,
      location,
      status: status || 'lost',
      category: category || 'other',
      tags: tags || [],
      posted_by,
      posted_by_name: 'Admin User', // TODO: fetch actual user name
      image_emoji: image_emoji || '📦',
      date_posted: new Date()
    };
    
    // Broadcast to all WebSocket clients
    broadcast('item_created', newItem);
    
    res.status(201).json(newItem);
  } catch (error) {
    console.error('❌ POST /api/items error:', error);
    res.status(500).json({ error: 'Failed to create item', message: error.message });
  }
});

// ─── Delete Item ──────────────────────────────────────────────────────────────
app.delete('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [result] = await connection.query('DELETE FROM items WHERE id = ?', [id]);
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete item', message: error.message });
  }
});

// ─── Get Items by Category ────────────────────────────────────────────────────
app.get('/api/items/category/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const connection = await pool.getConnection();
    const [items] = await connection.query(`
      SELECT i.*, u.name as posted_by_name 
      FROM items i 
      LEFT JOIN users u ON i.posted_by = u.id 
      WHERE i.category = ?
      ORDER BY i.date_posted DESC
    `, [category]);
    connection.release();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch items by category', message: error.message });
  }
});

// ─── Search Items by Tags ────────────────────────────────────────────────────
app.get('/api/items/search/tags/:tag', async (req, res) => {
  try {
    const { tag } = req.params;
    const connection = await pool.getConnection();
    const [items] = await connection.query(`
      SELECT i.*, u.name as posted_by_name 
      FROM items i 
      LEFT JOIN users u ON i.posted_by = u.id 
      WHERE JSON_CONTAINS(i.tags, JSON_QUOTE(?))
      ORDER BY i.date_posted DESC
    `, [tag]);
    connection.release();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search items by tag', message: error.message });
  }
});

// ─── Comments Endpoints ────────────────────────────────────────────────────────

// Get comments for a specific item
app.get('/api/comments/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params;
    const connection = await pool.getConnection();
    const [comments] = await connection.query(`
      SELECT c.id, c.comment_text, c.created_at, u.name as user_name, u.id as user_id
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.item_id = ?
      ORDER BY c.created_at ASC
    `, [item_id]);
    connection.release();
    res.json(comments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch comments', message: error.message });
  }
});

// Post a new comment
app.post('/api/comments', async (req, res) => {
  try {
    const { item_id, user_id, comment_text } = req.body;
    
    if (!item_id || !user_id || !comment_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ─── Content Moderation ───
    const moderationResult = await moderateContent(comment_text);
    
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO comments (item_id, user_id, comment_text, is_flagged, toxicity_score, moderation_reason) VALUES (?, ?, ?, ?, ?, ?)',
      [
        item_id, 
        user_id, 
        moderationResult.cleaned || comment_text,
        moderationResult.flagged ? 1 : 0,
        moderationResult.toxicityScore || 0,
        moderationResult.reason
      ]
    );
    connection.release();
    
    const newComment = {
      id: result.insertId, 
      item_id, 
      user_id, 
      comment_text: moderationResult.cleaned || comment_text,
      is_flagged: moderationResult.flagged,
      toxicity_score: moderationResult.toxicityScore || 0,
      created_at: new Date(),
      moderation: {
        flagged: moderationResult.flagged,
        reason: moderationResult.reason,
        message: moderationResult.message || (moderationResult.flagged ? '⚠️ Comment contained inappropriate language and was filtered' : '')
      }
    };

    // Broadcast comment creation to all connected clients
    broadcast('comment_created', newComment);
    
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to post comment', message: error.message });
  }
});

// Delete a comment
app.delete('/api/comments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [result] = await connection.query('DELETE FROM comments WHERE id = ?', [id]);
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    res.json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete comment', message: error.message });
  }
});

// ─── Messaging Endpoints ────────────────────────────────────────────────────────

// Get all conversations for a user
app.get('/api/conversations/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const connection = await pool.getConnection();
    
    // Get unique conversations (sender or receiver)
    const [conversations] = await connection.query(`
      SELECT 
        CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END as other_user_id,
        MAX(created_at) as last_message_at,
        SUM(CASE WHEN is_read = FALSE AND receiver_id = ? THEN 1 ELSE 0 END) as unread_count
      FROM messages
      WHERE sender_id = ? OR receiver_id = ?
      GROUP BY CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
      ORDER BY last_message_at DESC
    `, [user_id, user_id, user_id, user_id, user_id]);
    
    // Get user details for each conversation
    const result = await Promise.all(conversations.map(async (conv) => {
      const [user] = await connection.query('SELECT id, name FROM users WHERE id = ?', [conv.other_user_id]);
      return { ...conv, other_user: user[0] };
    }));
    
    connection.release();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch conversations', message: error.message });
  }
});

// Get messages between two users
app.get('/api/messages/:user_id/:other_user_id', async (req, res) => {
  try {
    const { user_id, other_user_id } = req.params;
    const connection = await pool.getConnection();
    
    const [messages] = await connection.query(`
      SELECT m.*, u.name as sender_name, i.title as item_title
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN items i ON m.item_id = i.id
      WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `, [user_id, other_user_id, other_user_id, user_id]);
    
    connection.release();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch messages', message: error.message });
  }
});

// Send a new message
app.post('/api/messages', async (req, res) => {
  try {
    const { sender_id, receiver_id, message_text, item_id } = req.body;
    
    if (!sender_id || !receiver_id || !message_text) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // ─── Content Moderation ───
    const moderationResult = await moderateContent(message_text);

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO messages (sender_id, receiver_id, message_text, item_id, is_flagged, toxicity_score, moderation_reason) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        sender_id, 
        receiver_id, 
        moderationResult.cleaned || message_text,
        item_id || null,
        moderationResult.flagged ? 1 : 0,
        moderationResult.toxicityScore || 0,
        moderationResult.reason
      ]
    );
    connection.release();
    
    const newMessage = {
      id: result.insertId, 
      sender_id, 
      receiver_id, 
      message_text: moderationResult.cleaned || message_text,
      item_id: item_id || null,
      is_flagged: moderationResult.flagged,
      toxicity_score: moderationResult.toxicityScore || 0,
      created_at: new Date(),
      moderation: {
        flagged: moderationResult.flagged,
        reason: moderationResult.reason,
        message: moderationResult.message || (moderationResult.flagged ? '⚠️ Message contained inappropriate language and was filtered' : '')
      }
    };

    // Broadcast message creation to all connected clients
    broadcast('message_created', newMessage);
    
    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message', message: error.message });
  }
});

// Mark message as read
app.put('/api/messages/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'UPDATE messages SET is_read = TRUE WHERE id = ?',
      [id]
    );
    connection.release();

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark message as read', message: error.message });
  }
});

// ─── Claims Endpoints ──────────────────────────────────────────────────────────

// Create a new claim
app.post('/api/claims', async (req, res) => {
  try {
    const { claimer_id, item_id } = req.body;
    
    if (!claimer_id || !item_id) {
      return res.status(400).json({ error: 'Missing required fields: claimer_id, item_id' });
    }

    const connection = await pool.getConnection();
    const [result] = await connection.query(
      'INSERT INTO claims (claimer_id, item_id) VALUES (?, ?)',
      [claimer_id, item_id]
    );
    connection.release();
    
    const newClaim = {
      claim_id: result.insertId,
      claimer_id,
      item_id,
      claim_date: new Date()
    };

    // Broadcast claim creation to all connected clients
    broadcast('claim_created', newClaim);
    
    res.status(201).json(newClaim);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create claim', message: error.message });
  }
});

// Get claims for a specific item
app.get('/api/claims/item/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params;
    const connection = await pool.getConnection();
    const [claims] = await connection.query(
      'SELECT c.*, u.name as claimer_name FROM claims c LEFT JOIN users u ON c.claimer_id = u.id WHERE c.item_id = ?',
      [item_id]
    );
    connection.release();
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch claims', message: error.message });
  }
});

// Get claims by user
app.get('/api/claims/user/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    const connection = await pool.getConnection();
    const [claims] = await connection.query(
      'SELECT c.*, i.title as item_title FROM claims c LEFT JOIN items i ON c.item_id = i.id WHERE c.claimer_id = ?',
      [user_id]
    );
    connection.release();
    res.json(claims);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user claims', message: error.message });
  }
});

// ─── Moderation Endpoints (Admin) ──────────────────────────────────────────────
app.get('/api/moderation/stats', (req, res) => {
  try {
    const { getModerationStats } = require('./utils/moderation');
    res.json(getModerationStats());
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch moderation stats', message: error.message });
  }
});

// Get flagged comments
app.get('/api/moderation/comments/flagged', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [flaggedComments] = await connection.query(`
      SELECT c.id, c.comment_text, c.toxicity_score, c.moderation_reason, 
             c.created_at, u.name as user_name, i.title as item_title
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN items i ON c.item_id = i.id
      WHERE c.is_flagged = TRUE
      ORDER BY c.created_at DESC
      LIMIT 50
    `);
    connection.release();
    res.json(flaggedComments);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch flagged comments', message: error.message });
  }
});

// Get flagged messages
app.get('/api/moderation/messages/flagged', async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [flaggedMessages] = await connection.query(`
      SELECT m.id, m.message_text, m.toxicity_score, m.moderation_reason, 
             m.created_at, u.name as sender_name, r.name as receiver_name
      FROM messages m
      LEFT JOIN users u ON m.sender_id = u.id
      LEFT JOIN users r ON m.receiver_id = r.id
      WHERE m.is_flagged = TRUE
      ORDER BY m.created_at DESC
      LIMIT 50
    `);
    connection.release();
    res.json(flaggedMessages);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch flagged messages', message: error.message });
  }
});

// ─── 404 Handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path });
});

// ─── Error Handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// ─── WebSocket Setup ──────────────────────────────────────────────────────────
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

// Broadcast function to send updates to all connected clients
const broadcast = (event, data) => {
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ event, data }));
    }
  });
};

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('✓ WebSocket client connected');
  clients.add(ws);

  ws.on('close', () => {
    console.log('✓ WebSocket client disconnected');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// ─── Start Server ──────────────────────────────────────────────────────────────
server.listen(PORT, () => {
  console.log(`\n🚀 Lost & Found Backend Server`);
  console.log(`📍 Running on http://localhost:${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔌 WebSocket server running on ws://localhost:${PORT}`);
  console.log(`\nAvailable endpoints:`);
  console.log(`  GET  /api/health      - Server health check`);
  console.log(`  GET  /api/db-test     - Database connection test`);
  console.log(`  GET  /api/users       - Get all users`);
  console.log(`  POST /api/users       - Create a new user`);
  console.log(`  GET  /api/items       - Get all items`);
  console.log(`  POST /api/items       - Create a new item`);
  console.log(`  DELETE /api/items/:id - Delete an item`);
  console.log(`  GET  /api/items/category/:category - Get items by category`);
  console.log(`  GET  /api/items/search/tags/:tag - Search items by tag`);
  console.log(`  POST /api/claims      - Create a new claim`);
  console.log(`  GET  /api/claims/item/:item_id - Get claims for an item`);
  console.log(`  GET  /api/claims/user/:user_id - Get claims by user`);
  console.log(`  GET  /api/comments/:item_id  - Get comments for an item`);
  console.log(`  POST /api/comments    - Post a new comment`);
  console.log(`  DELETE /api/comments/:id - Delete a comment`);
  console.log(`  GET  /api/conversations/:user_id - Get conversations for user`);
  console.log(`  GET  /api/messages/:user_id/:other_user_id - Get messages between users`);
  console.log(`  POST /api/messages    - Send a new message`);
  console.log(`  PUT  /api/messages/:id/read - Mark message as read`);
  console.log(`\n📋 Moderation Endpoints (Admin):`);
  console.log(`  GET  /api/moderation/stats - Get moderation configuration stats`);
  console.log(`  GET  /api/moderation/comments/flagged - Get flagged comments`);
  console.log(`  GET  /api/moderation/messages/flagged - Get flagged messages`);
  console.log(`\n`);
});

module.exports = app;
