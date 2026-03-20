import { useModelStore } from '../hooks/useModelStore';
import type { ViewMode } from '../hooks/useModelStore';

const modes: { value: ViewMode; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'lego', label: 'LEGO' },
  { value: 'side-by-side', label: 'Side by Side' },
];

export default function ViewModeToggle() {
  const placedBricks = useModelStore((s) => s.placedBricks);
  const viewMode = useModelStore((s) => s.viewMode);
  const setViewMode = useModelStore((s) => s.setViewMode);

  if (!placedBricks) return null;

  return (
    <div className="view-mode-toggle">
      <h3>View Mode</h3>
      <div className="toggle-group">
        {modes.map((mode) => (
          <button
            key={mode.value}
            className={`toggle-btn ${viewMode === mode.value ? 'active' : ''}`}
            onClick={() => setViewMode(mode.value)}
          >
            {mode.label}
          </button>
        ))}
      </div>
    </div>
  );
}
