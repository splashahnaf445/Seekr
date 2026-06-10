const mysql = require('mysql2/promise');
const bcryptjs = require('bcryptjs');
require('dotenv').config();

const host = process.env.DB_HOST || 'localhost';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const port = process.env.DB_PORT || 3306;

// Sample data constants
const sampleUsers = [
  { name: 'Tarique Ahmed', email: 'tarique.ahmed@uni.edu', password: 'pass123' },
  { name: 'Sarah Smith', email: 'sarah.smith@uni.edu', password: 'pass123' },
  { name: 'James Wilson', email: 'james.wilson@uni.edu', password: 'pass123' },
  { name: 'Emma Johnson', email: 'emma.johnson@uni.edu', password: 'pass123' },
  { name: 'Karim Hassan', email: 'karim.hassan@uni.edu', password: 'pass123' },
  { name: 'Michael Brown', email: 'michael.brown@uni.edu', password: 'pass123' },
  { name: 'Rakibul Islam', email: 'rakibul.islam@uni.edu', password: 'pass123' },
  { name: 'Jennifer Davis', email: 'jennifer.davis@uni.edu', password: 'pass123' },
  { name: 'David Thompson', email: 'david.thompson@uni.edu', password: 'pass123' },
  { name: 'Nadia Khan', email: 'nadia.khan@uni.edu', password: 'pass123' },
  { name: 'Christopher Lee', email: 'christopher.lee@uni.edu', password: 'pass123' },
  { name: 'Jessica White', email: 'jessica.white@uni.edu', password: 'pass123' },
];

