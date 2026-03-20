import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Bounds } from '@react-three/drei';
import ModelViewer from './ModelViewer';
import LegoModelRenderer from './LegoModelRenderer';
import VoxelizeButton from './VoxelizeButton';
import WelcomeOverlay from './WelcomeOverlay';

export default function Viewport() {
  return (
    <div className="viewport">
      <WelcomeOverlay />
      <Canvas camera={{ position: [5, 5, 5], fov: 50 }}>
        <color attach="background" args={['#1a1a2e']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Grid
          args={[20, 20]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#444"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#666"
          fadeDistance={30}
          infiniteGrid
        />
        <Bounds fit clip observe>
          <group>
            <ModelViewer />
            <LegoModelRenderer />
          </group>
        </Bounds>
        <VoxelizeButton />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
}
