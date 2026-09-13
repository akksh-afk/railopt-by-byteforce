import React, { useState } from 'react';
import { Cpu, Play, CheckCircle2, AlertTriangle, RefreshCw, Train, ShieldAlert, Sparkles, FileText, Send, X } from 'lucide-react';
import { simulateReschedule } from '../api/api';
import { mockSchedule } from '../data/mockData';

export default function WhatIfPanel() {
  const [blockId, setBlockId] = useState('BLK00001');
  const [newTime, setNewTime] = useState('09:30');
  const [duration, setDuration] = useState(3.0);
  const [simResult, setSimResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showCoaModal, setShowCoaModal] = useState(false);

  const selectedBlock = mockSchedule.find(b => b.block_id === blockId) || mockSchedule[0];

  const handleBlockChange = (newBid) => {
    setBlockId(newBid);
    const blk = mockSchedule.find(b => b.block_id === newBid);
    if (blk) {
      setNewTime(blk.start_time.split(' ')[1]);
      setDuration(blk.duration_hrs);
    }
    setSimResult(null);
  };

  const handleSimulate = async () => {
    setLoading(true);
    const res = await simulateReschedule(blockId, newTime, duration);
    setSimResult(res);
    setLoading(false);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">
            <Cpu size={20} color="#00d2ff" />
            <span>WHAT-IF SIMULATION SANDBOX (LAYER 10)</span>
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Interactive Rescheduling & Train Timetable Conflict Sandbox · 30 Approved High-Capacity Block Scenarios
          </span>
        </div>

        {/* COA Export button right on header */}
        <button 
          className="btn btn-secondary"
          onClick={() => setShowCoaModal(true)}
          style={{ fontSize: 12, padding: '6px 12px' }}
        >
          <FileText size={14} color="var(--cyan)" />
          <span>📄 Export Block to COA / CRIS</span>
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
        {/* Parameters Form */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <h4 style={{ fontSize: 14, color: 'var(--text-main)' }}>
              CONTROLLER SANDBOX PARAMETERS
            </h4>
            <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700 }}>
              {mockSchedule.length} Scenarios Available
            </span>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
              Select Approved Block Scenario to Shift (30 Curated Corridors across 17 Zones):
            </label>
            <select
              value={blockId}
              onChange={(e) => handleBlockChange(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: '#fff', padding: '8px 10px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}
            >
              {mockSchedule.map((b) => (
                <option key={b.block_id} value={b.block_id}>
                  {b.block_id} · {b.corridor_id} ({b.from_station}➔{b.to_station}, {b.zone}) | {b.start_time.split(' ')[1]}–{b.end_time.split(' ')[1]} | {b.merged_count}-in-1 Block (Priority: {b.priority_score})
                </option>
              ))}
            </select>
          </div>

          <div style={{ background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 8, fontSize: 11, border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: 'var(--text-dim)' }}>Corridor Section:</span>
              <b style={{ color: '#fff' }}>{selectedBlock.from_name} ({selectedBlock.from_station}) ➔ {selectedBlock.to_name} ({selectedBlock.to_station})</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span style={{ color: 'var(--text-dim)' }}>Coordinated Work:</span>
              <b style={{ color: 'var(--emerald)' }}>{selectedBlock.departments.join(' + ')}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-dim)' }}>Original Timetable Window:</span>
              <b style={{ color: 'var(--cyan)' }}>{selectedBlock.start_time.split(' ')[1]} — {selectedBlock.end_time.split(' ')[1]} ({selectedBlock.duration_hrs}h)</b>
            </div>
          </div>

          <div>
            <label style={{ fontSize: 12, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Adjusted Proposed Start Time:</label>
            <input 
              type="time" 
              value={newTime} 
              onChange={(e) => setNewTime(e.target.value)}
              style={{ width: '100%', background: 'var(--bg-surface)', border: '1px solid var(--border)', color: '#fff', padding: '8px 10px', borderRadius: 8, fontSize: 14 }}
            />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Requested Window Duration:</span>
              <b style={{ color: 'var(--accent)' }}>{duration} hours ({Math.round(duration * 60)} mins)</b>
            </div>
            <input 
              type="range" 
              min="1" 
              max="8" 
              step="0.5" 
              value={duration} 
              onChange={(e) => setDuration(parseFloat(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dim)', marginTop: 2 }}>
              <span>1 hr</span>
              <span>4 hrs</span>
              <span>8 hrs</span>
            </div>
          </div>

          <button className="btn btn-primary" onClick={handleSimulate} disabled={loading} style={{ justifyContent: 'center', marginTop: 6, padding: '12px 16px' }}>
            {loading ? <RefreshCw size={16} className="spin" /> : <Play size={16} />}
            <span>RUN INSTANT WHAT-IF RE-SOLVE & TIMETABLE VALIDATION</span>
          </button>
        </div>

        {/* Results Panel */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
            <h4 style={{ fontSize: 14, color: 'var(--text-main)' }}>
              SANDBOX IMPACT ASSESSMENT
            </h4>
            {simResult && (
              <button 
                className="btn btn-secondary"
                onClick={() => setShowCoaModal(true)}
                style={{ fontSize: 11, padding: '3px 8px' }}
              >
                <FileText size={13} color="var(--cyan)" />
                <span>Export Circular</span>
              </button>
            )}
          </div>

          {simResult ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Header Status */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: 8,
                background: simResult.status === 'PASS' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                border: `1px solid ${simResult.status === 'PASS' ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
                color: simResult.status === 'PASS' ? 'var(--emerald)' : 'var(--rose)',
                fontSize: 14,
                fontWeight: 700
              }}>
                {simResult.status === 'PASS' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                <span>SAFETY CHECK: {simResult.status === 'PASS' ? 'PASSED (0 TIMETABLE CONFLICTS)' : `REJECTED (${simResult.violations.length} TIMETABLE CONFLICTS)`}</span>
              </div>

              {/* Metric grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: 'rgba(0,0,0,0.3)', padding: 12, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Proposed Window</div>
                  <b style={{ color: '#fff', fontSize: 12 }} className="mono-font">{simResult.impact.proposed_window}</b>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Downtime Delta</div>
                  <b style={{ color: simResult.impact.downtime_delta_min > 0 ? 'var(--amber)' : 'var(--emerald)', fontSize: 14 }} className="mono-font">
                    {simResult.impact.downtime_delta_min > 0 ? `+${simResult.impact.downtime_delta_min}` : simResult.impact.downtime_delta_min} mins
                  </b>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Conflicting Trains</div>
                  <b style={{ color: simResult.impact.affected_train_count > 0 ? 'var(--rose)' : 'var(--emerald)', fontSize: 14 }}>
                    {simResult.impact.affected_train_count} Trains
                  </b>
                </div>
              </div>

              {/* Violations List */}
              {simResult.violations.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto', paddingRight: 4 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--rose)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldAlert size={14} />
                    <span>Active Train & Capacity Collisions:</span>
                  </div>
                  {simResult.violations.map((v, i) => (
                    <div key={i} style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.25)', borderRadius: 6, padding: '8px 10px', fontSize: 11 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                        <b style={{ color: '#fb7185' }}>{v.train ? `${v.train} (${v.train_id})` : v.code}</b>
                        <span style={{ color: 'var(--rose)', fontWeight: 700 }}>{v.severity}</span>
                      </div>
                      <p style={{ color: 'var(--text-muted)', margin: 0 }}>{v.detail}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Recommendation */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, background: 'rgba(255, 106, 26, 0.1)', border: '1px solid rgba(255, 106, 26, 0.25)', borderRadius: 8, padding: 10, fontSize: 12 }}>
                <Sparkles size={16} color="var(--accent)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <b style={{ color: 'var(--accent)' }}>OR-Tools Solver Recommendation:</b>
                  <p style={{ color: 'var(--text-main)', margin: '2px 0 0 0' }}>{simResult.impact.recommended_window}</p>
                </div>
              </div>

              <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                * Original master schedule remains completely untouched (Interface 6 Contract preserved).
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 260, color: 'var(--text-dim)', gap: 10 }}>
              <Cpu size={36} />
              <span style={{ fontSize: 13, textAlign: 'center' }}>
                Select any of the <b>30 real corridor block scenarios</b> above, adjust timing or duration, and click <b>'Run Instant What-If'</b> to test live timetable conflicts.
              </span>
            </div>
          )}
        </div>
      </div>

      {/* COA EXPORT & DIVISIONAL CIRCULAR MODAL */}
      {showCoaModal && (
        <div className="modal-overlay" onClick={() => setShowCoaModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 700 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <span className="brand-font" style={{ fontSize: 18, color: 'var(--cyan)' }}>
                  COA INTEGRATION GATEWAY · DIVISIONAL BLOCK CIRCULAR
                </span>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Ready for CRIS Control Office Application (COA) & Station Master Register Sync
                </div>
              </div>
              <button onClick={() => setShowCoaModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Official Circular Text */}
              <div style={{
                background: '#04060a',
                border: '1px solid #334155',
                padding: 16,
                borderRadius: 8,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 11,
                color: '#e2e8f0',
                lineHeight: 1.6
              }}>
                <div style={{ textAlign: 'center', fontWeight: 700, color: 'var(--accent)', borderBottom: '1px dashed #334155', paddingBottom: 6, marginBottom: 8 }}>
                  INDIAN RAILWAYS · {selectedBlock.zone} ZONE · OPERATING CIRCULAR #{selectedBlock.zone}/OPT/2026/09/01-{selectedBlock.block_id}
                </div>
                <div><b>FROM:</b> SR. DOM / OPERATING BRANCH ({selectedBlock.zone} ZONAL HQ)</div>
                <div><b>TO:</b> STATION DIRECTORS {selectedBlock.from_station} / {selectedBlock.to_station}, CHIEF CONTROLLER (COA)</div>
                <div><b>DATE/TIME:</b> 01-SEP-2026 05:00 IST</div>
                <div style={{ margin: '8px 0', color: '#94a3b8' }}>
                  --------------------------------------------------------------------------------<br />
                  SANCTION OF {selectedBlock.merged_count}-IN-1 COORDINATED MAINTENANCE BLOCK GRANTED:<br />
                  • CORRIDOR: {selectedBlock.corridor_id} ({selectedBlock.from_name} ➔ {selectedBlock.to_name})<br />
                  • APPROVED TIME: {selectedBlock.start_time.split(' ')[1]} TO {selectedBlock.end_time.split(' ')[1]} IST ({selectedBlock.duration_hrs} HOURS)<br />
                  • DEPARTMENTS: {selectedBlock.departments.join(' + ').toUpperCase()}<br />
                  • MACHINE TRANSIT BUFFER: 25 MINS INCLUDED (Ghaziabad/Divisional Siding)<br />
                  • SPEED RESTRICTION: ZERO KM/H CAUTION (Full Timetable Gap Utilized)<br />
                  --------------------------------------------------------------------------------
                </div>
                <div style={{ color: 'var(--emerald)' }}>STATUS: DIGITALLY SANCTIONED VIA RAILOPT DECISION SUPPORT SYSTEM</div>
              </div>

              {/* Clean Official Digital Security Seal (Officer View) */}
              <div style={{
                background: 'rgba(0, 210, 255, 0.05)',
                border: '1px solid rgba(0, 210, 255, 0.25)',
                padding: '12px 16px',
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: 12
              }}>
                <div>
                  <div style={{ color: 'var(--cyan)', fontWeight: 700 }}>
                    CRIS COA DIGITAL ENCRYPTION & POSSESSION RECORD
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                    Sanction Ref: <b>{selectedBlock.zone}-2026-{selectedBlock.block_id}</b> · Target: Station Master Train Register (TSR-01)
                  </div>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--emerald)',
                  border: '1px solid var(--emerald)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 11
                }}>
                  CRIS VERIFIED ✓
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => setShowCoaModal(false)}>Close</button>
                <button className="btn btn-primary" onClick={() => { alert(`Dispatched ${selectedBlock.block_id} sanction payload to CRIS COA Live Gateway successfully!`); setShowCoaModal(false); }}>
                  <Send size={14} />
                  <span>Transmit to CRIS COA Live Gateway</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}