// Lost and Found items with variations
const sampleItems = [
  // Lost Items
  {
    title: 'Black Sony Headphones',
    description: 'Lost black Sony WH-1000XM4 headphones near the library. Very important for music production class.',
    location: 'Central Library',
    status: 'lost',
    category: 'electronics',
    tags: ['headphones', 'sony', 'bluetooth', 'expensive'],
    image_emoji: '🎧',
    posted_by_idx: 0,
  },
  {
    title: 'Red Wallet with ID Card',
    description: 'Lost red leather wallet containing student ID, driving license, and some cash. Very important documents inside.',
    location: 'Cafeteria',
    status: 'lost',
    category: 'accessories',
    tags: ['wallet', 'id', 'cash', 'urgent'],
    image_emoji: '💼',
    posted_by_idx: 1,
  },
  {
    title: 'Blue Backpack - CS Assignment Inside',
    description: 'Lost blue North Face backpack with laptop and important CS assignment due today. Contains blue notebook and charger.',
    location: 'Computer Lab Building',
    status: 'lost',
    category: 'accessories',
    tags: ['backpack', 'laptop', 'important', 'urgent'],
    image_emoji: '🎒',
    posted_by_idx: 2,
  },
  {
    title: 'Gold Wedding Ring',
    description: 'Lost gold wedding ring near the auditorium during the cultural fest. Has sentimental value. Urgent!',
    location: 'Main Auditorium',
    status: 'lost',
    category: 'accessories',
    tags: ['ring', 'gold', 'sentimental', 'urgent'],
    image_emoji: '💍',
    posted_by_idx: 3,
  },
  {
    title: 'Physics Textbook - Advanced Mechanics',
    description: 'Lost Advanced Mechanics physics textbook. Edition 5. Rented from library, please return if found.',
    location: 'Mathematics Building',
    status: 'lost',
    category: 'books',
    tags: ['textbook', 'physics', 'library'],
    image_emoji: '📚',
    posted_by_idx: 4,
  },
  {
    title: 'White iPhone 14',
    description: 'Lost white iPhone 14 with blue case in the gym. Has important project photos inside.',
    location: 'Sports Complex - Gym',
    status: 'lost',
    category: 'electronics',
    tags: ['iphone', 'phone', 'white', 'important'],
    image_emoji: '📱',
    posted_by_idx: 5,
  },
  {
    title: 'Car Keys - Silver Keychain',
    description: 'Lost car keys with silver keychain in the parking lot near Building A.',
    location: 'Parking Lot A',
    status: 'lost',
    category: 'keys',
    tags: ['car', 'keys', 'parking'],
    image_emoji: '🔑',
    posted_by_idx: 6,
  },
  {
    title: 'Black Designer Glasses',
    description: 'Lost expensive black designer glasses with Gucci label near the café. Please help!',
    location: 'University Café',
    status: 'lost',
    category: 'accessories',
    tags: ['glasses', 'designer', 'gucci', 'expensive'],
    image_emoji: '👓',
    posted_by_idx: 7,
  },
  {
    title: 'Class Notes - Mathematics 101',
    description: 'Lost notebook with all class notes for Mathematics 101. Has formulas, important concepts, and exam tips.',
    location: 'Lecture Hall 3',
    status: 'lost',
    category: 'documents',
    tags: ['notes', 'mathematics', 'exam'],
    image_emoji: '📖',
    posted_by_idx: 8,
  },
  {
    title: 'Purple Student ID Card',
    description: 'Lost student ID card. Needed for hostel entry and library access.',
    location: 'Hostel Gate',
    status: 'lost',
    category: 'documents',
    tags: ['id', 'student', 'important'],
    image_emoji: '🆔',
    posted_by_idx: 9,
  },
  // Found Items
  {
    title: 'Black Umbrella',
    description: 'Found black umbrella near the main gate. Seems new, probably lost yesterday. Available for pickup.',
    location: 'Main Gate',
    status: 'found',
    category: 'accessories',
    tags: ['umbrella', 'weather', 'lost-and-found'],
    image_emoji: '☂️',
    posted_by_idx: 10,
  },
  {
    title: 'Silver Laptop Dell XPS',
    description: 'Found silver Dell XPS laptop in the study lounge. Battery was dead. Now charging. Contact me ASAP!',
    location: 'Study Lounge',
    status: 'found',
    category: 'electronics',
    tags: ['laptop', 'dell', 'xps', 'valuable'],
    image_emoji: '💻',
    posted_by_idx: 1,
  },
  {
    title: 'Pink Airpods Pro',
    description: 'Found pink Apple AirPods Pro in the swimming pool changing room. They still work! I have them in a case.',
    location: 'Sports Complex - Pool',
    status: 'found',
    category: 'electronics',
    tags: ['airpods', 'apple', 'pink', 'waterproof'],
    image_emoji: '🎧',
    posted_by_idx: 4,
  },
  {
    title: 'Blue Formal Jacket',
    description: 'Found blue formal jacket in the auditorium after the ceremony. No name tag. In perfect condition.',
    location: 'Main Auditorium',
    status: 'found',
    category: 'clothing',
    tags: ['jacket', 'formal', 'blue'],
    image_emoji: '🧥',
    posted_by_idx: 11,
  },
  {
    title: 'Oxford Dictionary',
    description: 'Found Oxford English Dictionary in the library reading section. Looks like it was left by someone.',
    location: 'Central Library',
    status: 'found',
    category: 'books',
    tags: ['dictionary', 'book', 'oxford'],
    image_emoji: '📖',
    posted_by_idx: 6,
  },
  // Claimed Items (will be marked as claimed)
  {
    title: 'Red Cycling Helmet',
    description: 'Found red cycling helmet near the sports facility. Mint condition.',
    location: 'Sports Complex - Bike Parking',
    status: 'claimed',
    category: 'accessories',
    tags: ['helmet', 'cycling', 'sports'],
    image_emoji: '🚴',
    posted_by_idx: 2,
  },
  {
    title: 'Brown Leather Jacket',
    description: 'Found brown leather jacket in the common room. Please describe it to claim.',
    location: 'Common Room - Block B',
    status: 'claimed',
    category: 'clothing',
    tags: ['jacket', 'leather', 'brown'],
    image_emoji: '🧥',
    posted_by_idx: 5,
  },
];

