import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthNotConfigured from '../components/AuthNotConfigured.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { MIN_PASSWORD_LENGTH, useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function Register() {
  usePageTitle('Create account');
  const { configured, signUp } = useAuth();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < MIN_PASSWORD_LENGTH) return setError(`Use a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
    if (form.password !== form.confirm) return setError('The two passwords do not match.');
    setBusy(true);
    try {
      await signUp({ email: form.email.trim(), password: form.password, fullName: form.fullName.trim() });
      setDone(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
    return undefined;
  };

  return (
    <>
      <PageHeader title="Create an account" intro="Applicants create an account to start, save and track an application." />
      <section className="section">
        <div className="container auth-card">
          {!configured ? <AuthNotConfigured /> : done ? (
            <div className="notice" role="status">
              <h2>Check your email</h2>
              <p>If this address can be registered, we have sent a verification link to <strong>{form.email}</strong>. Open it to activate your account, then sign in.</p>
              <Link className="btn btn-navy" to="/login">Go to sign in</Link>
            </div>
          ) : (
            <form className="form" onSubmit={submit} noValidate aria-label="Create account">
              <div className="field">
                <label htmlFor="fullName">Full name</label>
                <input id="fullName" name="fullName" autoComplete="name" required maxLength={120} value={form.fullName} onChange={update} />
              </div>
              <div className="field">
                <label htmlFor="email">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={update} />
              </div>
              <div className="field">
                <label htmlFor="password">Password</label>
                <input id="password" name="password" type="password" autoComplete="new-password" required minLength={MIN_PASSWORD_LENGTH} value={form.password} onChange={update} aria-describedby="pw-hint" />
                <span className="hint" id="pw-hint">At least {MIN_PASSWORD_LENGTH} characters. A short sentence works well.</span>
              </div>
              <div className="field">
                <label htmlFor="confirm">Confirm password</label>
                <input id="confirm" name="confirm" type="password" autoComplete="new-password" required value={form.confirm} onChange={update} />
              </div>
              {error && <p className="status status-error" role="alert">{error}</p>}
              <button type="submit" className="btn btn-navy" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
              <p className="meta">Already registered? <Link to="/login">Sign in</Link></p>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
