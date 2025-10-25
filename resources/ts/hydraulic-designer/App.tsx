import DesignerLayout from './layout/DesignerLayout';
import Canvas from './canvas/Canvas';
import PropertiesPanel from './panels/PropertiesPanel';
import ValidationPanel from './panels/ValidationPanel';
import ModelIOPanel from './panels/ModelIOPanel';
import TopBar from './panels/TopBar';
import { useDesignerStore } from './state/store';
import { formatNumber } from '../utils/units';

const FooterSummary = (): JSX.Element => {
  const { results } = useDesignerStore((state) => ({ results: state.results }));
  return (
    <div className="flex flex-wrap items-center gap-4">
      <p>TDH: {formatNumber(results.totalDynamicHead, 2)} m</p>
      <p>Pérdida en succión: {formatNumber(results.suctionLoss, 2)} m</p>
      <p>Pérdida en descarga: {formatNumber(results.dischargeLoss, 2)} m</p>
      <p>NPSHA: {formatNumber(results.npsha, 2)} m</p>
    </div>
  );
};

export const HydraulicDesignerApp = (): JSX.Element => {
  return (
    <DesignerLayout
      header={<TopBar />}
      canvas={<Canvas />}
      leftPanel={
        <div className="space-y-6">
          <ValidationPanel />
          <ModelIOPanel />
        </div>
      }
      rightPanel={<PropertiesPanel />}
      footer={<FooterSummary />}
    />
  );
};

export default HydraulicDesignerApp;
