const mysql = require('mysql2');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tax_notice_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const promisePool = pool.promise();

async function initializeDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || ''
    }).promise();
    
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'tax_notice_db'}\``);
    await connection.end();

    // Drop old tables if they exist to start fresh according to the new schema
    await promisePool.query('DROP TABLE IF EXISTS feedback');
    await promisePool.query('DROP TABLE IF EXISTS generations');

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS notice_inputs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(255) NOT NULL,
        issue TEXT NOT NULL,
        client_facts TEXT NOT NULL,
        strategy VARCHAR(255) NOT NULL,
        client_name VARCHAR(255) NOT NULL,
        notice_ref VARCHAR(255) NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS generated_letters (
        id INT AUTO_INCREMENT PRIMARY KEY,
        input_id INT NOT NULL,
        full_letter_text LONGTEXT NOT NULL,
        prompt_version VARCHAR(50) DEFAULT 'v4',
        response_time_ms INT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (input_id) REFERENCES notice_inputs(id) ON DELETE CASCADE
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS draft_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        letter_id INT NOT NULL,
        edited_text LONGTEXT NOT NULL,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (letter_id) REFERENCES generated_letters(id) ON DELETE CASCADE
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS quality_ratings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        letter_id INT NOT NULL,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        thumbs_up_down BOOLEAN,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (letter_id) REFERENCES generated_letters(id) ON DELETE CASCADE
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS notice_analytics (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE UNIQUE NOT NULL,
        total_generations INT DEFAULT 0,
        avg_rating FLOAT DEFAULT 0.0,
        top_notice_type VARCHAR(255)
      )
    `);

    await promisePool.query(`
      CREATE TABLE IF NOT EXISTS templates (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        notice_type VARCHAR(255) NOT NULL,
        issue TEXT NOT NULL,
        client_facts TEXT NOT NULL,
        response_strategy VARCHAR(255) NOT NULL
      )
    `);

    const [rows] = await promisePool.query('SELECT COUNT(*) as count FROM templates');
    if (rows[0].count === 0) {
      await promisePool.query(`
        INSERT INTO templates (title, notice_type, issue, client_facts, response_strategy) VALUES
        ('Standard TDS Mismatch', 'TDS Demand', 'Short deduction under section 194C', 'Payment to transporter who provided PAN. No TDS applicable as per 194C(6). Amount: 50,000 INR.', 'contest with explanation'),
        ('GST Turnover Discrepancy', 'GST Audit Notice', 'Mismatch between GSTR-1 and GSTR-3B', 'GSTR-1 includes exempt supplies which were inadvertently missed in GSTR-3B table 3.1. Total turnover matches books.', 'accept with payment'),
        ('High Value Transaction', 'Income Tax Scrutiny', 'Cash deposit of 15L during demonetization', 'Amount deposited from cash sales. Proper books maintained and audited under 44AB.', 'contest with explanation')
      `);
    }

    console.log("Database initialized successfully with the specified schema.");
  } catch (error) {
    console.error("Database initialization error:", error);
  }
}

module.exports = { pool: promisePool, initializeDatabase };
