
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminDashboard() {
  const { profile } = useAuth();

  return (
    <>
      <section className="page-hero">
        <div className="container">
          <h1>Administrator Dashboard</h1>
          <p>
            Manage Westbourne University administration.
          </p>
        </div>
      </section>

      <section className="container" style={{ padding: '3rem 0' }}>
        <h2>Welcome, {profile?.full_name || 'Administrator'}</h2>
        <p>
          You are signed in with administrator privileges.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1rem',
            marginTop: '2rem',
          }}
        >
          {[
            ['Applications', 'Review student applications'],
            ['Students', 'Manage student records'],
            ['Programmes', 'Manage academic programmes'],
            ['Calendar', 'Manage university events'],
          ].map(([title, description]) => (
            <article
              key={title}
              style={{
                padding: '1.5rem',
                border: '1px solid #d5dbe5',
                borderRadius: '8px',
              }}
            >
              <h3>{title}</h3>
              <p>{description}</p>
              <p style={{ color: '#64748b' }}>
                Management tools coming soon
              </p>
            </article>
          ))}
        </div>

        <p style={{ marginTop: '2rem' }}>
          <Link to="/account">Manage my account</Link>
        </p>
      </section>
    </>
  );
}
