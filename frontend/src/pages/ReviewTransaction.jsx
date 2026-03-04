import { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ShieldCheck, ShieldAlert, FileText, Smartphone, CreditCard, Building2, User } from 'lucide-react';

const getRiskBadge = (level) => {
  switch (level) {
    case 'CRITICAL': return <span className="badge badge-rejected">Critical Risk</span>;
    case 'HIGH': return <span className="badge badge-pending">High Risk</span>;
    case 'MEDIUM': return <span className="badge badge-review">Medium Risk</span>;
    default: return <span className="badge badge-approved">Low Risk</span>;
  }
};

const ReviewTransaction = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tx, setTx] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const { data } = await axios.get(`/transactions/${id}`);
        setTx(data.data);
      } catch (err) {
        console.error('Failed to fetch transaction', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, [id]);

  const handleDecision = async (decision) => {
    setSubmitting(true);
    try {
      await axios.put(`/transactions/${id}/review`, { decision, notes });
      navigate('/review-queue');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
      setSubmitting(false);
    }
  };

  if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />;
  if (!tx) return <div style={{ padding: '3rem', textAlign: 'center' }}>Transaction not found.</div>;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
            <h2 className="page-title" style={{ margin: 0 }}>Review Transaction</h2>
            {getRiskBadge(tx.riskLevel)}
          </div>
          <p className="page-subtitle">ID: {tx.id}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', fontWeight: 700 }}>
            ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div style={{ color: 'var(--text-secondary)' }}>
            {format(new Date(tx.time), 'MMM dd, yyyy HH:mm')}
          </div>
        </div>
      </div>

      <div className="stats-grid">
        {/* Risk Analysis Card */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <FileText size={18} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Automated Risk Analysis</h3>
          </div>
          <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div style={{
                fontSize: '3rem',
                fontFamily: 'var(--font-display)',
                fontWeight: 700,
                color: tx.riskScore >= 80 ? 'var(--status-danger)' : tx.riskScore >= 55 ? 'var(--status-warning)' : 'var(--text-primary)',
                lineHeight: 1
              }}>
                {tx.riskScore}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: '0.5rem', letterSpacing: '0.05em' }}>
                Score / 100
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 500, marginBottom: '0.25rem' }}>Category: {tx.category}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                {tx.explanation}
              </div>
            </div>
          </div>
        </div>

        {/* User Context */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <User size={18} color="var(--accent-primary)" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>User Context</h3>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '0.5rem 1rem', fontSize: '0.9rem' }}>
            <div style={{ color: 'var(--text-muted)' }}>Email</div><div>{tx.user?.email}</div>
            <div style={{ color: 'var(--text-muted)' }}>ID</div><div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{tx.user?.id}</div>
          </div>
        </div>
      </div>

      {/* Transaction Payload Details */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          {tx.type === 'CARD' ? <CreditCard size={18} color="var(--accent-primary)" /> :
            tx.type === 'UPI' ? <Smartphone size={18} color="var(--accent-primary)" /> :
              <Building2 size={18} color="var(--accent-primary)" />}
          <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{tx.type.replace('_', ' ')} Details</h3>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {tx.cardTransaction && Object.entries(tx.cardTransaction).filter(([k]) => !['id', 'transactionId'].includes(k)).map(([key, value]) => (
            <div key={key}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{key.replace(/([A-Z])/g, ' $1')}</div>
              <div style={{ fontWeight: 500 }}>{String(value)}</div>
            </div>
          ))}
          {tx.upiTransaction && Object.entries(tx.upiTransaction).filter(([k]) => !['id', 'transactionId'].includes(k)).map(([key, value]) => (
            <div key={key}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{key.replace(/([A-Z])/g, ' $1')}</div>
              <div style={{ fontWeight: 500 }}>{String(value)}</div>
            </div>
          ))}
          {tx.bankTransfer && Object.entries(tx.bankTransfer).filter(([k]) => !['id', 'transactionId'].includes(k)).map(([key, value]) => (
            <div key={key}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{key.replace(/([A-Z])/g, ' $1')}</div>
              <div style={{ fontWeight: 500 }}>{String(value)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Review Section */}
      <div className="card" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--accent-glow)' }}>
        <h3 style={{ margin: 0, fontSize: '1.1rem', marginBottom: '1rem' }}>Manual Decision</h3>
        <div className="input-group">
          <label className="input-label">Investigation Notes (Optional)</label>
          <textarea
            className="input-field"
            style={{ minHeight: '100px', resize: 'vertical' }}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context for your decision..."
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
          <button
            className="btn btn-success"
            style={{ flex: 1 }}
            onClick={() => handleDecision('APPROVED')}
            disabled={submitting}
          >
            {submitting ? '...' : <><ShieldCheck size={18} /> Approve Transaction</>}
          </button>
          <button
            className="btn btn-danger"
            style={{ flex: 1 }}
            onClick={() => handleDecision('REJECTED')}
            disabled={submitting}
          >
            {submitting ? '...' : <><ShieldAlert size={18} /> Reject as Fraud</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReviewTransaction;
