import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';

function Positions() {
  const [positions, setPositions] = useState([]);
  const [tickers, setTickers] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    ticker: '',
    sort: 'opened'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    async function loadInitialData() {
      try {
        const tickersRes = await api.getTickers();
        setTickers(tickersRes);
      } catch (err) {
        console.error('Failed to load tickers list', err);
      }
    }
    loadInitialData();
  }, []);

  useEffect(() => {
    async function loadPositions() {
      setLoading(true);
      try {
        const res = await api.getPositions(filters);
        setPositions(res);
      } catch (err) {
        setError(err.message || 'Failed to load positions');
      } finally {
        setLoading(false);
      }
    }
    loadPositions();
  }, [filters]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleExpand = (id) => {
    if (expandedId === id) {
      setExpandedId(null);
    } else {
      setExpandedId(id);
    }
  };

  return (
    <main className="main-content">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-row">
          <h1>All Covered Call Positions</h1>
          <Link to="/positions/add" className="btn btn--primary">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Position</span>
          </Link>
        </div>
        <p className="page-subtitle">Track and filter underlying positions and their relative premium harvests.</p>
      </div>

      {/* Filters & Sorting Control Panel */}
      <div className="card flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:align-center lg:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:align-center">
            {/* Status Filter */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Status</label>
              <select 
                name="status" 
                value={filters.status}
                onChange={handleFilterChange}
                className="form-control" 
                style={{ minHeight: '38px', padding: '4px var(--space-4)' }}
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="closed">Closed</option>
                <option value="assigned">Assigned</option>
              </select>
            </div>

            {/* Ticker Search */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Ticker</label>
              <select 
                name="ticker" 
                value={filters.ticker}
                onChange={handleFilterChange}
                className="form-control" 
                style={{ minHeight: '38px', padding: '4px var(--space-4)' }}
              >
                <option value="">All Tickers</option>
                {tickers.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Sorting Select */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Sort By</label>
            <select 
              name="sort" 
              value={filters.sort}
              onChange={handleFilterChange}
              className="form-control" 
              style={{ minHeight: '38px', padding: '4px var(--space-4)' }}
            >
              <option value="opened">Opened Date</option>
              <option value="ticker">Ticker A-Z</option>
              <option value="status">Status</option>
              <option value="cost">Cost Basis</option>
            </select>
          </div>
        </div>
      </div>

      {/* Positions List */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
        </div>
      ) : error ? (
        <div className="error-banner">{error}</div>
      ) : positions.length === 0 ? (
        <div className="empty-state">
          <svg className="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span className="empty-title">No Positions Found</span>
          <p className="empty-text">No matches under current filter criteria.</p>
          <Link to="/positions/add" className="btn btn--primary">Log Position</Link>
        </div>
      ) : (
        <>
          {/* Mobile Accordion Cards (visible on smaller screens) */}
          <div className="hide-desktop">
            {positions.map(p => (
              <div key={p.id} className="mobile-expandable">
                <div className="mobile-expand-header" onClick={() => toggleExpand(p.id)}>
                  <div className="flex flex-col">
                    <span className="number" style={{ fontWeight: 700, fontSize: 'var(--text-base)' }}>{p.ticker}</span>
                    <span className="number text-muted" style={{ fontSize: 'var(--text-xs)' }}>Basis: ${parseFloat(p.avg_cost_basis).toFixed(2)}</span>
                  </div>
                  <div className="flex align-center gap-2">
                    <span className={`badge badge--${p.status}`}>{p.status}</span>
                    <svg 
                      className={`expand-chevron ${expandedId === p.id ? 'rotated' : ''}`} 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2"
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>
                
                {expandedId === p.id && (
                  <div className="mobile-expand-body" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', padding: 'var(--space-4)' }}>
                    <div className="grid-mobile-details">
                      <div className="flex flex-col">
                        <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Shares</span>
                        <span className="number">{p.shares_owned}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Effective Basis</span>
                        <span className="number">${p.effective_cost_basis.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Premium Collected</span>
                        <span className="number text-success">${p.total_premium.toFixed(2)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Realized P&L</span>
                        <span className={`number ${p.total_pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                          ${p.total_pnl.toFixed(2)}
                        </span>
                      </div>
                      {p.next_expiry && (
                        <div className="flex flex-col">
                          <span className="text-muted" style={{ fontSize: 'var(--text-xs)' }}>Next Expiration</span>
                          <span className={`number ${p.days_to_next_expiry <= 7 ? 'text-danger' : (p.days_to_next_expiry <= 21 ? 'text-warning' : 'text-success')}`}>
                            {p.next_expiry} ({p.days_to_next_expiry}d)
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 w-full m-t-4">
                      <Link to={`/positions/${p.id}`} className="btn btn--secondary btn--sm flex-1">Deep Dive Stats</Link>
                      {p.status === 'active' && (
                        <Link to={`/positions/${p.id}/trades/add`} className="btn btn--primary btn--sm flex-1">Sell Call Option</Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Desktop Grid Table (visible on larger viewports) */}
          <div className="table-wrapper hide-mobile">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Ticker</th>
                  <th>Shares</th>
                  <th>Avg Cost Basis</th>
                  <th>Effective Basis</th>
                  <th>Premium Collected</th>
                  <th>Realized P&L</th>
                  <th>Trades Count</th>
                  <th>Next Expiration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.map(p => (
                  <tr key={p.id}>
                    <td className="number" style={{ fontWeight: 700 }}>{p.ticker}</td>
                    <td className="number">{p.shares_owned}</td>
                    <td className="number">${parseFloat(p.avg_cost_basis).toFixed(2)}</td>
                    <td className="number">${p.effective_cost_basis.toFixed(2)}</td>
                    <td className="number text-success">${p.total_premium.toFixed(2)}</td>
                    <td className={`number ${p.total_pnl >= 0 ? 'text-success' : 'text-danger'}`}>
                      ${p.total_pnl.toFixed(2)}
                    </td>
                    <td className="number">{p.trade_count}</td>
                    <td className="number">
                      {p.next_expiry ? (
                        <span className={p.days_to_next_expiry <= 7 ? 'text-danger' : (p.days_to_next_expiry <= 21 ? 'text-warning' : 'text-success')}>
                          {p.next_expiry} ({p.days_to_next_expiry}d)
                        </span>
                      ) : (
                        <span className="text-muted">None</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge--${p.status}`}>{p.status}</span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <Link to={`/positions/${p.id}`} className="btn btn--secondary btn--sm">View</Link>
                        {p.status === 'active' && (
                          <Link to={`/positions/${p.id}/trades/add`} className="btn btn--primary btn--sm">Sell Call</Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}

export default Positions;
