import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Mail, Lock, UserCog } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('CLIENT');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Register
      await axios.post('/auth/register', { email, password, role });

      // 2. Auto login
      const { data } = await axios.post('/auth/login', { email, password });
      login(data.token, data.role);

      // Redirect based on role
      if (data.role === 'CLIENT') navigate('/dashboard');
      else if (data.role === 'CLERK') navigate('/review-queue');
      else if (data.role === 'ADMIN') navigate('/admin');

    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-layout">
      <div className="card" style={{ width: '100%', maxWidth: '400px', zIndex: 10 }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'inline-flex', padding: '1rem', background: 'var(--accent-glow)', borderRadius: '50%', marginBottom: '1rem' }}>
            <ShieldAlert size={32} color="var(--accent-primary)" />
          </div>
          <h2>Create Account</h2>
          <p className="page-subtitle">Join Aubergine Fraud Intelligence</p>
        </div>

        {error && (
          <div style={{ padding: '0.75rem', background: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', fontSize: '0.875rem', textAlign: 'center', border: '1px solid rgba(239,68,68,0.2)' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="input-field"
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Mail size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type="password"
                className="input-field"
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <Lock size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Account Role</label>
            <div style={{ position: 'relative' }}>
              <select
                className="input-field"
                style={{ width: '100%', paddingLeft: '2.5rem' }}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="CLIENT">Client (End User)</option>
                <option value="CLERK">Fraud Analyst (Clerk)</option>
                <option value="ADMIN">System Administrator</option>
              </select>
              <UserCog size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }} disabled={loading}>
            {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div> : 'Create Account'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
          Already have an account? <Link to="/login" style={{ fontWeight: 500 }}>Sign in here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