const sampleComments = [
  {
    item_idx: 0, // Black Headphones
    user_idx: 1,
    text: 'I saw something like this in the lost and found box near the main office!',
  },
  {
    item_idx: 0,
    user_idx: 2,
    text: 'What was the last location you used them? I might have seen them.',
  },
  {
    item_idx: 1, // Red Wallet
    user_idx: 3,
    text: 'I found a red wallet yesterday! Let me check if it matches your description.',
  },
  {
    item_idx: 1,
    user_idx: 4,
    text: 'Try checking with the security office at the cafeteria entrance.',
  },
  {
    item_idx: 2, // Blue Backpack
    user_idx: 5,
    text: 'This sounds like the one I saw near the computer lab yesterday afternoon!',
  },
  {
    item_idx: 2,
    user_idx: 6,
    text: 'Did you check the IT support office? They sometimes collect items from labs.',
  },
  {
    item_idx: 3, // Gold Ring
    user_idx: 7,
    text: 'That ring sounds very valuable. Have you reported it to the main office?',
  },
  {
    item_idx: 3,
    user_idx: 8,
    text: 'I hope it turns up! This is really unfortunate. Good luck!',
  },
  {
    item_idx: 4, // Physics Textbook
    user_idx: 2,
    text: 'Check with the library circulation desk - they have a dedicated lost items section.',
  },
  {
    item_idx: 5, // iPhone 14
    user_idx: 9,
    text: 'Did you try using Find My iPhone on iCloud? That might help you locate it!',
  },
  {
    item_idx: 5,
    user_idx: 10,
    text: 'I saw someone with a white iPhone case yesterday near the gym entrance.',
  },
  {
    item_idx: 10, // Black Umbrella
    user_idx: 3,
    text: 'Is it still available? I lost mine last week and this might be it!',
  },
  {
    item_idx: 11, // Silver Laptop
    user_idx: 2,
    text: 'Wow, great find! I hope the owner comes forward soon.',
  },
  {
    item_idx: 11,
    user_idx: 8,
    text: 'Please keep it safe! It could have very important data.',
  },
  {
    item_idx: 12, // Pink Airpods
    user_idx: 4,
    text: 'That\'s lucky they still work after being in the pool!',
  },
];

const sampleMessages = [
  {
    sender_idx: 0,
    receiver_idx: 1,
    item_idx: 0,
    text: 'Hi! Did you really find my headphones? I am desperate to get them back. Can we meet today?',
  },
  {
    sender_idx: 1,
    receiver_idx: 0,
    item_idx: 0,
    text: 'Yes! I found them at the library. Can you describe them more to confirm?',
  },
  {
    sender_idx: 3,
    receiver_idx: 2,
    item_idx: 1,
    text: 'I saw your post about the red wallet. I might have found it near the cafeteria!',
  },
  {
    sender_idx: 2,
    receiver_idx: 3,
    item_idx: 1,
    text: 'Really?? That would be amazing! Can we meet at the cafeteria tomorrow?',
  },
  {
    sender_idx: 5,
    receiver_idx: 4,
    item_idx: 3,
    text: 'Hi, I saw your post about the gold ring. I found a ring near the auditorium. Can you confirm details?',
  },
  {
    sender_idx: 4,
    receiver_idx: 5,
    item_idx: 3,
    text: 'Oh my god! Yes please! It has intricate engravings inside. Can we meet at the main gate?',
  },
  {
    sender_idx: 6,
    receiver_idx: 7,
    item_idx: 5,
    text: 'I found your iPhone post. I saw a white iPhone with blue case at the gym! Want to check?',
  },
  {
    sender_idx: 7,
    receiver_idx: 6,
    item_idx: 5,
    text: 'Yes! Please! When can we meet? I really need my phone back.',
  },
  {
    sender_idx: 8,
    receiver_idx: 9,
    item_idx: 11,
    text: 'Hi! This laptop is very valuable. Please let the owner know ASAP.',
  },
  {
    sender_idx: 9,
    receiver_idx: 8,
    item_idx: 11,
    text: 'I will post it immediately on the bulletin board. Thanks for finding it!',
  },
  {
    sender_idx: 10,
    receiver_idx: 11,
    item_idx: 12,
    text: 'Hi! I found AirPods at the pool. Are they yours? They still work!',
  },
  {
    sender_idx: 11,
    receiver_idx: 10,
    item_idx: 12,
    text: 'OMG YES! Thank you so much! I was looking for them everywhere!',
  },
];

