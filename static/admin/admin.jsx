// admin.jsx — Aadhavan admin panel (single-file React SPA via CDN)

const { useState, useEffect, useCallback } = React;

// ─── API helper ─────────────────────────────────────────────────────────────

const api = async (path, opts = {}) => {
  const res = await fetch(path, {
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  if (res.status === 401) {
    window.location.hash = '#login';
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
};

// ─── Root app ───────────────────────────────────────────────────────────────

function AdminApp() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState('dashboard');

  useEffect(() => {
    api('/api/auth/session')
      .then(data => setUser(data.authenticated ? data.user : null))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ padding: 40 }}>Loading…</div>;
  if (!user) return <Login onLogin={setUser}/>;

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  };

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand">
          <div className="mark">AADHAVAN</div>
          <div className="sub">Admin Panel</div>
        </div>
        {[
          { k: 'dashboard', label: 'Dashboard' },
          { k: 'inquiries', label: 'Inquiries' },
          { k: 'calendar', label: 'Calendar' },
          { k: 'photos', label: 'Photos' },
          { k: 'messages', label: 'Messages' },
        ].map(nav => (
          <button key={nav.k} className={`nav-item ${page === nav.k ? 'active' : ''}`} onClick={() => setPage(nav.k)}>
            {nav.label}
          </button>
        ))}
        <button className="logout" onClick={logout}>Logout</button>
      </aside>

      <main className="admin-main">
        <div className="admin-topbar">
          <h1>Welcome back, {user.name}</h1>
          <div className="date">{new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        {page === 'dashboard' && <Dashboard onNavigate={setPage}/>}
        {page === 'inquiries' && <InquiriesPage/>}
        {page === 'calendar' && <CalendarPage/>}
        {page === 'photos' && <PhotosPage/>}
        {page === 'messages' && <MessagesPage/>}
      </main>
    </div>
  );
}

// ─── Login page ─────────────────────────────────────────────────────────────

function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-shell">
      <div className="login-card">
        <div className="brand">
          <div className="mark">AADHAVAN</div>
          <div className="sub">Owner Dashboard</div>
        </div>
        <form onSubmit={submit}>
          <label>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus/>
          <label>Password</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} required/>
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
          {error && <div className="error">{error}</div>}
          <div className="hint">Default: owner@aadhavan.com / aadhavan2025</div>
        </form>
      </div>
    </div>
  );
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

