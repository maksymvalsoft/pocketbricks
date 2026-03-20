import { useCallback, useRef } from 'react';
import { useModelStore } from '../hooks/useModelStore';

const ACCEPTED_EXTENSIONS = ['.glb', '.gltf'];

function isValidFile(file: File): boolean {
  const name = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
}

export default function FileUpload() {
  const inputRef = useRef<HTMLInputElement>(null);
  const setModelUrl = useModelStore((s) => s.setModelUrl);
  const setError = useModelStore((s) => s.setError);
  const modelFileName = useModelStore((s) => s.modelFileName);

  const handleFile = useCallback(
    (file: File) => {
      if (!isValidFile(file)) {
        setError('Invalid file type. Please upload a .glb or .gltf file.');
        return;
      }
      const url = URL.createObjectURL(file);
      setModelUrl(url, file.name);
    },
    [setModelUrl, setError],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset so the same file can be re-uploaded
    e.target.value = '';
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="file-upload">
      <button
        className="upload-btn"
        onClick={() => inputRef.current?.click()}
      >
        Upload Model
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".glb,.gltf"
        onChange={handleInputChange}
        style={{ display: 'none' }}
      />
      {modelFileName && (
        <p className="file-name">Loaded: {modelFileName}</p>
      )}
      <div
        className="drop-zone"
        onDrop={handleDrop}
        onDragOver={handleDragOver}
      >
        or drag & drop a .glb / .gltf file here
      </div>
    </div>
  );
}
