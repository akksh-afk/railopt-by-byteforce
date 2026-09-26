import React, { useState } from 'react';
import { Layers, Clock, ShieldCheck, Zap, ChevronDown, ArrowRight } from 'lucide-react';

// Numbers in the Indian style (e.g. 1,25,000), which Indian staff read at a glance.
const inr = (n) => Number(n).toLocaleString('en-IN');

export default function SummaryCards({ summary, activeZone = 'ALL', totalCorridorsCount = 8622, onNavigate }) {
  const [open, setOpen] = useState(null);
  if (!summary) return null;

  const isZonal = activeZone !== 'ALL';
  const zoneName = isZonal ? activeZone : 'all zones';
  const corridorCount = isZonal ? totalCorridorsCount : summary.totalCorridors;
  const delaySaved = isZonal ? Math.round(summary.downtimeSavedMin * (corridorCount / 8622)) : summary.downtimeSavedMin;
  const delayHours = (delaySaved / 60).toFixed(1);
  const caughtPer100 = Math.floor(summary.safetyRecallPct);

  // Each card: short label in English + Hindi, the number, one plain line, and a
  // "tap for details" explanation with a button to the page that shows more.
  const cards = [
    {
      id: 'merge',
      Icon: Layers, color: 'var(--accent)',
      title: 'Requests combined', hi: 'संयुक्त ब्लॉक',
      value: summary.mergeEfficiency,
      line: '3 separate requests → 1 shared closure',
      detail: `On average, ${summary.mergeEfficiency.split(':')[0].trim()} separate closure requests from the Track, Signal and Wire teams are combined into 1 shared closure. Fewer closures means trains stop less often.`,
      detailHi: `ट्रैक, सिग्नल और बिजली टीमों के औसतन ${summary.mergeEfficiency.split(':')[0].trim()} अलग अनुरोध 1 साझा ब्लॉक में जोड़े जाते हैं। कम ब्लॉक, यानी ट्रेनें कम रुकेंगी।`,
      go: 'calendar', goLabel: 'See the block plan', goHi: 'ब्लॉक योजना देखें',
    },
    {
      id: 'delay',
      Icon: Clock, color: 'var(--cyan)',
      title: `Delay saved${isZonal ? ` (${activeZone})` : ''}`, hi: 'बचाई गई देरी',
      value: <>{inr(delaySaved)} <small>min</small></>,
      line: `≈ ${delayHours} hours of train time saved`,
      detail: `Trains in ${zoneName} are delayed ${inr(delaySaved)} minutes less (about ${delayHours} hours), because closures are combined and placed in quiet gaps between trains.`,
      detailHi: `${isZonal ? activeZone : 'सभी ज़ोन'} में ट्रेनों की ${inr(delaySaved)} मिनट (लगभग ${delayHours} घंटे) देरी बची, क्योंकि ब्लॉक मिलाकर ट्रेनों के बीच के खाली समय में रखे गए।`,
      go: 'live', goLabel: 'See live trains', goHi: 'लाइव ट्रेनें देखें',
    },
    {
      id: 'safety',
      Icon: ShieldCheck, color: 'var(--emerald)',
      title: 'Defects caught', hi: 'पकड़ी गई खराबियाँ',
      value: `${summary.safetyRecallPct}%`,
      line: `${caughtPer100} of every 100 real defects`,
      detail: `The priority model catches ${caughtPer100} of every 100 defects that would really fail. For the few it misses, Class A defects always get extra priority, and every plan must pass the safety rule check before it is approved.`,
      detailHi: `प्राथमिकता मॉडल हर 100 असली खराबियों में से ${caughtPer100} पकड़ता है। जो छूट जाएँ उनके लिए क्लास A खराबियों को हमेशा अतिरिक्त प्राथमिकता मिलती है, और हर योजना को मंज़ूरी से पहले सुरक्षा नियम जाँच पास करनी होती है।`,
      go: 'alerts', goLabel: 'See safety alerts', goHi: 'सुरक्षा अलर्ट देखें',
    },
    {
      id: 'corridors',
      Icon: Zap, color: 'var(--amber)',
      title: isZonal ? `${activeZone} track sections` : 'Track sections', hi: 'रेल खंड',
      value: inr(corridorCount),
      line: isZonal ? `Watched in ${activeZone} zone` : 'All 17 zones of Indian Railways',
      detail: `RailOpt watches ${inr(corridorCount)} track sections (station to station) in ${zoneName}, taken from real Indian Railways timetables.`,
      detailHi: `RailOpt ${isZonal ? activeZone : 'सभी 17 ज़ोन'} के ${inr(corridorCount)} रेल खंडों (स्टेशन से स्टेशन) पर नज़र रखता है। ये असली भारतीय रेल समय-सारणी से लिए गए हैं।`,
      go: 'live', goLabel: 'See all sections', goHi: 'सभी खंड देखें',
    },
  ];
  const current = cards.find((c) => c.id === open);

  return (
    <section className="summary" aria-label="Summary">
      <div className="summary-grid">
        {cards.map(({ id, Icon, color, title, hi, value, line }) => (
          <button
            key={id}
            type="button"
            className="metric-card"
            aria-expanded={open === id}
            aria-controls="metric-detail"
            onClick={() => setOpen(open === id ? null : id)}
          >
            <span className="metric-title">
              <Icon size={13} color={color} aria-hidden="true" />
              <span>{title}</span>
              <span className="metric-hi" lang="hi">· {hi}</span>
              <ChevronDown size={13} className="metric-chevron" aria-hidden="true" />
            </span>
            <span className="metric-value" style={{ color }}>{value}</span>
            <span className="metric-footer">{line}</span>
          </button>
        ))}
      </div>

      {current && (
        <div className="metric-detail" id="metric-detail" role="region" aria-label={current.title}>
          <div>
            <p>{current.detail}</p>
            <p lang="hi" className="metric-detail-hi">{current.detailHi}</p>
          </div>
          {onNavigate && (
            <button type="button" className="btn btn-primary metric-go" onClick={() => onNavigate(current.go)}>
              <span>{current.goLabel}<small lang="hi">{current.goHi}</small></span>
              <ArrowRight size={16} aria-hidden="true" />
            </button>
          )}
        </div>
      )}
      <p className="metric-hint">Tap a card for details · <span lang="hi">विवरण के लिए कार्ड दबाएँ</span></p>
    </section>
  );
}
