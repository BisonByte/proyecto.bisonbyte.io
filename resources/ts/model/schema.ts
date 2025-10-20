import { z } from 'zod';

export const unitsSchema = z.enum(['SI', 'US']);
export type SystemUnits = z.infer<typeof unitsSchema>;

export const pointSchema = z.object({
  x: z.number(),
  y: z.number(),
});

const baseNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  position: pointSchema,
});

export const tankNodeSchema = baseNodeSchema.extend({
  kind: z.literal('tank'),
  dimensions: z.object({
    width: z.number().positive(),
    height: z.number().positive(),
  }),
  properties: z.object({
    baseElevation: z.number(),
    fluidLevel: z.number().nonnegative(),
    operatingTemperature: z.number().optional(),
  }),
});

export const pumpNodeSchema = baseNodeSchema.extend({
  kind: z.literal('pump'),
  properties: z.object({
    centerlineElevation: z.number(),
    addedHead: z.number().nonnegative(),
    requiredNpsh: z.number().nonnegative(),
    efficiency: z.number().min(0).max(1),
    suctionNodeId: z.string(),
    dischargeNodeId: z.string(),
  }),
});

export const junctionNodeSchema = baseNodeSchema.extend({
  kind: z.literal('junction'),
  properties: z.object({
    elevation: z.number(),
    demand: z.number().nonnegative().default(0),
  }),
});

export const nodeSchema = z.discriminatedUnion('kind', [
  tankNodeSchema,
  pumpNodeSchema,
  junctionNodeSchema,
]);

export type TankNode = z.infer<typeof tankNodeSchema>;
export type PumpNode = z.infer<typeof pumpNodeSchema>;
export type JunctionNode = z.infer<typeof junctionNodeSchema>;
export type SystemNode = z.infer<typeof nodeSchema>;

export const pipeSchema = z.object({
  id: z.string(),
  name: z.string(),
  from: z.string(),
  to: z.string(),
  diameter: z.number().positive(),
  length: z.number().positive(),
  roughness: z.number().nonnegative(),
  flowRate: z.number().nonnegative(),
  minorLossK: z.number().nonnegative(),
});

export type SystemPipe = z.infer<typeof pipeSchema>;

export const systemModelSchema = z.object({
  version: z.literal('1.0.0'),
  units: unitsSchema,
  ambientPressure: z.number().positive(),
  fluidId: z.string(),
  nodes: z.array(nodeSchema),
  pipes: z.array(pipeSchema),
});

export type SystemModel = z.infer<typeof systemModelSchema>;

export const GRID_SIZE = 24;

export const createInitialModel = (): SystemModel => ({
  version: '1.0.0',
  units: 'SI',
  ambientPressure: 101325,
  fluidId: 'water',
  nodes: [
    {
      id: 'tank-1',
      kind: 'tank',
      name: 'Tanque de succión',
      position: { x: 160, y: 260 },
      dimensions: { width: 160, height: 220 },
      properties: {
        baseElevation: 0,
        fluidLevel: 4,
        operatingTemperature: 20,
      },
    },
    {
      id: 'pump-1',
      kind: 'pump',
      name: 'Bomba centrífuga',
      position: { x: 420, y: 320 },
      properties: {
        centerlineElevation: 0.5,
        addedHead: 20,
        requiredNpsh: 3,
        efficiency: 0.72,
        suctionNodeId: 'tank-1',
        dischargeNodeId: 'junction-1',
      },
    },
    {
      id: 'junction-1',
      kind: 'junction',
      name: 'Descarga',
      position: { x: 720, y: 220 },
      properties: {
        elevation: 12,
        demand: 0.01,
      },
    },
  ],
  pipes: [
    {
      id: 'pipe-1',
      name: 'Succión',
      from: 'tank-1',
      to: 'pump-1',
      diameter: 0.1,
      length: 4,
      roughness: 0.000045,
      flowRate: 0.01,
      minorLossK: 1.5,
    },
    {
      id: 'pipe-2',
      name: 'Descarga',
      from: 'pump-1',
      to: 'junction-1',
      diameter: 0.08,
      length: 35,
      roughness: 0.000045,
      flowRate: 0.01,
      minorLossK: 2.1,
    },
  ],
});

export const parseSystemModel = (payload: unknown): SystemModel => {
  return systemModelSchema.parse(payload);
};

export const cloneModel = (model: SystemModel): SystemModel =>
  structuredClone(model);
