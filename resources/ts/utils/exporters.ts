import { toPng } from 'html-to-image';
import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
import type { HydraulicsResult } from '../physics/engine';
import type { SystemModel } from '../model/schema';
import { HEAD_UNIT, PRESSURE_UNIT, formatNumber, toDisplayLength, toDisplayPressure } from './units';

(pdfMake as unknown as { vfs: typeof pdfFonts.pdfMake.vfs }).vfs = pdfFonts.pdfMake.vfs;

export const exportDiagramPng = async (element: HTMLElement, fileName = 'esquema-hidraulico.png'): Promise<void> => {
  const dataUrl = await toPng(element, {
    quality: 1,
    pixelRatio: 2,
    backgroundColor: '#020617',
  });

  const anchor = document.createElement('a');
  anchor.href = dataUrl;
  anchor.download = fileName;
  anchor.click();
};

export const exportReportPdf = (model: SystemModel, results: HydraulicsResult): void => {
  const headUnit = HEAD_UNIT[model.units];
  const pressureUnit = PRESSURE_UNIT[model.units];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 60, 40, 60],
    content: [
      { text: 'Reporte hidráulico', style: 'title' },
      {
        text: `Fluido: ${results.fluidName} | Sistema: ${model.units}`,
        margin: [0, 10, 0, 20],
        style: 'subtitle',
      },
      {
        style: 'tableExample',
        table: {
          widths: ['*', '*', '*'],
          body: [
            ['Magnitud', 'Valor', 'Unidades'],
            ['TDH', `${formatNumber(toDisplayLength(results.totalDynamicHead, model.units), 2)}`, headUnit],
            ['Altura bomba', `${formatNumber(toDisplayLength(results.pumpAddedHead, model.units), 2)}`, headUnit],
            ['Balance', `${formatNumber(toDisplayLength(results.energyBalance, model.units), 2)}`, headUnit],
            ['NPSHa', `${formatNumber(results.npsha, 2)}`, headUnit],
            [
              'P. succión',
              `${formatNumber(toDisplayPressure(results.suctionPressure, model.units), 1)}`,
              pressureUnit,
            ],
            [
              'P. descarga',
              `${formatNumber(toDisplayPressure(results.dischargePressure, model.units), 1)}`,
              pressureUnit,
            ],
          ],
        },
        layout: 'lightHorizontalLines',
      },
      {
        text: 'Alertas de ingeniería',
        style: 'subtitle',
        margin: [0, 20, 0, 8],
      },
      ...(results.energyBalance < 0
        ? [{ text: '• Altura insuficiente para vencer pérdidas totales.', style: 'paragraph' }]
        : []),
    ],
    styles: {
      title: {
        fontSize: 20,
        bold: true,
        color: '#0f172a',
      },
      subtitle: {
        fontSize: 12,
        color: '#334155',
      },
      paragraph: {
        fontSize: 11,
        color: '#0f172a',
      },
    },
  } as const;

  pdfMake.createPdf(docDefinition).download('reporte-hidraulico.pdf');
};
