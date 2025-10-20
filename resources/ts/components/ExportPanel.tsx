import { useCallback, useState } from 'react';
import { exportDiagramPng, exportReportHtml, exportReportPdf } from '../utils/exporters';
import { useModelStore } from '../state/store';

interface ExportPanelProps {
  canvasElementId?: string;
}

const ExportPanel = ({ canvasElementId = 'system-editor-canvas' }: ExportPanelProps): JSX.Element => {
  const { model, results } = useModelStore((state) => ({
    model: state.model,
    results: state.results,
  }));
  const [isExporting, setIsExporting] = useState(false);

  const handlePng = useCallback(async () => {
    const container = document.getElementById(canvasElementId);
    if (!container) {
      return;
    }
    setIsExporting(true);
    try {
      await exportDiagramPng(container);
    } finally {
      setIsExporting(false);
    }
  }, [canvasElementId]);

  const handlePdf = useCallback(() => {
    exportReportPdf(model, results);
  }, [model, results]);

  const handleHtml = useCallback(() => {
    exportReportHtml(model, results);
  }, [model, results]);

  return (
    <section className="space-y-4 border-b border-slate-800 p-6">
      <header>
        <h2 className="text-lg font-semibold text-slate-100">Exportar</h2>
        <p className="text-sm text-slate-400">Genera entregables listos para compartir.</p>
      </header>
      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handlePng}
          disabled={isExporting}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:border-cyan-400 hover:text-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isExporting ? 'Generando PNG…' : 'Exportar esquema (PNG)'}
        </button>
        <button
          type="button"
          onClick={handlePdf}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:border-emerald-400 hover:text-emerald-200"
        >
          Exportar reporte (PDF)
        </button>
        <button
          type="button"
          onClick={handleHtml}
          className="rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:border-indigo-400 hover:text-indigo-200"
        >
          Exportar reporte (HTML)
        </button>
      </div>
    </section>
  );
};

export default ExportPanel;
