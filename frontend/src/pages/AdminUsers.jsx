import { useState, useEffect } from 'react';
import axios from 'axios';
import { format } from 'date-fns';

const getRoleBadge = (role) => {
  switch (role) {
    case 'ADMIN': return <span className="badge badge-rejected" style={{ background: 'rgba(239, 68, 68, 0.2)' }}>Admin</span>;
    case 'CLERK': return <span className="badge badge-review">Clerk</span>;
    default: return <span className="badge badge-approved" style={{ background: 'rgba(255, 255, 255, 0.1)', color: 'var(--text-primary)', borderColor: 'var(--border-light)' }}>Client</span>;
  }
};

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get('/transactions/users');
        setUsers(data.data);
      } catch (err) {
        console.error('Failed to fetch users', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">User Management</h2>
          <p className="page-subtitle">Directory of all registered accounts and their platform activity.</p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Transactions</th>
                <th>Reviews Done (Clerks)</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: 500 }}>
                    {user.email}
                    <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      ID: {user.id}
                    </div>
                  </td>
                  <td>{getRoleBadge(user.role)}</td>
                  <td>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </div>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      background: 'var(--bg-tertiary)',
                      padding: '0.2rem 0.6rem',
                      borderRadius: 'var(--radius-sm)',
                      fontWeight: 600,
                      fontFamily: 'var(--font-display)'
                    }}>
                      {user._count?.transactions || 0}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      display: 'inline-flex',
                      color: user.role === 'CLERK' ? 'var(--status-info)' : 'var(--text-muted)',
                      fontWeight: 600,
                      fontFamily: 'var(--font-display)'
                    }}>
                      {user._count?.reviews || '--'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;
