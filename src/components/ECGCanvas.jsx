import React, { useRef, useEffect, useState } from 'react';

/**
 * ECGCanvas — A mathematically precise, physiologically accurate bedside patient monitor trace generator.
 * Supports:
 *  - waveType = 'ecg': Represents a Lead II ECG waveform with an iconic 1 mV calibration pulse and Lead OSD labels.
 *  - waveType = 'pleth': Represents a SpO2 Photoplethysmograph (PPG) arterial pulse wave with a distinct dicrotic notch.
 * Implements:
 *  - Frame-independent high-precision delta-timing loop (performance.now())
 *  - Clinical-grade erase-bar sweep display moving at exactly 220 pixels/second (~22 mm/s)
 *  - Precise synchronization between wave frequency and the live heart rate (heartRate prop)
 *  - Slow respiratory baseline wander (0.22 Hz) + high-frequency muscle micro-jitter noise
 *  - Responsive container layout matching parent element dynamically using ResizeObserver
 *  - Phosphor glow sweep-cursor with a white-hot inner core
 */
export default function ECGCanvas({ color = '#00FF88', heartRate = 75, waveType = 'ecg', lineWidth = 2 }) {
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
    const amplitudeScale = height * (waveType === 'ecg' ? 0.38 : 0.33); // Proportional wave height scale

    // Reinitialize points list if width changes
    if (pointsRef.current.length !== width) {
      pointsRef.current = new Array(width).fill(baseline);
      sweepXRef.current = 0;
    }

    /**
     * getEcgValueNormalized — Returns a physiologically accurate Lead II ECG amplitude at time t.
     */
    function getEcgValueNormalized(t, hr) {
      const t_cycle = 60 / hr;
      const t_norm = t % t_cycle;

      // Active P-QRS-T complex is fixed at ~0.48s
      const t_active = Math.min(0.48, t_cycle * 0.88);

      if (t_norm >= t_active) {
        return 0; // Flat baseline during diastole
      }

      const scale = t_active / 0.48;

      const p_start = 0.0 * scale;
      const p_end = 0.08 * scale;
      const pr_seg = 0.12 * scale;
      const q_peak = 0.14 * scale;
      const r_peak = 0.16 * scale;
      const s_peak = 0.19 * scale;
      const qrs_end = 0.21 * scale;
      const st_end = 0.25 * scale;
      const t_end = 0.42 * scale;

      if (t_norm >= p_start && t_norm < p_end) {
        const p_dur = p_end - p_start;
        const p_phase = (t_norm - p_start) / p_dur;
        return -0.07 * Math.sin(p_phase * Math.PI);
      } 
      else if (t_norm >= p_end && t_norm < pr_seg) {
        return 0;
      } 
      else if (t_norm >= pr_seg && t_norm < q_peak) {
        const q_dur = q_peak - pr_seg;
        const q_phase = (t_norm - pr_seg) / q_dur;
        return 0.05 * q_phase;
      } 
      else if (t_norm >= q_peak && t_norm < r_peak) {
        const r_dur = r_peak - q_peak;
        const r_phase = (t_norm - q_peak) / r_dur;
        return 0.05 - 1.05 * r_phase;
      } 
      else if (t_norm >= r_peak && t_norm < s_peak) {
        const s_dur = s_peak - r_peak;
        const s_phase = (t_norm - r_peak) / s_dur;
        return -1.0 + 1.22 * s_phase;
      } 
      else if (t_norm >= s_peak && t_norm < qrs_end) {
        const end_dur = qrs_end - s_peak;
        const end_phase = (t_norm - s_peak) / end_dur;
        return 0.22 - 0.22 * end_phase;
      } 
      else if (t_norm >= qrs_end && t_norm < st_end) {
        return 0;
      } 
      else if (t_norm >= st_end && t_norm < t_end) {
        const t_dur = t_end - st_end;
        const t_phase = (t_norm - st_end) / t_dur;
        return -0.16 * Math.pow(Math.sin(t_phase * Math.PI), 1.8);
      } 
      else {
        return 0;
      }
    }

    /**
     * getPlethValueNormalized — Returns a physiologically accurate PPG SpO2 arterial pulse wave.
     * Includes a distinct dicrotic notch caused by aortic valve closure.
     */
    function getPlethValueNormalized(t, hr) {
      const t_cycle = 60 / hr;
      const t_norm = t % t_cycle;

      // Primary systolic pressure wave
      const w1 = 0.35 * t_cycle;
      const y1 = (t_norm < w1) ? -0.85 * Math.pow(Math.sin((t_norm / w1) * Math.PI), 2) : 0;

      // Secondary diastolic wave (dicrotic notch bounce)
      const start2 = 0.27 * t_cycle;
      const w2 = 0.38 * t_cycle;
      const y2 = (t_norm >= start2 && t_norm < start2 + w2)
        ? -0.22 * Math.pow(Math.sin(((t_norm - start2) / w2) * Math.PI), 2)
        : 0;

      return y1 + y2;
    }

    const sweepSpeed = 220; // Constant sweep speed in pixels/second
    const eraseGap = 45;    // Blank space ahead of the sweep cursor

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
      const majorColor = isRed ? 'rgba(255, 51, 102, 0.11)' : (waveType === 'pleth' ? 'rgba(0, 245, 255, 0.09)' : 'rgba(0, 255, 136, 0.11)');
      const minorColor = isRed ? 'rgba(255, 51, 102, 0.035)' : (waveType === 'pleth' ? 'rgba(0, 245, 255, 0.025)' : 'rgba(0, 255, 136, 0.035)');

      // Minor grid lines (10px intervals)
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

      // Major grid lines (50px intervals)
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

      // 3. Draw OSD Labels & Calibration Pulse
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';

      if (waveType === 'ecg') {
        // Draw 1 mV Calibration Bracket (voltage-based calibration)
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
        ctx.fillText('1mV', 23, baseline);

        // OSD Labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
        ctx.font = 'bold 9px monospace';
        ctx.fillText('LEAD II', 45, 18);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillText('x1.0 Gain', 95, 18);
      } else {
        // Pleth OSD Labels
        ctx.fillStyle = waveType === 'pleth' ? 'rgba(0, 245, 255, 0.5)' : 'rgba(255, 255, 255, 0.35)';
        ctx.fillText('PLETH', 15, 18);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillText('SpO₂ x1.0 Auto', 55, 18);
      }

      // Top-Right Details (common)
      ctx.textAlign = 'right';
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.fillText('25 mm/s', width - 15, 18);
      ctx.fillText(waveType === 'ecg' ? '0.5-40 Hz' : '0.1-15 Hz', width - 15, 30);
      ctx.fillText('MONITOR', width - 15, 42);

      // 4. Update Waveform Points with continuous physical clock
      const prevX = sweepXRef.current;
      const dx = sweepSpeed * dt;
      sweepXRef.current = (prevX + dx) % width;
      const currentX = sweepXRef.current;
      const t_start = timeRef.current;
      timeRef.current += dt;

      const points = pointsRef.current;

      const fillPoint = (xColumn, timeInstant) => {
        let valNorm = 0;
        if (waveType === 'ecg') {
          valNorm = getEcgValueNormalized(timeInstant, heartRate);
        } else {
          valNorm = getPlethValueNormalized(timeInstant, heartRate);
        }

        // Organic respiratory baseline drift (0.22 Hz)
        const wander = Math.sin(timeInstant * 2 * Math.PI * 0.22) * (waveType === 'ecg' ? 4.5 : 2.5);
        // High-frequency muscular noise (reduced slightly for Pleth)
        const noise = (Math.random() - 0.5) * (waveType === 'ecg' ? 0.75 : 0.35);

        points[xColumn] = baseline + valNorm * amplitudeScale + wander + noise;
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

      // 5. Draw Continuous Waveform Line
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

      // 6. Draw Glowing Sweeping Phosphor Dot (Sweep Cursor)
      const cursorY = points[cursorIndex] || baseline;

      // Neon outer aura
      ctx.beginPath();
      ctx.arc(currentX, cursorY, 7.0, 0, Math.PI * 2);
      ctx.fillStyle = isRed ? 'rgba(255, 51, 102, 0.32)' : (waveType === 'pleth' ? 'rgba(0, 245, 255, 0.28)' : 'rgba(0, 255, 136, 0.32)');
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
  }, [dimensions, color, heartRate, waveType, lineWidth]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{ display: 'block', borderRadius: '8px' }}
      />
    </div>
  );
}
