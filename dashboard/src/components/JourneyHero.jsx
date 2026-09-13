import React, { useState, useEffect } from 'react';
import { Train, Gauge, Zap, MapPin, Play, RefreshCw, CheckCircle2, FileText, Clock, X, ShieldCheck, Check } from 'lucide-react';

export default function JourneyHero() {
  const [scrollFrac, setScrollFrac] = useState(0.2);
  const [autoProgress, setAutoProgress] = useState(0.1);
  
  // Real-time Disruption Simulation State
  const [isDelayed, setIsDelayed] = useState(false);
  const [isSolving, setIsSolving] = useState(false);
  const [solverNotice, setSolverNotice] = useState(null);

  // Modals
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showCoaModal, setShowCoaModal] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  // Smooth background cruise
  useEffect(() => {
    const cruise = setInterval(() => {
      setAutoProgress((prev) => (prev >= 0.95 ? 0.05 : prev + 0.002));
    }, 50);
    return () => clearInterval(cruise);
  }, []);

  // Scroll tracking across page
  useEffect(() => {
    const container = document.querySelector('.main-scroll');
    if (!container) return;

    const onScroll = () => {
      const max = container.scrollHeight - container.clientHeight;
      const frac = max > 0 ? container.scrollTop / max : 0;
      setScrollFrac(frac);
    };

    container.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => container.removeEventListener('scroll', onScroll);
  }, []);

  // Compute train position across the track
  const combinedProgress = Math.min(0.92, Math.max(0.04, (scrollFrac * 0.7) + (autoProgress * 0.3)));
  const currentKm = Math.round(combinedProgress * 48 / 0.92);

  // Simulate traffic disruption + live OR-Tools re-solve
  const handleToggleDisruption = () => {
    setIsSolving(true);
    setTimeout(() => {
      setIsSolving(false);
      setIsDelayed(!isDelayed);
      setSolverNotice(
        !isDelayed
          ? "⚡ OR-Tools CP-SAT Solver Re-optimized (14ms): VB-22436 delayed +20m at Signal S-42. Block window dynamically shifted from 09:30–12:30 to 09:50–12:50 to preserve safety buffer!"
          : "✓ OR-Tools CP-SAT Solver Re-optimized (11ms): Track occupancy normalized. Block window reset to optimal timetable gap 09:30–12:30 IST."
      );
      setTimeout(() => setSolverNotice(null), 6000);
    }, 450);
  };

  return (
    <div className="panel journey-hero" style={{
      position: 'relative',
      overflow: 'hidden',
      padding: '20px 24px 285px',
      background: 'linear-gradient(135deg, rgba(19, 25, 38, 0.98), rgba(13, 17, 26, 0.98))',
      border: '1px solid rgba(255, 106, 26, 0.3)',
      boxShadow: '0 12px 36px rgba(0,0,0,0.55)'
    }}>
      {/* Solver dynamic update banner */}
      {solverNotice && (
        <div style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          background: isDelayed ? 'rgba(245, 158, 11, 0.98)' : 'rgba(16, 185, 129, 0.98)',
          color: '#000',
          padding: '6px 18px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 700,
          zIndex: 50,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          animation: 'fadeIn 0.3s ease-out'
        }}>
          <span>{solverNotice}</span>
        </div>
      )}

      {/* Top Header Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #ff6a1a, #ea580c)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(255, 106, 26, 0.45)'
          }}>
            <Train size={20} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="brand-font" style={{ fontSize: 18, color: '#fff' }}>
                NDLS–GZB SECTION · QUADRUPLED TRACK CONTROLLER VISUALIZER
              </span>
              {/* Punctuality Badge */}
              <span style={{
                background: isDelayed ? 'rgba(244, 63, 94, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                color: isDelayed ? '#fb7185' : '#34d399',
                border: `1px solid ${isDelayed ? '#f43f5e' : '#10b981'}`,
                padding: '2px 8px',
                borderRadius: 6,
                fontSize: 11,
                fontWeight: 700,
                fontFamily: 'JetBrains Mono, monospace'
              }}>
                {isDelayed ? 'STATUS: DELAYED (+20m at Signal S-42)' : 'STATUS: ON-TIME (+0m)'}
              </span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Train No. 22436 Vande Bharat Express · Section Density: 48 trains/day · Automatic Block Working
            </span>
          </div>
        </div>

        {/* Live Operational Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Dynamic Solver Trigger */}
          <button
            className="btn btn-secondary"
            onClick={handleToggleDisruption}
            disabled={isSolving}
            style={{
              fontSize: 12,
              padding: '6px 12px',
              borderColor: isDelayed ? 'var(--accent)' : 'var(--border)',
              background: isDelayed ? 'rgba(255, 106, 26, 0.15)' : 'var(--bg-card)'
            }}
            title="Inject real-time signal delay to trigger live OR-Tools re-solve"
          >
            {isSolving ? <RefreshCw size={14} className="spin" /> : <Play size={14} color="var(--accent)" />}
            <span>{isDelayed ? 'Reset Schedule' : '⚡ Simulate +20m Disruption'}</span>
          </button>

          {/* Export to COA Button */}
          <button
            className="btn btn-secondary"
            onClick={() => setShowCoaModal(true)}
            style={{ fontSize: 12, padding: '6px 12px' }}
          >
            <FileText size={14} color="var(--cyan)" />
            <span>Export to COA</span>
          </button>

          {/* 1-Click Controller Approval */}
          <button
            className={`btn ${isApproved ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setIsApproved(true)}
            style={{ fontSize: 12, padding: '6px 14px' }}
          >
            <CheckCircle2 size={14} color={isApproved ? 'var(--emerald)' : '#fff'} />
            <span>{isApproved ? 'DSS Sanctioned ✓' : 'Controller Sign-Off'}</span>
          </button>
        </div>
      </div>

      {/* Refined Quadrupled Track Physical Layout (190px generous height, zero cutoff) */}
      <div style={{
        position: 'relative',
        height: 190,
        background: 'rgba(5, 8, 14, 0.85)',
        borderRadius: 14,
        border: '1px solid rgba(255, 255, 255, 0.12)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-around',
        padding: '16px 20px',
        overflow: 'hidden'
      }}>
        {/* Overhead Catenary Wire (OHE 25kV) */}
        <div style={{ position: 'absolute', top: 8, left: 16, right: 16, height: 1, background: 'rgba(0, 210, 255, 0.35)' }}></div>

        {/* Track 1: UP MAIN LINE (Live Passenger Expresses) */}
        <div style={{ position: 'relative', height: 32, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: 3, background: '#334155', borderRadius: 2 }}></div>
          <span style={{ position: 'absolute', left: 4, top: -4, fontSize: 10, color: 'var(--cyan)', fontWeight: 700, letterSpacing: 0.5 }}>
            UP MAIN LINE (Live 130 km/h) ➔
          </span>

          {/* Vande Bharat Train Running on UP Main */}
          <div style={{
            position: 'absolute',
            left: `calc(10px + ${combinedProgress * 86}%)`,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'linear-gradient(135deg, #00d2ff, #0284c7)',
            padding: '4px 12px',
            borderRadius: 6,
            boxShadow: '0 0 20px rgba(0, 210, 255, 0.7), 0 0 6px #fff',
            transition: 'left 0.15s ease-out',
            zIndex: 10
          }}>
            <div style={{
              position: 'absolute',
              right: -20,
              width: 24,
              height: 12,
              background: 'linear-gradient(to right, rgba(255,255,255,0.8), transparent)',
              borderRadius: '50%',
              filter: 'blur(2px)'
            }}></div>
            <Train size={14} color="#fff" />
            <span className="mono-font" style={{ fontSize: 11, fontWeight: 800, color: '#fff', whiteSpace: 'nowrap' }}>
              VB-22436 {isDelayed ? '(+20m)' : '(+0m)'}
            </span>
          </div>
        </div>

        {/* Track 2: DOWN MAIN LINE (3-in-1 Coordinated Block Location) */}
        <div style={{ position: 'relative', height: 36, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: 3, background: '#1e293b', borderRadius: 2 }}></div>
          <span style={{ position: 'absolute', left: 4, top: -4, fontSize: 10, color: '#f43f5e', fontWeight: 700, letterSpacing: 0.5 }}>
            DOWN MAIN LINE (Possession Zone) ➔
          </span>

          {/* Prominent High-Contrast 3-in-1 Block Banner */}
          <div
            onClick={() => setShowBlockModal(true)}
            style={{
              position: 'absolute',
              left: isDelayed ? '48%' : '40%',
              width: '34%',
              height: 30,
              background: 'linear-gradient(135deg, rgba(255, 106, 26, 0.35), rgba(234, 88, 12, 0.45))',
              border: '2px solid var(--accent)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              cursor: 'pointer',
              boxShadow: '0 0 16px rgba(255, 106, 26, 0.35)',
              transition: 'left 0.4s ease-out',
              zIndex: 5
            }}
            title="Click to view 3-Department Breakdown & Machine Transit details"
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff6a1a', animation: 'pulse 1.5s infinite' }}></span>
              <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                ⚡ 3-IN-1 JOINT BLOCK {isDelayed ? '(09:50–12:50)' : '(09:30–12:30)'}
              </span>
            </div>
            <span style={{ fontSize: 10, color: 'var(--cyan)', fontWeight: 700, textDecoration: 'underline' }}>
              Inspect Details ↗
            </span>
          </div>
        </div>

        {/* Track 3: UP LOOP / DIVERSION LINE */}
        <div style={{ position: 'relative', height: 28, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: '#334155', strokeDasharray: '4,4' }}></div>
          <span style={{ position: 'absolute', left: 4, top: -4, fontSize: 10, color: 'var(--emerald)', fontWeight: 600 }}>
            UP LOOP / DIVERSION LINE (Clear for Freight & Rerouted Traffic) ➔
          </span>
          <span style={{ position: 'absolute', right: 16, top: -4, fontSize: 9, color: 'var(--text-dim)' }}>
            Crossover 42B Locked for Single-Line Working
          </span>
        </div>

        {/* Track 4: DOWN LOOP LINE (Refined & Fully Visible) */}
        <div style={{ position: 'relative', height: 26, display: 'flex', alignItems: 'center' }}>
          <div style={{ position: 'absolute', left: 0, right: 0, height: 2, background: '#1e293b' }}></div>
          <span style={{ position: 'absolute', left: 4, top: -4, fontSize: 10, color: 'var(--text-muted)', fontWeight: 600 }}>
            DOWN LOOP LINE (Suburban EMU Layover Siding)
          </span>
          <span style={{ position: 'absolute', right: 16, top: -4, fontSize: 9, color: 'var(--emerald)' }}>
            EMU Layover Idle · Clear
          </span>
        </div>
      </div>

      {/* Station Mileage & Dynamic Routing Summary (Clean bottom margin) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
        <span style={{ color: 'var(--text-muted)' }}>📍 0 km · New Delhi (NDLS)</span>
        <span style={{ color: isDelayed ? 'var(--amber)' : 'var(--accent)', fontWeight: 600 }}>
          {isDelayed ? '▲ Dynamic Shift Applied: 09:50–12:50 IST (Safety Headway 15m Cleared)' : '▲ OR-Tools Scheduled Window: 09:30–12:30 IST (Zero Passenger Halt)'}
        </span>
        <span style={{ color: 'var(--text-muted)' }}>📍 48 km · Ghaziabad Jn (GZB)</span>
      </div>

      {/* MODAL 1: Detailed 3-in-1 Block Inspection (Points 4 & 6) */}
      {showBlockModal && (
        <div className="modal-overlay" onClick={() => setShowBlockModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 650 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <span className="brand-font" style={{ fontSize: 20, color: 'var(--accent)' }}>
                  3-IN-1 COORDINATED BLOCK SPECIFICATION (DOWN MAIN LINE)
                </span>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Corridor COR03213 (NDLS–GZB) · Total Possession: 180 Minutes (3.0 Hours)
                </div>
              </div>
              <button onClick={() => setShowBlockModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Machine & Crew Transit Buffer */}
              <div style={{ background: 'rgba(255, 106, 26, 0.1)', border: '1px solid rgba(255, 106, 26, 0.3)', padding: 12, borderRadius: 8 }}>
                <b style={{ color: 'var(--accent)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={15} />
                  <span>MACHINE & CREW TRANSIT TIME CONSTRAINTS (COUNTED BY SOLVER):</span>
                </b>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginTop: 8, fontSize: 11 }}>
                  <div>
                    <div style={{ color: 'var(--text-dim)' }}>Mobilization Buffer</div>
                    <b style={{ color: '#fff' }}>25 mins</b> from GZB Siding
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)' }}>Active Execution</div>
                    <b style={{ color: 'var(--emerald)' }}>135 mins</b> simultaneous
                  </div>
                  <div>
                    <div style={{ color: 'var(--text-dim)' }}>Track Handover Buffer</div>
                    <b style={{ color: '#fff' }}>20 mins</b> safety trial
                  </div>
                </div>
              </div>

              {/* 3-Department Breakdown */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8, borderLeft: '4px solid #3b82f6' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <b style={{ color: '#60a5fa', fontSize: 13 }}>1. Engineering (Track & P-Way)</b>
                    <span style={{ fontSize: 11, color: 'var(--emerald)' }}>Machine: Plasser Duomatic 09-32</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Task TMS000001: Rail fracture ultrasonic weld test & 1.2 km deep tamping between km 18/2–19/4.
                  </p>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8, borderLeft: '4px solid #10b981' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <b style={{ color: '#34d399', fontSize: 13 }}>2. Signal & Telecommunication (S&T)</b>
                    <span style={{ fontSize: 11, color: 'var(--emerald)' }}>Crew: S&T Squad 4</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Task SMMS000004: Point machine #14B overhaul & axle counter dual-reset check at Sahibabad Jn.
                  </p>
                </div>

                <div style={{ background: 'var(--bg-card)', padding: 12, borderRadius: 8, borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <b style={{ color: '#fbbf24', fontSize: 13 }}>3. Traction Distribution (TRD / OHE)</b>
                    <span style={{ fontSize: 11, color: 'var(--emerald)' }}>Equipment: 8-Wheeler Tower Wagon</span>
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Task TDMS000008: Catenary wire tensioning & bracket insulator washing on Substation TSS-04.
                  </p>
                </div>
              </div>

              {/* Traffic Diversion Strategy */}
              <div style={{ background: 'rgba(0,0,0,0.35)', padding: 10, borderRadius: 8, fontSize: 12 }}>
                <b style={{ color: '#fff' }}>Traffic Diversion Protocol:</b> Down Main line isolated. Down express trains routed via UP Loop Line between Sahibabad and Ghaziabad with 0 min speed penalty.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Clean Officer-Ready COA Circular (No raw JSON block!) */}
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
                  NORTHERN RAILWAY · DELHI DIVISION · OPERATING CIRCULAR #NR/DLI/OPT/2026/09/01-84
                </div>
                <div><b>FROM:</b> SR. DOM / DELHI (CONTROLLER ID: SC-DLI-4102)</div>
                <div><b>TO:</b> STATION DIRECTORS NDLS / GZB / SBB, CHIEF CONTROLLER (COA)</div>
                <div><b>DATE/TIME:</b> 01-SEP-2026 04:30 IST</div>
                <div style={{ margin: '8px 0', color: '#94a3b8' }}>
                  --------------------------------------------------------------------------------<br />
                  SANCTION OF 3-IN-1 COORDINATED BLOCK IS HEREBY GRANTED ON DOWN MAIN LINE<br />
                  BETWEEN KM 18/2 AND KM 24/6 (NDLS–GZB).<br />
                  • WINDOW: 09:30 TO 12:30 IST (3.0 HOURS)<br />
                  • DEPARTMENTS INVOLVED: ENGG (P-WAY) + S&T + TRD (OHE POWER CUTOFF TSS-04)<br />
                  • DIVERSION: DOWN TRAINS DIVERTED VIA UP LOOP LINE WITH ZERO SPEED RESTRICTION.<br />
                  --------------------------------------------------------------------------------
                </div>
                <div style={{ color: 'var(--emerald)' }}>STATUS: DIGITALLY SANCTIONED VIA RAILOPT DECISION SUPPORT SYSTEM</div>
              </div>

              {/* Clean Official Digital Security Seal (Replaces raw JSON) */}
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
                  <div style={{ color: 'var(--cyan)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={16} />
                    <span>CRIS COA DIGITAL ENCRYPTION & POSSESSION RECORD</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>
                    Sanction Ref: <b>NR-2026-BLK00001</b> · Target: Station Master Train Register (TSR-01)
                  </div>
                </div>
                <div style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--emerald)',
                  border: '1px solid var(--emerald)',
                  padding: '4px 10px',
                  borderRadius: 6,
                  fontWeight: 700,
                  fontSize: 11,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}>
                  <Check size={14} />
                  <span>CRIS VERIFIED</span>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                <button className="btn btn-secondary" onClick={() => setShowCoaModal(false)}>Close</button>
                <button className="btn btn-primary" onClick={() => { alert('Block Sanction Circular dispatched to Station Master Register and COA live feed!'); setShowCoaModal(false); }}>
                  <CheckCircle2 size={14} />
                  <span>Transmit to Station Register & COA</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}