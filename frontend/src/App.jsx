import { useMemo, useState } from 'react';

const categories = ['papelaria', 'fachada', 'embalagem', 'camiseta', 'mobile', 'desktop', 'tablet'];

function App() {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState('mobile');
  const [prompt, setPrompt] = useState('');
  const [mockups, setMockups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file]);

  const generateMockups = async () => {
    if (!file) {
      setError('Envie uma imagem PNG para continuar.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('image', file);
    formData.append('category', category);
    formData.append('prompt', prompt);

    try {
      const response = await fetch('/api/mockups', { method: 'POST', body: formData });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message || 'Falha ao gerar mockups');

      setMockups(data.mockups);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const regenerateCard = async (index) => {
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);
    formData.append('category', category);
    formData.append('prompt', prompt);
    formData.append('seed', String(index + Date.now() % 10));

    try {
      const response = await fetch('/api/mockups/regenerate', { method: 'POST', body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Falha ao refazer');

      setMockups((current) => current.map((item, i) => (i === index ? data : item)));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <main className="container">
      <section className="panel">
        <h1>Mockup Studio</h1>
        <p>Gere 4 mockups automaticamente com upload PNG, categoria e descrição opcional.</p>

        <label className="field">
          Imagem PNG
          <input
            type="file"
            accept="image/png"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </label>

        <label className="field">
          Categoria
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Descrição opcional
          <textarea
            rows={3}
            value={prompt}
            placeholder="Ex: mockup premium minimalista com iluminação suave"
            onChange={(e) => setPrompt(e.target.value)}
          />
        </label>

        <button type="button" onClick={generateMockups} disabled={loading}>
          {loading ? 'Gerando...' : 'Gerar 4 Mockups'}
        </button>
        {error && <p className="error">{error}</p>}

        {previewUrl && (
          <div className="previewBox">
            <span>Prévia do arquivo enviado</span>
            <img src={previewUrl} alt="Prévia do upload" />
          </div>
        )}
      </section>

      <section className="results">
        {mockups.length === 0 ? (
          <div className="empty">Os mockups gerados aparecerão aqui.</div>
        ) : (
          mockups.map((item, index) => (
            <article key={item.id} className="card">
              <img src={item.imageUrl} alt={`Mockup ${index + 1}`} />
              <div className="actions">
                <a href={item.imageUrl} download={`mockup-${index + 1}.png`}>
                  Baixar
                </a>
                <button type="button" onClick={() => regenerateCard(index)}>
                  Refazer
                </button>
              </div>
            </article>
          ))
        )}
      </section>
    </main>
  );
}

export default App;
