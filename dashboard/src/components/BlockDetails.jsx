import React from 'react';
import StatusChip from './StatusChip';
import { X, MapPin } from 'lucide-react';

export default function BlockDetails({ block, onClose }) {
  if (!block) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="brand-font" style={{ fontSize: 20, color: 'var(--accent)' }}>{block.block_id}</span>
            <StatusChip status={block.status} />
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 600 }}>
            <MapPin size={16} color="var(--cyan)" />
            <span>{block.corridor_id} · {block.from_station} ➔ {block.to_station}</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: 'var(--bg-card)', padding: 14, borderRadius: 10, border: '1px solid var(--border)' }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Start Time</div>
              <b className="mono-font" style={{ color: '#fff' }}>{block.start_time} IST</b>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>End Time</div>
              <b className="mono-font" style={{ color: '#fff' }}>{block.end_time} IST</b>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Duration</div>
              <b style={{ color: 'var(--cyan)' }}>{block.duration_hrs} hours</b>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ML Priority Score</div>
              <b style={{ color: 'var(--accent)' }}>{block.priority_score} / 100</b>
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>Participating Departments (Joint Block):</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {block.departments.map((d, i) => (
                <span key={i} className={`badge-${d.startsWith('Eng') ? 'engg' : d.startsWith('Sig') ? 'sig' : 'trac'}`} style={{ padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
                  {d}
                </span>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 4 }}>Optimizer Rationale & Coordination:</div>
            <p style={{ fontSize: 13, color: 'var(--text-main)', lineHeight: 1.5, background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8 }}>
              {block.reason}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}