import React from 'react';
import { Home, Radio, Calendar, AlertTriangle, Cpu, Settings, LogOut } from 'lucide-react';

export default function Sidebar({ view, onChange, onOpenSettings, onOpenSignOut }) {
  const items = [
    { id: 'home', label: 'HOME', icon: Home },
    { id: 'live', label: 'LIVE', icon: Radio },
    { id: 'calendar', label: 'PLAN', icon: Calendar },
    { id: 'alerts', label: 'ALERT', icon: AlertTriangle },
    { id: 'sim', label: 'SIM', icon: Cpu },
  ];

  return (
    <aside className="sidebar">
      <div className="logo-badge">
        <span>RO</span>
      </div>

      <nav className="nav-group">
        {items.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            className={`sidebar-btn ${view === id ? 'active' : ''}`}
            onClick={() => onChange(id)}
            title={label}
          >
            <Icon size={20} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button 
          className="sidebar-btn" 
          title="Settings"
          onClick={onOpenSettings}
        >
          <Settings size={19} />
        </button>
        <button 
          className="sidebar-btn" 
          title="System Info"
          onClick={onOpenSignOut}
        >
          <LogOut size={19} />
        </button>
      </div>
    </aside>
  );
}