import { useMemo } from 'react';
import EditorCanvas from '../components/EditorCanvas';
import ExportPanel from '../components/ExportPanel';
import FormulaPanel from '../components/FormulaPanel';
import ManometerPanel from '../components/ManometerPanel';
import ModelIOPanel from '../components/ModelIOPanel';
import PropertiesPanel from '../components/PropertiesPanel';
import ValidationPanel from '../components/ValidationPanel';
import { listFluids } from '../lib/fluidCatalog';
import { useModelStore } from '../state/store';
import {
  HEAD_UNIT,
  PRESSURE_UNIT,
  SPECIFIC_WEIGHT_UNIT,
  formatNumber,
  toDisplayLength,
  toDisplayPressure,
  toDisplaySpecificWeight,
} from '../utils/units';

const CANVAS_ID = 'dashboard-hydraulic-canvas';
const STAGE_ID = 'dashboard-hydraulic-stage';

const HydraulicDesignerWidget = (): JSX.Element => {
  const fluids = useMemo(() => listFluids(), []);
  const {
    model,
    results,
    setFluid,
    setUnits,
  } = useModelStore((state) => ({
    model: state.model,
    results: state.results,
    setFluid: state.setFluid,
    setUnits: state.setUnits,
  }));

  const headUnit = HEAD_UNIT[model.units];
  const pressureUnit = PRESSURE_UNIT[model.units];
  const specificWeightUnit = SPECIFIC_WEIGHT_UNIT[model.units];

  return (
    <div className="space-y-6">
      <section className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex-1 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Diseñador hidráulico</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Modela el circuito en tiempo real</h2>
              <p className="mt-2 text-sm text-white/60">
                Arrastra tanques, ajusta alturas y evalúa presiones hidrostáticas con resultados al instante.
              </p>
            </div>
            <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/70 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-widest text-white/50">TDH</p>
                <p className="text-lg font-semibold text-cyan-300">
                  {formatNumber(toDisplayLength(results.totalDynamicHead, model.units), 2)} {headUnit}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/50">Balance energía</p>
                <p className={`text-lg font-semibold ${results.energyBalance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {formatNumber(toDisplayLength(results.energyBalance, model.units), 2)} {headUnit}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/50">γ</p>
                <p className="text-lg font-semibold text-white">
                  {formatNumber(toDisplaySpecificWeight(results.specificWeight, model.units), 1)} {specificWeightUnit}
                </p>
              </div>
            </div>
          </div>
          <div className="w-full max-w-sm space-y-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs uppercase text-white/50">Fluido</span>
              <select
                value={model.fluidId}
                onChange={(event) => setFluid(event.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm focus:border-cyan-400 focus:outline-none"
              >
                {fluids.map((fluid) => (
                  <option key={fluid.id} value={fluid.id}>
                    {fluid.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="text-xs uppercase text-white/50">Sistema</span>
              <select
                value={model.units}
                onChange={(event) => setUnits(event.target.value as typeof model.units)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm focus:border-cyan-400 focus:outline-none"
              >
                <option value="SI">SI (m, kPa)</option>
                <option value="US">US (ft, psi)</option>
              </select>
            </label>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-white/70">
              P<sub>suc</sub>: {formatNumber(toDisplayPressure(results.suctionPressure, model.units), 1)} {pressureUnit} · P<sub>desc</sub>:
              {` ${formatNumber(toDisplayPressure(results.dischargePressure, model.units), 1)} ${pressureUnit}`}
            </div>
          </div>
        </div>
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
              <div className="flex h-[440px] overflow-hidden rounded-xl border border-slate-800/60 bg-slate-950/70">
                <EditorCanvas canvasId={CANVAS_ID} stageId={STAGE_ID} />
              </div>
            </div>
            <ManometerPanel />
          </div>
          <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5">
            <div className="flex-1 overflow-y-auto">
              <PropertiesPanel />
              <FormulaPanel />
              <ValidationPanel />
            </div>
            <ExportPanel canvasElementId={CANVAS_ID} />
            <ModelIOPanel />
          </div>
        </div>
      </section>
    </div>
  );
};

export default HydraulicDesignerWidget;
