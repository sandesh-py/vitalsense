import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Float } from '@react-three/drei';
import * as THREE from 'three';

/**
 * 3D Fitness Band — sleek curved fitness tracker
 * Uses only geometry-based visuals (no Text/font loading) for reliability.
 * Features:
 *   - Elongated pill-shaped body with metallic finish
 *   - Curved silicone band straps (CatmullRomCurve3 extrusion)
 *   - OLED-style screen with animated ECG waveform
 *   - Pulsing heart indicator and data bars
 *   - Side button and ambient screen glow
 */

function BandStrap({ direction = 1 }) {
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      const y = direction * (1.4 + t * 2.8);
      const z = -0.15 - Math.sin(t * Math.PI) * 1.2 * direction * 0.8;
      pts.push(new THREE.Vector3(0, y, z));
    }
    return pts;
  }, [direction]);

  const curve = useMemo(() => new THREE.CatmullRomCurve3(points), [points]);

  const geometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.55, -0.08);
    shape.lineTo(0.55, -0.08);
    shape.quadraticCurveTo(0.62, -0.08, 0.62, 0);
    shape.lineTo(0.62, 0.08);
    shape.quadraticCurveTo(0.62, 0.16, 0.55, 0.16);
    shape.lineTo(-0.55, 0.16);
    shape.quadraticCurveTo(-0.62, 0.16, -0.62, 0.08);
    shape.lineTo(-0.62, 0);
    shape.quadraticCurveTo(-0.62, -0.08, -0.55, -0.08);

    return new THREE.ExtrudeGeometry(shape, {
      steps: 60,
      extrudePath: curve,
      bevelEnabled: false,
    });
  }, [curve]);

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial
        color="#1a1f2e"
        roughness={0.85}
        metalness={0.1}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function ECGLine() {
  const ref = useRef();
  const points = useMemo(() => {
    const pts = [];
    const segments = 80;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 0.5) * 1.0;
      let y = 0;
      const cycle = (t * 2) % 1;
      if (cycle > 0.15 && cycle < 0.22) y = Math.sin((cycle - 0.15) / 0.07 * Math.PI) * 0.04;
      else if (cycle > 0.28 && cycle < 0.32) y = -Math.sin((cycle - 0.28) / 0.04 * Math.PI) * 0.03;
      else if (cycle > 0.32 && cycle < 0.38) y = Math.sin((cycle - 0.32) / 0.06 * Math.PI) * 0.18;
      else if (cycle > 0.38 && cycle < 0.42) y = -Math.sin((cycle - 0.38) / 0.04 * Math.PI) * 0.05;
      else if (cycle > 0.50 && cycle < 0.62) y = Math.sin((cycle - 0.50) / 0.12 * Math.PI) * 0.06;
      pts.push(new THREE.Vector3(x, y, 0));
    }
    return pts;
  }, []);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  useFrame((state) => {
    if (ref.current) {
      const positions = ref.current.geometry.attributes.position;
      const t = state.clock.getElapsedTime() * 0.5;
      for (let i = 0; i < positions.count; i++) {
        const cycle = ((i / positions.count * 2 + t) % 1);
        let y = 0;
        if (cycle > 0.15 && cycle < 0.22) y = Math.sin((cycle - 0.15) / 0.07 * Math.PI) * 0.04;
        else if (cycle > 0.28 && cycle < 0.32) y = -Math.sin((cycle - 0.28) / 0.04 * Math.PI) * 0.03;
        else if (cycle > 0.32 && cycle < 0.38) y = Math.sin((cycle - 0.32) / 0.06 * Math.PI) * 0.18;
        else if (cycle > 0.38 && cycle < 0.42) y = -Math.sin((cycle - 0.38) / 0.04 * Math.PI) * 0.05;
        else if (cycle > 0.50 && cycle < 0.62) y = Math.sin((cycle - 0.50) / 0.12 * Math.PI) * 0.06;
        positions.setY(i, y);
      }
      positions.needsUpdate = true;
    }
  });

  return (
    <line ref={ref} geometry={lineGeometry}>
      <lineBasicMaterial color="#00FF88" linewidth={2} transparent opacity={0.9} />
    </line>
  );
}

function HeartPulse() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      const beat = Math.sin(t * 4) > 0.7 ? 1.4 : 1.0;
      ref.current.scale.setScalar(beat);
    }
  });
  return (
    <group ref={ref} position={[-0.3, 0.35, 0.01]}>
      <mesh>
        <circleGeometry args={[0.045, 16]} />
        <meshBasicMaterial color="#ff3366" />
      </mesh>
    </group>
  );
}

