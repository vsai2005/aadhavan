// about_contact.jsx — About and Contact pages (lilac/orange palette, new content)

function About() {
  return (
    <div>
      <section className="section" style={{ paddingTop: 140 }}>
        <div className="container">
          <div className="story-grid">
            <FadeUp>
              <div className="story-photo-wrap">
                <div className="story-photo">
                  <div className="photo-inner ph-warm-4">
                    <div className="scrim"/>
                    <div className="mock-label">Founder · Aadhavan</div>
                  </div>
                </div>
              </div>
            </FadeUp>
            <FadeUp delay={100}>
              <div className="story-text">
                <div className="eyebrow">Our Story</div>
                <h2>The Heart Behind Aadhavan</h2>
                <hr className="hr-gold"/>
                <p>Aadhavan was never just a business—it was always a feeling.</p>
                <p>Long before it had a name, it lived in the small, thoughtful details of everyday life. In rooms transformed for festivals, in corners filled with warmth, in spaces that quietly told stories. What began as a natural instinct to create beauty slowly became a signature style—effortless, personal, and deeply meaningful.</p>
                <p>At Aadhavan, we believe décor is not just about how a space looks, but how it makes you feel. Every backdrop, every element, every carefully chosen detail is designed to capture emotions, not just attention. Because the most memorable spaces are the ones that reflect <em>you</em>.</p>
                <p>Our journey truly took shape when a dream event turned into something unforgettable—where every detail was imagined, designed, and brought to life with intention. The response was overwhelming. What started as a personal vision resonated with thousands, and soon, people weren't just admiring the aesthetics—they wanted to experience it for themselves.</p>
                <p>That's how Aadhavan was born.</p>
                <p>Today, we bring that same passion into every project we take on. Whether it's an intimate celebration or a grand occasion, we focus on creating spaces that feel authentic, timeless, and uniquely yours. No templates, no repetition—just stories, translated into design.</p>
                <p>Because for us, décor is more than decoration.</p>
                <p style={{ fontStyle: 'italic', color: 'var(--accent-olive)' }}>It's the art of turning moments into memories. ✨</p>
              </div>
            </FadeUp>
          </div>

          <FadeUp delay={200}>
            <div className="about-me-box">
              <div className="eyebrow" style={{ color: 'var(--accent-olive)' }}>About Me</div>
              <h3>A quick glimpse</h3>
              <ul>
                <li>Creative Decor Designer</li>
                <li>Passion-driven & self-taught</li>
                <li>Specialized in personalized event styling</li>
                <li>Focus on emotional & aesthetic experiences</li>
              </ul>
            </div>
          </FadeUp>
        </div>
      </section>

      <section className="section blush">
        <div className="container">
          <FadeUp className="section-header">
            <h2 className="section-heading">Why Families Trust Us</h2>
          </FadeUp>
          <div className="pillars">
            {[
              { icon: Icon.quill(40), title: 'Custom Designs', body: 'No templates. Every setup is designed from scratch for your unique vision.' },
              { icon: Icon.phoneHeart(40), title: 'Personal Touch', body: 'Direct communication with our lead designer from first call to final petal.' },
              { icon: Icon.shield(40), title: 'Premium Materials', body: 'We source the finest fabrics, florals, and fixtures — never artificial-looking shortcuts.' },
              { icon: Icon.checkCircle(40), title: 'Stress-Free Planning', body: 'Detailed timelines, vendor coordination, and day-of management included.' },
            ].map((p, i) => (
              <FadeUp key={i} delay={i*120}>
                <div className="pillar">
                  <div className="icon">{p.icon}</div>
                  <h3>{p.title}</h3>
                  <p>{p.body}</p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Contact() {
  const [form, setForm] = React.useState({ name: '', phone: '', email: '', message: '' });
  const [sent, setSent] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const update = (k, v) => { setError(''); setForm(f => ({ ...f, [k]: v })); };

  const submit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || null,
          email: form.email,
          message: form.message,
        })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.');
        setLoading(false);
        return;
      }
      setLoading(false);
      setSent(true);
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      setLoading(false);
    }
  };

  return (
    <section className="section" style={{ paddingTop: 140 }}>
      <div className="container">
        <div className="contact-grid">
          <FadeUp>
            <div className="eyebrow" style={{ color: 'var(--accent-olive)' }}>Get in Touch</div>
            <h2 style={{ fontFamily: 'var(--ff-serif)', fontWeight: 600, fontSize: 36, color: 'var(--text-walnut)', marginTop: 8 }}>Let's Start Planning</h2>
            <hr className="hr-gold" style={{ margin: '24px 0' }}/>
            <div className="contact-item">
              <span className="c-icon">{Icon.phone(20)}</span>
              <div className="c-body">
                <a href="tel:+19016518757" style={{ color: 'inherit', textDecoration: 'none' }}>+1 (901) 651-8757</a>
                <span className="sub">Tap to call</span>
              </div>
            </div>
            <div className="contact-item">
              <span className="c-icon" style={{ color: '#25D366' }}>{Icon.whatsapp(20)}</span>
              <div className="c-body">
                <a href="https://wa.me/918074896611" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>Chat on WhatsApp</a>
                <span className="sub">+91 80748 96611</span>
              </div>
            </div>
            <div className="contact-item">
              <span className="c-icon">{Icon.ig(20)}</span>
              <div className="c-body">
                <a href="https://instagram.com/aadhavan_decors" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>@aadhavan_decors</a>
                <span className="sub">Follow our latest setups</span>
              </div>
            </div>
            <div className="contact-item">
              <span className="c-icon">{Icon.clock(20)}</span>
              <div className="c-body">Monday – Saturday, 9:00 AM – 7:00 PM<span className="sub">Sunday by appointment</span></div>
            </div>
          </FadeUp>

          <FadeUp delay={200}>
            <div className="contact-form-card">
              {!sent ? (
                <form onSubmit={submit}>
                  <h3 style={{ fontFamily: 'var(--ff-serif)', fontWeight: 600, fontSize: 24, color: 'var(--text-walnut)', marginBottom: 8 }}>Send us a message</h3>
                  <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 16 }}>We respond within 24 hours.</p>
                  <Field label="Your Name" value={form.name} onChange={v => update('name', v)} required/>
                  <Field label="Phone Number" value={form.phone} onChange={v => update('phone', v)} type="tel"/>
                  <Field label="Email Address" value={form.email} onChange={v => update('email', v)} type="email" required/>
                  <div className="field">
                    <textarea value={form.message} onChange={e => update('message', e.target.value)} placeholder=" " rows="5" required/>
                    <label>How Can We Help?</label>
                    <span className="underline"/>
                    <span className="sub-hint">Tell us about your upcoming event or ask us anything…</span>
                  </div>
                  {error && (
                    <div style={{ marginTop: 12, padding: '10px 14px', background: 'rgba(196,122,122,0.12)', border: '1px solid rgba(196,122,122,0.35)', borderRadius: 4, color: 'var(--error-dusty-rose)', fontSize: 13 }}>
                      {error}
                    </div>
                  )}
                  <button type="submit" className="btn btn-primary submit-full" disabled={loading}>
                    {loading ? <Spinner/> : 'Send Message'}
                  </button>
                </form>
              ) : (
                <ThankYou date="" onClose={() => setSent(false)}/>
              )}
            </div>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

Object.assign(window, { About, Contact });
