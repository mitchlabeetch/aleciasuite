// services/flows-pieces/pieces/alecia-financial/src/actions/export-valuation-to-excel.ts
// Export valuation data to Excel

import { createAction, Property } from '@activepieces/pieces-framework';
import { Pool } from 'pg';
import ExcelJS from 'exceljs';

export const exportValuationToExcel = createAction({
  name: 'export-valuation-to-excel',
  displayName: 'Export Valuation to Excel',
  description: 'Generate Excel from valuation data',
  props: {
    valuationId: Property.ShortText({
      displayName: 'Valuation ID',
      required: true,
    }),
    includeAssumptions: Property.Checkbox({
      displayName: 'Include Assumptions',
      defaultValue: true,
      required: false,
    }),
    includeComparables: Property.Checkbox({
      displayName: 'Include Comparables',
      defaultValue: true,
      required: false,
    }),
  },
  async run(context) {
    const pool = new Pool({
      host: process.env.DATABASE_HOST || 'alecia-postgres',
      port: 5432,
      database: 'alecia',
      user: 'alecia',
      password: process.env.DATABASE_PASSWORD,
    });

    // Fetch valuation data
    const valuation = await pool.query(
      'SELECT * FROM alecia_numbers.valuations WHERE id = $1',
      [context.propsValue.valuationId]
    );

    if (valuation.rows.length === 0) {
      await pool.end();
      throw new Error('Valuation not found');
    }

    const data = valuation.rows[0];

    // Create Excel workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Alecia Suite';
    workbook.created = new Date();

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Valuation Summary');
    summarySheet.columns = [
      { width: 30 },
      { width: 20 },
      { width: 15 },
    ];

    // Header
    summarySheet.mergeCells('A1:C1');
    summarySheet.getCell('A1').value = 'ALECIA - RAPPORT DE VALORISATION';
    summarySheet.getCell('A1').font = { size: 16, bold: true };
    summarySheet.getCell('A1').alignment = { horizontal: 'center' };

    summarySheet.addRow([] as any);
    summarySheet.addRow(['Société:', data.company_name] as any);
    summarySheet.addRow(['Secteur:', data.sector || 'N/A'] as any);
    summarySheet.addRow(['Date:', new Date().toLocaleDateString('fr-FR')] as any);
    summarySheet.addRow([] as any);

    // Valuation methods
    summarySheet.addRow(['MÉTHODES DE VALORISATION'] as any);
    summarySheet.getRow(7).font = { bold: true };

    summarySheet.addRow(['Méthode', 'Valeur (EUR)', 'Pondération'] as any);
    summarySheet.getRow(8).font = { bold: true };

    summarySheet.addRow([
      'DCF (Discounted Cash Flow)',
      data.dcf_value?.toLocaleString('fr-FR') || 'N/A',
      `${(data.dcf_weight || 0) * 100}%`,
    ] as any);
    summarySheet.addRow([
      'Multiples de transaction',
      data.multiples_value?.toLocaleString('fr-FR') || 'N/A',
      `${(data.multiples_weight || 0) * 100}%`,
    ] as any);
    summarySheet.addRow([
      'Sociétés comparables',
      data.comparables_value?.toLocaleString('fr-FR') || 'N/A',
      `${(data.comparables_weight || 0) * 100}%`,
    ] as any);

    summarySheet.addRow([] as any);
    summarySheet.addRow(['VALEUR FINALE (Moyenne Pondérée)'] as any);
    summarySheet.getRow(13).font = { bold: true, size: 12 };

    summarySheet.addRow([
      'Valeur d\'entreprise',
      data.final_value?.toLocaleString('fr-FR') || 'N/A',
      'EUR',
    ] as any);
    summarySheet.getRow(14).font = { bold: true, size: 14 };

    // Assumptions sheet (if requested)
    if (context.propsValue.includeAssumptions && data.assumptions) {
      const assumptionsSheet = workbook.addWorksheet('Hypothèses');
      assumptionsSheet.addRow(['HYPOTHÈSES DE VALORISATION'] as any);
      assumptionsSheet.getRow(1).font = { bold: true, size: 14 };
      assumptionsSheet.addRow([] as any);

      Object.entries(data.assumptions).forEach(([key, value]) => {
        assumptionsSheet.addRow([key, value] as any);
      });
    }

    // Save to buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Upload to Minio would go here
    const filename = `valuation_${data.id}_${Date.now()}.xlsx`;

    await pool.end();

    return {
      success: true,
      filename,
      fileSize: buffer.byteLength,
      base64: Buffer.from(buffer).toString('base64'),
      metadata: {
        valuationId: data.id,
        companyName: data.company_name,
        finalValue: data.final_value,
        generatedAt: new Date().toISOString(),
      },
    };
  },
});
