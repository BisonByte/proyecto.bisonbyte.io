import { useState } from 'react';
import { toast } from 'sonner';
import { useModelStore } from '../state/store';

const ModelIOPanel = (): JSX.Element => {
  const { model, loadModel } = useModelStore((state) => ({
    model: state.model,
    loadModel: state.loadModel,
  }));
  const [rawJson, setRawJson] = useState('');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(model, null, 2));
      toast.success('Modelo copiado', {
        description: 'Puedes pegarlo en tu gestor de versiones o compartirlo.',
      });
    } catch (error) {
      console.error(error);
      toast.error('No se pudo copiar el modelo');
    }
  };

  const handleLoad = () => {
    try {
      if (!rawJson.trim()) {
        return;
      }
      const parsed = JSON.parse(rawJson);
      loadModel(parsed);
      toast.success('Modelo cargado', {
        description: 'El esquema se actualizó desde el JSON proporcionado.',
      });
    } catch (error) {
      console.error(error);
      toast.error('JSON inválido', {
        description: 'Revisa la estructura y vuelve a intentarlo.',
      });
    }
  };

  return (
    <section className="space-y-4 p-6">
      <header>
        <h2 className="text-lg font-semibold text-slate-100">Modelo JSON</h2>
        <p className="text-sm text-slate-400">Usa este bloque como fuente de verdad versionable.</p>
      </header>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:border-cyan-400 hover:text-cyan-200"
          >
            Copiar JSON actual
          </button>
          <button
            type="button"
            onClick={handleLoad}
            className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:border-emerald-400 hover:text-emerald-200"
          >
            Cargar desde JSON
          </button>
        </div>
        <textarea
          value={rawJson}
          onChange={(event) => setRawJson(event.target.value)}
          placeholder="Pega aquí un modelo validado por Zod para importar el esquema"
          rows={6}
          className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm font-mono text-slate-200 focus:border-cyan-400 focus:outline-none"
        />
      </div>
    </section>
  );
};

export default ModelIOPanel;
