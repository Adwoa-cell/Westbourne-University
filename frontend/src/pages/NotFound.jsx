import { Link } from 'react-router-dom';
import PageHeader from '../components/PageHeader.jsx';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function NotFound() {
  usePageTitle('Page not found');
  return (
    <>
      <PageHeader title="Page not found" intro="The page you asked for does not exist or has moved." />
      <section className="section">
        <div className="container button-row">
          <Link className="btn btn-navy" to="/">Go to the home page</Link>
          <Link className="btn btn-outline" to="/programmes">Explore programmes</Link>
        </div>
      </section>
    </>
  );
}
