
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { GlowingSphere } from './GlowingSphere';
import { WaveformVisualizer } from './WaveformVisualizer';

interface Scene3DProps {
  isGenerating: boolean;
  showWaveform: boolean;
}

export const Scene3D = ({ isGenerating, showWaveform }: Scene3DProps) => {
  return (
    <div className="w-full h-[400px] md:h-[500px] relative">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        style={{ background: 'transparent' }}
      >
        {/* Lighting */}
        <ambientLight intensity={0.2} />
        <pointLight position={[10, 10, 10]} color="#00D4FF" intensity={0.5} />
        <pointLight position={[-10, -10, -10]} color="#B347D9" intensity={0.5} />
        
        {/* Background stars */}
        <Stars
          radius={100}
          depth={50}
          count={5000}
          factor={4}
          saturation={0}
          fade
          speed={1}
        />
        
        {/* Main 3D elements */}
        <GlowingSphere isGenerating={isGenerating} />
        <WaveformVisualizer isVisible={showWaveform} />
        
        {/* Camera controls */}
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={Math.PI / 2}
          autoRotate
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
};
