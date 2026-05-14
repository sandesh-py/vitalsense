import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Database, Cpu, AlertCircle, BellRing } from 'lucide-react';

const steps = [
  { id: 1, title: 'Collect', desc: 'Wearable + simulated sensor data streams (HR, SpO₂, BP, Temp, RR)', icon: <Activity /> },
  { id: 2, title: 'Preprocess', desc: 'Noise removal · MinMax normalization · gap interpolation via Pandas', icon: <Database /> },
  { id: 3, title: 'Classify', desc: 'Random Forest · SVM multi-class condition prediction (sklearn)', icon: <Cpu /> },
  { id: 4, title: 'Detect', desc: 'Isolation Forest · Z-Score anomaly detection on time-series windows', icon: <AlertCircle /> },
  { id: 5, title: 'Alert', desc: 'Real-time WebSocket alerts + visual dashboard notification', icon: <BellRing /> }
];

export default function HowItWorks() {
  return (
    <section className="section" style={{ backgroundColor: 'var(--navy-light)', overflow: 'hidden' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">How <span className="text-gradient-cyan">VitalSense</span> Works</h2>
          <p className="section-subtitle">A seamless, AI-driven data pipeline designed to process vital signs with microsecond precision.</p>
        </motion.div>

        {/* Pipeline Container */}
        <div style={{ position: 'relative', marginTop: '6rem', paddingBottom: '4rem' }}>
          {/* Connecting Line Background */}
          <div style={{ position: 'absolute', top: '40px', left: '10%', width: '80%', height: '4px', background: 'rgba(255, 255, 255, 0.1)', zIndex: 1, borderRadius: '2px' }}>
            <motion.div
              style={{ height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--green))', borderRadius: '2px', boxShadow: '0 0 15px var(--cyan)' }}
              initial={{ width: '0%' }}
              whileInView={{ width: '100%' }}
              viewport={{ once: true }}
              transition={{ duration: 2, ease: "easeInOut" }}
            />
          </div>

          {/* Nodes */}
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
            {steps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 50, scale: 0.8 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.4 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '18%' }}
              >
                {/* Node Circle */}
                <motion.div
                  className="glass-card flex-center pulse-glow"
                  style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '1.5rem', border: '2px solid var(--cyan)', background: 'var(--navy)' }}
                  whileHover={{ scale: 1.1, y: -10 }}
                >
                  <div style={{ color: 'var(--cyan)' }}>{step.icon}</div>
                </motion.div>
                
                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', textAlign: 'center' }}>{step.title}</h3>
                <p style={{ color: '#8c9bb4', fontSize: '0.9rem', textAlign: 'center' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
