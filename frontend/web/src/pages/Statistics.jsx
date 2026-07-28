import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const CHART_COLORS = {
  accent: '#4f8ef7',
  success: '#22c55e',
  danger: '#ef4444',
  warning: '#f59e0b',
  border: '#2e3347',
  text: '#8892aa',
  grid: 'rgba(46, 51, 71, 0.4)',
  tooltipBg: '#1a1d27',
};

function Statistics() {
  const [activeTab, setActiveTab] = useState('tab-overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await api.getStatistics();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load statistics data');
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <main className="main-content">
        <div className="error-banner">{error}</div>
      </main>
    );
  }

  const { summary, monthlyIncome, rolling, incomeTicker, annualizedTicker, performance, risk } = data;

  // Monthly income chart setup
  const barChartData = {
    labels: monthlyIncome.map(d => d.label),
    datasets: [
      {
        label: 'Premium Collected',
        data: monthlyIncome.map(d => d.totalPremium),
        backgroundColor: 'rgba(79, 142, 247, 0.7)',
        borderColor: CHART_COLORS.accent,
        borderWidth: 1,
        borderRadius: 4,
      },
      {
        label: 'Net P&L (Realized)',
        data: monthlyIncome.map(d => d.netPnL),
        backgroundColor: monthlyIncome.map(d => d.netPnL >= 0 ? 'rgba(34, 197, 94, 0.7)' : 'rgba(239, 68, 68, 0.7)'),
        borderColor: monthlyIncome.map(d => d.netPnL >= 0 ? CHART_COLORS.success : CHART_COLORS.danger),
        borderWidth: 1,
        borderRadius: 4,
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
        labels: {
          color: CHART_COLORS.text,
          font: { family: 'Inter', size: 12 }
        }
      },
      tooltip: {
        backgroundColor: CHART_COLORS.tooltipBg,
        borderColor: CHART_COLORS.border,
        borderWidth: 1,
        titleColor: '#ffffff',
        bodyColor: CHART_COLORS.text,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: CHART_COLORS.text }
      },
      y: {
        grid: { color: CHART_COLORS.grid },
        ticks: {
          color: CHART_COLORS.text,
          callback: function(value) {
            return '$' + value;
          }
        }
      }
    }
  };

  // Concentration Doughnut chart setup
  const doughnutChartData = {
    labels: risk.concentration.map(d => d.ticker),
    datasets: [{
      data: risk.concentration.map(d => d.exposure),
      backgroundColor: [
        '#4f8ef7',
        '#22c55e',
        '#f59e0b',
        '#ec4899',
        '#8b5cf6',
        '#3b82f6',
        '#10b981'
      ],
      borderWidth: 1,
      borderColor: CHART_COLORS.border
    }]
  };

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: CHART_COLORS.text,
          font: { family: 'Inter' }
        }
      },
      tooltip: {
        backgroundColor: CHART_COLORS.tooltipBg,
        borderColor: CHART_COLORS.border,
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            const val = context.parsed;
            const exposuresSum = risk.concentration.reduce((a, b) => a + b.exposure, 0);
            const percentage = exposuresSum > 0 ? (val / exposuresSum * 100).toFixed(1) : 0;
            return ` ${context.label}: $${val.toLocaleString()} (${percentage}%)`;
          }
        }
      }
    }
  };

  return (
    <main className="main-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-row">
          <h1>Advanced Statistics</h1>
          <span className="number text-muted">Deep Analytics Engine</span>
        </div>
        <p className="page-subtitle">Track, filter, and dissect your historical covered call trading metrics.</p>
      </div>

      {/* Tab Selector Navigation */}
      <div className="card flex tab-bar" style={{ padding: 'var(--space-2)', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <button className={`btn btn--secondary btn--sm tab-btn ${activeTab === 'tab-overview' ? 'active' : ''}`} onClick={() => setActiveTab('tab-overview')}>Overview</button>
        <button className={`btn btn--secondary btn--sm tab-btn ${activeTab === 'tab-income' ? 'active' : ''}`} onClick={() => setActiveTab('tab-income')}>Income Analytics</button>
        <button className={`btn btn--secondary btn--sm tab-btn ${activeTab === 'tab-performance' ? 'active' : ''}`} onClick={() => setActiveTab('tab-performance')}>Performance Metrics</button>
        <button className={`btn btn--secondary btn--sm tab-btn ${activeTab === 'tab-risk' ? 'active' : ''}`} onClick={() => setActiveTab('tab-risk')}>Risk Analysis</button>
      </div>

      {/* SECTION 1: OVERVIEW TAB */}
      {activeTab === 'tab-overview' && (
        <div className="flex flex-col gap-6">
          <div className="grid-2x2-mobile">
            {/* Total Premium */}
            <div className="stat-card stat-card--accent">
              <span className="stat-label">Total Premium Harvested</span>
              <span className="stat-value number text-success">${summary.totalPremium.toFixed(2)}</span>
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Gross premium from inception</span>
            </div>

            {/* Realized P&L */}
            <div className={`stat-card ${summary.totalPnL >= 0 ? 'stat-card--positive' : 'stat-card--negative'}`}>
              <span className="stat-label">Realized Profit / Loss</span>
              <span className={`stat-value number ${summary.totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                {summary.totalPnL >= 0 ? '+' : ''}${summary.totalPnL.toFixed(2)}
              </span>
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Realized net premium after buybacks</span>
            </div>

            {/* Option Win Rate */}
            <div className="stat-card stat-card--positive">
              <span className="stat-label">Option Win Rate</span>
              <span className="stat-value number text-success">{summary.winRate.toFixed(2)}%</span>
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>{summary.winCount} wins out of {summary.totalClosedTrades} closed trades</span>
            </div>

            {/* Average Yield per Trade */}
            <div className="stat-card stat-card--warning">
              <span className="stat-label">Average Trade Yield (ROC)</span>
              <span className="stat-value number text-success">{summary.avgReturnPerTrade.toFixed(2)}%</span>
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Mean Return on Capital per trade</span>
            </div>
          </div>

          <div className="grid-1-col grid-2-col-desktop">
            {/* Secondary Stats Panel */}
            <div className="card flex flex-col gap-3">
              <div className="card-header">
                <h3 className="card-title">Portfolio Performance Indicators</h3>
              </div>
              <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span className="text-muted">Mean Annualized Trade Return:</span>
                <span className="number text-success" style={{ fontWeight: 600 }}>{summary.avgAnnualizedReturn.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span className="text-muted">Average Days Option Held:</span>
                <span className="number" style={{ fontWeight: 600 }}>{summary.avgDaysHeld} Days</span>
              </div>
              <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span className="text-muted">Open Positions Active:</span>
                <span className="number" style={{ fontWeight: 600 }}>{summary.openPositions} Positions</span>
              </div>
              <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span className="text-muted">Assignment Frequency:</span>
                <span className="number text-warning" style={{ fontWeight: 600 }}>{summary.assignmentRate.toFixed(2)}%</span>
              </div>
            </div>

            {/* Ticker Performance Summary Table */}
            <div className="card flex flex-col gap-4">
              <div className="card-header">
                <h3 className="card-title">Ticker Performance Ranking</h3>
              </div>
              {annualizedTicker.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>No closed trade data available to compute underlying rankings.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table" style={{ fontSize: 'var(--text-xs)' }}>
                    <thead>
                      <tr>
                        <th>Ticker</th>
                        <th>Trades</th>
                        <th>Win Rate</th>
                        <th>Avg Annualized</th>
                      </tr>
                    </thead>
                    <tbody>
                      {annualizedTicker.map(t => (
                        <tr key={t.ticker}>
                          <td className="number" style={{ fontWeight: 700 }}>{t.ticker}</td>
                          <td className="number">{t.trade_count}</td>
                          <td className="number text-success">
                            {t.closed > 0 ? ((t.wins / t.closed) * 100).toFixed(1) : '0.0'}%
                          </td>
                          <td className="number text-success">{t.avg_annualized.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: INCOME ANALYTICS TAB */}
      {activeTab === 'tab-income' && (
        <div className="flex flex-col gap-6">
          {/* Sliding windows grid */}
          <div className="grid-3-col-desktop">
            <div className="stat-card stat-card--positive">
              <span className="stat-label">30-Day Premium Income</span>
              <span className="stat-value number text-success">${rolling.r30.toFixed(2)}</span>
            </div>
            <div className="stat-card stat-card--positive">
              <span className="stat-label">60-Day Premium Income</span>
              <span className="stat-value number text-success">${rolling.r60.toFixed(2)}</span>
            </div>
            <div className="stat-card stat-card--positive">
              <span className="stat-label">90-Day Premium Income</span>
              <span className="stat-value number text-success">${rolling.r90.toFixed(2)}</span>
            </div>
          </div>

          {/* Monthly Chart */}
          <div className="chart-container chart-container--large">
            <div className="chart-header">
              <h3 className="chart-title">Monthly Premium Income</h3>
            </div>
            <div style={{ height: '320px', position: 'relative' }}>
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>

          {/* Income by Ticker */}
          <div className="card flex flex-col gap-4">
            <div className="card-header">
              <h3 className="card-title">Premium Income Generated By Ticker</h3>
            </div>
            <div className="table-wrapper">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Ticker Symbol</th>
                    <th>Trades Logged</th>
                    <th>Total Premium Gathered</th>
                    <th>Realized Trade P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {incomeTicker.map(t => (
                    <tr key={t.ticker}>
                      <td className="number" style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{t.ticker}</td>
                      <td className="number">{t.trade_count} trades</td>
                      <td className="number text-success">${t.total_premium.toFixed(2)}</td>
                      <td className={`number ${t.net_pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                        {t.net_pnl >= 0 ? '+' : ''}${t.net_pnl.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: PERFORMANCE METRICS TAB */}
      {activeTab === 'tab-performance' && (
        <div className="flex flex-col gap-6">
          <div className="grid-2x2-mobile">
            {/* Best Trade */}
            <div className="stat-card stat-card--positive" style={{ minHeight: '120px' }}>
              <span className="stat-label">🏆 Best Single Trade P&L</span>
              <span className="stat-value number text-success">
                {performance.bestTrade ? (
                  <>
                    +${performance.bestTrade.profit_loss.toFixed(2)}
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
                      Ticker: {performance.bestTrade.ticker} | Strike: ${performance.bestTrade.strike_price}
                    </span>
                  </>
                ) : '--'}
              </span>
            </div>

            {/* Worst Trade */}
            <div className="stat-card stat-card--negative" style={{ minHeight: '120px' }}>
              <span className="stat-label">🚨 Worst Single Trade P&L</span>
              <span className="stat-value number text-danger">
                {performance.worstTrade ? (
                  <>
                    ${performance.worstTrade.profit_loss.toFixed(2)}
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
                      Ticker: {performance.worstTrade.ticker} | Strike: ${performance.worstTrade.strike_price}
                    </span>
                  </>
                ) : '--'}
              </span>
            </div>

            {/* Average days */}
            <div className="stat-card stat-card--accent" style={{ minHeight: '120px' }}>
              <span className="stat-label">Average Days to Expiry (Entry)</span>
              <span className="stat-value number">{performance.avgDTE} Days</span>
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Optimal target range is 30-45 days</span>
            </div>

            {/* Implied Volatility */}
            <div className="stat-card stat-card--warning" style={{ minHeight: '120px' }}>
              <span className="stat-label">Average Implied Volatility (Entry)</span>
              <span className="stat-value number text-warning">
                {performance.avgIV > 0 ? performance.avgIV.toFixed(2) + '%' : '--'}
              </span>
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Higher IV offers thicker option premiums</span>
            </div>
          </div>

          <div className="grid-1-col grid-2-col-desktop">
            {/* Streak analysis */}
            <div className="card flex flex-col gap-4">
              <div className="card-header">
                <h3 className="card-title">Trading Win/Loss Streaks</h3>
              </div>
              <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span className="text-muted">Longest Consecutive Winning Streak:</span>
                <span className="number text-success" style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{performance.maxWinStreak} Wins</span>
              </div>
              <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span className="text-muted">Longest Consecutive Losing Streak:</span>
                <span className="number text-danger" style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>{performance.maxLossStreak} Losses</span>
              </div>
              <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span className="text-muted">Current Winning Streak:</span>
                <span className="number text-success" style={{ fontWeight: 600 }}>{performance.currentWinStreak} Wins</span>
              </div>
              <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)', fontSize: 'var(--text-sm)' }}>
                <span className="text-muted">Current Losing Streak:</span>
                <span className="number text-danger" style={{ fontWeight: 600 }}>{performance.currentLossStreak} Losses</span>
              </div>
            </div>

            {/* Strike Selection Analysis Table */}
            <div className="card flex flex-col gap-4">
              <div className="card-header">
                <h3 className="card-title">Moneyness Strike Distribution</h3>
              </div>
              {performance.strikeAnalysis.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>Log trade underlying prices to compute moneyness analysis.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Strike Location</th>
                        <th>Trades count</th>
                        <th>Avg Option P&L</th>
                        <th>Avg Return (ROC)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {performance.strikeAnalysis.map((sa, idx) => (
                        <tr key={idx}>
                          <td className="number" style={{ fontWeight: 700 }}>{sa.moneyness}</td>
                          <td className="number">{sa.count} trades</td>
                          <td className={`number ${sa.avg_pnl >= 0 ? 'text-success' : 'text-danger'}`}>${sa.avg_pnl.toFixed(2)}</td>
                          <td className="number text-success">{sa.avg_roc.toFixed(2)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: RISK ANALYSIS TAB */}
      {activeTab === 'tab-risk' && (
        <div className="flex flex-col gap-6">
          <div className="grid-2x2-mobile">
            {/* Max Capital Exposure */}
            <div className="stat-card stat-card--danger">
              <span className="stat-label">Max Assignment Capital Exposure</span>
              <span className="stat-value number text-danger">
                {risk.maxExposure.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
              </span>
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Total capital bound if all open calls assigned</span>
            </div>

            {/* Assignment Rate */}
            <div className="stat-card stat-card--warning">
              <span className="stat-label">Assignment frequency rate</span>
              <span className="stat-value number text-warning">{risk.assignmentRate.toFixed(2)}%</span>
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>{risk.assignedCount} assignments on {risk.totalClosedTrades} closed trades</span>
            </div>

            {/* Drawdown stats */}
            <div className="stat-card stat-card--danger">
              <span className="stat-label">Maximum realized Drawdown</span>
              <span className="stat-value number text-danger">${risk.maxDrawdown.toFixed(2)}</span>
              <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Peak-to-valley premium decay loss period</span>
            </div>

            {/* Concentration Limit */}
            <div className="stat-card stat-card--accent">
              <span className="stat-label">Maximum Single Ticker Risk</span>
              <span className="stat-value number">
                {risk.concentration.length > 0 ? (
                  <>
                    {risk.concentration[0].percentage.toFixed(1)}%
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--color-text-secondary)', display: 'block', marginTop: '4px' }}>
                      Ticker: {risk.concentration[0].ticker}
                    </span>
                  </>
                ) : '0.0%'}
              </span>
            </div>
          </div>

          {/* Doughnut concentration layout split */}
          <div className="grid-1-col grid-2-col-desktop">
            {/* Doughnut Chart Container */}
            <div className="chart-container">
              <div className="chart-header">
                <h3 className="chart-title">Risk Exposure Concentration</h3>
              </div>
              <div style={{ height: '240px', position: 'relative' }}>
                {risk.concentration.length === 0 ? (
                  <div className="empty-state" style={{ border: 'none', padding: 'var(--space-4)', height: '100%' }}>
                    <p className="empty-text">No active open positions to compute risk distribution.</p>
                  </div>
                ) : (
                  <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
                )}
              </div>
            </div>

            {/* Risk Concentration Breakdown table */}
            <div className="card flex flex-col gap-4">
              <div className="card-header">
                <h3 className="card-title">Ticker Concentration Breakdown</h3>
              </div>
              {risk.concentration.length === 0 ? (
                <p className="text-muted" style={{ fontSize: 'var(--text-sm)' }}>No active open trades.</p>
              ) : (
                <div className="table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Ticker</th>
                        <th>Open Exposure</th>
                        <th>Concentration %</th>
                      </tr>
                    </thead>
                    <tbody>
                      {risk.concentration.map(c => (
                        <tr key={c.ticker}>
                          <td className="number" style={{ fontWeight: 700 }}>{c.ticker}</td>
                          <td className="number">${c.exposure.toLocaleString()}</td>
                          <td className="number">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                              <div style={{ backgroundColor: 'var(--color-border)', height: '8px', width: '60px', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{ backgroundColor: 'var(--color-accent)', height: '100%', width: `${c.percentage}%` }}></div>
                              </div>
                              <span className="number">{c.percentage.toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Statistics;
