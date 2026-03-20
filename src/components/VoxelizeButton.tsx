import { useEffect, useRef } from 'react';
import { useModelStore } from '../hooks/useModelStore';
import { voxelizeMesh } from '../engine/voxelizer';
import { quantizeColors } from '../engine/colorQuantizer';
import { placeBricks, mergeVertically } from '../engine/brickPlacer';

/**
 * Invisible component that lives inside the Canvas.
 * Listens for a "convert" trigger from the store and performs the voxelization.
 */
export default function VoxelizeButton() {
  const convertTrigger = useModelStore((s) => s.convertTrigger);
  const prevTrigger = useRef(0);

  useEffect(() => {
    if (convertTrigger === 0 || convertTrigger === prevTrigger.current) return;
    prevTrigger.current = convertTrigger;

    const store = useModelStore.getState();
    const { resolution, modelUrl, modelObject } = store;
    if (!modelUrl || !modelObject) {
      store.setError('No model loaded');
      return;
    }

    store.setIsVoxelizing(true);
    store.setVoxelizeProgress(0);
    store.setError(null);

    setTimeout(() => {
      try {
        // Voxelize ONLY the model object, not the entire scene
        const result = voxelizeMesh(modelObject as any, {
          resolution,
          onProgress: (p) => useModelStore.getState().setVoxelizeProgress(p),
        });

        useModelStore.getState().setVoxelGrid(result.grid);
        useModelStore.getState().setVoxelizeResult(result);

        const { colorMap } = quantizeColors(result.grid);
        useModelStore.getState().setColorMap(colorMap);

        let bricks = placeBricks(result.grid, colorMap);
        bricks = mergeVertically(bricks);
        useModelStore.getState().setPlacedBricks(bricks);

        useModelStore.getState().setViewMode('lego');
        useModelStore.getState().setIsVoxelizing(false);
        useModelStore.getState().setVoxelizeProgress(100);
      } catch (err) {
        console.error('Voxelization failed:', err);
        useModelStore.getState().setError(
          err instanceof Error ? err.message : 'Voxelization failed',
        );
        useModelStore.getState().setIsVoxelizing(false);
      }
    }, 50);
  }, [convertTrigger]);

  return null;
}
