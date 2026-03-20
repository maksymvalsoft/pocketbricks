import { useModelStore } from '../hooks/useModelStore';

export default function WelcomeOverlay() {
  const modelUrl = useModelStore((s) => s.modelUrl);

  if (modelUrl) return null;

  return (
    <div className="welcome-overlay">
      <div className="welcome-content">
        <div className="welcome-icon">&#x1F9F1;</div>
        <h2>Welcome to PocketBricks</h2>
        <p>Upload a 3D model (.glb or .gltf) or choose a sample model to get started.</p>
        <div className="welcome-steps">
          <div className="welcome-step">
            <span className="step-num">1</span>
            <span>Upload or select a 3D model</span>
          </div>
          <div className="welcome-step">
            <span className="step-num">2</span>
            <span>Adjust resolution and convert</span>
          </div>
          <div className="welcome-step">
            <span className="step-num">3</span>
            <span>View your LEGO creation and export the parts list</span>
          </div>
        </div>
      </div>
    </div>
  );
}
