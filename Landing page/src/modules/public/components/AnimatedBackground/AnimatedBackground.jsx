import { useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../../../context/ThemeContext';
import styles from './AnimatedBackground.module.css';

const AnimatedBackground = () => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const scrollRef = useRef(0);
  const animFrameRef = useRef(null);
  const nodesRef = useRef([]);
  const { isDark } = useTheme();
  const themeRef = useRef(isDark);

  useEffect(() => {
    themeRef.current = isDark;
  }, [isDark]);

  const createNodes = useCallback((w, h) => {
    const count = Math.min(Math.floor((w * h) / 18000), 90);
    const nodes = [];
    for (let i = 0; i < count; i++) {
      nodes.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.8 + 0.6,
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: Math.random() * 0.008 + 0.003,
      });
    }
    return nodes;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let w, h;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (nodesRef.current.length === 0) {
        nodesRef.current = createNodes(w, h);
      }
    };

    const handleScroll = () => {
      scrollRef.current = window.scrollY;
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    const connectDist = 140;
    const mouseDist = 180;
    const parallaxFactor = 0.15;

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      const dark = themeRef.current;
      const nodes = nodesRef.current;
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const scrollOffset = scrollRef.current * parallaxFactor;

      // Draw gradient glow spot behind mouse
      if (mx > 0 && my > 0) {
        const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 220);
        if (dark) {
          grad.addColorStop(0, 'rgba(193, 45, 224, 0.06)');
          grad.addColorStop(1, 'rgba(193, 45, 224, 0)');
        } else {
          grad.addColorStop(0, 'rgba(120, 23, 182, 0.04)');
          grad.addColorStop(1, 'rgba(120, 23, 182, 0)');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(mx - 220, my - 220, 440, 440);
      }

      // Update positions
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        n.pulse += n.pulseSpeed;
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
        n.x = Math.max(0, Math.min(w, n.x));
        n.y = Math.max(0, Math.min(h, n.y));

        // Mouse repulsion (compare against scroll-adjusted screen position)
        const screenY = ((n.y - scrollOffset) % h + h) % h;
        const dx = n.x - mx;
        const dy = screenY - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < mouseDist && dist > 0) {
          const force = (mouseDist - dist) / mouseDist * 0.015;
          n.vx += (dx / dist) * force;
          n.vy += (dy / dist) * force;
        }

        // Speed damping
        const speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
        if (speed > 0.6) {
          n.vx *= 0.98;
          n.vy *= 0.98;
        }
      }

      // Precompute screen positions for all nodes
      const screenPositions = nodes.map(n => ({
        x: n.x,
        y: ((n.y - scrollOffset) % h + h) % h,
      }));

      // Draw edges
      ctx.lineWidth = 1;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = screenPositions[i].x - screenPositions[j].x;
          const dy = screenPositions[i].y - screenPositions[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectDist) {
            const opacity = (1 - dist / connectDist) * (dark ? 0.12 : 0.06);
            ctx.strokeStyle = dark
              ? `rgba(193, 45, 224, ${opacity})`
              : `rgba(120, 23, 182, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(screenPositions[i].x, screenPositions[i].y);
            ctx.lineTo(screenPositions[j].x, screenPositions[j].y);
            ctx.stroke();
          }
        }
      }

      // Mouse connections
      if (mx > 0 && my > 0) {
        for (let i = 0; i < nodes.length; i++) {
          const dx = screenPositions[i].x - mx;
          const dy = screenPositions[i].y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < mouseDist) {
            const opacity = (1 - dist / mouseDist) * (dark ? 0.25 : 0.15);
            ctx.strokeStyle = dark
              ? `rgba(193, 45, 224, ${opacity})`
              : `rgba(120, 23, 182, ${opacity})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath();
            ctx.moveTo(screenPositions[i].x, screenPositions[i].y);
            ctx.lineTo(mx, my);
            ctx.stroke();
            ctx.lineWidth = 1;
          }
        }
      }

      // Draw nodes
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const sx = screenPositions[i].x;
        const sy = screenPositions[i].y;
        const pulseR = n.r + Math.sin(n.pulse) * 0.4;
        const alpha = 0.35 + Math.sin(n.pulse) * 0.15;

        // Outer glow
        const glow = ctx.createRadialGradient(sx, sy, 0, sx, sy, pulseR * 3);
        if (dark) {
          glow.addColorStop(0, `rgba(193, 45, 224, ${alpha * 0.4})`);
          glow.addColorStop(1, 'rgba(193, 45, 224, 0)');
        } else {
          glow.addColorStop(0, `rgba(120, 23, 182, ${alpha * 0.3})`);
          glow.addColorStop(1, 'rgba(120, 23, 182, 0)');
        }
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(sx, sy, pulseR * 3, 0, Math.PI * 2);
        ctx.fill();

        // Core
        ctx.fillStyle = dark
          ? `rgba(255, 255, 255, ${alpha})`
          : `rgba(80, 10, 120, ${alpha * 0.7})`;
        ctx.beginPath();
        ctx.arc(sx, sy, pulseR, 0, Math.PI * 2);
        ctx.fill();
      }

      animFrameRef.current = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [createNodes]);

  return (
    <div className={styles.backgroundWrapper}>
      <div className={styles.gradientLayer} />
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
};

export default AnimatedBackground;
