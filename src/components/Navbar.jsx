import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'Problem', href: '#problem' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Dashboard', href: '#dashboard' },
  { label: 'Anomaly Detection', href: '#anomaly' },
  { label: 'Tech Stack', href: '#tech-stack' },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleNavClick = (e, href) => {
    e.preventDefault();
    setMobileOpen(false);
    const el = document.querySelector(href);
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          height: 'var(--navbar-height)',
          display: 'flex',
          alignItems: 'center',
          padding: '0 2rem',
          background: scrolled
            ? 'rgba(10, 15, 30, 0.75)'
            : 'rgba(10, 15, 30, 0.3)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: scrolled
            ? '1px solid rgba(0, 245, 255, 0.08)'
            : '1px solid transparent',
          transition: 'background 0.4s ease, border-bottom 0.4s ease',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            width: '100%',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Logo */}
          <a
            href="#"
            onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', textDecoration: 'none' }}
          >
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Activity color="var(--cyan)" size={22} />
            </motion.div>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontWeight: 700,
                fontSize: '1.15rem',
                letterSpacing: '0.5px',
                color: 'var(--white)',
              }}
            >
              VitalSense
            </span>
          </a>

          {/* Desktop Links */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '2rem',
            }}
            className="nav-links-desktop"
          >
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  color: 'rgba(240, 244, 255, 0.65)',
                  transition: 'color 0.25s ease',
                  letterSpacing: '0.3px',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--cyan)')}
                onMouseLeave={(e) => (e.currentTarget.style.color = 'rgba(240, 244, 255, 0.65)')}
              >
                {link.label}
              </a>
            ))}
            <motion.a
              href="#dashboard"
              onClick={(e) => handleNavClick(e, '#dashboard')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: '8px 22px',
                borderRadius: '24px',
                background: 'var(--cyan)',
                color: 'var(--navy)',
                fontWeight: 600,
                fontSize: '0.85rem',
                fontFamily: 'var(--font-heading)',
                letterSpacing: '0.3px',
                boxShadow: '0 2px 12px rgba(0, 245, 255, 0.25)',
                textDecoration: 'none',
              }}
            >
              Live Demo
            </motion.a>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation menu"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              color: 'var(--white)',
              cursor: 'pointer',
            }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              position: 'fixed',
              top: 'var(--navbar-height)',
              right: 0,
              width: '280px',
              bottom: 0,
              zIndex: 49,
              background: 'rgba(10, 15, 30, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              borderLeft: '1px solid rgba(0, 245, 255, 0.1)',
              padding: '2rem 1.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
            }}
          >
            {navLinks.map((link, i) => (
              <motion.a
                key={link.href}
                href={link.href}
                onClick={(e) => handleNavClick(e, link.href)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  fontSize: '1.05rem',
                  fontWeight: 500,
                  color: 'rgba(240, 244, 255, 0.7)',
                  textDecoration: 'none',
                  padding: '0.5rem 0',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {link.label}
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 48,
              background: 'rgba(0,0,0,0.5)',
            }}
          />
        )}
      </AnimatePresence>

      {/* Responsive CSS inline — hide desktop links on mobile, show hamburger */}
      <style>{`
        @media (max-width: 768px) {
          .nav-links-desktop {
            display: none !important;
          }
          .nav-hamburger {
            display: block !important;
          }
        }
      `}</style>
    </>
  );
}
