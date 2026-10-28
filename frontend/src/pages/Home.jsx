
import { Link } from 'react-router-dom';
import DataState from '../components/DataState.jsx';
import ProgrammeCard from '../components/ProgrammeCard.jsx';
import { facilities } from '../config/site.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { formatDate } from '../utils.js';

const quickLinks = [
  { icon: '🎓', title: 'Undergraduate', description: 'Discover our degree programmes', path: '/programmes' },
  { icon: '📖', title: 'Postgraduate', description: 'Advance your education', path: '/programmes' },
  { icon: '👥', title: 'Admissions', description: 'Begin your academic journey', path: '/admissions' },
  { icon: '🏛️', title: 'Campus Life', description: 'Explore student life', path: '/about' },
  { icon: '📰', title: 'Latest News', description: 'Stay updated with our events', path: '/news' },
];

export default function Home() {
  usePageTitle('');
  const admissionNews = useFetch('/announcements', { category: 'Admissions', pageSize: 2 });
  const faculties = useFetch('/faculties');
  const programmes = useFetch('/programmes', { pageSize: 50 });
  const latest = useFetch('/announcements', { pageSize: 3 });
  const events = useFetch('/events');

  return (
    <>
      <section className="wu-hero">
        <div className="container wu-hero-content">
          <div className="wu-hero-copy">
            <p className="wu-eyebrow">WELCOME TO WESTBOURNE UNIVERSITY</p>
            <h1>Your Future<br />Starts <span>Here</span></h1>
            <p className="wu-hero-description">
              At Westbourne University, we are committed to excellence
              in education, innovation and service. Our world-class
              programmes, experienced faculty and vibrant campus
              community prepare you to make a difference in the world.
            </p>
            <div className="wu-hero-actions">
              <Link to="/programmes" className="wu-button wu-button-gold">
                Explore Our Programmes →
              </Link>
              <Link to="/admissions" className="wu-button wu-button-outline">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="wu-quick-section">
        <div className="container">
          <div className="wu-quick-links">
            {quickLinks.map((item) => (
              <Link to={item.path} className="wu-quick-link" key={item.title}>
                <span className="wu-quick-icon" aria-hidden="true">{item.icon}</span>
                <span className="wu-quick-text">
                  <strong>{item.title}</strong>
                  <small>{item.description}</small>
                  <span className="wu-quick-arrow" aria-hidden="true">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="wu-about-section">
        <div className="container wu-about-grid">
          <div className="wu-about-image">
            <img
              src="/images/students.jpg"
              alt="University students studying together on campus"
            />
          </div>
          <div className="wu-about-copy">
            <p className="wu-section-eyebrow">ABOUT WESTBOURNE UNIVERSITY</p>
            <h2>A Tradition of Excellence</h2>
            <p>
              Westbourne University is dedicated to higher learning,
              innovation and academic excellence. We strive to nurture
              knowledge, creativity and leadership through quality
              education and a supportive learning environment.
            </p>
            <div className="wu-about-stats">
              <div><strong>Explore</strong><span>Our Faculties</span></div>
              <div><strong>Discover</strong><span>Our Programmes</span></div>
              <div><strong>Connect</strong><span>With Our Community</span></div>
            </div>
            <Link to="/about" className="wu-button wu-button-navy">
              Learn More About Us →
            </Link>
          </div>
        </div>
      </section>

      <section className="section section-mist">
        <div className="container">
          <h2>Admission announcements</h2>
          <DataState state={admissionNews}>
            {({ data }) => (
              <div className="grid grid-2">
                {data.map((a) => (
                  <article key={a.id} className="card">
                    <p className="meta">{formatDate(a.date)}</p>
                    <h3>{a.title}</h3>
                    <p>{a.summary}</p>
                  </article>
                ))}
              </div>
            )}
          </DataState>
          <p className="more"><Link to="/cut-off-points">Check cut-off points</Link></p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Our faculties</h2>
          <DataState state={faculties}>
            {({ data }) => (
              <div className="grid grid-4">
                {data.map((f) => (
                  <article key={f.id} className="card card-accent">
                    <h3>{f.name}</h3>
                    <p>{f.summary}</p>
                  </article>
                ))}
              </div>
            )}
          </DataState>
        </div>
      </section>

      <section className="section section-mist">
        <div className="container">
          <h2>Featured programmes</h2>
          <DataState state={programmes}>
            {({ data }) => (
              <div className="grid grid-2">
                {data.filter((p) => p.featured).map((p) => (
                  <ProgrammeCard key={p.code} programme={p} />
                ))}
              </div>
            )}
          </DataState>
          <p className="more"><Link to="/programmes">See all programmes</Link></p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Campus life and facilities</h2>
          <div className="grid grid-3">
            {facilities.map((f) => (
              <article key={f.title} className="facility">
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-navy">
        <div className="container split">
          <div>
            <h2>Latest news</h2>
            <DataState state={latest}>
              {({ data }) => (
                <ul className="plain-list">
                  {data.map((a) => (
                    <li key={a.id}>
                      <p className="meta">{a.category}, {formatDate(a.date)}</p>
                      <h3>{a.title}</h3>
                    </li>
                  ))}
                </ul>
              )}
            </DataState>
          </div>
          <div>
            <h2>Upcoming events</h2>
            <DataState state={events}>
              {({ data }) => (
                <ul className="plain-list">
                  {data.slice(0, 3).map((e) => (
                    <li key={e.id}>
                      <p className="meta">{formatDate(e.date)}, {e.location}</p>
                      <h3>{e.title}</h3>
                    </li>
                  ))}
                </ul>
              )}
            </DataState>
          </div>
        </div>
        <div className="container more more-light">
          <Link to="/news">All news and events</Link>
        </div>
      </section>
    </>
  );
}
