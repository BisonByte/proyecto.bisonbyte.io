import type { InputHTMLAttributes, ReactNode } from 'react';
import {
  type JunctionNode,
  type PumpNode,
  type SystemNode,
  type SystemPipe,
  type SystemUnits,
  type TankNode,
} from '../../model/schema';
import {
  FLOW_UNIT,
  HEAD_UNIT,
  LENGTH_UNIT,
  PRESSURE_UNIT,
  formatNumber,
  fromDisplayFlow,
  fromDisplayLength,
  fromDisplayPressure,
  toDisplayFlow,
  toDisplayLength,
  toDisplayPressure,
} from '../../utils/units';
import { useDesignerStore } from '../state/store';

const numberOrNull = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
    <header>
      <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
    </header>
    <div className="space-y-3">{children}</div>
  </section>
);

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  suffix?: string;
}

const Field = ({ label, suffix, className, ...props }: FieldProps) => (
  <label className="flex flex-col gap-1 text-sm">
    <span className="text-xs uppercase text-slate-400">
      {label}
      {suffix ? ` (${suffix})` : ''}
    </span>
    <input
      {...props}
      className={`rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none ${className ?? ''}`.trim()}
    />
  </label>
);

const renderJunction = (
  node: JunctionNode,
  units: SystemUnits,
  updateNode: (id: string, updater: (node: SystemNode) => SystemNode) => void,
  removeNode: (id: string) => void,
) => {
  const lengthUnit = LENGTH_UNIT[units];
  const flowUnit = FLOW_UNIT[units];
  return (
    <Section title={node.name}>
      <button
        type="button"
        onClick={() => removeNode(node.id)}
        className="text-xs font-medium text-rose-300 hover:text-rose-200"
      >
        Eliminar nodo
      </button>
      <Field
        label="Nombre"
        value={node.name}
        onChange={(event) =>
          updateNode(node.id, (current) => ({
            ...current,
            name: event.target.value,
          }))
        }
      />
      <Field
        label="Cota"
        suffix={lengthUnit}
        type="number"
        value={toDisplayLength(node.properties.elevation, units)}
        onChange={(event) => {
          const value = numberOrNull(event.target.value);
          if (value === null) return;
          updateNode(node.id, (current) => ({
            ...current,
            properties: {
              ...current.properties,
              elevation: fromDisplayLength(value, units),
            },
          }));
        }}
      />
      <Field
        label="Demanda"
        suffix={flowUnit}
        type="number"
        min={0}
        step={0.01}
        value={toDisplayFlow(node.properties.demand, units)}
        onChange={(event) => {
          const value = numberOrNull(event.target.value);
          if (value === null) return;
          updateNode(node.id, (current) => ({
            ...current,
            properties: {
              ...current.properties,
              demand: fromDisplayFlow(value, units),
            },
          }));
        }}
      />
    </Section>
  );
};

const renderTank = (
  node: TankNode,
  units: SystemUnits,
  updateNode: (id: string, updater: (node: SystemNode) => SystemNode) => void,
  removeNode: (id: string) => void,
) => {
  const lengthUnit = LENGTH_UNIT[units];
  const pressureUnit = PRESSURE_UNIT[units];
  return (
    <Section title={node.name}>
      <button
        type="button"
        onClick={() => removeNode(node.id)}
        className="text-xs font-medium text-rose-300 hover:text-rose-200"
      >
        Eliminar nodo
      </button>
      <Field
        label="Nombre"
        value={node.name}
        onChange={(event) =>
          updateNode(node.id, (current) => ({
            ...current,
            name: event.target.value,
          }))
        }
      />
      <Field
        label="Cota base"
        suffix={lengthUnit}
        type="number"
        value={toDisplayLength(node.properties.baseElevation, units)}
        onChange={(event) => {
          const value = numberOrNull(event.target.value);
          if (value === null) return;
          updateNode(node.id, (current) => ({
            ...current,
            properties: {
              ...current.properties,
              baseElevation: fromDisplayLength(value, units),
            },
          }));
        }}
      />
      <Field
        label="Nivel de fluido"
        suffix={lengthUnit}
        type="number"
        min={0}
        value={toDisplayLength(node.properties.fluidLevel, units)}
        onChange={(event) => {
          const value = numberOrNull(event.target.value);
          if (value === null) return;
          updateNode(node.id, (current) => ({
            ...current,
            properties: {
              ...current.properties,
              fluidLevel: fromDisplayLength(value, units),
            },
          }));
        }}
      />
      <Field
        label="Presión de gas"
        suffix={pressureUnit}
        type="number"
        value={toDisplayPressure(node.properties.gasPressure ?? 0, units)}
        onChange={(event) => {
          const value = numberOrNull(event.target.value);
          if (value === null) return;
          updateNode(node.id, (current) => ({
            ...current,
            properties: {
              ...current.properties,
              gasPressure: fromDisplayPressure(value, units),
            },
          }));
        }}
      />
    </Section>
  );
};

