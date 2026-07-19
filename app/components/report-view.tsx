'use client';

import { Fragment, type ReactNode } from 'react';

/** **bold** 인라인 처리 */
function inline(text: string, key: number): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return (
    <Fragment key={key}>
      {parts.map((part, i) =>
        i % 2 === 1 ? <b key={i}>{part}</b> : <Fragment key={i}>{part}</Fragment>
      )}
    </Fragment>
  );
}

/** 리포트용 최소 마크다운 렌더러 (##, -, 1., ---, **bold**) */
export default function ReportView({ markdown }: { markdown: string }) {
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let key = 0;

  const flushList = () => {
    if (!list) return;
    const items = list.items.map((item, i) => (
      <li key={i} style={{ marginBottom: 6 }}>
        {inline(item, i)}
      </li>
    ));
    blocks.push(
      list.ordered ? (
        <ol key={key++} style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem' }}>
          {items}
        </ol>
      ) : (
        <ul key={key++} style={{ paddingLeft: '1.25rem', margin: '0.5rem 0 1rem' }}>
          {items}
        </ul>
      )
    );
    list = null;
  };

  for (const line of markdown.split('\n')) {
    const trimmed = line.trim();
    const ordered = /^\d+\.\s+/.test(trimmed);
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || ordered) {
      const text = trimmed.replace(/^(-|\*|\d+\.)\s+/, '');
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push(text);
      continue;
    }
    flushList();
    if (!trimmed) continue;
    if (trimmed.startsWith('## ')) {
      blocks.push(
        <h2
          key={key++}
          style={{
            fontFamily: 'var(--serif)',
            fontSize: 17,
            margin: '1.5rem 0 0.6rem',
          }}
        >
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed === '---') {
      blocks.push(
        <hr
          key={key++}
          style={{
            border: 'none',
            borderTop: '1px solid var(--ivory-border)',
            margin: '1.25rem 0',
          }}
        />
      );
    } else {
      blocks.push(
        <p key={key++} style={{ fontSize: 14, marginBottom: '0.75rem' }}>
          {inline(trimmed, key)}
        </p>
      );
    }
  }
  flushList();

  return <div>{blocks}</div>;
}
