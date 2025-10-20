import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import EditorCanvas from './components/EditorCanvas';
import ExportPanel from './components/ExportPanel';
import FormulaPanel from './components/FormulaPanel';
import ManometerPanel from './components/ManometerPanel';
import ModelIOPanel from './components/ModelIOPanel';
import PropertiesPanel from './components/PropertiesPanel';
import Toolbar from './components/Toolbar';
import ValidationPanel from './components/ValidationPanel';
import { useModelStore } from './state/store';

const App = (): JSX.Element => {
  const alerts = useModelStore((state) => state.alerts);
  const seenAlerts = useRef<Set<string>>(new Set());

  useEffect(() => {
    const previous = seenAlerts.current;
    const next = new Set<string>();
    alerts.forEach((alert) => {
      next.add(alert.id);
      if (!previous.has(alert.id) && (alert.severity === 'warning' || alert.severity === 'error')) {
        const handler = alert.severity === 'error' ? toast.error : toast.warning;
        handler(alert.title, {
          description: alert.detail,
          duration: 6000,
        });
      }
    });
    seenAlerts.current = next;
  }, [alerts]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex h-screen flex-col">
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur">
          <Toolbar />
        </header>
        <main className="flex flex-1 overflow-hidden">
          <section className="flex flex-1 flex-col">
            <EditorCanvas />
          </section>
          <aside className="w-full max-w-[420px] border-l border-slate-800 bg-slate-900/90 backdrop-blur">
            <div className="flex h-full flex-col overflow-y-auto">
              <PropertiesPanel />
              <FormulaPanel />
              <ManometerPanel />
              <ValidationPanel />
              <ExportPanel />
              <ModelIOPanel />
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default App;
