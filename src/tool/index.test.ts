import { describe, expect, it, vi } from 'vitest';
import type { InputItem, ItemResult, Params, RunContext } from '../kit/types';
import { readFirstSheet } from './xlsx';

// 识别本身在浏览器里跑（需要画布和 WASM），这里用假结果测试导出流程
vi.mock('./ocr', () => ({
  recognize: async (bytes: Uint8Array) => {
    const t = new TextDecoder().decode(bytes);
    const lines = t ? t.split('\n').map((text) => ({ text, score: 0.95, boxes: [] })) : [];
    return { lines, width: 100, height: 100 };
  },
}));
const { default: tool } = await import('./index');

function fakeCtx(files: Map<string, Uint8Array>, params: Params): RunContext {
  return {
    params, outputDir: '/out', signal: new AbortController().signal, progress: () => {},
    readFile: async (p) => files.get(p)!,
    readText: async (p) => new TextDecoder().decode(files.get(p)!),
    writeFile: async (p, d) => void files.set(p, d),
    writeText: async (p, t) => void files.set(p, new TextEncoder().encode(t)),
    mkdir: async () => {},
    join: async (...parts) => parts.join('/'),
    llm: async () => '', sidecar: async () => '', ffmpeg: async () => {}, duration: async () => 0,
  };
}
const defaults = (over: Params = {}): Params => ({ ...Object.fromEntries(tool.params.map((f) => [f.key, f.default])), ...over });

async function runAll(params: Params) {
  const files = new Map([['/in/发票.png', new TextEncoder().encode('篝火开源工具箱 2026\n金额 ¥128.50')], ['/in/空白.jpg', new Uint8Array()]]);
  const ctx = fakeCtx(files, params);
  const results: { item: InputItem; result: ItemResult }[] = [];
  for (const name of ['发票.png', '空白.jpg']) {
    const item = { id: name, name, path: '/in/' + name };
    results.push({ item, result: await tool.run(item, ctx) });
  }
  return { files, results, msg: await tool.afterAll!(results, ctx) };
}
const text = (files: Map<string, Uint8Array>, p: string) => new TextDecoder().decode(files.get(p));

describe('导出', () => {
  it('默认汇总成一张 Excel：文件名、行号、文字、置信度', async () => {
    const { files, results, msg } = await runAll(defaults());
    expect(results[0].result.summary).toBe('2 行：篝火开源工具箱 2026');
    expect(results[1].result.summary).toBe('没有识别到文字');
    expect(msg).toBe('已汇总 2 张图共 2 行文字：/out/OCR识别结果.xlsx');
    expect(await readFirstSheet(files.get('/out/OCR识别结果.xlsx')!)).toEqual([
      ['文件名', '行号', '文字', '置信度'], ['发票.png', 1, '篝火开源工具箱 2026', 0.95], ['发票.png', 2, '金额 ¥128.50', 0.95],
    ]);
  });
  it('每张图一个 TXT，没有收尾文件', async () => {
    const { files, results, msg } = await runAll(defaults({ format: 'txt' }));
    expect(results[0].result.outputPath).toBe('/out/发票.txt');
    expect(text(files, '/out/发票.txt')).toBe('篝火开源工具箱 2026\n金额 ¥128.50\n');
    expect(text(files, '/out/空白.txt')).toBe('');
    expect(msg).toBeUndefined();
  });
  it('合并成一个 TXT，文件名可改', async () => {
    const { files, msg } = await runAll(defaults({ format: 'merged', name: '十月票据' }));
    expect(msg).toBe('已合并 2 张图共 2 行文字：/out/十月票据.txt');
    expect(text(files, '/out/十月票据.txt')).toBe('==== 发票.png ====\n篝火开源工具箱 2026\n金额 ¥128.50\n\n==== 空白.jpg ====\n（没有识别到文字）\n');
  });
});
