import DataState from '../components/DataState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { facilities, leadership } from '../config/site.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const values = [
  { title: 'Rigour', text: 'We teach to a high standard and assess fairly.' },
  { title: 'Integrity', text: 'We are honest in our research, our records and our dealings with students.' },
  { title: 'Practice', text: 'Every programme connects theory to laboratories, placements or live projects.' },
  { title: 'Belonging', text: 'We build a campus where every student can take part and succeed.' },
];

export default function About() {
  usePageTitle('About us');
  const faculties = useFetch('/faculties');

  return (
    <>
      <PageHeader title="About Westbourne University" intro="A teaching-focused university where study is connected to practice." />
      <section className="section">
        <div className="container prose">
          <h2>Overview</h2>
          <p>
            Westbourne University offers certificate, diploma, bachelor and master programmes across four faculties.
            Small classes, practical laboratories and supervised placements keep study grounded in the work graduates will do.
          </p>
          <p>This is a demonstration profile built with fictional information until official details are supplied.</p>
        </div>
      </section>

      <section className="section section-mist">
        <div className="container grid grid-2">
          <article className="card"><h2>Mission</h2><p>To educate graduates who can solve real problems with skill, judgement and care for others.</p></article>
          <article className="card"><h2>Vision</h2><p>To be the university students choose for practical, well-supported study that opens careers.</p></article>
        </div>
        <div className="container">
          <h2 className="subhead">Core values</h2>
          <div className="grid grid-4">
            {values.map((v) => (<article key={v.title} className="card card-accent"><h3>{v.title}</h3><p>{v.text}</p></article>))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Faculties and departments</h2>
          <DataState state={faculties}>
            {({ data }) => (
              <div className="grid grid-2">
                {data.map((f) => (
                  <article key={f.id} className="card">
                    <h3>{f.name}</h3>
                    <p>{f.summary}</p>
                    <p className="meta">Departments: {f.departments.join(', ')}</p>
                  </article>
                ))}
              </div>
            )}
          </DataState>
        </div>
      </section>

      <section className="section section-mist">
        <div className="container">
          <h2>Leadership</h2>
          <div className="grid grid-4">
            {leadership.map((p) => (<article key={p.name} className="card"><h3>{p.name}</h3><p>{p.role}</p></article>))}
          </div>
          <p className="meta note">Names are fictional placeholders.</p>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2>Campus facilities</h2>
          <div className="grid grid-3">
            {facilities.map((f) => (<article key={f.title} className="facility"><h3>{f.title}</h3><p>{f.text}</p></article>))}
          </div>
        </div>
      </section>
    </>
  );
}
