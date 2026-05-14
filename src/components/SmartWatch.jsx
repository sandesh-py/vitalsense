import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox, Cylinder, Text, Float } from '@react-three/drei';

export default function SmartWatch() {
  const watchRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (watchRef.current) {
      watchRef.current.rotation.y = Math.sin(t / 2) * 0.5;
      watchRef.current.rotation.x = Math.cos(t / 2) * 0.2;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <group ref={watchRef} scale={1.5}>
        {/* Watch Body / Case */}
        <RoundedBox args={[2, 2.5, 0.4]} radius={0.3} smoothness={4}>
          <meshStandardMaterial color="#111827" metalness={0.8} roughness={0.2} />
        </RoundedBox>
        
        {/* Watch Screen */}
        <RoundedBox args={[1.8, 2.3, 0.42]} radius={0.25} smoothness={4} position={[0, 0, 0.01]}>
          <meshStandardMaterial color="#000000" emissive="#000000" />
        </RoundedBox>

        {/* Glowing ECG line representation on screen */}
        <mesh position={[0, 0, 0.22]}>
          <planeGeometry args={[1.5, 0.8]} />
          <meshBasicMaterial color="#00F5FF" transparent opacity={0.8} wireframe />
        </mesh>

        {/* VitalSense Text on screen */}
        <Text
          position={[0, 0.7, 0.22]}
          fontSize={0.25}
          color="#00FF88"
          anchorX="center"
          anchorY="middle"
          font="https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfMZhrib2Bg-4.ttf"
        >
          98 bpm
        </Text>

        {/* Straps */}
        <Cylinder args={[1.2, 1.2, 1.5, 32, 1, false, 0, Math.PI]} rotation={[Math.PI / 2, 0, 0]} position={[0, 1.5, -0.6]}>
          <meshStandardMaterial color="#1E2640" roughness={0.9} />
        </Cylinder>
        <Cylinder args={[1.2, 1.2, 1.5, 32, 1, false, 0, Math.PI]} rotation={[-Math.PI / 2, 0, Math.PI]} position={[0, -1.5, -0.6]}>
          <meshStandardMaterial color="#1E2640" roughness={0.9} />
        </Cylinder>
      </group>
    </Float>
  );
}
