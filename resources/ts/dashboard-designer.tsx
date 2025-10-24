import '../css/app.css';
import 'katex/dist/katex.min.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner';
import HydraulicDesignerWidget from './dashboard/HydraulicDesignerWidget';

const container = document.getElementById('hydraulic-designer-root');

if (container) {
  createRoot(container).render(
    <StrictMode>
      <HydraulicDesignerWidget />
      <Toaster position="top-right" richColors />
    </StrictMode>,
  );
}