const renderPump = (
  node: PumpNode,
  units: SystemUnits,
  updateNode: (id: string, updater: (node: SystemNode) => SystemNode) => void,
) => {
  const headUnit = HEAD_UNIT[units];
  return (
    <Section title={node.name}>
      <Field
        label="Nombre"
        value={node.name}
        onChange={(event) =>
          updateNode(node.id, (current) => ({
            ...current,
            name: event.target.value,
          }))
        }
      />
      <Field
        label="Altura agregada"
        suffix={headUnit}
        type="number"
        min={0}
        value={toDisplayLength(node.properties.addedHead, units)}
        onChange={(event) => {
          const value = numberOrNull(event.target.value);
          if (value === null) return;
          updateNode(node.id, (current) => ({
            ...current,
            properties: {
              ...current.properties,
              addedHead: fromDisplayLength(value, units),
            },
          }));
        }}
      />
      <Field
        label="NPSH requerido"
        suffix={headUnit}
        type="number"
        min={0}
        value={toDisplayLength(node.properties.requiredNpsh, units)}
        onChange={(event) => {
          const value = numberOrNull(event.target.value);
          if (value === null) return;
          updateNode(node.id, (current) => ({
            ...current,
            properties: {
              ...current.properties,
              requiredNpsh: fromDisplayLength(value, units),
            },
          }));
        }}
      />
    </Section>
  );
};

const renderPipe = (
  pipe: SystemPipe,
  units: SystemUnits,
  updatePipe: (id: string, updater: (pipe: SystemPipe) => SystemPipe) => void,
  removePipe: (id: string) => void,
  velocity?: number,
  headLoss?: number,
) => {
  const lengthUnit = LENGTH_UNIT[units];
  const flowUnit = FLOW_UNIT[units];
  return (
    <Section title={pipe.name}>
      <button
        type="button"
        onClick={() => removePipe(pipe.id)}
        className="text-xs font-medium text-rose-300 hover:text-rose-200"
      >
        Eliminar tubería
      </button>
      <Field
        label="Nombre"
        value={pipe.name}
        onChange={(event) =>
          updatePipe(pipe.id, (current) => ({
            ...current,
            name: event.target.value,
          }))
        }
      />
      <Field
        label="Diámetro"
        suffix={lengthUnit}
        type="number"
        min={0}
        step={0.001}
        value={toDisplayLength(pipe.diameter, units)}
        onChange={(event) => {
          const value = numberOrNull(event.target.value);
          if (value === null) return;
          updatePipe(pipe.id, (current) => ({
            ...current,
            diameter: fromDisplayLength(value, units),
          }));
        }}
      />
      <Field
        label="Longitud"
        suffix={lengthUnit}
        type="number"
        min={0}
        value={toDisplayLength(pipe.length, units)}
        onChange={(event) => {
          const value = numberOrNull(event.target.value);
          if (value === null) return;
          updatePipe(pipe.id, (current) => ({
            ...current,
            length: fromDisplayLength(value, units),
          }));
        }}
      />
      <Field
        label="Rugosidad"
        suffix={lengthUnit}
        type="number"
        min={0}
        step={0.0001}
        value={toDisplayLength(pipe.roughness, units)}
        onChange={(event) => {
          const value = numberOrNull(event.target.value);
          if (value === null) return;
          updatePipe(pipe.id, (current) => ({
            ...current,
            roughness: fromDisplayLength(value, units),
          }));
        }}
      />
      <Field
        label="Caudal"
        suffix={flowUnit}
        type="number"
        min={0}
        step={0.01}
        value={toDisplayFlow(pipe.flowRate, units)}
        onChange={(event) => {
          const value = numberOrNull(event.target.value);
          if (value === null) return;
          updatePipe(pipe.id, (current) => ({
            ...current,
            flowRate: fromDisplayFlow(value, units),
          }));
        }}
      />
      <Field
        label="Coeficiente de pérdidas menores"
        type="number"
        min={0}
        step={0.1}
        value={pipe.minorLossK}
        onChange={(event) => {
          const value = numberOrNull(event.target.value);
          if (value === null) return;
          updatePipe(pipe.id, (current) => ({
            ...current,
            minorLossK: value,
          }));
        }}
      />
      <div className="rounded-md border border-slate-800 bg-slate-950/50 px-3 py-2 text-xs text-slate-300">
        <p>Velocidad: {formatNumber(velocity ?? 0, 2)} m/s</p>
        <p>Pérdida de carga: {formatNumber(headLoss ?? 0, 2)} m</p>
      </div>
    </Section>
  );
};

