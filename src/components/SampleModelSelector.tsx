import { useModelStore } from '../hooks/useModelStore';

const SAMPLE_MODELS = [
  { name: 'Pikachu', file: 'pikachu.glb' },
  { name: 'Charmander', file: 'charmander.glb' },
  { name: 'Bridge', file: 'bridge.glb' },
];

export default function SampleModelSelector() {
  const setModelUrl = useModelStore((s) => s.setModelUrl);

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const file = e.target.value;
    if (!file) return;
    const url = `${import.meta.env.BASE_URL}models/${file}`;
    setModelUrl(url, file);
    e.target.value = '';
  };

  return (
    <div className="sample-selector">
      <label htmlFor="sample-model">Or load a sample:</label>
      <select id="sample-model" onChange={handleSelect} defaultValue="">
        <option value="" disabled>
          Choose a sample model...
        </option>
        {SAMPLE_MODELS.map((m) => (
          <option key={m.file} value={m.file}>
            {m.name}
          </option>
        ))}
      </select>
    </div>
  );
}
