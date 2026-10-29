import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthNotConfigured from '../components/AuthNotConfigured.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { MIN_PASSWORD_LENGTH, useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function ResetPassword() {
  usePageTitle('Choose a new password');
  const { configured, loading, session, updatePassword } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (password !== confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      await updatePassword(password);
      navigate('/account', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <>
      <PageHeader title="Choose a new password" />
      <section className="section">
        <div className="container auth-card">
          {!configured ? <AuthNotConfigured /> : loading ? (
            <p className="status" role="status">Checking your reset link...</p>
          ) : !session ? (
            <div className="notice" role="alert">
              <h2>This link is not valid</h2>
              <p>Reset links expire quickly and work once. Request a new one.</p>
              <Link className="btn btn-navy" to="/forgot-password">Request a new link</Link>
            </div>
          ) : (
            <form className="form" onSubmit={submit} aria-label="Choose a new password">
              <div className="field">
                <label htmlFor="password">New password</label>
                <input id="password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="confirm">Confirm new password</label>
                <input id="confirm" type="password" autoComplete="new-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
              {error && <p className="status status-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-navy" disabled={busy}>{busy ? 'Saving...' : 'Save new password'}</button>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
