export const mockSummary = {
  totalCorridors: 8622,
  activeBlocksToday: 30,
  pendingDefects: 11500,
  mergeEfficiency: '3.2 : 1',
  downtimeSavedMin: 4820,
  assetAvailabilityPct: 96.8,
  safetyRecallPct: 96.8,
  criticalClassACleared: 98.4
};

export const mockCorridors = [
  { corridor_id: 'COR03213', from_station: 'NDLS', to_station: 'GZB', from_name: 'New Delhi', to_name: 'Ghaziabad', zone: 'NR', traffic_density: 48, active_blocks: 2, status: 'BLOCKED' },
  { corridor_id: 'COR01452', from_station: 'BCT', to_station: 'VR', from_name: 'Mumbai Central', to_name: 'Virar', zone: 'WR', traffic_density: 52, active_blocks: 1, status: 'CLEAR' },
  { corridor_id: 'COR04891', from_station: 'HWH', to_station: 'BWN', from_name: 'Howrah', to_name: 'Barddhaman', zone: 'ER', traffic_density: 41, active_blocks: 1, status: 'MAINTENANCE_PENDING' },
  { corridor_id: 'COR02110', from_station: 'MAS', to_station: 'AJJ', from_name: 'Chennai Central', to_name: 'Arakkonam', zone: 'SR', traffic_density: 39, active_blocks: 1, status: 'CLEAR' },
  { corridor_id: 'COR05519', from_station: 'SBC', to_station: 'YPR', from_name: 'KSR Bengaluru', to_name: 'Yesvantpur', zone: 'SWR', traffic_density: 35, active_blocks: 1, status: 'BLOCKED' },
  { corridor_id: 'COR07102', from_station: 'HDP', to_station: 'PUNE', from_name: 'Hadapsar', to_name: 'Pune Junction', zone: 'CR', traffic_density: 44, active_blocks: 1, status: 'CLEAR' }
];

export const mockStations = [
  { code: 'NDLS', name: 'New Delhi', zone: 'NR', lat: 28.6143, lon: 77.2185 },
  { code: 'GZB', name: 'Ghaziabad', zone: 'NR', lat: 28.6679, lon: 77.4498 },
  { code: 'BCT', name: 'Mumbai Central', zone: 'WR', lat: 18.9696, lon: 72.8193 },
  { code: 'VR', name: 'Virar', zone: 'WR', lat: 19.4688, lon: 72.8066 },
  { code: 'HWH', name: 'Howrah', zone: 'ER', lat: 22.5838, lon: 88.3426 },
  { code: 'BWN', name: 'Barddhaman', zone: 'ER', lat: 23.2384, lon: 87.8631 },
  { code: 'MAS', name: 'Chennai Central', zone: 'SR', lat: 13.0827, lon: 80.2707 },
  { code: 'AJJ', name: 'Arakkonam', zone: 'SR', lat: 13.0820, lon: 79.6670 }
];

