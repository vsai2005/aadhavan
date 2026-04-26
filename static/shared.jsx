// shared.jsx — shared components: Nav, Footer, FadeUp, MiniCalendar, big Calendar, Lightbox

function FadeUp({ children, delay=0, className='', style={} }) {
  const ref = React.useRef(null);
  const [visible, setVisible] = React.useState(false);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) setVisible(true); });
    }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={`fade-up ${visible ? 'in' : ''} ${className}`} style={{ ...style, transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function Navbar({ page, go }) {
  const [compact, setCompact] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setCompact(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close menu whenever page changes
  React.useEffect(() => { setMenuOpen(false); }, [page]);

  // Lock body scroll while menu is open
  React.useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const links = [
    { k: 'home', label: 'Home' },
    { k: 'gallery', label: 'Gallery' },
    { k: 'book', label: 'Book Now' },
    { k: 'about', label: 'About' },
    { k: 'contact', label: 'Contact' },
  ];

  const navTo = (k) => { go(k); setMenuOpen(false); };

  return (
    <>
      <nav className={`navbar ${compact ? 'compact' : ''}`}>
        <div className="nav-left" onClick={() => go('home')} style={{ cursor: 'pointer' }}>
          <span className="monogram">A</span>
          <span className="wordmark">Aadhavan</span>
        </div>
        <div className="nav-right">
          {links.map(l => (
            <button key={l.k} className={`nav-link ${page === l.k ? 'active' : ''}`} onClick={() => go(l.k)}>{l.label}</button>
          ))}
        </div>
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)} aria-label={menuOpen ? 'Close menu' : 'Open menu'}>
          <span className={`ham-bar ${menuOpen ? 'open' : ''}`}/>
          <span className={`ham-bar ${menuOpen ? 'open' : ''}`}/>
          <span className={`ham-bar ${menuOpen ? 'open' : ''}`}/>
        </button>
      </nav>
      {menuOpen && (
        <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}>
          <div className="mobile-menu" onClick={e => e.stopPropagation()}>
            {links.map(l => (
              <button key={l.k} className={`mobile-nav-link ${page === l.k ? 'active' : ''}`} onClick={() => navTo(l.k)}>{l.label}</button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

function Footer({ go }) {
  const igTiles = ['ph-warm-1','ph-warm-4','ph-warm-5','ph-warm-3','ph-warm-2','ph-warm-10'];
  return (
    <>
      <div className="ig-strip">
        {igTiles.map((c, i) => (
          <div className="ig-tile" key={i}>
            <div className={`photo-inner ${c}`}><div className="scrim"/></div>
          </div>
        ))}
      </div>
      <footer>
        <div className="container">
          <div className="footer-top">
            <div className="monogram" style={{ display: 'inline-flex' }}>A</div>
            <div className="wordmark" style={{ display: 'block', marginTop: 8 }}>Aadhavan</div>
            <div className="tagline">Creating magical celebrations since 2019</div>
          </div>
          <div className="footer-cols">
            <div className="footer-col">
              <h4>Quick Links</h4>
              <a onClick={(e) => { e.preventDefault(); go('home'); }}>Home</a>
              <a onClick={(e) => { e.preventDefault(); go('gallery'); }}>Gallery</a>
              <a onClick={(e) => { e.preventDefault(); go('book'); }}>Book Now</a>
              <a onClick={(e) => { e.preventDefault(); go('about'); }}>About</a>
              <a onClick={(e) => { e.preventDefault(); go('contact'); }}>Contact</a>
            </div>
            <div className="footer-col">
              <h4>Contact</h4>
              <a href="tel:+918074896611">+91 80748 96611</a>
              <a href="https://wa.me/918074896611" target="_blank" rel="noreferrer" className="wa-btn">{Icon.whatsapp(16)} WhatsApp Us</a>
              <a href="mailto:hello@aadhavan.com">hello@aadhavan.com</a>
            </div>
            <div className="footer-col">
              <h4>Location</h4>
              <span className="footer-line">Collierville, Tennessee</span>
              <span className="footer-line" style={{ fontSize: 12, color: 'rgba(215,197,232,0.55)', marginTop: -4 }}>Serving Memphis &amp; surrounding areas</span>
              <a href="https://instagram.com/aadhavan_decors" target="_blank" rel="noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 12 }}>{Icon.ig(16)} @aadhavan_decors</a>
            </div>
          </div>
          <div className="footer-bottom">© 2025 Aadhavan Event Design. All rights reserved.</div>
        </div>
      </footer>
    </>
  );
}

// Shared calendar logic
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DOW = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function buildMonth(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const firstDow = (first.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(new Date(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

// Format a Date -> 'YYYY-MM-DD' (local time, avoids UTC-shift bugs)
function fmtLocalDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function CalendarView({ large=false, onPick=null, selectedDate=null }) {
  const today = new Date();
  const [view, setView] = React.useState({ y: today.getFullYear(), m: today.getMonth() });
  const [blockedSet, setBlockedSet] = React.useState(new Set());
  const [loading, setLoading] = React.useState(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const cells = buildMonth(view.y, view.m);

  React.useEffect(() => {
    const onRefresh = () => setRefreshKey(k => k + 1);
    window.addEventListener('calendar-refresh', onRefresh);
    return () => window.removeEventListener('calendar-refresh', onRefresh);
  }, []);

  // Fetch blocked dates from the backend whenever the viewed month changes.
  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/calendar?month=${view.m + 1}&year=${view.y}`)
      .then(r => r.ok ? r.json() : { blockedDates: [] })
      .then(data => {
        if (cancelled) return;
        setBlockedSet(new Set(data.blockedDates || []));
      })
      .catch(() => { if (!cancelled) setBlockedSet(new Set()); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [view.y, view.m, refreshKey]);

  const isBooked = (d) => d && blockedSet.has(fmtLocalDate(d));

  const shift = (d) => {
    let m = view.m + d, y = view.y;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setView({ y, m });
  };

  return (
    <div className={`calendar ${large ? 'large' : ''}`}>
      <div className="cal-head">
        <button className="cal-nav-btn" onClick={() => shift(-1)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border-peach)', background: 'transparent', color: 'var(--text-taupe)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.chevL()}</button>
        <h3>{MONTHS[view.m]} {view.y}{loading ? ' …' : ''}</h3>
        <button onClick={() => shift(1)} style={{ width: 32, height: 32, borderRadius: '50%', border: '1px solid var(--border-peach)', background: 'transparent', color: 'var(--text-taupe)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{Icon.chevR()}</button>
      </div>
      <div className="cal-grid">
        {DOW.map(d => <div className="cal-dow" key={d}>{d}</div>)}
        {cells.map((d, i) => {
          if (!d) return <div key={i} className="cal-day empty"/>;
          const isPast = d < new Date(today.getFullYear(), today.getMonth(), today.getDate());
          const isToday = sameDay(d, today);
          const booked = isBooked(d);
          const selected = sameDay(d, selectedDate);
          let cls = 'cal-day';
          if (isPast && !isToday) cls += ' past';
          else if (booked) cls += ' booked';
          else cls += ' available';
          if (isToday) cls += ' today';
          if (selected) cls += ' selected';
          return (
            <div key={i} className={cls} onClick={() => { if (!isPast && !booked && onPick) onPick(d); }} title={booked ? 'This date is booked. Please choose another!' : ''}>
              {d.getDate()}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MiniCalendar() { return <CalendarView/>; }

Object.assign(window, { FadeUp, Navbar, Footer, CalendarView, MiniCalendar, MONTHS, DOW, sameDay, fmtLocalDate });
