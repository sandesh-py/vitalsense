import React, { useRef, useEffect } from 'react';

/**
 * Canvas-based PQRST waveform generator.
 * Procedurally draws a realistic ECG signal that scrolls left continuously.
 */
export default function ECGCanvas({ width = 600, height = 160, color = '#00FF88', speed = 2, lineWidth = 2.5 }) {
  const canvasRef = useRef(null);
  const offsetRef = useRef(0);
  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // PQRST template — one full cardiac cycle normalized to ~200px
    // Each point is [x_offset, y_amplitude] where y=0 is baseline
    const pqrstTemplate = [
      // Baseline (isoelectric)
      [0, 0], [10, 0], [15, 0],
      // P wave (small upward bump)
      [20, -8], [25, -14], [30, -12], [35, -8], [40, 0],
      // PR segment
      [45, 0], [50, 0],
      // Q wave (small downward dip)
      [55, 4], [58, 8],
      // R wave (sharp tall spike)
      [62, -55], [66, -70],
      // S wave (sharp downward)
      [70, 15], [74, 8],
      // ST segment
      [78, 0], [85, 0], [90, 0],
      // T wave (broad upward bump)
      [95, -6], [100, -16], [108, -20], [116, -16], [122, -6], [128, 0],
      // Baseline tail
      [135, 0], [150, 0], [170, 0], [190, 0], [200, 0],
    ];

    const cycleWidth = 200;
    const baseline = height * 0.55;

    function getY(xInCycle) {
      // Interpolate between template points
      for (let i = 0; i < pqrstTemplate.length - 1; i++) {
        const [x0, y0] = pqrstTemplate[i];
        const [x1, y1] = pqrstTemplate[i + 1];
        if (xInCycle >= x0 && xInCycle <= x1) {
          const t = (xInCycle - x0) / (x1 - x0);
          return y0 + (y1 - y0) * t;
        }
      }
      return 0;
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid lines (subtle)
      ctx.strokeStyle = 'rgba(0, 245, 255, 0.06)';
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < canvas.width; gx += 25) {
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, canvas.height);
        ctx.stroke();
      }
      for (let gy = 0; gy < canvas.height; gy += 25) {
        ctx.beginPath();
        ctx.moveTo(0, gy);
        ctx.lineTo(canvas.width, gy);
        ctx.stroke();
      }

      // Draw waveform
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = lineWidth;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;

      for (let x = 0; x < canvas.width; x++) {
        const worldX = x + offsetRef.current;
        const xInCycle = ((worldX % cycleWidth) + cycleWidth) % cycleWidth;
        const yVal = getY(xInCycle);
        const screenY = baseline + yVal;

        if (x === 0) {
          ctx.moveTo(x, screenY);
        } else {
          ctx.lineTo(x, screenY);
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Sweep line (bright leading edge)
      const sweepX = canvas.width - 2;
      const sweepWorldX = sweepX + offsetRef.current;
      const sweepXInCycle = ((sweepWorldX % cycleWidth) + cycleWidth) % cycleWidth;
      const sweepY = baseline + getY(sweepXInCycle);

      ctx.beginPath();
      ctx.arc(sweepX, sweepY, 4, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      offsetRef.current += speed;
      animRef.current = requestAnimationFrame(draw);
    }

    // Set canvas resolution to match display size
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';

    draw();

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [width, height, color, speed, lineWidth]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: '100%', height: '100%', display: 'block' }}
    />
  );
}
