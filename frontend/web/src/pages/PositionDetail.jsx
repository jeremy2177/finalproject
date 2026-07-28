import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import Modal from '../components/Modal';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
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

function PositionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Close trade Modal states
  const [closeTradeModalOpen, setCloseTradeModalOpen] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState(null);
  const [closePrice, setClosePrice] = useState('');
  
  // Assessment signals states
  const [underlyingPrice, setUnderlyingPrice] = useState('');
  const [optionPrice, setOptionPrice] = useState('');
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [assessing, setAssessing] = useState(false);

  const fetchDetail = async () => {
    try {
      const res = await api.getPositionDetail(id);
      setDetail(res);
    } catch (err) {
      setError(err.message || 'Failed to load position details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleDeletePosition = async () => {
    if (window.confirm('Are you absolutely sure? This will delete the underlying position and ALL historical trades logged under it. This cannot be undone.')) {
      try {
        await api.deletePosition(id);
        navigate('/positions');
      } catch (err) {
        alert('Failed to delete position: ' + err.message);
      }
    }
  };

  const handleExpireTrade = async (tradeId) => {
    if (window.confirm('Mark this call option as Expired? This assumes the strike was out-of-the-money (OTM) and you kept 100% of the premium.')) {
      try {
        await api.expireTrade(tradeId);
        fetchDetail();
      } catch (err) {
        alert('Failed to expire trade: ' + err.message);
      }
    }
  };

  const handleAssignTrade = async (tradeId) => {
    if (window.confirm('Mark this position as Assigned? This will record assignment and close your underlying shares position, marking the parent holding as Assigned.')) {
      try {
        await api.assignTrade(tradeId);
        fetchDetail();
      } catch (err) {
        alert('Failed to assign trade: ' + err.message);
      }
    }
  };

  const openCloseTradeModal = (tradeId) => {
    setSelectedTradeId(tradeId);
    setClosePrice('');
    setCloseTradeModalOpen(true);
  };

  const handleCloseTradeSubmit = async (e) => {
    e.preventDefault();
    if (!closePrice) return;
    try {
      await api.closeTrade(selectedTradeId, parseFloat(closePrice));
      setCloseTradeModalOpen(false);
      fetchDetail();
    } catch (err) {
      alert('Failed to close trade: ' + err.message);
    }
  };

  const runAnalysis = async () => {
    if (!underlyingPrice || !optionPrice) {
      alert('Please enter both prices');
      return;
    }

    setAssessing(true);
    setAssessmentResults([]);

    const openTrades = detail.trades.filter(t => t.status === 'open');
    if (openTrades.length === 0) {
      setAssessmentResults([]);
      setAssessing(false);
      return;
    }

    try {
      const results = await Promise.all(
        openTrades.map(async (t) => {
          return await api.assessTrade(t.id, parseFloat(underlyingPrice), parseFloat(optionPrice));
        })
      );
      setAssessmentResults(results);
    } catch (err) {
      alert('Analysis failed: ' + err.message);
    } finally {
      setAssessing(false);
    }
  };

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

  const { position, trades, stats, monthlyData } = detail;

  const lineChartData = {
    labels: monthlyData.map(d => d.label),
    datasets: [
      {
        label: 'Premium Collected',
        data: monthlyData.map(d => d.premium),
        borderColor: CHART_COLORS.accent,
        backgroundColor: 'rgba(79, 142, 247, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 2
      },
      {
        label: 'Net P&L (Realized)',
        data: monthlyData.map(d => d.pnl),
        borderColor: CHART_COLORS.success,
        backgroundColor: 'rgba(34, 197, 94, 0.05)',
        fill: true,
        tension: 0.3,
        borderWidth: 2
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: CHART_COLORS.text }
      },
      tooltip: {
        backgroundColor: CHART_COLORS.tooltipBg,
        borderColor: CHART_COLORS.border,
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            return context.dataset.label + ': $' + context.parsed.y.toFixed(2);
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
        ticks: { color: CHART_COLORS.text }
      }
    }
  };

  return (
    <main className="main-content">
      {/* Breadcrumbs */}
      <div className="page-header">
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/positions" style={{ textDecoration: 'underline' }}>Positions</Link>
          <span>&gt;</span>
          <span>{position.ticker}</span>
        </div>
        
        <div className="page-title-row m-t-2">
          <div className="flex align-center gap-4">
            <h1>{position.ticker} Position Detail</h1>
            <span className={`badge badge--${position.status}`}>{position.status}</span>
          </div>
          <div className="flex gap-2">
            <Link to={`/positions/${position.id}/edit`} className="btn btn--secondary btn--sm">Edit Position</Link>
            <button className="btn btn--danger btn--sm" onClick={handleDeletePosition}>Delete</button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid-2x2-mobile">
        {/* Shares Cost Basis */}
        <div className="stat-card stat-card--accent">
          <span className="stat-label">Shares Cost Basis</span>
          <span className="stat-value number">${parseFloat(position.avg_cost_basis).toFixed(2)}</span>
          <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>{position.shares_owned} shares owned</span>
        </div>

        {/* Effective Cost Basis */}
        <div className="stat-card stat-card--positive">
          <span className="stat-label">Effective Cost Basis</span>
          <span className="stat-value number text-success">${stats.effectiveCostBasis.toFixed(2)}</span>
          <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>-${stats.premiumPerShare.toFixed(2)}/share offset</span>
        </div>

        {/* Premium Collected */}
        <div className="stat-card stat-card--positive">
          <span className="stat-label">Total Premium Collected</span>
          <span className="stat-value number text-success">${stats.totalPremium.toFixed(2)}</span>
          <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>{stats.tradeCount} call contract{stats.tradeCount !== 1 ? 's' : ''} written</span>
        </div>

        {/* Yield on Cost */}
        <div className="stat-card stat-card--warning">
          <span className="stat-label">Yield on Cost</span>
          <span className="stat-value number text-success">{stats.yieldOnCost.toFixed(2)}%</span>
          <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Premium yield relative to basis</span>
        </div>
      </div>

      {/* Charts & Actions Panel */}
      <div className="grid-1-col grid-2-col-desktop">
        {/* Position History Chart */}
        <div className="chart-container">
          <div className="chart-header">
            <h3 className="chart-title">Premium Harvest Progression</h3>
          </div>
          <div style={{ height: '240px', position: 'relative' }}>
            {monthlyData.length > 0 ? (
              <Line data={lineChartData} options={lineChartOptions} />
            ) : (
              <div className="empty-state" style={{ border: 'none', height: '100%' }}>
                <p className="empty-text">Not enough data to render chart.</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions Panel */}
        <div className="card flex flex-col justify-between gap-4">
          <div>
            <div className="card-header">
              <h3 className="card-title">Manage Trades</h3>
            </div>
            <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
              Write calls to reduce your underlying shares cost basis, or close active options trades that have met profit targets.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex justify-between align-center" style={{ fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                <span className="text-muted">Realized Trade P&L:</span>
                <span className={`number ${stats.realizedPnL >= 0 ? 'text-success' : 'text-danger'}`} style={{ fontWeight: 600 }}>
                  {stats.realizedPnL >= 0 ? '+' : ''}${stats.realizedPnL.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between align-center" style={{ fontSize: 'var(--text-sm)', borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-2)' }}>
                <span className="text-muted">Option Win Rate:</span>
                <span className="number text-success" style={{ fontWeight: 600 }}>{stats.winRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>
          
          {position.status === 'active' ? (
            <Link to={`/positions/${position.id}/trades/add`} className="btn btn--primary w-full">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
              <span>Sell New Call Contract</span>
            </Link>
          ) : (
            <button className="btn btn--secondary w-full" disabled>
              Position is {position.status.toUpperCase()}
            </button>
          )}
        </div>
      </div>

      {/* Trade Log / History Grid */}
      <div className="card flex flex-col gap-4">
        <div className="card-header">
          <h3 className="card-title">Option Trade Log</h3>
        </div>

        {trades.length === 0 ? (
          <div className="empty-state" style={{ padding: 'var(--space-6)' }}>
            <span className="empty-title">No Trades Logged</span>
            <p className="empty-text">Click the button above to write your first covered call on {position.ticker}.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Opened</th>
                  <th>Contracts</th>
                  <th>Strike</th>
                  <th>Expiry</th>
                  <th>Premium Received</th>
                  <th>Status</th>
                  <th>P&L</th>
                  <th>Annualized</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trades.map(t => (
                  <tr key={t.id}>
                    <td className="number">{t.opened_at}</td>
                    <td className="number">{t.contracts}</td>
                    <td className="number">${parseFloat(t.strike_price).toFixed(2)}</td>
                    <td className="number">{t.expiration_date}</td>
                    <td className="number text-success">${parseFloat(t.premium_received).toFixed(2)}</td>
                    <td>
                      <span className={`badge badge--${t.status}`}>{t.status}</span>
                    </td>
                    <td className={`number ${t.status === 'open' ? 'text-muted' : (parseFloat(t.profit_loss || 0) >= 0 ? 'text-success' : 'text-danger')}`}>
                      {t.status === 'open' ? '--' : (parseFloat(t.profit_loss || 0) >= 0 ? '+' : '') + '$' + parseFloat(t.profit_loss || 0).toFixed(2)}
                    </td>
                    <td className={`number ${t.status === 'open' ? 'text-muted' : (t.annualized_return >= 0 ? 'text-success' : 'text-danger')}`}>
                      {t.status === 'open' ? '--' : (t.annualized_return * 100).toFixed(2) + '%'}
                    </td>
                    <td>
                      {t.status === 'open' ? (
                        <div className="flex gap-2">
                          <button className="btn btn--secondary btn--sm btn--success" onClick={() => openCloseTradeModal(t.id)} style={{ minHeight: '28px', padding: '2px 8px' }}>Close</button>
                          <button className="btn btn--secondary btn--sm btn--warning" onClick={() => handleAssignTrade(t.id)} style={{ minHeight: '28px', padding: '2px 8px' }}>Assign</button>
                          <button className="btn btn--secondary btn--sm text-muted" onClick={() => handleExpireTrade(t.id)} style={{ minHeight: '28px', padding: '2px 8px' }}>Expire</button>
                        </div>
                      ) : (
                        <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Closed {t.closed_at}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Market Data Input Panel for Signal Assessment */}
      <div className="card flex flex-col gap-4" style={{ marginTop: 'var(--space-6)', backgroundColor: 'var(--color-surface-2)' }}>
        <div className="card-header">
          <h3 className="card-title">Check Roll/Close Signals</h3>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Enter current prices to assess which trades are safe to roll or close.
        </p>
        
        <div className="flex flex-col gap-4" style={{ border: '1px solid var(--color-border)', padding: 'var(--space-4)', borderRadius: 'var(--radius-md)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
            <div className="form-group">
              <label className="form-label">Current {position.ticker} Price</label>
              <input 
                type="number" 
                className="form-control" 
                placeholder="e.g. 180.50" 
                step="0.01" 
                min="0"
                value={underlyingPrice}
                onChange={(e) => setUnderlyingPrice(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Option Bid Price (per share)</label>
              <input 
                type="number" 
                className="form-control" 
                placeholder="e.g. 2.50" 
                step="0.01" 
                min="0"
                value={optionPrice}
                onChange={(e) => setOptionPrice(e.target.value)}
              />
            </div>
          </div>
          <button onClick={runAnalysis} className="btn btn--primary" disabled={assessing}>
            {assessing ? 'Analyzing...' : '📊 Run Analysis'}
          </button>
        </div>

        {/* Results Panel */}
        {assessmentResults && (
          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-4)' }}>
            <h4 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-3)' }}>
              📈 Trade Recommendations
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {assessmentResults.length === 0 ? (
                <div style={{ color: 'var(--color-text-secondary)' }}>No open trades to assess</div>
              ) : (
                assessmentResults.map(a => {
                  const actionColor = a.recommendedAction === 'CLOSE' ? 'var(--color-danger)' : 
                                     a.recommendedAction === 'ROLL' ? 'var(--color-warning)' : 
                                     'var(--color-text-secondary)';
                  const actionBg = a.recommendedAction === 'CLOSE' ? 'rgba(239, 68, 68, 0.15)' : 
                                   a.recommendedAction === 'ROLL' ? 'rgba(245, 158, 11, 0.15)' : 
                                   'rgba(136, 146, 170, 0.15)';
                  const actionBorder = a.recommendedAction === 'CLOSE' ? 'rgba(239, 68, 68, 0.3)' : 
                                       a.recommendedAction === 'ROLL' ? 'rgba(245, 158, 11, 0.3)' : 
                                       'rgba(136, 146, 170, 0.3)';
                  return (
                    <div key={a.tradeId} style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--color-surface)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{a.ticker} @ ${a.strikePrice.toFixed(2)}</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-1) var(--space-3)', borderRadius: '9999px', fontSize: 'var(--text-xs)', fontWeight: 600, textTransform: 'uppercase', backgroundColor: actionBg, color: actionColor, border: `1px solid ${actionBorder}` }}>
                          → {a.recommendedAction}
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-2)', fontSize: 'var(--text-xs)', marginBottom: 'var(--space-2)', color: 'var(--color-text-secondary)' }}>
                        <div>Current P&L: <span style={{ color: a.currentPnL >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 600 }}>
                          {a.currentPnL >= 0 ? '+' : ''}${a.currentPnL.toFixed(2)} ({a.pnlPercent.toFixed(1)}%)
                        </span></div>
                        <div>DTE: <span style={{ fontWeight: 600 }}>{a.dte}</span> days</div>
                        <div>Underlying: <span style={{ fontWeight: 600 }}>${parseFloat(a.currentUnderlyingPrice).toFixed(2)}</span></div>
                        <div>Spread: <span style={{ fontWeight: 600 }}>{a.spreadPercent > 0 ? '+' : ''}{a.spreadPercent.toFixed(1)}%</span></div>
                      </div>
                      {a.closeReasons.length > 0 && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-warning)', marginBottom: 'var(--space-1)' }}>
                          <strong>Close Signals:</strong> {a.closeReasons.join('; ')}
                        </div>
                      )}
                      {a.rollReasons.length > 0 && (
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)' }}>
                          <strong>Roll Signals:</strong> {a.rollReasons.join('; ')}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Close Option Trade Modal */}
      <Modal isOpen={closeTradeModalOpen} onClose={() => setCloseTradeModalOpen(false)} title="Close Option Contract">
        <p className="modal-body" style={{ marginBottom: 'var(--space-4)' }}>Enter the premium price per share paid to buy back (BTC) this contract.</p>
        <form onSubmit={handleCloseTradeSubmit}>
          <div className="form-group">
            <label htmlFor="close_price" className="form-label">Buyback Price ($ per share)</label>
            <input 
              type="number" 
              id="close_price" 
              className="form-control" 
              placeholder="e.g. 0.15" 
              required 
              min="0.00" 
              step="0.01"
              value={closePrice}
              onChange={(e) => setClosePrice(e.target.value)}
            />
            <span className="form-helper">Paid to buy option back. Enter 0.00 if closed for no cost.</span>
          </div>
          <div className="modal-actions m-t-6">
            <button type="button" className="btn btn--secondary" onClick={() => setCloseTradeModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn--success">Close Position</button>
          </div>
        </form>
      </Modal>
    </main>
  );
}

export default PositionDetail;
