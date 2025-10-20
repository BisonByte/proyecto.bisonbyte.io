import { BlockMath } from 'react-katex';
import { useModelStore } from '../state/store';
import {
  HEAD_UNIT,
  PRESSURE_UNIT,
  formatNumber,
  toDisplayLength,
  toDisplayPressure,
} from '../utils/units';

const FormulaPanel = (): JSX.Element => {
  const { results, model } = useModelStore((state) => ({
    results: state.results,
    model: state.model,
  }));

  const headUnit = HEAD_UNIT[model.units];
  const pressureUnit = PRESSURE_UNIT[model.units];

  const staticLift = toDisplayLength(results.staticLift, model.units);
  const suctionLoss = toDisplayLength(results.suctionLoss, model.units);
  const dischargeLoss = toDisplayLength(results.dischargeLoss, model.units);
  const totalDynamicHead = toDisplayLength(results.totalDynamicHead, model.units);
  const pumpHead = toDisplayLength(results.pumpAddedHead, model.units);
  const balance = toDisplayLength(results.energyBalance, model.units);
  const suctionPressure = toDisplayPressure(results.suctionPressure, model.units);
  const dischargePressure = toDisplayPressure(results.dischargePressure, model.units);

  const tdhFormula = `H_{TDH} = (z_d - z_s) + h_{L,s} + h_{L,d}`;
  const tdhValues = `H_{TDH} = ${formatNumber(staticLift, 2)} + ${formatNumber(suctionLoss, 2)} + ${formatNumber(
    dischargeLoss,
    2,
  )} = ${formatNumber(totalDynamicHead, 2)}\,${headUnit}`;

  const pumpFormula = `\nabla H = H_{bomba} - H_{TDH}`;
  const pumpValues = `\nabla H = ${formatNumber(pumpHead, 2)} - ${formatNumber(totalDynamicHead, 2)} = ${formatNumber(
    balance,
    2,
  )}\,${headUnit}`;

  const pressureFormula = `P = P_{atm} + \gamma\,h`;
  const suctionValues = `P_s = ${formatNumber(toDisplayPressure(model.ambientPressure, model.units), 1)} + ${formatNumber(
    toDisplayPressure(results.specificWeight * results.suctionHead, model.units),
    1,
  )} = ${formatNumber(suctionPressure, 1)}\,${pressureUnit}`;
  const dischargeValues = `P_d = ${formatNumber(toDisplayPressure(model.ambientPressure, model.units), 1)} + ${formatNumber(
    toDisplayPressure(results.specificWeight * (results.pumpAddedHead - results.totalDynamicHead), model.units),
    1,
  )} = ${formatNumber(dischargePressure, 1)}\,${pressureUnit}`;

  return (
    <section className="space-y-4 border-b border-slate-800 p-6">
      <header>
        <h2 className="text-lg font-semibold text-slate-100">Fórmulas</h2>
        <p className="text-sm text-slate-400">Desglose transparente de los cálculos principales.</p>
      </header>
      <div className="space-y-6 text-slate-200">
        <div>
          <BlockMath math={tdhFormula} />
          <BlockMath math={tdhValues} />
        </div>
        <div>
          <BlockMath math={pumpFormula} />
          <BlockMath math={pumpValues} />
        </div>
        <div>
          <BlockMath math={pressureFormula} />
          <BlockMath math={suctionValues} />
          <BlockMath math={dischargeValues} />
        </div>
      </div>
    </section>
  );
};

export default FormulaPanel;
