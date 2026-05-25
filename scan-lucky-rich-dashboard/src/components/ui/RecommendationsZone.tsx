'use client'

const RECOMMENDATIONS = {
  now: {
    title: '🔴 ทำเลย (ก่อน cutover)',
    items: [
      {
        what: '1. Fix bug: tickets_per_scan',
        why:  'หลาย SKU ตั้ง 5–11 tickets/scan แต่ระบบให้ 1 → ลูกค้าได้สิทธิ์น้อยกว่าที่ promote เสี่ยงร้องเรียน',
        imp:  '→ Restore 4–10× lift ของ ticket pool · prevent PR risk',
      },
      {
        what: '2. Persistent log + alerting',
        why:  'Outage 19 พ.ค. 6h11m แต่ log ของช่วงล่ม หายไป (container restart) → root cause ไม่ได้',
        imp:  '→ ตั้ง external log (Loki/CloudWatch) + uptime alert (PagerDuty/LINE Notify)',
      },
      {
        what: '3. Investigate สระแก้ว anomaly',
        why:  '19 พ.ค. 2 user ติด top 10 จากจังหวัดเดียว (sales/multi-account suspect)',
        imp:  '→ ถ้า fraud จริง → ban + tighten rate-limit /province',
      },
    ],
  },
  month: {
    title: '🟡 เดือนนี้',
    items: [
      {
        what: '4. Win-back single-scanners',
        why:  '~49% สแกนแค่ครั้งเดียวทุกวัน → activate ต่อต่ำ',
        imp:  '→ LINE OA welcome series + 2nd-scan bonus · expect +15–25% repeat',
      },
      {
        what: '5. Push long-tail SKU',
        why:  '15–21 SKU = zero scan ทุกวัน ส่วนใหญ่ขนาดใหญ่ → กระจายไม่ถึงหน้าร้าน',
        imp:  '→ Audit shelf placement + QR visibility · expect +5–8% ticket pool',
      },
      {
        what: '6. QR fraud detection',
        why:  'Dup-other rate เร่งขึ้น 1.0 → 4.9% (16→19) → QR ก๊อป / 3rd-party',
        imp:  '→ Unique QR per pack + geo-velocity check · target dup-other <3%',
      },
    ],
  },
  quarter: {
    title: '🟢 ไตรมาสนี้',
    items: [
      {
        what: '7. Campaign Cohort vs organic',
        why:  'ยังไม่มี data ตามคนที่ join แคมเปญ vs ไม่ join · ต้องดู LTV/retention 90 วัน',
        imp:  '→ Setup cohort tracking ใน Saversure · measure lift จริง',
      },
      {
        what: '8. Cross-sell หลัง L3-8G',
        why:  'L3-8G ดีดีครีมแตงโม 30%+ ของสแกน · คนซื้อแล้วซื้ออะไรต่อ?',
        imp:  '→ Push เซรั่ม/กันแดด/มอยส์ · AOV +฿80–150',
      },
      {
        what: '9. Day-of-week strategy',
        why:  'Weekend +35% vs weekday · peak hour 19-22 ทุกวัน',
        imp:  '→ Peak-time targeted broadcast ลด CPF · expect +10–15% weekday lift',
      },
    ],
  },
}

export default function RecommendationsZone() {
  const cols: ('now' | 'month' | 'quarter')[] = ['now', 'month', 'quarter']
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {cols.map(k => {
        const data = RECOMMENDATIONS[k]
        return (
          <div key={k} className={`reco-col ${k}`}>
            <div className="reco-head">{data.title}</div>
            {data.items.map((it, i) => (
              <div key={i} className="reco-item">
                <div className="what">{it.what}</div>
                <div className="why" dangerouslySetInnerHTML={{ __html: it.why }} />
                <div className="imp">{it.imp}</div>
              </div>
            ))}
          </div>
        )
      })}
    </div>
  )
}
