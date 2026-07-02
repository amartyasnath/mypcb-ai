import * as XLSX from 'xlsx';
import { ComponentRecommendation } from '../services/gemini';

export const exportBOM = (recommendations: ComponentRecommendation[]) => {
  if (recommendations.length === 0) return;

  const data = recommendations.map(rec => ({
    'Tier': rec.tier,
    'Component Name': rec.name,
    'Expected Price': rec.approxPrice || 'N/A',
    'Core Specs': rec.specs,
    'Pros': rec.pros.join(', '),
    'Cons': rec.cons.join(', '),
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
