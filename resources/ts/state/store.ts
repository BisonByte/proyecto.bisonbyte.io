import { create } from 'zustand';
import {
  type SystemModel,
  type SystemNode,
  type SystemPipe,
  createInitialModel,
  cloneModel,
  parseSystemModel,
  type SystemUnits,
} from '../model/schema';
import { computeHydraulics, type HydraulicsResult, type ValidationAlert } from '../physics/engine';

export type Selection =
  | { type: 'node'; id: string }
  | { type: 'pipe'; id: string }
  | null;

export interface ModelStoreState {
  model: SystemModel;
  results: HydraulicsResult;
  alerts: ValidationAlert[];
  selection: Selection;
  setSelection: (selection: Selection) => void;
  updateNode: (id: string, updater: (node: SystemNode) => SystemNode) => void;
  updatePipe: (id: string, updater: (pipe: SystemPipe) => SystemPipe) => void;
  addJunction: () => void;
  addPipe: (from: string, to: string) => void;
  removeNode: (id: string) => void;
  removePipe: (id: string) => void;
  setFluid: (fluidId: string) => void;
  setUnits: (units: SystemUnits) => void;
  setAmbientPressure: (pressure: number) => void;
  reset: () => void;
  loadModel: (json: unknown) => void;
}

const buildState = (model: SystemModel) => {
  const { results, alerts } = computeHydraulics(model);
  return { model, results, alerts };
};

const ensureId = () => crypto.randomUUID();

export const useModelStore = create<ModelStoreState>((set, get) => {
  const initialModel = createInitialModel();
  const initial = buildState(initialModel);

  return {
    ...initial,
    selection: null,
    setSelection: (selection) => set({ selection }),
    updateNode: (id, updater) => {
      set((state) => {
        const model = cloneModel(state.model);
        const index = model.nodes.findIndex((node) => node.id === id);
        if (index === -1) {
          return state;
        }
        model.nodes[index] = updater(model.nodes[index]);
        return { ...buildState(model) };
      });
    },
    updatePipe: (id, updater) => {
      set((state) => {
        const model = cloneModel(state.model);
        const index = model.pipes.findIndex((pipe) => pipe.id === id);
        if (index === -1) {
          return state;
        }
        model.pipes[index] = updater(model.pipes[index]);
        return { ...buildState(model) };
      });
    },
    addJunction: () => {
      set((state) => {
        const model = cloneModel(state.model);
        const junctionId = ensureId();
        model.nodes.push({
          id: junctionId,
          kind: 'junction',
          name: `J${model.nodes.filter((node) => node.kind === 'junction').length + 1}`,
          position: {
            x: 200 + model.nodes.length * 40,
            y: 160 + model.nodes.length * 20,
          },
          properties: {
            elevation: 5,
            demand: 0.0,
            referenceElevation: 5,
          },
        });
        return {
          selection: { type: 'node', id: junctionId },
          ...buildState(model),
        };
      });
    },
    addPipe: (from, to) => {
      if (from === to) {
        return;
      }
      const { model } = get();
      const fromExists = model.nodes.some((node) => node.id === from);
      const toExists = model.nodes.some((node) => node.id === to);
      if (!fromExists || !toExists) {
        return;
      }
      set((state) => {
        const next = cloneModel(state.model);
        const pipeId = ensureId();
        next.pipes.push({
          id: pipeId,
          name: `Tubería ${next.pipes.length + 1}`,
          from,
          to,
          diameter: 0.08,
          length: 10,
          roughness: 0.000045,
          flowRate: 0.01,
          minorLossK: 1,
        });
        return {
          selection: { type: 'pipe', id: pipeId },
          ...buildState(next),
        };
      });
    },
    removeNode: (id) => {
      set((state) => {
        const next = cloneModel(state.model);
        const target = next.nodes.find((node) => node.id === id);
        if (target?.kind === 'pump') {
          return state;
        }
        next.nodes = next.nodes.filter((node) => node.id !== id);
        next.pipes = next.pipes.filter((pipe) => pipe.from !== id && pipe.to !== id);
        return {
          selection: null,
          ...buildState(next),
        };
      });
    },
    removePipe: (id) => {
      set((state) => {
        const next = cloneModel(state.model);
        next.pipes = next.pipes.filter((pipe) => pipe.id !== id);
        return {
          selection: null,
          ...buildState(next),
        };
      });
    },
    setFluid: (fluidId) => {
      set((state) => {
        const next = cloneModel(state.model);
        next.fluidId = fluidId;
        return { ...buildState(next) };
      });
    },
    setUnits: (units) => {
      set((state) => {
        const next = cloneModel(state.model);
        next.units = units;
        return { ...buildState(next) };
      });
    },
    setAmbientPressure: (pressure) => {
      set((state) => {
        const next = cloneModel(state.model);
        next.ambientPressure = pressure;
        return { ...buildState(next) };
      });
    },
    reset: () => {
      const initial = createInitialModel();
      return set({ selection: null, ...buildState(initial) });
    },
    loadModel: (json) => {
      try {
        const parsed = parseSystemModel(json);
        set({ selection: null, ...buildState(parsed) });
      } catch (error) {
        console.error('Modelo inválido', error);
        throw error;
      }
    },
  };
});
