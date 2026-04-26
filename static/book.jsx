// book.jsx — Book Now page with calendar + inquiry modal

function BookNow() {
  const [step, setStep] = React.useState(1);
  const [serviceType, setServiceType] = React.useState(null);
  const [selected, setSelected] = React.useState(null);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const openInquiry = (d) => {
    setSelected(d);
    setModalOpen(true);
    setSubmitted(false);
  };
  const closeModal = () => {
    setModalOpen(false);
    setTimeout(() => { setSubmitted(false); }, 400);
  };

  const pickService = (s) => { setServiceType(s); setStep(2); };

  return (
    <div>
      <section className="bn-header">
        <div className="container">
          <div className="eyebrow" style={{ color: 'var(--accent-olive)', marginBottom: 12 }}>Book Now</div>
          <h1>{step === 1 ? 'What are you looking for?' : 'Check Our Availability'}</h1>
          <p style={{ marginTop: 12, fontSize: 16, maxWidth: 580, margin: '12px auto 0' }}>
            {step === 1
              ? 'Let us know how we can help, and we\'ll guide you to the right next step.'
              : `You're inquiring about ${serviceType}. Click any open date to begin.`}
          </p>
          {step === 2 && (
            <div className="legend">
              <div className="legend-item"><span className="legend-dot avail"/>Available</div>
              <div className="legend-item"><span className="legend-dot booked"/>Booked</div>
              <div className="legend-item"><span className="legend-dot past"/>Past</div>
              <div className="legend-item"><span className="legend-dot today"/>Today</div>
            </div>
          )}
          {step === 2 && (
            <button className="arrow-link" style={{ marginTop: 20, background: 'none', border: 0, cursor: 'pointer' }} onClick={() => setStep(1)}>← Change selection</button>
          )}
        </div>
      </section>

      {step === 1 ? (
        <section style={{ padding: '20px 0 120px' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <div className="service-picker">
              <FadeUp>
                <button className="service-option" onClick={() => pickService('Rent Decor Items')}>
                  <div className="so-icon">{Icon.marigold(48)}</div>
                  <h3>Rent Decor Items</h3>
                  <p>Browse & rent individual pieces — mandap frames, florals, lighting, drapes, and more for your own setup.</p>
                  <span className="so-cta">Continue →</span>
                </button>
              </FadeUp>
              <FadeUp delay={120}>
                <button className="service-option" onClick={() => pickService('Full Event Management')}>
                  <div className="so-icon">{Icon.mandap(48)}</div>
                  <h3>Full Event Management</h3>
                  <p>End-to-end styling, coordination, and day-of execution. We handle every detail so you can simply live the moment.</p>
                  <span className="so-cta">Continue →</span>
                </button>
              </FadeUp>
            </div>
          </div>
        </section>
      ) : (
        <section style={{ padding: '0 0 120px' }}>
          <div className="container">
            <CalendarView large onPick={openInquiry} selectedDate={selected}/>
          </div>
        </section>
      )}

      {modalOpen && (
        <InquiryModal
          date={selected}
          serviceType={serviceType}
          submitted={submitted}
          onSubmit={() => setSubmitted(true)}
          onClose={closeModal}
        />
      )}
    </div>
  );
}

function InquiryModal({ date, serviceType, submitted, onSubmit, onClose }) {
  const [form, setForm] = React.useState({
    name: '', phone: '', requirements: ''
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const update = (k, v) => { setError(''); setForm(f => ({ ...f, [k]: v })); };

  // Map the prototype's service strings to the backend's EventType enum.
  const serviceToEventType = (s) => {
    // Keep it simple — everything falls back to OTHER; the free-text message
    // carries the real service intent. This matches the prototype's UX where
    // service is the top-level pick, not the event occasion.
    return 'OTHER';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: form.name,
          phone: '+91' + form.phone,
          eventType: serviceToEventType(serviceType),
          eventDate: fmtLocalDate(date),
          serviceType: serviceType,
          message: form.requirements,
          contactMethod: 'WHATSAPP',
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      setLoading(false);
      window.dispatchEvent(new Event('calendar-refresh'));
      onSubmit();
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  const dateStr = date ? date.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : '';

  return (
    <div className="modal-backdrop open" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">{Icon.x(22)}</button>

        {!submitted ? (
          <>
            <div className="eyebrow">New Inquiry · {serviceType}</div>
            <h2>Inquiry for<br/><span className="date-chip">{dateStr}</span></h2>

            <form onSubmit={submit} style={{ marginTop: 24 }}>
              <Field label="Name" value={form.name} onChange={v => update('name', v)} required/>
              <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: 16 }}>
                <Field label="Code" value="+91" onChange={()=>{}} readOnly/>
                <Field label="Phone Number" value={form.phone} onChange={v => update('phone', v.replace(/[^0-9]/g, '').slice(0,10))} type="tel" required/>
              </div>

              <div className="field filled">
                <input value={dateStr} readOnly placeholder=" "/>
                <label>Event Date</label>
              </div>

              <div className="field" style={{ marginTop: 28 }}>
                <textarea value={form.requirements} onChange={e => update('requirements', e.target.value)} placeholder=" " rows="4" required/>
                <label>Requirements</label>
                <span className="underline"/>
                <span className="sub-hint">Themes, colors, items needed, guest count, venue — anything we should know.</span>
              </div>

              {error && (
                <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(196,122,122,0.12)', border: '1px solid rgba(196,122,122,0.35)', borderRadius: 4, color: 'var(--error-dusty-rose)', fontSize: 13 }}>
                  {error}
                </div>
              )}

              <button type="submit" className="btn btn-primary submit-full" disabled={loading}>
                {loading ? <Spinner/> : 'Send My Inquiry'}
              </button>
            </form>
          </>
        ) : (
          <ThankYou date={dateStr} onClose={onClose}/>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type='text', required=false, readOnly=false, hint=null }) {
  const filled = value && String(value).length > 0;
  return (
    <div className={`field ${filled ? 'filled' : ''}`}>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} required={required} readOnly={readOnly} placeholder=" "/>
      <label>{label}</label>
      <span className="underline"/>
      {hint && <span className="sub-hint">{hint}</span>}
    </div>
  );
}

function Spinner() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'rotate 0.8s linear infinite' }}>
      <circle cx="9" cy="9" r="6" strokeDasharray="28" strokeDashoffset="14" strokeLinecap="round"/>
    </svg>
  );
}

function ThankYou({ date, onClose }) {
  return (
    <div className="thank-you">
      <div className="check-circle">
        <svg viewBox="0 0 60 60">
          <circle className="circle" cx="30" cy="30" r="27"/>
          <path className="check" d="M18 31L26 39L42 22"/>
        </svg>
      </div>
      <h2 style={{ fontFamily: 'var(--ff-serif)', fontWeight: 600, fontSize: 26, color: 'var(--text-walnut)' }}>We've received your inquiry!</h2>
      <p style={{ marginTop: 12, fontSize: 15, lineHeight: 1.6, maxWidth: 380, margin: '12px auto 0' }}>Our team will review your event details and get back to you within 24 hours.</p>
      <div style={{ marginTop: 32 }}>
        <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Want a faster response?</div>
        <a href="https://wa.me/918074896611" target="_blank" className="wa-btn" style={{ marginTop: 12 }}>{Icon.whatsapp(16)} Message us on WhatsApp</a>
      </div>
      <button className="btn btn-outline" style={{ marginTop: 24 }} onClick={onClose}>Done</button>
    </div>
  );
}

Object.assign(window, { BookNow, Field, Spinner, ThankYou });
