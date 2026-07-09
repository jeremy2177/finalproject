import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
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

function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        const res = await api.getDashboard();
        setData(res);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
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

  const { summary, monthlyIncome, openPositions, recentActivity } = data;

  const chartData = {
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

  const chartOptions = {
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

  return (
    <main className="main-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-row">
          <h1>Covered Calls Dashboard</h1>
          <span className="number text-muted">Current System Time: {new Date().toISOString().split('T')[0]}</span>
        </div>
        <p className="page-subtitle">Your real-time options writing and premium harvest overview.</p>
      </div>

      {/* Summary Bar */}
      <div className="grid-2x2-mobile">
        {/* Stat Card: Total P&L */}
        <div className={`stat-card ${summary.totalPnL >= 0 ? 'stat-card--positive' : 'stat-card--negative'}`}>
          <span class="stat-label">Total Realized P&L</span>
          <span className={`stat-value number ${summary.totalPnL >= 0 ? 'text-success' : 'text-danger'}`}>
            {summary.totalPnL >= 0 ? '+' : ''}{summary.totalPnL.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </span>
        </div>

        {/* Stat Card: Win Rate */}
        <div className="stat-card stat-card--accent">
          <span className="stat-label">Win Rate</span>
          <span className="stat-value number text-success">
            {summary.winRate.toFixed(2)}%
          </span>
        </div>

        {/* Stat Card: Active Positions */}
        <div className="stat-card stat-card--warning">
          <span className="stat-label">Open Positions</span>
          <span className="stat-value number">
            {summary.openPositions} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>({summary.openTrades} calls sold)</span>
          </span>
        </div>

        {/* Stat Card: 30D Rolling Premium */}
        <div className="stat-card stat-card--positive">
          <span className="stat-label">30-Day Premium</span>
          <span className="stat-value number text-success">
            {summary.monthlyIncome.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
          </span>
        </div>
      </div>

      {/* Layout split: Charts & Positions */}
      <div className="grid-1-col grid-2-col-desktop">
        {/* Monthly Income Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Income History (12 Months)</h3>
          </div>
          <div style={{ height: '240px', position: 'relative' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Open Positions */}
        <div className="card flex flex-col gap-4">
          <div className="card-header">
            <h3 class="card-title">Open Call Positions</h3>
            <Link to="/positions" className="btn btn--secondary btn--sm">View All</Link>
          </div>

          {openPositions.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
              <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span className="empty-title">No Open Positions</span>
              <p className="empty-text">Click below to record your first covered call underlying purchase.</p>
              <Link to="/positions/add" className="btn btn--primary btn--sm">Create Position</Link>
            </div>
          ) : (
            <>
              {/* Mobile scroll strip */}
              <div className="scroll-strip flex hide-desktop">
                {openPositions.map(p => (
                  <div key={p.id} className="card scroll-strip-card flex flex-col gap-2">
                    <div className="flex justify-between align-center">
                      <span className="number" style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>{p.ticker}</span>
                      <span className="badge badge--active">Active</span>
                    </div>
                    <div className="flex justify-between text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                      <span>Shares:</span>
                      <span className="number" style={{ color: 'var(--color-text-primary)' }}>{p.shares_owned}</span>
                    </div>
                    <div className="flex justify-between text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                      <span>Cost Basis:</span>
                      <span className="number" style={{ color: 'var(--color-text-primary)' }}>${p.avg_cost_basis.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                      <span>Premium Rec:</span>
                      <span className="number text-success">${p.total_premium.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-muted" style={{ fontSize: 'var(--text-sm)' }}>
                      <span>Open Trades:</span>
                      <span className="number" style={{ color: 'var(--color-text-primary)' }}>{p.open_trades}</span>
                    </div>
                    <Link to={`/positions/${p.id}`} className="btn btn--secondary btn--sm w-full m-t-2">Detail Deep Dive</Link>
                  </div>
                ))}
              </div>

              {/* Desktop Grid View Table */}
              <div className="table-wrapper hide-mobile" style={{ border: 'none' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Ticker</th>
                      <th>Shares</th>
                      <th>Avg Cost Basis</th>
                      <th>Premium Collected</th>
                      <th>Open Contracts</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {openPositions.map(p => (
                      <tr key={p.id}>
                        <td className="number" style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{p.ticker}</td>
                        <td className="number">{p.shares_owned}</td>
                        <td className="number">${p.avg_cost_basis.toFixed(2)}</td>
                        <td className="number text-success">${p.total_premium.toFixed(2)}</td>
                        <td className="number">{p.open_trades}</td>
                        <td>
                          <Link to={`/positions/${p.id}`} className="btn btn--secondary btn--sm">Detail</Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="card flex flex-col gap-4">
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
        </div>

        {recentActivity.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
            <p className="empty-text">No trades or positions logged yet.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Ticker</th>
                  <th>Strike</th>
                  <th>Expiry</th>
                  <th>Contracts</th>
                  <th>Premium Received</th>
                  <th>Status</th>
                  <th>P&L</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map(a => (
                  <tr key={a.id}>
                    <td className="number">{a.opened_at}</td>
                    <td className="number" style={{ fontWeight: 600 }}>{a.ticker}</td>
                    <td className="number">${parseFloat(a.strike_price).toFixed(2)}</td>
                    <td className="number">{a.expiration_date}</td>
                    <td className="number">{a.contracts}</td>
                    <td className="number text-success">${parseFloat(a.premium_received).toFixed(2)}</td>
                    <td>
                      <span className={`badge badge--${a.status}`}>{a.status}</span>
                    </td>
                    <td className={`number ${a.status === 'open' ? 'text-muted' : (parseFloat(a.profit_loss || 0) >= 0 ? 'text-success' : 'text-danger')}`}>
                      {a.status === 'open' ? '--' : (parseFloat(a.profit_loss || 0) >= 0 ? '+' : '') + '$' + parseFloat(a.profit_loss || 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* FAB for Mobile Quick Adding */}
      <Link to="/positions/add" className="fab hide-desktop" title="Add Position">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </Link>
    </main>
  );
}

export default Dashboard;