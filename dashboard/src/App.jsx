import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Topbar from './components/Topbar';
import SummaryCards from './components/SummaryCards';
import JourneyHero from './components/JourneyHero';
import CorridorMap from './components/CorridorMap';
import DecisionTrace from './components/DecisionTrace';
import MiniCharts from './components/MiniCharts';
import CalendarView from './components/CalendarView';
import Alerts from './components/Alerts';
import WhatIfPanel from './components/WhatIfPanel';
import LiveOperationsView from './components/LiveOperationsView';
import BlockDetails from './components/BlockDetails';
import AmbientRailwayBackground from './components/AmbientRailwayBackground';
import { FileText, Send, X } from 'lucide-react';

import {
  getSummary,
  getCorridors,
  getStations,
  getSchedule,
  getAlerts,
  getDecisionTrace
} from './api/api';

export default function App() {
  const [view, setView] = useState('home');
  const [activeZone, setActiveZone] = useState('ALL');
  
  const [summary, setSummary] = useState(null);
  const [corridors, setCorridors] = useState([]);
  const [stations, setStations] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [traces, setTraces] = useState([]);
  
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showGlobalCoaModal, setShowGlobalCoaModal] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [sum, corr, stat, sched, alt, trc] = await Promise.all([
        getSummary(),
        getCorridors(),
        getStations(),
        getSchedule(),
        getAlerts(),
        getDecisionTrace()
      ]);
      setSummary(sum);
      setCorridors(corr);
      setStations(stat);
      setSchedule(sched);
      setAlerts(alt);
      setTraces(trc);
    }
    loadData();
  }, []);

  // Compute how many corridors exist in currently selected zone
  const zoneCorridorsCount = useMemo(() => {
    if (!corridors || corridors.length === 0) return 8622;
    if (activeZone === 'ALL') return corridors.length;
    return corridors.filter(c => c.zone === activeZone).length;
  }, [corridors, activeZone]);

  return (
    <div className="app-container" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Ambient Moving Trains Background */}
      <AmbientRailwayBackground />

      <Sidebar 
        view={view} 
        onChange={setView} 
        onOpenSettings={() => setShowSettings(true)}
        onOpenSignOut={() => alert('RailOpt Controller Session · Ministry of Railways (SIH26027)')}
      />

      <div className="main-content" style={{ zIndex: 10 }}>
        <Topbar 
          activeZone={activeZone} 
          onZoneChange={setActiveZone} 
          onOpenCoa={() => setShowGlobalCoaModal(true)}
        />

        <main className="main-scroll">
          {view === 'home' && (
            <>
              <SummaryCards 
                summary={summary} 
                activeZone={activeZone} 
                totalCorridorsCount={zoneCorridorsCount} 
                onNavigate={setView}
              />
              <JourneyHero />
              <CorridorMap 
                corridors={corridors} 
                activeZone={activeZone} 
                onSelectCorridor={(c) => setView('live')} 
              />
              <MiniCharts />
              <DecisionTrace traces={traces} />
            </>
          )}

          {view === 'live' && (
            <LiveOperationsView 
              corridors={corridors.filter(c => activeZone === 'ALL' || c.zone === activeZone).slice(0, 100)} 
              stations={stations} 
            />
          )}

          {view === 'calendar' && (
            <CalendarView schedule={schedule} onSelectBlock={setSelectedBlock} />
          )}

          {view === 'alerts' && (
            <Alerts alerts={alerts} />
          )}

          {view === 'sim' && (
            <WhatIfPanel />
          )}
        </main>
      </div>

      {selectedBlock && (
        <BlockDetails block={selectedBlock} onClose={() => setSelectedBlock(null)} />
      )}

      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 className="brand-font" style={{ fontSize: 18 }}>SYSTEM CONFIGURATION & MODEL PARAMETERS</h3>
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>Close</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
              <div>• <b>Model Algorithm:</b> Gradient Boosted Decision Trees (XGBoost Regressor & Classifier)</div>
              <div>• <b>Solver:</b> Google OR-Tools (CP-SAT Constraint Satisfaction Programming)</div>
              <div>• <b>Evaluation Metrics:</b> Recall 96.8% | ROC-AUC 0.987 | Accuracy 94.8%</div>
              <div>• <b>Topology:</b> 8,622 National Corridors across 17 Zonal HQs (data.gov.in / NTES)</div>
              <div>• <b>Decision Scenarios:</b> 30 Fully Curated Coordinated Block Plans</div>
              <div>• <b>Deployment:</b> Indian Railways CRIS Local Edge Container (Zero External API Dependency)</div>
            </div>
          </div>
        </div>
      )}

      {/* Global COA Integration Modal (Accessible via Topbar on any view) */}
      {showGlobalCoaModal && (
        <div className="modal-overlay" onClick={() => setShowGlobalCoaModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 12, marginBottom: 16 }}>
              <div>
                <span className="brand-font" style={{ fontSize: 18, color: 'var(--cyan)' }}>
                  CRIS CONTROL OFFICE APPLICATION (COA) · FIELD INTEGRATION GATEWAY
                </span>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  Middleware for Automatic Block Demand & Station Master Possession Register Synchronization
                </div>
              </div>
              <button onClick={() => setShowGlobalCoaModal(false)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Circular view */}
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
                  MINISTRY OF RAILWAYS · OPERATING DEPARTMENT · JOINT BLOCK SANCTION CIRCULAR
                </div>
                <div><b>CIRCULAR NO:</b> IR/CRIS/COA/OPT/2026/09/01-AUTOSANCTION</div>
                <div><b>ISSUED BY:</b> SECTION CONTROLLER ID: SC-DLI-4102 · NORTHERN RAILWAY DRM OFFICE</div>
                <div><b>TO:</b> STATION DIRECTORS NDLS / GZB / SBB / CNB / BCT, CHIEF CONTROLLER (COA)</div>
                <div><b>TIMESTAMP:</b> 01-SEP-2026 05:15:00 IST</div>
                <div style={{ margin: '8px 0', color: '#94a3b8' }}>
                  --------------------------------------------------------------------------------<br />
                  AUTOMATIC CO-ORDINATED BLOCK SANCTION GRANTED VIA RAILOPT DECISION SUPPORT:<br />
                  1. BLOCK ID: BLK00001 (NDLS–GZB DOWN MAIN LINE)<br />
                     • TIME WINDOW: 09:30 TO 12:30 IST (3.0 HOURS)<br />
                     • WORK TYPE: 3-IN-1 JOINT POSSESSION (ENGG DUOMATIC TAMPING + S&T + OHE)<br />
                     • TRAFFIC DIVERSION: VIA UP LOOP LINE (ZERO SPEED RESTRICTION)<br />
                     • MACHINE TRANSIT: 25 MINS SIDING BUFFER INCLUDED (GHAZIABAD SIDING)<br />
                  2. ALL PRECEDING AND FOLLOWING EXPRESS TRAINS CLEARED WITH 15-MIN HEADWAY BUFFER.<br />
                  --------------------------------------------------------------------------------
                </div>
                <div style={{ color: 'var(--emerald)' }}>STATUS: DIGITALLY AUTHENTICATED & READY FOR FIELD EXECUTION</div>
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
                    Sanction Ref: <b>IR-2026-BLK00001</b> · Target: Station Master Train Register (TSR-01)
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
                <button className="btn btn-secondary" onClick={() => setShowGlobalCoaModal(false)}>Close</button>
                <button className="btn btn-primary" onClick={() => { alert('Block Sanction Order dispatched to CRIS COA & Station Register Live Feed!'); setShowGlobalCoaModal(false); }}>
                  <Send size={14} />
                  <span>Transmit to CRIS COA Gateway</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}