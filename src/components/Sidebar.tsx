import FileUpload from './FileUpload';
import SampleModelSelector from './SampleModelSelector';
import VoxelizeControls from './VoxelizeControls';
import ViewModeToggle from './ViewModeToggle';
import ShoppingList from './ShoppingList';
import { useModelStore } from '../hooks/useModelStore';

export default function Sidebar() {
  const error = useModelStore((s) => s.error);

  return (
    <aside className="sidebar">
      <h2>Controls</h2>
      <FileUpload />
      <SampleModelSelector />
      <VoxelizeControls />
      <ViewModeToggle />
      <ShoppingList />
      {error && <div className="error-message">{error}</div>}
    </aside>
  );
}
