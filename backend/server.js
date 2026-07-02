const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dayjs = require('dayjs');

const app = express();
const PORT = process.env.PORT || 3001;

let pool;

async function initDB() {
  if (pool) return pool;

  const connectionConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || 'jeremymysql',
    database: process.env.DB_NAME || 'covered_calls',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  };

  if (process.env.MYSQL_SOCKET) {
    connectionConfig.socketPath = process.env.MYSQL_SOCKET;
    delete connectionConfig.host;
    delete connectionConfig.port;
  }

  pool = mysql.createPool(connectionConfig);

  await pool.query('SELECT 1');
  return pool;
}

app.use(cors());
app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await initDB();
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    await initDB();
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ?', [username]);
    const user = rows[0];
    if (!user) return res.status(401).json({ error: 'invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'invalid credentials' });

    res.json({ user: { id: user.id, username: user.username, email: user.email } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/positions', async (_req, res) => {
  try {
    await initDB();
    const [rows] = await pool.query('SELECT * FROM positions ORDER BY opened_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/positions', async (req, res) => {
  try {
    const { ticker, shares_owned, avg_cost_basis, opened_at, notes } = req.body;
    await initDB();
    const [result] = await pool.execute(
      'INSERT INTO positions (ticker, shares_owned, avg_cost_basis, status, opened_at, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [ticker.toUpperCase(), shares_owned, avg_cost_basis, 'active', opened_at || dayjs().format('YYYY-MM-DD'), notes || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/trades', async (_req, res) => {
  try {
    await initDB();
    const [rows] = await pool.query('SELECT * FROM trades ORDER BY opened_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/trades', async (req, res) => {
  try {
    const { position_id, ticker, expiration_date, strike_price, contracts, premium_received, open_price, opened_at, notes } = req.body;
    await initDB();
    const [result] = await pool.execute(
      'INSERT INTO trades (position_id, ticker, expiration_date, strike_price, contracts, premium_received, open_price, status, opened_at, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [position_id, ticker.toUpperCase(), expiration_date, strike_price, contracts, premium_received, open_price || premium_received / (contracts * 100), 'open', opened_at || dayjs().format('YYYY-MM-DD'), notes || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/stats', async (_req, res) => {
  try {
    await initDB();
    const [summary] = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(premium_received), 0) FROM trades) AS totalPremium,
        (SELECT COALESCE(SUM(profit_loss), 0) FROM trades WHERE status != 'open') AS totalPnL,
        (SELECT COUNT(*) FROM positions WHERE status = 'active') AS openPositions,
        (SELECT COUNT(*) FROM trades WHERE status = 'open') AS openTrades
    `);
    res.json(summary[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/export/positions', async (_req, res) => {
  try {
    await initDB();
    const [rows] = await pool.query('SELECT * FROM positions');
    const csv = ['id,ticker,shares_owned,avg_cost_basis,status,opened_at,closed_at,notes']
      .concat(rows.map(row => [row.id, row.ticker, row.shares_owned, row.avg_cost_basis, row.status, row.opened_at, row.closed_at || '', row.notes || ''].join(',')))
      .join('\n');
    res.type('text/csv').send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

async function startServer(options = {}) {
  const server = app.listen(options.port || PORT, '127.0.0.1', async () => {
    try {
      await initDB();
    } catch (error) {
      console.error('Database initialization failed:', error.message);
    }
  });

  await new Promise((resolve) => server.once('listening', resolve));
  return server;
}

if (require.main === module) {
  startServer().then((server) => {
    console.log(`Backend API running on http://127.0.0.1:${server.address().port}`);
  });
}

module.exports = { app, initDB, startServer };
