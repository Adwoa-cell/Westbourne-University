import { useState } from 'react';
import DataState from '../components/DataState.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { academicYears } from '../config/site.js';
import { useDebounced } from '../hooks/useDebounced.js';
import { useFetch } from '../hooks/useFetch.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

export default function CutOffPoints() {
  usePageTitle('Cut-off points');
  const [q, setQ] = useState('');
  const [year, setYear] = useState(academicYears[0]);
  const debouncedQ = useDebounced(q);
  const state = useFetch('/cut-off-points', { q: debouncedQ, academicYear: year, pageSize: 50 });

  return (
    <>
      <PageHeader title="Cut-off points" intro="Search a programme to see its cut-off points, required subjects and any extra entry requirements." />
      <section className="section">
        <div className="container">
          <form className="filters" role="search" onSubmit={(e) => e.preventDefault()}>
            <div className="field field-wide">
              <label htmlFor="cq">Search by programme, code or subject</label>
              <input id="cq" type="search" value={q} maxLength={80} onChange={(e) => setQ(e.target.value)} placeholder="For example: nursing or Mathematics" />
            </div>
            <div className="field">
              <label htmlFor="year">Academic year</label>
              <select id="year" value={year} onChange={(e) => setYear(e.target.value)}>
                {academicYears.map((y) => (<option key={y} value={y}>{y}</option>))}
              </select>
            </div>
          </form>

          <DataState state={state}>
            {({ data, academicYear }) =>
              data.length === 0 ? (
                <p className="status">No programmes match your search. Try a different name or subject.</p>
              ) : (
                <div className="table-wrap">
                  <table>
                    <caption>Cut-off points for the {academicYear} academic year (fictional demonstration data)</caption>
                    <thead>
                      <tr>
                        <th scope="col">Programme</th>
                        <th scope="col">Cut-off points</th>
                        <th scope="col">Required subjects</th>
                        <th scope="col">Additional entry requirements</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row) => (
                        <tr key={row.programmeCode}>
                          <th scope="row">{row.programmeName}<span className="meta block">{row.programmeCode} &middot; {row.qualification}</span></th>
                          <td>{row.points ?? 'Not applicable'}</td>
                          <td>{row.requiredSubjects.length ? row.requiredSubjects.join(', ') : 'See entry requirements'}</td>
                          <td>{row.additional}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            }
          </DataState>
          <p className="meta note">Authorised administrators will be able to update these figures from the staff dashboard in a later phase.</p>
        </div>
      </section>
    </>
  );
}
