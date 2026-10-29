import { useState } from 'react';
import AuthNotConfigured from '../components/AuthNotConfigured.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function ForgotPassword() {
  usePageTitle('Reset password');
  const { configured, requestPasswordReset } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader title="Reset your password" intro="Enter your email address and we will send you a link to choose a new password." />
      <section className="section">
        <div className="container auth-card">
          {!configured ? <AuthNotConfigured /> : sent ? (
            <div className="notice" role="status">
              <h2>Check your email</h2>
              <p>If an account exists for that address, a reset link is on its way. The link expires after a short time.</p>
            </div>
          ) : (
            <form className="form" onSubmit={submit} aria-label="Request password reset">
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {error && <p className="status status-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-navy" disabled={busy}>{busy ? 'Sending...' : 'Send reset link'}</button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