// Simple bar chart on screen (no text needed)
function DataBars() {
  const ref = useRef();
  const bars = [0.35, 0.55, 0.4, 0.7, 0.5, 0.6, 0.45];

  useFrame((state) => {
    if (ref.current) {
      const t = state.clock.getElapsedTime();
      ref.current.children.forEach((bar, i) => {
        const h = bars[i] + Math.sin(t * 2 + i) * 0.1;
        bar.scale.y = h;
        bar.position.y = -0.55 + h * 0.15 / 2;
      });
    }
  });

  return (
    <group ref={ref} position={[0, 0, 0.01]}>
      {bars.map((h, i) => (
        <mesh key={i} position={[-0.3 + i * 0.1, -0.55, 0]} scale={[1, h, 1]}>
          <boxGeometry args={[0.06, 0.15, 0.005]} />
          <meshBasicMaterial color={i > 4 ? '#00F5FF' : '#00FF88'} transparent opacity={0.7} />
        </mesh>
      ))}
    </group>
  );
}

// VitalSense status dot
function StatusDot() {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.opacity = 0.5 + Math.sin(state.clock.getElapsedTime() * 3) * 0.5;
    }
  });
  return (
    <mesh ref={ref} position={[0, 0.78, 0.01]}>
      <circleGeometry args={[0.03, 16]} />
      <meshBasicMaterial color="#00FF88" transparent opacity={1} />
    </mesh>
  );
}

export default function FitnessBand() {
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = Math.sin(t * 0.3) * 0.6;
      groupRef.current.rotation.x = Math.cos(t * 0.25) * 0.15 + 0.1;
      groupRef.current.rotation.z = Math.sin(t * 0.2) * 0.05;
    }
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <group ref={groupRef} scale={1.8}>

        {/* ═══ BAND BODY (pill-shaped tracker) ═══ */}
        <RoundedBox args={[1.3, 2.6, 0.45]} radius={0.22} smoothness={8}>
          <meshStandardMaterial color="#0d1117" metalness={0.9} roughness={0.15} />
        </RoundedBox>

        {/* Outer bezel ring */}
        <RoundedBox args={[1.35, 2.65, 0.42]} radius={0.23} smoothness={8}>
          <meshStandardMaterial color="#1c2333" metalness={0.95} roughness={0.1} />
        </RoundedBox>

        {/* ═══ OLED SCREEN ═══ */}
        <RoundedBox args={[1.1, 2.2, 0.46]} radius={0.18} smoothness={8} position={[0, 0, 0.005]}>
          <meshStandardMaterial color="#020408" emissive="#010204" emissiveIntensity={0.5} metalness={0.3} roughness={0.05} />
        </RoundedBox>

        {/* Screen content group */}
        <group position={[0, 0, 0.24]}>

          {/* Screen backlight glow */}
          <mesh position={[0, 0, -0.01]}>
            <planeGeometry args={[1.0, 2.0]} />
            <meshBasicMaterial color="#00F5FF" transparent opacity={0.04} />
          </mesh>

          {/* BPM circle indicator */}
          <mesh position={[0, 0.35, 0.01]}>
            <ringGeometry args={[0.15, 0.18, 32]} />
            <meshBasicMaterial color="#00FF88" transparent opacity={0.6} />
          </mesh>

          {/* Heart pulse dot */}
          <HeartPulse />

          {/* Status dot (top of screen) */}
          <StatusDot />

          {/* Horizontal divider lines */}
          <mesh position={[0, 0.12, 0.005]}>
            <planeGeometry args={[0.85, 0.003]} />
            <meshBasicMaterial color="#00F5FF" transparent opacity={0.25} />
          </mesh>
          <mesh position={[0, -0.35, 0.005]}>
            <planeGeometry args={[0.85, 0.003]} />
            <meshBasicMaterial color="#00F5FF" transparent opacity={0.25} />
          </mesh>

          {/* ECG Waveform */}
          <group position={[0, -0.1, 0.01]}>
            <ECGLine />
          </group>

          {/* Data bars (bottom of screen) */}
          <DataBars />

          {/* SpO2 indicator ring */}
          <mesh position={[-0.28, -0.5, 0.01]}>
            <ringGeometry args={[0.07, 0.09, 24, 1, 0, Math.PI * 1.7]} />
            <meshBasicMaterial color="#00F5FF" transparent opacity={0.7} />
          </mesh>

          {/* Temp indicator ring */}
          <mesh position={[0.28, -0.5, 0.01]}>
            <ringGeometry args={[0.07, 0.09, 24, 1, 0, Math.PI * 1.4]} />
            <meshBasicMaterial color="#ffaa00" transparent opacity={0.7} />
          </mesh>
        </group>

        {/* ═══ BAND STRAPS ═══ */}
        <BandStrap direction={1} />
        <BandStrap direction={-1} />

        {/* ═══ SIDE BUTTON ═══ */}
        <RoundedBox args={[0.08, 0.3, 0.12]} radius={0.03} smoothness={4} position={[0.72, 0.3, 0]}>
          <meshStandardMaterial color="#1c2333" metalness={0.95} roughness={0.1} />
        </RoundedBox>

        {/* ═══ SCREEN GLOW ═══ */}
        <pointLight position={[0, 0, 0.8]} color="#00F5FF" intensity={0.8} distance={3} decay={2} />
        <pointLight position={[0, 0, 0.5]} color="#00FF88" intensity={0.3} distance={2} decay={2} />
      </group>
    </Float>
  );
}
