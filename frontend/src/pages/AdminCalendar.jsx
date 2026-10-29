import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';

const eventTypes = ['semester', 'registration', 'examination', 'holiday', 'event', 'deadline'];
const emptyForm = {
  title: '',
  description: '',
  location: '',
  eventType: 'event',
  startsOn: '',
  endsOn: '',
  isPublic: true,
};

export default function AdminCalendar() {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function loadEvents() {
    const response = await api.get('/admin/calendar-events');
    setEvents(response.data);
  }

  useEffect(() => {
    let active = true;
    api.get('/admin/calendar-events')
      .then((response) => { if (active) setEvents(response.data); })
      .catch((err) => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }));
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title,
      description: item.description,
      location: item.location,
      eventType: item.eventType,
      startsOn: item.startsOn,
      endsOn: item.endsOn ?? '',
      isPublic: item.isPublic,
    });
    setError('');
    setSuccess('');
  }

  function cancelEdit() {
    setEditingId(null);
    setForm({ ...emptyForm });
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    const payload = {
      ...form,
      title: form.title.trim(),
      description: form.description.trim(),
      location: form.location.trim(),
      endsOn: form.endsOn || null,
    };
    try {
      if (editingId) {
        await api.patch(`/admin/calendar-events/${editingId}`, payload);
        setSuccess('Calendar event updated.');
      } else {
        await api.post('/admin/calendar-events', payload);
        setSuccess('Calendar event created.');
      }
      cancelEdit();
      try {
        await loadEvents();
      } catch (refreshError) {
        setError(`Event saved, but the calendar could not refresh: ${refreshError.message}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="container section">
      <Link to="/admin">← Back to Administrator Dashboard</Link>
      <h1>Calendar Management</h1>
      <p>Create, update and view university events.</p>

      <form className="card stack" onSubmit={submit}>
        <h2>{editingId ? 'Edit Calendar Event' : 'Create Calendar Event'}</h2>
        <div className="grid grid-2">
          <label className="field">Event title *
            <input name="title" value={form.title} onChange={updateField} minLength="3" maxLength="200" required />
          </label>
          <label className="field">Event type *
            <select name="eventType" value={form.eventType} onChange={updateField}>
              {eventTypes.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}
            </select>
          </label>
          <label className="field">Starts on *
            <input type="date" name="startsOn" value={form.startsOn} onChange={updateField} required />
          </label>
          <label className="field">Ends on
            <input type="date" name="endsOn" value={form.endsOn} onChange={updateField} min={form.startsOn || undefined} />
          </label>
          <label className="field">Location
            <input name="location" value={form.location} onChange={updateField} maxLength="200" />
          </label>
        </div>
        <label className="field">Description
          <textarea name="description" value={form.description} onChange={updateField} maxLength="4000" rows="4" />
        </label>
        <label><input type="checkbox" name="isPublic" checked={form.isPublic} onChange={updateField} /> Show this event publicly</label>
        {error && <p className="status status-error" role="alert">{error}</p>}
        {success && <p className="status status-ok" role="status">{success}</p>}
        <div className="button-row">
          <button className="btn btn-navy" type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Event'}</button>
          {editingId && <button className="btn btn-outline" type="button" disabled={saving} onClick={cancelEdit}>Cancel</button>}
        </div>
      </form>

      <h2 style={{ marginTop: '3rem' }}>University Events ({events.length})</h2>
      {loading && <p className="status" role="status">Loading events…</p>}
      {!loading && events.length === 0 && !error && <p>No calendar events have been added.</p>}
      {!loading && events.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Title</th><th>Type</th><th>Date</th><th>Location</th><th>Visibility</th><th>Actions</th></tr></thead>
            <tbody>
              {events.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.title}</strong><br />{item.description || 'No description'}</td>
                  <td>{item.eventType}</td>
                  <td>{item.startsOn}{item.endsOn && item.endsOn !== item.startsOn ? ` – ${item.endsOn}` : ''}</td>
                  <td>{item.location || '—'}</td>
                  <td>{item.isPublic ? 'Public' : 'Private'}</td>
                  <td><button className="btn btn-outline" type="button" onClick={() => startEdit(item)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
