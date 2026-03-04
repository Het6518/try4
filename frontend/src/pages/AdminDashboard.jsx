import { useState, useEffect } from 'react';
import axios from 'axios';
import { Activity, ShieldAlert, CreditCard, CopyCheck, AlertOctagon } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await axios.get('/transactions/stats');
        setStats(data.data);
      } catch (err) {
        console.error('Failed to fetch stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="spinner" style={{ margin: '3rem auto' }} />;
  if (!stats) return <div>Failed to load stats.</div>;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Admin Command Center</h2>
          <p className="page-subtitle">Platform-wide fraud intelligence and transaction metrics.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="card stat-card" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-label">Total Volume</div>
            <Activity className="stat-icon" />
          </div>
          <div className="stat-value">{stats.total}</div>
        </div>

        <div className="card stat-card" style={{ borderLeft: '4px solid var(--status-danger)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-label">High Risk Alerts</div>
            <ShieldAlert className="stat-icon" color="var(--status-danger)" />
          </div>
          <div className="stat-value" style={{ color: 'var(--status-danger)' }}>
            {stats.highRiskCount}
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)', marginLeft: '0.5rem', fontWeight: 500 }}>
              ({Math.round((stats.highRiskCount / (stats.total || 1)) * 100)}%)
            </span>
          </div>
        </div>

        <div className="card stat-card" style={{ borderLeft: '4px solid var(--status-warning)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="stat-label">Avg Risk Score</div>
            <AlertOctagon className="stat-icon" color="var(--status-warning)" />
          </div>
          <div className="stat-value">{Math.round(stats.avgRiskScore)}/100</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>

        {/* Breakdown by Status */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CopyCheck size={18} color="var(--accent-primary)" />
            By Status
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED'].map(status => {
              const count = stats.byStatus[status] || 0;
              const percent = Math.round((count / (stats.total || 1)) * 100);
              const colorMap = {
                'PENDING': 'var(--status-warning)',
                'UNDER_REVIEW': 'var(--status-info)',
                'APPROVED': 'var(--status-success)',
                'REJECTED': 'var(--status-danger)'
              };
              const color = colorMap[status];

              return (
                <div key={status}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span>{status.replace('_', ' ')}</span>
                    <span style={{ fontWeight: 600 }}>{count} ({percent}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: color, borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Breakdown by Type */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CreditCard size={18} color="var(--accent-primary)" />
            By Payment Method
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {['CARD', 'UPI', 'BANK_TRANSFER'].map(type => {
              const count = stats.byType[type] || 0;
              const percent = Math.round((count / (stats.total || 1)) * 100);

              return (
                <div key={type}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span>{type.replace('_', ' ')}</span>
                    <span style={{ fontWeight: 600 }}>{count} ({percent}%)</span>
                  </div>
                  <div style={{ height: '8px', background: 'var(--bg-tertiary)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: 'var(--accent-primary)', borderRadius: '4px' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
