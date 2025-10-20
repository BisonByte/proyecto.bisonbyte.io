import Decimal from 'decimal.js';
import {
  type SystemModel,
  type PumpNode,
  type TankNode,
  type JunctionNode,
  type SystemPipe,
} from '../model/schema';
import { getFluidById } from '../lib/fluidCatalog';

export interface PipePerformance {
  headLoss: number; // m
  velocity: number; // m/s
  reynolds: number;
}

export interface HydraulicsResult {
  fluidName: string;
  fluidDensity: number; // kg/m^3
  specificWeight: number; // N/m^3
  pumpAddedHead: number; // m
  suctionSurfaceElevation: number; // m
  pumpElevation: number; // m
  dischargeElevation: number; // m
  suctionHead: number; // m
  dischargeHead: number; // m
  staticLift: number; // m
  suctionLoss: number; // m
  dischargeLoss: number; // m
  totalDynamicHead: number; // m
  energyBalance: number; // m
  suctionPressure: number; // Pa
  dischargePressure: number; // Pa
  npsha: number; // m
  requiredNpsh: number; // m
  pipePerformances: Record<string, PipePerformance>;
}

export interface ValidationAlert {
  id: string;
  severity: 'info' | 'warning' | 'error';
  title: string;
  detail: string;
}

const GRAVITY = 9.80665;

const isTank = (node: unknown): node is TankNode =>
  Boolean(node) && (node as TankNode).kind === 'tank';

const isPump = (node: unknown): node is PumpNode =>
  Boolean(node) && (node as PumpNode).kind === 'pump';

const isJunction = (node: unknown): node is JunctionNode =>
  Boolean(node) && (node as JunctionNode).kind === 'junction';

const decimalZero = new Decimal(0);

const calculatePipePerformance = (
  pipe: SystemPipe,
  kinematicViscosity: number,
): PipePerformance => {
  if (pipe.flowRate <= 0 || pipe.diameter <= 0) {
    return { headLoss: 0, velocity: 0, reynolds: 0 };
  }

  const diameter = new Decimal(pipe.diameter);
  const area = new Decimal(Math.PI).times(diameter.pow(2)).div(4);
  const flow = new Decimal(pipe.flowRate);
  const velocity = flow.div(area);
  const nu = new Decimal(kinematicViscosity);
  const reynolds = velocity.times(diameter).div(nu);

  if (!reynolds.isFinite() || reynolds.lessThanOrEqualTo(0)) {
    return { headLoss: 0, velocity: velocity.toNumber(), reynolds: 0 };
  }

  const roughness = new Decimal(pipe.roughness || 0).max(decimalZero);
  const relativeRoughness = roughness.div(diameter);
  const term = relativeRoughness
    .div(3.7)
    .plus(new Decimal(5.74).div(reynolds.pow(0.9)));

  const frictionFactor = new Decimal(0.25).div(Decimal.log10(term).pow(2));
  const velocityHead = velocity.pow(2).div(2 * GRAVITY);
  const majorLoss = frictionFactor.times(new Decimal(pipe.length).div(diameter)).times(velocityHead);
  const minorLoss = new Decimal(pipe.minorLossK || 0).times(velocityHead);
  const headLoss = majorLoss.plus(minorLoss);

  return {
    headLoss: headLoss.toNumber(),
    velocity: velocity.toNumber(),
    reynolds: reynolds.toNumber(),
  };
};

