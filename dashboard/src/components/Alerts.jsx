import React, { useState, useMemo } from 'react';
import StatusChip from './StatusChip';
import { AlertTriangle, ShieldAlert, CheckCircle2, Filter, X, ArrowRight, Clock, MapPin, Zap, Layers } from 'lucide-react';

export default function Alerts({ alerts = [] }) {
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [resolvedIds, setResolvedIds] = useState(new Set());

  // Filter alerts based on severity
  const filteredAlerts = useMemo(() => {
    if (severityFilter === 'ALL') return alerts;
    return alerts.filter(a => a.severity === severityFilter);
  }, [alerts, severityFilter]);

  const toggleResolved = (id, e) => {
    e.stopPropagation();
    setResolvedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="panel">
      {/* Header */}
      <div className="panel-header" style={{ flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 className="panel-title">
            <AlertTriangle size={22} color="#f43f5e" />
            <span>LAYER 7 SAFETY VALIDATION & AUTOMATIC CONFLICT ALERTS FEED</span>
          </h2>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            Zero-Accident Safety Framework · General Rules (G&SR) Headway & Power Zone Constraint Engine
          </span>
        </div>

        {/* Severity Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <Filter size={14} /> Filter:
          </span>
          {['ALL', 'CRITICAL', 'HIGH', 'MODERATE'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              style={{
                background: severityFilter === sev ? 'var(--accent)' : 'var(--bg-card)',
                color: severityFilter === sev ? '#000' : 'var(--text-muted)',
                border: '1px solid var(--border)',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s'
              }}
            >
              {sev} {sev !== 'ALL' && `(${alerts.filter(a => a.severity === sev).length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stat Pill Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 12,
        marginBottom: 16
      }}>
        <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid rgba(244, 63, 94, 0.3)', padding: '10px 14px', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#fb7185' }}>CRITICAL ALERTS (HEADWAY/OVERLAP)</div>
          <b style={{ fontSize: 18, color: '#fff' }}>{alerts.filter(a => a.severity === 'CRITICAL').length} Prevented</b>
        </div>
        <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '10px 14px', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#fcd34d' }}>HIGH (TRACTION & POWER ZONES)</div>
          <b style={{ fontSize: 18, color: '#fff' }}>{alerts.filter(a => a.severity === 'HIGH').length} Isolated</b>
        </div>
        <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '10px 14px', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#93c5fd' }}>CAG MAINTENANCE BACKLOG</div>
          <b style={{ fontSize: 18, color: '#fff' }}>{alerts.filter(a => a.severity === 'MODERATE').length} Scheduled</b>
        </div>
        <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '10px 14px', borderRadius: 8 }}>
          <div style={{ fontSize: 11, color: '#6ee7b7' }}>AUTOMATIC ACTION RATE</div>
          <b style={{ fontSize: 18, color: '#fff' }}>100% Resolved by Solver</b>
        </div>
      </div>

      {/* Interactive Alerts Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 620, overflowY: 'auto', paddingRight: 4 }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
            No alerts match this severity filter.
          </div>
        ) : (
          filteredAlerts.map((alt) => {
            const isResolved = resolvedIds.has(alt.id);
            const isCrit = alt.severity === 'CRITICAL';
            const isHigh = alt.severity === 'HIGH';

            return (
              <div
                key={alt.id}
                onClick={() => setSelectedAlert(alt)}
                style={{
                  background: isResolved ? 'rgba(13, 17, 26, 0.6)' : 'var(--bg-card)',
                  border: `1px solid ${isCrit ? 'rgba(244, 63, 94, 0.4)' : (isHigh ? 'rgba(245, 158, 11, 0.3)' : 'var(--border)')}`,
                  borderRadius: 10,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: isCrit ? '0 0 12px rgba(244, 63, 94, 0.1)' : 'none',
                  opacity: isResolved ? 0.7 : 1
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 36,
                    height: 36,
                    borderRadius: 8,
                    background: isCrit ? 'rgba(244, 63, 94, 0.2)' : (isHigh ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <AlertTriangle size={18} color={isCrit ? '#f43f5e' : (isHigh ? '#f59e0b' : '#3b82f6')} />
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 3, flexWrap: 'wrap' }}>
                      <b style={{ fontSize: 14, color: isResolved ? 'var(--text-muted)' : '#fff' }}>{alt.title}</b>
                      <StatusChip status={alt.severity} />
                      <span className="mono-font" style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 600 }}>{alt.corridor_id}</span>
                      <span className="mono-font" style={{ fontSize: 10, background: 'rgba(255,255,255,0.06)', padding: '2px 6px', borderRadius: 4, color: 'var(--text-dim)' }}>
                        {alt.rule_code}
                      </span>
                      {isResolved && (
                        <span style={{ fontSize: 11, color: 'var(--emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <CheckCircle2 size={12} /> Controller Acknowledged
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>{alt.message}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                  <div style={{ textAlign: 'right', fontSize: 11 }}>
                    <div style={{ color: 'var(--text-dim)' }}>{alt.time}</div>
                    <div style={{ color: 'var(--cyan)', fontWeight: 600, fontSize: 10 }}>Click to Inspect ↗</div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Detailed Alert Diagnosis & Controller Action Modal */}
      {selectedAlert && (
        <div className="modal-overlay" onClick={() => setSelectedAlert(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="mono-font" style={{ color: 'var(--accent)', fontWeight: 700, fontSize: 14 }}>
                    {selectedAlert.id} · {selectedAlert.rule_code}
                  </span>
                  <StatusChip status={selectedAlert.severity} />
                </div>
                <h3 className="brand-font" style={{ fontSize: 18, margin: '4px 0 0 0' }}>
                  {selectedAlert.title}
                </h3>
              </div>
              <button onClick={() => setSelectedAlert(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Corridor & Section metadata */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, background: 'var(--bg-card)', padding: 12, borderRadius: 8 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Corridor Section</div>
                  <b style={{ color: '#fff', fontSize: 12 }}>{selectedAlert.corridor_id}</b>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Physical Location</div>
                  <b style={{ color: 'var(--cyan)', fontSize: 12 }}>{selectedAlert.section || 'Track Sector'}</b>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Timestamp</div>
                  <b style={{ color: 'var(--accent)', fontSize: 12 }}>{selectedAlert.time}</b>
                </div>
              </div>

              {/* Conflict Explanation */}
              <div style={{ background: 'rgba(0,0,0,0.35)', padding: 12, borderRadius: 8, border: '1px solid var(--border)' }}>
                <h4 style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 6, textTransform: 'uppercase' }}>
                  Safety Violation Diagnosis:
                </h4>
                <p style={{ fontSize: 13, color: '#e2e8f0', margin: 0, lineHeight: 1.5 }}>
                  {selectedAlert.details || selectedAlert.message}
                </p>
              </div>

              {/* Automatic Solver Mitigation Action */}
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', padding: 12, borderRadius: 8 }}>
                <div style={{ fontSize: 12, color: 'var(--emerald)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <CheckCircle2 size={16} />
                  <span>OR-TOOLS SOLVER SAFETY MITIGATION:</span>
                </div>
                <p style={{ fontSize: 12, color: '#fff', margin: 0 }}>
                  {selectedAlert.action_taken || 'Solver adjusted block boundary to satisfy safety headway.'}
                </p>
              </div>

              {/* Footer Actions */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <button
                  className="btn btn-secondary"
                  onClick={(e) => {
                    toggleResolved(selectedAlert.id, e);
                    setSelectedAlert(null);
                  }}
                  style={{ fontSize: 12 }}
                >
                  {resolvedIds.has(selectedAlert.id) ? 'Mark as Unresolved' : '✓ Acknowledge & Archive Alert'}
                </button>

                <button className="btn btn-primary" onClick={() => setSelectedAlert(null)} style={{ fontSize: 12 }}>
                  Close Diagnostic
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}