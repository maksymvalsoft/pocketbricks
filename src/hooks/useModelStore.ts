import { create } from 'zustand';
import type { Object3D } from 'three';
import type { VoxelGrid } from '../engine/VoxelGrid';
import type { PlacedBrick } from '../engine/brickPlacer';
import type { LegoColor } from '../data/legoColors';
import type { VoxelizeResult } from '../engine/voxelizer';

export type ViewMode = 'original' | 'lego' | 'side-by-side';

interface ModelState {
  // Model loading
  modelUrl: string | null;
  modelFileName: string | null;
  isLoadingModel: boolean;
  error: string | null;

  // Reference to the loaded 3D model object (not the whole scene)
  modelObject: Object3D | null;

  // Voxelization
  resolution: number;
  voxelGrid: VoxelGrid | null;
  voxelizeResult: VoxelizeResult | null;
  isVoxelizing: boolean;
  voxelizeProgress: number;

  // Brick placement
  placedBricks: PlacedBrick[] | null;
  colorMap: Map<string, LegoColor> | null;

  // View
  viewMode: ViewMode;

  // Convert trigger
  convertTrigger: number;

  // Actions
  setModelUrl: (url: string | null, fileName: string | null) => void;
  setModelObject: (obj: Object3D | null) => void;
  setIsLoadingModel: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setResolution: (resolution: number) => void;
  setVoxelGrid: (grid: VoxelGrid | null) => void;
  setVoxelizeResult: (result: VoxelizeResult | null) => void;
  setIsVoxelizing: (voxelizing: boolean) => void;
  setVoxelizeProgress: (progress: number) => void;
  setPlacedBricks: (bricks: PlacedBrick[] | null) => void;
  setColorMap: (map: Map<string, LegoColor> | null) => void;
  setViewMode: (mode: ViewMode) => void;
  triggerConvert: () => void;
  reset: () => void;
}

const initialState = {
  modelUrl: null,
  modelFileName: null,
  isLoadingModel: false,
  error: null,
  modelObject: null as Object3D | null,
  resolution: 32,
  voxelGrid: null,
  voxelizeResult: null as VoxelizeResult | null,
  isVoxelizing: false,
  voxelizeProgress: 0,
  placedBricks: null,
  colorMap: null,
  viewMode: 'original' as ViewMode,
  convertTrigger: 0,
};

export const useModelStore = create<ModelState>((set) => ({
  ...initialState,

  setModelUrl: (url, fileName) => {
    set((state) => {
      // Revoke previous object URL to prevent memory leaks
      if (state.modelUrl) {
        URL.revokeObjectURL(state.modelUrl);
      }
      return {
        modelUrl: url,
        modelFileName: fileName,
        error: null,
        modelObject: null,
        voxelGrid: null,
        voxelizeResult: null,
        placedBricks: null,
        colorMap: null,
        viewMode: 'original',
      };
    });
  },
  setModelObject: (obj) => set({ modelObject: obj }),
  setIsLoadingModel: (loading) => set({ isLoadingModel: loading }),
  setError: (error) => set({ error }),
  setResolution: (resolution) => set({ resolution }),
  setVoxelGrid: (grid) => set({ voxelGrid: grid }),
  setVoxelizeResult: (result) => set({ voxelizeResult: result }),
  setIsVoxelizing: (voxelizing) => set({ isVoxelizing: voxelizing }),
  setVoxelizeProgress: (progress) => set({ voxelizeProgress: progress }),
  setPlacedBricks: (bricks) => set({ placedBricks: bricks }),
  setColorMap: (map) => set({ colorMap: map }),
  setViewMode: (mode) => set({ viewMode: mode }),
  triggerConvert: () => set((state) => ({ convertTrigger: state.convertTrigger + 1 })),
  reset: () => set((state) => {
    if (state.modelUrl) {
      URL.revokeObjectURL(state.modelUrl);
    }
    return initialState;
  }),
}));
