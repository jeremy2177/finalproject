# Backend API

This backend provides a lightweight API for the Acacia Dashboard functionality. It exposes all the endpoints needed by the React frontend to render positions, trades, portfolio stats, rolling income graphs, risk metrics, trade actions (close, expire, assign), and exportable position data.

## Running the API

From the backend folder:

```bash
npm install
node api.js
```

The server runs on:

```text
http://127.0.0.1:3001
```

## Configuring it on another machine

To run this backend on a different machine, make sure the following are in place:

1. Node.js is installed.
2. MySQL is installed and running.
3. A database named `covered_calls` exists.
4. The `positions`, `trades`, and `users` tables exist.
5. The MySQL credentials match what the server expects.

### Required environment variables

The backend expects the MySQL connection details to be available in the environment. Set the values for your own machine before starting the server:

```bash
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=covered_calls
```

Example:

```bash
export DB_HOST=127.0.0.1
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=your_mysql_password
export DB_NAME=covered_calls
node api.js
```

### MySQL setup

If MySQL is fresh on the machine, create the database and import the schema:

```bash
mysql -u root -p
```

Then run:

```sql
CREATE DATABASE IF NOT EXISTS covered_calls;
USE covered_calls;
```

Import the schema file from this project:

```bash
mysql -u root -p covered_calls < /path/to/this/project/backend/schema.sql
```

If the database already contains data, you can skip the import step and just start the server.

### Frontend base URL

In local development, the frontend should point to:

```text
http://127.0.0.1:3001
```

If the backend is hosted elsewhere, replace that URL with the correct host and port.

## API endpoints

### Health
- `GET /health`
- Returns a simple status object used by the frontend or deployment checks.
- Example response:
  ```json
  { "status": "ok" }
  ```

### Authentication
- `POST /auth/login`
- Accepts a JSON body with `username` and `password`.
- Returns the authenticated user object when the credentials match a record in the database.
- Example request:
  ```json
  { "username": "trader", "password": "password123" }
  ```
- Example response:
  ```json
  { "user": { "id": 1, "username": "trader", "email": "trader@example.com" } }
  ```

### Dashboard View
- `GET /dashboard`
- Returns a summary of portfolio data, 12-month income history, open call positions, and recent trades activity.
- Example response:
  ```json
  {
    "summary": {
      "totalPremium": 1250.00,
      "totalPnL": 500.00,
      "openPositions": 3,
      "openTrades": 2,
      "winRate": 75.00,
      "monthlyIncome": 350.00
    },
    "monthlyIncome": [
      { "month": "2026-06", "label": "Jun 26", "totalPremium": 600, "netPnL": 200 }
    ],
    "openPositions": [
      {
        "id": 1,
        "ticker": "AAPL",
        "shares_owned": 100,
        "avg_cost_basis": 150.00,
        "status": "active",
        "trade_count": 2,
        "open_trades": 1,
        "total_premium": 350.00,
        "total_pnl": 150.00,
        "effective_cost_basis": 146.50
      }
    ],
    "recentActivity": [
      { "id": 5, "ticker": "AAPL", "strike_price": 160.00, "expiration_date": "2026-07-20", "status": "open" }
    ]
  }
  ```

### Positions
- `GET /positions`
- Returns all positions from the `positions` table with enriched trade data.
- Query parameters:
  - `status`: Filter by status (`all`, `active`, `closed`, `assigned`)
  - `ticker`: Filter by ticker symbol
  - `sort`: Sort order (`opened`, `ticker`, `status`, `cost`)
- Example response:
  ```json
  [
    {
      "id": 1,
      "ticker": "AAPL",
      "shares_owned": 100,
      "avg_cost_basis": 150.00,
      "status": "active",
      "trade_count": 2,
      "open_trades": 1,
      "total_premium": 300,
      "total_pnl": 100,
      "effective_cost_basis": 147.00,
      "next_expiry": "2026-07-20",
      "days_to_next_expiry": 11
    }
  ]
  ```

- `POST /positions`
- Creates a new underlying stock or ETF position.
- Send a JSON body with `ticker`, `shares_owned`, `avg_cost_basis`, `opened_at`, and optional `notes`.
- Example request:
  ```json
  {
    "ticker": "MSFT",
    "shares_owned": 100,
    "avg_cost_basis": 280.00,
    "opened_at": "2026-01-16",
    "notes": "Core software holdings."
  }
  ```

- `GET /positions/:id/detail`
- Returns comprehensive metrics, trade logs (with annualized returns computed), and historical data for a specific position.
- Example response contains `{ position, trades, stats: { totalPremium, realizedPnL, effectiveCostBasis, ... }, monthlyData }`

- `PUT /positions/:id`
- Updates position fields (ticker, shares_owned, avg_cost_basis, status, notes). If position status changes from active, updates its `closed_at` timestamp.

- `DELETE /positions/:id`
- Deletes a position along with all associated trade logs.

### Trades
- `GET /trades`
- Returns all trade entries.

- `POST /positions/:id/trades`
- Logs a new covered call trade sold against a specific underlying position. Automatically computes premium per share and DTE.
- Send a JSON body with `strike_price`, `premium_received`, `contracts`, `open_price` (optional), `opened_at`, `expiration_date`, `underlying_price_at_entry` (optional), `iv_at_entry` (optional), `delta_at_entry` (optional), and `notes` (optional).

### Trade Actions
- `POST /trades/:id/close`
  - Closes an active trade with a buyback price. Accepts a JSON body with `close_price`.
- `POST /trades/:id/expire`
  - Marks an active trade as expired (strike out-of-the-money, keeping 100% of premium).
- `POST /trades/:id/assign`
  - Marks an active trade as assigned, which also automatically updates the parent position status to `assigned`.

### Trade Assessment
- `POST /trades/:id/assess`
- Runs real-time evaluation logic to determine whether an active call option should be held, closed, or rolled.
- Accepts JSON body with `currentUnderlyingPrice` and `currentOptionPrice`.
- Returns details including `recommendedAction` (`HOLD`, `CLOSE`, `ROLL`), `currentPnL`, `dte`, `spreadPercent`, and any triggered signal messages.

### Statistics Deep Dive
- `GET /statistics`
- Computes comprehensive analytics for the entire portfolio:
  - **Summary**: win rates, average days held, annualized yield, assignment rate.
  - **Monthly Income**: 12-month timeline array.
  - **Rolling Income**: 30, 60, and 90-day window sums.
  - **Income / Annualized by Ticker**: Rankings of underlying performance.
  - **Performance**: Streaks (consecutive wins/losses) and Moneyness strike distribution.
  - **Risk**: Max exposure capital, drawdown period assessment, and concentration index (doughnut chart weights).

### Tickers List
- `GET /tickers`
- Returns a list of unique ticker symbols currently present in positions.

### Exports
- `GET /export/positions`
- Returns CSV data for the positions table.

## Frontend usage guidance

Use the API as follows:

1. Call `GET /health` to confirm the database is reachable.
2. Call `POST /auth/login` to authenticate the user and save the user context.
3. Call `GET /dashboard` to populate the home dashboard view.
4. Call `GET /positions` (with optional filters) and `GET /positions/:id/detail` to render the positions area.
5. Call trade lifecycle endpoints (`/close`, `/expire`, `/assign`) to modify trading states.
6. Call `GET /statistics` to update the advanced metrics tab sheet.
7. Call `GET /export/positions` to download the CSV report.

## Notes
- The backend currently uses the existing MySQL database `covered_calls`.
- The frontend should call `http://127.0.0.1:3001` (or local proxy) during local development.