export const mockSchedule = [
  {
    "block_id": "BLK00001",
    "corridor_id": "COR03213",
    "from_station": "NDLS",
    "to_station": "GZB",
    "from_name": "New Delhi",
    "to_name": "Ghaziabad",
    "zone": "NR",
    "start_time": "2026-09-01 09:30",
    "end_time": "2026-09-01 12:30",
    "duration_hrs": 3.0,
    "departments": [
      "Engineering",
      "Signal & Telecommunication",
      "Traction Distribution"
    ],
    "merged_count": 3,
    "priority_score": 100.0,
    "status": "APPROVED",
    "reason": "Merged 3 requests into 1 joint 3h window. Clears Class-A rail fracture & OHE wear with 0 express train conflict."
  },
  {
    "block_id": "BLK00002",
    "corridor_id": "COR01452",
    "from_station": "BCT",
    "to_station": "VR",
    "from_name": "Mumbai Central",
    "to_name": "Virar",
    "zone": "WR",
    "start_time": "2026-09-01 13:00",
    "end_time": "2026-09-01 15:30",
    "duration_hrs": 2.5,
    "departments": [
      "Engineering",
      "Signal & Telecommunication"
    ],
    "merged_count": 2,
    "priority_score": 92.1,
    "status": "APPROVED",
    "reason": "Joint track geometry tamping and point machine overhaul in midday commuter lull."
  },
  {
    "block_id": "BLK00003",
    "corridor_id": "COR04891",
    "from_station": "HWH",
    "to_station": "BWN",
    "from_name": "Howrah",
    "to_name": "Barddhaman",
    "zone": "ER",
    "start_time": "2026-09-01 23:00",
    "end_time": "2026-09-01 03:00",
    "duration_hrs": 4.0,
    "departments": [
      "Engineering",
      "Traction Distribution"
    ],
    "merged_count": 2,
    "priority_score": 83.6,
    "status": "APPROVED",
    "reason": "Night window for deep ballast screening and feeder insulator replacement."
  },
  {
    "block_id": "BLK00004",
    "corridor_id": "COR02110",
    "from_station": "MAS",
    "to_station": "AJJ",
    "from_name": "Chennai Central",
    "to_name": "Arakkonam",
    "zone": "SR",
    "start_time": "2026-09-01 11:30",
    "end_time": "2026-09-01 14:00",
    "duration_hrs": 2.5,
    "departments": [
      "Engineering",
      "Signal & Telecommunication"
    ],
    "merged_count": 2,
    "priority_score": 88.4,
    "status": "APPROVED",
    "reason": "Track circuit overhaul alongside sleeper packing during freight lull."
  },
  {
    "block_id": "BLK00005",
    "corridor_id": "COR05519",
    "from_station": "SBC",
    "to_station": "YPR",
    "from_name": "KSR Bengaluru",
    "to_name": "Yesvantpur",
    "zone": "SWR",
    "start_time": "2026-09-01 10:15",
    "end_time": "2026-09-01 13:15",
    "duration_hrs": 3.0,
    "departments": [
      "Engineering",
      "Signal & Telecommunication",
      "Traction Distribution"
    ],
    "merged_count": 3,
    "priority_score": 96.5,
    "status": "APPROVED",
    "reason": "Joint interlocking relay test, catenary wire inspection, and fishplate replacement."
  },
  {
    "block_id": "BLK00006",
    "corridor_id": "COR02830",
    "from_station": "BL",
    "to_station": "DGI",
    "from_name": "Valsad",
    "to_name": "Dungri",
    "zone": "WR",
    "start_time": "2026-09-01 01:00",
    "end_time": "2026-09-01 04:30",
    "duration_hrs": 3.5,
    "departments": [
      "Engineering",
      "Traction Distribution"
    ],
    "merged_count": 2,
    "priority_score": 89.2,
    "status": "APPROVED",
    "reason": "High-density trunk corridor deep tamping with 8-Wheeler Tower Wagon OHE inspection."
  },
  {
    "block_id": "BLK00007",
    "corridor_id": "COR02832",
    "from_station": "JRS",
    "to_station": "BIM",
    "from_name": "Joravasan",
    "to_name": "Bilimora Jn",
    "zone": "WR",
    "start_time": "2026-09-01 11:45",
    "end_time": "2026-09-01 14:15",
    "duration_hrs": 2.5,
    "departments": [
      "Signal & Telecommunication",
      "Traction Distribution"
    ],
    "merged_count": 2,
    "priority_score": 79.5,
    "status": "APPROVED",
    "reason": "Axle counter sensor calibration and bracket insulator power cutoff."
  },
  {
    "block_id": "BLK00008",
    "corridor_id": "COR00479",
    "from_station": "KNW",
    "to_station": "MTA",
    "from_name": "Khandwa",
    "to_name": "Mathela",
    "zone": "CR",
    "start_time": "2026-09-01 12:00",
    "end_time": "2026-09-01 15:00",
    "duration_hrs": 3.0,
    "departments": [
      "Engineering",
      "Signal & Telecommunication",
      "Traction Distribution"
    ],
    "merged_count": 3,
    "priority_score": 97.8,
    "status": "APPROVED",
    "reason": "Point machine #12B servicing, rail weld defect grinding, and OHE portal repainting."
  },
  {
    "block_id": "BLK00009",
    "corridor_id": "COR02148",
    "from_station": "MPKT",
    "to_station": "MCPT",
    "from_name": "Chennai Park",
    "to_name": "Chintadripet",
    "zone": "SR",
    "start_time": "2026-09-01 00:30",
    "end_time": "2026-09-01 04:00",
    "duration_hrs": 3.5,
    "departments": [
      "Engineering",
      "Signal & Telecommunication"
    ],
    "merged_count": 2,
    "priority_score": 85.0,
    "status": "APPROVED",
    "reason": "Suburban MRTS track re-alignment and track circuit impedance bond check."
  },
  {
    "block_id": "BLK00010",
    "corridor_id": "COR00285",
    "from_station": "MTA",
    "to_station": "KNW",
    "from_name": "Mathela",
    "to_name": "Khandwa",
    "zone": "WCR",
    "start_time": "2026-09-01 10:30",
    "end_time": "2026-09-01 13:00",
    "duration_hrs": 2.5,
    "departments": [
      "Engineering",
      "Traction Distribution"
    ],
    "merged_count": 2,
    "priority_score": 91.0,
    "status": "APPROVED",
    "reason": "Duomatic tamping machine run and catenary dropper tightening on Down Main."
  },
  {
    "block_id": "BLK00011",
    "corridor_id": "COR00468",
    "from_station": "DSK",
    "to_station": "SAV",
    "from_name": "Duskheda",
    "to_name": "Savda",
    "zone": "CR",
    "start_time": "2026-09-01 13:15",
    "end_time": "2026-09-01 16:00",
    "duration_hrs": 2.75,
    "departments": [
      "Signal & Telecommunication",
      "Traction Distribution"
    ],
    "merged_count": 2,
    "priority_score": 77.2,
    "status": "APPROVED",
    "reason": "Signal lamp optical unit replacement and power transformer bushing wash."
  },
  {
    "block_id": "BLK00012",
    "corridor_id": "COR00480",
    "from_station": "CAER",
    "to_station": "BRUD",
    "from_name": "Chhanera",
    "to_name": "Barud",
    "zone": "WCR",
    "start_time": "2026-09-01 02:00",
    "end_time": "2026-09-01 05:30",
    "duration_hrs": 3.5,
    "departments": [
      "Engineering",
      "Signal & Telecommunication",
      "Traction Distribution"
    ],
    "merged_count": 3,
    "priority_score": 98.4,
    "status": "APPROVED",
    "reason": "3-in-1 megablock: turnout renewal, electronic interlocking health check, and feeder test."
  },
  {
    "block_id": "BLK00013",
    "corridor_id": "COR00606",
    "from_station": "CLE",
    "to_station": "YGL",
    "from_name": "Chintalpalli",
    "to_name": "Yelgur",
    "zone": "SCR",
    "start_time": "2026-09-01 09:45",
    "end_time": "2026-09-01 12:45",
    "duration_hrs": 3.0,
    "departments": [
      "Engineering",
      "Signal & Telecommunication"
    ],
    "merged_count": 2,
    "priority_score": 86.8,
    "status": "APPROVED",
    "reason": "Ballast profiling and digital axle counter card replacement."
  },
  {
    "block_id": "BLK00014",
    "corridor_id": "COR00607",
    "from_station": "YGL",
    "to_station": "NKD",
    "from_name": "Yelgur",
    "to_name": "Nekonda",
    "zone": "SCR",
    "start_time": "2026-09-01 14:00",
    "end_time": "2026-09-01 16:30",
    "duration_hrs": 2.5,
    "departments": [
      "Engineering",
      "Traction Distribution"
    ],
    "merged_count": 2,
    "priority_score": 93.5,
    "status": "APPROVED",
    "reason": "Rail fracture fishplate replacement and section insulator overhaul."
  },
  {
    "block_id": "BLK00015",
    "corridor_id": "COR00161",
    "from_station": "DLI",
    "to_station": "DSA",
    "from_name": "Old Delhi",
    "to_name": "Delhi Shahdara",
    "zone": "NR",
    "start_time": "2026-09-01 11:00",
    "end_time": "2026-09-01 13:30",
    "duration_hrs": 2.5,
    "departments": [
      "Signal & Telecommunication",
      "Traction Distribution"
    ],
    "merged_count": 2,
    "priority_score": 82.0,
    "status": "APPROVED",
    "reason": "Yamuna bridge track circuit bonding and catenary jumper replacement."
  },
  {
    "block_id": "BLK00016",
    "corridor_id": "COR02885",
    "from_station": "DSA",
    "to_station": "DLI",
    "from_name": "Delhi Shahdara",
    "to_name": "Old Delhi",
    "zone": "NR",
    "start_time": "2026-09-01 00:45",
    "end_time": "2026-09-01 03:45",
    "duration_hrs": 3.0,
    "departments": [
      "Engineering",
      "Signal & Telecommunication",
      "Traction Distribution"
    ],
    "merged_count": 3,
    "priority_score": 99.1,
    "status": "APPROVED",
    "reason": "Bridge sleeper replacement, signal cabling check, and contact wire height verification."
  },
  {
    "block_id": "BLK00017",
    "corridor_id": "COR01720",
    "from_station": "MKP",
    "to_station": "PNHI",
    "from_name": "Manikpur Jn",
    "to_name": "Panhai",
    "zone": "NCR",
    "start_time": "2026-09-01 10:00",
    "end_time": "2026-09-01 12:45",
    "duration_hrs": 2.75,
    "departments": [
      "Engineering",
      "Signal & Telecommunication"
    ],
    "merged_count": 2,
    "priority_score": 87.5,
    "status": "APPROVED",
    "reason": "Curves rail wear measurement and point machine motor replacement."
  },
  {
    "block_id": "BLK00018",
    "corridor_id": "COR01721",
    "from_station": "PNHI",
    "to_station": "DBR",
    "from_name": "Panhai",
    "to_name": "Dabhaura",
    "zone": "NCR",
    "start_time": "2026-09-01 13:30",
    "end_time": "2026-09-01 16:15",
    "duration_hrs": 2.75,
    "departments": [
      "Traction Distribution",
      "Signal & Telecommunication"
    ],
    "merged_count": 2,
    "priority_score": 90.4,
    "status": "APPROVED",
    "reason": "Traction substation TSS isolator overhaul and battery bank check."
  },
  {
    "block_id": "BLK00019",
    "corridor_id": "COR00159",
    "from_station": "DBSI",
    "to_station": "DEE",
    "from_name": "Daya Basti",
    "to_name": "Sarai Rohilla",
    "zone": "NR",
    "start_time": "2026-09-01 12:15",
    "end_time": "2026-09-01 14:45",
    "duration_hrs": 2.5,
    "departments": [
      "Engineering",
      "Signal & Telecommunication"
    ],
    "merged_count": 2,
    "priority_score": 84.6,
    "status": "APPROVED",
    "reason": "Suburban diamond crossing diamond re-alignment and audio-frequency track circuit test."
  },
  {
    "block_id": "BLK00020",
    "corridor_id": "COR00930",
    "from_station": "BNCE",
    "to_station": "BNC",
    "from_name": "Bangalore East",
    "to_name": "Bangalore Cant",
    "zone": "SWR",
    "start_time": "2026-09-01 01:30",
    "end_time": "2026-09-01 04:30",
    "duration_hrs": 3.0,
    "departments": [
      "Engineering",
      "Traction Distribution"
    ],
    "merged_count": 2,
    "priority_score": 94.0,
    "status": "APPROVED",
    "reason": "Night maintenance: turnout tongue rail grinding and OHE contact wire polishing."
  },
  {
    "block_id": "BLK00021",
    "corridor_id": "COR00931",
    "from_station": "BNC",
    "to_station": "SBC",
    "from_name": "Bangalore Cant",
    "to_name": "Bangalore City",
    "zone": "SWR",
    "start_time": "2026-09-01 11:15",
    "end_time": "2026-09-01 13:45",
    "duration_hrs": 2.5,
    "departments": [
      "Engineering",
      "Signal & Telecommunication",
      "Traction Distribution"
    ],
    "merged_count": 3,
    "priority_score": 95.8,
    "status": "APPROVED",
    "reason": "Terminal approach joint block: track geometry correction and signal route indicator test."
  },
  {
    "block_id": "BLK00022",
    "corridor_id": "COR01439",
    "from_station": "LAK",
    "to_station": "BGS",
    "from_name": "Lakho",
    "to_name": "Begu Sarai",
    "zone": "ECR",
    "start_time": "2026-09-01 10:45",
    "end_time": "2026-09-01 13:45",
    "duration_hrs": 3.0,
    "departments": [
      "Engineering",
      "Signal & Telecommunication"
    ],
    "merged_count": 2,
    "priority_score": 88.0,
    "status": "APPROVED",
    "reason": "Deep screening of ballast and solar-assisted axle counter battery overhaul."
  },
  {
    "block_id": "BLK00023",
    "corridor_id": "COR04440",
    "from_station": "BGS",
    "to_station": "LAK",
    "from_name": "Begu Sarai",
    "to_name": "Lakho",
    "zone": "ECR",
    "start_time": "2026-09-01 14:15",
    "end_time": "2026-09-01 16:45",
    "duration_hrs": 2.5,
    "departments": [
      "Traction Distribution",
      "Engineering"
    ],
    "merged_count": 2,
    "priority_score": 91.5,
    "status": "APPROVED",
    "reason": "OHE neutral section testing and joint ultrasonic testing (USFD)."
  },
  {
    "block_id": "BLK00024",
    "corridor_id": "COR00142",
    "from_station": "RE",
    "to_station": "KWMD",
    "from_name": "Rewari",
    "to_name": "Kumbhawas Munda",
    "zone": "NWR",
    "start_time": "2026-09-01 02:15",
    "end_time": "2026-09-01 05:15",
    "duration_hrs": 3.0,
    "departments": [
      "Engineering",
      "Signal & Telecommunication",
      "Traction Distribution"
    ],
    "merged_count": 3,
    "priority_score": 97.2,
    "status": "APPROVED",
    "reason": "Freight corridor connection: crossing nose weld, point lock check, and OHE mast grounding."
  },
  {
    "block_id": "BLK00025",
    "corridor_id": "COR00116",
    "from_station": "AII",
    "to_station": "MD",
    "from_name": "Ajmer Jn",
    "to_name": "Madar",
    "zone": "NWR",
    "start_time": "2026-09-01 11:30",
    "end_time": "2026-09-01 14:00",
    "duration_hrs": 2.5,
    "departments": [
      "Engineering",
      "Signal & Telecommunication"
    ],
    "merged_count": 2,
    "priority_score": 83.0,
    "status": "APPROVED",
    "reason": "Weld collar ultrasonic test and signal junction box weather-proofing."
  },
  {
    "block_id": "BLK00026",
    "corridor_id": "COR00117",
    "from_station": "MD",
    "to_station": "LR",
    "from_name": "Madar",
    "to_name": "Ladpura",
    "zone": "NWR",
    "start_time": "2026-09-01 13:00",
    "end_time": "2026-09-01 15:30",
    "duration_hrs": 2.5,
    "departments": [
      "Traction Distribution",
      "Signal & Telecommunication"
    ],
    "merged_count": 2,
    "priority_score": 89.5,
    "status": "APPROVED",
    "reason": "Power feeder disconnect switch inspection and track relay pick-up test."
  },
  {
    "block_id": "BLK00027",
    "corridor_id": "COR07102",
    "from_station": "HDP",
    "to_station": "PUNE",
    "from_name": "Hadapsar",
    "to_name": "Pune Junction",
    "zone": "CR",
    "start_time": "2026-09-01 10:00",
    "end_time": "2026-09-01 13:00",
    "duration_hrs": 3.0,
    "departments": [
      "Engineering",
      "Signal & Telecommunication",
      "Traction Distribution"
    ],
    "merged_count": 3,
    "priority_score": 96.0,
    "status": "APPROVED",
    "reason": "Pune approach line block: switch expansion joint check, OHE wire renewal, and signal trial."
  },
  {
    "block_id": "BLK00028",
    "corridor_id": "COR03086",
    "from_station": "MDU",
    "to_station": "DG",
    "from_name": "Madurai",
    "to_name": "Dindigul",
    "zone": "SR",
    "start_time": "2026-09-01 12:30",
    "end_time": "2026-09-01 15:15",
    "duration_hrs": 2.75,
    "departments": [
      "Engineering",
      "Signal & Telecommunication"
    ],
    "merged_count": 2,
    "priority_score": 86.2,
    "status": "APPROVED",
    "reason": "Gauge tie bar inspection and electric point machine stroke verification."
  },
  {
    "block_id": "BLK00029",
    "corridor_id": "COR04105",
    "from_station": "R",
    "to_station": "DURG",
    "from_name": "Raipur",
    "to_name": "Durg",
    "zone": "SECR",
    "start_time": "2026-09-01 01:15",
    "end_time": "2026-09-01 04:30",
    "duration_hrs": 3.25,
    "departments": [
      "Engineering",
      "Traction Distribution"
    ],
    "merged_count": 2,
    "priority_score": 93.8,
    "status": "APPROVED",
    "reason": "Mineral trunk line: rail tamping with Plasser 09-3X and catenary height adjustment."
  },
  {
    "block_id": "BLK00030",
    "corridor_id": "COR06214",
    "from_station": "GHY",
    "to_station": "KYQ",
    "from_name": "Guwahati",
    "to_name": "Kamakhya",
    "zone": "NFR",
    "start_time": "2026-09-01 10:30",
    "end_time": "2026-09-01 13:30",
    "duration_hrs": 3.0,
    "departments": [
      "Engineering",
      "Signal & Telecommunication",
      "Traction Distribution"
    ],
    "merged_count": 3,
    "priority_score": 98.7,
    "status": "APPROVED",
    "reason": "Brahmaputra approach block: joint rail renewal, color light signal test, and 25kV OHE isolation."
  }
];

