
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface WaveformVisualizerProps {
  isVisible: boolean;
  audioData?: number[];
}

export const WaveformVisualizer = ({ isVisible, audioData }: WaveformVisualizerProps) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const bars = useMemo(() => {
    const barCount = 64;
    const radius = 3;
    return Array.from({ length: barCount }, (_, i) => {
      const angle = (i / barCount) * Math.PI * 2;
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      return { x, z, angle, index: i };
    });
  }, []);

  useFrame((state) => {
    if (groupRef.current && isVisible) {
      groupRef.current.rotation.y += 0.01;
      
      // Animate bars based on audio data or simulation
      groupRef.current.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          const audioValue = audioData?.[index] || Math.random();
          const targetScale = 1 + audioValue * 2;
          child.scale.y = THREE.MathUtils.lerp(child.scale.y, targetScale, 0.1);
        }
      });
    }
  });

  if (!isVisible) return null;

  return (
    <group ref={groupRef}>
      {bars.map((bar) => (
        <mesh key={bar.index} position={[bar.x, 0, bar.z]}>
          <boxGeometry args={[0.1, 1, 0.1]} />
          <meshStandardMaterial
            color="#00D4FF"
            emissive="#00D4FF"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
};
