import { useEffect, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { useModelStore } from '../hooks/useModelStore';

/**
 * Renders the original 3D model.
 *
 * IMPORTANT: We do NOT apply any parent group translation to the clone.
 * For SkinnedMesh models, parent translations cause a "double-shift" because
 * the translation affects both the bone matrixWorld values AND the model matrix
 * in the skinning pipeline. The original model always stays at its raw position.
 * Side-by-side separation is handled by offsetting only the LEGO model.
 */
export default function ModelViewer() {
  const modelUrl = useModelStore((s) => s.modelUrl);

  if (!modelUrl) return null;

  return <Model url={modelUrl} />;
}

function Model({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const viewMode = useModelStore((s) => s.viewMode);
  const setModelObject = useModelStore((s) => s.setModelObject);

  const cloned = useMemo(() => scene.clone(true), [scene]);

  // Store the original (un-centered) scene so the voxelizer can work on it directly
  useEffect(() => {
    setModelObject(scene);
    return () => {
      setModelObject(null);
    };
  }, [scene, setModelObject]);

  const visible = viewMode === 'original' || viewMode === 'side-by-side';

  // Never translate the original model — SkinnedMesh breaks with parent offsets.
  // Side-by-side separation is achieved by moving only the LEGO model.
  return (
    <group visible={visible}>
      <primitive object={cloned} />
    </group>
  );
}
