import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

function EditPosition() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ticker: '',
    status: 'active',
    shares_owned: '',
    avg_cost_basis: '',
    notes: ''
  });
  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadPosition() {
      try {
        const res = await api.getPositionDetail(id);
        setFormData({
          ticker: res.position.ticker,
          status: res.position.status,
          shares_owned: res.position.shares_owned,
          avg_cost_basis: res.position.avg_cost_basis,
          notes: res.position.notes || ''
        });
      } catch (err) {
        setErrors([err.message || 'Failed to load position data']);
      } finally {
        setLoading(false);
      }
    }
    loadPosition();
  }, [id]);

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
      setErrors(['Shares owned must be a multiple of 100.']);
      return;
    }

    setSaving(true);
    try {
      await api.updatePosition(id, {
        ...formData,
        shares_owned: shares,
        avg_cost_basis: parseFloat(formData.avg_cost_basis)
      });
      navigate(`/positions/${id}`);
    } catch (err) {
      setErrors([err.message || 'Failed to save changes.']);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <main className="main-content">
      {/* Page Header / Breadcrumbs */}
      <div className="page-header">
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/positions" style={{ textDecoration: 'underline' }}>Positions</Link>
          <span>&gt;</span>
          <Link to={`/positions/${id}`} style={{ textDecoration: 'underline' }}>{formData.ticker}</Link>
          <span>&gt;</span>
          <span>Edit</span>
        </div>
        <h1 className="m-t-2">Edit Underlying Position Details</h1>
        <p className="page-subtitle">Modify parameters or update status fields for this underlying asset holding.</p>
      </div>

      <div className="card" style={{ maxWidth: '600px', margin: '0 auto', width: '100%' }}>
        <div className="card-header">
          <h3 className="card-title">Modify Holding Parameters</h3>
        </div>

        {/* Error Banner */}
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
                required 
                value={formData.ticker}
                onChange={handleInputChange}
                style={{ textTransform: 'uppercase' }}
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label htmlFor="status" className="form-label">Position Status</label>
              <select 
                id="status" 
                name="status" 
                className="form-control"
                value={formData.status}
                onChange={handleInputChange}
              >
                <option value="active">Active</option>
                <option value="closed">Closed (Sold shares manually)</option>
                <option value="assigned">Assigned (Option exercised)</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            {/* Shares Owned */}
            <div className="form-group">
              <label htmlFor="shares_owned" className="form-label">Shares Owned</label>
              <input 
                type="number" 
                id="shares_owned" 
                name="shares_owned" 
                className="form-control" 
                required 
                min="100" 
                step="100" 
                value={formData.shares_owned}
                onChange={handleInputChange}
              />
            </div>

            {/* Average Cost Basis */}
            <div className="form-group">
              <label htmlFor="avg_cost_basis" className="form-label">Average Cost Basis ($)</label>
              <input 
                type="number" 
                id="avg_cost_basis" 
                name="avg_cost_basis" 
                className="form-control" 
                required 
                min="0.01" 
                step="0.01" 
                value={formData.avg_cost_basis}
                onChange={handleInputChange}
              />
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label htmlFor="notes" className="form-label">Position Notes</label>
            <textarea 
              id="notes" 
              name="notes" 
              className="form-control" 
              rows="3"
              value={formData.notes}
              onChange={handleInputChange}
            ></textarea>
          </div>

          {/* Action Buttons */}
          <div className="form-actions flex justify-end gap-3 m-t-4">
            <Link to={`/positions/${id}`} className="btn btn--secondary">Cancel</Link>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

export default EditPosition;
