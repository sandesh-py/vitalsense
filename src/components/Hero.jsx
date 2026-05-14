import React from 'react';
import { motion } from 'framer-motion';
import { Canvas } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import { Activity } from 'lucide-react';
import FitnessBand from './FitnessBand';

export default function Hero() {
  return (
    <section
      className="section"
      style={{
        padding: 0,
        overflow: 'hidden',
        paddingTop: 'var(--navbar-height)',
      }}
    >
      {/* Floating Particles/Data Nodes */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
        {[...Array(30)].map((_, i) => (
          <motion.div
            key={i}
            style={{
              position: 'absolute',
              width: Math.random() * 5 + 2 + 'px',
              height: Math.random() * 5 + 2 + 'px',
              backgroundColor: i % 3 === 0 ? 'var(--cyan)' : i % 3 === 1 ? 'var(--green)' : '#4466ff',
              borderRadius: '50%',
              opacity: 0,
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              boxShadow: `0 0 ${Math.random() * 8 + 4}px ${i % 3 === 0 ? 'var(--cyan)' : i % 3 === 1 ? 'var(--green)' : '#4466ff'}`
            }}
            animate={{
              y: [0, -(Math.random() * 40 + 10), 0],
              x: [0, Math.random() * 20 - 10, 0],
              opacity: [0, Math.random() * 0.6 + 0.2, 0]
            }}
            transition={{
              duration: Math.random() * 4 + 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: Math.random() * 2
            }}
          />
        ))}
      </div>

      {/* Horizontal ECG sweep line */}
      <div style={{ position: 'absolute', top: '50%', left: 0, width: '100%', height: '2px', zIndex: 3, pointerEvents: 'none', overflow: 'hidden' }}>
        <motion.div
          style={{
            width: '200px', height: '2px',
            background: 'linear-gradient(90deg, transparent, var(--cyan), transparent)',
            boxShadow: '0 0 20px var(--cyan)',
          }}
          animate={{ x: ['-200px', 'calc(100vw + 200px)'] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
        />
      </div>

      {/* 50/50 Grid Content */}
      <div
        className="container"
        style={{
          position: 'relative',
          zIndex: 10,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          alignItems: 'center',
          minHeight: 'calc(100vh - var(--navbar-height))',
          gap: '2rem',
        }}
      >
        {/* Left Column — Text */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ pointerEvents: 'auto' }}
        >
          <motion.div
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <Activity color="var(--cyan)" size={24} />
            </motion.div>
            <span style={{ color: 'var(--cyan)', fontWeight: 600, letterSpacing: '3px', textTransform: 'uppercase', fontSize: '0.9rem' }}>VitalSense AI</span>
          </motion.div>
          
          <h1 style={{ marginBottom: '1.5rem', textShadow: '0 4px 30px rgba(0,0,0,0.6)' }}>
            Detect. Predict.<br />
            <span className="text-gradient-cyan">Respond.</span>
          </h1>
          
          <p style={{ fontSize: '1.15rem', color: '#8c9bb4', marginBottom: '2.5rem', maxWidth: '500px', lineHeight: 1.8 }}>
            AI-powered real-time vital sign monitoring and anomaly detection for smarter healthcare.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <motion.a
              href="#dashboard"
              className="btn-primary"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#dashboard')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              See It Live
            </motion.a>
            <motion.a
              href="#how-it-works"
              className="btn-outline"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.preventDefault();
                document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Learn More
            </motion.a>
          </div>
        </motion.div>

        {/* Right Column — 3D Fitness Band */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
          style={{
            width: '100%',
            height: '80vh',
            maxHeight: '650px',
            minHeight: '400px',
            borderRadius: '20px',
            overflow: 'hidden',
          }}
        >
          <Canvas camera={{ position: [0, 0, 9], fov: 42 }} dpr={[1, 2]}>
            <ambientLight intensity={0.4} />
            <spotLight position={[10, 15, 10]} angle={0.2} penumbra={1} intensity={1.5} castShadow />
            <pointLight position={[-8, -5, -10]} color="#00F5FF" intensity={3} />
            <pointLight position={[8, -5, 10]} color="#00FF88" intensity={2} />
            <pointLight position={[0, 8, 5]} color="#4466ff" intensity={1} />
            
            <FitnessBand />
            
            <ContactShadows position={[0, -4.5, 0]} opacity={0.3} scale={20} blur={2.5} far={6} color="#00F5FF" />
            <hemisphereLight groundColor="#0A0F1E" color="#1a2040" intensity={0.8} />
            <directionalLight position={[5, 5, 5]} intensity={0.5} color="#aaccff" />
            <OrbitControls
              enableZoom={false}
              enablePan={false}
              autoRotate
              autoRotateSpeed={0.5}
              maxPolarAngle={Math.PI / 1.8}
              minPolarAngle={Math.PI / 2.5}
            />
          </Canvas>
        </motion.div>
      </div>

      {/* Scroll Down Indicator */}
      <motion.div 
        style={{ position: 'absolute', bottom: '2rem', left: '50%', transform: 'translateX(-50%)', zIndex: 10, color: 'var(--white)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', pointerEvents: 'none' }}
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        <span style={{ fontSize: '0.75rem', letterSpacing: '2px', opacity: 0.5 }}>SCROLL</span>
        <div style={{ width: '28px', height: '46px', border: '2px solid rgba(255,255,255,0.2)', borderRadius: '14px', display: 'flex', justifyContent: 'center', padding: '5px' }}>
          <motion.div 
            style={{ width: '3px', height: '8px', backgroundColor: 'var(--cyan)', borderRadius: '2px', boxShadow: '0 0 6px var(--cyan)' }}
            animate={{ y: [0, 14, 0], opacity: [1, 0, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>

      {/* Responsive — stack on mobile */}
      <style>{`
        @media (max-width: 900px) {
          .container {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
