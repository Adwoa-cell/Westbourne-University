import { Link } from 'react-router-dom';
import DataState from '../components/DataState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { formatDate } from '../utils.js';

export default function Admissions() {
  usePageTitle('Admissions');
  const state = useFetch('/admissions/info');

  return (
    <>
      <PageHeader title="Admissions" intro="Everything you need to prepare an application to Westbourne University." />
      <DataState state={state}>
        {({ data }) => (
          <>
            <section className="section">
              <div className="container split">
                <div>
                  <h2>Admission requirements</h2>
                  <ul className="check-list">{data.requirements.map((r) => (<li key={r}>{r}</li>))}</ul>
                </div>
                <div>
                  <h2>Application process</h2>
                  <ol className="steps">
                    {data.steps.map((s) => (<li key={s.title}><strong>{s.title}</strong><span>{s.detail}</span></li>))}
                  </ol>
                </div>
              </div>
            </section>

            <section className="section section-mist">
              <div className="container">
                <h2>Application deadlines for {data.academicYear}</h2>
                <dl className="deadlines">
                  {data.deadlines.map((d) => (
                    <div key={d.label}><dt>{d.label}</dt><dd>{formatDate(d.date)}</dd></div>
                  ))}
                </dl>
              </div>
            </section>

            <section className="section">
              <div className="container">
                <h2>Frequently asked questions</h2>
                <div className="faq">
                  {data.faqs.map((f) => (
                    <details key={f.question}><summary>{f.question}</summary><p>{f.answer}</p></details>
                  ))}
                </div>
              </div>
            </section>

            <section className="section section-navy">
              <div className="container">
                <h2>Online application and tracking</h2>
                <p className="lead">
                  Account sign-up, the application form, document upload and status tracking are built in a later phase of
                  this project, once the database and authentication are in place. Until then, you can prepare by
                  checking programmes and cut-off points.
                </p>
                <div className="button-row">
                  <Link className="btn btn-gold" to="/programmes">Explore programmes</Link>
                  <Link className="btn btn-outline-light" to="/cut-off-points">Check cut-off points</Link>
                </div>
              </div>
            </section>
          </>
        )}
      </DataState>
    </>
  );
}
