import React, { useState } from 'react';
import StatusChip from './StatusChip';
import { Calendar as CalIcon } from 'lucide-react';

export default function CalendarView({ schedule, onSelectBlock }) {
  const [horizon, setHorizon] = useState('weekly');
  const [deptFilter, setDeptFilter] = useState('ALL');

  const filtered = (schedule || []).filter(b => {
    if (deptFilter === 'ALL') return true;
    return b.departments.includes(deptFilter);
  });

  return (
    <div className="panel">
      <div className="panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <CalIcon size={20} color="#ff6a1a" />
          <h2 className="panel-title">MULTI-HORIZON AUTOMATIC BLOCK MASTER SCHEDULE</h2>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <div style={{ display: 'flex', background: 'var(--bg-card)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
            <button 
              className={`btn ${horizon === 'weekly' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 12px', fontSize: 12 }}
              onClick={() => setHorizon('weekly')}
            >
              Weekly Tactical Plan
            </button>
            <button 
              className={`btn ${horizon === 'monthly' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '4px 12px', fontSize: 12 }}
              onClick={() => setHorizon('monthly')}
            >
              Monthly Strategic Plan
            </button>
          </div>

          <select 
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{
              background: 'var(--bg-card)',
              color: 'var(--text-main)',
              border: '1px solid var(--border)',
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 12
            }}
          >
            <option value="ALL">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Signal & Telecommunication">Signal & Telecom</option>
            <option value="Traction Distribution">Traction Distribution</option>
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((block) => (
          <div
            key={block.block_id}
            onClick={() => onSelectBlock && onSelectBlock(block)}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 12,
              padding: 16,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              transition: 'all 0.2s'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="mono-font" style={{ fontWeight: 700, color: 'var(--accent)', fontSize: 14 }}>
                  {block.block_id}
                </span>
                <span style={{ fontSize: 14, fontWeight: 600 }}>
                  {block.corridor_id} ({block.from_station} ➔ {block.to_station})
                </span>
                <StatusChip status={block.status} />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {block.departments.map((d, i) => (
                  <span key={i} className={`badge-${d.startsWith('Eng') ? 'engg' : d.startsWith('Sig') ? 'sig' : 'trac'}`} style={{ padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600 }}>
                    {d}
                  </span>
                ))}
                <span style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 600, marginLeft: 8 }}>
                  ⚡ {block.merged_count} Requests Coordinated into 1 Block
                </span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="mono-font" style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>
                {block.start_time} — {block.end_time.split(' ')[1]}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                Duration: {block.duration_hrs} hrs · Priority Score: <b style={{ color: 'var(--accent)' }}>{block.priority_score}</b>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}