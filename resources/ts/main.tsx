import '../css/app.css';
import 'katex/dist/katex.min.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';

const updateContainerWithError = (details: string) => {
  const host = document.getElementById('system-editor-root');
  if (!host) return;
  host.innerHTML = `<div style="padding:24px;max-width:720px;margin:0 auto;color:#fca5a5;font-family:system-ui"><h2>Ocurrió un error al iniciar el editor.</h2><p>${details}</p><p style="margin-top:12px;color:#cbd5f5;">Revisa la consola del navegador para más detalles y comparte este mensaje con el equipo técnico.</p></div>`;
};

if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    const { error, message } = event;
    const details =
      error instanceof Error ? `${error.name}: ${error.message}` : message ?? 'Error desconocido.';
    updateContainerWithError(details);
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const details =
      reason instanceof Error ? `${reason.name}: ${reason.message}` : String(reason ?? 'Error desconocido.');
    updateContainerWithError(details);
  });
}

const container = document.getElementById('system-editor-root');

if (container) {
  try {
    console.info('Hydraulic designer: inicializando main.tsx');
    container.innerHTML =
      '<div style="padding:32px;text-align:center;color:#bae6fd;font-family:system-ui" data-hydraulic-init="true">Inicializando editor hidráulico…</div>';

    createRoot(container).render(
      <StrictMode>
        <App />
        <Toaster position="top-right" richColors />
      </StrictMode>,
    );
  } catch (error) {
    console.error('Error iniciando el editor hidráulico', error);
    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}`
        : 'Error desconocido al iniciar el editor hidráulico.';
    container.innerHTML = `<div style="padding:24px;max-width:720px;margin:0 auto;color:#fca5a5;font-family:system-ui"><h2>Ocurrió un error al iniciar el editor.</h2><p>${message}</p><pre style="margin-top:16px;background:rgba(248,113,113,0.12);padding:12px;border-radius:8px;color:#fecaca;overflow:auto;">${String(
      error,
    )}</pre><p style="margin-top:12px;color:#cbd5f5;">Revisa la consola del navegador para más detalles y comparte este mensaje con el equipo técnico.</p></div>`;
  }
}
