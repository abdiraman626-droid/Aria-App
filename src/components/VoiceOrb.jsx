import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere } from '@react-three/drei';

function AnimatedOrb({ state, color }) {
  const meshRef = useRef();
  const speed = state === 'listening' ? 4 : state === 'speaking' ? 3 : state === 'thinking' ? 2 : 0.5;
  const distort = state === 'listening' ? 0.6 : state === 'speaking' ? 0.45 : state === 'thinking' ? 0.3 : 0.15;
  const scale = state === 'listening' ? 1.3 : state === 'speaking' ? 1.2 : state === 'thinking' ? 1.1 : 1;

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    }
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]} scale={scale}>
      <MeshDistortMaterial
        color={color}
        roughness={0.1}
        metalness={0.8}
        distort={distort}
        speed={speed}
        transparent
        opacity={0.9}
      />
    </Sphere>
  );
}

export default function VoiceOrb({ state = 'idle', size = 160, onClick }) {
  const colorMap = {
    idle: '#4F6EF7',
    listening: '#22c55e',
    thinking: '#f59e0b',
    speaking: '#8B5CF6',
  };
  const color = colorMap[state] || '#4F6EF7';

  return (
    <div
      onClick={onClick}
      style={{
        width: size, height: size, cursor: 'pointer', position: 'relative',
        borderRadius: '50%',
      }}
    >
      {/* Glow backdrop */}
      <div className="glow-orb" style={{
        position: 'absolute', inset: -20, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}30 0%, transparent 70%)`,
        filter: 'blur(12px)', transition: 'all 0.5s',
      }} />
      <Canvas camera={{ position: [0, 0, 2.8], fov: 45 }} style={{ borderRadius: '50%' }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 5, 5]} intensity={1.2} />
        <pointLight position={[-3, -3, 2]} intensity={0.6} color={color} />
        <AnimatedOrb state={state} color={color} />
      </Canvas>
    </div>
  );
}
