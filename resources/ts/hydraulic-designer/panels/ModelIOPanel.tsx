import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useDesignerStore } from '../state/store';
import type { SystemModel } from '../../model/schema';

interface SavedDesign {
  id: string;
  name: string;
  savedAt: string;
  payload: SystemModel;
}

const STORAGE_KEY = 'hydraulic-designer:saved-models';

export const ModelIOPanel = (): JSX.Element => {
  const { model, importModel } = useDesignerStore((state) => ({
    model: state.model,
    importModel: state.importModel,
  }));
  const [rawJson, setRawJson] = useState('');
  const [designName, setDesignName] = useState('');
  const [savedDesigns, setSavedDesigns] = useState<SavedDesign[]>(() => {
    if (typeof window === 'undefined') {
      return [];
    }
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }
      const parsed = JSON.parse(stored) as SavedDesign[];
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      console.error('No se pudo leer el almacenamiento local', error);
      return [];
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedDesigns));
  }, [savedDesigns]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(model, null, 2));
      toast.success('Modelo copiado', {
        description: 'El JSON actual está listo para compartir o versionar.',
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
      importModel(parsed);
      toast.success('Modelo cargado', {
        description: 'El diseñador se actualizó desde el JSON proporcionado.',
      });
    } catch (error) {
      console.error(error);
      toast.error('JSON inválido', {
        description: 'Revisa la estructura y vuelve a intentarlo.',
      });
    }
  };

  const handleSaveDesign = () => {
    if (!designName.trim()) {
      toast.error('Agrega un nombre para guardar el diseño');
      return;
    }
    const entry: SavedDesign = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}`,
      name: designName.trim(),
      savedAt: new Date().toISOString(),
      payload: model,
    };
    setSavedDesigns((current) => {
      const updated = [entry, ...current.filter((item) => item.name !== entry.name)];
      toast.success('Diseño guardado', { description: `Se almacenó “${entry.name}” en este navegador.` });
      return updated;
    });
    setDesignName('');
  };

  const handleLoadDesign = (design: SavedDesign) => {
    try {
      importModel(design.payload);
      toast.success('Diseño cargado', { description: `Se restauró “${design.name}”.` });
    } catch (error) {
      console.error(error);
      toast.error('No se pudo cargar el diseño');
    }
  };

  const handleDeleteDesign = (id: string) => {
    setSavedDesigns((current) => current.filter((item) => item.id !== id));
    toast.success('Diseño eliminado');
  };

  return (
    <section className="space-y-4 p-4">
      <header>
        <h2 className="text-lg font-semibold text-slate-100">Modelo JSON</h2>
        <p className="text-sm text-slate-400">Usa este bloque como fuente de verdad versionable.</p>
      </header>
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
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
      <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <header>
          <h3 className="text-sm font-semibold text-slate-100">Diseños guardados</h3>
          <p className="text-xs text-slate-400">Se almacenan en localStorage para recuperarlos rápidamente.</p>
        </header>
        <div className="flex gap-2">
          <input
            type="text"
            value={designName}
            onChange={(event) => setDesignName(event.target.value)}
            placeholder="Nombre del diseño"
            className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleSaveDesign}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 hover:border-cyan-400 hover:text-cyan-200"
          >
            Guardar diseño
          </button>
        </div>
        <ul className="space-y-2 text-sm text-slate-200">
          {savedDesigns.length === 0 && <li className="text-xs text-slate-400">Aún no has guardado esquemas.</li>}
          {savedDesigns.map((design) => (
            <li
              key={design.id}
              className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-3 py-2"
            >
              <div>
                <p className="font-semibold text-slate-100">{design.name}</p>
                <p className="text-xs text-slate-400">
                  {new Date(design.savedAt).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleLoadDesign(design)}
                  className="rounded-md border border-slate-700 px-3 py-1 text-slate-200 hover:border-emerald-400 hover:text-emerald-200"
                >
                  Cargar
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteDesign(design.id)}
                  className="rounded-md border border-slate-700 px-3 py-1 text-slate-200 hover:border-rose-400 hover:text-rose-200"
                >
                  Borrar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
};

export default ModelIOPanel;