export const mockAlerts = [
  {
    "id": "ALT-101",
    "severity": "CRITICAL",
    "zone": "NR",
    "title": "Headway Spacing Violation Prevented",
    "corridor_id": "COR03213 (NDLS-GZB)",
    "message": "Loop-back solver prevented a 5-minute headway conflict between Vande Bharat 22436 and uncoordinated track possession on Down Main.",
    "time": "12 mins ago",
    "rule_code": "ERR_TRAIN_HEADWAY_VIOLATION",
    "section": "NDLS-GZB Km 18/2",
    "details": "Section Automatic Block signalling headway required: 15 mins. Uncoordinated engineering draft overlapped within 5 mins of Vande Bharat path. OR-Tools solver shifted window to 09:30 IST.",
    "action_taken": "Automated schedule constraint enforced (0 conflict)."
  },
  {
    "id": "ALT-102",
    "severity": "HIGH",
    "zone": "SWR",
    "title": "Power Zone Isolation Required",
    "corridor_id": "COR05519 (SBC-YPR)",
    "message": "Traction OHE replacement requires power shutdown on Substation TSS-SWR-04 from 14:00 to 16:00.",
    "time": "28 mins ago",
    "rule_code": "WARN_POWER_ZONE_ISOLATION",
    "section": "SBC-YPR Catenary Zone 2",
    "details": "Power isolation overlaps with 2 adjacent feeding sections. SCADA power re-routing required via TSS-SWR-02 feeder.",
    "action_taken": "SCADA isolation command queued with Traction Power Controller."
  },
  {
    "id": "ALT-103",
    "severity": "MODERATE",
    "zone": "ER",
    "title": "CAG Audit Backlog Flag: Ballast Screening",
    "corridor_id": "COR04891 (HWH-BWN)",
    "message": "Section deep ballast screening overdue > 18 months. Scheduled for night block window.",
    "time": "1 hr ago",
    "rule_code": "AUDIT_CAG_BACKLOG_FLAG",
    "section": "HWH-BWN Km 42/1-44/0",
    "details": "CAG railway safety audit report flagged overdue mechanized tamping. Maintenance backlog priority weighted +15 bonus points.",
    "action_taken": "Prioritized into upcoming 23:00-03:00 IST night possession."
  },
  {
    "id": "ALT-104",
    "severity": "CRITICAL",
    "zone": "WR",
    "title": "Track Possession Overlap Rejected",
    "corridor_id": "COR01452 (BCT-VR)",
    "message": "Simultaneous S&T point overhaul and P-Way turnout renewal requested on common track section.",
    "time": "1 hr 15 mins ago",
    "rule_code": "ERR_TRACK_OVERLAP_CONFLICT",
    "section": "BCT-VR Virar North Throat",
    "details": "Two departmental units filed independent block requests for Point 112A. System merged both operations into a single coordinated 2.5h slot.",
    "action_taken": "Merged into joint 2-in-1 block BLK00002. Saved 150 mins downtime."
  },
  {
    "id": "ALT-105",
    "severity": "HIGH",
    "zone": "CR",
    "title": "Traction Feeder Thermal Overload Warning",
    "corridor_id": "COR00479 (KNW-MTA)",
    "message": "Feeder re-routing on Substation TSS-02 exceeds 85% thermal continuous rating under diverted load.",
    "time": "2 hrs ago",
    "rule_code": "WARN_POWER_ZONE_ISOLATION",
    "section": "Khandwa-Mathela OHE Sector",
    "details": "Simultaneous power block duration requested > 3.5 hrs. Feeder temperature model flagged threshold crossing.",
    "action_taken": "Solver split window into two 1.75h possessions with 30m cooling lull."
  },
  {
    "id": "ALT-106",
    "severity": "MODERATE",
    "zone": "SR",
    "title": "Speed Restriction Expiration Overdue",
    "corridor_id": "COR02110 (MAS-AJJ)",
    "message": "Temporary Caution Order (30 km/h) active for 24 days. Track packing required to restore 110 km/h.",
    "time": "2 hrs 40 mins ago",
    "rule_code": "WARN_SPEED_RESTRICTION_EXPIRATION",
    "section": "Chennai-Arakkonam Km 34/6",
    "details": "Prolonged caution order adding +18 mins delay daily to Shatabdi express. P-Way machine packing scheduled.",
    "action_taken": "Scheduled in Block BLK00004 with Duomatic tamping machine."
  },
  {
    "id": "ALT-107",
    "severity": "HIGH",
    "zone": "NCR",
    "title": "Interlocking Route Locking Clearance",
    "corridor_id": "COR01720 (MKP-PNHI)",
    "message": "Crossover 22B cannot be clamped until Freight 9021 clears Manikpur outer signal home track circuit.",
    "time": "3 hrs ago",
    "rule_code": "WARN_STATION_INTERLOCKING_CLEARANCE",
    "section": "Manikpur Junction Station Yard",
    "details": "Signal Interlocking rule requires positive track vacancy verification before hand-crank release for S&T maintenance.",
    "action_taken": "Holding block clearance signal until freight clearance confirmation."
  },
  {
    "id": "ALT-108",
    "severity": "CRITICAL",
    "zone": "SCR",
    "title": "Dual Rail Fracture Ultrasonic Alarm",
    "corridor_id": "COR00606 (CLE-YGL)",
    "message": "USFD testing detected internal transverse flaw (IMR-40) on high-rail curve. Immediate emergency clamp required.",
    "time": "3 hrs 30 mins ago",
    "rule_code": "ERR_TRACK_OVERLAP_CONFLICT",
    "section": "Chintalpalli-Yelgur Km 112/4",
    "details": "Class A safety defect. Hard floor safety constraint: mandatory block within 24 hours regardless of traffic density.",
    "action_taken": "Emergency coordinated possession granted in 09:45 lull window."
  },
  {
    "id": "ALT-109",
    "severity": "MODERATE",
    "zone": "WCR",
    "title": "Axle Counter Sensor Tuning Drift",
    "corridor_id": "COR00480 (CAER-BRUD)",
    "message": "Dual digital axle counter DAC-04 signal amplitude attenuated by 14% after heavy rain.",
    "time": "4 hrs ago",
    "rule_code": "WARN_AXLE_COUNTER_HEALTH",
    "section": "Chhanera-Barud Section S-14",
    "details": "Preventative warning before intermittent track circuit failure occurs. S&T crew notified.",
    "action_taken": "Included in coordinated 3-in-1 Block BLK00012."
  },
  {
    "id": "ALT-110",
    "severity": "HIGH",
    "zone": "NWR",
    "title": "Machine Crew Continuous Duty Exceeded",
    "corridor_id": "COR00142 (RE-KWMD)",
    "message": "DUOMAT tamping crew roster exceeds 8-hour statutory night duty period under Railway Safety Act.",
    "time": "5 hrs ago",
    "rule_code": "ERR_CREW_REST_HOURS_VIOLATION",
    "section": "Rewari Siding Depot",
    "details": "Mandatory 12-hour continuous rest period violated if block starts at 01:00. Solver adjusted start to 02:15 IST.",
    "action_taken": "Shifted window by 75 mins to align with relief machine operator crew."
  },
  {
    "id": "ALT-111",
    "severity": "CRITICAL",
    "zone": "SECR",
    "title": "Freight Heavy Axle-Load Track Degradation",
    "corridor_id": "COR04105 (R-DURG)",
    "message": "25-tonne axle load iron ore freight rake caused rail joint weld depression beyond 3mm tolerance.",
    "time": "6 hrs ago",
    "rule_code": "ERR_TRACK_OVERLAP_CONFLICT",
    "section": "Raipur-Durg Mineral Trunk",
    "details": "Track Inspection Car (TRC) run flagged acceleration peak > 0.35g. Weld grinding and ballast packing required.",
    "action_taken": "Assigned highest priority score 93.8 in Block BLK00029."
  },
  {
    "id": "ALT-112",
    "severity": "MODERATE",
    "zone": "NFR",
    "title": "Monsoon Patrolling Inspection Alert",
    "corridor_id": "COR06214 (GHY-KYQ)",
    "message": "Waterlogging sensor near Brahmaputra bridge pier 6 approaching warning watermark level 44.2m.",
    "time": "7 hrs ago",
    "rule_code": "WARN_SPEED_RESTRICTION_EXPIRATION",
    "section": "Guwahati-Kamakhya Bridge Approach",
    "details": "Speed caution order reduced to 20 km/h pending underwater pier inspection. Integrated with TRD cable check.",
    "action_taken": "Included in midday joint inspection block BLK00030."
  }
];

