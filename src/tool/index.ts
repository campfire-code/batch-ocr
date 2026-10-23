// 工具声明：批量图片 OCR
import { ScanText as ScanTextAsIcon } from 'lucide-react';
import type { BatchTool } from '../kit/types';
import { baseName, excelRows, mergedText, safeName, type TextLine } from './core';
import { writeXlsx } from './xlsx';

type Data = { name: string; lines: TextLine[] };
const perImage = (p: Record<string, unknown>) => p.format === 'txt';

const tool: BatchTool = {
  id: 'o05',
  name: '批量图片 OCR',
  tagline: '批量识别图片里的中英文文字，按阅读顺序输出，可存成每张图一个 TXT、一个合并 TXT 或一张 Excel。识别模型内置，不联网、不上传。',
  icon: ScanTextAsIcon,
  category: '办公提效',
  type: 'media',
  mode: 'batch',
  resultView: 'list',
  concurrency: 1,
  accept: { label: '图片', extensions: ['jpg', 'jpeg', 'png', 'webp', 'bmp', 'gif'] },
  params: [
    { key: 'format', label: '导出方式', type: 'select', options: [['xlsx', '汇总成一张 Excel'], ['txt', '每张图一个 TXT'], ['merged', '合并成一个 TXT']], default: 'xlsx' },
    { key: 'name', label: '汇总文件名', type: 'text', default: 'OCR识别结果', when: (p) => !perImage(p) },
    { key: 'useCls', label: '纠正倒置的文字', type: 'toggle', default: false, help: '图片里有上下颠倒的文字时打开，会稍慢一些' },
    { key: 'minScore', label: '最低置信度', type: 'number', default: 0.5, min: 0, max: 0.99, step: 0.05, help: '低于这个值的文字不输出；漏字多时调低，乱码多时调高' },
    { key: 'out', label: '保存到', type: 'folder', default: '' },
  ],

  async run(item, ctx) {
    const p = ctx.params;
    const { recognize } = await import('./ocr');
    const bytes = await ctx.readFile(item.path!);
    const r = await recognize(bytes, { useCls: Boolean(p.useCls), minScore: Number(p.minScore) }, ctx.progress, ctx.signal);
    const text = r.lines.map((l) => l.text).join('\n');
    const head = r.lines[0]?.text ?? '';
    const summary = r.lines.length ? `${r.lines.length} 行：${head.length > 16 ? head.slice(0, 16) + '…' : head}` : '没有识别到文字';
    const data: Data = { name: item.name, lines: r.lines };
    if (perImage(p)) {
      const outputPath = await ctx.join(ctx.outputDir, `${safeName(baseName(item.name))}.txt`);
      await ctx.writeText(outputPath, text ? text + '\n' : '');
      return { summary, outputPath, preview: item.path, text, data };
    }
    return { summary, preview: item.path, text, data };
  },

  async afterAll(results, ctx) {
    const p = ctx.params;
    if (perImage(p)) return;
    const items = results.map((r) => r.result.data as Data | undefined).filter((d): d is Data => !!d);
    if (!items.length) return;
    const name = safeName(String(p.name).trim() || 'OCR识别结果');
    const lines = items.reduce((a, it) => a + it.lines.length, 0);
    if (p.format === 'merged') {
      const path = await ctx.join(ctx.outputDir, `${name}.txt`);
      await ctx.writeText(path, mergedText(items));
      return `已合并 ${items.length} 张图共 ${lines} 行文字：${path}`;
    }
    const path = await ctx.join(ctx.outputDir, `${name}.xlsx`);
    await ctx.writeFile(path, await writeXlsx('识别结果', ['文件名', '行号', '文字', '置信度'], excelRows(items)));
    return `已汇总 ${items.length} 张图共 ${lines} 行文字：${path}`;
  },
};

export default tool;
