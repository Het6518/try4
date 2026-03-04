import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Send,
  ListOrdered,
  ShieldCheck,
  Users,
  Activity,
  FileSearch
} from 'lucide-react';

const Sidebar = () => {
  const { role } = useAuth();

  const getLinks = () => {
    switch (role) {
      case 'CLIENT':
        return [
          { to: '/dashboard', label: 'My Transactions', icon: <Home size={20} /> },
          { to: '/submit', label: 'New Transaction', icon: <Send size={20} /> },
        ];
      case 'CLERK':
        return [
          { to: '/review-queue', label: 'Review Queue', icon: <ListOrdered size={20} /> },
          { to: '/clerk-history', label: 'My Reviews', icon: <ShieldCheck size={20} /> },
        ];
      case 'ADMIN':
        return [
          { to: '/admin', label: 'Dashboard', icon: <Activity size={20} /> },
          { to: '/admin/transactions', label: 'All Transactions', icon: <FileSearch size={20} /> },
          { to: '/admin/users', label: 'Users', icon: <Users size={20} /> },
        ];
      default:
        return [];
    }
  };

  const links = getLinks();

  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      background: 'var(--bg-tertiary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '2rem 1rem'
    }}>
      <div style={{
        fontSize: '0.75rem',
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-display)',
        fontWeight: 600,
        padding: '0 1rem',
        marginBottom: '1rem'
      }}>
        Menu
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-secondary)' : 'transparent',
              textDecoration: 'none',
              transition: 'all var(--transition-fast)',
              border: isActive ? '1px solid var(--border-light)' : '1px solid transparent',
              boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
              fontWeight: isActive ? 500 : 400
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.style.background.includes('var(--bg-secondary)')) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.style.border.includes('var(--border-light)')) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {/* The icon slot */}
            <div style={{ opacity: 0.9 }}>{link.icon}</div>

            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
