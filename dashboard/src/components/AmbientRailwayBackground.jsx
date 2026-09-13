import React from 'react';

export default function AmbientRailwayBackground() {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      pointerEvents: 'none',
      zIndex: 0,
      overflow: 'hidden',
      opacity: 0.35
    }}>
      <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6a1a" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#00d2ff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
          </linearGradient>

          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Subtle Railway Grid Matrix */}
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255, 255, 255, 0.025)" strokeWidth="1" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {/* Route 1: Northern Trunk (Delhi - Kanpur - Howrah) */}
        <path
          id="routeNorth"
          d="M -100 180 Q 300 240, 650 200 T 1400 260 T 2200 190"
          fill="none"
          stroke="url(#trackGrad)"
          strokeWidth="2"
          strokeDasharray="6,8"
        />

        {/* Route 2: Western High-Speed Line (Delhi - Ahmedabad - Mumbai) */}
        <path
          id="routeWest"
          d="M 250 -50 Q 350 350, 480 600 T 700 1100"
          fill="none"
          stroke="url(#trackGrad)"
          strokeWidth="2"
          strokeDasharray="6,8"
        />

        {/* Route 3: Golden Diagonal (Mumbai - Nagpur - Kolkata) */}
        <path
          id="routeDiag"
          d="M 450 750 Q 800 550, 1200 500 T 1900 380"
          fill="none"
          stroke="url(#trackGrad)"
          strokeWidth="2"
          strokeDasharray="6,8"
        />

        {/* Route 4: Southern Spine (Delhi - Chennai - Bengaluru) */}
        <path
          id="routeSouth"
          d="M 300 100 Q 600 450, 800 800 T 1100 1200"
          fill="none"
          stroke="url(#trackGrad)"
          strokeWidth="2"
          strokeDasharray="6,8"
        />

        {/* Route 5: Trans-Corridor Express Line */}
        <path
          id="routeTrans"
          d="M -50 480 Q 500 580, 1100 450 T 2100 620"
          fill="none"
          stroke="url(#trackGrad)"
          strokeWidth="2"
          strokeDasharray="6,8"
        />

        {/* Moving Train 1: Vande Bharat 1 (Cyan Glow) */}
        <circle r="5" fill="#00d2ff" filter="url(#glow)">
          <animateMotion dur="14s" repeatCount="indefinite" path="M -100 180 Q 300 240, 650 200 T 1400 260 T 2200 190" />
        </circle>
        <circle r="2.5" fill="#ffffff">
          <animateMotion dur="14s" repeatCount="indefinite" path="M -100 180 Q 300 240, 650 200 T 1400 260 T 2200 190" />
        </circle>

        {/* Moving Train 2: Vande Bharat 2 (Orange Glow - Western Line) */}
        <circle r="5" fill="#ff6a1a" filter="url(#glow)">
          <animateMotion dur="18s" repeatCount="indefinite" path="M 250 -50 Q 350 350, 480 600 T 700 1100" />
        </circle>
        <circle r="2.5" fill="#ffffff">
          <animateMotion dur="18s" repeatCount="indefinite" path="M 250 -50 Q 350 350, 480 600 T 700 1100" />
        </circle>

        {/* Moving Train 3: Tejas Express (Emerald Glow - Diagonal) */}
        <circle r="5" fill="#10b981" filter="url(#glow)">
          <animateMotion dur="16s" repeatCount="indefinite" path="M 450 750 Q 800 550, 1200 500 T 1900 380" />
        </circle>
        <circle r="2.5" fill="#ffffff">
          <animateMotion dur="16s" repeatCount="indefinite" path="M 450 750 Q 800 550, 1200 500 T 1900 380" />
        </circle>

        {/* Moving Train 4: Southern Rajdhani Express */}
        <circle r="5" fill="#00d2ff" filter="url(#glow)">
          <animateMotion dur="20s" repeatCount="indefinite" path="M 300 100 Q 600 450, 800 800 T 1100 1200" />
        </circle>

        {/* Moving Train 5: Trans-Express */}
        <circle r="5" fill="#ff6a1a" filter="url(#glow)">
          <animateMotion dur="22s" repeatCount="indefinite" path="M -50 480 Q 500 580, 1100 450 T 2100 620" />
        </circle>

        {/* Station Junction Nodes */}
        {[
          { x: 300, y: 240, label: 'NDLS' },
          { x: 650, y: 200, label: 'CNB' },
          { x: 1400, y: 260, label: 'HWH' },
          { x: 480, y: 600, label: 'BCT' },
          { x: 800, y: 550, label: 'NGP' },
          { x: 800, y: 800, label: 'MAS' },
          { x: 1100, y: 1200, label: 'SBC' }
        ].map((st, i) => (
          <g key={i}>
            <circle cx={st.x} cy={st.y} r="4" fill="#1e293b" stroke="#00d2ff" strokeWidth="1.5" />
            <text x={st.x + 8} y={st.y + 4} fill="rgba(255,255,255,0.4)" fontSize="10" fontFamily="JetBrains Mono, monospace">
              {st.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}