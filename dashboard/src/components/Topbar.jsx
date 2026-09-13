import React, { useState, useEffect } from 'react';
import { Activity, Clock, ShieldCheck, FileText } from 'lucide-react';

export default function Topbar({ activeZone, onZoneChange, onOpenCoa }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1 className="topbar-title brand-font">
          <span style={{ color: 'var(--accent)' }}>RAILOPT</span>
          <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
            SIH26027 · AI Automatic Block Planning System
          </span>
        </h1>
      </div>

      <div className="topbar-right">
        {/* COA Mock Button in Topbar */}
        <button
          className="btn btn-secondary"
          onClick={onOpenCoa}
          style={{ fontSize: 12, padding: '5px 12px', display: 'flex', alignItems: 'center', gap: 6, borderColor: 'rgba(0, 210, 255, 0.4)' }}
          title="Open Official Indian Railways Block Circular & CRIS COA Integration Payload"
        >
          <FileText size={14} color="var(--cyan)" />
          <span>📄 COA Circular</span>
        </button>

        <div className="pulse-badge">
          <span className="pulse-dot"></span>
          <span>OR-TOOLS SOLVER ACTIVE</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: 13 }}>
          <Clock size={15} color="#ff6a1a" />
          <span className="mono-font">{time} IST</span>
        </div>

        <select 
          value={activeZone} 
          onChange={(e) => onZoneChange(e.target.value)}
          style={{
            background: 'var(--bg-card)',
            color: 'var(--text-main)',
            border: '1px solid var(--border)',
            padding: '6px 12px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          <option value="ALL">All Zones (17 Zonal HQs · 8,622 Corridors)</option>
          <option value="CR">Central Railway (CR · Mumbai CSMT)</option>
          <option value="ECR">East Central Railway (ECR · Hajipur)</option>
          <option value="ECoR">East Coast Railway (ECoR · Bhubaneswar)</option>
          <option value="ER">Eastern Railway (ER · Kolkata)</option>
          <option value="KR">Konkan Railway (KR · Navi Mumbai)</option>
          <option value="NCR">North Central Railway (NCR · Prayagraj)</option>
          <option value="NER">North Eastern Railway (NER · Gorakhpur)</option>
          <option value="NFR">Northeast Frontier Railway (NFR · Guwahati)</option>
          <option value="NR">Northern Railway (NR · Delhi)</option>
          <option value="NWR">North Western Railway (NWR · Jaipur)</option>
          <option value="SCR">South Central Railway (SCR · Secunderabad)</option>
          <option value="SECR">South East Central Railway (SECR · Bilaspur)</option>
          <option value="SER">South Eastern Railway (SER · Kolkata)</option>
          <option value="SR">Southern Railway (SR · Chennai)</option>
          <option value="SWR">South Western Railway (SWR · Hubballi)</option>
          <option value="WCR">West Central Railway (WCR · Jabalpur)</option>
          <option value="WR">Western Railway (WR · Mumbai Churchgate)</option>
        </select>
      </div>
    </header>
  );
}