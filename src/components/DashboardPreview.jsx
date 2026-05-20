import React, { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Activity, Heart, Thermometer, Droplet, Gauge, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import ECGCanvas from './ECGCanvas';
import useVitalSigns from '../hooks/useVitalSigns';

export default function DashboardPreview() {
  const ref = useRef(null);
  const { vitals, isConnected, activeAlert } = useVitalSigns();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [3, 0, -3]);
  const rotateY = useTransform(scrollYProgress, [0, 0.5, 1], [-2, 0, 2]);
  const scale = useTransform(scrollYProgress, [0, 0.5, 1], [0.98, 1, 0.98]);

  // Extract live values or use fallbacks
  const hr = vitals?.heart_rate ?? 75;
  const spo2 = vitals?.spo2 ?? 97;
  const temp = vitals?.temperature ?? 36.6;
  const bpSys = vitals?.systolic_bp ?? 120;
  const bpDia = vitals?.diastolic_bp ?? 78;
  const anomalyActive = vitals?.anomaly_active ?? false;
  const conditionLabel = vitals?.condition_label ?? 'NORMAL';

  const hrIsAnomaly = hr > 100 || conditionLabel === 'CRITICAL';
  const showAnomaly = anomalyActive || !!activeAlert;

  return (
    <section className="section" ref={ref}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="section-title">Real-Time Intelligence, <span style={{ color: 'var(--green)' }}>Visualized</span></h2>
            <p className="section-subtitle">A command center for patient vitals — powered by live WebSocket data and ML inference.</p>
          </motion.div>
        </div>

        <div style={{ perspective: '1200px', display: 'flex', justifyContent: 'center' }}>
          <motion.div
            className={`dashboard-card ${showAnomaly ? 'anomaly-active' : 'normal-active'}`}
            style={{
              rotateX,
              rotateY,
              scale,
            }}
          >
            {/* Dashboard Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', transform: 'translateZ(30px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity color="var(--cyan)" />
                <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Patient Monitor — Bed 04</h3>
                <span style={{ fontSize: '0.75rem', color: '#8c9bb4', marginLeft: '0.5rem' }}>ID: PT-2024-0847</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                {/* Connection status */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '0.35rem',
                  fontSize: '0.7rem', color: isConnected ? 'var(--green)' : '#ff3366',
                  padding: '3px 8px', borderRadius: '12px',
                  background: isConnected ? 'rgba(0,255,136,0.08)' : 'rgba(255,51,102,0.08)',
                  border: `1px solid ${isConnected ? 'rgba(0,255,136,0.2)' : 'rgba(255,51,102,0.2)'}`
                }}>
                  {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
                  {isConnected ? 'Live' : 'Reconnecting...'}
                </div>
                {/* Status badge */}
                {showAnomaly ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: [1, 0.6, 1], scale: [1, 1.05, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                    style={{ background: 'rgba(255, 51, 102, 0.2)', color: '#ff3366', padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.85rem', border: '1px solid rgba(255, 51, 102, 0.5)' }}
                  >
                    <AlertTriangle size={14} /> {vitals?.anomaly_type || 'ANOMALY'}
                  </motion.div>
                ) : (
                  <div style={{ background: 'rgba(0, 255, 136, 0.1)', color: 'var(--green)', padding: '6px 14px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 500, fontSize: '0.85rem', border: '1px solid rgba(0, 255, 136, 0.2)' }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} /> All Vitals Normal
                  </div>
                )}
              </div>
            </div>

            {/* Dashboard Body */}
            <div className="dashboard-body-layout" style={{ transform: 'translateZ(50px)' }}>

              {/* Left Column - Multi-Wave Patient Monitor Charts */}
              <div className="dashboard-charts-col">
                
                {/* ECG Chart Panel */}
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1rem 1.25rem 1.25rem 1.25rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', height: '210px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: '#8c9bb4', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Lead II — Continuous ECG</h4>
                    <span style={{ color: showAnomaly ? '#ff3366' : 'var(--green)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                      ● {showAnomaly ? 'ANOMALY DETECTED' : 'LIVE'}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 'calc(100% - 22px)' }}>
                    <ECGCanvas
                      waveType="ecg"
                      color={showAnomaly ? '#ff3366' : '#00FF88'}
                      heartRate={hr}
                      lineWidth={2}
                    />
                  </div>
                </div>

                {/* SpO2 Plethysmograph Chart Panel */}
                <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '1rem 1.25rem 1.25rem 1.25rem', border: '1px solid rgba(255,255,255,0.05)', position: 'relative', overflow: 'hidden', height: '170px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h4 style={{ color: '#8c9bb4', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Plethysmogram — Continuous SpO₂</h4>
                    <span style={{ color: spo2 < 94 ? '#ff3366' : 'var(--cyan)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>
                      ● {spo2 < 94 ? 'HYPOXIA ALERT' : 'LIVE'}
                    </span>
                  </div>
                  <div style={{ width: '100%', height: 'calc(100% - 22px)' }}>
                    <ECGCanvas
                      waveType="pleth"
                      color={spo2 < 94 ? '#ff3366' : '#00F5FF'}
                      heartRate={hr}
                      lineWidth={1.75}
                    />
                  </div>
                </div>

              </div>

              {/* Right Column - Metric Cards */}
              <div className="dashboard-metrics-col" style={{ transform: 'translateZ(20px)' }}>
                <div className="metric-cards-grid">
                  {/* Heart Rate */}
                  <div style={{
                    background: hrIsAnomaly ? 'rgba(255, 51, 102, 0.12)' : 'rgba(255, 51, 102, 0.06)',
                    padding: '1rem', borderRadius: '12px',
                    border: `1px solid ${hrIsAnomaly ? 'rgba(255, 51, 102, 0.4)' : 'rgba(255, 51, 102, 0.15)'}`,
                    transition: 'all 0.4s ease'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: hrIsAnomaly ? '#ff3366' : '#cc4466', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                      <span>Heart Rate</span> <Heart size={16} />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 700, color: hrIsAnomaly ? '#ff3366' : 'var(--white)', fontFamily: 'var(--font-mono)', transition: 'color 0.3s' }}>
                      {hr} <span style={{ fontSize: '0.85rem', color: '#8c9bb4', fontWeight: 400 }}>bpm</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8c9bb4', marginTop: '2px' }}>Normal: 60–100 bpm</div>
                  </div>

                  {/* SpO2 */}
                  <div style={{ background: 'rgba(0, 245, 255, 0.06)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0, 245, 255, 0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--cyan)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                      <span>SpO₂</span> <Droplet size={16} />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 700, color: spo2 < 94 ? '#ff3366' : 'var(--white)', fontFamily: 'var(--font-mono)' }}>
                      {spo2} <span style={{ fontSize: '0.85rem', color: '#8c9bb4', fontWeight: 400 }}>%</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8c9bb4', marginTop: '2px' }}>Normal: 95–99%</div>
                  </div>

                  {/* Blood Pressure */}
                  <div style={{ background: 'rgba(0, 255, 136, 0.06)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(0, 255, 136, 0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--green)', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                      <span>Blood Pressure</span> <Gauge size={16} />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 700, color: bpSys > 140 ? '#ff3366' : 'var(--white)', fontFamily: 'var(--font-mono)' }}>
                      {bpSys}/{bpDia} <span style={{ fontSize: '0.85rem', color: '#8c9bb4', fontWeight: 400 }}>mmHg</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8c9bb4', marginTop: '2px' }}>Normal: 90–120/60–80</div>
                  </div>

                  {/* Temperature */}
                  <div style={{ background: 'rgba(255, 170, 0, 0.06)', padding: '1rem', borderRadius: '12px', border: '1px solid rgba(255, 170, 0, 0.15)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ffaa00', marginBottom: '0.25rem', fontSize: '0.85rem' }}>
                      <span>Temperature</span> <Thermometer size={16} />
                    </div>
                    <div style={{ fontSize: '2.2rem', fontWeight: 700, color: temp > 38 ? '#ff3366' : 'var(--white)', fontFamily: 'var(--font-mono)' }}>
                      {typeof temp === 'number' ? temp.toFixed(1) : temp} <span style={{ fontSize: '0.85rem', color: '#8c9bb4', fontWeight: 400 }}>°C</span>
                    </div>
                    <div style={{ fontSize: '0.7rem', color: '#8c9bb4', marginTop: '2px' }}>Normal: 36.5–37.2°C</div>
                  </div>
                </div>

                {/* ML Condition Label */}
                {conditionLabel !== 'NORMAL' && (
                  <div style={{
                    background: conditionLabel === 'CRITICAL' ? 'rgba(255,51,102,0.12)' : 'rgba(255,170,0,0.12)',
                    padding: '0.5rem 0.75rem', borderRadius: '8px', textAlign: 'center',
                    color: conditionLabel === 'CRITICAL' ? '#ff3366' : '#ffaa00',
                    fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px',
                    border: `1px solid ${conditionLabel === 'CRITICAL' ? 'rgba(255,51,102,0.3)' : 'rgba(255,170,0,0.3)'}`,
                    marginTop: '0.75rem'
                  }}>
                    ML: {conditionLabel} ({vitals?.rf_confidence ? (vitals.rf_confidence * 100).toFixed(0) + '% conf' : ''})
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
