import React from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';

import { Database, Watch } from 'lucide-react';
import FloatingBandMini from './FloatingBandMini';

const techStack = ['Python', 'Scikit-learn', 'Pandas', 'NumPy', 'Plotly', 'Flask/FastAPI', 'WebSocket'];

export default function TechStack() {
  return (
    <section className="section" style={{ background: 'var(--navy-light)', overflow: 'hidden', position: 'relative' }}>
      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <h2 className="section-title">Built On <span className="text-gradient-cyan">Reliable Data</span></h2>
          <p className="section-subtitle">A robust technology stack designed for high-throughput medical data processing.</p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '4rem', alignItems: 'center', justifyContent: 'center', maxWidth: '900px', margin: '0 auto' }}>
          {/* Left Column - Data Sources */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <motion.div 
              className="glass-card" 
              style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem', position: 'relative' }}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div style={{ background: 'rgba(0, 245, 255, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--cyan)' }}>
                <Database size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Simulated Python Vital Data</h3>
                <p style={{ color: '#8c9bb4' }}>High-fidelity synthetic physiological data generation for rigorous model training.</p>
              </div>
            </motion.div>

            <motion.div 
              className="glass-card" 
              style={{ padding: '2rem', display: 'flex', alignItems: 'center', gap: '1.5rem' }}
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 0.85, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div style={{ background: 'rgba(0, 255, 136, 0.1)', padding: '1rem', borderRadius: '12px', color: 'var(--green)' }}>
                <Watch size={32} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Fitbit Wearable API <span style={{ fontSize: '0.75rem', background: 'rgba(0, 255, 136, 0.15)', color: 'var(--green)', padding: '3px 10px', borderRadius: '12px', marginLeft: '8px', verticalAlign: 'middle' }}>Future</span></h3>
                <p style={{ color: '#8c9bb4' }}>Direct integration with consumer wearables for continuous out-patient monitoring.</p>
              </div>
            </motion.div>
          </div>

          {/* Center — 3D Fitness Band */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.3 }}
            style={{ height: '350px', width: '100%' }}
          >
            <Canvas camera={{ position: [0, 0, 5], fov: 40 }} dpr={[1, 1.5]}>
              <ambientLight intensity={0.3} />
              <pointLight position={[3, 3, 3]} color="#00F5FF" intensity={2} />
              <pointLight position={[-3, -2, 2]} color="#00FF88" intensity={1.5} />
              <FloatingBandMini />
              <hemisphereLight groundColor="#0A0F1E" color="#1a2040" intensity={0.8} />
              <directionalLight position={[3, 3, 3]} intensity={0.4} color="#aaccff" />
            </Canvas>
          </motion.div>

        </div>
      </div>

      {/* Responsive override for mobile */}
      <style>{`
        @media (max-width: 900px) {
          .container > div:last-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
