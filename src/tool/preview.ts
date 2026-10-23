// 截图与预览用的示例数据（不会进入正式运行）
import type { Row } from '../kit/runner';

function shot(lines: string[], hue: number) {
  const c = document.createElement('canvas');
  c.width = c.height = 200;
  const g = c.getContext('2d')!;
  g.fillStyle = `hsl(${hue} 30% 97%)`;
  g.fillRect(0, 0, 200, 200);
  g.fillStyle = '#222';
  lines.forEach((t, i) => { g.font = `${i ? 16 : 'bold 20'}px sans-serif`; g.fillText(t, 14, 40 + i * 32); });
  return c.toDataURL('image/png');
}
const files: [string, string[], number, Row['status'], string][] = [
  ['商品说明-截图.png', ['篝火工具箱', '保温杯 500ml', '保温 12 小时'], 210, 'ok', '5 行：篝火开源工具箱2026'],
  ['十月发票-01.jpg', ['增值税发票', '金额 ¥128.50', '税额 ¥7.71'], 30, 'ok', '18 行：电子发票（普通发票）'],
  ['会议白板.jpg', ['周五三点开会', '带销售报表'], 120, 'ok', '6 行：周五下午三点开会'],
  ['合同第3页.png', ['第三条 付款', '甲方应于…'], 0, 'run', ''],
  ['快递面单.jpg', ['收件人：张三', '电话 138****'], 260, 'wait', ''],
  ['产品参数表.png', ['型号 A-12', '重量 350g'], 180, 'wait', ''],
  ['损坏文件.jpg', [], 0, 'err', '无法识别这张图片，可能已损坏或格式不受支持'],
];
export const rows = (state: string): Row[] =>
  state === 'empty' ? [] : files.map(([name, lines, hue, status, text], i) => {
    const st = state === 'done' && status !== 'err' ? 'ok' : status;
    return {
      item: { id: `p${i}`, name, path: shot(lines, hue), size: 180_000 + i * 61_000 },
      status: st, progress: st === 'run' ? 0.45 : st === 'ok' ? 1 : 0, error: st === 'err' ? text : undefined,
      result: st === 'ok' ? { preview: shot(lines, hue), summary: text || '4 行：识别完成', outputPath: '/示例' } : undefined,
    };
  });
