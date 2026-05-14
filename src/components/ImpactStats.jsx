import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const stats = [
  { value: 97, suffix: '%', label: 'Anomaly F1-Score (Isolation Forest)' },
  { prefix: '<', value: 2, suffix: 's', label: 'End-to-End Alert Latency' },
  { value: 5, suffix: '', label: 'Vital Parameters Monitored' },
  { value: 94, suffix: '%', label: 'Classification Precision (RF + SVM)' }
];

const Counter = ({ value, prefix = '', suffix = '' }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const duration = 2000;
      const incrementTime = (duration / end);
      
      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start === end) clearInterval(timer);
      }, incrementTime);

      return () => clearInterval(timer);
    }
  }, [value, isInView]);

  return (
    <span ref={ref} style={{ fontSize: '3.5rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--white)', lineHeight: 1 }}>
      {prefix}{count}{suffix}
    </span>
  );
};

export default function ImpactStats() {
  return (
    <section className="section" style={{ background: 'var(--navy)', borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', textAlign: 'center' }}>
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
            >
              <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              
              <div style={{ width: '40px', height: '4px', background: 'var(--cyan)', margin: '1rem 0', borderRadius: '2px' }}></div>
              
              <p style={{ color: '#8c9bb4', fontSize: '1.2rem', fontWeight: 500, maxWidth: '200px' }}>{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
