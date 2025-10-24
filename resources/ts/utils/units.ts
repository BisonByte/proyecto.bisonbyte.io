import convert from 'convert-units';
import type { SystemUnits } from '../model/schema';

export const LENGTH_UNIT: Record<SystemUnits, string> = {
  SI: 'm',
  US: 'ft',
};

export const PRESSURE_UNIT: Record<SystemUnits, string> = {
  SI: 'kPa',
  US: 'psi',
};

export const FLOW_UNIT: Record<SystemUnits, string> = {
  SI: 'l/s',
  US: 'gal/min',
};

export const HEAD_UNIT = LENGTH_UNIT;

export const SPECIFIC_WEIGHT_UNIT: Record<SystemUnits, string> = {
  SI: 'N/m³',
  US: 'lbf/ft³',
};

export const TEMPERATURE_UNIT: Record<SystemUnits, string> = {
  SI: '°C',
  US: '°F',
};

const NEWTON_TO_LBF = 0.2248089431;
const M3_TO_FT3 = 35.31466672148859;

export const toDisplayLength = (valueInMeters: number, units: SystemUnits): number => {
  if (units === 'US') {
    return convert(valueInMeters).from('m').to('ft');
  }
  return valueInMeters;
};

export const fromDisplayLength = (value: number, units: SystemUnits): number => {
  if (units === 'US') {
    return convert(value).from('ft').to('m');
  }
  return value;
};

export const toDisplayPressure = (valueInPa: number, units: SystemUnits): number => {
  if (units === 'US') {
    return convert(valueInPa).from('Pa').to('psi');
  }
  return convert(valueInPa).from('Pa').to('kPa');
};

export const fromDisplayPressure = (value: number, units: SystemUnits): number => {
  if (units === 'US') {
    return convert(value).from('psi').to('Pa');
  }
  return convert(value).from('kPa').to('Pa');
};

export const toDisplayFlow = (valueInM3s: number, units: SystemUnits): number => {
  if (units === 'US') {
    return convert(valueInM3s).from('m3/s').to('gal/min');
  }
  return convert(valueInM3s).from('m3/s').to('l/s');
};

export const fromDisplayFlow = (value: number, units: SystemUnits): number => {
  if (units === 'US') {
    return convert(value).from('gal/min').to('m3/s');
  }
  return convert(value).from('l/s').to('m3/s');
};

export const toDisplayVolume = (valueInM3: number, units: SystemUnits): number => {
  if (units === 'US') {
    return convert(valueInM3).from('m3').to('ft3');
  }
  return valueInM3;
};

export const fromDisplayVolume = (value: number, units: SystemUnits): number => {
  if (units === 'US') {
    return convert(value).from('ft3').to('m3');
  }
  return value;
};

export const toDisplayTemperature = (valueCelsius: number, units: SystemUnits): number => {
  if (units === 'US') {
    return convert(valueCelsius).from('C').to('F');
  }
  return valueCelsius;
};

export const fromDisplayTemperature = (value: number, units: SystemUnits): number => {
  if (units === 'US') {
    return convert(value).from('F').to('C');
  }
  return value;
};

export const toDisplaySpecificWeight = (valueInNm3: number, units: SystemUnits): number => {
  if (units === 'US') {
    return (valueInNm3 * NEWTON_TO_LBF) / M3_TO_FT3;
  }
  return valueInNm3;
};

export const formatNumber = (value: number, digits = 2): string =>
  Number.isFinite(value) ? value.toFixed(digits) : '–';
