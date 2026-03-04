import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const getDecisionBadge = (decision) => {
  return decision === 'APPROVED'
    ? <span className="badge badge-approved">Approved</span>
    : <span className="badge badge-rejected">Rejected</span>;
};

const ClerkHistory = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const { data } = await axios.get('/transactions/reviews');
        setReviews(data.data);
      } catch (err) {
        console.error('Failed to fetch reviews', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">My Review History</h2>
          <p className="page-subtitle">A log of all your transaction decisions.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {reviews.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
            You haven't reviewed any transactions yet.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Trans. ID</th>
                  <th>Date Reviewed</th>
                  <th>Decision</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(review => (
                  <tr key={review.id}>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>{review.transactionId}</td>
                    <td>
                      <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                        {format(new Date(review.reviewedAt), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </td>
                    <td>{getDecisionBadge(review.decision)}</td>
                    <td>
                      <span style={{ color: review.notes ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                        {review.notes || '--'}
                      </span>
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

export default ClerkHistory;
