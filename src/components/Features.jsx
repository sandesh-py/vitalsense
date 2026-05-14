import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Cpu, ScanSearch, LineChart, Bell, Layers } from 'lucide-react';

const features = [
  {
    icon: <Zap />,
    title: 'Real-Time Monitoring',
    desc: 'Continuous vital sign tracking with sub-second latency for immediate insights.',
    colSpan: 1
  },
  {
    icon: <Cpu />,
    title: 'AI Classification',
    desc: 'Advanced ML models (Random Forest, SVM) predict patient conditions accurately.',
    colSpan: 2
  },
  {
    icon: <ScanSearch />,
    title: 'Anomaly Detection',
    desc: 'Instant outlier identification using Isolation Forest and Z-score algorithms.',
    colSpan: 2
  },
  {
    icon: <LineChart />,
    title: 'Time-Series Analysis',
    desc: 'Deep trend and pattern recognition across multiple vital streams.',
    colSpan: 1
  },
  {
    icon: <Bell />,
    title: 'Smart Alerts',
    desc: 'Automated, configurable emergency triggers that minimize alert fatigue.',
    colSpan: 1
  },
  {
    icon: <Layers />,
    title: 'Data Visualization',
    desc: 'Intuitive live dashboards rendering complex multidimensional medical data.',
    colSpan: 2
  }
];

export default function Features() {
  return (
    <section className="section" style={{ background: 'var(--navy)' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">Key <span className="text-gradient-cyan">Features</span></h2>
          <p className="section-subtitle">Powered by advanced data mining and machine learning to deliver unparalleled accuracy.</p>
        </motion.div>

        <div className="bento-grid">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              whileHover={{ 
                scale: 1.02, 
                rotateX: index % 2 === 0 ? 2 : -2,
                rotateY: index % 2 === 0 ? -2 : 2
              }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="glass-card bento-item"
              style={{ 
                gridColumn: `span ${feature.colSpan}`,
                transformPerspective: '1000px'
              }}
            >
              <div className="bento-icon">{feature.icon}</div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.8rem' }}>{feature.title}</h3>
              <p style={{ color: '#8c9bb4', lineHeight: 1.6 }}>{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
