// Excel 写出：基于 exceljs（MIT）。加粗表头、冻结首行、文字列自动换行。
import ExcelJS from 'exceljs';

export async function writeXlsx(sheet: string, header: string[], rows: (string | number)[][]): Promise<Uint8Array> {
  const wb = new ExcelJS.Workbook();
  wb.creator = '篝火 · 批量图片 OCR';
  const ws = wb.addWorksheet(sheet, { views: [{ state: 'frozen', ySplit: 1 }] });
  ws.addRow(header).font = { bold: true };
  for (const r of rows) ws.addRow(r);
  const widths = [28, 8, 60, 10];
  ws.columns.forEach((c, i) => { c.width = widths[i] ?? 12; });
  ws.getColumn(3).alignment = { wrapText: true, vertical: 'top' };
  ws.getColumn(4).numFmt = '0.000';
  return new Uint8Array(await wb.xlsx.writeBuffer());
}

/** 读回第一个工作表（测试用） */
export async function readFirstSheet(bytes: Uint8Array): Promise<unknown[][]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  const out: unknown[][] = [];
  wb.worksheets[0].eachRow((row) => out.push((row.values as unknown[]).slice(1)));
  return out;
}
