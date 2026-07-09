import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';

function AddTrade() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState([]);
  const [saving, setSaving] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    strike_price: '',
    premium_received: '',
    contracts: '',
    open_price: '',
    opened_at: new Date().toISOString().split('T')[0],
    expiration_date: '',
    underlying_price_at_entry: '',
    iv_at_entry: '',
    delta_at_entry: '',
    notes: ''
  });

  useEffect(() => {
    async function loadPosition() {
      try {
        const res = await api.getPositionDetail(id);
        setPosition(res.position);
        setFormData(prev => ({
          ...prev,
          contracts: Math.floor(res.position.shares_owned / 100)
        }));
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
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-calculate premium_received from open_price or vice versa
      if (name === 'open_price' && value && prev.contracts) {
        updated.premium_received = (parseFloat(value) * parseInt(prev.contracts) * 100).toFixed(2);
      } else if (name === 'premium_received' && value && prev.contracts) {
        updated.open_price = (parseFloat(value) / (parseInt(prev.contracts) * 100)).toFixed(2);
      } else if (name === 'contracts' && value) {
        if (prev.open_price) {
          updated.premium_received = (parseFloat(prev.open_price) * parseInt(value) * 100).toFixed(2);
        } else if (prev.premium_received) {
          updated.open_price = (parseFloat(prev.premium_received) / (parseInt(value) * 100)).toFixed(2);
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors([]);
    setSaving(true);

    try {
      await api.createTrade(id, {
        ...formData,
        strike_price: parseFloat(formData.strike_price),
        premium_received: parseFloat(formData.premium_received),
        contracts: parseInt(formData.contracts),
        open_price: formData.open_price ? parseFloat(formData.open_price) : undefined,
        underlying_price_at_entry: formData.underlying_price_at_entry ? parseFloat(formData.underlying_price_at_entry) : undefined,
        iv_at_entry: formData.iv_at_entry ? parseFloat(formData.iv_at_entry) : undefined,
        delta_at_entry: formData.delta_at_entry ? parseFloat(formData.delta_at_entry) : undefined
      });
      navigate(`/positions/${id}`);
    } catch (err) {
      setErrors([err.message || 'Failed to create trade contract.']);
    } finally {
      setSaving(false);
    }
  };

  // Live Return Projections
  const getProjections = () => {
    if (!position) return { capitalAtRisk: 0, dte: 0, roc: 0, annualized: 0 };
    
    const contracts = parseInt(formData.contracts) || 0;
    const capitalAtRisk = parseFloat(position.avg_cost_basis) * contracts * 100;
    
    let dte = 0;
    if (formData.opened_at && formData.expiration_date) {
      const opened = new Date(formData.opened_at);
      const expiry = new Date(formData.expiration_date);
      const diffTime = expiry - opened;
      dte = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    }
    
    const premium = parseFloat(formData.premium_received) || 0;
    const roc = capitalAtRisk > 0 ? (premium / capitalAtRisk) * 100 : 0;
    const annualized = dte > 0 ? roc * (365 / dte) : 0;

    return { capitalAtRisk, dte, roc, annualized };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
      </div>
    );
  }

  const { capitalAtRisk, dte, roc, annualized } = getProjections();

  return (
    <main className="main-content">
      {/* Page Header / Breadcrumbs */}
      <div className="page-header">
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', display: 'flex', gap: 'var(--space-2)' }}>
          <Link to="/positions" style={{ textDecoration: 'underline' }}>Positions</Link>
          <span>&gt;</span>
          <Link to={`/positions/${position.id}`} style={{ textDecoration: 'underline' }}>{position.ticker}</Link>
          <span>&gt;</span>
          <span>Log Option Trade</span>
        </div>
        <h1 className="m-t-2">Sell Covered Call Option</h1>
        <p className="page-subtitle">Record the details of the call option sold against your {position.ticker} holdings.</p>
      </div>

      {/* Main layout grid: Form on left, live calculators on right */}
      <div className="grid-1-col grid-2-col-desktop">
        {/* Log Trade Form */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Call Option Details</h3>
          </div>

          {/* Error display banner */}
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
              {/* Strike Price */}
              <div className="form-group">
                <label htmlFor="strike_price" className="form-label">Strike Price ($)</label>
                <input 
                  type="number" 
                  id="strike_price" 
                  name="strike_price" 
                  className="form-control" 
                  placeholder="e.g. 150.00" 
                  required 
                  min="0.01" 
                  step="0.01" 
                  value={formData.strike_price}
                  onChange={handleInputChange}
                />
                <span className="form-helper">The target strike price for the call option</span>
              </div>

              {/* Premium Received (Total) */}
              <div className="form-group">
                <label htmlFor="premium_received" className="form-label">Total Premium Received ($)</label>
                <input 
                  type="number" 
                  id="premium_received" 
                  name="premium_received" 
                  className="form-control" 
                  placeholder="e.g. 245.00" 
                  required 
                  min="0.01" 
                  step="0.01" 
                  value={formData.premium_received}
                  onChange={handleInputChange}
                />
                <span className="form-helper">Total gross premium cash collected (premium * 100 * contracts)</span>
              </div>
            </div>

            <div className="form-row">
              {/* Contracts */}
              <div className="form-group">
                <label htmlFor="contracts" className="form-label">Contracts Sold</label>
                <input 
                  type="number" 
                  id="contracts" 
                  name="contracts" 
                  className="form-control" 
                  placeholder="e.g. 1" 
                  required 
                  min="1" 
                  step="1" 
                  value={formData.contracts}
                  onChange={handleInputChange}
                />
                <span className="form-helper">Standard multiplier is 100 shares per contract.</span>
              </div>

              {/* Open Price (Per share premium) */}
              <div className="form-group">
                <label htmlFor="open_price" className="form-label">Premium Per Share ($)</label>
                <input 
                  type="number" 
                  id="open_price" 
                  name="open_price" 
                  className="form-control" 
                  placeholder="e.g. 2.45" 
                  min="0.00" 
                  step="0.01" 
                  value={formData.open_price}
                  onChange={handleInputChange}
                />
                <span className="form-helper">Standard calculation is (Total Premium / Contracts / 100)</span>
              </div>
            </div>

            <div className="form-row">
              {/* Opened At */}
              <div className="form-group">
                <label htmlFor="opened_at" className="form-label">Write/Open Date</label>
                <input 
                  type="date" 
                  id="opened_at" 
                  name="opened_at" 
                  className="form-control" 
                  required 
                  value={formData.opened_at}
                  onChange={handleInputChange}
                />
                <span className="form-helper">When you sold the call option</span>
              </div>

              {/* Expiration Date */}
              <div className="form-group">
                <label htmlFor="expiration_date" className="form-label">Expiration Date</label>
                <input 
                  type="date" 
                  id="expiration_date" 
                  name="expiration_date" 
                  className="form-control" 
                  required 
                  value={formData.expiration_date}
                  onChange={handleInputChange}
                />
                <span className="form-helper">When the option contract expires</span>
              </div>
            </div>

            <div className="form-row">
              {/* Underlying price at entry */}
              <div className="form-group">
                <label htmlFor="underlying_price_at_entry" className="form-label">Underlying Stock Price ($)</label>
                <input 
                  type="number" 
                  id="underlying_price_at_entry" 
                  name="underlying_price_at_entry" 
                  className="form-control" 
                  placeholder="e.g. 147.20" 
                  min="0.01" 
                  step="0.01" 
                  value={formData.underlying_price_at_entry}
                  onChange={handleInputChange}
                />
                <span className="form-helper">Optional. Stock trading price at option writing</span>
              </div>

              {/* IV */}
              <div className="form-group">
                <label htmlFor="iv_at_entry" className="form-label">Implied Volatility (%)</label>
                <input 
                  type="number" 
                  id="iv_at_entry" 
                  name="iv_at_entry" 
                  className="form-control" 
                  placeholder="e.g. 34.5" 
                  min="0.1" 
                  step="0.1" 
                  value={formData.iv_at_entry}
                  onChange={handleInputChange}
                />
                <span className="form-helper">Optional. Implied Volatility percentage</span>
              </div>
            </div>

            <div className="form-row">
              {/* Delta */}
              <div className="form-group">
                <label htmlFor="delta_at_entry" className="form-label">Option Delta (Δ)</label>
                <input 
                  type="number" 
                  id="delta_at_entry" 
                  name="delta_at_entry" 
                  className="form-control" 
                  placeholder="e.g. 0.30" 
                  min="0.01" 
                  max="0.99" 
                  step="0.01" 
                  value={formData.delta_at_entry}
                  onChange={handleInputChange}
                />
                <span className="form-helper">Optional. Delta indicator</span>
              </div>

              {/* Form Notes */}
              <div className="form-group">
                <label htmlFor="notes" className="form-label">Trade Notes (Optional)</label>
                <input 
                  type="text" 
                  id="notes" 
                  name="notes" 
                  className="form-control" 
                  placeholder="e.g. Rolled from last week, earnings play" 
                  value={formData.notes}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="form-actions flex justify-end gap-3 m-t-4">
              <Link to={`/positions/${id}`} className="btn btn--secondary">Cancel</Link>
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? 'Logging...' : 'Log Trade'}
              </button>
            </div>
          </form>
        </div>

        {/* Live Preview Calculations Panel */}
        <div className="card flex flex-col gap-4">
          <div className="card-header">
            <h3 className="card-title">Live Return Projection</h3>
          </div>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
            These metrics update in real-time as strike prices, premium numbers, and expiration dates are populated.
          </p>

          <div className="flex flex-col gap-4 m-t-4" style={{ flex: 1, justifyContent: 'center' }}>
            {/* Capital at risk */}
            <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
              <span className="text-muted" style={{ fontWeight: 500 }}>Capital at Risk:</span>
              <span id="risk-preview" className="number" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                ${capitalAtRisk.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            {/* Days to Expiry */}
            <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
              <span className="text-muted" style={{ fontWeight: 500 }}>Days to Expiry (DTE):</span>
              <span id="dte-preview" className="number" style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                {dte} days
              </span>
            </div>

            {/* Return on Capital */}
            <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
              <span className="text-muted" style={{ fontWeight: 500 }}>Return on Capital (ROC):</span>
              <span id="roc-preview" className="number text-success" style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
                {roc.toFixed(2)}%
              </span>
            </div>

            {/* Annualized Return */}
            <div className="flex justify-between align-center" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: 'var(--space-3)' }}>
              <span className="text-muted" style={{ fontWeight: 500 }}>Annualized Return:</span>
              <span id="annualized-preview" class="number text-success" style={{ fontSize: 'var(--text-2xl)', fontWeight: 800 }}>
                {annualized.toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="badge badge--open" style={{ padding: 'var(--space-3)', borderRadius: 'var(--radius-md)', textAlign: 'left', textTransform: 'none', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
            <strong style={{ color: 'var(--color-accent)' }}>Covered Call Concept:</strong>
            <p style={{ fontSize: 'var(--text-xs)', lineHeight: 1.4, color: 'var(--color-text-primary)' }}>
              By selling a call option, you receive immediate premium cash. In exchange, you commit to sell your underlying shares at the specified strike price if the stock is at or above the strike on expiration.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

export default AddTrade;
