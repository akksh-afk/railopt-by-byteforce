import React from 'react';

export default function StatusChip({ status }) {
  const styles = {
    APPROVED: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' },
    BLOCKED: { bg: 'rgba(244, 63, 94, 0.15)', color: '#fb7185', border: '1px solid rgba(244, 63, 94, 0.3)' },
    CLEAR: { bg: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' },
    MAINTENANCE_PENDING: { bg: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', border: '1px solid rgba(245, 158, 11, 0.3)' },
    CRITICAL: { bg: 'rgba(244, 63, 94, 0.2)', color: '#f43f5e', border: '1px solid #f43f5e' },
    HIGH: { bg: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b', border: '1px solid #f59e0b' },
    MODERATE: { bg: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid #60a5fa' },
  };

  const current = styles[status] || { bg: 'rgba(255, 255, 255, 0.1)', color: '#fff', border: '1px solid var(--border)' };

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      padding: '3px 8px',
      borderRadius: 6,
      fontSize: 11,
      fontWeight: 700,
      fontFamily: 'JetBrains Mono, monospace',
      backgroundColor: current.bg,
      color: current.color,
      border: current.border
    }}>
      {status}
    </span>
  );
}