const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const host = process.env.DB_HOST || 'localhost';
const user = process.env.DB_USER || 'root';
const password = process.env.DB_PASSWORD || '';
const port = process.env.DB_PORT || 3306;

async function initializeDatabase() {
  let connection;
  try {
    // First connection without database to create database
    connection = await mysql.createConnection({
      host,
      user,
      password,
      port,
      multipleStatements: true
    });

    console.log('🔧 Initializing database...');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'db', 'db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Drop existing database and run all SQL
    await connection.query('DROP DATABASE IF EXISTS lost_and_found');
    await connection.query(sql);

    console.log('✅ Database initialized successfully!');
    console.log('📊 Admin user created: admin@uni.edu / password123');

    connection.end();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
