import { useDesignerStore } from '../state/store';

const severityStyles: Record<string, string> = {
  info: 'border-sky-500/60 bg-sky-500/10 text-sky-100',
  warning: 'border-amber-500/60 bg-amber-500/10 text-amber-100',
  error: 'border-rose-500/60 bg-rose-500/10 text-rose-100',
};

export const ValidationPanel = (): JSX.Element => {
  const { alerts } = useDesignerStore((state) => ({ alerts: state.alerts }));

  return (
    <section className="space-y-4 p-4">
      <header>
        <h2 className="text-lg font-semibold text-slate-100">Validaciones</h2>
        <p className="text-sm text-slate-400">
          El motor hidráulico reporta los siguientes hallazgos después de cada cambio.
        </p>
      </header>
      <ul className="space-y-3">
        {alerts.length === 0 && (
          <li className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
            Todo está en orden. Ajusta propiedades para explorar escenarios.
          </li>
        )}
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`rounded-lg border p-4 text-sm ${severityStyles[alert.severity] ?? severityStyles.info}`}
          >
            <p className="font-semibold">{alert.title}</p>
            <p className="text-xs text-slate-300/80">{alert.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ValidationPanel;
