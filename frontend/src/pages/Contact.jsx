import { useState } from 'react';
import PageHeader from '../components/PageHeader.jsx';
import { api } from '../api/client.js';
import { site } from '../config/site.js';
import { usePageTitle } from '../hooks/usePageTitle.js';

const empty = { name: '', email: '', subject: '', message: '', website: '' };

export default function Contact() {
  usePageTitle('Contact us');
  const [form, setForm] = useState(empty);
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');
  const [fields, setFields] = useState({});

  const update = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setStatus('sending');
    setError('');
    setFields({});
    try {
      await api.post('/contact', form);
      setForm(empty);
      setStatus('sent');
    } catch (err) {
      setFields(err.fields ?? {});
      setError(err.message);
      setStatus('error');
    }
  };

  const fieldError = (name) => fields[name] && <span className="field-error" id={`${name}-error`}>{fields[name]}</span>;
  const aria = (name) => ({ 'aria-invalid': fields[name] ? 'true' : undefined, 'aria-describedby': fields[name] ? `${name}-error` : undefined });

  return (
    <>
      <PageHeader title="Contact us" intro="Send a message to the university. We aim to reply within three working days." />
      <section className="section">
        <div className="container split split-wide">
          <form onSubmit={submit} noValidate className="form" aria-label="Contact form">
            <div className="field">
              <label htmlFor="name">Full name</label>
              <input id="name" name="name" autoComplete="name" required minLength={2} maxLength={100} value={form.name} onChange={update} {...aria('name')} />
              {fieldError('name')}
            </div>
            <div className="field">
              <label htmlFor="email">Email address</label>
              <input id="email" name="email" type="email" autoComplete="email" required maxLength={254} value={form.email} onChange={update} {...aria('email')} />
              {fieldError('email')}
            </div>
            <div className="field">
              <label htmlFor="subject">Subject</label>
              <input id="subject" name="subject" required minLength={3} maxLength={150} value={form.subject} onChange={update} {...aria('subject')} />
              {fieldError('subject')}
            </div>
            <div className="field">
              <label htmlFor="message">Message</label>
              <textarea id="message" name="message" rows={6} required minLength={10} maxLength={2000} value={form.message} onChange={update} {...aria('message')} />
              {fieldError('message')}
            </div>
            {/* Honeypot field: hidden from people, tempting to bots. */}
            <div className="hp" aria-hidden="true">
              <label htmlFor="website">Leave this field empty</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update} />
            </div>
            <button type="submit" className="btn btn-navy" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending...' : 'Send message'}
            </button>
            <div aria-live="polite">
              {status === 'sent' && <p className="status status-ok">Thank you. Your message has been received.</p>}
              {status === 'error' && <p className="status status-error">{error}</p>}
            </div>
          </form>

          <aside className="card contact-card">
            <h2>University contact</h2>
            <address>
              {site.address.map((l) => (<span key={l}>{l}<br /></span>))}
              <br />
              <a href={`mailto:${site.email}`}>{site.email}</a><br />
              <a href={`tel:${site.phone.replace(/\s/g, '')}`}>{site.phone}</a>
            </address>
            <p className="meta">These are placeholders until official details are available.</p>
            <h3>Follow us</h3>
            <ul>
              {site.social.map((s) => (<li key={s.label}><a href={s.href} target="_blank" rel="noopener noreferrer">{s.label}</a></li>))}
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
