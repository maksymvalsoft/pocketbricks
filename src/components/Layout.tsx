import Sidebar from './Sidebar';
import Viewport from './Viewport';

export default function Layout() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>PocketBricks</h1>
        <span className="tagline">3D Model to LEGO Converter</span>
      </header>
      <div className="layout">
        <Sidebar />
        <Viewport />
      </div>
    </div>
  );
}
