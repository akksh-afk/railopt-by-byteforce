import React from 'react';
import { BarChart3, TrendingDown } from 'lucide-react';

export default function MiniCharts() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
      <div className="panel">
        <div className="panel-header">
          <h4 className="panel-title" style={{ fontSize: 15 }}>
            <BarChart3 size={16} color="#ff6a1a" />
            <span>DEPARTMENTAL BLOCK REQUEST DISTRIBUTION</span>
          </h4>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span>Engineering (Track & P-Way)</span>
              <b>52.1% (6,000 requests)</b>
            </div>
            <div style={{ height: 6, background: '#1e293b', borderRadius: 3 }}>
              <div style={{ width: '52.1%', height: '100%', background: '#3b82f6', borderRadius: 3 }}></div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span>Signal & Telecommunication (S&T)</span>
              <b>26.1% (3,000 requests)</b>
            </div>
            <div style={{ height: 6, background: '#1e293b', borderRadius: 3 }}>
              <div style={{ width: '26.1%', height: '100%', background: '#10b981', borderRadius: 3 }}></div>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span>Traction Distribution (TRD / OHE)</span>
              <b>21.8% (2,500 requests)</b>
            </div>
            <div style={{ height: 6, background: '#1e293b', borderRadius: 3 }}>
              <div style={{ width: '21.8%', height: '100%', background: '#f59e0b', borderRadius: 3 }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h4 className="panel-title" style={{ fontSize: 15 }}>
            <TrendingDown size={16} color="#00d2ff" />
            <span>TOTAL CORRIDOR DOWNTIME REDUCTION</span>
          </h4>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', padding: '10px 0' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Uncoordinated (Before)</div>
            <div className="mono-font" style={{ fontSize: 24, fontWeight: 700, color: 'var(--rose)' }}>4,820 hrs</div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Independent BDMS requests</div>
          </div>
          <div style={{ fontSize: 22, color: 'var(--text-dim)' }}>➔</div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>RailOpt Optimized (After)</div>
            <div className="mono-font" style={{ fontSize: 24, fontWeight: 700, color: 'var(--emerald)' }}>1,510 hrs</div>
            <div style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 600 }}>▼ 68.6% Total Reduction</div>
          </div>
        </div>
      </div>
    </div>
  );
}