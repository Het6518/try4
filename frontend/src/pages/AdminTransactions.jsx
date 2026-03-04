import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const getStatusBadge = (status) => {
  switch (status) {
    case 'APPROVED': return <span className="badge badge-approved">Approved</span>;
    case 'REJECTED': return <span className="badge badge-rejected">Rejected</span>;
    case 'UNDER_REVIEW': return <span className="badge badge-review">Under Review</span>;
    default: return <span className="badge badge-pending">Pending</span>;
  }
};

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({});
  const navigate = useNavigate();

  // Filters
  const [status, setStatus] = useState('');
  const [type, setType] = useState('');
  const [riskLevel, setRiskLevel] = useState('');
  const [page, setPage] = useState(1);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/transactions', {
        params: { status, type, riskLevel, page, limit: 15 }
      });
      setTransactions(data.data);
      setMeta(data.meta);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, type, riskLevel, page]);

  return (
    <div>
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h2 className="page-title">Transaction Explorer</h2>
          <p className="page-subtitle">Platform-wide transaction search and filtering.</p>
        </div>
      </div>

      <div className="card" style={{ padding: '1rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px' }}>
          <label className="input-label" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.75rem' }}>Status</label>
          <select className="input-field" style={{ width: '100%', padding: '0.5rem' }} value={status} onChange={e => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label className="input-label" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.75rem' }}>Payment Type</label>
          <select className="input-field" style={{ width: '100%', padding: '0.5rem' }} value={type} onChange={e => { setType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="CARD">Card</option>
            <option value="UPI">UPI</option>
            <option value="BANK_TRANSFER">Bank Transfer</option>
          </select>
        </div>
        <div style={{ flex: '1 1 200px' }}>
          <label className="input-label" style={{ marginBottom: '0.25rem', display: 'block', fontSize: '0.75rem' }}>Risk Level</label>
          <select className="input-field" style={{ width: '100%', padding: '0.5rem' }} value={riskLevel} onChange={e => { setRiskLevel(e.target.value); setPage(1); }}>
            <option value="">All Levels</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading && <div className="spinner" style={{ margin: '3rem auto' }} />}

        {!loading && transactions.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            No transactions match the current filters.
          </div>
        ) : !loading && (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>User ID</th>
                  <th>Status</th>
                  <th>Risk</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => (
                  <tr key={tx.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{tx.id.substring(0, 8)}...</td>
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)' }}>
                      ${tx.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {format(new Date(tx.time), 'MMM dd, yy HH:mm')}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{tx.userId.substring(0, 8)}</td>
                    <td>{getStatusBadge(tx.status)}</td>
                    <td>
                      <span style={{
                        fontWeight: 600,
                        color: tx.riskLevel === 'CRITICAL' || tx.riskLevel === 'HIGH' ? 'var(--status-danger)' : tx.riskLevel === 'MEDIUM' ? 'var(--status-warning)' : 'var(--text-primary)'
                      }}>
                        {tx.riskLevel}
                      </span>
                    </td>
                    <td>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
                        onClick={() => navigate(`/review/${tx.id}`)}
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            <div style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-color)', background: 'var(--bg-secondary)' }}>
              <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Showing page {meta.page} of {meta.totalPages} ({meta.total} total)
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                >
                  Prev
                </button>
                <button
                  className="btn btn-secondary"
                  disabled={page === meta.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  style={{ padding: '0.25rem 0.75rem', fontSize: '0.85rem' }}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTransactions;
