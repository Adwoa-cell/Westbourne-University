import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

const emptyForm = {
  code: '',
  name: '',
  facultyId: '',
  qualification: 'Bachelor',
  durationMonths: '48',
  studyMode: 'Full-time',
  description: '',
  entryRequirements: '',
  isFeatured: false,
  isActive: true,
};

const fieldClass = 'field';

export default function AdminProgrammes() {
  const [programmes, setProgrammes] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [changingStatusId, setChangingStatusId] = useState(null);

  async function loadProgrammes() {
    const response = await api.get('/admin/programmes');
    setProgrammes(response.data);
  }

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/admin/programmes'), api.get('/admin/faculties')])
      .then(([programmeResponse, facultyResponse]) => {
        if (!active) return;
        setProgrammes(programmeResponse.data);
        setFaculties(facultyResponse.data);
      })
      .catch((err) => {
        if (active) setError(err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  function startCreate() {
    setForm({ ...emptyForm });
    setEditingId(null);
    setFormError('');
    setFieldErrors({});
    setSuccess('');
    setShowForm(true);
  }

  function startEdit(programme) {
    setForm({
      code: programme.code,
      name: programme.name,
      facultyId: programme.facultyId,
      qualification: programme.qualification,
      durationMonths: String(programme.durationMonths),
      studyMode: programme.studyMode,
      description: programme.description,
      entryRequirements: programme.entryRequirements,
      isFeatured: programme.isFeatured,
      isActive: programme.isActive,
    });
    setEditingId(programme.id);
    setFormError('');
    setFieldErrors({});
    setSuccess('');
    setShowForm(true);
  }

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
    setFieldErrors((previous) => ({ ...previous, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    setFieldErrors({});
    setError('');
    setSuccess('');
    const payload = {
      ...form,
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      durationMonths: Number(form.durationMonths),
      studyMode: form.studyMode.trim(),
      description: form.description.trim(),
      entryRequirements: form.entryRequirements.trim(),
    };
    try {
      if (editingId) {
        await api.patch(`/admin/programmes/${editingId}`, payload);
        setSuccess('Programme updated successfully.');
      } else {
        await api.post('/admin/programmes', payload);
        setSuccess('Programme created successfully.');
      }
      setShowForm(false);
      try {
        await loadProgrammes();
      } catch (refreshError) {
        setError(`Programme saved, but the list could not refresh: ${refreshError.message}`);
      }
    } catch (err) {
      if (err.fields) {
        setFormError('Please correct the highlighted programme details.');
        setFieldErrors(err.fields);
      } else if (showForm) {
        setFormError(err.message);
      } else {
        setError(`The change was saved, but the list could not refresh: ${err.message}`);
      }
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(programme) {
    setChangingStatusId(programme.id);
    setSuccess('');
    setError('');
    try {
      await api.patch(`/admin/programmes/${programme.id}/status`, { isActive: !programme.isActive });
      setSuccess(`Programme ${programme.isActive ? 'deactivated' : 'activated'} successfully.`);
      await loadProgrammes();
    } catch (err) {
      setError(err.message);
    } finally {
      setChangingStatusId(null);
    }
  }

  return (
    <section className="container section">
      <Link to="/admin">← Back to Administrator Dashboard</Link>
      <h1>Programmes Management</h1>
      <p>Manage Westbourne University academic programmes and faculty assignments.</p>

      <p className="button-row">
        <button className="btn btn-navy" type="button" onClick={startCreate} disabled={loading || faculties.length === 0}>
          + Add Programme
        </button>
      </p>
      {success && <p className="status status-ok" role="status">{success}</p>}
      {error && <p className="status status-error" role="alert">{error}</p>}
      {faculties.length === 0 && !loading && !error && (
        <p className="status">No faculties are available. Add a faculty before creating a programme.</p>
      )}

      {showForm && (
        <form className="card stack" onSubmit={handleSubmit} noValidate>
          <h2>{editingId ? 'Edit Programme' : 'Add New Programme'}</h2>
          {formError && <p className="status status-error" role="alert">{formError}</p>}
          <div className="grid grid-2">
            <label className={fieldClass}>Programme Code *
              <input name="code" value={form.code} onChange={updateField} required maxLength={20} aria-invalid={Boolean(fieldErrors.code)} />
              {fieldErrors.code && <small className="field-error">{fieldErrors.code}</small>}
            </label>
            <label className={fieldClass}>Programme Name *
              <input name="name" value={form.name} onChange={updateField} required maxLength={200} aria-invalid={Boolean(fieldErrors.name)} />
              {fieldErrors.name && <small className="field-error">{fieldErrors.name}</small>}
            </label>
            <label className={fieldClass}>Faculty *
              <select name="facultyId" value={form.facultyId} onChange={updateField} required aria-invalid={Boolean(fieldErrors.facultyId)}>
                <option value="">Select a faculty</option>
                {faculties.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name} ({faculty.code})</option>)}
              </select>
              {fieldErrors.facultyId && <small className="field-error">{fieldErrors.facultyId}</small>}
            </label>
            <label className={fieldClass}>Qualification *
              <select name="qualification" value={form.qualification} onChange={updateField}>
                {['Certificate', 'Diploma', 'Bachelor', 'Master'].map((value) => <option key={value}>{value}</option>)}
              </select>
            </label>
            <label className={fieldClass}>Duration (months) *
              <input type="number" name="durationMonths" value={form.durationMonths} onChange={updateField} min="1" max="120" required />
            </label>
            <label className={fieldClass}>Study Mode *
              <input name="studyMode" value={form.studyMode} onChange={updateField} maxLength={100} required />
            </label>
          </div>
          <label className={fieldClass}>Description
            <textarea name="description" value={form.description} onChange={updateField} maxLength={5000} rows="3" />
          </label>
          <label className={fieldClass}>Entry Requirements
            <textarea name="entryRequirements" value={form.entryRequirements} onChange={updateField} maxLength={5000} rows="3" />
          </label>
          <label><input type="checkbox" name="isFeatured" checked={form.isFeatured} onChange={updateField} /> Feature this programme</label>
          <label><input type="checkbox" name="isActive" checked={form.isActive} onChange={updateField} /> Programme is active</label>
          <div className="button-row">
            <button className="btn btn-navy" type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save Programme'}</button>
            <button className="btn btn-outline" type="button" disabled={saving} onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}

      {loading && <p className="status" role="status">Loading programmes…</p>}
      {!loading && !error && (
        <>
          <h2>Academic Programmes ({programmes.length})</h2>
          {programmes.length === 0 ? <p>No programmes found in the database.</p> : (
            <div className="table-wrap admin-table-wrap">
              <table>
                <thead><tr><th>Code</th><th>Programme</th><th>Faculty</th><th>Qualification</th><th>Duration</th><th>Status</th><th>Actions</th></tr></thead>
                <tbody>
                  {programmes.map((programme) => (
                    <tr key={programme.id}>
                      <td data-label="Code">{programme.code}</td><td data-label="Programme">{programme.name}</td><td data-label="Faculty">{programme.facultyName ?? 'Unassigned'}</td>
                      <td data-label="Qualification">{programme.qualification}</td><td data-label="Duration">{programme.durationMonths} months</td>
                      <td data-label="Status">{programme.isActive ? 'Active' : 'Inactive'}</td>
                      <td data-label="Actions">
                        <div className="button-row">
                          <button className="btn btn-outline" type="button" onClick={() => startEdit(programme)}>Edit</button>
                          <button className="btn btn-outline" type="button" disabled={changingStatusId === programme.id} onClick={() => toggleActive(programme)}>
                            {changingStatusId === programme.id ? 'Saving…' : programme.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
