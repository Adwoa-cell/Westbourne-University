import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import AuthNotConfigured from '../components/AuthNotConfigured.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function Login() {
  usePageTitle('Sign in');
  const { configured, session, signIn, resendVerification } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [unverified, setUnverified] = useState(false);
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  if (configured && session) return <Navigate to={location.state?.from ?? '/account'} replace />;

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setInfo('');
    setUnverified(false);
    try {
      await signIn({ email: form.email.trim(), password: form.password });
      navigate(location.state?.from ?? '/account', { replace: true });
    } catch (err) {
      if (/not confirmed/i.test(err.message)) {
        setUnverified(true);
        setError('Verify your email address first. Open the link we sent when you registered.');
      } else {
        setError('The email or password is not correct.');
      }
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    try {
      await resendVerification(form.email.trim());
      setInfo('Verification email sent. Check your inbox.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <PageHeader title="Sign in" intro="Applicants, students and staff sign in here." />
      <section className="section">
        <div className="container auth-card">
          {!configured ? <AuthNotConfigured /> : (
            <form className="form" onSubmit={submit} aria-label="Sign in">
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" required value={form.email} onChange={update} />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" autoComplete="current-password" required value={form.password} onChange={update} />
              </div>
              {error && <p className="status status-error" role="alert">{error}</p>}
              {info && <p className="status status-ok" role="status">{info}</p>}
              {unverified && <button type="button" className="btn btn-outline" onClick={resend}>Resend verification email</button>}
              <button type="submit" className="btn btn-navy" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
              <p className="meta"><Link to="/forgot-password">Forgot your password?</Link></p>
              <p className="meta">New applicant? <Link to="/register">Create an account</Link></p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
