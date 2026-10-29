
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
            ['Applications', 'Review student applications', '/admin/applications'],
            ['Students', 'View student records', '/admin/students'],
            ['Programmes', 'Manage academic programmes', '/admin/programmes'],
            ['Calendar', 'Manage university events', '/admin/calendar'],
          ].map(([title, description, href]) => (
            <article
              key={title}
              className="card"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '0.5rem',
              }}
            >
              <h3>{title}</h3>
              <p>{description}</p>
              <Link to={href}>Open {title.toLowerCase()} management</Link>
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
