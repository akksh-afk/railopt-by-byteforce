import React from 'react';
import { Layers, Clock, ShieldCheck, CheckCircle2, TrendingUp, Zap } from 'lucide-react';

export default function SummaryCards({ summary, activeZone = 'ALL', totalCorridorsCount = 8622 }) {
  if (!summary) return null;

  const isZonal = activeZone !== 'ALL';
  const corridorCount = isZonal ? totalCorridorsCount : summary.totalCorridors;
  const delaySaved = isZonal ? Math.round(summary.downtimeSavedMin * (corridorCount / 8622)) : summary.downtimeSavedMin;
  const delayHours = (delaySaved / 60).toFixed(1);

  return (
    <div className="summary-grid">
      <div className="metric-card">
        <div className="metric-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>MERGE EFFICIENCY</span>
          <Layers size={16} color="#ff6a1a" />
        </div>
        <div className="metric-value" style={{ color: 'var(--accent)' }}>
          {summary.mergeEfficiency}
        </div>
        <div className="metric-footer" style={{ color: 'var(--emerald)' }}>
          <TrendingUp size={13} />
          <span>3 separate requests → 1 joint corridor block</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>SAVED DELAY TIME {isZonal ? `(${activeZone})` : ''}</span>
          <Clock size={16} color="#00d2ff" />
        </div>
        <div className="metric-value" style={{ color: 'var(--cyan)' }}>
          {delaySaved} <span style={{ fontSize: 16 }}>mins</span>
        </div>
        <div className="metric-footer" style={{ color: 'var(--text-muted)' }}>
          <span>~{delayHours} hours train punctuality restored</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>SAFETY RECALL (ML)</span>
          <ShieldCheck size={16} color="#10b981" />
        </div>
        <div className="metric-value" style={{ color: 'var(--emerald)' }}>
          {summary.safetyRecallPct}%
        </div>
        <div className="metric-footer" style={{ color: 'var(--emerald)' }}>
          <CheckCircle2 size={13} />
          <span>Recall-prioritized (Missing defect = 0)</span>
        </div>
      </div>

      <div className="metric-card">
        <div className="metric-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span>{isZonal ? `${activeZone} ZONE CORRIDORS` : 'TOTAL CORRIDORS'}</span>
          <Zap size={16} color="#f59e0b" />
        </div>
        <div className="metric-value">
          {corridorCount.toLocaleString()}
        </div>
        <div className="metric-footer" style={{ color: 'var(--text-muted)' }}>
          <span>{isZonal ? `Zonal Network Topology (${activeZone})` : 'National Indian Railways Network (17 Zones)'}</span>
        </div>
      </div>
    </div>
  );
}