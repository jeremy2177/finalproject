import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

function AddPosition() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ticker: '',
    shares_owned: '',
    avg_cost_basis: '',
    opened_at: new Date().toISOString().split('T')[0],
    notes: ''
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);

    const shares = parseInt(formData.shares_owned);
    if (isNaN(shares) || shares < 100 || shares % 100 !== 0) {
      setErrors(['Shares owned must be a multiple of 100 (representing standard contracts).']);
      return;
    }

    setLoading(true);
    try {
      const res = await api.createPosition({
        ...formData,
        shares_owned: shares,
        avg_cost_basis: parseFloat(formData.avg_cost_basis)
      });
      // Redirect to sell trade add page
      navigate(`/positions/${res.id}/trades/add`);
    } catch (err) {
      setErrors([err.message || 'An error occurred while creating position.']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="main-content">
      {/* Page Header / Breadcrumbs */}
      <div className="page-header">
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/positions" style={{ textDecoration: 'underline' }}>Positions</Link>
          <span>&gt;</span>
          <span>Add Position</span>
        </div>
        <h1 className="m-t-2">Log New Underlying Position</h1>
        <p className="page-subtitle">Record your stock or ETF purchase details. Options contracts are mapped to these share holdings.</p>
      </div>

      {/* Form container */}
      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div className="card-header">
          <h3 className="card-title">Stock / ETF Details</h3>
        </div>

        {/* Error messages banner */}
        {errors.length > 0 && (
          <div className="error-banner">
            <strong>Error:</strong>
            <ul style={{ marginLeft: 'var(--space-4)', marginTop: 'var(--space-1)' }}>
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="form-row">
            {/* Ticker */}
            <div className="form-group">
              <label htmlFor="ticker" className="form-label">Ticker Symbol</label>
              <input 
                type="text" 
                id="ticker" 
                name="ticker" 
                className="form-control" 
                placeholder="e.g. AAPL" 
                required 
                value={formData.ticker}
                onChange={handleInputChange}
                style={{ textTransform: 'uppercase' }}
              />
              <span className="form-helper">Capital letters only (e.g. MSFT, SPY)</span>
            </div>

            {/* Shares Owned */}
            <div className="form-group">
              <label htmlFor="shares_owned" className="form-label">Shares Owned</label>
              <input 
                type="number" 
                id="shares_owned" 
                name="shares_owned" 
                className="form-control" 
                placeholder="100, 200, etc." 
                required 
                min="100" 
                step="100" 
                value={formData.shares_owned}
                onChange={handleInputChange}
              />
              <span className="form-helper text-warning">Must be a multiple of 100 (1 standard contract)</span>
            </div>
          </div>

          <div className="form-row">
            {/* Average Cost Basis */}
            <div className="form-group">
              <label htmlFor="avg_cost_basis" className="form-label">Average Cost Basis ($)</label>
              <input 
                type="number" 
                id="avg_cost_basis" 
                name="avg_cost_basis" 
                className="form-control" 
                placeholder="e.g. 145.50" 
                required 
                min="0.01" 
                step="0.01" 
                value={formData.avg_cost_basis}
                onChange={handleInputChange}
              />
              <span className="form-helper">Your average purchase price per share</span>
            </div>

            {/* Opened Date */}
            <div className="form-group">
              <label htmlFor="opened_at" className="form-label">Purchase Date</label>
              <input 
                type="date" 
                id="opened_at" 
                name="opened_at" 
                className="form-control" 
                required 
                value={formData.opened_at}
                onChange={handleInputChange}
              />
              <span className="form-helper">When you bought the underlying shares</span>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes" className="form-label">Notes (Optional)</label>
            <textarea 
              id="notes" 
              name="notes" 
              className="form-control" 
              rows="3" 
              placeholder="Enter notes or comments regarding this holding..."
              value={formData.notes}
              onChange={handleInputChange}
            ></textarea>
          </div>

          {/* Form Actions */}
          <div className="form-actions flex justify-end gap-3 m-t-4">
            <Link to="/positions" className="btn btn--secondary">Cancel</Link>
            <button type="submit" className="btn btn--primary" disabled={loading}>
              <span>{loading ? 'Logging...' : 'Log & Proceed'}</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default AddPosition;
