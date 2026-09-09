import { ComponentRecommendation } from '../services/chat';

/**
 * Builds and downloads the BOM spreadsheet.
 *
 * `xlsx` is loaded on demand rather than imported at the top level: it is a
 * large dependency that only matters once someone actually clicks Export, so
 * keeping it out of the initial bundle materially speeds up first paint.
 */
export const exportBOM = async (recommendations: ComponentRecommendation[]) => {
  if (recommendations.length === 0) return;

  const XLSX = await import('xlsx');

  // Recommendations originate from model-generated JSON, so treat every field as
  // possibly missing or of the wrong type rather than calling methods on it.
  const data = recommendations.map(rec => ({
    'Tier': rec.tier || 'Recommended',
    'Component Name': rec.name || 'Unnamed part',
    'Expected Price': rec.approxPrice || 'N/A',
    'Core Specs': rec.specs || '',
    'Pros': Array.isArray(rec.pros) ? rec.pros.join(', ') : '',
    'Cons': Array.isArray(rec.cons) ? rec.cons.join(', ') : '',
    'Source URL': rec.sourceUrl || ''
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Bill of Materials");

  // Format header row
  const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1:G1');
  for (let C = range.s.c; C <= range.e.c; ++C) {
    const address = XLSX.utils.encode_col(C) + "1";
    if (!worksheet[address]) continue;
    worksheet[address].s = {
      font: { bold: true },
      fill: { fgColor: { rgb: "EFEFEF" } }
    };
  }

  // Adjust column widths roughly
  worksheet['!cols'] = [
    { wch: 20 }, // Tier
    { wch: 30 }, // Component Name
    { wch: 15 }, // Expected Price
    { wch: 50 }, // Core Specs
    { wch: 40 }, // Pros
    { wch: 30 }, // Cons
    { wch: 40 }, // Source URL
  ];

  XLSX.writeFile(workbook, "myPCB_BOM_Export.xlsx");
};
