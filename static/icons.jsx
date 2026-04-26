// icons.jsx — thin-line SVG icons used across the site

const Icon = {
  // services
  mandap: (size=48) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 42V20C8 14 14 8 24 8C34 8 40 14 40 20V42"/>
      <path d="M4 42H44"/>
      <path d="M14 42V26"/>
      <path d="M34 42V26"/>
      <path d="M24 8V4"/>
      <circle cx="24" cy="4" r="1.5"/>
      <path d="M10 20C14 20 18 16 24 16C30 16 34 20 38 20"/>
    </svg>
  ),
  notes: (size=48) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="14" cy="36" r="4"/>
      <circle cx="36" cy="32" r="4"/>
      <path d="M18 36V12L40 8V32"/>
      <path d="M18 20L40 16"/>
    </svg>
  ),
  marigold: (size=48) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="24" cy="24" r="5"/>
      {[0,45,90,135,180,225,270,315].map(a => (
        <ellipse key={a} cx="24" cy="12" rx="4" ry="6" transform={`rotate(${a} 24 24)`}/>
      ))}
    </svg>
  ),
  rings: (size=48) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="18" cy="28" r="10"/>
      <circle cx="30" cy="28" r="10"/>
      <path d="M18 14L22 10"/>
      <path d="M30 14L26 10"/>
    </svg>
  ),
  // pillars
  quill: (size=40) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 34L18 22"/>
      <path d="M20 20C26 14 32 8 34 6C34 14 28 22 22 26L20 28"/>
      <path d="M18 22L14 26L10 30"/>
    </svg>
  ),
  phoneHeart: (size=40) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="12" y="4" width="16" height="32" rx="3"/>
      <path d="M17 31H23"/>
      <path d="M20 18C18 16 15 17 15 20C15 22 20 26 20 26C20 26 25 22 25 20C25 17 22 16 20 18Z"/>
    </svg>
  ),
  shield: (size=40) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 4L8 8V20C8 28 14 34 20 36C26 34 32 28 32 20V8L20 4Z"/>
      <path d="M15 20L19 24L26 17"/>
    </svg>
  ),
  checkCircle: (size=40) => (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="20" cy="20" r="14"/>
      <path d="M14 20L18 24L26 16"/>
    </svg>
  ),
  // ui
  chevL: (size=18) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4L6 9L11 14"/>
    </svg>
  ),
  chevR: (size=18) => (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 4L12 9L7 14"/>
    </svg>
  ),
  x: (size=20) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M5 5L15 15M15 5L5 15"/>
    </svg>
  ),
  star: (size=14) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="currentColor">
      <path d="M7 1L8.8 5L13 5.5L10 8.5L10.8 13L7 10.8L3.2 13L4 8.5L1 5.5L5.2 5L7 1Z"/>
    </svg>
  ),
  phone: (size=20) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 3H7L9 8L6.5 9.5C7.5 12 9 13.5 11.5 14.5L13 12L18 14V17C18 17.5 17.5 18 17 18C10 17.5 3 10.5 2 3.5C2 3 2.5 2.5 3 2.5L4 3Z"/>
    </svg>
  ),
  mail: (size=20) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="16" height="12" rx="1"/>
      <path d="M2 5L10 11L18 5"/>
    </svg>
  ),
  pin: (size=20) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 18C10 18 16 12 16 8C16 4.5 13.5 2 10 2C6.5 2 4 4.5 4 8C4 12 10 18 10 18Z"/>
      <circle cx="10" cy="8" r="2"/>
    </svg>
  ),
  clock: (size=20) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="8"/>
      <path d="M10 5V10L13 12"/>
    </svg>
  ),
  whatsapp: (size=20) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="currentColor">
      <path d="M10 2C5.6 2 2 5.6 2 10C2 11.4 2.4 12.8 3 14L2 18L6.2 17C7.4 17.6 8.6 18 10 18C14.4 18 18 14.4 18 10S14.4 2 10 2ZM14.2 13.2C14 13.6 13.4 14 13 14C12.6 14 12.2 14 10 13C8 12 7 10 6.6 9C6.2 8 6.6 7.4 7 7C7.2 6.8 7.4 6.8 7.6 6.8H7.8C8 6.8 8.2 6.8 8.4 7.2C8.6 7.6 9 8.6 9 8.8C9 9 9.2 9.2 9 9.4C9 9.6 8.8 9.8 8.6 10C8.4 10.2 8.2 10.4 8.4 10.6C8.6 11 9 11.6 9.6 12.2C10.4 12.8 11 13.2 11.4 13.4C11.8 13.6 12 13.4 12.2 13.2C12.4 13 12.8 12.6 13 12.2C13.2 11.8 13.4 11.8 13.6 12C13.8 12.2 14.8 12.6 15 12.8C15.2 13 15.4 13 15.4 13.2C15.4 13.4 15.4 13.6 15.2 13.8L14.2 13.2Z"/>
    </svg>
  ),
  ig: (size=20) => (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="14" height="14" rx="4"/>
      <circle cx="10" cy="10" r="3.5"/>
      <circle cx="14.5" cy="5.5" r="0.8" fill="currentColor"/>
    </svg>
  ),
  plus: (size=14) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M7 2V12M2 7H12"/>
    </svg>
  ),
  minus: (size=14) => (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 7H12"/>
    </svg>
  )
};

// Mandala SVG for hero
const HeroMandala = ({size=800}) => (
  <svg width={size} height={size} viewBox="0 0 800 800" fill="none" stroke="currentColor" strokeWidth="1">
    {[100, 180, 260, 340].map(r => (
      <circle key={r} cx="400" cy="400" r={r}/>
    ))}
    {Array.from({length: 16}).map((_, i) => {
      const angle = (i * 22.5) * Math.PI / 180;
      const x1 = 400 + Math.cos(angle) * 100;
      const y1 = 400 + Math.sin(angle) * 100;
      const x2 = 400 + Math.cos(angle) * 340;
      const y2 = 400 + Math.sin(angle) * 340;
      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2}/>;
    })}
    {Array.from({length: 12}).map((_, i) => {
      const angle = (i * 30) * Math.PI / 180;
      const cx = 400 + Math.cos(angle) * 220;
      const cy = 400 + Math.sin(angle) * 220;
      return <ellipse key={i} cx={cx} cy={cy} rx="24" ry="40" transform={`rotate(${i*30} ${cx} ${cy})`}/>;
    })}
    {Array.from({length: 24}).map((_, i) => {
      const angle = (i * 15) * Math.PI / 180;
      const cx = 400 + Math.cos(angle) * 340;
      const cy = 400 + Math.sin(angle) * 340;
      return <circle key={i} cx={cx} cy={cy} r="8"/>;
    })}
  </svg>
);

Object.assign(window, { Icon, HeroMandala });
