import { createRoot } from 'react-dom/client';
import { StrictMode } from 'react';
import { Toaster } from 'sonner';
import HydraulicDesignerApp from './App';
import '../polyfills';
import '../../css/app.css';
import 'katex/dist/katex.min.css';

const renderError = (message: string) => {
  const host = document.getElementById('system-editor-root');
  if (!host) return;
  host.innerHTML = `<div style="padding:24px;max-width:720px;margin:0 auto;color:#fca5a5;font-family:system-ui"><h2>Ocurrió un error al iniciar el diseñador.</h2><p>${message}</p><p style="margin-top:12px;color:#cbd5f5;">Revisa la consola del navegador para más detalles y comparte este mensaje con el equipo técnico.</p></div>`;
};

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const { error, message } = event;
    const details = error instanceof Error ? `${error.name}: ${error.message}` : message ?? 'Error desconocido.';
    renderError(details);
  });
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const details = reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason ?? 'Error desconocido.');
    renderError(details);
  });
}

const container = document.getElementById('system-editor-root');

if (!container) {
  throw new Error('No se encontró el contenedor principal “system-editor-root”.');
}

const root = createRoot(container);
root.render(
  <StrictMode>
    <HydraulicDesignerApp />
    <Toaster position="bottom-right" richColors theme="dark" />
  </StrictMode>,
);
