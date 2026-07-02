

function Dashboard() {
  return (
  <>
    <div className="dashboard">
      <h1> Covered Calls Dashboard</h1>
      <p>Your real-time options writing and oremium harvest over view harvest overview</p>
    </div>
     {/* Summary Bar  */}
  <div class="grid-2x2-mobile">
    {/* Stat Card: Total P&L  */}
    <div class="stat-card <%= summary.totalPnL >= 0 ? 'stat-card--positive' : 'stat-card--negative' %>">
      <span class="stat-label">Total Realized P&L</span>
      <span class="stat-value number <%= summary.totalPnL >= 0 ? 'text-success' : 'text-danger' %>">
        {/* <%= summary.totalPnL >= 0 ? '+' : '' %><%= summary.totalPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) %> */}
      </span>
    </div>

    {/* Stat Card: Win Rate */}
    <div class="stat-card stat-card--accent">
      <span class="stat-label">Win Rate</span>
      <span class="stat-value number text-success">
        {/* <%= summary.winRate.toFixed(2) %>% */}
      </span>
    </div>

    {/* Stat Card: Active Positions */}
    <div class="stat-card stat-card--warning">
      <span class="stat-label">Open Positions</span>
      <span class="stat-value number">
        {/* <%= summary.openPositions %> <span style="font-size: var(--text-sm); font-weight: 500; color: var(--color-text-secondary);">(<%= summary.openTrades %> calls sold)</span> */}
      </span>
    </div>

    {/* Stat Card: 30D Rolling Premium */}
    <div class="stat-card stat-card--positive">
      <span class="stat-label">30-Day Premium</span>
      <span class="stat-value number text-success">
        {/* <%= summary.monthlyIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' }) %> */}
      </span>
    </div>
  </div>

  {/* <!-- Layout split: Charts & Positions --> */}
  <div class="grid-1-col grid-2-col-desktop">
    {/* <!-- Monthly Income Chart --> */}
    <div class="chart-container">
      <div class="chart-header">
        <h3 class="chart-title">Income History (12 Months)</h3>
      </div>
      <canvas id="monthly-income-canvas"></canvas>
    </div>
    </div>

    {/* <!-- Open Positions --> */}
    <div class="card flex flex-col gap-4">
      <div class="card-header">
        <h3 class="card-title">Open Call Positions</h3>
        <a href="/positions" class="btn btn--secondary btn--sm">View All</a>
      </div>

    </>
  );
}

export default Dashboard;