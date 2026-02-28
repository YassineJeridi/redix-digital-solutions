import React, { useEffect, useRef } from 'react';
import { FaEnvelope, FaPhone, FaWhatsapp, FaArrowRight } from 'react-icons/fa';
import styles from './ProfilePage.module.css';

/* ── Icons floating freely in the background ── */
const BG_ICONS = [
  { src: '/assets/icons/world.png',        size: 44, top: '7%',  left: '5%',  delay: '0s',   dur: '7s'   },
  { src: '/assets/icons/security.png',     size: 38, top: '11%', left: '78%', delay: '1.2s', dur: '6s'   },
  { src: '/assets/icons/moon.png',         size: 36, top: '60%', left: '4%',  delay: '0.6s', dur: '8.5s' },
  { src: '/assets/icons/tunisia.png',      size: 40, top: '72%', left: '80%', delay: '2s',   dur: '7.5s' },
  { src: '/assets/icons/TunisianGuy.png',  size: 42, top: '82%', left: '10%', delay: '3s',   dur: '6.5s' },
];

/* ── Animated particle canvas ── */
function ParticleField() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;

    const resize = () => {
      canvas.width  = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    /* mix of twinkling stars + slow drifting orbs */
    const stars = Array.from({ length: 110 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.2,
      alpha: Math.random(),
      speed: Math.random() * 0.007 + 0.002,
      dir: Math.random() > 0.5 ? 1 : -1,
      hue: Math.random() > 0.5 ? 193 : 280, /* cyan-ish vs purple */
    }));

    const orbs = Array.from({ length: 6 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 80 + 40,
      alpha: Math.random() * 0.06 + 0.02,
      dx: (Math.random() - 0.5) * 0.3,
      dy: (Math.random() - 0.5) * 0.3,
    }));

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      /* soft drifting orbs */
      orbs.forEach(o => {
        o.x += o.dx; o.y += o.dy;
        if (o.x < -o.r) o.x = canvas.width + o.r;
        if (o.x > canvas.width + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = canvas.height + o.r;
        if (o.y > canvas.height + o.r) o.y = -o.r;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `rgba(193,45,224,${o.alpha})`);
        g.addColorStop(1, 'transparent');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      });

      /* twinkling stars */
      stars.forEach(s => {
        s.alpha += s.speed * s.dir;
        if (s.alpha >= 1 || s.alpha <= 0) s.dir *= -1;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = s.hue === 280
          ? `rgba(193,45,224,${s.alpha * 0.8})`
          : `rgba(168,85,247,${s.alpha * 0.7})`;
        ctx.shadowBlur  = 6;
        ctx.shadowColor = '#c12de0';
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className={styles.particleCanvas} />;
}

export default function ProfilePage({ photo, initials, name, position, badge, email, phone, phoneDisplay }) {
  const wa = phone.replace('+', '');

  return (
    <div className={styles.page}>
      <ParticleField />

      {/* Aurora blobs */}
      <div className={styles.aurora1} />
      <div className={styles.aurora2} />

      {/* Floating icons */}
      {BG_ICONS.map((ic, i) => (
        <img
          key={i}
          src={ic.src}
          alt=""
          aria-hidden="true"
          className={styles.floatIcon}
          style={{
            width: ic.size,
            height: ic.size,
            top: ic.top,
            left: ic.left,
            animationDelay: ic.delay,
            animationDuration: ic.dur,
          }}
        />
      ))}

      {/* ── Brand bar ── */}
      <a className={styles.brand} href="https://www.redixdigitalsolutions.com" target="_blank" rel="noopener noreferrer">
        <img src="/assets/logos/redix.png" alt="Redix" className={styles.brandLogo} />
        <span className={styles.brandName}>Redix<span> Digital Solutions</span></span>
      </a>

      {/* ── Main card ── */}
      <div className={styles.card}>

        {/* Animated gradient border */}
        <div className={styles.cardBorder} />

        {/* Photo hero */}
        <div className={styles.photoSection}>
          <div className={styles.photoRing}>
            <div className={styles.photoRingInner} />
          </div>
          {photo
            ? <img src={photo} alt={name} className={styles.photo} />
            : <div className={styles.initials}>{initials}</div>
          }
          <span className={styles.badge}>{badge}</span>
        </div>

        {/* Identity */}
        <div className={styles.identity}>
          <h1 className={styles.name}>{name}</h1>
          <p className={styles.position}>{position}</p>
          <p className={styles.company}>Redix Digital Solutions</p>
        </div>

        {/* Divider */}
        <div className={styles.divider}>
          <span className={styles.dividerDot} />
          <span className={styles.dividerLine} />
          <span className={styles.dividerDot} />
        </div>

        {/* Contact actions */}
        <div className={styles.contacts}>

          <a className={`${styles.btn} ${styles.btnEmail}`} href={`mailto:${email}`}>
            <span className={styles.btnIcon}><FaEnvelope /></span>
            <span className={styles.btnBody}>
              <span className={styles.btnLabel}>Email</span>
              <span className={styles.btnValue}>{email}</span>
            </span>
            <FaArrowRight className={styles.btnArrow} />
          </a>

          <a className={`${styles.btn} ${styles.btnPhone}`} href={`tel:${phone}`}>
            <span className={styles.btnIcon}><FaPhone /></span>
            <span className={styles.btnBody}>
              <span className={styles.btnLabel}>Phone</span>
              <span className={styles.btnValue}>{phoneDisplay}</span>
            </span>
            <FaArrowRight className={styles.btnArrow} />
          </a>

          <a className={`${styles.btn} ${styles.btnWhatsapp}`} href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
            <span className={styles.btnIcon}><FaWhatsapp /></span>
            <span className={styles.btnBody}>
              <span className={styles.btnLabel}>WhatsApp</span>
              <span className={styles.btnValue}>{phoneDisplay}</span>
            </span>
            <FaArrowRight className={styles.btnArrow} />
          </a>

        </div>
      </div>

      <p className={styles.footer}>
        &copy; 2026{' '}
        <a href="https://www.redixdigitalsolutions.com" target="_blank" rel="noopener noreferrer">
          Redix Digital Solutions
        </a>
      </p>
    </div>
  );
}