export const mockDecisionTrace = [
  {
    "corridor_id": "COR03213 (NDLS-GZB)",
    "zone": "NR",
    "original_requests": 3,
    "scheduled_blocks": 1,
    "downtime_saved": "180 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 18,
      "corridor_traffic_density": 48,
      "ml_failure_prob": "91.9%",
      "safety_bonus": "+15",
      "final_priority_score": 100.0
    },
    "trace_explanation": "Model predicted 91.9% failure probability within 90 days. Joint 3.0h block scheduled during timetable lull, saving 3 separate traffic possessions."
  },
  {
    "corridor_id": "COR01452 (BCT-VR)",
    "zone": "WR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "150 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 14,
      "corridor_traffic_density": 52,
      "ml_failure_prob": "77.1%",
      "safety_bonus": "+15",
      "final_priority_score": 92.1
    },
    "trace_explanation": "Model predicted 77.1% failure probability within 90 days. Joint 2.5h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR04891 (HWH-BWN)",
    "zone": "ER",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "240 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 22,
      "corridor_traffic_density": 41,
      "ml_failure_prob": "68.6%",
      "safety_bonus": "+15",
      "final_priority_score": 83.6
    },
    "trace_explanation": "Model predicted 68.6% failure probability within 90 days. Joint 4.0h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR02110 (MAS-AJJ)",
    "zone": "SR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "150 minutes",
    "ml_factors": {
      "severity_class": "B (Moderate)",
      "days_overdue": 12,
      "corridor_traffic_density": 39,
      "ml_failure_prob": "68.4%",
      "safety_bonus": "+5",
      "final_priority_score": 88.4
    },
    "trace_explanation": "Model predicted 68.4% failure probability within 90 days. Joint 2.5h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR05519 (SBC-YPR)",
    "zone": "SWR",
    "original_requests": 3,
    "scheduled_blocks": 1,
    "downtime_saved": "180 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 19,
      "corridor_traffic_density": 35,
      "ml_failure_prob": "81.5%",
      "safety_bonus": "+15",
      "final_priority_score": 96.5
    },
    "trace_explanation": "Model predicted 81.5% failure probability within 90 days. Joint 3.0h block scheduled during timetable lull, saving 3 separate traffic possessions."
  },
  {
    "corridor_id": "COR02830 (BL-DGI)",
    "zone": "WR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "210 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 16,
      "corridor_traffic_density": 95,
      "ml_failure_prob": "74.2%",
      "safety_bonus": "+15",
      "final_priority_score": 89.2
    },
    "trace_explanation": "Model predicted 74.2% failure probability within 90 days. Joint 3.5h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR02832 (JRS-BIM)",
    "zone": "WR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "150 minutes",
    "ml_factors": {
      "severity_class": "B (Moderate)",
      "days_overdue": 9,
      "corridor_traffic_density": 95,
      "ml_failure_prob": "54.5%",
      "safety_bonus": "+5",
      "final_priority_score": 79.5
    },
    "trace_explanation": "Model predicted 54.5% failure probability within 90 days. Joint 2.5h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR00479 (KNW-MTA)",
    "zone": "CR",
    "original_requests": 3,
    "scheduled_blocks": 1,
    "downtime_saved": "180 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 21,
      "corridor_traffic_density": 70,
      "ml_failure_prob": "82.8%",
      "safety_bonus": "+15",
      "final_priority_score": 97.8
    },
    "trace_explanation": "Model predicted 82.8% failure probability within 90 days. Joint 3.0h block scheduled during timetable lull, saving 3 separate traffic possessions."
  },
  {
    "corridor_id": "COR02148 (MPKT-MCPT)",
    "zone": "SR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "210 minutes",
    "ml_factors": {
      "severity_class": "B (Moderate)",
      "days_overdue": 15,
      "corridor_traffic_density": 70,
      "ml_failure_prob": "60.0%",
      "safety_bonus": "+5",
      "final_priority_score": 85.0
    },
    "trace_explanation": "Model predicted 60.0% failure probability within 90 days. Joint 3.5h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR00285 (MTA-KNW)",
    "zone": "WCR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "150 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 17,
      "corridor_traffic_density": 69,
      "ml_failure_prob": "76.0%",
      "safety_bonus": "+15",
      "final_priority_score": 91.0
    },
    "trace_explanation": "Model predicted 76.0% failure probability within 90 days. Joint 2.5h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR00468 (DSK-SAV)",
    "zone": "CR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "165 minutes",
    "ml_factors": {
      "severity_class": "B (Moderate)",
      "days_overdue": 8,
      "corridor_traffic_density": 69,
      "ml_failure_prob": "52.2%",
      "safety_bonus": "+5",
      "final_priority_score": 77.2
    },
    "trace_explanation": "Model predicted 52.2% failure probability within 90 days. Joint 2.75h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR00480 (CAER-BRUD)",
    "zone": "WCR",
    "original_requests": 3,
    "scheduled_blocks": 1,
    "downtime_saved": "210 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 25,
      "corridor_traffic_density": 69,
      "ml_failure_prob": "83.4%",
      "safety_bonus": "+15",
      "final_priority_score": 98.4
    },
    "trace_explanation": "Model predicted 83.4% failure probability within 90 days. Joint 3.5h block scheduled during timetable lull, saving 3 separate traffic possessions."
  },
  {
    "corridor_id": "COR00606 (CLE-YGL)",
    "zone": "SCR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "180 minutes",
    "ml_factors": {
      "severity_class": "B (Moderate)",
      "days_overdue": 14,
      "corridor_traffic_density": 67,
      "ml_failure_prob": "61.8%",
      "safety_bonus": "+5",
      "final_priority_score": 86.8
    },
    "trace_explanation": "Model predicted 61.8% failure probability within 90 days. Joint 3.0h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR00607 (YGL-NKD)",
    "zone": "SCR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "150 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 20,
      "corridor_traffic_density": 67,
      "ml_failure_prob": "78.5%",
      "safety_bonus": "+15",
      "final_priority_score": 93.5
    },
    "trace_explanation": "Model predicted 78.5% failure probability within 90 days. Joint 2.5h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR00161 (DLI-DSA)",
    "zone": "NR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "150 minutes",
    "ml_factors": {
      "severity_class": "B (Moderate)",
      "days_overdue": 11,
      "corridor_traffic_density": 62,
      "ml_failure_prob": "57.0%",
      "safety_bonus": "+5",
      "final_priority_score": 82.0
    },
    "trace_explanation": "Model predicted 57.0% failure probability within 90 days. Joint 2.5h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR02885 (DSA-DLI)",
    "zone": "NR",
    "original_requests": 3,
    "scheduled_blocks": 1,
    "downtime_saved": "180 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 28,
      "corridor_traffic_density": 61,
      "ml_failure_prob": "84.1%",
      "safety_bonus": "+15",
      "final_priority_score": 99.1
    },
    "trace_explanation": "Model predicted 84.1% failure probability within 90 days. Joint 3.0h block scheduled during timetable lull, saving 3 separate traffic possessions."
  },
  {
    "corridor_id": "COR01720 (MKP-PNHI)",
    "zone": "NCR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "165 minutes",
    "ml_factors": {
      "severity_class": "B (Moderate)",
      "days_overdue": 13,
      "corridor_traffic_density": 54,
      "ml_failure_prob": "62.5%",
      "safety_bonus": "+5",
      "final_priority_score": 87.5
    },
    "trace_explanation": "Model predicted 62.5% failure probability within 90 days. Joint 2.75h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR01721 (PNHI-DBR)",
    "zone": "NCR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "165 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 16,
      "corridor_traffic_density": 54,
      "ml_failure_prob": "75.4%",
      "safety_bonus": "+15",
      "final_priority_score": 90.4
    },
    "trace_explanation": "Model predicted 75.4% failure probability within 90 days. Joint 2.75h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR00159 (DBSI-DEE)",
    "zone": "NR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "150 minutes",
    "ml_factors": {
      "severity_class": "B (Moderate)",
      "days_overdue": 10,
      "corridor_traffic_density": 53,
      "ml_failure_prob": "59.6%",
      "safety_bonus": "+5",
      "final_priority_score": 84.6
    },
    "trace_explanation": "Model predicted 59.6% failure probability within 90 days. Joint 2.5h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR00930 (BNCE-BNC)",
    "zone": "SWR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "180 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 19,
      "corridor_traffic_density": 41,
      "ml_failure_prob": "79.0%",
      "safety_bonus": "+15",
      "final_priority_score": 94.0
    },
    "trace_explanation": "Model predicted 79.0% failure probability within 90 days. Joint 3.0h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR00931 (BNC-SBC)",
    "zone": "SWR",
    "original_requests": 3,
    "scheduled_blocks": 1,
    "downtime_saved": "150 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 22,
      "corridor_traffic_density": 41,
      "ml_failure_prob": "80.8%",
      "safety_bonus": "+15",
      "final_priority_score": 95.8
    },
    "trace_explanation": "Model predicted 80.8% failure probability within 90 days. Joint 2.5h block scheduled during timetable lull, saving 3 separate traffic possessions."
  },
  {
    "corridor_id": "COR01439 (LAK-BGS)",
    "zone": "ECR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "180 minutes",
    "ml_factors": {
      "severity_class": "B (Moderate)",
      "days_overdue": 15,
      "corridor_traffic_density": 40,
      "ml_failure_prob": "63.0%",
      "safety_bonus": "+5",
      "final_priority_score": 88.0
    },
    "trace_explanation": "Model predicted 63.0% failure probability within 90 days. Joint 3.0h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR04440 (BGS-LAK)",
    "zone": "ECR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "150 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 18,
      "corridor_traffic_density": 40,
      "ml_failure_prob": "76.5%",
      "safety_bonus": "+15",
      "final_priority_score": 91.5
    },
    "trace_explanation": "Model predicted 76.5% failure probability within 90 days. Joint 2.5h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR00142 (RE-KWMD)",
    "zone": "NWR",
    "original_requests": 3,
    "scheduled_blocks": 1,
    "downtime_saved": "180 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 24,
      "corridor_traffic_density": 36,
      "ml_failure_prob": "82.2%",
      "safety_bonus": "+15",
      "final_priority_score": 97.2
    },
    "trace_explanation": "Model predicted 82.2% failure probability within 90 days. Joint 3.0h block scheduled during timetable lull, saving 3 separate traffic possessions."
  },
  {
    "corridor_id": "COR00116 (AII-MD)",
    "zone": "NWR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "150 minutes",
    "ml_factors": {
      "severity_class": "B (Moderate)",
      "days_overdue": 11,
      "corridor_traffic_density": 33,
      "ml_failure_prob": "58.0%",
      "safety_bonus": "+5",
      "final_priority_score": 83.0
    },
    "trace_explanation": "Model predicted 58.0% failure probability within 90 days. Joint 2.5h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR00117 (MD-LR)",
    "zone": "NWR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "150 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 15,
      "corridor_traffic_density": 33,
      "ml_failure_prob": "74.5%",
      "safety_bonus": "+15",
      "final_priority_score": 89.5
    },
    "trace_explanation": "Model predicted 74.5% failure probability within 90 days. Joint 2.5h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR07102 (HDP-PUNE)",
    "zone": "CR",
    "original_requests": 3,
    "scheduled_blocks": 1,
    "downtime_saved": "180 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 20,
      "corridor_traffic_density": 44,
      "ml_failure_prob": "81.0%",
      "safety_bonus": "+15",
      "final_priority_score": 96.0
    },
    "trace_explanation": "Model predicted 81.0% failure probability within 90 days. Joint 3.0h block scheduled during timetable lull, saving 3 separate traffic possessions."
  },
  {
    "corridor_id": "COR03086 (MDU-DG)",
    "zone": "SR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "165 minutes",
    "ml_factors": {
      "severity_class": "B (Moderate)",
      "days_overdue": 13,
      "corridor_traffic_density": 38,
      "ml_failure_prob": "61.2%",
      "safety_bonus": "+5",
      "final_priority_score": 86.2
    },
    "trace_explanation": "Model predicted 61.2% failure probability within 90 days. Joint 2.75h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR04105 (R-DURG)",
    "zone": "SECR",
    "original_requests": 2,
    "scheduled_blocks": 1,
    "downtime_saved": "195 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 21,
      "corridor_traffic_density": 58,
      "ml_failure_prob": "78.8%",
      "safety_bonus": "+15",
      "final_priority_score": 93.8
    },
    "trace_explanation": "Model predicted 78.8% failure probability within 90 days. Joint 3.25h block scheduled during timetable lull, saving 2 separate traffic possessions."
  },
  {
    "corridor_id": "COR06214 (GHY-KYQ)",
    "zone": "NFR",
    "original_requests": 3,
    "scheduled_blocks": 1,
    "downtime_saved": "180 minutes",
    "ml_factors": {
      "severity_class": "A (Critical)",
      "days_overdue": 26,
      "corridor_traffic_density": 32,
      "ml_failure_prob": "83.7%",
      "safety_bonus": "+15",
      "final_priority_score": 98.7
    },
    "trace_explanation": "Model predicted 83.7% failure probability within 90 days. Joint 3.0h block scheduled during timetable lull, saving 3 separate traffic possessions."
  }
];
