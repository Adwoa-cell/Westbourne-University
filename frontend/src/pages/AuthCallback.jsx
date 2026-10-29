import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

// Where the verification email link lands. Supabase reads the token from the URL and starts a session.
export default function AuthCallback() {
  usePageTitle('Confirming your email');
  const { configured, loading, session } = useAuth();
  const navigate = useNavigate();
  const urlError = new URLSearchParams(window.location.hash.replace(/^#/, '')).get('error_description');

  useEffect(() => {
    if (configured && !loading && session) navigate('/account', { replace: true });
  }, [configured, loading, session, navigate]);

  return (
    <>
      <PageHeader title="Confirming your email" />
      <section className="section">
        <div className="container auth-card">
          {urlError ? (
            <div className="notice" role="alert">
              <h2>We could not verify that link</h2>
              <p>{urlError.replace(/\+/g, ' ')}</p>
              <Link className="btn btn-navy" to="/login">Go to sign in</Link>
            </div>
          ) : !loading && !session ? (
            <div className="notice" role="status">
              <h2>Email confirmed</h2>
              <p>Your address is verified. Sign in to continue.</p>
              <Link className="btn btn-navy" to="/login">Sign in</Link>
            </div>
          ) : (
            <p className="status" role="status">Confirming...</p>
          )}
        </div>
      </section>
    </>
  );
}
