import React from 'react';
import { BrainCircuit, ShieldAlert } from 'lucide-react';

export default function DecisionTrace({ traces }) {
  if (!traces) return null;

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="panel-title">
          <BrainCircuit size={18} color="#10b981" />
          <span>EXPLAINABLE AI DECISION TRACE & ML SCORING AUDIT</span>
        </h3>
        <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>CAG Report & Recalibrated Weights</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16 }}>
        {traces.map((t, idx) => (
          <div key={idx} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span className="brand-font" style={{ fontSize: 16, color: '#fff' }}>{t.corridor_id}</span>
              <span style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 600 }}>
                Saved {t.downtime_saved}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8, fontSize: 11 }}>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>Defect Severity</div>
                <b style={{ color: '#fff' }}>{t.ml_factors.severity_class}</b>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>Days Overdue</div>
                <b style={{ color: '#f59e0b' }}>{t.ml_factors.days_overdue} days</b>
              </div>
              <div>
                <div style={{ color: 'var(--text-dim)' }}>ML Priority Score</div>
                <b style={{ color: 'var(--accent)', fontSize: 14 }}>{t.ml_factors.final_priority_score} / 100</b>
              </div>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              {t.trace_explanation}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: 'var(--text-dim)', paddingTop: 4 }}>
              <ShieldAlert size={13} color="var(--emerald)" />
              <span>Safety Floor: {t.ml_factors.safety_bonus} applied · Recall Optimized</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}