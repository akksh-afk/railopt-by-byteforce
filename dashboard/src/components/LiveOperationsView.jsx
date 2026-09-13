import React from 'react';
import CorridorMap from './CorridorMap';
import MiniCharts from './MiniCharts';
import { Radio } from 'lucide-react';

export default function LiveOperationsView({ corridors, stations }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="panel" style={{ background: 'linear-gradient(135deg, rgba(0, 210, 255, 0.08), transparent)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Radio size={20} color="#00d2ff" />
          <h2 className="panel-title">LIVE SECTION CONTROLLER TRAFFIC & MAINTENANCE FEED</h2>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Displaying live corridor occupancy against scheduled train paths from Indian Railways open timetables.
        </p>
      </div>

      <CorridorMap corridors={corridors} />
      <MiniCharts />
    </div>
  );
}