export const computeHydraulics = (
  model: SystemModel,
): { results: HydraulicsResult; alerts: ValidationAlert[] } => {
  const fluid = getFluidById(model.fluidId);
  const pumpNode = model.nodes.find((node) => node.kind === 'pump');

  if (!pumpNode || !isPump(pumpNode)) {
    return {
      results: {
        fluidName: fluid.name,
        fluidDensity: fluid.density,
        specificWeight: fluid.density * GRAVITY,
        pumpAddedHead: 0,
        suctionSurfaceElevation: 0,
        pumpElevation: 0,
        dischargeElevation: 0,
        suctionHead: 0,
        dischargeHead: 0,
        staticLift: 0,
        suctionLoss: 0,
        dischargeLoss: 0,
        totalDynamicHead: 0,
        energyBalance: 0,
        suctionPressure: model.ambientPressure,
        dischargePressure: model.ambientPressure,
        npsha: 0,
        requiredNpsh: 0,
        pipePerformances: {},
      },
      alerts: [
        {
          id: 'missing-pump',
          severity: 'warning',
          title: 'Agrega una bomba',
          detail: 'El modelo no contiene ninguna bomba para evaluar.',
        },
      ],
    };
  }

  const suctionNode = model.nodes.find((node) => node.id === pumpNode.properties.suctionNodeId);
  const dischargeNode = model.nodes.find((node) => node.id === pumpNode.properties.dischargeNodeId);

  const alerts: ValidationAlert[] = [];
  const pipePerformances: Record<string, PipePerformance> = {};

  if (!suctionNode) {
    alerts.push({
      id: 'missing-suction-node',
      severity: 'error',
      title: 'Definir nodo de succión',
      detail: 'Selecciona un nodo de succión válido para la bomba.',
    });
  }

  if (!dischargeNode) {
    alerts.push({
      id: 'missing-discharge-node',
      severity: 'error',
      title: 'Definir nodo de descarga',
      detail: 'Selecciona un nodo de descarga válido para la bomba.',
    });
  }

  const suctionPipes = model.pipes.filter((pipe) => pipe.to === pumpNode.id);
  const dischargePipes = model.pipes.filter((pipe) => pipe.from === pumpNode.id);

  let suctionLoss = new Decimal(0);
  let dischargeLoss = new Decimal(0);

  for (const pipe of suctionPipes) {
    const performance = calculatePipePerformance(pipe, fluid.kinematicViscosity);
    suctionLoss = suctionLoss.plus(performance.headLoss);
    pipePerformances[pipe.id] = performance;
  }

  for (const pipe of dischargePipes) {
    const performance = calculatePipePerformance(pipe, fluid.kinematicViscosity);
    dischargeLoss = dischargeLoss.plus(performance.headLoss);
    pipePerformances[pipe.id] = performance;
  }

  const suctionSurfaceElevation = suctionNode && isTank(suctionNode)
    ? suctionNode.properties.baseElevation + suctionNode.properties.fluidLevel
    : suctionNode && isJunction(suctionNode)
      ? suctionNode.properties.elevation
      : 0;

  const dischargeElevation = dischargeNode && isTank(dischargeNode)
    ? dischargeNode.properties.baseElevation + dischargeNode.properties.fluidLevel
    : dischargeNode && isJunction(dischargeNode)
      ? dischargeNode.properties.elevation
      : 0;

  const pumpElevation = pumpNode.properties.centerlineElevation;
  const pumpHead = pumpNode.properties.addedHead;
  const staticLift = new Decimal(dischargeElevation).minus(suctionSurfaceElevation);
  const totalDynamicHead = staticLift.plus(suctionLoss).plus(dischargeLoss);
  const energyBalance = new Decimal(pumpHead).minus(totalDynamicHead);

  const gamma = new Decimal(fluid.density * GRAVITY);
  const ambientPressure = new Decimal(model.ambientPressure);
  const suctionHead = new Decimal(suctionSurfaceElevation).minus(pumpElevation).minus(suctionLoss);
  const suctionPressure = ambientPressure.plus(gamma.times(suctionHead));
  const dischargeHead = new Decimal(dischargeElevation).minus(pumpElevation);
  const dischargePressureHead = new Decimal(suctionSurfaceElevation)
    .minus(pumpElevation)
    .plus(pumpHead)
    .minus(suctionLoss)
    .minus(dischargeLoss)
    .minus(dischargeHead);
  const dischargePressure = ambientPressure.plus(gamma.times(dischargePressureHead));

  const npsha = suctionPressure.minus(new Decimal(fluid.vaporPressure)).div(gamma);

  if (suctionPressure.lessThanOrEqualTo(fluid.vaporPressure)) {
    alerts.push({
      id: 'cavitation-imminent',
      severity: 'error',
      title: 'Riesgo de cavitación',
      detail: 'La presión absoluta de succión está por debajo de la presión de vapor.',
    });
  }

  if (npsha.lessThan(pumpNode.properties.requiredNpsh)) {
    alerts.push({
      id: 'insufficient-npsh',
      severity: 'error',
      title: 'NPSH insuficiente',
      detail: `NPSH disponible (${npsha.toFixed(2)} m) menor al requerido (${pumpNode.properties.requiredNpsh.toFixed(
        2,
      )} m).`,
    });
  }

  if (suctionHead.lessThan(-5)) {
    alerts.push({
      id: 'excessive-suction-lift',
      severity: 'warning',
      title: 'Succión muy exigida',
      detail: 'La bomba opera con elevación de succión negativa pronunciada.',
    });
  }

  if (energyBalance.lessThan(0)) {
    alerts.push({
      id: 'head-deficit',
      severity: 'error',
      title: 'Altura insuficiente',
      detail: 'La altura agregada por la bomba no cubre las pérdidas dinámicas totales.',
    });
  }

  const results: HydraulicsResult = {
    fluidName: fluid.name,
    fluidDensity: fluid.density,
    specificWeight: gamma.toNumber(),
    pumpAddedHead: pumpHead,
    suctionSurfaceElevation,
    pumpElevation,
    dischargeElevation,
    suctionHead: suctionHead.toNumber(),
    dischargeHead: dischargeHead.toNumber(),
    staticLift: staticLift.toNumber(),
    suctionLoss: suctionLoss.toNumber(),
    dischargeLoss: dischargeLoss.toNumber(),
    totalDynamicHead: totalDynamicHead.toNumber(),
    energyBalance: energyBalance.toNumber(),
    suctionPressure: suctionPressure.toNumber(),
    dischargePressure: dischargePressure.toNumber(),
    npsha: npsha.toNumber(),
    requiredNpsh: pumpNode.properties.requiredNpsh,
    pipePerformances,
  };

  return { results, alerts };
};
