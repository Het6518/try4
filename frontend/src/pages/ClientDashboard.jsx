import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { CreditCard, Smartphone, Building2, ExternalLink } from 'lucide-react';

const getTypeIcon = (type) => {
  switch (type) {
    case 'CARD': return <CreditCard size={18} />;
    case 'UPI': return <Smartphone size={18} />;
    case 'BANK_TRANSFER': return <Building2 size={18} />;
    default: return null;
  }
};

const getStatusBadge = (status) => {
  switch (status) {
    case 'APPROVED': return <span className="badge badge-approved">Approved</span>;
    case 'REJECTED': return <span className="badge badge-rejected">Rejected</span>;
    case 'UNDER_REVIEW': return <span className="badge badge-review">Under Review</span>;
    default: return <span className="badge badge-pending">Pending</span>;
  }
};

const ClientDashboard = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data } = await axios.get('/transactions/my');
        setTransactions(data.data);
      } catch (err) {
        console.error('Failed to fetch transactions', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />;

  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">My Transactions</h2>
          <p className="page-subtitle">View your recent activity and transaction statuses.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card">
          <div className="stat-label">Total Transactions</div>
          <div className="stat-value">{transactions.length}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Volume</div>
          <div className="stat-value">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {transactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No transactions found.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Details</th>
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
                    <td>{getStatusBadge(tx.status)}</td>
                    <td>
                      {tx.explanation && tx.status !== 'APPROVED' ? (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={tx.explanation}>
                          {tx.explanation}
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>--</span>
                      )}
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

export default ClientDashboard;
