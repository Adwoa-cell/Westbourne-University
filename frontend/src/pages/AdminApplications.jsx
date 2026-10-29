import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

const statusLabel = (status) => status.replaceAll('_', ' ');
const nextStatuses = {
  submitted: ['under_review'],
  under_review: ['additional_information_required', 'accepted', 'rejected'],
  additional_information_required: ['under_review', 'rejected'],
};

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [success, setSuccess] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [infoRequest, setInfoRequest] = useState('');
  const [saving, setSaving] = useState(false);

  async function loadApplications() {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/admin/applications', {
        ...(statusFilter ? { status: statusFilter } : {}),
        page,
      });
      setApplications(response.data);
      setMeta(response.meta);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadApplications(); }, [statusFilter, page]);

  async function openApplication(id) {
    setSelected(null);
    setDetailLoading(true);
    setActionError('');
    try {
      const response = await api.get(`/admin/applications/${id}`);
      setSelected(response.data);
      setNewStatus(nextStatuses[response.data.status]?.[0] ?? '');
      setInfoRequest('');
    } catch (err) {
      setActionError(err.message);
    } finally {
      setDetailLoading(false);
    }
  }

  async function updateStatus(event) {
    event.preventDefault();
    if (!selected || !newStatus) return;
    setSaving(true);
    setActionError('');
    setSuccess('');
    try {
      const body = { status: newStatus };
      if (newStatus === 'additional_information_required') body.infoRequest = infoRequest;
      const response = await api.patch(`/admin/applications/${selected.id}/status`, body);
      setSelected((previous) => ({ ...previous, ...response.data }));
      setSuccess('Application status updated.');
      setInfoRequest('');
      await loadApplications();
      await openApplication(selected.id);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="container section">
      <Link to="/admin">← Back to Administrator Dashboard</Link>
      <h1>Applications Management</h1>
      <p>Review submitted applications and update them through the admissions workflow.</p>

      <div className="filters">
        <label className="field">Filter by status
          <select value={statusFilter} onChange={(event) => { setPage(1); setStatusFilter(event.target.value); }}>
            <option value="">All statuses</option>
            {['draft', 'submitted', 'under_review', 'additional_information_required', 'accepted', 'rejected'].map((status) => (
              <option key={status} value={status}>{statusLabel(status)}</option>
            ))}
          </select>
        </label>
      </div>
      {error && <p className="status status-error" role="alert">{error}</p>}
      {loading && <p className="status" role="status">Loading applications…</p>}
      {!loading && !error && applications.length === 0 && <p>No applications match this filter.</p>}
      {!loading && !error && applications.length > 0 && (
        <>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Reference</th><th>Applicant</th><th>Programme</th><th>Academic year</th><th>Status</th><th>Submitted</th><th>View</th></tr></thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td>{application.referenceNumber ?? 'Draft'}</td>
                    <td>{application.applicant.fullName}<br /><small>{application.applicant.email}</small></td>
                    <td>{application.programme?.name ?? 'Unknown programme'}</td>
                    <td>{application.academicYear ?? '—'}</td>
                    <td>{statusLabel(application.status)}</td>
                    <td>{application.submittedAt ? new Date(application.submittedAt).toLocaleDateString() : '—'}</td>
                    <td><button className="btn btn-outline" type="button" onClick={() => openApplication(application.id)}>View</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {meta && meta.totalPages > 1 && (
            <div className="button-row" aria-label="Application pages">
              <button className="btn btn-outline" type="button" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
              <span>Page {page} of {meta.totalPages}</span>
              <button className="btn btn-outline" type="button" disabled={page >= meta.totalPages} onClick={() => setPage((value) => value + 1)}>Next</button>
            </div>
          )}
        </>
      )}

      {detailLoading && <p className="status" role="status">Loading application record…</p>}
      {actionError && <p className="status status-error" role="alert">{actionError}</p>}
      {selected && (
        <section className="card stack" aria-labelledby="application-detail-heading" style={{ marginTop: '2rem' }}>
          <h2 id="application-detail-heading">Application details</h2>
          {success && <p className="status status-ok" role="status">{success}</p>}
          <p><strong>Applicant:</strong> {selected.applicant.fullName} ({selected.applicant.email})</p>
          <p><strong>Programme:</strong> {selected.programme?.name ?? 'Unknown programme'} ({selected.programme?.code ?? '—'})</p>
          <p><strong>Academic year:</strong> {selected.academicYear ?? '—'}</p>
          <p><strong>Status:</strong> {statusLabel(selected.status)}</p>
          <p><strong>Personal statement:</strong><br />{selected.personalStatement || 'No personal statement provided.'}</p>
          <div>
            <h3>Education</h3>
            {Array.isArray(selected.education) && selected.education.length > 0
              ? <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(selected.education, null, 2)}</pre>
              : <p>No education details provided.</p>}
          </div>
          {selected.infoRequest && <p><strong>Information requested:</strong> {selected.infoRequest}</p>}
          <div>
            <h3>Supporting documents</h3>
            {selected.documents?.length
              ? <ul>{selected.documents.map((document) => (
                <li key={document.id}>
                  {document.downloadUrl
                    ? <a href={document.downloadUrl} target="_blank" rel="noreferrer">{document.original_filename}</a>
                    : document.original_filename}
                  {' — '}{document.document_type} ({Math.ceil(document.size_bytes / 1024)} KB)
                </li>
              ))}</ul>
              : <p>No supporting documents recorded.</p>}
          </div>
          <div>
            <h3>Status history</h3>
            {selected.statusHistory?.length
              ? <ul>{selected.statusHistory.map((entry, index) => (
                <li key={`${entry.changed_at}-${index}`}>
                  {entry.from_status ? `${statusLabel(entry.from_status)} → ` : ''}{statusLabel(entry.to_status)} — {new Date(entry.changed_at).toLocaleString()}
                </li>
              ))}</ul>
              : <p>No status changes recorded.</p>}
          </div>
          {(nextStatuses[selected.status] ?? []).length > 0 ? (
            <form className="stack" onSubmit={updateStatus}>
              <h3>Update application status</h3>
              <label className="field">New status
                <select value={newStatus} onChange={(event) => setNewStatus(event.target.value)}>
                  {(nextStatuses[selected.status] ?? []).map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                </select>
              </label>
              {newStatus === 'additional_information_required' && (
                <label className="field">Information required
                  <textarea value={infoRequest} onChange={(event) => setInfoRequest(event.target.value)} maxLength={2000} required rows="3" />
                </label>
              )}
              <button className="btn btn-navy" type="submit" disabled={saving || !newStatus}>{saving ? 'Saving…' : 'Update status'}</button>
            </form>
          ) : <p>This application is not currently eligible for another status change.</p>}
        </section>
      )}
    </section>
  );
}
