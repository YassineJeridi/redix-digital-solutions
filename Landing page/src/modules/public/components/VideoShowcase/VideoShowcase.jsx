// src/components/VideoShowcase/VideoShowcase.jsx
// Cinematic grid showcase with inline playback
import { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaPlay, FaPause, FaTimes, FaChevronLeft, FaChevronRight,
  FaVolumeUp, FaVolumeMute, FaExpand, FaFilm
} from 'react-icons/fa';
import { useTranslation } from 'react-i18next';
import { useScrollLock } from '../../../../hooks/useScrollLock';
import { videoProjects, videoCategories } from '../../data/videoShowcase';
import styles from './VideoShowcase.module.css';

const VideoShowcase = () => {
  const [filter, setFilter] = useState('All');
  const [activeVideo, setActiveVideo] = useState(null);   // full overlay
  const [hoveredId, setHoveredId] = useState(null);
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const { t } = useTranslation();

  useScrollLock(!!activeVideo);

  const filtered = useMemo(() => {
    if (filter === 'All') return videoProjects;
    return videoProjects.filter((v) => v.category === filter);
  }, [filter]);

  // ── Lightbox controls ──
  const openVideo = useCallback((video) => {
    setActiveVideo(video);
    setPlaying(true);
    setProgress(0);
  }, []);

  const closeVideo = useCallback(() => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    setActiveVideo(null);
    setPlaying(false);
    setProgress(0);
  }, []);

  const togglePlay = useCallback(() => {
    if (!videoRef.current) return;
    if (playing) videoRef.current.pause();
    else videoRef.current.play().catch(() => {});
    setPlaying((p) => !p);
  }, [playing]);

  const toggleMute = useCallback(() => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setMuted((m) => !m);
  }, []);

  const handleFullscreen = useCallback(() => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) videoRef.current.requestFullscreen();
    else if (videoRef.current.webkitRequestFullscreen) videoRef.current.webkitRequestFullscreen();
  }, []);

  // Navigate lightbox
  const navLightbox = useCallback((dir) => {
    if (!activeVideo) return;
    const idx = filtered.findIndex((v) => v.id === activeVideo.id);
    const next = (idx + dir + filtered.length) % filtered.length;
    if (videoRef.current) { videoRef.current.pause(); videoRef.current.currentTime = 0; }
    setActiveVideo(filtered[next]);
    setPlaying(true);
    setProgress(0);
  }, [activeVideo, filtered]);

  // Progress tracking
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    const update = () => setProgress((el.currentTime / el.duration) * 100 || 0);
    el.addEventListener('timeupdate', update);
    return () => el.removeEventListener('timeupdate', update);
  }, [activeVideo]);

  // Keyboard
  useEffect(() => {
    if (!activeVideo) return;
    const handler = (e) => {
      if (e.key === 'Escape') closeVideo();
      if (e.key === 'ArrowLeft') navLightbox(-1);
      if (e.key === 'ArrowRight') navLightbox(1);
      if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeVideo, closeVideo, navLightbox, togglePlay]);

  const isReel = (v) => v.type === 'reel';

  // Categories actually present in data
  const activeCats = useMemo(() => {
    const cats = ['All', ...new Set(videoProjects.map((v) => v.category))];
    return cats;
  }, []);

  return (
    <section className={styles.section} id="video-showcase">
      <div className={styles.container}>
        {/* Header */}
        <motion.div
          className={styles.header}
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className={styles.badge}>
            <FaFilm /> {t('videoShowcase.badge')}
          </span>
          <h2 className={styles.title}>{t('videoShowcase.title')}</h2>
          <p className={styles.subtitle}>{t('videoShowcase.subtitle')}</p>
        </motion.div>

        {/* Filter tabs */}
        <motion.div
          className={styles.filters}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {activeCats.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterBtn} ${filter === cat ? styles.filterActive : ''}`}
              onClick={() => setFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </motion.div>

        {/* Grid */}
        <motion.div className={styles.grid} layout>
          <AnimatePresence mode="popLayout">
            {filtered.map((video, i) => (
              <motion.div
                key={video.id}
                className={`${styles.card} ${isReel(video) ? styles.cardReel : styles.cardLandscape}`}
                layout
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ duration: 0.4, delay: i * 0.04 }}
                onMouseEnter={() => setHoveredId(video.id)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={() => openVideo(video)}
              >
                <div className={styles.cardInner}>
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className={styles.thumb}
                    loading="lazy"
                    draggable={false}
                  />

                  {/* Hover overlay */}
                  <div className={`${styles.cardOverlay} ${hoveredId === video.id ? styles.cardOverlayVisible : ''}`}>
                    <div className={styles.playCircle}>
                      <FaPlay />
                    </div>
                  </div>

                  {/* Bottom info */}
                  <div className={styles.cardInfo}>
                    <span className={styles.cardCat}>{video.category}</span>
                    <h3 className={styles.cardTitle}>{video.title}</h3>
                    <p className={styles.cardMeta}>{video.client} &middot; {video.duration}</p>
                  </div>

                  {/* Type badge */}
                  <span className={styles.typeBadge}>{isReel(video) ? '9:16' : '16:9'}</span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Lightbox overlay ── */}
      <AnimatePresence>
        {activeVideo && (
          <motion.div
            className={styles.lightbox}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if (e.target === e.currentTarget) closeVideo(); }}
          >
            {/* Nav arrows */}
            <button className={`${styles.lbNav} ${styles.lbPrev}`} onClick={() => navLightbox(-1)}>
              <FaChevronLeft />
            </button>
            <button className={`${styles.lbNav} ${styles.lbNext}`} onClick={() => navLightbox(1)}>
              <FaChevronRight />
            </button>

            {/* Close */}
            <button className={styles.lbClose} onClick={closeVideo}>
              <FaTimes />
            </button>

            {/* Video container */}
            <motion.div
              key={activeVideo.id}
              className={`${styles.lbVideoWrap} ${isReel(activeVideo) ? styles.lbReel : styles.lbLandscape}`}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <video
                ref={(el) => {
                  videoRef.current = el;
                  if (el && playing) el.play().catch(() => {});
                }}
                src={activeVideo.videoUrl}
                playsInline
                autoPlay
                className={styles.lbVideo}
                onEnded={() => setPlaying(false)}
                onClick={togglePlay}
              />

              {/* Controls bar */}
              <div className={styles.lbControls}>
                <div className={styles.lbProgress} onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = (e.clientX - rect.left) / rect.width;
                  if (videoRef.current) videoRef.current.currentTime = pct * videoRef.current.duration;
                }}>
                  <div className={styles.lbProgressFill} style={{ width: `${progress}%` }} />
                </div>
                <div className={styles.lbControlsRow}>
                  <div className={styles.lbLeft}>
                    <button className={styles.lbCtrlBtn} onClick={togglePlay}>
                      {playing ? <FaPause /> : <FaPlay />}
                    </button>
                    <button className={styles.lbCtrlBtn} onClick={toggleMute}>
                      {muted ? <FaVolumeMute /> : <FaVolumeUp />}
                    </button>
                    <span className={styles.lbTitle}>{activeVideo.title}</span>
                  </div>
                  <div className={styles.lbRight}>
                    <span className={styles.lbClient}>{activeVideo.client}</span>
                    <button className={styles.lbCtrlBtn} onClick={handleFullscreen}>
                      <FaExpand />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default VideoShowcase;
