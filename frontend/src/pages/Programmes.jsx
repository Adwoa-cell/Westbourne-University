import { useMemo, useState } from 'react';
import DataState from '../components/DataState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import ProgrammeCard from '../components/ProgrammeCard.jsx';
import { useDebounced } from '../hooks/useDebounced.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';
import { qualificationOrder } from '../utils.js';

export default function Programmes() {
  usePageTitle('Programmes');
  const [q, setQ] = useState('');
  const [faculty, setFaculty] = useState('');
  const [qualification, setQualification] = useState('');
  const [studyMode, setStudyMode] = useState('');
  const debouncedQ = useDebounced(q);

  const faculties = useFetch('/faculties');
  const programmes = useFetch('/programmes', { q: debouncedQ, faculty, qualification, studyMode, pageSize: 50 });

  const groups = useMemo(() => {
    if (!programmes.data || !faculties.data) return [];
    return faculties.data.data
      .map((f) => ({
        faculty: f,
        byQualification: qualificationOrder
          .map((level) => ({ level, items: programmes.data.data.filter((p) => p.facultyId === f.id && p.qualification === level) }))
          .filter((g) => g.items.length),
      }))
      .filter((g) => g.byQualification.length);
  }, [programmes.data, faculties.data]);

  const clear = () => { setQ(''); setFaculty(''); setQualification(''); setStudyMode(''); };

  return (
    <>
      <PageHeader title="Programmes" intro="Browse programmes by faculty and qualification, then check entry requirements and cut-off points." />
      <section className="section">
        <div className="container">
          <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
            <div className="field">
              <label htmlFor="q">Search programmes</label>
              <input id="q" type="search" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} placeholder="Name, code or keyword" />
            </div>
            <div className="field">
              <label htmlFor="faculty">Faculty</label>
              <select id="faculty" value={faculty} onChange={(e) => setFaculty(e.target.value)}>
                <option value="">All faculties</option>
                {faculties.data?.data.map((f) => (<option key={f.id} value={f.id}>{f.name}</option>))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="qualification">Qualification</label>
              <select id="qualification" value={qualification} onChange={(e) => setQualification(e.target.value)}>
                <option value="">All qualifications</option>
                {qualificationOrder.map((l) => (<option key={l} value={l}>{l}</option>))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="mode">Study mode</label>
              <select id="mode" value={studyMode} onChange={(e) => setStudyMode(e.target.value)}>
                <option value="">Any mode</option>
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Evening">Evening</option>
              </select>
            </div>
            <button type="button" className="btn btn-outline" onClick={clear}>Clear filters</button>
          </form>

          <DataState state={programmes}>
            {({ meta }) => (
              <>
                <p className="status" role="status">{meta.total} programme{meta.total === 1 ? '' : 's'} found</p>
                {groups.map(({ faculty: f, byQualification }) => (
                  <section key={f.id} className="group">
                    <h2>{f.name}</h2>
                    {byQualification.map(({ level, items }) => (
                      <div key={level}>
                        <h3 className="level">{level} programmes</h3>
                        <div className="grid grid-2">{items.map((p) => (<ProgrammeCard key={p.code} programme={p} />))}</div>
                      </div>
                    ))}
                  </section>
                ))}
                {meta.total === 0 && <p className="status">No programmes match these filters. Try clearing a filter or searching a shorter word.</p>}
              </>
            )}
          </DataState>
        </div>
      </section>
    </>
  );
}
