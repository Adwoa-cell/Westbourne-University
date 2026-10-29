import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api.get('/admin/students', { ...(search ? { q: search } : {}), page })
      .then((response) => {
        if (!active) return;
        setStudents(response.data);
        setMeta(response.meta);
      })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [search, page]);

  async function viewStudent(id) {
    setSelected(null);
    setDetailLoading(true);
    setError('');
    try {
      const response = await api.get(`/admin/students/${id}`);
      setSelected(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  function submitSearch(event) {
    event.preventDefault();
    setSelected(null);
    setPage(1);
    setSearch(query.trim());
  }

  return (
    <section className="container section">
      <Link to="/admin">← Back to Administrator Dashboard</Link>
      <h1>Students Management</h1>
      <p>View student records and their current programme and enrolment details.</p>

      <form className="filters" onSubmit={submitSearch}>
        <label className="field field-wide">Search student number
          <input value={query} onChange={(event) => setQuery(event.target.value)} maxLength={80} />
        </label>
        <button className="btn btn-navy" type="submit">Search</button>
        {search && <button className="btn btn-outline" type="button" onClick={() => { setQuery(''); setPage(1); setSearch(''); }}>Clear</button>}
      </form>

      {error && <p className="status status-error" role="alert">{error}</p>}
      {loading && <p className="status" role="status">Loading students…</p>}
      {!loading && !error && students.length === 0 && <p>No student records match your search.</p>}
      {!loading && !error && students.length > 0 && (
        <>
          <div className="table-wrap admin-table-wrap">
            <table>
              <thead><tr><th>Student number</th><th>Name</th><th>Email</th><th>Programme</th><th>Level</th><th>Status</th><th>Record</th></tr></thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td data-label="Student number">{student.studentNumber}</td><td data-label="Name">{student.fullName}</td><td data-label="Email">{student.email}</td>
                    <td data-label="Programme">{student.programme?.name ?? 'Unknown programme'}</td><td data-label="Level">{student.level}</td><td data-label="Status">{student.status}</td>
                    <td data-label="Record"><button className="btn btn-outline" type="button" onClick={() => viewStudent(student.id)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="button-row" aria-label="Student pages">
              <button className="btn btn-outline" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
              <span>Page {page} of {meta.totalPages}</span>
              <button className="btn btn-outline" type="button" disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
            </div>
          )}
        </>
      )}
      {detailLoading && <p className="status" role="status">Loading student record…</p>}
      {selected && (
        <section className="card stack" aria-labelledby="student-detail-heading" style={{ marginTop: '2rem' }}>
          <h2 id="student-detail-heading">Student record</h2>
          <p><strong>Student number:</strong> {selected.studentNumber}</p>
          <p><strong>Name:</strong> {selected.fullName}</p>
          <p><strong>Email:</strong> {selected.email}</p>
          <p><strong>Programme:</strong> {selected.programme?.name ?? 'Unknown programme'} ({selected.programme?.code ?? '—'})</p>
          <p><strong>Level:</strong> {selected.level}</p>
          <p><strong>Status:</strong> {selected.status}</p>
          <p><strong>Enrolled on:</strong> {selected.enrolledOn}</p>
          <p><strong>Current semester:</strong> {selected.currentSemesterId ?? 'Not assigned'}</p>
        </section>
      )}
    </section>
  );
}
