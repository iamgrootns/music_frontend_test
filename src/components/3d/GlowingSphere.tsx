
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface GlowingSphereProps {
  isGenerating?: boolean;
}

export const GlowingSphere = ({ isGenerating = false }: GlowingSphereProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const outerSphereRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
      
      // Pulse effect during generation
      if (isGenerating) {
        const pulse = Math.sin(state.clock.elapsedTime * 4) * 0.1 + 1;
        meshRef.current.scale.setScalar(pulse);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
    
    if (outerSphereRef.current) {
      outerSphereRef.current.rotation.x -= 0.005;
      outerSphereRef.current.rotation.y -= 0.005;
    }
  });

  return (
    <group>
      {/* Outer glow sphere */}
      <Sphere ref={outerSphereRef} args={[2.5, 32, 32]}>
        <meshBasicMaterial
          color="#00D4FF"
          transparent
          opacity={0.1}
          wireframe
        />
      </Sphere>
      
      {/* Main glowing sphere */}
      <Sphere ref={meshRef} args={[1.5, 64, 64]}>
        <meshStandardMaterial
          color="#B347D9"
          emissive="#B347D9"
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </Sphere>
      
      {/* Inner core */}
      <Sphere args={[0.8, 32, 32]}>
        <meshBasicMaterial
          color="#00D4FF"
          transparent
          opacity={0.6}
        />
      </Sphere>
      
      {/* Point light for glow effect */}
      <pointLight
        position={[0, 0, 0]}
        color="#B347D9"
        intensity={isGenerating ? 2 : 1}
        distance={10}
      />
    </group>
  );
};
