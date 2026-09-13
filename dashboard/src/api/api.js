import {
  mockSummary,
  mockCorridors,
  mockStations,
  mockSchedule,
  mockAlerts,
  mockDecisionTrace
} from '../data/mockData';

import allCorridors from '../data/allCorridors.json';

export const getSummary = async () => mockSummary;
export const getCorridors = async () => allCorridors;
export const getStations = async () => mockStations;
export const getSchedule = async () => mockSchedule;
export const getAlerts = async () => mockAlerts;
export const getDecisionTrace = async () => mockDecisionTrace;

// Corridor train timetables & power zone timetable profiles (24-Hour Timetable Grid)
const corridorTimetables = {
  'COR03213': [ // NDLS - GZB
    { train_id: 'VB-22436', name: 'Vande Bharat Express', type: 'SUPERFAST', start_min: 390, end_min: 450, is_electric: true }, // 06:30 - 07:30
    { train_id: 'SHAT-12004', name: 'Lucknow Shatabdi', type: 'EXPRESS', start_min: 420, end_min: 480, is_electric: true }, // 07:00 - 08:00
    { train_id: 'EMU-64401', name: 'Ghaziabad EMU Local', type: 'SUBURBAN', start_min: 480, end_min: 560, is_electric: true }, // 08:00 - 09:20
    { train_id: 'RAJ-12301', name: 'Howrah Rajdhani Exp', type: 'PREMIUM', start_min: 990, end_min: 1060, is_electric: true }, // 16:30 - 17:40
    { train_id: 'GAT-12049', name: 'Gatimaan Express', type: 'HIGH_SPEED', start_min: 840, end_min: 910, is_electric: true }, // 14:00 - 15:10
    { train_id: 'FRT-9921', name: 'Dedicated Freight Train', type: 'FREIGHT', start_min: 1320, end_min: 1420, is_electric: true } // 22:00 - 23:40
  ],
  'COR01452': [ // BCT - VR
    { train_id: 'VB-20901', name: 'Vande Bharat (BCT-GIMB)', type: 'SUPERFAST', start_min: 370, end_min: 440, is_electric: true }, // 06:10 - 07:20
    { train_id: 'EMU-9012', name: 'Western Fast Local', type: 'SUBURBAN', start_min: 480, end_min: 750, is_electric: true }, // 08:00 - 12:30 (Dense Peak)
    { train_id: 'RAJ-12951', name: 'Mumbai Rajdhani Exp', type: 'PREMIUM', start_min: 1020, end_min: 1080, is_electric: true }, // 17:00 - 18:00
    { train_id: 'AUG-12953', name: 'August Kranti Tejas', type: 'PREMIUM', start_min: 1050, end_min: 1110, is_electric: true } // 17:30 - 18:30
  ],
  'COR04891': [ // HWH - BWN
    { train_id: 'VB-22301', name: 'Vande Bharat (HWH-NJP)', type: 'SUPERFAST', start_min: 355, end_min: 420, is_electric: true }, // 05:55 - 07:00
    { train_id: 'LOCAL-37811', name: 'Howrah-Barddhaman Local', type: 'SUBURBAN', start_min: 450, end_min: 660, is_electric: true }, // 07:30 - 11:00
    { train_id: 'CORO-12841', name: 'Coromandel Express', type: 'EXPRESS', start_min: 915, end_min: 980, is_electric: true }, // 15:15 - 16:20
    { train_id: 'SHAT-12019', name: 'Shatabdi Express', type: 'PREMIUM', start_min: 360, end_min: 430, is_electric: true }
  ]
};

function parseTimeToMinutes(timeStr) {
  if (!timeStr) return 570; // 09:30 AM
  const [h, m] = timeStr.split(':').map(Number);
  return (h * 60) + (m || 0);
}

function formatMinutesToTime(totalMin) {
  const normalized = ((totalMin % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 || 12;
  return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

export const simulateReschedule = async (blockId, newStartTimeStr, newDurationHrs) => {
  // Find block metadata
  const block = mockSchedule.find(b => b.block_id === blockId) || mockSchedule[0];
  const corridorId = block.corridor_id;
  const trains = corridorTimetables[corridorId] || corridorTimetables['COR03213'];

  const proposedStartMin = parseTimeToMinutes(newStartTimeStr);
  const durationMin = Math.round(newDurationHrs * 60);
  const proposedEndMin = proposedStartMin + durationMin;

  const originalStartMin = 570; // 09:30
  const originalDurationMin = 180; // 3.0 hrs
  const downtimeDeltaMin = durationMin - originalDurationMin;

  const violations = [];
  const conflictingTrains = [];

  // Check safety headway and overlap against every train path
  const MIN_HEADWAY = 15; // 15 mins minimum spacing

  for (const train of trains) {
    const trainStart = train.start_min;
    const trainEnd = train.end_min;

    // Check direct time overlap
    const hasOverlap = (proposedStartMin < trainEnd) && (proposedEndMin > trainStart);
    
    // Check headway buffer
    const gap = Math.min(
      Math.abs(proposedStartMin - trainEnd),
      Math.abs(trainStart - proposedEndMin)
    );

    if (hasOverlap) {
      conflictingTrains.push(train);
      violations.push({
        code: 'ERR_TRAIN_HEADWAY_VIOLATION',
        severity: train.type === 'PREMIUM' || train.type === 'SUPERFAST' ? 'CRITICAL' : 'HIGH',
        train: train.name,
        train_id: train.train_id,
        detail: `Direct possession conflict with ${train.name} (${train.train_id}) running ${formatMinutesToTime(trainStart)}–${formatMinutesToTime(trainEnd)}. Block covers ${formatMinutesToTime(proposedStartMin)}–${formatMinutesToTime(proposedEndMin)}.`
      });
    } else if (gap < MIN_HEADWAY) {
      conflictingTrains.push(train);
      violations.push({
        code: 'WARN_HEADWAY_BUFFER_INSUFFICIENT',
        severity: 'MODERATE',
        train: train.name,
        train_id: train.train_id,
        detail: `Safety headway buffer is only ${gap} mins with ${train.name} (minimum ${MIN_HEADWAY} mins required by IR General Rules).`
      });
    }
  }

  // Check duration threshold: if block is overly long (e.g. > 4.5 hours in daytime), trigger power grid alert
  if (durationMin > 240 && (proposedStartMin >= 360 && proposedStartMin <= 1260)) {
    violations.push({
      code: 'ERR_POWER_ZONE_OVEREXTENDED',
      severity: 'HIGH',
      detail: `Daytime power block exceeds 4.0 hours threshold on ${corridorId}. Traction feeder TSS-04 will exceed thermal load re-routing limit.`
    });
  }

  const isPass = violations.length === 0;

  return {
    status: isPass ? 'PASS' : 'FAIL',
    violations: violations,
    conflicting_trains: conflictingTrains,
    impact: {
      block_id: blockId,
      corridor_id: corridorId,
      proposed_window: `${formatMinutesToTime(proposedStartMin)} — ${formatMinutesToTime(proposedEndMin)}`,
      downtime_before_min: originalDurationMin,
      downtime_after_min: durationMin,
      downtime_delta_min: downtimeDeltaMin,
      affected_train_count: conflictingTrains.length,
      safety_status: isPass ? 'CLEARED (0 CONFLICTS)' : `REJECTED (${violations.length} VIOLATIONS)`,
      recommended_window: isPass ? 'Current slot is optimal' : 'Recommended: Midday lull 09:30–12:30 IST or Night slot 00:30–04:00 IST'
    }
  };
};