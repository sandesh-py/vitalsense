import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, Activity, Clock, FileWarning } from 'lucide-react';

const problems = [
  {
    icon: <AlertTriangle size={24} color="var(--cyan)" />,
    title: "Undetected Anomalies",
    description: "Vital sign anomalies often go undetected for too long, leading to critical complications.",
    align: "left"
  },
  {
    icon: <Activity size={24} color="var(--green)" />,
    title: "Missed Patterns",
    description: "Manual monitoring frequently misses subtle data patterns that indicate early warning signs.",
    align: "right"
  },
  {
    icon: <Clock size={24} color="#ff3366" />,
    title: "Delayed Responses",
    description: "Emergency response delays cost lives when seconds matter most in critical care.",
    align: "left"
  },
  {
    icon: <FileWarning size={24} color="#ffaa00" />,
    title: "Lack of Context",
    description: "Decisions lack real-time data context, leading to suboptimal patient outcomes.",
    align: "right"
  }
];

export default function Problem() {
  return (
    <section className="section" style={{ background: 'linear-gradient(180deg, var(--navy) 0%, var(--navy-light) 100%)' }}>
      {/* Grid Background */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'linear-gradient(rgba(0, 245, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 245, 255, 0.05) 1px, transparent 1px)', backgroundSize: '50px 50px', pointerEvents: 'none' }}></div>

      <div className="container" style={{ position: 'relative', zIndex: 2 }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="section-title">The Cost of <span style={{ color: '#ff3366' }}>Delay</span></h2>
          <p className="section-subtitle">Current monitoring systems fail to detect subtle changes in patient condition before they escalate to emergencies.</p>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '800px', margin: '0 auto' }}>
          {problems.map((problem, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: problem.align === 'left' ? -50 : 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="glass-card"
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1.5rem',
                padding: '2rem',
                marginLeft: problem.align === 'right' ? 'auto' : '0',
                marginRight: problem.align === 'left' ? 'auto' : '0',
                width: '80%',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Subtle hover gradient */}
              <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: problem.align === 'left' ? 'var(--cyan)' : 'var(--green)' }}></div>
              
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1rem', borderRadius: '12px' }}>
                {problem.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{problem.title}</h3>
                <p style={{ color: '#8c9bb4', fontSize: '1.1rem' }}>{problem.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
