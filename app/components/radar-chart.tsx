/**
 * 5축 레이더 차트 (T-18) — 순수 SVG, 의존성 없음.
 * 값은 정규화 점수(0~100). 축 이름은 AXIS_META 라벨 사용.
 */
import { AXIS_META, type AxisId } from '@/lib/questions';
import type { Scores } from '@/lib/scoring';

const AXES: AxisId[] = ['autonomy', 'competence', 'social', 'burnout', 'zpd_strain'];
const CX = 150;
const CY = 138;
const R = 88;

function point(axisIndex: number, ratio: number): [number, number] {
  const angle = -Math.PI / 2 + (axisIndex * 2 * Math.PI) / AXES.length;
  return [CX + R * ratio * Math.cos(angle), CY + R * ratio * Math.sin(angle)];
}

function polygonPath(ratios: number[]): string {
  return ratios
    .map((r, i) => {
      const [x, y] = point(i, r);
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ') + ' Z';
}

export default function RadarChart({ scores }: { scores: Scores }) {
  const ratios = AXES.map((axis) => Math.max(scores.axes[axis].normalized, 6) / 100);

  return (
    <svg
      viewBox="0 0 300 276"
      role="img"
      aria-label="축별 진단 결과 레이더 차트"
      style={{ width: '100%', maxWidth: 320, display: 'block', margin: '0 auto' }}
    >
      {/* 격자 (25/50/75/100%) */}
      {[0.25, 0.5, 0.75, 1].map((g) => (
        <path
          key={g}
          d={polygonPath(AXES.map(() => g))}
          fill="none"
          stroke="var(--ivory-border)"
          strokeWidth={g === 1 ? 1.4 : 1}
        />
      ))}
      {/* 축선 */}
      {AXES.map((_, i) => {
        const [x, y] = point(i, 1);
        return (
          <line
            key={i}
            x1={CX}
            y1={CY}
            x2={x}
            y2={y}
            stroke="var(--ivory-border)"
            strokeWidth={1}
          />
        );
      })}
      {/* 값 폴리곤 */}
      <path
        d={polygonPath(ratios)}
        fill="var(--amber)"
        fillOpacity={0.18}
        stroke="var(--amber)"
        strokeWidth={2}
        strokeLinejoin="round"
      />
      {/* 꼭짓점 + 값 */}
      {AXES.map((axis, i) => {
        const [x, y] = point(i, ratios[i]);
        return (
          <circle key={axis} cx={x} cy={y} r={3.5} fill="var(--amber)" />
        );
      })}
      {/* 축 라벨 */}
      {AXES.map((axis, i) => {
        const [x, y] = point(i, 1.22);
        const value = scores.axes[axis].normalized;
        return (
          <text
            key={axis}
            x={x}
            y={y}
            textAnchor="middle"
            style={{ fontSize: 11.5, fontWeight: 500, fill: 'var(--navy)' }}
          >
            {AXIS_META[axis].label}
            <tspan x={x} dy={13} style={{ fontSize: 10.5, fill: 'var(--navy-muted)', fontWeight: 400 }}>
              {value}
            </tspan>
          </text>
        );
      })}
    </svg>
  );
}
