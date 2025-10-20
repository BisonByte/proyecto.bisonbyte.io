import { useMemo } from 'react';
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

const ManometerPanel = (): JSX.Element => {
  const { results, model } = useModelStore((state) => ({
    results: state.results,
    model: state.model,
  }));

  const headUnit = HEAD_UNIT[model.units];
  const pressureUnit = PRESSURE_UNIT[model.units];
  const specificWeightUnit = SPECIFIC_WEIGHT_UNIT[model.units];

  const summary = useMemo(() => results.nodeSummaries, [results.nodeSummaries]);

  return (
    <section className="space-y-4 border-b border-slate-800 p-6">
      <header>
        <h2 className="text-lg font-semibold text-slate-100">Manómetro virtual</h2>
        <p className="text-sm text-slate-400">
          Referencia ordenada de alturas, γ y presiones absolutas/relativas calculadas con P = γ·h.
        </p>
      </header>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800 text-sm">
            <thead className="bg-slate-900/80 text-xs uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-4 py-3 text-left">Punto</th>
                <th className="px-4 py-3 text-left">Altura ({headUnit})</th>
                <th className="px-4 py-3 text-left">γ ({specificWeightUnit})</th>
                <th className="px-4 py-3 text-left">P abs ({pressureUnit})</th>
                <th className="px-4 py-3 text-left">P rel ({pressureUnit})</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {summary.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium text-slate-100">{item.label}</td>
                  <td className="px-4 py-3">{formatNumber(toDisplayLength(item.elevation, model.units), 2)}</td>
                  <td className="px-4 py-3">
                    {formatNumber(toDisplaySpecificWeight(item.specificWeight, model.units), 1)}
                  </td>
                  <td className="px-4 py-3">{formatNumber(toDisplayPressure(item.absolutePressure, model.units), 2)}</td>
                  <td className="px-4 py-3">{formatNumber(toDisplayPressure(item.gaugePressure, model.units), 2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-xs text-slate-300">
        <p className="font-semibold text-slate-100">Interpretación rápida</p>
        <ul className="mt-2 space-y-2">
          <li>
            • Los puntos marcados como “superficie” usan directamente la presión de gas o la atmosférica.
          </li>
          <li>
            • Bases de tanque y uniones aplican P = P₀ + γ·Δz − γ·h<sub>L</sub> siguiendo el trazo del grafo.
          </li>
          <li>
            • Las entradas/salidas de bomba muestran Psuc y Pdesc con el aporte de altura y pérdidas integradas.
          </li>
        </ul>
      </div>
    </section>
  );
};

export default ManometerPanel;
