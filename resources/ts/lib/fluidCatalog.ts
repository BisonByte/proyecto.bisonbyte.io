export interface FluidDefinition {
  id: string;
  name: string;
  density: number; // kg/m^3
  kinematicViscosity: number; // m^2/s
  vaporPressure: number; // Pa
}

const STANDARD_GRAVITY = 9.80665; // m/s^2
const NEWTON_TO_LBF = 0.2248089431;
const M3_TO_FT3 = 35.31466672148859;

export const fluidCatalog: FluidDefinition[] = [
  {
    id: 'water',
    name: 'Agua (20 °C)',
    density: 998.2,
    kinematicViscosity: 1.004e-6,
    vaporPressure: 2339, // Pa
  },
  {
    id: 'oil',
    name: 'Aceite hidráulico ISO VG32',
    density: 870,
    kinematicViscosity: 3.2e-5,
    vaporPressure: 50,
  },
  {
    id: 'sea-water',
    name: 'Agua de mar (25 °C)',
    density: 1025,
    kinematicViscosity: 1.05e-6,
    vaporPressure: 3160,
  },
];

export interface DerivedFluidProperties extends FluidDefinition {
  specificWeightSI: number; // N/m^3
  specificWeightUS: number; // lbf/ft^3
}

export const getFluidById = (id: string): DerivedFluidProperties => {
  const fluid = fluidCatalog.find((item) => item.id === id) ?? fluidCatalog[0];
  const specificWeightSI = fluid.density * STANDARD_GRAVITY;
  const specificWeightUS = (specificWeightSI * NEWTON_TO_LBF) / M3_TO_FT3;

  return {
    ...fluid,
    specificWeightSI,
    specificWeightUS,
  };
};

export const listFluids = (): DerivedFluidProperties[] =>
  fluidCatalog.map((fluid) => ({
    ...fluid,
    specificWeightSI: fluid.density * STANDARD_GRAVITY,
    specificWeightUS:
      ((fluid.density * STANDARD_GRAVITY) * NEWTON_TO_LBF) / M3_TO_FT3,
  }));
