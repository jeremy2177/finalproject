require('dotenv').config();
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
    host: process.env.DB_HOST ,
    port: Number(process.env.DB_PORT ),
    user: process.env.DB_USER || process.env.MYSQL_USER ,
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD ,
    database: process.env.DB_NAME ,
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

// ─── Health ───────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await initDB();
    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ─── Auth ─────────────────────────────────────────────────
app.post('/auth/register', async (req, res) => {
  try {
    const { username, password, email } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username.length < 3) {
      return res.status(400).json({ error: 'Username must be at least 3 characters' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    await initDB();
    const [existing] = await pool.execute('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const password_hash = await bcrypt.hash(password, 10);
    const [result] = await pool.execute(
      'INSERT INTO users (username, password_hash, email) VALUES (?, ?, ?)',
      [username, password_hash, email || null]
    );

    res.status(201).json({
      user: { id: result.insertId, username, email: email || null }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
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

// ─── Helper: enrich positions with trade stats ────────────
async function enrichPositions(positions) {
  await initDB();
  return Promise.all(positions.map(async (p) => {
    const [trades] = await pool.query('SELECT * FROM trades WHERE position_id = ? ORDER BY opened_at DESC', [p.id]);
    const openTrades = trades.filter(t => t.status === 'open');
    const closedTrades = trades.filter(t => t.status !== 'open');
    const totalPremium = trades.reduce((sum, t) => sum + parseFloat(t.premium_received || 0), 0);
    const totalPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.profit_loss || 0), 0);
    const premiumPerShare = p.shares_owned > 0 ? totalPremium / p.shares_owned : 0;

    return {
      ...p,
      trade_count: trades.length,
      open_trades: openTrades.length,
      total_premium: totalPremium,
      total_pnl: totalPnL,
      effective_cost_basis: parseFloat(p.avg_cost_basis) - premiumPerShare,
      next_expiry: openTrades.length > 0 ? openTrades[0].expiration_date : null,
      days_to_next_expiry: openTrades.length > 0
        ? dayjs(openTrades[0].expiration_date).diff(dayjs(), 'day')
        : null
    };
  }));
}

// ─── Dashboard ────────────────────────────────────────────
app.get('/dashboard', async (_req, res) => {
  try {
    await initDB();

    // Summary stats
    const [summaryRows] = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(premium_received), 0) FROM trades) AS totalPremium,
        (SELECT COALESCE(SUM(profit_loss), 0) FROM trades WHERE status != 'open') AS totalPnL,
        (SELECT COUNT(*) FROM positions WHERE status = 'active') AS openPositions,
        (SELECT COUNT(*) FROM trades WHERE status = 'open') AS openTrades,
        (SELECT COUNT(*) FROM trades WHERE status != 'open' AND profit_loss >= 0) AS winCount,
        (SELECT COUNT(*) FROM trades WHERE status != 'open') AS totalClosedTrades
    `);
    const s = summaryRows[0];
    const winRate = s.totalClosedTrades > 0 ? (s.winCount / s.totalClosedTrades * 100) : 0;

    // 30-day rolling premium
    const [rolling30] = await pool.query(
      `SELECT COALESCE(SUM(premium_received), 0) AS total FROM trades WHERE opened_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)`
    );

    const summary = {
      totalPremium: parseFloat(s.totalPremium),
      totalPnL: parseFloat(s.totalPnL),
      openPositions: parseInt(s.openPositions),
      openTrades: parseInt(s.openTrades),
      winRate,
      monthlyIncome: parseFloat(rolling30[0].total)
    };

    // Monthly income (12 months)
    const [monthlyRows] = await pool.query(`
      SELECT DATE_FORMAT(opened_at, '%Y-%m') AS month,
             COALESCE(SUM(premium_received), 0) AS totalPremium,
             COALESCE(SUM(CASE WHEN status != 'open' THEN profit_loss ELSE 0 END), 0) AS netPnL
      FROM trades
      WHERE opened_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month ASC
    `);
    const monthlyIncome = monthlyRows.map(r => ({
      month: r.month,
      label: dayjs(r.month + '-01').format('MMM YY'),
      totalPremium: parseFloat(r.totalPremium),
      netPnL: parseFloat(r.netPnL)
    }));

    // Open positions (enriched)
    const [posRows] = await pool.query("SELECT * FROM positions WHERE status = 'active' ORDER BY opened_at DESC");
    const openPositions = await enrichPositions(posRows);

    // Recent activity
    const [recentActivity] = await pool.query('SELECT * FROM trades ORDER BY opened_at DESC LIMIT 5');

    res.json({ summary, monthlyIncome, openPositions, recentActivity });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Positions (enriched) ─────────────────────────────────
app.get('/positions', async (req, res) => {
  try {
    await initDB();
    const { status, sort, ticker } = req.query;

    let sql = 'SELECT * FROM positions WHERE 1=1';
    const params = [];

    if (status && status !== 'all') {
      sql += ' AND status = ?';
      params.push(status);
    }
    if (ticker) {
      sql += ' AND ticker = ?';
      params.push(ticker);
    }

    switch (sort) {
      case 'ticker': sql += ' ORDER BY ticker ASC'; break;
      case 'status': sql += ' ORDER BY status ASC'; break;
      case 'cost': sql += ' ORDER BY avg_cost_basis DESC'; break;
      default: sql += ' ORDER BY opened_at DESC';
    }

    const [rows] = await pool.query(sql, params);
    const enriched = await enrichPositions(rows);
    res.json(enriched);
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

// ─── Position Detail ──────────────────────────────────────
app.get('/positions/:id/detail', async (req, res) => {
  try {
    await initDB();
    const [posRows] = await pool.execute('SELECT * FROM positions WHERE id = ?', [req.params.id]);
    const position = posRows[0];
    if (!position) return res.status(404).json({ error: 'Position not found' });

    const [trades] = await pool.query('SELECT * FROM trades WHERE position_id = ? ORDER BY opened_at DESC', [position.id]);
    const closedTrades = trades.filter(t => t.status !== 'open');
    const totalPremium = trades.reduce((sum, t) => sum + parseFloat(t.premium_received || 0), 0);
    const realizedPnL = closedTrades.reduce((sum, t) => sum + parseFloat(t.profit_loss || 0), 0);
    const premiumPerShare = position.shares_owned > 0 ? totalPremium / position.shares_owned : 0;
    const effectiveCostBasis = parseFloat(position.avg_cost_basis) - premiumPerShare;
    const capitalAtRisk = parseFloat(position.avg_cost_basis) * position.shares_owned;
    const yieldOnCost = capitalAtRisk > 0 ? (totalPremium / capitalAtRisk * 100) : 0;
    const wins = closedTrades.filter(t => parseFloat(t.profit_loss || 0) >= 0).length;
    const winRate = closedTrades.length > 0 ? (wins / closedTrades.length * 100) : 0;

    // Compute annualized return for each trade
    const tradesWithAnnualized = trades.map(t => {
      let annualized_return = 0;
      if (t.status !== 'open' && t.opened_at && t.closed_at) {
        const daysHeld = dayjs(t.closed_at).diff(dayjs(t.opened_at), 'day') || 1;
        const tradeCapital = parseFloat(position.avg_cost_basis) * t.contracts * 100;
        if (tradeCapital > 0) {
          const roc = parseFloat(t.profit_loss || 0) / tradeCapital;
          annualized_return = roc * (365 / daysHeld);
        }
      }
      return { ...t, annualized_return };
    });

    // Monthly chart data
    const grouped = {};
    trades.forEach(t => {
      const month = dayjs(t.opened_at).format('YYYY-MM');
      if (!grouped[month]) grouped[month] = { premium: 0, pnl: 0 };
      grouped[month].premium += parseFloat(t.premium_received || 0);
      if (t.status !== 'open') grouped[month].pnl += parseFloat(t.profit_loss || 0);
    });
    const monthlyData = Object.keys(grouped).sort().map(month => ({
      month,
      label: dayjs(month + '-01').format('MMM YY'),
      premium: grouped[month].premium,
      pnl: grouped[month].pnl
    }));

    res.json({
      position,
      trades: tradesWithAnnualized,
      stats: {
        totalPremium,
        realizedPnL,
        effectiveCostBasis,
        premiumPerShare,
        yieldOnCost,
        tradeCount: trades.length,
        winRate
      },
      monthlyData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Update Position ──────────────────────────────────────
app.put('/positions/:id', async (req, res) => {
  try {
    const { ticker, shares_owned, avg_cost_basis, status, notes } = req.body;
    await initDB();
    const fields = [];
    const params = [];

    if (ticker !== undefined) { fields.push('ticker = ?'); params.push(ticker.toUpperCase()); }
    if (shares_owned !== undefined) { fields.push('shares_owned = ?'); params.push(shares_owned); }
    if (avg_cost_basis !== undefined) { fields.push('avg_cost_basis = ?'); params.push(avg_cost_basis); }
    if (status !== undefined) {
      fields.push('status = ?'); params.push(status);
      if (status !== 'active') {
        fields.push('closed_at = ?'); params.push(dayjs().format('YYYY-MM-DD'));
      }
    }
    if (notes !== undefined) { fields.push('notes = ?'); params.push(notes); }

    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    await pool.execute(`UPDATE positions SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── Delete Position ──────────────────────────────────────
app.delete('/positions/:id', async (req, res) => {
  try {
    await initDB();
    await pool.execute('DELETE FROM trades WHERE position_id = ?', [req.params.id]);
    await pool.execute('DELETE FROM positions WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Trades ───────────────────────────────────────────────
app.get('/trades', async (_req, res) => {
  try {
    await initDB();
    const [rows] = await pool.query('SELECT * FROM trades ORDER BY opened_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/positions/:id/trades', async (req, res) => {
  try {
    await initDB();
    const [posRows] = await pool.execute('SELECT * FROM positions WHERE id = ?', [req.params.id]);
    const position = posRows[0];
    if (!position) return res.status(404).json({ error: 'Position not found' });

    const {
      strike_price, premium_received, contracts, open_price,
      opened_at, expiration_date, underlying_price_at_entry,
      iv_at_entry, delta_at_entry, notes
    } = req.body;

    const calcOpenPrice = open_price || (premium_received / (contracts * 100));
    const dte = expiration_date && opened_at
      ? dayjs(expiration_date).diff(dayjs(opened_at), 'day')
      : null;

    const [result] = await pool.execute(
      `INSERT INTO trades (position_id, ticker, expiration_date, strike_price, contracts,
       premium_received, open_price, status, opened_at, days_to_expiry,
       underlying_price_at_entry, iv_at_entry, delta_at_entry, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        position.id, position.ticker, expiration_date, strike_price, contracts,
        premium_received, calcOpenPrice, 'open',
        opened_at || dayjs().format('YYYY-MM-DD'), dte,
        underlying_price_at_entry || null, iv_at_entry || null,
        delta_at_entry || null, notes || null
      ]
    );
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(400).json({ error: error.message });
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

// ─── Trade Actions ────────────────────────────────────────
app.post('/trades/:id/close', async (req, res) => {
  try {
    await initDB();
    const [rows] = await pool.execute('SELECT * FROM trades WHERE id = ?', [req.params.id]);
    const trade = rows[0];
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.status !== 'open') return res.status(400).json({ error: 'Trade is not open' });

    const closePrice = parseFloat(req.body.close_price || 0);
    const closeCost = closePrice * trade.contracts * 100;
    const profitLoss = parseFloat(trade.premium_received) - closeCost;
    const capitalAtRisk = parseFloat(trade.strike_price) * trade.contracts * 100;
    const roc = capitalAtRisk > 0 ? profitLoss / capitalAtRisk : 0;
    const daysHeld = dayjs().diff(dayjs(trade.opened_at), 'day') || 1;
    const annualizedReturn = roc * (365 / daysHeld);

    await pool.execute(
      `UPDATE trades SET status = 'closed', close_price = ?, profit_loss = ?,
       return_on_capital = ?, annualized_return = ?, closed_at = ? WHERE id = ?`,
      [closePrice, profitLoss, roc, annualizedReturn, dayjs().format('YYYY-MM-DD'), trade.id]
    );
    res.json({ success: true, profitLoss });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/trades/:id/expire', async (req, res) => {
  try {
    await initDB();
    const [rows] = await pool.execute('SELECT * FROM trades WHERE id = ?', [req.params.id]);
    const trade = rows[0];
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.status !== 'open') return res.status(400).json({ error: 'Trade is not open' });

    const profitLoss = parseFloat(trade.premium_received);
    const capitalAtRisk = parseFloat(trade.strike_price) * trade.contracts * 100;
    const roc = capitalAtRisk > 0 ? profitLoss / capitalAtRisk : 0;
    const daysHeld = dayjs().diff(dayjs(trade.opened_at), 'day') || 1;
    const annualizedReturn = roc * (365 / daysHeld);

    await pool.execute(
      `UPDATE trades SET status = 'expired', close_price = 0, profit_loss = ?,
       return_on_capital = ?, annualized_return = ?, closed_at = ? WHERE id = ?`,
      [profitLoss, roc, annualizedReturn, dayjs().format('YYYY-MM-DD'), trade.id]
    );
    res.json({ success: true, profitLoss });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/trades/:id/assign', async (req, res) => {
  try {
    await initDB();
    const [rows] = await pool.execute('SELECT * FROM trades WHERE id = ?', [req.params.id]);
    const trade = rows[0];
    if (!trade) return res.status(404).json({ error: 'Trade not found' });
    if (trade.status !== 'open') return res.status(400).json({ error: 'Trade is not open' });

    const profitLoss = parseFloat(trade.premium_received);
    const capitalAtRisk = parseFloat(trade.strike_price) * trade.contracts * 100;
    const roc = capitalAtRisk > 0 ? profitLoss / capitalAtRisk : 0;
    const daysHeld = dayjs().diff(dayjs(trade.opened_at), 'day') || 1;
    const annualizedReturn = roc * (365 / daysHeld);

    await pool.execute(
      `UPDATE trades SET status = 'assigned', close_price = 0, profit_loss = ?,
       return_on_capital = ?, annualized_return = ?, closed_at = ? WHERE id = ?`,
      [profitLoss, roc, annualizedReturn, dayjs().format('YYYY-MM-DD'), trade.id]
    );

    // Update position status
    await pool.execute(
      `UPDATE positions SET status = 'assigned', closed_at = ? WHERE id = ?`,
      [dayjs().format('YYYY-MM-DD'), trade.position_id]
    );

    res.json({ success: true, profitLoss });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── Trade Assessment ─────────────────────────────────────
app.post('/trades/:id/assess', async (req, res) => {
  try {
    await initDB();
    const { currentUnderlyingPrice, currentOptionPrice } = req.body;
    if (!currentUnderlyingPrice || currentOptionPrice === undefined) {
      return res.status(400).json({ error: 'Missing currentUnderlyingPrice or currentOptionPrice' });
    }

    const [rows] = await pool.execute('SELECT * FROM trades WHERE id = ?', [req.params.id]);
    const trade = rows[0];
    if (!trade) return res.status(404).json({ error: 'Trade not found' });

    const openPricePerShare = parseFloat(trade.open_price || 0);
    const currentPnL = (openPricePerShare - currentOptionPrice) * trade.contracts * 100;
    const pnlPercent = openPricePerShare > 0 ? ((openPricePerShare - currentOptionPrice) / openPricePerShare * 100) : 0;
    const dte = dayjs(trade.expiration_date).diff(dayjs(), 'day');
    const spreadPercent = ((parseFloat(trade.strike_price) - currentUnderlyingPrice) / currentUnderlyingPrice * 100);

    const closeReasons = [];
    const rollReasons = [];
    let actionRequired = false;

    if (pnlPercent >= 50) { closeReasons.push(`${pnlPercent.toFixed(0)}% of max profit captured`); actionRequired = true; }
    if (dte <= 7 && spreadPercent > 2) { closeReasons.push('Near expiry with safe distance from strike'); actionRequired = true; }
    if (spreadPercent < 0) { closeReasons.push('Underlying breached strike — ITM risk'); actionRequired = true; }
    if (dte <= 21 && pnlPercent >= 30) { rollReasons.push('Good profit with time decay accelerating'); }
    if (dte <= 14) { rollReasons.push('Under 14 DTE — consider rolling forward'); }

    let recommendedAction = 'HOLD';
    if (closeReasons.length > 0) recommendedAction = 'CLOSE';
    else if (rollReasons.length > 0) recommendedAction = 'ROLL';

    res.json({
      tradeId: trade.id,
      ticker: trade.ticker,
      strikePrice: parseFloat(trade.strike_price),
      currentUnderlyingPrice,
      currentPnL,
      pnlPercent,
      dte,
      spreadPercent,
      closeReasons,
      rollReasons,
      recommendedAction,
      actionRequired
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ─── Statistics ───────────────────────────────────────────
app.get('/statistics', async (_req, res) => {
  try {
    await initDB();

    // Summary
    const [summaryRows] = await pool.query(`
      SELECT
        (SELECT COALESCE(SUM(premium_received), 0) FROM trades) AS totalPremium,
        (SELECT COALESCE(SUM(profit_loss), 0) FROM trades WHERE status != 'open') AS totalPnL,
        (SELECT COUNT(*) FROM positions WHERE status = 'active') AS openPositions,
        (SELECT COUNT(*) FROM trades WHERE status = 'open') AS openTrades,
        (SELECT COUNT(*) FROM trades WHERE status != 'open' AND profit_loss >= 0) AS winCount,
        (SELECT COUNT(*) FROM trades WHERE status != 'open') AS totalClosedTrades,
        (SELECT COUNT(*) FROM trades WHERE status = 'assigned') AS assignedCount
    `);
    const s = summaryRows[0];
    const winRate = s.totalClosedTrades > 0 ? (s.winCount / s.totalClosedTrades * 100) : 0;
    const assignmentRate = s.totalClosedTrades > 0 ? (s.assignedCount / s.totalClosedTrades * 100) : 0;

    // Average return per trade and days held
    const [avgRows] = await pool.query(`
      SELECT
        AVG(return_on_capital) AS avgROC,
        AVG(annualized_return) AS avgAnnualized,
        AVG(DATEDIFF(closed_at, opened_at)) AS avgDaysHeld
      FROM trades WHERE status != 'open'
    `);
    const avg = avgRows[0];

    const summary = {
      totalPremium: parseFloat(s.totalPremium),
      totalPnL: parseFloat(s.totalPnL),
      openPositions: parseInt(s.openPositions),
      openTrades: parseInt(s.openTrades),
      winRate,
      winCount: parseInt(s.winCount),
      totalClosedTrades: parseInt(s.totalClosedTrades),
      assignmentRate,
      avgReturnPerTrade: (parseFloat(avg.avgROC || 0)) * 100,
      avgAnnualizedReturn: (parseFloat(avg.avgAnnualized || 0)) * 100,
      avgDaysHeld: Math.round(parseFloat(avg.avgDaysHeld || 0))
    };

    // Monthly income
    const [monthlyRows] = await pool.query(`
      SELECT DATE_FORMAT(opened_at, '%Y-%m') AS month,
             COALESCE(SUM(premium_received), 0) AS totalPremium,
             COALESCE(SUM(CASE WHEN status != 'open' THEN profit_loss ELSE 0 END), 0) AS netPnL
      FROM trades
      WHERE opened_at >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
      GROUP BY month ORDER BY month ASC
    `);
    const monthlyIncome = monthlyRows.map(r => ({
      month: r.month,
      label: dayjs(r.month + '-01').format('MMM YY'),
      totalPremium: parseFloat(r.totalPremium),
      netPnL: parseFloat(r.netPnL)
    }));

    // Rolling income windows
    const rollingQuery = async (days) => {
      const [r] = await pool.query(
        `SELECT COALESCE(SUM(premium_received), 0) AS total FROM trades WHERE opened_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)`,
        [days]
      );
      return parseFloat(r[0].total);
    };
    const rolling = {
      r30: await rollingQuery(30),
      r60: await rollingQuery(60),
      r90: await rollingQuery(90)
    };

    // Income by ticker
    const [incomeTickerRows] = await pool.query(`
      SELECT ticker, COUNT(*) AS trade_count,
             SUM(premium_received) AS total_premium,
             SUM(CASE WHEN status != 'open' THEN profit_loss ELSE 0 END) AS net_pnl
      FROM trades GROUP BY ticker ORDER BY total_premium DESC
    `);
    const incomeTicker = incomeTickerRows.map(r => ({
      ticker: r.ticker,
      trade_count: parseInt(r.trade_count),
      total_premium: parseFloat(r.total_premium),
      net_pnl: parseFloat(r.net_pnl)
    }));

    // Annualized return by ticker
    const [annualizedTickerRows] = await pool.query(`
      SELECT ticker, COUNT(*) AS trade_count,
             SUM(CASE WHEN status != 'open' THEN 1 ELSE 0 END) AS closed,
             SUM(CASE WHEN status != 'open' AND profit_loss >= 0 THEN 1 ELSE 0 END) AS wins,
             AVG(CASE WHEN status != 'open' THEN annualized_return ELSE NULL END) AS avg_annualized
      FROM trades GROUP BY ticker ORDER BY avg_annualized DESC
    `);
    const annualizedTicker = annualizedTickerRows.map(r => ({
      ticker: r.ticker,
      trade_count: parseInt(r.trade_count),
      closed: parseInt(r.closed),
      wins: parseInt(r.wins),
      avg_annualized: (parseFloat(r.avg_annualized || 0)) * 100
    }));

    // Performance metrics
    const [closedTradesOrdered] = await pool.query(
      `SELECT * FROM trades WHERE status != 'open' ORDER BY closed_at ASC`
    );

    let bestTrade = null, worstTrade = null;
    let maxWinStreak = 0, maxLossStreak = 0, currentWinStreak = 0, currentLossStreak = 0;
    let tempWin = 0, tempLoss = 0;

    closedTradesOrdered.forEach(t => {
      const pnl = parseFloat(t.profit_loss || 0);
      if (!bestTrade || pnl > parseFloat(bestTrade.profit_loss || 0)) bestTrade = t;
      if (!worstTrade || pnl < parseFloat(worstTrade.profit_loss || 0)) worstTrade = t;

      if (pnl >= 0) {
        tempWin++;
        tempLoss = 0;
        if (tempWin > maxWinStreak) maxWinStreak = tempWin;
      } else {
        tempLoss++;
        tempWin = 0;
        if (tempLoss > maxLossStreak) maxLossStreak = tempLoss;
      }
    });
    currentWinStreak = tempWin;
    currentLossStreak = tempLoss;

    // Average DTE and IV
    const [perfAvg] = await pool.query(`
      SELECT AVG(days_to_expiry) AS avgDTE, AVG(iv_at_entry) AS avgIV
      FROM trades WHERE status != 'open'
    `);

    // Strike analysis (moneyness)
    const [strikeRows] = await pool.query(`
      SELECT
        CASE
          WHEN underlying_price_at_entry IS NULL THEN 'Unknown'
          WHEN strike_price > underlying_price_at_entry * 1.05 THEN 'Deep OTM (>5%)'
          WHEN strike_price > underlying_price_at_entry THEN 'OTM (0-5%)'
          WHEN strike_price = underlying_price_at_entry THEN 'ATM'
          ELSE 'ITM'
        END AS moneyness,
        COUNT(*) AS count,
        AVG(profit_loss) AS avg_pnl,
        AVG(return_on_capital) AS avg_roc
      FROM trades WHERE status != 'open'
      GROUP BY moneyness ORDER BY avg_roc DESC
    `);
    const strikeAnalysis = strikeRows.map(r => ({
      moneyness: r.moneyness,
      count: parseInt(r.count),
      avg_pnl: parseFloat(r.avg_pnl || 0),
      avg_roc: (parseFloat(r.avg_roc || 0)) * 100
    }));

    const performance = {
      bestTrade: bestTrade ? { ticker: bestTrade.ticker, strike_price: parseFloat(bestTrade.strike_price), profit_loss: parseFloat(bestTrade.profit_loss) } : null,
      worstTrade: worstTrade ? { ticker: worstTrade.ticker, strike_price: parseFloat(worstTrade.strike_price), profit_loss: parseFloat(worstTrade.profit_loss) } : null,
      avgDTE: Math.round(parseFloat(perfAvg[0].avgDTE || 0)),
      avgIV: parseFloat(perfAvg[0].avgIV || 0),
      maxWinStreak,
      maxLossStreak,
      currentWinStreak,
      currentLossStreak,
      strikeAnalysis
    };

    // Risk metrics
    const [riskRows] = await pool.query(`
      SELECT p.ticker,
             SUM(p.avg_cost_basis * p.shares_owned) AS exposure
      FROM positions p
      WHERE p.status = 'active'
      GROUP BY p.ticker
      ORDER BY exposure DESC
    `);
    const totalExposure = riskRows.reduce((sum, r) => sum + parseFloat(r.exposure), 0);
    const concentration = riskRows.map(r => ({
      ticker: r.ticker,
      exposure: parseFloat(r.exposure),
      percentage: totalExposure > 0 ? (parseFloat(r.exposure) / totalExposure * 100) : 0
    }));

    // Max drawdown
    let maxDrawdown = 0;
    let peak = 0;
    let cumPnL = 0;
    closedTradesOrdered.forEach(t => {
      cumPnL += parseFloat(t.profit_loss || 0);
      if (cumPnL > peak) peak = cumPnL;
      const dd = peak - cumPnL;
      if (dd > maxDrawdown) maxDrawdown = dd;
    });

    const risk = {
      maxExposure: totalExposure,
      assignmentRate,
      assignedCount: parseInt(s.assignedCount),
      totalClosedTrades: parseInt(s.totalClosedTrades),
      maxDrawdown,
      concentration
    };

    res.json({ summary, monthlyIncome, rolling, incomeTicker, annualizedTicker, performance, risk });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Stats (simple — kept for backward compat) ───────────
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

// ─── Tickers ──────────────────────────────────────────────
app.get('/tickers', async (_req, res) => {
  try {
    await initDB();
    const [rows] = await pool.query('SELECT DISTINCT ticker FROM positions ORDER BY ticker ASC');
    res.json(rows.map(r => r.ticker));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─── CSV Export ───────────────────────────────────────────
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

// ─── Server ───────────────────────────────────────────────
async function startServer(options = {}) {
  const server = app.listen(options.port || PORT, '0.0.0.0', async () => {
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
    console.log(`Backend API running on http://0.0.0.0:${server.address().port}`);
  });
}

module.exports = { app, initDB, startServer };
