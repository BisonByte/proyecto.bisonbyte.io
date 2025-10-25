import { useEffect, useState } from 'react';
import { listFluids } from '../../lib/fluidCatalog';
import type { SystemUnits } from '../../model/schema';
import { useDesignerStore } from '../state/store';

const fluids = listFluids();
const unitOptions: { value: SystemUnits; label: string }[] = [
  { value: 'SI', label: 'SI (m, kPa, L/s)' },
  { value: 'US', label: 'US (ft, psi, gpm)' },
];

export const TopBar = (): JSX.Element => {
  const {
    model,
    createJunction,
    createPipe,
    reset,
    setFluid,
    setUnits,
  } = useDesignerStore((state) => ({
    model: state.model,
    createJunction: state.createJunction,
    createPipe: state.createPipe,
    reset: state.reset,
    setFluid: state.setFluid,
    setUnits: state.setUnits,
  }));
  const [pipeFrom, setPipeFrom] = useState<string>('');
  const [pipeTo, setPipeTo] = useState<string>('');

  useEffect(() => {
    if (!pipeFrom && model.nodes.length > 0) {
      setPipeFrom(model.nodes[0]?.id ?? '');
    }
    if (!pipeTo && model.nodes.length > 1) {
      setPipeTo(model.nodes[1]?.id ?? '');
    }
  }, [model.nodes, pipeFrom, pipeTo]);

  const handleCreatePipe = () => {
    if (!pipeFrom || !pipeTo) {
      return;
    }
    createPipe(pipeFrom, pipeTo);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase text-slate-400">Unidades</label>
        <select
          value={model.units}
          onChange={(event) => setUnits(event.target.value as SystemUnits)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
        >
          {unitOptions.map((option) => (
            <option key={option.value} value={option.value} className="bg-slate-900">
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs uppercase text-slate-400">Fluido</label>
        <select
          value={model.fluidId}
          onChange={(event) => setFluid(event.target.value)}
          className="min-w-[200px] rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
        >
          {fluids.map((fluid) => (
            <option key={fluid.id} value={fluid.id} className="bg-slate-900">
              {fluid.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={createJunction}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 hover:border-cyan-400 hover:text-cyan-200"
        >
          Añadir nodo
        </button>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={pipeFrom}
          onChange={(event) => setPipeFrom(event.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
        >
          <option value="">Desde…</option>
          {model.nodes.map((node) => (
            <option key={node.id} value={node.id} className="bg-slate-900">
              {node.name}
            </option>
          ))}
        </select>
        <select
          value={pipeTo}
          onChange={(event) => setPipeTo(event.target.value)}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none"
        >
          <option value="">Hacia…</option>
          {model.nodes.map((node) => (
            <option key={node.id} value={node.id} className="bg-slate-900">
              {node.name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleCreatePipe}
          className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 hover:border-cyan-400 hover:text-cyan-200"
        >
          Crear tubería
        </button>
      </div>
      <button
        type="button"
        onClick={reset}
        className="ml-auto rounded-md border border-rose-700 bg-rose-900/30 px-3 py-2 text-sm font-medium text-rose-200 hover:border-rose-400"
      >
        Reiniciar modelo
      </button>
    </div>
  );
};

export default TopBar;