async function seedDatabase() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host,
      user,
      password,
      database: 'lost_and_found',
      port,
    });

    console.log('🌱 Starting to seed database with sample data...\n');

    // Hash passwords
    const hashedUsers = await Promise.all(
      sampleUsers.map(async (u) => ({
        ...u,
        password: await bcryptjs.hash(u.password, 10),
      }))
    );

    // Insert users
    console.log('👥 Adding sample users...');
    let userIds = [];
    for (const u of hashedUsers) {
      const result = await connection.query(
        'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
        [u.name, u.email, u.password, false]
      );
      userIds.push(result[0].insertId);
    }
    console.log(`   ✓ Added ${userIds.length} users\n`);

    // Insert items
    console.log('📦 Adding sample items...');
    let itemIds = [];
    for (const item of sampleItems) {
      const userId = userIds[item.posted_by_idx];
      const result = await connection.query(
        `INSERT INTO items (title, description, location, status, category, tags, posted_by, image_emoji)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.title,
          item.description,
          item.location,
          item.status,
          item.category,
          JSON.stringify(item.tags),
          userId,
          item.image_emoji,
        ]
      );
      itemIds.push(result[0].insertId);
    }
    console.log(`   ✓ Added ${itemIds.length} items (various categories and statuses)\n`);

    // Insert comments
    console.log('💬 Adding sample comments...');
    const comments = [
      'I saw something like this near the library!',
      'Try checking with the security office.',
      'Hope it turns up soon!',
      'This is really helpful - thanks for posting!',
      'I might have seen it in the common area.',
      'Did you check the lost and found box?',
      'You should report this to administration.',
      'Great find! Hope the owner comes forward.',
      'Thanks for sharing - I\'ll keep an eye out!',
      'This is very valuable - please be careful!',
      'I have some information that might help.',
      'Can I get more details about this item?',
      'This matches something I lost last semester!',
      'That\'s a long shot but worth trying.',
      'Please update if you find anything!',
    ];

    for (const comment of sampleComments) {
      const itemId = itemIds[comment.item_idx];
      const userId = userIds[comment.user_idx];
      await connection.query(
        'INSERT INTO comments (item_id, user_id, comment_text, is_flagged, toxicity_score) VALUES (?, ?, ?, ?, ?)',
        [itemId, userId, comment.text, false, 0.0]
      );
    }
    console.log(`   ✓ Added ${sampleComments.length} comments on items\n`);

    // Insert messages
    console.log('💭 Adding sample direct messages...');
    for (const msg of sampleMessages) {
      const senderId = userIds[msg.sender_idx];
      const receiverId = userIds[msg.receiver_idx];
      const itemId = msg.item_idx ? itemIds[msg.item_idx] : null;
      await connection.query(
        `INSERT INTO messages (sender_id, receiver_id, item_id, message_text, is_read, is_flagged, toxicity_score)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [senderId, receiverId, itemId, msg.text, Math.random() > 0.5, false, 0.0]
      );
    }
    console.log(`   ✓ Added ${sampleMessages.length} messages between users\n`);

    // Insert claims for "claimed" items
    console.log('✅ Adding claims for claimed items...');
    let claimsCount = 0;
    for (let i = 0; i < itemIds.length; i++) {
      if (sampleItems[i].status === 'claimed') {
        // Add a claim from a random user (different from poster)
        const posterId = sampleItems[i].posted_by_idx;
        let randomClaimerId = Math.floor(Math.random() * userIds.length);
        while (randomClaimerId === posterId) {
          randomClaimerId = Math.floor(Math.random() * userIds.length);
        }
        const claimerId = userIds[randomClaimerId];
        const itemId = itemIds[i];
        
        try {
          await connection.query(
            'INSERT INTO claims (claimer_id, item_id) VALUES (?, ?)',
            [claimerId, itemId]
          );
          claimsCount++;
        } catch (err) {
          // Skip if duplicate claim
        }
      }
    }
    console.log(`   ✓ Added ${claimsCount} claims\n`);

    // Print summary statistics
    console.log('📊 SEED DATA SUMMARY:');
    console.log(`   ✓ Users: ${userIds.length} (+ admin)`);
    console.log(`   ✓ Items: ${itemIds.length}`);
    console.log(`      - Lost: ${sampleItems.filter(i => i.status === 'lost').length}`);
    console.log(`      - Found: ${sampleItems.filter(i => i.status === 'found').length}`);
    console.log(`      - Claimed: ${sampleItems.filter(i => i.status === 'claimed').length}`);
    console.log(`   ✓ Comments: ${sampleComments.length}`);
    console.log(`   ✓ Messages: ${sampleMessages.length}`);
    console.log(`   ✓ Claims: ${claimsCount}\n`);

    console.log('✅ Database seeding completed successfully!\n');
    console.log('🔐 Sample Login Credentials:');
    console.log('   Admin: admin@uni.edu / password123');
    console.log('   Sample Users: Any email from the list with password "pass123"\n');

    connection.end();
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();