function Dashboard({ onNavigate }) {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([
      api('/api/admin/stats'),
      api('/api/admin/inquiries'),
    ]).then(([s, inqs]) => {
      setStats(s);
      setRecent((inqs.inquiries || []).slice(0, 5));
    }).catch(err => setError(err.message));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <div className="panel">Error: {error}</div>;
  if (!stats) return <div className="panel">Loading…</div>;

  const delta = stats.changePercent;

  return (
    <>
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="label">Inquiries This Month</div>
          <div className="number">{stats.thisMonth.inquiries}</div>
          <div className={`delta ${delta >= 0 ? 'up' : 'down'}`}>
            {delta >= 0 ? '↑' : '↓'} {Math.abs(delta)}% vs last month
          </div>
        </div>
        <div className="stat-card success">
          <div className="label">Confirmed Events</div>
          <div className="number">{stats.thisMonth.confirmed}</div>
          <div className="delta">this month</div>
        </div>
        <div className="stat-card error">
          <div className="label">Blocked Dates</div>
          <div className="number">{stats.blockedDatesCount}</div>
          <div className="delta">total</div>
        </div>
        <div className="stat-card olive">
          <div className="label">Gallery Photos</div>
          <div className="number">{stats.totalPhotos}</div>
          <div className="delta">uploaded</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>Recent Inquiries</h2>
          <button className="admin-btn ghost" onClick={() => onNavigate('inquiries')}>View All →</button>
        </div>
        {recent.length === 0 ? (
          <div className="empty-state">No inquiries yet. Submit one from the public site to test the flow.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th><th>Event</th><th>Date</th><th>Received</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(r => (
                <tr key={r.id}>
                  <td>{r.fullName}<div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.phone}</div></td>
                  <td>{r.serviceType || r.eventType}</td>
                  <td>{r.eventDate}</td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleString()}</td>
                  <td><span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {stats.popularEventTypes.length > 0 && (
        <div className="panel">
          <h2>Popular Event Types</h2>
          <div style={{ marginTop: 12 }}>
            {stats.popularEventTypes.map(pt => {
              const max = Math.max(...stats.popularEventTypes.map(x => x.count));
              const pct = max ? (pt.count / max) * 100 : 0;
              return (
                <div key={pt.type} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 120, fontSize: 12, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-taupe)' }}>{pt.type}</div>
                  <div style={{ flex: 1, background: 'var(--bg-blush)', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: 'var(--accent-rose-gold)' }}/>
                  </div>
                  <div style={{ width: 40, textAlign: 'right', fontSize: 13 }}>{pt.count}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Inquiries page ─────────────────────────────────────────────────────────

function InquiriesPage() {
  const [inqs, setInqs] = useState([]);
  const [status, setStatus] = useState('ALL');
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const url = status === 'ALL' ? '/api/admin/inquiries' : `/api/admin/inquiries?status=${status}`;
    api(url)
      .then(data => setInqs(data.inquiries || []))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <div className="admin-filter-bar">
        {['ALL', 'PENDING', 'CONFIRMED', 'CLOSED'].map(s => (
          <button key={s} className={`pill ${status === s ? 'active' : ''}`} onClick={() => setStatus(s)}>{s}</button>
        ))}
      </div>

      <div className="panel">
        {loading ? <div className="empty-state">Loading…</div>
          : inqs.length === 0 ? <div className="empty-state">No inquiries in this category.</div>
          : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th><th>Phone</th><th>Service</th><th>Event Date</th><th>Received</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {inqs.map(r => (
                  <tr key={r.id} onClick={() => setSelected(r)} style={{ cursor: 'pointer' }}>
                    <td><strong>{r.fullName}</strong></td>
                    <td>{r.phone}</td>
                    <td>{r.serviceType || r.eventType}</td>
                    <td>{r.eventDate}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td><span className={`badge ${r.status.toLowerCase()}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        }
      </div>

      {selected && <InquiryDrawer inquiry={selected} onClose={() => { setSelected(null); load(); }}/>}
    </>
  );
}

function InquiryDrawer({ inquiry, onClose }) {
  const [status, setStatus] = useState(inquiry.status);
  const [notes, setNotes] = useState(inquiry.ownerNotes || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await api(`/api/admin/inquiries/${inquiry.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status, ownerNotes: notes }),
      });
      onClose();
    } catch (err) {
      alert(err.message);
      setSaving(false);
    }
  };

  const del = async () => {
    if (!confirm('Delete this inquiry? This cannot be undone.')) return;
    try {
      await api(`/api/admin/inquiries/${inquiry.id}`, { method: 'DELETE' });
      onClose();
    } catch (err) {
      alert(err.message);
    }
  };

  const waLink = `https://wa.me/${inquiry.phone.replace(/[^\d]/g, '')}?text=${encodeURIComponent(`Hi ${inquiry.fullName}, thanks for your inquiry about ${inquiry.serviceType || inquiry.eventType} on ${inquiry.eventDate}.`)}`;
  const telLink = `tel:${inquiry.phone}`;

  return (
    <>
      <div className="drawer-backdrop" onClick={onClose}/>
      <div className="drawer">
        <h3>{inquiry.fullName}</h3>
        <div className="meta-row"><span className="k">Phone</span><span>{inquiry.phone}</span></div>
        {inquiry.email && <div className="meta-row"><span className="k">Email</span><span>{inquiry.email}</span></div>}
        <div className="meta-row"><span className="k">Service</span><span>{inquiry.serviceType || '—'}</span></div>
        <div className="meta-row"><span className="k">Event Type</span><span>{inquiry.eventType}</span></div>
        <div className="meta-row"><span className="k">Event Date</span><span>{inquiry.eventDate}</span></div>
        {inquiry.guestCount && <div className="meta-row"><span className="k">Guests</span><span>{inquiry.guestCount}</span></div>}
        {inquiry.venue && <div className="meta-row"><span className="k">Venue</span><span>{inquiry.venue}</span></div>}
        <div className="meta-row"><span className="k">Submitted</span><span>{new Date(inquiry.createdAt).toLocaleString()}</span></div>

        {inquiry.message && (
          <div style={{ marginTop: 20 }}>
            <div className="k" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', marginBottom: 8 }}>Requirements</div>
            <div style={{ padding: 14, background: 'var(--bg-blush)', borderRadius: 4, fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{inquiry.message}</div>
          </div>
        )}

        <div style={{ marginTop: 24 }}>
          <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)}>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Private Notes</label>
          <textarea rows="4" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Owner notes (not visible to client)"/>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <a href={telLink} className="admin-btn ghost" style={{ textDecoration: 'none' }}>Call</a>
          <a href={waLink} target="_blank" className="admin-btn ghost" style={{ textDecoration: 'none' }}>WhatsApp</a>
        </div>

        <div className="actions">
          <button className="admin-btn primary" onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
          <button className="admin-btn ghost" onClick={onClose}>Cancel</button>
          <button className="admin-btn danger" onClick={del} style={{ marginLeft: 'auto' }}>Delete</button>
        </div>
      </div>
    </>
  );
}

// ─── Calendar page ──────────────────────────────────────────────────────────

function CalendarPage() {
  const [blocked, setBlocked] = useState([]);
  const [dateInput, setDateInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api('/api/admin/calendar')
      .then(data => setBlocked(data.blockedDates || []))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => { load(); }, [load]);

  const block = async () => {
    if (!dateInput) return;
    setSaving(true);
    setError('');
    try {
      await api('/api/admin/calendar/block', {
        method: 'POST',
        body: JSON.stringify({ date: dateInput, note: noteInput || null }),
      });
      setDateInput(''); setNoteInput('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const unblock = async (id) => {
    if (!confirm('Unblock this date?')) return;
    try {
      await api(`/api/admin/calendar/block/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="panel">
      <h2>Calendar Manager</h2>
      <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
        Dates you block here are immediately shown as unavailable on the public Book Now page.
      </p>

      <div className="admin-calendar-layout">
        <div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>Date to block</label>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)}
                     style={{ padding: 10, border: '1px solid var(--border-peach)', borderRadius: 4, background: 'var(--bg-blush)', flex: '0 0 180px' }}/>
              <input type="text" placeholder="Optional note (private)" value={noteInput} onChange={e => setNoteInput(e.target.value)}
                     style={{ padding: 10, border: '1px solid var(--border-peach)', borderRadius: 4, background: 'var(--bg-blush)', flex: 1 }}/>
              <button className="admin-btn primary" onClick={block} disabled={saving || !dateInput}>
                {saving ? 'Saving…' : 'Block'}
              </button>
            </div>
            {error && <div style={{ color: 'var(--error-dusty-rose)', fontSize: 13, marginTop: 8 }}>{error}</div>}
          </div>
        </div>

        <div>
          <h3 style={{ fontFamily: 'var(--ff-serif)', fontSize: 18, marginBottom: 12 }}>Blocked Dates</h3>
          <div className="blocked-list">
            {blocked.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}>No dates blocked yet.</div>
            ) : (
              blocked.map(b => (
                <div key={b.id} className="blocked-list-item">
                  <div>
                    <div><strong>{b.date}</strong></div>
                    {b.note && <div className="note">{b.note}</div>}
                  </div>
                  <button className="admin-btn danger" style={{ padding: '4px 10px', fontSize: 10 }} onClick={() => unblock(b.id)}>Unblock</button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Photos page ────────────────────────────────────────────────────────────

function PhotosPage() {
  const [photos, setPhotos] = useState([]);
  const [category, setCategory] = useState('OTHER');
  const [name, setName] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const CATS = ['MANDAP','SANGEET','HALDI','RECEPTION','MEHNDI','BIRTHDAY','CORPORATE','OTHER'];

  const load = useCallback(() => {
    api('/api/admin/photos')
      .then(data => setPhotos(data.photos || []))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => { load(); }, [load]);

  const upload = async (e) => {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      if (name) fd.append('name', name);
      const res = await fetch('/api/admin/photos/upload', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }));
        throw new Error(err.error);
      }
      setFile(null);
      setName('');
      // Reset file input
      const fileInput = document.querySelector('input[type=file]');
      if (fileInput) fileInput.value = '';
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this photo? It will be removed from the public gallery.')) return;
    try {
      await api(`/api/admin/photos/${id}`, { method: 'DELETE' });
      load();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="panel">
      <h2>Gallery Photos</h2>

      <form className="upload-zone" onSubmit={upload}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 8 }}>Upload a new photo (JPG/PNG/WebP, max 12MB)</div>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={e => setFile(e.target.files[0])}/>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
          <input type="text" placeholder="Name (optional)" value={name} onChange={e => setName(e.target.value)}
                 style={{ padding: 8, border: '1px solid var(--border-peach)', borderRadius: 4, background: '#fff' }}/>
          <select value={category} onChange={e => setCategory(e.target.value)}>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <button type="submit" className="admin-btn primary" disabled={uploading || !file}>
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
        {error && <div style={{ color: 'var(--error-dusty-rose)', fontSize: 13, marginTop: 10 }}>{error}</div>}
      </form>

      {photos.length === 0 ? (
        <div className="empty-state">No photos uploaded yet. The public gallery shows demo placeholders until you upload.</div>
      ) : (
        <div className="photo-admin-grid">
          {photos.map(p => (
            <div key={p.id} className="photo-admin-item">
              <img src={p.url} alt={p.altText || p.name}/>
              <div className="overlay">
                <span>{p.category}</span>
                <button className="del" onClick={() => del(p.id)} title="Delete">×</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Messages page ──────────────────────────────────────────────────────────

function MessagesPage() {
  const [messages, setMessages] = useState([]);

  const load = useCallback(() => {
    api('/api/admin/messages')
      .then(data => setMessages(data.messages || []))
      .catch(err => console.error(err));
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleRead = async (m) => {
    try {
      await api(`/api/admin/messages/${m.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ isRead: !m.isRead }),
      });
      load();
    } catch (err) { alert(err.message); }
  };

  const del = async (id) => {
    if (!confirm('Delete this message?')) return;
    try {
      await api(`/api/admin/messages/${id}`, { method: 'DELETE' });
      load();
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="panel">
      <h2>Contact Messages</h2>
      {messages.length === 0 ? (
        <div className="empty-state">No messages yet.</div>
      ) : (
        <div>
          {messages.map(m => (
            <div key={m.id} style={{
              padding: '16px 0',
              borderBottom: '1px solid var(--border-peach)',
              opacity: m.isRead ? 0.6 : 1,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <strong>{m.name}</strong>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{new Date(m.createdAt).toLocaleString()}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-taupe)', marginBottom: 6 }}>
                {m.email}{m.phone ? ` · ${m.phone}` : ''}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.6, padding: 12, background: 'var(--bg-blush)', borderRadius: 4, whiteSpace: 'pre-wrap' }}>{m.message}</div>
              <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                <button className="admin-btn ghost" onClick={() => toggleRead(m)}>{m.isRead ? 'Mark Unread' : 'Mark Read'}</button>
                <button className="admin-btn danger" onClick={() => del(m.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<AdminApp/>);
