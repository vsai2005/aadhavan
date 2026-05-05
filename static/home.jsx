// home.jsx — Home page

function Home({ go }) {
  return (
    <div className="page-home">
      <Hero go={go} />
      <Services />
      <LookbookTeaser go={go} />
      <Testimonials />
      <Feedback />
      <CalendarTeaser go={go} />
    </div>
  );
}

function HeroMandala() {
  return (
    <svg width="720" height="720" viewBox="0 0 720 720" fill="none" style={{ opacity: 0.65 }}>
      <defs>
        <radialGradient id="mandalaG" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFA500" stopOpacity="0.65"/>
          <stop offset="50%" stopColor="#C8A2C8" stopOpacity="0.5"/>
          <stop offset="100%" stopColor="#C8A2C8" stopOpacity="0"/>
        </radialGradient>
      </defs>
      <circle cx="360" cy="360" r="340" fill="url(#mandalaG)"/>
      <g stroke="#9B6FB8" strokeWidth="1.2" fill="none" opacity="0.85">
        {[...Array(16)].map((_, i) => {
          const a = (i * 22.5) * Math.PI / 180;
          const x2 = 360 + Math.cos(a) * 320;
          const y2 = 360 + Math.sin(a) * 320;
          return <line key={i} x1="360" y1="360" x2={x2} y2={y2}/>;
        })}
        <circle cx="360" cy="360" r="80"/>
        <circle cx="360" cy="360" r="140"/>
        <circle cx="360" cy="360" r="210"/>
        <circle cx="360" cy="360" r="280"/>
        {[...Array(12)].map((_, i) => {
          const a = (i * 30) * Math.PI / 180;
          const cx = 360 + Math.cos(a) * 170;
          const cy = 360 + Math.sin(a) * 170;
          return <circle key={`p${i}`} cx={cx} cy={cy} r="24" stroke="#FFA500" strokeWidth="1.4"/>;
        })}
        {[...Array(24)].map((_, i) => {
          const a = (i * 15) * Math.PI / 180;
          const cx = 360 + Math.cos(a) * 245;
          const cy = 360 + Math.sin(a) * 245;
          return <circle key={`o${i}`} cx={cx} cy={cy} r="8"/>;
        })}
      </g>
    </svg>
  );
}

function Hero({ go }) {
  React.useEffect(() => {
    if (window.matchMedia('(hover: none)').matches) return;
    const onScroll = () => {
      const y = window.scrollY;
      const content = document.querySelector('.hero-content');
      if (content && y < window.innerHeight) {
        content.style.transform = `translateY(${y * -0.3}px)`;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <section className="hero">
      <div className="hero-glow"/>
      <div className="hero-mandala"><HeroMandala/></div>
        <div className="hero-content">
          <div className="eyebrow hero-eyebrow">Premium Event Decor · Personalized Styling</div>
          <h1 className="hero-line-1">We Don't Just Decorate.</h1>
          <h1 className="hero-line-2">We Create Memories.</h1>
          <hr className="hr-gold hero-divider"/>
          <p className="hero-paragraph">From intimate Haldi mornings to grand Reception nights — every detail is crafted with love, tradition, and artistry.</p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => go('book')}>Check Availability</button>
            <button className="btn btn-outline" onClick={() => go('gallery')}>View Our Work</button>
          </div>
        </div>
    </section>
  );
}

function formatFeedbackMeta(ts) {
  try {
    const d = new Date(ts);
    const month = d.toLocaleString('en-US', { month: 'long' });
    return `Shared · ${month} ${d.getFullYear()}`;
  } catch {
    return 'Shared';
  }
}

function Feedback() {
  const [form, setForm] = React.useState({ name: '', email: '', message: '', rating: 0 });
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [hover, setHover] = React.useState(0);

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || null,
          message: form.message.trim(),
          rating: form.rating || 5,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      setLoading(false);
      setSent(true);
      // Tell Testimonials to reload
      window.dispatchEvent(new Event('feedback-submitted'));
    } catch (err) {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  };

  const reset = () => {
    setForm({ name: '', email: '', message: '', rating: 0 });
    setSent(false);
    setError('');
  };

  return (
    <section className="section" id="feedback-section">
      <div className="container" style={{ maxWidth: 720 }}>
        <FadeUp className="section-header">
          <h2 className="section-heading">Share Your Experience</h2>
          <p className="section-subhead" style={{ marginTop: 12 }}>Your words help us grow, and inspire others to dream bigger.</p>
        </FadeUp>
        <FadeUp>
          <div className="feedback-card">
            {!sent ? (
              <form onSubmit={submit}>
                <div className="field filled-like">
                  <input value={form.name} onChange={e => setForm({...form, name: e.target.value})} required placeholder=" "/>
                  <label>Name</label>
                  <span className="underline"/>
                </div>
                <div className="field filled-like">
                  <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} placeholder=" "/>
                  <label>Email (optional)</label>
                  <span className="underline"/>
                </div>
                <div className="field filled-like">
                  <textarea value={form.message} onChange={e => setForm({...form, message: e.target.value})} required rows="4" placeholder=" "/>
                  <label>Your Feedback</label>
                  <span className="underline"/>
                </div>
                <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-taupe)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Rating</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {[1,2,3,4,5].map(n => (
                      <button key={n} type="button"
                        onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
                        onClick={() => setForm({...form, rating: n})}
                        style={{ background: 'transparent', border: 0, cursor: 'pointer', color: (hover || form.rating) >= n ? 'var(--orange)' : '#E6D9EE', padding: 2 }}>
                        <svg width="26" height="26" viewBox="0 0 14 14" fill="currentColor"><path d="M7 1L8.8 5L13 5.5L10 8.5L10.8 13L7 10.8L3.2 13L4 8.5L1 5.5L5.2 5L7 1Z"/></svg>
                      </button>
                    ))}
                  </div>
                </div>
                {error && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(196,122,122,0.12)', border: '1px solid rgba(196,122,122,0.35)', borderRadius: 4, color: 'var(--error-dusty-rose)', fontSize: 13 }}>
                    {error}
                  </div>
                )}
                <button type="submit" className="btn btn-primary submit-full" disabled={loading}>
                  {loading ? <Spinner/> : 'Submit Feedback'}
                </button>
              </form>
            ) : (
              <div className="thank-you">
                <div className="check-circle">
                  <svg viewBox="0 0 60 60">
                    <circle className="circle" cx="30" cy="30" r="27"/>
                    <path className="check" d="M18 31L26 39L42 22"/>
                  </svg>
                </div>
                <h3 style={{ fontFamily: 'var(--ff-serif)', fontWeight: 600, fontSize: 24, color: 'var(--text-walnut)' }}>Thank you for sharing!</h3>
                <p style={{ marginTop: 12, fontSize: 15 }}>Your words will appear in the section above.</p>
                <button type="button" className="btn btn-outline" style={{ marginTop: 24 }} onClick={reset}>Share another</button>
              </div>
            )}
          </div>
        </FadeUp>
      </div>
    </section>
  );
}

