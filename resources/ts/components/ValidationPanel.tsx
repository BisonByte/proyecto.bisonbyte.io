import { useModelStore } from '../state/store';
import { HEAD_UNIT, PRESSURE_UNIT, formatNumber, toDisplayPressure } from '../utils/units';

const toneClass = {
  info: 'text-slate-300 border-slate-700',
  warning: 'text-amber-300 border-amber-500/60',
  error: 'text-rose-300 border-rose-500/70',
} as const;

const ValidationPanel = (): JSX.Element => {
  const { alerts, results, model } = useModelStore((state) => ({
    alerts: state.alerts,
    results: state.results,
    model: state.model,
  }));

  const headUnit = HEAD_UNIT[model.units];
  const pressureUnit = PRESSURE_UNIT[model.units];

  return (
    <section className="space-y-4 border-b border-slate-800 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Validaciones</h2>
          <p className="text-sm text-slate-400">Revisa condiciones críticas antes de entregar resultados.</p>
        </div>
        <div className="rounded-full border border-slate-700 px-3 py-1 text-xs text-slate-300">
          NPSHa {formatNumber(results.npsha, 2)} {headUnit}
        </div>
      </header>
      <div className="grid grid-cols-1 gap-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-100">Presiones</span>
            <span className="text-xs text-slate-400">({pressureUnit})</span>
          </div>
          <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-xs uppercase text-slate-500">Succión</dt>
              <dd className="font-semibold text-cyan-300">
                {formatNumber(toDisplayPressure(results.suctionPressure, model.units), 1)}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase text-slate-500">Descarga</dt>
              <dd className="font-semibold text-emerald-300">
                {formatNumber(toDisplayPressure(results.dischargePressure, model.units), 1)}
              </dd>
            </div>
          </dl>
        </div>
        {alerts.length === 0 && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-200">
            Sistema consistente: no se detectaron infracciones hidráulicas.
          </div>
        )}
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-xl border bg-slate-900/70 p-4 text-sm ${toneClass[alert.severity]}`}
          >
            <div className="font-semibold">{alert.title}</div>
            <p className="mt-1 text-xs text-slate-300/80">{alert.detail}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default ValidationPanel;
