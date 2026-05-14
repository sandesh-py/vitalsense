import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Globe, MessageSquare, Mail } from 'lucide-react';

export default function Footer() {
  return (
    <footer style={{ position: 'relative', background: 'var(--navy)', paddingTop: '6rem', overflow: 'hidden' }}>
      
      {/* Animated Heartbeat Top Border */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '2px', background: 'rgba(0, 245, 255, 0.1)' }}>
        <motion.div
          style={{ width: '100px', height: '2px', background: 'var(--cyan)', boxShadow: '0 0 10px var(--cyan)' }}
          animate={{ x: ['-100%', '100vw'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        />
      </div>

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>


        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '2rem 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity color="var(--cyan)" size={20} />
            <span style={{ fontWeight: 600, letterSpacing: '1px' }}>VitalSense AI</span>
          </div>

          <p style={{ color: '#8c9bb4', fontSize: '0.9rem', margin: 0 }}>© {new Date().getFullYear()} VitalSense Healthcare AI. All rights reserved.</p>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <a href="#" style={{ color: '#8c9bb4', transition: 'color 0.3s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--cyan)'} onMouseOut={e => e.currentTarget.style.color = '#8c9bb4'}><Globe size={20} /></a>
            <a href="#" style={{ color: '#8c9bb4', transition: 'color 0.3s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--cyan)'} onMouseOut={e => e.currentTarget.style.color = '#8c9bb4'}><MessageSquare size={20} /></a>
            <a href="#" style={{ color: '#8c9bb4', transition: 'color 0.3s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--cyan)'} onMouseOut={e => e.currentTarget.style.color = '#8c9bb4'}><Mail size={20} /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
