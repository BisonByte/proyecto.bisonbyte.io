import '../css/app.css';
import 'katex/dist/katex.min.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import App from './App';

const container = document.getElementById('system-editor-root');

if (container) {
  createRoot(container).render(
    <StrictMode>
      <App />
      <Toaster position="top-right" richColors />
    </StrictMode>,
  );
}
