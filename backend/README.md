# Backend API

This backend provides a lightweight API for the Acacia Dashboard functionality. It exposes the core data needed by the frontend so the UI can render positions, trades, portfolio stats, and exportable position data.

## Running the API

From the backend folder:

```bash
npm install
node server.js
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
node server.js
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
- GET /health
- Returns a simple status object used by the frontend or deployment checks.
- Example response:

```json
{ "status": "ok" }
```

### Authentication
- POST /auth/login
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

### Positions
- GET /positions
- Returns all positions from the `positions` table.
- Use this in the frontend to populate a portfolio or positions list.
- Example response:

```json
[
  {
    "id": 12,
    "ticker": "AAPL",
    "shares_owned": 200,
    "avg_cost_basis": 150,
    "status": "active",
    "opened_at": "2025-12-17",
    "notes": "Long term Apple growth position."
  }
]
```

- POST /positions
- Creates a new position.
- Send a JSON body with `ticker`, `shares_owned`, `avg_cost_basis`, `opened_at`, and optional `notes`.
- Example request:

```json
{
  "ticker": "MSFT",
  "shares_owned": 100,
  "avg_cost_basis": 280,
  "opened_at": "2026-01-16",
  "notes": "Core software holdings."
}
```

### Trades
- GET /trades
- Returns all trades from the `trades` table.
- Use this in the frontend to show trade history, open positions, or recent activity.
- Example response:

```json
[
  {
    "id": 45,
    "position_id": 15,
    "ticker": "NVDA",
    "expiration_date": "2026-07-05",
    "strike_price": 480,
    "contracts": 1,
    "premium_received": 2150,
    "status": "open"
  }
]
```

- POST /trades
- Creates a new trade tied to a position.
- Send a JSON body with `position_id`, `ticker`, `expiration_date`, `strike_price`, `contracts`, `premium_received`, and optional `opened_at`, `notes`, `open_price`.
- Example request:

```json
{
  "position_id": 12,
  "ticker": "AAPL",
  "expiration_date": "2026-06-20",
  "strike_price": 170,
  "contracts": 2,
  "premium_received": 420,
  "opened_at": "2026-05-16",
  "notes": "Active Apple June premium cycle."
}
```

### Portfolio statistics
- GET /stats
- Returns a compact summary useful for dashboard cards.
- Example response:

```json
{
  "totalPremium": 22890,
  "totalPnL": 12740,
  "openPositions": 6,
  "openTrades": 6
}
```

### Exports
- GET /export/positions
- Returns CSV data for the positions table.
- Use this when the frontend needs a downloadable portfolio export.
- Example usage in the browser or frontend:

```js
const response = await fetch('http://127.0.0.1:3001/export/positions');
const csv = await response.text();
```

## Frontend usage guidance

Use the API as follows:

1. Call GET /health to confirm the backend is reachable.
2. Call POST /auth/login to authenticate the user.
3. Call GET /positions and GET /trades to render portfolio and trade views.
4. Call GET /stats for summary cards and KPI widgets.
5. Call GET /export/positions when the user wants to download a CSV export.

## Notes
- The backend currently uses the existing MySQL database `covered_calls`.
- The frontend should call `http://127.0.0.1:3001` during local development.
- For production, replace the base URL with the deployed backend origin.

