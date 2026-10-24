// 单张图片的识别结果：左边原图加文字框，右边按阅读顺序列出识别出的文字，低置信度的行标出来方便核对
import { useState } from 'react';
import { AlertTriangle, ScanSearch } from 'lucide-react';
import type { InputItem, ItemResult } from '../kit/types';
import { fileSrc } from '../kit/platform';
import type { TextLine } from './core';
import './tool.css';

const LOW = 0.8;
type Data = { name: string; lines: TextLine[] } | undefined;

export function ResultBody({ item, result }: { item: InputItem; result: ItemResult }) {
  const lines = (result.data as Data)?.lines ?? [];
  const src = result.preview ?? item.path;
  const [size, setSize] = useState<[number, number]>();
  const low = lines.filter((l) => l.score < LOW).length;
  const avg = lines.length ? Math.round((lines.reduce((a, l) => a + l.score, 0) / lines.length) * 100) : 0;
  return (
    <div className="oc-pair">
      <figure className="oc-shot">
        {src && <img hidden src={fileSrc(src)} alt="" onLoad={(e) => setSize([e.currentTarget.naturalWidth, e.currentTarget.naturalHeight])} />}
        {src && size && (
          <svg viewBox={`0 0 ${size[0]} ${size[1]}`} role="img" aria-label="原图和文字框">
            <image href={fileSrc(src)} width={size[0]} height={size[1]} />
            {lines.flatMap((l, i) => l.boxes.map((b, j) => (
              <polygon key={`${i}-${j}`} className={l.score < LOW ? 'low' : ''} points={b.quad.map((p) => p.join(',')).join(' ')} />
            )))}
          </svg>
        )}
        <figcaption>原图</figcaption>
      </figure>
      <div className="oc-text">
        <div className="oc-meta">
          <b><ScanSearch size={14} />识别文字</b>
          <span className="k-num">{lines.length} 行</span>
          {lines.length > 0 && <span className="k-num">平均置信度 {avg}%</span>}
          {low > 0 && <span className="oc-warn"><AlertTriangle size={13} />{low} 行待核对</span>}
        </div>
        {lines.length ? (
          <ol className="oc-lines">
            {lines.map((l, i) => (
              <li key={i} className={l.score < LOW ? 'low' : ''}>
                <i className="k-num">{i + 1}</i><span>{l.text}</span><em className="k-num">{Math.round(l.score * 100)}%</em>
              </li>
            ))}
          </ol>
        ) : <p className="oc-none">这张图里没有识别到文字。图片太模糊，或者最低置信度调得太高时会这样。</p>}
      </div>
    </div>
  );
}