export const PropertiesPanel = (): JSX.Element => {
  const { model, results, selection, updateNode, updatePipe, deleteNode, deletePipe, setAmbientPressure } =
    useDesignerStore((state) => ({
      model: state.model,
      results: state.results,
      selection: state.selection,
      updateNode: state.updateNode,
      updatePipe: state.updatePipe,
      deleteNode: state.deleteNode,
      deletePipe: state.deletePipe,
      setAmbientPressure: state.setAmbientPressure,
    }));

  const selectedNode: SystemNode | undefined =
    selection?.type === 'node' ? model.nodes.find((node) => node.id === selection.id) : undefined;
  const selectedPipe: SystemPipe | undefined =
    selection?.type === 'pipe' ? model.pipes.find((pipe) => pipe.id === selection.id) : undefined;

  const ambientPressureDisplay = toDisplayPressure(model.ambientPressure, model.units);
  const pressureUnit = PRESSURE_UNIT[model.units];

  const handleAmbientPressureChange = (event: ChangeEvent<HTMLInputElement>) => {
    const value = numberOrNull(event.target.value);
    if (value === null) return;
    setAmbientPressure(fromDisplayPressure(value, model.units));
  };

  return (
    <div className="space-y-4 p-4">
      <Section title="Parámetros globales">
        <Field
          label="Presión ambiente"
          suffix={pressureUnit}
          type="number"
          value={ambientPressureDisplay}
          onChange={handleAmbientPressureChange}
        />
        <div className="rounded-md border border-slate-800 bg-slate-950/60 px-3 py-2 text-xs text-slate-300">
          <p>Fluido: {results.fluidName}</p>
          <p>Densidad: {formatNumber(results.fluidDensity, 2)} kg/m³</p>
        </div>
      </Section>
      {selectedNode?.kind === 'junction' &&
        renderJunction(selectedNode, model.units, updateNode, deleteNode)}
      {selectedNode?.kind === 'tank' && renderTank(selectedNode, model.units, updateNode, deleteNode)}
      {selectedNode?.kind === 'pump' && renderPump(selectedNode, model.units, updateNode)}
      {selectedPipe &&
        renderPipe(
          selectedPipe,
          model.units,
          updatePipe,
          deletePipe,
          results.pipePerformances[selectedPipe.id]?.velocity,
          results.pipePerformances[selectedPipe.id]?.headLoss,
        )}
      {!selectedNode && !selectedPipe && (
        <p className="text-sm text-slate-400">Selecciona un elemento en el lienzo para editar sus propiedades.</p>
      )}
    </div>
  );
};

export default PropertiesPanel;
