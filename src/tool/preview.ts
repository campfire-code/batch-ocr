// 截图与预览用的示例数据（不会进入正式运行）
import type { Row } from '../kit/runner';
import type { Quad, TextLine } from './core';

const W = 360;
const H = 280;
/** 画一张带文字的示例图，同时算出每行文字的框，让预览里的框和图对得上 */
function draw(lines: [string, number][], hue: number): { url: string; data: TextLine[] } {
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d')!;
  g.fillStyle = `hsl(${hue} 32% 96%)`;
  g.fillRect(0, 0, W, H);
  const out: TextLine[] = [];
  lines.forEach(([text, score], i) => {
    const size = i ? 20 : 26;
    g.font = `${i ? '' : 'bold '}${size}px sans-serif`;
    g.fillStyle = '#222';
    const y = 50 + i * 42;
    g.fillText(text, 20, y);
    const w = g.measureText(text).width;
    const quad: Quad = [[16, y - size], [24 + w, y - size], [24 + w, y + 8], [16, y + 8]];
    out.push({ text, score, boxes: [{ quad, text, score }] });
  });
  return { url: c.toDataURL('image/png'), data: out };
}

const files: [string, [string, number][], number, Row['status'], string][] = [
  ['商品说明-截图.png', [['保温杯 500毫升 不锈钢', 0.99], ['保温 12 小时，保冷 24 小时', 0.97], ['适用：办公室、户外', 0.95], ['净重 350g', 0.98]], 210, 'ok', ''],
  ['十月发票-01.jpg', [['电子发票（普通发票）', 0.99], ['购买方：杭州篝火科技', 0.96], ['金额 ¥128.50', 0.93], ['税额 ¥7.71', 0.62], ['开票日期 2026-10-18', 0.97]], 30, 'ok', ''],
  ['会议白板.jpg', [['周五下午三点开会', 0.94], ['带上十月销售报表', 0.71], ['找林小夏对一下排期', 0.88]], 120, 'ok', ''],
  ['合同第3页.png', [['第三条 付款方式', 0.9]], 0, 'run', ''],
  ['快递面单.jpg', [['收件人：张三', 0.9]], 260, 'wait', ''],
  ['产品参数表.png', [['型号 甲-12', 0.9]], 180, 'wait', ''],
  ['损坏的图片.jpg', [], 0, 'err', '无法识别这张图片，可能已损坏或格式不受支持'],
];
export const rows = (state: string): Row[] =>
  state === 'empty' ? [] : files.map(([name, lines, hue, status, text], i) => {
    const st = state === 'done' && status !== 'err' ? 'ok' : status;
    const { url, data } = draw(lines, hue);
    return {
      item: { id: `p${i}`, name, path: url, size: 180_000 + i * 61_000 },
      status: st, progress: st === 'run' ? 0.45 : st === 'ok' ? 1 : 0, error: st === 'err' ? text : undefined,
      result: st === 'ok' ? {
        preview: url,
        summary: `${data.length} 行：${data[0]?.text ?? ''}`,
        outputPath: '/示例',
        text: data.map((l) => l.text).join('\n'),
        data: { name, lines: data },
      } : undefined,
    };
  });

export const params = { format: 'xlsx' };
