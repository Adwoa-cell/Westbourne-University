import { useState } from 'react';
import DataState from '../components/DataState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { formatDate } from '../utils.js';

const categories = ['All', 'Admissions', 'Academic calendar', 'General'];

export default function News() {
  usePageTitle('News and events');
  const [category, setCategory] = useState('All');
  const news = useFetch('/announcements', { category: category === 'All' ? undefined : category, pageSize: 50 });
  const events = useFetch('/events');

  return (
    <>
      <PageHeader title="News and events" intro="Announcements, admission updates, academic calendar notices and important dates." />
      <section className="section">
        <div className="container split split-wide">
          <div>
            <h2>Announcements</h2>
            <div className="tabs" role="group" aria-label="Filter announcements">
              {categories.map((c) => (
                <button key={c} type="button" className="tab" aria-pressed={category === c} onClick={() => setCategory(c)}>{c}</button>
              ))}
            </div>
            <DataState state={news}>
              {({ data }) => (
                <div className="stack">
                  {data.map((a) => (
                    <article key={a.id} className="card">
                      <p className="meta">{a.category}, {formatDate(a.date)}</p>
                      <h3>{a.title}</h3>
                      <p>{a.summary}</p>
                    </article>
                  ))}
                </div>
              )}
            </DataState>
          </div>
          <aside>
            <h2>Events and important dates</h2>
            <DataState state={events}>
              {({ data }) => (
                <ul className="event-list">
                  {data.map((e) => (
                    <li key={e.id}>
                      <time dateTime={e.date}>{formatDate(e.date)}</time>
                      <h3>{e.title}</h3>
                      <p className="meta">{e.location}</p>
                      <p>{e.summary}</p>
                    </li>
                  ))}
                </ul>
              )}
            </DataState>
          </aside>
        </div>
      </section>
    </>
  );
}
