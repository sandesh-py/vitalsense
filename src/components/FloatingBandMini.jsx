import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Float } from '@react-three/drei';

/**
 * A smaller fitness band with orbiting data particles.
 * No text/font dependencies — pure geometry.
 */
export default function FloatingBandMini() {
  const groupRef = useRef();
  const glowRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.4;
      groupRef.current.rotation.x = Math.sin(t * 0.3) * 0.2 + 0.3;
      groupRef.current.position.y = Math.sin(t * 0.5) * 0.2;
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.15 + Math.sin(t * 2) * 0.1;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef} scale={1.2}>
        {/* Band body */}
        <RoundedBox args={[0.8, 1.6, 0.3]} radius={0.15} smoothness={6}>
          <meshStandardMaterial color="#0d1117" metalness={0.9} roughness={0.15} />
        </RoundedBox>

        {/* Screen */}
        <RoundedBox args={[0.65, 1.35, 0.31]} radius={0.12} smoothness={6} position={[0, 0, 0.005]}>
          <meshStandardMaterial color="#020408" emissive="#00F5FF" emissiveIntensity={0.15} />
        </RoundedBox>

        {/* Glow plane */}
        <mesh ref={glowRef} position={[0, 0, 0.17]}>
          <planeGeometry args={[0.6, 1.2]} />
          <meshBasicMaterial color="#00F5FF" transparent opacity={0.15} />
        </mesh>

        {/* Screen visuals — BPM ring */}
        <mesh position={[0, 0.25, 0.17]}>
          <ringGeometry args={[0.1, 0.12, 24]} />
          <meshBasicMaterial color="#00FF88" transparent opacity={0.7} />
        </mesh>

        {/* Heart dot */}
        <mesh position={[-0.15, 0.25, 0.17]}>
          <circleGeometry args={[0.03, 12]} />
          <meshBasicMaterial color="#ff3366" />
        </mesh>

        {/* Mini data bars */}
        {[0.3, 0.5, 0.35, 0.6, 0.45].map((h, i) => (
          <mesh key={i} position={[-0.2 + i * 0.1, -0.15 + h * 0.1, 0.17]}>
            <boxGeometry args={[0.05, h * 0.2, 0.003]} />
            <meshBasicMaterial color="#00F5FF" transparent opacity={0.6} />
          </mesh>
        ))}

        {/* Data stream particles orbiting the band */}
        {[...Array(8)].map((_, i) => (
          <DataParticle key={i} angle={(i / 8) * Math.PI * 2} radius={1.2} />
        ))}

        {/* Ambient glow */}
        <pointLight position={[0, 0, 0.5]} color="#00F5FF" intensity={0.5} distance={2} decay={2} />
      </group>
    </Float>
  );
}

function DataParticle({ angle, radius }) {
  const ref = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (ref.current) {
      const a = angle + t * 0.8;
      ref.current.position.x = Math.cos(a) * radius;
      ref.current.position.z = Math.sin(a) * radius * 0.3;
      ref.current.position.y = Math.sin(a * 2) * 0.3;
      ref.current.material.opacity = 0.3 + Math.sin(t * 3 + angle) * 0.3;
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial color="#00F5FF" transparent opacity={0.5} />
    </mesh>
  );
}
