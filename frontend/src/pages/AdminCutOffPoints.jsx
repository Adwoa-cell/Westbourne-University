import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

const emptyForm = {
  programmeId: '',
  points: '',
  requiredSubjects: '',
  additionalRequirements: '',
};

const validationMessage = (error) => {
  const messages = Object.values(error.fields ?? {});
  return messages.length ? messages.join(' ') : error.message;
};

export default function AdminCutOffPoints() {
  const [records, setRecords] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  const [reloadVersion, setReloadVersion] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError('');

    api.get('/admin/cut-off-points', selectedYearId ? { academicYearId: selectedYearId } : undefined)
      .then((response) => {
        if (!active) return;
        setRecords(response.data);
        setProgrammes(response.programmes);
        setAcademicYears(response.academicYears);
        if (!selectedYearId && response.selectedAcademicYearId) {
          setSelectedYearId(response.selectedAcademicYearId);
        }
      })
      .catch((error) => {
        if (active) setLoadError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [selectedYearId, reloadVersion]);

  const availableProgrammes = useMemo(
    () => programmes.filter((programme) => !records.some((record) => record.programmeId === programme.id)),
    [programmes, records],
  );

  function updateField(event) {
    setForm((previous) => ({ ...previous, [event.target.name]: event.target.value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError('');
  }

  function startEdit(record) {
    setEditingId(record.id);
    setForm({
      programmeId: record.programmeId,
      points: record.points === null ? '' : String(record.points),
      requiredSubjects: record.requiredSubjects.join('\n'),
      additionalRequirements: record.additionalRequirements,
    });
    setFormError('');
    setSuccess('');
  }

  function changeAcademicYear(event) {
    setSelectedYearId(event.target.value);
    resetForm();
    setSuccess('');
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setFormError('');
    setSuccess('');

    const subjects = form.requiredSubjects
      .split(/\r?\n/)
      .map((subject) => subject.trim())
      .filter(Boolean);
    const values = {
      points: form.points === '' ? null : Number(form.points),
      requiredSubjects: subjects,
      additionalRequirements: form.additionalRequirements.trim(),
    };

    try {
      if (editingId) {
        await api.patch(`/admin/cut-off-points/${editingId}`, values);
        setSuccess('Cut-off point record updated.');
      } else {
        await api.post('/admin/cut-off-points', {
          ...values,
          programmeId: form.programmeId,
          academicYearId: selectedYearId,
        });
        setSuccess('Cut-off point record created.');
      }
      resetForm();
      setReloadVersion((version) => version + 1);
    } catch (error) {
      setFormError(validationMessage(error));
    } finally {
      setSaving(false);
    }
  }

  const selectedYear = academicYears.find((year) => year.id === selectedYearId);

  return (
    <section className="container section">
      <Link to="/admin">← Back to Administrator Dashboard</Link>
      <h1>Cut-off Points Management</h1>
      <p>Manage programme cut-off points and entry requirements by academic year.</p>

      <div className="filters">
        <div className="field">
          <label htmlFor="cutoff-academic-year">Academic year</label>
          <select
            id="cutoff-academic-year"
            value={selectedYearId}
            onChange={changeAcademicYear}
            disabled={saving || (loading && academicYears.length === 0)}
          >
            {academicYears.map((year) => (
              <option key={year.id} value={year.id}>{year.label}{year.is_current ? ' (Current)' : ''}</option>
            ))}
          </select>
        </div>
      </div>

      {loadError && <p className="status status-error" role="alert">{loadError}</p>}
      {loading && <p className="status" role="status">Loading cut-off points…</p>}
      {!loading && !loadError && academicYears.length === 0 && (
        <p className="status">No academic years are available. Add an academic year before managing cut-off points.</p>
      )}

      {selectedYearId && !loadError && (
        <>
          <form className="card stack" onSubmit={submit}>
            <h2>{editingId ? 'Edit Cut-off Point' : 'Add Cut-off Point'}</h2>
            <p>{selectedYear ? `Academic year: ${selectedYear.label}` : 'Choose an academic year.'}</p>
            {!editingId && (
              <label className="field" htmlFor="cutoff-programme">Programme *
                <select
                  id="cutoff-programme"
                  name="programmeId"
                  value={form.programmeId}
                  onChange={updateField}
                  required
                  disabled={availableProgrammes.length === 0}
                >
                  <option value="">Select a programme</option>
                  {availableProgrammes.map((programme) => (
                    <option key={programme.id} value={programme.id}>{programme.code} — {programme.name}</option>
                  ))}
                </select>
              </label>
            )}
            {availableProgrammes.length === 0 && !editingId && (
              <p className="status">
                {programmes.length === 0
                  ? 'No active programmes are available.'
                  : 'All active programmes already have cut-off points for this academic year.'}
              </p>
            )}
            {editingId && (
              <p className="meta">
                {records.find((record) => record.id === editingId)?.programme?.code}
                {' — '}
                {records.find((record) => record.id === editingId)?.programme?.name}
              </p>
            )}
            <div className="grid grid-2">
              <label className="field" htmlFor="cutoff-points">Cut-off points
                <input
                  id="cutoff-points"
                  type="number"
                  name="points"
                  min="0"
                  max="100"
                  step="1"
                  value={form.points}
                  onChange={updateField}
                  aria-describedby="cutoff-points-help"
                />
                <span id="cutoff-points-help" className="meta">Enter a whole number from 0 to 100, or leave blank if not applicable.</span>
              </label>
              <label className="field" htmlFor="cutoff-subjects">Required subjects
                <textarea
                  id="cutoff-subjects"
                  name="requiredSubjects"
                  value={form.requiredSubjects}
                  onChange={updateField}
                  maxLength="2019"
                  rows="4"
                  aria-describedby="cutoff-subjects-help"
                />
                <span id="cutoff-subjects-help" className="meta">Enter one subject per line. Leave blank if not applicable.</span>
              </label>
            </div>
            <label className="field" htmlFor="cutoff-additional">Additional entry requirements
              <textarea
                id="cutoff-additional"
                name="additionalRequirements"
                value={form.additionalRequirements}
                onChange={updateField}
                maxLength="4000"
                rows="4"
              />
            </label>
            {formError && <p className="status status-error" role="alert">{formError}</p>}
            {success && <p className="status status-ok" role="status">{success}</p>}
            <div className="button-row">
              <button
                className="btn btn-navy"
                type="submit"
                disabled={saving || (!editingId && availableProgrammes.length === 0)}
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Add Cut-off Points'}
              </button>
              {editingId && (
                <button className="btn btn-outline" type="button" disabled={saving} onClick={resetForm}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          <h2 style={{ marginTop: '3rem' }}>
            {selectedYear ? `${selectedYear.label} Records` : 'Cut-off Point Records'} ({records.length})
          </h2>
          {!loading && records.length === 0 && !loadError && (
            <p>No cut-off point records exist for this academic year yet. Use the form above to add one.</p>
          )}
          {!loading && records.length > 0 && (
            <div className="table-wrap admin-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Programme</th>
                    <th>Cut-off points</th>
                    <th>Required subjects</th>
                    <th>Additional entry requirements</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((record) => (
                    <tr key={record.id}>
                      <td data-label="Programme">
                        <strong>{record.programme?.name ?? 'Unknown programme'}</strong>
                        <span className="meta block">{record.programme?.code} · {record.programme?.qualification}</span>
                      </td>
                      <td data-label="Cut-off points">{record.points ?? 'Not applicable'}</td>
                      <td data-label="Required subjects">{record.requiredSubjects.length ? record.requiredSubjects.join(', ') : 'Not applicable'}</td>
                      <td data-label="Additional entry requirements">{record.additionalRequirements || '—'}</td>
                      <td data-label="Actions">
                        <button className="btn btn-outline" type="button" onClick={() => startEdit(record)} disabled={saving || loading}>
                          Edit
                        </button>
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
