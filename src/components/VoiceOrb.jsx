import { useRef, Component } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sphere } from '@react-three/drei';

function AnimatedOrb({ state, color }) {
  const meshRef = useRef();
  const speed = state === 'listening' ? 4 : state === 'speaking' ? 3 : state === 'thinking' ? 2 : 0.8;
  const distort = state === 'listening' ? 0.6 : state === 'speaking' ? 0.45 : state === 'thinking' ? 0.35 : 0.2;
  const targetScale = state === 'listening' ? 1.25 : state === 'speaking' ? 1.15 : state === 'thinking' ? 1.1 : 1;

  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    meshRef.current.rotation.y = clock.getElapsedTime() * 0.4;
    meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.5) * 0.15;
    // Smooth scale transition
    const s = meshRef.current.scale.x;
    const next = s + (targetScale - s) * 0.05;
    meshRef.current.scale.setScalar(next);
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]}>
      <MeshDistortMaterial
        color={color}
        roughness={0.15}
        metalness={0.85}
        distort={distort}
        speed={speed}
        transparent
        opacity={0.92}
      />
    </Sphere>
  );
}

// Error boundary to gracefully fall back if WebGL fails
class WebGLErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: false }; }
  static getDerivedStateFromError() { return { error: true }; }
  render() { return this.state.error ? this.props.fallback : this.props.children; }
}

export default function VoiceOrb({ state = 'idle', size = 160, onClick }) {
  const colorMap = {
    idle: '#3b82f6',
    listening: '#22c55e',
    thinking: '#f59e0b',
    speaking: '#7c3aed',
  };
  const color = colorMap[state] || '#3b82f6';

  const fallbackButton = (
    <button onClick={onClick} style={{
      width: size, height: size, borderRadius: '50%', border: 'none', cursor: 'pointer',
      background: `linear-gradient(135deg, ${color}, ${color}bb)`,
      boxShadow: `0 0 40px ${color}44, 0 20px 60px ${color}33`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      transition: 'all 0.5s',
    }}>
      <span style={{ fontSize: size * 0.3, color: '#fff' }}>🎙</span>
    </button>
  );

  return (
    <div onClick={onClick} style={{ width: size, height: size, cursor: 'pointer', position: 'relative' }}>
      {/* Animated glow */}
      <div style={{
        position: 'absolute', inset: -24, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}25 0%, transparent 70%)`,
        animation: 'glow-pulse 3s ease-in-out infinite',
        transition: 'all 0.5s',
      }} />
      <WebGLErrorBoundary fallback={fallbackButton}>
        <Canvas
          camera={{ position: [0, 0, 2.8], fov: 45 }}
          style={{ borderRadius: '50%' }}
          gl={{ antialias: true, alpha: true }}
          dpr={[1, 2]}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />
          <pointLight position={[-3, -3, 2]} intensity={0.8} color={color} />
          <pointLight position={[2, 3, -1]} intensity={0.3} color="#7c3aed" />
          <AnimatedOrb state={state} color={color} />
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}