Object.assign(window, { Feedback });

function Services() {
  const cards = [
    { icon: Icon.mandap(48), title: 'Mandap Setups', body: 'Architectural centerpieces that honor tradition while embracing elegance.' },
    { icon: Icon.notes(48), title: 'Sangeet Decor', body: 'Vibrant, music-inspired settings that set the stage for celebration.' },
    { icon: Icon.marigold(48), title: 'Haldi Themes', body: 'Sun-kissed arrangements with marigolds, drapes, and warmth.' },
    { icon: Icon.rings(48), title: 'Reception Design', body: 'Grand, unforgettable spaces where every detail speaks luxury.' },
  ];
  return (
    <section className="section">
      <div className="container">
        <FadeUp className="section-header">
          <span className="ornament"><span className="diamond"/></span>
          <h2 className="section-heading" style={{ marginTop: 20 }}>Crafted for Every Celebration</h2>
          <p className="section-subhead" style={{ marginTop: 12 }}>We specialize in traditional Indian events with a modern luxury touch.</p>
        </FadeUp>
        <div className="services-grid">
          {cards.map((c, i) => (
            <FadeUp key={i} delay={i*120} className="service-card">
              <div className="icon">{c.icon}</div>
              <h3>{c.title}</h3>
              <p>{c.body}</p>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function LookbookTeaser({ go }) {
  const [photos, setPhotos] = React.useState([]);

  React.useEffect(() => {
    fetch('/api/gallery')
      .then(r => r.ok ? r.json() : { photos: [] })
      .then(data => setPhotos((data.photos || []).slice(0, 3)))
      .catch(() => setPhotos([]));
  }, []);

  if (photos.length === 0) return null;

  const classes = ['lookbook-photo portrait', 'lookbook-photo square', 'lookbook-photo portrait right'];
  const delays = [0, 120, 240];

  return (
    <section className="section">
      <div className="container">
        <FadeUp className="section-header">
          <h2 className="section-heading">A Glimpse of Our Work</h2>
        </FadeUp>
        <div className="lookbook-grid">
          {photos.map((p, i) => (
            <FadeUp key={p.id} className={classes[i]} delay={delays[i]}>
              <div className="photo-inner" style={{ backgroundImage: `url(${p.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <div className="scrim"/>
              </div>
              <div className="caption">{p.name}</div>
            </FadeUp>
          ))}
        </div>
        <div className="center-link">
          <a className="arrow-link" onClick={(e) => { e.preventDefault(); go('gallery'); }} style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>Explore the full collection →</a>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const [entries, setEntries] = React.useState([]);
  const [idx, setIdx] = React.useState(0);
  const touchStartX = React.useRef(null);

  const load = () => {
    fetch('/api/feedback')
      .then(r => r.ok ? r.json() : { feedback: [] })
      .then(data => { setEntries(data.feedback || []); setIdx(0); })
      .catch(() => setEntries([]));
  };

  React.useEffect(() => {
    load();
    window.addEventListener('feedback-submitted', load);
    return () => window.removeEventListener('feedback-submitted', load);
  }, []);

  const visible = Math.min(3, entries.length);
  const maxIdx = Math.max(0, entries.length - visible);

  React.useEffect(() => {
    if (entries.length <= visible) return;
    const t = setInterval(() => setIdx(i => (i + 1) % (maxIdx + 1)), 6000);
    return () => clearInterval(t);
  }, [entries.length, visible, maxIdx]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) {
      if (dx < 0) setIdx(i => Math.min(maxIdx, i + 1));
      else setIdx(i => Math.max(0, i - 1));
    }
    touchStartX.current = null;
  };

  const scrollToFeedback = () => {
    const el = document.getElementById('feedback-section');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (entries.length === 0) {
    return (
      <section className="section blush">
        <div className="container">
          <FadeUp className="section-header">
            <h2 className="section-heading">Words from Our Families</h2>
          </FadeUp>
          <FadeUp>
            <div className="feedback-empty">
              <div className="feedback-empty-mark">
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M7 7h4v6a4 4 0 0 1-4 4v-2a2 2 0 0 0 2-2H7V7zm8 0h4v6a4 4 0 0 1-4 4v-2a2 2 0 0 0 2-2h-2V7z"/>
                </svg>
              </div>
              <h3>Your story could live here.</h3>
              <p>We're just getting started — the first words of love from our families will appear right here. If you've celebrated with us, share your experience below.</p>
              <button className="btn btn-primary" onClick={scrollToFeedback}>Share Your Experience</button>
            </div>
          </FadeUp>
        </div>
      </section>
    );
  }

  const shown = entries.slice(idx, idx + visible);
  const gridCols = visible === 1 ? 'minmax(0, 560px)' : visible === 2 ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)';
  const justify = visible < 3 ? 'center' : 'stretch';

  return (
    <section className="section blush">
      <div className="container">
        <FadeUp className="section-header">
          <h2 className="section-heading">Words from Our Families</h2>
        </FadeUp>
        <div className="testimonial-slider" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
          <div className="testimonial-track" style={{ gridTemplateColumns: gridCols, justifyContent: justify, margin: visible < 3 ? '0 auto' : undefined, maxWidth: visible < 3 ? 1000 : undefined }}>
            {shown.map((t) => (
              <div className="testimonial-card" key={t.id}>
                <div className="quote-mark">"</div>
                <div className="stars">
                  {[0,1,2,3,4].map(n => (
                    <span key={n} className="star" style={{ color: n < (t.rating || 5) ? 'var(--orange)' : '#E6D9EE' }}>{Icon.star(14)}</span>
                  ))}
                </div>
                <blockquote>{t.message}</blockquote>
                <div className="client">{t.name}</div>
                <div className="event-meta">{formatFeedbackMeta(t.createdAt)}</div>
              </div>
            ))}
          </div>
          {entries.length > visible && (
            <div className="slider-controls">
              <button className="slider-arrow" onClick={() => setIdx(i => Math.max(0, i-1))} aria-label="Previous">{Icon.chevL()}</button>
              <div className="slider-dots">
                {Array.from({length: maxIdx + 1}).map((_, i) => (
                  <button key={i} className={`dot ${i === idx ? 'active' : ''}`} onClick={() => setIdx(i)}/>
                ))}
              </div>
              <button className="slider-arrow" onClick={() => setIdx(i => Math.min(maxIdx, i+1))} aria-label="Next">{Icon.chevR()}</button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function CalendarTeaser({ go }) {
  return (
    <section className="section">
      <div className="container">
        <div className="cal-teaser">
          <FadeUp className="cal-teaser-text">
            <h2>Your perfect date might still be open…</h2>
            <p style={{ marginTop: 20, fontSize: 16 }}>We take on a limited number of events each month to ensure every celebration gets our complete attention.</p>
            <button className="btn btn-primary" style={{ marginTop: 32 }} onClick={() => go('book')}>Check Available Dates</button>
          </FadeUp>
          <FadeUp delay={200}>
            <MiniCalendar/>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { Home });
