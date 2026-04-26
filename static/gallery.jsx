// gallery.jsx — Gallery page (backend photos + local demo fallbacks)

function Gallery({ go }) {
  const [filter, setFilter] = React.useState('All');
  const [lightbox, setLightbox] = React.useState(null);
  const [backendPhotos, setBackendPhotos] = React.useState([]);
  const cats = ['All','Mandap','Sangeet','Haldi','Reception','Mehndi','Birthday','Corporate'];

  // Fetch real uploads from the admin-managed gallery. If empty, the demo set
  // below keeps the page looking full for first-time visitors.
  React.useEffect(() => {
    fetch('/api/gallery')
      .then(r => r.ok ? r.json() : { photos: [] })
      .then(data => {
        const mapped = (data.photos || []).map(p => ({
          name: p.name || p.altText || 'Aadhavan setup',
          tag: (p.category || 'OTHER').charAt(0) + (p.category || 'OTHER').slice(1).toLowerCase(),
          cls: null,
          url: p.url,
          id: p.id,
        }));
        setBackendPhotos(mapped);
      })
      .catch(() => setBackendPhotos([]));
  }, []);

  const visible = backendPhotos.filter(p => filter === 'All' || p.tag === filter);

  const blocks = [];
  for (let i = 0; i < visible.length; i += 3) {
    blocks.push(visible.slice(i, i + 3));
  }
  const patterns = ['a','b','c'];

  return (
    <div>
      <section className="gallery-hero">
        <div>
          <h1>Our Inspiration Lookbook</h1>
          <p style={{ marginTop: 12, fontSize: 17 }}>Every setup tells a story. Find yours.</p>
        </div>
      </section>

      <div className="filter-bar">
        <div className="filter-pills">
          {cats.map(c => (
            <button key={c} className={`pill ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
          ))}
        </div>
      </div>

      <div className="container">
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: 'var(--text-muted)' }}>
            <p style={{ fontSize: 18, fontFamily: 'var(--ff-serif)', fontStyle: 'italic' }}>Photos coming soon — check back shortly.</p>
          </div>
        )}
        <div className="editorial-grid" key={filter}>
          {blocks.map((b, bi) => {
            const pat = patterns[bi % 3];
            return (
              <FadeUp key={bi+filter} delay={Math.min(bi*80, 240)}>
                <div className={`eblock ${pat}`}>
                  {pat === 'a' && (
                    <>
                      {b[0] && <PhotoCell cls="big" photo={b[0]} onClick={() => setLightbox(bi*3)}/>}
                      {b[1] && <PhotoCell cls="p1" photo={b[1]} onClick={() => setLightbox(bi*3+1)}/>}
                      {b[2] && <PhotoCell cls="p2" photo={b[2]} onClick={() => setLightbox(bi*3+2)}/>}
                    </>
                  )}
                  {pat === 'b' && (
                    <>
                      {b[0] && <PhotoCell cls="sq1" photo={b[0]} onClick={() => setLightbox(bi*3)}/>}
                      {b[1] && <PhotoCell cls="sq2" photo={b[1]} onClick={() => setLightbox(bi*3+1)}/>}
                      {b[2] && <PhotoCell cls="big" photo={b[2]} onClick={() => setLightbox(bi*3+2)}/>}
                    </>
                  )}
                  {pat === 'c' && (
                    <>
                      {b[0] && <PhotoCell photo={b[0]} onClick={() => setLightbox(bi*3)}/>}
                      {b[1] && <PhotoCell photo={b[1]} onClick={() => setLightbox(bi*3+1)}/>}
                      {b[2] && <PhotoCell photo={b[2]} onClick={() => setLightbox(bi*3+2)}/>}
                    </>
                  )}
                </div>
              </FadeUp>
            );
          })}
        </div>
      </div>

      <section className="section blush">
        <div className="container" style={{ textAlign: 'center' }}>
          <h2 className="section-heading italic" style={{ fontSize: 32 }}>Love what you see?</h2>
          <p style={{ marginTop: 8, fontSize: 16 }}>Let's create something extraordinary for your celebration.</p>
          <button className="btn btn-primary" style={{ marginTop: 28 }} onClick={() => go('book')}>Check Available Dates</button>
        </div>
      </section>

      {lightbox !== null && (
        <Lightbox
          photos={visible}
          index={lightbox}
          onClose={() => setLightbox(null)}
          onPrev={() => setLightbox(i => (i - 1 + visible.length) % visible.length)}
          onNext={() => setLightbox(i => (i + 1) % visible.length)}
        />
      )}
    </div>
  );
}

function PhotoCell({ cls='', photo, onClick }) {
  // Real uploaded photos get an <img>; demo photos use the gradient placeholder classes.
  return (
    <div className={`eph ${cls}`} onClick={onClick}>
      {photo.url ? (
        <div className="photo-inner" style={{ backgroundImage: `url(${photo.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="scrim"/>
        </div>
      ) : (
        <div className={`photo-inner ${photo.cls}`}>
          <div className="scrim"/>
          <div className="mock-label">{photo.name}</div>
        </div>
      )}
      <div className="eph-caption">
        <span className="name">{photo.name}</span>
        <span className="tag">{photo.tag}</span>
      </div>
    </div>
  );
}

function Lightbox({ photos, index, onClose, onPrev, onNext }) {
  const touchStartX = React.useRef(null);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') onPrev();
      if (e.key === 'ArrowRight') onNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onPrev, onNext]);

  const onTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 50) { dx < 0 ? onNext() : onPrev(); }
    touchStartX.current = null;
  };

  const p = photos[index];
  return (
    <div className="lightbox open" onClick={onClose} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <button className="lb-close" onClick={(e) => { e.stopPropagation(); onClose(); }}>{Icon.x(24)}</button>
      <button className="lb-arrow prev" onClick={(e) => { e.stopPropagation(); onPrev(); }}>{Icon.chevL(28)}</button>
      <button className="lb-arrow next" onClick={(e) => { e.stopPropagation(); onNext(); }}>{Icon.chevR(28)}</button>
      <div className="lightbox-img" style={{ width: 'min(90vw, 900px)', height: 'min(80vh, 640px)' }} onClick={(e) => e.stopPropagation()}>
        {p.url ? (
          <div className="photo-inner" style={{ width: '100%', height: '100%', borderRadius: 4, backgroundImage: `url(${p.url})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="scrim"/>
          </div>
        ) : (
          <div className={`photo-inner ${p.cls}`} style={{ width: '100%', height: '100%', borderRadius: 4 }}>
            <div className="scrim"/>
            <div className="mock-label">{p.name}</div>
          </div>
        )}
      </div>
      <div className="lb-caption">{p.name} · {p.tag}</div>
    </div>
  );
}

Object.assign(window, { Gallery });
