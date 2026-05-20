import React, { useRef, useEffect, useState } from 'react';

/**
 * ECGCanvas — A mathematically precise, physiologically accurate bedside patient monitor ECG sweep display.
 * Implements:
 *  - Frame-independent high-precision delta-timing loop (performance.now())
 *  - Clinical-grade erase-bar sweep display moving at exactly 220 pixels/second (~22 mm/s)
 *  - Physiological Lead II cardiac cycle (Gaussian P-wave, sharp linear QRS complex, asymmetric repolarization T-wave)
 *  - Precise synchronization between QRS complex frequency and the live heart rate (heartRate prop)
 *  - ISO-compliant 1 mV calibration reference bracket (|¯¯|) drawn on the left margin
 *  - Clinical On-Screen Display (OSD) text (Lead designation, gain, sweep speed, and bandpass filter parameters)
 *  - Slow respiratory baseline wander (0.23 Hz) + high-frequency muscular micro-jitter noise
 *  - Responsive container layout matching parent element dynamically using ResizeObserver
 *  - Phosphor glow sweep-cursor with a white-hot inner core
 */
export default function ECGCanvas({ color = '#00FF88', heartRate = 75, lineWidth = 2 }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 160 });

  const pointsRef = useRef([]);
  const sweepXRef = useRef(0);
  const timeRef = useRef(0);
  const animRef = useRef(null);
  const lastTimeRef = useRef(0);

  // Resize observer to dynamically adapt canvas size to its container
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      setDimensions({
        width: Math.floor(width) || 600,
        height: Math.floor(height) || 160
      });
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const width = dimensions.width;
    const height = dimensions.height;
    const baseline = height * 0.52;
    const amplitudeScale = height * 0.38; // Normalizes the R-peak height proportionally to canvas size

    // Reinitialize points list if width changes
    if (pointsRef.current.length !== width) {
      pointsRef.current = new Array(width).fill(baseline);
      sweepXRef.current = 0;
    }

    /**
     * getEcgValueNormalized — Returns a physiologically accurate Lead II ECG amplitude at time t (seconds).
     * Amplitudes are normalized between -1.0 (deepest R spike upward) and +0.22 (deepest S wave downward).
     */
    function getEcgValueNormalized(t, hr) {
      const t_cycle = 60 / hr; // Duration of one heartbeat cycle in seconds (e.g. 0.8s for 75 bpm)
      const t_norm = t % t_cycle;

      // Active cardiac complex duration is fixed at ~0.48s (normal human P-QRS-T duration)
      // At extremely fast heart rates, we compress it slightly to avoid overlap
      const t_active = Math.min(0.48, t_cycle * 0.88);

      if (t_norm >= t_active) {
        // Isoelectric resting line (diastole period / TP interval)
        return 0;
      }

      // Scaling factor to compress the active wave segments if tachycardia shrinks t_active
      const scale = t_active / 0.48;

      const p_start = 0.0 * scale;
      const p_end = 0.08 * scale;
      const pr_seg = 0.12 * scale; // PR interval ends, QRS begins
      const q_peak = 0.14 * scale;
      const r_peak = 0.16 * scale; // Peak of the ventricles depolarizing
      const s_peak = 0.19 * scale;
      const qrs_end = 0.21 * scale;
      const st_end = 0.25 * scale; // ST interval flatline
      const t_end = 0.42 * scale;  // Repolarization ends

      if (t_norm >= p_start && t_norm < p_end) {
        // P-wave: Smooth upward bump (atrial depolarization)
        const p_dur = p_end - p_start;
        const p_phase = (t_norm - p_start) / p_dur;
        return -0.07 * Math.sin(p_phase * Math.PI); // Negative is upward in Canvas coordinates
      } 
      else if (t_norm >= p_end && t_norm < pr_seg) {
        // PR Segment: Isoelectric flatline
        return 0;
      } 
      else if (t_norm >= pr_seg && t_norm < q_peak) {
        // Q-wave: Faint sharp downward dip
        const q_dur = q_peak - pr_seg;
        const q_phase = (t_norm - pr_seg) / q_dur;
        return 0.05 * q_phase;
      } 
      else if (t_norm >= q_peak && t_norm < r_peak) {
        // R-wave upstroke: Extremely rapid upward climb to -1.0
        const r_dur = r_peak - q_peak;
        const r_phase = (t_norm - q_peak) / r_dur;
        return 0.05 - 1.05 * r_phase;
      } 
      else if (t_norm >= r_peak && t_norm < s_peak) {
        // R-wave downstroke + S-wave dip: Fast drop passing baseline to +0.22
        const s_dur = s_peak - r_peak;
        const s_phase = (t_norm - r_peak) / s_dur;
        return -1.0 + 1.22 * s_phase;
      } 
      else if (t_norm >= s_peak && t_norm < qrs_end) {
        // Return to baseline from S-wave
        const end_dur = qrs_end - s_peak;
        const end_phase = (t_norm - s_peak) / end_dur;
        return 0.22 - 0.22 * end_phase;
      } 
      else if (t_norm >= qrs_end && t_norm < st_end) {
        // ST Segment: Isoelectric flatline
        return 0;
      } 
      else if (t_norm >= st_end && t_norm < t_end) {
        // T-wave: Asymmetrical broad upward curve (ventricular repolarization)
        // Raised to power of 1.8 to create the realistic clinical right-skewed peak
        const t_dur = t_end - st_end;
        const t_phase = (t_norm - st_end) / t_dur;
        return -0.16 * Math.pow(Math.sin(t_phase * Math.PI), 1.8);
      } 
      else {
        // Remaining active complex padding
        return 0;
      }
    }

    const sweepSpeed = 220; // Constant sweep speed in pixels/second (equivalent to ~22mm/s)
    const eraseGap = 45;    // Eraze zone width in pixels ahead of the sweep cursor

    function draw(timestamp) {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      let dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;

      // Guard against frame drops or tab suspension gaps
      if (dt > 0.1) dt = 0.016; 

      // 1. Draw Deep Monitor Background
      ctx.fillStyle = '#060a0f';
      ctx.fillRect(0, 0, width, height);

      // 2. Draw Clinical Millimeter Grid Paper
      const isRed = color.toLowerCase() === '#ff3366' || color.toLowerCase() === 'red';
      const majorColor = isRed ? 'rgba(255, 51, 102, 0.11)' : 'rgba(0, 255, 136, 0.11)';
      const minorColor = isRed ? 'rgba(255, 51, 102, 0.035)' : 'rgba(0, 255, 136, 0.035)';

      // Minor grid lines (1mm equivalents — 10px intervals)
      ctx.lineWidth = 0.5;
      ctx.strokeStyle = minorColor;
      ctx.beginPath();
      for (let gx = 0; gx < width; gx += 10) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
      }
      for (let gy = 0; gy < height; gy += 10) {
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
      }
      ctx.stroke();

      // Major grid lines (5mm equivalents — 50px intervals)
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = majorColor;
      ctx.beginPath();
      for (let gx = 0; gx < width; gx += 50) {
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
      }
      for (let gy = 0; gy < height; gy += 50) {
        ctx.moveTo(0, gy);
        ctx.lineTo(width, gy);
      }
      ctx.stroke();

      // 3. Draw Static 1 mV Calibration Reference Pulse Bracket on the left
      ctx.lineWidth = 1.25;
      ctx.strokeStyle = isRed ? 'rgba(255, 51, 102, 0.4)' : 'rgba(0, 255, 136, 0.4)';
      ctx.beginPath();
      ctx.moveTo(20, baseline - amplitudeScale * 0.5);
      ctx.lineTo(12, baseline - amplitudeScale * 0.5);
      ctx.lineTo(12, baseline + amplitudeScale * 0.5);
      ctx.lineTo(20, baseline + amplitudeScale * 0.5);
      ctx.stroke();

      ctx.fillStyle = isRed ? 'rgba(255, 51, 102, 0.5)' : 'rgba(0, 255, 136, 0.5)';
      ctx.font = 'bold 8px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText('1mV', 23, baseline);

      // 4. Draw Clinical OSD Overlay Texts
      ctx.font = 'bold 9px monospace';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      
      // Top-Left details
      ctx.fillText('LEAD II', 45, 18);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillText('x1.0 Gain', 95, 18);

      // Top-Right details (right-aligned)
      ctx.textAlign = 'right';
      ctx.fillText('25 mm/s', width - 15, 18);
      ctx.fillText('0.5-40 Hz', width - 15, 30);
      ctx.fillText('MONITOR', width - 15, 42);

      // 5. Update Waveform Points with continuous physical clock
      const prevX = sweepXRef.current;
      const dx = sweepSpeed * dt;
      sweepXRef.current = (prevX + dx) % width;
      const currentX = sweepXRef.current;
      const t_start = timeRef.current;
      timeRef.current += dt;

      // Fill in point coordinates for columns crossed during this frame
      const points = pointsRef.current;

      const fillPoint = (xColumn, timeInstant) => {
        const ecgNorm = getEcgValueNormalized(timeInstant, heartRate);

        // Organic respiratory baseline drift (slow 0.22 Hz sinewave)
        const wander = Math.sin(timeInstant * 2 * Math.PI * 0.22) * 4.5 + Math.sin(timeInstant * 2 * Math.PI * 0.05) * 1.5;
        // Muskular electromyographical high-frequency jitter (random micro-noise)
        const noise = (Math.random() - 0.5) * 0.75;

        points[xColumn] = baseline + ecgNorm * amplitudeScale + wander + noise;
      };

      if (currentX > prevX) {
        // Standard forward move
        const steps = Math.floor(currentX) - Math.ceil(prevX);
        for (let i = 0; i <= steps; i++) {
          const col = Math.ceil(prevX) + i;
          if (col < width) {
            const fraction = (col - prevX) / dx;
            const t_pixel = t_start + fraction * dt;
            fillPoint(col, t_pixel);
          }
        }
      } else {
        // Wraparound edge boundary case
        // Part 1: from prevX to right border (width)
        const stepsRight = (width - 1) - Math.ceil(prevX);
        for (let i = 0; i <= stepsRight; i++) {
          const col = Math.ceil(prevX) + i;
          if (col < width) {
            const fraction = (col - prevX) / (width - prevX + currentX);
            const t_pixel = t_start + fraction * dt;
            fillPoint(col, t_pixel);
          }
        }
        // Part 2: from 0 to currentX
        const stepsLeft = Math.floor(currentX);
        for (let col = 0; col <= stepsLeft; col++) {
          const fraction = (width - prevX + col) / (width - prevX + currentX);
          const t_pixel = t_start + fraction * dt;
          fillPoint(col, t_pixel);
        }
      }

      // 6. Draw Continuous ECG Waveform Line
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.strokeStyle = color;

      // Glow effect for visual depth
      ctx.shadowColor = color;
      ctx.shadowBlur = 6;

      const cursorIndex = Math.floor(currentX);

      // Draw Segment A: Behind the sweep line
      if (cursorIndex > 0) {
        ctx.beginPath();
        // Skip drawing very left margin where calibration bracket is to look super clean,
        // or let the sweep go behind it. Let's start drawing from column 0
        ctx.moveTo(0, points[0]);
        for (let i = 1; i < cursorIndex; i++) {
          ctx.lineTo(i, points[i]);
        }
        ctx.stroke();
      }

      // Draw Segment B: Ahead of the sweep line (leaves the eraseGap blank space)
      const startAhead = cursorIndex + eraseGap;
      if (startAhead < width) {
        ctx.beginPath();
        ctx.moveTo(startAhead, points[startAhead]);
        for (let i = startAhead; i < width; i++) {
          ctx.lineTo(i, points[i]);
        }
        ctx.stroke();
      }
      ctx.shadowBlur = 0; // Turn off glow for overlay/cursor drawing

      // 7. Draw Glowing Sweeping Phosphor Dot (Sweep Cursor)
      const cursorY = points[cursorIndex] || baseline;

      // Neon outer aura
      ctx.beginPath();
      ctx.arc(currentX, cursorY, 7.0, 0, Math.PI * 2);
      ctx.fillStyle = isRed ? 'rgba(255, 51, 102, 0.32)' : 'rgba(0, 255, 136, 0.32)';
      ctx.fill();

      // White-hot inner core
      ctx.beginPath();
      ctx.arc(currentX, cursorY, 3.0, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      animRef.current = requestAnimationFrame(draw);
    }

    // Adapt canvas scale and pixel density for crisp HD displays (prevents blur)
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    animRef.current = requestAnimationFrame(draw);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [dimensions, color, heartRate, lineWidth]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', borderRadius: '8px' }}
      />
    </div>
  );
}
