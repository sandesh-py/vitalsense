import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { ShieldAlert, TrendingUp, Brain, Clock, ArrowRight } from 'lucide-react';
import useVitalSigns from '../hooks/useVitalSigns';

/**
 * AnomalyDemo — Now connected to the REAL live backend data stream!
 * This shows the project's core purpose: detecting an anomaly in real-time.
 */

const THRESHOLD = 100;

export default function AnomalyDemo() {
  const ref = useRef(null);
  
  // Connect to the real WebSocket stream
  const { history, vitals } = useVitalSigns();

  const [phase, setPhase] = useState('streaming'); // idle | streaming | detecting | alert
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zScore, setZScore] = useState(null);

  // Extract real live data from the backend
  const recentHistory = history.slice(-15);
  const dataPoints = recentHistory.map(r => r.heart_rate);
  const currentHR = vitals ? Math.round(vitals.heart_rate) : '--';
  const isAnomalous = vitals ? vitals.anomaly_active : false;
  const anomalyType = vitals ? vitals.anomaly_type : 'Unknown';

  // Cycle the ML pipeline indicator continuously
  useEffect(() => {
    const t = setInterval(() => setCurrentIndex(c => (c + 1) % 15), 600);
    return () => clearInterval(t);
  }, []);

  // Update Z-Score and alert phase based on real-time live data
  useEffect(() => {
    if (!vitals || history.length === 0) return;

    // 1. Variance Masking Z-Score Fix:
    // Calculate baseline mean and standard deviation exclusively from healthy historical points
    // to prevent the outlier points from inflating the variance and masking the Z-score.
    const healthyHistory = history.filter(r => !r.anomaly_active);
    let mean = 75.0;
    let std = 5.5;

    if (healthyHistory.length >= 5) {
      const hrs = healthyHistory.map(r => r.heart_rate);
      mean = hrs.reduce((a, b) => a + b, 0) / hrs.length;
      const variance = hrs.reduce((a, b) => a + (b - mean) ** 2, 0) / hrs.length;
      std = Math.sqrt(variance) || 1.0;
      // Clamp std to a minimum of 2.0 to prevent division by tiny values on flat lines
      if (std < 2.0) std = 2.0;
    }

    const z = ((vitals.heart_rate - mean) / std).toFixed(2);
    setZScore(z);

    // 2. Blinking Alert Card Fix:
    // Only transition to 'detecting' if we are not already in 'alert' or 'detecting' state.
    // This stops the card from constantly blinking/resetting on every 1s WebSocket packet.
    if (isAnomalous) {
      if (phase !== 'alert' && phase !== 'detecting') {
        setPhase('detecting');
        const timeout = setTimeout(() => {
          setPhase('alert');
        }, 600);
        return () => clearTimeout(timeout);
      }
    } else {
      setPhase('streaming');
    }
  }, [vitals, isAnomalous, history, phase]);

  return (
    <section className="section" ref={ref} style={{ background: 'linear-gradient(180deg, var(--navy) 0%, var(--navy-light) 50%, var(--navy) 100%)', overflow: 'hidden' }}>
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: 'center', marginBottom: '4rem' }}
        >
          <h2 className="section-title">Anomaly Detection <span style={{ color: '#ff3366' }}>In Action (Live)</span></h2>
          <p className="section-subtitle">Watch VitalSense detect a cardiac anomaly in real-time using Isolation Forest and Z-Score analysis directly from the backend.</p>
        </motion.div>

        {/* Main Demo Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          style={{
            maxWidth: '1000px',
            margin: '0 auto',
            borderRadius: '20px',
            background: 'rgba(10, 15, 30, 0.9)',
            border: '1px solid rgba(0, 245, 255, 0.15)',
            boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.6)',
            overflow: 'hidden'
          }}
        >
          {/* Header Bar */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '1rem 1.5rem',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(0,0,0,0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Brain size={20} color="var(--cyan)" />
              <span style={{ fontWeight: 600, fontSize: '1rem', letterSpacing: '0.5px' }}>VitalSense ML Engine (Live Data)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: phase === 'alert' ? '#ff3366' : phase === 'detecting' ? '#ffaa00' : 'var(--green)',
                boxShadow: `0 0 8px ${phase === 'alert' ? '#ff3366' : phase === 'detecting' ? '#ffaa00' : 'var(--green)'}`
              }} />
              <span style={{ color: '#8c9bb4', fontSize: '0.85rem' }}>
                {phase === 'idle' ? 'Waiting...' : phase === 'streaming' ? 'Streaming Live Data' : phase === 'detecting' ? 'Analyzing Anomaly...' : 'Alert Triggered'}
              </span>
            </div>
          </div>

          {/* Body */}
          <div style={{ display: 'flex', gap: 0 }}>
            {/* Left — Chart Area */}
            <div style={{ flex: 2, padding: '1.5rem', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ color: '#8c9bb4', margin: 0 }}>Live Heart Rate Stream (bpm)</h4>
                <span style={{ color: isAnomalous ? '#ff3366' : 'var(--green)', fontWeight: 700, fontSize: '1.4rem', fontFamily: 'var(--font-mono)' }}>
                  {currentHR} <span style={{ fontSize: '0.8rem', fontWeight: 400, color: '#8c9bb4' }}>bpm</span>
                </span>
              </div>

              {/* Bar chart visualization */}
              <div style={{
                display: 'flex', alignItems: 'flex-end', gap: '4px',
                height: '180px',
                padding: '0.5rem 0',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}>
                {dataPoints.map((val, i) => {
                  const barHeight = Math.min((val / 160) * 100, 100);
                  const isAnomaly = val > THRESHOLD;
                  return (
                    <motion.div
                      key={i}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: `${barHeight}%`, opacity: 1 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      style={{
                        flex: 1,
                        maxWidth: '40px',
                        background: isAnomaly
                          ? 'linear-gradient(180deg, #ff3366 0%, rgba(255, 51, 102, 0.3) 100%)'
                          : 'linear-gradient(180deg, var(--cyan) 0%, rgba(0, 245, 255, 0.15) 100%)',
                        borderRadius: '4px 4px 0 0',
                        position: 'relative',
                        boxShadow: isAnomaly ? '0 0 12px rgba(255, 51, 102, 0.4)' : 'none'
                      }}
                    >
                      {isAnomaly && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0.4, 1, 0.4] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          style={{
                            position: 'absolute', top: '-20px', left: '50%', transform: 'translateX(-50%)',
                            fontSize: '0.65rem', color: '#ff3366', fontWeight: 700, whiteSpace: 'nowrap'
                          }}
                        >
                          ▲
                        </motion.div>
                      )}
                    </motion.div>
                  );
                })}

                {/* Threshold line */}
                <div style={{
                  position: 'absolute',
                  bottom: `${(THRESHOLD / 160) * 100}%`,
                  left: 0, right: 0,
                  borderTop: '2px dashed rgba(255, 51, 102, 0.5)',
                  pointerEvents: 'none'
                }}>
                  <span style={{ position: 'absolute', right: 0, top: '-18px', fontSize: '0.7rem', color: '#ff3366', fontWeight: 600 }}>
                    Threshold: {THRESHOLD} bpm
                  </span>
                </div>
              </div>

              {/* Pipeline indicator */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                {['Ingest', 'Normalize', 'Z-Score', 'Isolation Forest', 'Decision'].map((step, i) => (
                  <React.Fragment key={i}>
                    <motion.div
                      animate={{
                        background: currentIndex >= (i * 3)
                          ? 'rgba(0, 245, 255, 0.2)'
                          : 'rgba(255,255,255,0.03)',
                        borderColor: currentIndex >= (i * 3)
                          ? 'rgba(0, 245, 255, 0.5)'
                          : 'rgba(255,255,255,0.08)'
                      }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                        color: currentIndex >= (i * 3) ? 'var(--cyan)' : '#8c9bb4',
                        border: '1px solid',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      {step}
                    </motion.div>
                    {i < 4 && <ArrowRight size={12} color="#8c9bb4" />}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Right — Detection Panel */}
            <div style={{ flex: 1, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', minWidth: '260px' }}>
              {/* Model Info */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <Brain size={16} color="var(--cyan)" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Active Models</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.8rem', color: '#8c9bb4' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Isolation Forest</span>
                    <span style={{ color: 'var(--green)' }}>●</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Z-Score Analysis</span>
                    <span style={{ color: 'var(--green)' }}>●</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Random Forest (clf)</span>
                    <span style={{ color: 'var(--green)' }}>●</span>
                  </div>
                </div>
              </div>

              {/* Z-Score readout */}
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '12px', padding: '1rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <TrendingUp size={16} color={zScore > 2 ? '#ff3366' : 'var(--cyan)'} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Z-Score</span>
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: zScore > 2 ? '#ff3366' : 'var(--white)' }}>
                  {zScore !== null ? zScore : '—'}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#8c9bb4', marginTop: '0.25rem' }}>
                  {zScore > 3 ? 'Severe anomaly (|z| > 3)' : zScore > 2 ? 'Anomaly detected (|z| > 2)' : 'Within normal range'}
                </div>
              </div>

              {/* Alert Card */}
              <AnimatePresence>
                {phase === 'alert' && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                    style={{
                      background: 'rgba(255, 51, 102, 0.15)',
                      border: '1px solid rgba(255, 51, 102, 0.5)',
                      borderRadius: '12px',
                      padding: '1rem',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Scanning line effect */}
                    <motion.div
                      animate={{ top: ['0%', '100%', '0%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      style={{
                        position: 'absolute', left: 0, right: 0, height: '2px',
                        background: 'linear-gradient(90deg, transparent, #ff3366, transparent)',
                        zIndex: 1
                      }}
                    />

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 0.6, repeat: Infinity }}>
                        <ShieldAlert size={18} color="#ff3366" />
                      </motion.div>
                      <span style={{ fontWeight: 700, color: '#ff3366', fontSize: '0.95rem' }}>ANOMALY ALERT</span>
                    </div>
                    <p style={{ color: 'rgba(255, 200, 200, 0.9)', fontSize: '0.8rem', margin: 0, lineHeight: 1.5 }}>
                      {anomalyType !== 'Unknown' ? anomalyType : 'Severe anomaly'} detected — HR {currentHR} bpm exceeds threshold. Z-score: {zScore}. Notifying medical team.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Timestamp */}
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#8c9bb4', fontSize: '0.75rem' }}>
                <Clock size={12} />
                <span>Latency: 340ms avg</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
