import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { api } from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

const roleLabels = {
  applicant: 'Applicant',
  student: 'Student',
  admissions_officer: 'Admissions Officer',
  lecturer: 'Lecturer or Academic Staff',
  administrator: 'Administrator',
};

export default function Account() {
  usePageTitle('My account');
  const { profile, profileError, setProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [status, setStatus] = useState({ type: '', message: '' });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setForm({ fullName: profile.fullName, phone: profile.phone ?? '' });
  }, [profile]);

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setStatus({ type: '', message: '' });
    try {
      const { data } = await api.patch('/me', { fullName: form.fullName, phone: form.phone.trim() === '' ? null : form.phone });
      setProfile(data);
      setStatus({ type: 'ok', message: 'Your details have been saved.' });
    } catch (err) {
      setStatus({ type: 'error', message: err.fields?.fullName ?? err.fields?.phone ?? err.message });
    } finally {
      setBusy(false);
    }
  };

  const logout = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <>
      <PageHeader title="My account" intro="Your sign-in details and contact information." />
      <section className="section">
        <div className="container auth-card">
          {profileError && <p className="status status-error" role="alert">{profileError}</p>}
          {!profile && !profileError && <p className="status" role="status">Loading your account...</p>}
          {profile && (
            <>
              <dl className="facts">
                <div><dt>Email</dt><dd>{profile.email}</dd></div>
                <div><dt>Role</dt><dd>{roleLabels[profile.role] ?? profile.role}</dd></div>
              </dl>
              <form className="form" onSubmit={save} aria-label="Update your details">
                <div className="field">
                  <label htmlFor="fullName">Full name</label>
                  <input id="fullName" required maxLength={120} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
                </div>
                <div className="field">
                  <label htmlFor="phone">Phone number (optional)</label>
                  <input id="phone" type="tel" autoComplete="tel" maxLength={30} value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <div aria-live="polite">
                  {status.type === 'ok' && <p className="status status-ok">{status.message}</p>}
                  {status.type === 'error' && <p className="status status-error">{status.message}</p>}
                </div>
                <div className="button-row">
                  <button type="submit" className="btn btn-navy" disabled={busy}>{busy ? 'Saving...' : 'Save changes'}</button>
                  <button type="button" className="btn btn-outline" onClick={logout}>Sign out</button>
                </div>
              </form>
            </>
          )}
        </div>
      </section>
    </>
  );
}
