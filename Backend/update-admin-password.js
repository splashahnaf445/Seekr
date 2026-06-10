const pool = require('./db/connection');

async function updateAdminPassword() {
  try {
    const connection = await pool.getConnection();
    
    // Update admin user password with bcrypt hash
    const bcryptHash = '$2a$10$eV6MzOMiLUqhPzeuQl6Y7.RmUGZ6ytuDSXb/4YfasuSKY3Bu5j6Cq';
    
    await connection.query(
      'UPDATE users SET password = ? WHERE email = ?',
      [bcryptHash, 'admin@uni.edu']
    );
    
    console.log('✅ Admin password updated to bcrypt hash');
    console.log('📧 Email: admin@uni.edu');
    console.log('🔑 Password: password123');
    
    connection.release();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to update password:', error.message);
    process.exit(1);
  }
}

updateAdminPassword();
