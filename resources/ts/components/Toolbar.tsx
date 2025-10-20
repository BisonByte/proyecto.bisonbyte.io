import { useEffect, useMemo, useState } from 'react';
import { listFluids } from '../lib/fluidCatalog';
import { useModelStore } from '../state/store';
import { HEAD_UNIT, formatNumber } from '../utils/units';

const Toolbar = (): JSX.Element => {
  const fluids = useMemo(() => listFluids(), []);
  const { model, results, setFluid, setUnits, addJunction, addPipe } = useModelStore((state) => ({
    model: state.model,
    results: state.results,
    setFluid: state.setFluid,
    setUnits: state.setUnits,
    addJunction: state.addJunction,
    addPipe: state.addPipe,
  }));

  const [pipeFrom, setPipeFrom] = useState<string>('');
  const [pipeTo, setPipeTo] = useState<string>('');
  const [pipePanelOpen, setPipePanelOpen] = useState(false);

  useEffect(() => {
    const [first, second] = model.nodes;
    setPipeFrom((prev) => (prev && model.nodes.some((node) => node.id === prev) ? prev : first?.id ?? ''));
    setPipeTo((prev) => (prev && model.nodes.some((node) => node.id === prev) ? prev : second?.id ?? ''));
  }, [model.nodes]);

  const handleAddPipe = () => {
    if (pipeFrom && pipeTo && pipeFrom !== pipeTo) {
      addPipe(pipeFrom, pipeTo);
      setPipePanelOpen(false);
    }
  };

  const headUnit = HEAD_UNIT[model.units];

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-4 px-6 py-4">
      <div className="flex flex-1 flex-col gap-1">
        <h1 className="text-xl font-semibold text-slate-100">Editor hidráulico</h1>
        <p className="text-sm text-slate-400">
          Construye el esquema, ajusta las propiedades y obtén los balances al instante.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex flex-col text-sm">
          <span className="text-xs uppercase text-slate-400">Fluido</span>
          <select
            value={model.fluidId}
            onChange={(event) => setFluid(event.target.value)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100 shadow-sm focus:border-cyan-400 focus:outline-none"
          >
            {fluids.map((fluid) => (
              <option key={fluid.id} value={fluid.id}>
                {fluid.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col text-sm">
          <span className="text-xs uppercase text-slate-400">Sistema</span>
          <select
            value={model.units}
            onChange={(event) => setUnits(event.target.value as typeof model.units)}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1 text-sm text-slate-100 shadow-sm focus:border-cyan-400 focus:outline-none"
          >
            <option value="SI">SI (m, kPa)</option>
            <option value="US">US (ft, psi)</option>
          </select>
        </div>
        <div className="flex flex-col text-sm">
          <span className="text-xs uppercase text-slate-400">TDH</span>
          <span className="text-base font-semibold text-cyan-300">
            {formatNumber(results.totalDynamicHead, 2)} {headUnit}
          </span>
        </div>
        <div className="flex flex-col text-sm">
          <span className="text-xs uppercase text-slate-400">Balance</span>
          <span className={`text-base font-semibold ${results.energyBalance >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
            {formatNumber(results.energyBalance, 2)} {headUnit}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => addJunction()}
            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:border-cyan-400 hover:text-cyan-200"
          >
            Nueva unión
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setPipePanelOpen((value) => !value)}
              className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 hover:border-cyan-400 hover:text-cyan-200"
            >
              Nueva tubería
            </button>
            {pipePanelOpen && (
              <div className="absolute right-0 z-20 mt-2 w-64 rounded-lg border border-slate-700 bg-slate-900 p-3 text-sm shadow-xl">
                <div className="mb-2 text-xs font-semibold uppercase text-slate-400">Conexión</div>
                <label className="mb-2 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Desde</span>
                  <select
                    value={pipeFrom}
                    onChange={(event) => setPipeFrom(event.target.value)}
                    className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm"
                  >
                    {model.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="mb-2 flex flex-col gap-1">
                  <span className="text-xs text-slate-400">Hasta</span>
                  <select
                    value={pipeTo}
                    onChange={(event) => setPipeTo(event.target.value)}
                    className="rounded border border-slate-700 bg-slate-800 px-2 py-1 text-sm"
                  >
                    {model.nodes.map((node) => (
                      <option key={node.id} value={node.id}>
                        {node.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setPipePanelOpen(false)}
                    className="rounded-md px-3 py-1 text-xs font-medium text-slate-400 hover:text-slate-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleAddPipe}
                    className="rounded-md bg-cyan-500 px-3 py-1 text-xs font-semibold text-slate-900 hover:bg-cyan-400"
                  >
                    Crear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Toolbar;
