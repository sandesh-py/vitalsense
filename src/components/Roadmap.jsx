import React from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { CheckCircle2, RefreshCw, Sparkles } from 'lucide-react';

const milestones = [
  {
    phase: 'Phase 1',
    title: 'Simulated Data Pipeline & ML',
    desc: 'Establish robust synthetic data generation and train core classification models.',
    status: 'completed',
    icon: <CheckCircle2 color="var(--green)" />
  },
  {
    phase: 'Phase 2',
    title: 'Anomaly Detection & Alerts',
    desc: 'Implement Isolation Forest and configure real-time alert thresholds.',
    status: 'completed',
    icon: <CheckCircle2 color="var(--green)" />
  },
  {
    phase: 'Phase 3',
    title: 'Wearable API Integration',
    desc: 'Connect with commercial wearables for continuous out-patient monitoring.',
    status: 'current',
    icon: <RefreshCw color="var(--cyan)" />
  },
  {
    phase: 'Phase 4',
    title: 'Hospital EHR Integration',
    desc: 'Seamless data flow into Electronic Health Records and mobile applications.',
    status: 'future',
    icon: <Sparkles color="#8c9bb4" />
  }
];

export default function Roadmap() {
  const ref = React.useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start center", "end center"]
  });

  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <section className="section" style={{ background: 'var(--navy-light)' }} ref={ref}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
          <h2 className="section-title">Future <span className="text-gradient-cyan">Roadmap</span></h2>
          <p className="section-subtitle">Our journey towards revolutionizing continuous patient monitoring.</p>
        </div>

        <div className="timeline">
          {/* Animated drawing line */}
          <motion.div
            style={{
              position: 'absolute',
              top: 0,
              left: '24px',
              width: '2px',
              height: lineHeight,
              background: 'var(--cyan)',
              boxShadow: '0 0 10px var(--cyan)',
              zIndex: 1
            }}
          />

          {milestones.map((milestone, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="timeline-item"
            >
              <div className="timeline-dot" style={{ 
                borderColor: milestone.status === 'completed' ? 'var(--green)' : milestone.status === 'current' ? 'var(--cyan)' : '#8c9bb4',
                boxShadow: milestone.status === 'completed' ? '0 0 10px var(--green)' : milestone.status === 'current' ? '0 0 10px var(--cyan)' : 'none'
              }}></div>
              
              <div className="timeline-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--cyan)', fontWeight: 600, fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{milestone.phase}</span>
                  {milestone.icon}
                </div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: milestone.status === 'future' ? '#8c9bb4' : 'var(--white)' }}>{milestone.title}</h3>
                <p style={{ color: '#8c9bb4' }}>{milestone.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
