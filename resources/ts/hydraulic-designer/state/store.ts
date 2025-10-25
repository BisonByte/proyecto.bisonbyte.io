import { create } from 'zustand';
import {
  cloneModel,
  createInitialModel,
  parseSystemModel,
  type SystemModel,
  type SystemNode,
  type SystemPipe,
  type SystemUnits,
} from '../../model/schema';
import {
  computeHydraulics,
  type HydraulicsResult,
  type ValidationAlert,
} from '../../physics/engine';

export type Selection =
  | { type: 'node'; id: string }
  | { type: 'pipe'; id: string }
  | null;

const buildState = (model: SystemModel) => {
  const { results, alerts } = computeHydraulics(model);
  return { model, results, alerts } as const;
};

const ensureNode = (model: SystemModel, nodeId: string) => {
  const index = model.nodes.findIndex((node) => node.id === nodeId);
  if (index === -1) {
    throw new Error(`Nodo con id "${nodeId}" no existe en el modelo actual`);
  }
  return index;
};

const ensurePipe = (model: SystemModel, pipeId: string) => {
  const index = model.pipes.findIndex((pipe) => pipe.id === pipeId);
  if (index === -1) {
    throw new Error(`Tubería con id "${pipeId}" no existe en el modelo actual`);
  }
  return index;
};

const generateId = () => {
  const { crypto } = globalThis;
  if (crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
};

export interface DesignerState {
  model: SystemModel;
  results: HydraulicsResult;
  alerts: ValidationAlert[];
  selection: Selection;
  select: (selection: Selection) => void;
  clearSelection: () => void;
  setNodePosition: (id: string, position: SystemNode['position']) => void;
  updateNode: (id: string, updater: (node: SystemNode) => SystemNode) => void;
  updatePipe: (id: string, updater: (pipe: SystemPipe) => SystemPipe) => void;
  createNode: (node: SystemNode) => void;
  createJunction: () => void;
  createPipe: (from: string, to: string) => void;
  deleteNode: (id: string) => void;
  deletePipe: (id: string) => void;
  setFluid: (fluidId: string) => void;
  setUnits: (units: SystemUnits) => void;
  setAmbientPressure: (pressure: number) => void;
  reset: () => void;
  importModel: (payload: unknown) => void;
}

export const useDesignerStore = create<DesignerState>((set, get) => {
  const initialModel = createInitialModel();
  const initialState = buildState(initialModel);

  return {
    ...initialState,
    selection: null,
    select: (selection) => set({ selection }),
    clearSelection: () => set({ selection: null }),
    setNodePosition: (id, position) => {
      set((state) => {
        const model = cloneModel(state.model);
        const index = ensureNode(model, id);
        model.nodes[index] = { ...model.nodes[index], position };
        return { ...buildState(model) };
      });
    },
    updateNode: (id, updater) => {
      set((state) => {
        const model = cloneModel(state.model);
        const index = ensureNode(model, id);
        model.nodes[index] = updater(model.nodes[index]);
        return { ...buildState(model) };
      });
    },
    updatePipe: (id, updater) => {
      set((state) => {
        const model = cloneModel(state.model);
        const index = ensurePipe(model, id);
        model.pipes[index] = updater(model.pipes[index]);
        return { ...buildState(model) };
      });
    },
    createNode: (node) => {
      set((state) => {
        const model = cloneModel(state.model);
        model.nodes.push(node);
        return {
          selection: { type: 'node', id: node.id },
          ...buildState(model),
        };
      });
    },
    createJunction: () => {
      set((state) => {
        const model = cloneModel(state.model);
        const index = model.nodes.filter((node) => node.kind === 'junction').length + 1;
        const junctionId = generateId();
        model.nodes.push({
          id: junctionId,
          kind: 'junction',
          name: `J${index}`,
          position: {
            x: 200 + model.nodes.length * 40,
            y: 200 + model.nodes.length * 30,
          },
          properties: {
            demand: 0,
            elevation: 0,
            referenceElevation: 0,
          },
        });
        return {
          selection: { type: 'node', id: junctionId },
          ...buildState(model),
        };
      });
    },
    createPipe: (from, to) => {
      if (from === to) {
        return;
      }
      const { model } = get();
      const exists = model.nodes.some((node) => node.id === from) && model.nodes.some((node) => node.id === to);
      if (!exists) {
        return;
      }
      set((state) => {
        const next = cloneModel(state.model);
        const pipeId = generateId();
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
    deleteNode: (id) => {
      set((state) => {
        const next = cloneModel(state.model);
        const node = next.nodes.find((candidate) => candidate.id === id);
        if (!node || node.kind === 'pump') {
          return state;
        }
        next.nodes = next.nodes.filter((candidate) => candidate.id !== id);
        next.pipes = next.pipes.filter((pipe) => pipe.from !== id && pipe.to !== id);
        return {
          selection: null,
          ...buildState(next),
        };
      });
    },
    deletePipe: (id) => {
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
      const fresh = createInitialModel();
      set({ selection: null, ...buildState(fresh) });
    },
    importModel: (payload) => {
      const model = parseSystemModel(payload);
      set({ selection: null, ...buildState(model) });
    },
  };
});
