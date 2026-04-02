const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const path = require('path');

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'ticket_db';
const DB_PORT = process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306;
const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let pool;

async function ensureDatabaseExists() {
  const connection = await mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    port: DB_PORT,
    multipleStatements: true,
  });

  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`;`);
  await connection.end();
}

async function initializeDatabase() {
  await ensureDatabaseExists();

  pool = mysql.createPool({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    port: DB_PORT,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tickets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_name VARCHAR(255) NOT NULL,
      event VARCHAR(255) NOT NULL,
      seat_no VARCHAR(50) NOT NULL
    );
  `);

  const [rows] = await pool.query('SELECT COUNT(*) AS count FROM tickets');
  const count = rows[0].count || 0;

  if (count === 0) {
    const sampleTickets = [
      ['Alyssa Chen', 'Cinema Premiere', 'B12'],
      ['Marcus Lee', 'Rock Concert', 'A05'],
      ['Nina Patel', 'Broadway Night', 'C08'],
      ['Jordan Kim', 'Sports Finale', 'D14'],
      ['Sophia Reed', 'VIP Movie Night', 'B03'],
    ];

    await pool.query(
      'INSERT INTO tickets (user_name, event, seat_no) VALUES ?;', 
      [sampleTickets]
    );
    console.log('Inserted 5 sample ticket bookings into tickets table.');
  }
}

app.get('/tickets', async (req, res) => {
  try {
    const [tickets] = await pool.query('SELECT user_name, event, seat_no FROM tickets');
    res.json(tickets);
  } catch (error) {
    console.error('Failed to query /tickets:', error);
    res.status(500).json({ error: 'Unable to load tickets' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Ticket Booking app listening on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database initialization failed:', error);
    process.exit(1);
  });
