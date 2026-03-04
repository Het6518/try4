import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Building2, ShieldAlert } from 'lucide-react';

const SubmitTransaction = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Base fields
  const [type, setType] = useState('CARD');
  const [amount, setAmount] = useState('');

  // Card fields
  const [card, setCard] = useState({
    cardholderName: '',
    cardLast4Digits: '',
    cardNetwork: 'VISA',
    cardType: 'CREDIT',
    cardExpiryDate: '',
    billingCountry: 'IN',
    billingState: '',
    billingPostal: '',
    shippingCountry: 'IN',
    shippingState: '',
    shippingPostal: '',
    cvvEntered: true,
    avsResult: 'MATCH',
    ipAddress: '192.168.1.1',
    deviceType: 'DESKTOP',
    deviceOS: 'WINDOWS',
    browserType: 'CHROME'
  });

  // UPI fields
  const [upi, setUpi] = useState({
    senderUpiId: '',
    receiverUpiId: '',
    upiProvider: 'GPAY',
    linkedBankName: '',
    senderName: '',
    receiverName: '',
    deviceType: 'MOBILE',
    deviceOS: 'ANDROID',
    ipAddress: '192.168.1.1',
    authenticationMethod: 'PIN'
  });

  // Bank fields
  const [bank, setBank] = useState({
    senderAccountHolderName: '',
    senderBankName: '',
    senderAccountNumber: '',
    receiverAccountHolderName: '',
    receiverBankName: '',
    receiverAccountNumber: '',
    transferType: 'NEFT',
    utrNumber: '',
    remark: '',
    senderCountry: 'IN',
    receiverCountry: 'IN',
    deviceType: 'DESKTOP',
    deviceOS: 'WINDOWS',
    ipAddress: '192.168.1.1'
  });

  // Reusable change handlers
  const handleCardChange = (e) => setCard({ ...card, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const handleUpiChange = (e) => setUpi({ ...upi, [e.target.name]: e.target.value });
  const handleBankChange = (e) => setBank({ ...bank, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || amount <= 0) return setError('Amount must be positive');

    setError('');
    setLoading(true);

    const payload = {
      type,
      amount: parseFloat(amount),
      time: new Date().toISOString(),
    };

    if (type === 'CARD') payload.card = card;
    if (type === 'UPI') payload.upi = upi;
    if (type === 'BANK_TRANSFER') payload.bank = bank;

    try {
      const { data } = await axios.post('/transactions', payload);

      // Auto-flag visual feedback before redirect
      if (data.riskAnalysis?.level === 'CRITICAL' || data.riskAnalysis?.level === 'HIGH') {
        alert(`Transaction flagged for review.\nRisk: ${data.riskAnalysis.level}\nReason: ${data.riskAnalysis.explanation}`);
      }

      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px' }}>
      <div className="page-header">
        <div>
          <h2 className="page-title">Submit Transaction</h2>
          <p className="page-subtitle">Create a new test transaction. Will simulate fraud ML analysis on submission.</p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '1rem', background: 'var(--status-danger-bg)', color: 'var(--status-danger)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
          {error}
        </div>
      )}

      <div className="card">
        <form onSubmit={handleSubmit}>

          <div style={{ marginBottom: '2rem' }}>
            <label className="input-label" style={{ marginBottom: '1rem', display: 'block' }}>Payment Method</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
              <PaymentTypeOption
                icon={<CreditCard />} title="Credit/Debit" value="CARD" current={type} onChange={() => setType('CARD')}
              />
              <PaymentTypeOption
                icon={<Smartphone />} title="UPI" value="UPI" current={type} onChange={() => setType('UPI')}
              />
              <PaymentTypeOption
                icon={<Building2 />} title="Bank Transfer" value="BANK_TRANSFER" current={type} onChange={() => setType('BANK_TRANSFER')}
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Amount (USD)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="input-field"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px solid var(--border-color)', margin: '2rem 0' }} />

          {/* CARD Form */}
          {type === 'CARD' && (
            <div className="form-grid">
              <div className="input-group"><label className="input-label">Cardholder Name</label><input type="text" name="cardholderName" className="input-field" value={card.cardholderName} onChange={handleCardChange} required /></div>
              <div className="input-group"><label className="input-label">Card Last 4 Digits</label><input type="text" name="cardLast4Digits" className="input-field" value={card.cardLast4Digits} onChange={handleCardChange} maxLength="4" required /></div>
              <div className="input-group">
                <label className="input-label">Card Network</label>
                <select name="cardNetwork" className="input-field" value={card.cardNetwork} onChange={handleCardChange}>
                  <option value="VISA">Visa</option>
                  <option value="MASTERCARD">Mastercard</option>
                  <option value="AMEX">Amex</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Card Type</label>
                <select name="cardType" className="input-field" value={card.cardType} onChange={handleCardChange}>
                  <option value="CREDIT">Credit</option>
                  <option value="DEBIT">Debit</option>
                </select>
              </div>
              <div className="input-group"><label className="input-label">Billing Country</label><input type="text" name="billingCountry" className="input-field" value={card.billingCountry} onChange={handleCardChange} /></div>
              <div className="input-group"><label className="input-label">Shipping Country</label><input type="text" name="shippingCountry" className="input-field" value={card.shippingCountry} onChange={handleCardChange} /></div>
              <div className="input-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', cursor: 'pointer' }}>
                  <input type="checkbox" name="cvvEntered" checked={card.cvvEntered} onChange={handleCardChange} />
                  <span className="input-label" style={{ margin: 0 }}>CVV Entered (Security check)</span>
                </label>
              </div>
            </div>
          )}

          {/* UPI Form */}
          {type === 'UPI' && (
            <div className="form-grid">
              <div className="input-group"><label className="input-label">Sender UPI ID</label><input type="text" name="senderUpiId" className="input-field" value={upi.senderUpiId} onChange={handleUpiChange} required placeholder="username@bank" /></div>
              <div className="input-group"><label className="input-label">Receiver UPI ID</label><input type="text" name="receiverUpiId" className="input-field" value={upi.receiverUpiId} onChange={handleUpiChange} required placeholder="merchant@bank" /></div>
              <div className="input-group"><label className="input-label">Linked Bank Name</label><input type="text" name="linkedBankName" className="input-field" value={upi.linkedBankName} onChange={handleUpiChange} required /></div>
              <div className="input-group">
                <label className="input-label">Auth Method</label>
                <select name="authenticationMethod" className="input-field" value={upi.authenticationMethod} onChange={handleUpiChange}>
                  <option value="PIN">UPI PIN</option>
                  <option value="BIOMETRIC">Biometric / FaceID</option>
                  <option value="STATIC_QR">Static QR (High Risk)</option>
                  <option value="NONE">None (Critical Risk)</option>
                </select>
              </div>
            </div>
          )}

          {/* BANK Form */}
          {type === 'BANK_TRANSFER' && (
            <div className="form-grid">
              <div className="input-group"><label className="input-label">Sender Bank</label><input type="text" name="senderBankName" className="input-field" value={bank.senderBankName} onChange={handleBankChange} required /></div>
              <div className="input-group"><label className="input-label">Receiver Bank</label><input type="text" name="receiverBankName" className="input-field" value={bank.receiverBankName} onChange={handleBankChange} required /></div>
              <div className="input-group"><label className="input-label">Sender Country</label><input type="text" name="senderCountry" className="input-field" value={bank.senderCountry} onChange={handleBankChange} required /></div>
              <div className="input-group"><label className="input-label">Receiver Country (Cross-border = Risk)</label><input type="text" name="receiverCountry" className="input-field" value={bank.receiverCountry} onChange={handleBankChange} required /></div>
              <div className="input-group">
                <label className="input-label">Transfer Type</label>
                <select name="transferType" className="input-field" value={bank.transferType} onChange={handleBankChange}>
                  <option value="NEFT">NEFT (Domestic)</option>
                  <option value="IMPS">IMPS (Domestic Fast)</option>
                  <option value="SWIFT">SWIFT (International)</option>
                </select>
              </div>
            </div>
          )}

          <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <div className="spinner" style={{ width: '20px', height: '20px', borderWidth: '2px' }}></div> : 'Process Transaction'}
            </button>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={14} /> Transactions are analyzed via ML in real-time
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

const PaymentTypeOption = ({ icon, title, value, current, onChange }) => {
  const active = current === value;
  return (
    <div
      onClick={onChange}
      style={{
        border: active ? '2px solid var(--accent-primary)' : '1px solid var(--border-color)',
        background: active ? 'var(--bg-tertiary)' : 'transparent',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.75rem',
        cursor: 'pointer',
        transition: 'all var(--transition-fast)'
      }}
    >
      <div style={{
        color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
        transform: active ? 'scale(1.1)' : 'scale(1)',
        transition: 'all var(--transition-fast)'
      }}>
        {icon}
      </div>
      <div style={{
        fontWeight: active ? 600 : 500,
        color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
        fontFamily: 'var(--font-display)',
        fontSize: '0.9rem'
      }}>
        {title}
      </div>
    </div>
  );
};

export default SubmitTransaction;
