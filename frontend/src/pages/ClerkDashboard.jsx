import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Building2 } from 'lucide-react';

const getTypeIcon = (type) => {
  switch (type) {
    case 'CARD': return <CreditCard size={18} />;
    case 'UPI': return <Smartphone size={18} />;
    case 'BANK_TRANSFER': return <Building2 size={18} />;
    default: return null;
  }
};

const getRiskBadge = (level) => {
  switch (level) {
    case 'CRITICAL': return <span className="badge badge-rejected">Critical Risk</span>;
    case 'HIGH': return <span className="badge badge-pending">High Risk</span>;
    case 'MEDIUM': return <span className="badge badge-review">Medium Risk</span>;
    default: return <span className="badge badge-approved">Low Risk</span>;
  }
};

const ClerkDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const { data } = await axios.get('/transactions/pending');
        setTransactions(data.data);
      } catch (err) {
        console.error('Failed to fetch pending transactions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPending();
  }, []);

  if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Review Queue</h2>
          <p className="page-subtitle">Transactions flagged for manual human review.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {transactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: '1.25rem', color: 'var(--status-success)', marginBottom: '0.5rem' }}>All caught up!</div>
            No pending transactions require review at this time.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Risk Score</th>
                  <th>Risk Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ color: 'var(--text-secondary)' }}>{getTypeIcon(tx.type)}</div>
                        <span style={{ fontWeight: 500 }}>{tx.type.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {format(new Date(tx.time), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </td>
                    <td>
                      <div style={{
                        fontFamily: 'var(--font-display)',
                        fontWeight: 600,
                        color: tx.riskScore >= 80 ? 'var(--status-danger)' : tx.riskScore >= 55 ? 'var(--status-warning)' : 'var(--text-primary)'
                      }}>
                        {tx.riskScore}/100
                      </div>
                    </td>
                    <td>{getRiskBadge(tx.riskLevel)}</td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.75rem' }}
                        onClick={() => navigate(`/review/${tx.id}`)}
                      >
                        Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClerkDashboard;
