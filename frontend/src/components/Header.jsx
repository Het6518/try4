import { useAuth } from '../context/AuthContext';
import { LogOut, User, ShieldAlert } from 'lucide-react';

const Header = () => {
  const { user, role, logout } = useAuth();

  return (
    <header style={{
      height: 'var(--header-height)',
      background: 'var(--bg-secondary)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 2rem',
      position: 'sticky',
      top: 0,
      zIndex: 40
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{ padding: '0.5rem', background: 'var(--accent-glow)', borderRadius: 'var(--radius-sm)' }}>
          <ShieldAlert size={24} color="var(--accent-primary)" />
        </div>
        <h1 style={{ fontSize: '1.25rem', margin: 0 }}>Aubergine</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <User size={18} color="var(--text-secondary)" />
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user?.email || 'User'}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role: {role}</div>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 1rem' }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </header>
  );
};

export default Header;
