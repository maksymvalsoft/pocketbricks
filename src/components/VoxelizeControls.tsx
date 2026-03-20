import { useModelStore } from '../hooks/useModelStore';

export default function VoxelizeControls() {
  const modelUrl = useModelStore((s) => s.modelUrl);
  const resolution = useModelStore((s) => s.resolution);
  const setResolution = useModelStore((s) => s.setResolution);
  const isVoxelizing = useModelStore((s) => s.isVoxelizing);
  const voxelizeProgress = useModelStore((s) => s.voxelizeProgress);
  const placedBricks = useModelStore((s) => s.placedBricks);
  const triggerConvert = useModelStore((s) => s.triggerConvert);

  if (!modelUrl) return null;

  return (
    <div className="voxelize-controls">
      <h3>Convert to LEGO</h3>

      <div className="control-row">
        <label htmlFor="resolution">
          Resolution: {resolution} studs
        </label>
        <input
          id="resolution"
          type="range"
          min={16}
          max={64}
          step={8}
          value={resolution}
          onChange={(e) => setResolution(Number(e.target.value))}
          disabled={isVoxelizing}
        />
      </div>

      <button
        className="convert-btn"
        onClick={triggerConvert}
        disabled={isVoxelizing}
      >
        {isVoxelizing ? 'Converting...' : 'Convert to LEGO'}
      </button>

      {isVoxelizing && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${voxelizeProgress}%` }}
          />
          <span className="progress-text">{voxelizeProgress}%</span>
        </div>
      )}

      {placedBricks && !isVoxelizing && (
        <p className="brick-count">
          {placedBricks.length.toLocaleString()} bricks placed
        </p>
      )}
    </div>
  );
}
