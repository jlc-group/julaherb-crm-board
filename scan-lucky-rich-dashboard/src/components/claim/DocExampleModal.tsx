'use client'

// ภาพตัวอย่างเอกสารสำหรับเตรียมไปรับรางวัลหน้างาน — วาดเป็น SVG เพื่อเลี่ยงใช้ภาพบัตรจริง (PII)
export type DocType = 'idCard' | 'poa' | 'proxyId'

const META: Record<DocType, { title: string; checklist: string[]; note?: string }> = {
  idCard: {
    title: 'ตัวอย่างการเตรียม: สำเนาบัตรประชาชน',
    checklist: [
      'เตรียมสำเนาบัตรให้ชัด เห็นข้อมูลครบ',
      'เขียนข้อความ "สำเนาถูกต้อง" ทับลงบนสำเนา',
      'เซ็นชื่อ-นามสกุลจริงกำกับใต้ข้อความ',
      'ชื่อในบัตรต้องตรงกับชื่อผู้โชคดี',
    ],
    note: 'อย่าเซ็นทับรูปหน้าหรือเลขบัตรจนอ่านไม่ออก',
  },
  poa: {
    title: 'ตัวอย่างการเตรียม: หนังสือมอบอำนาจ',
    checklist: [
      'ระบุชื่อ "ผู้มอบอำนาจ" (ผู้โชคดี) และ "ผู้รับมอบอำนาจ"',
      'ระบุเรื่อง: ขอมอบอำนาจให้รับรางวัลแทน',
      'ผู้มอบอำนาจ + ผู้รับมอบอำนาจ เซ็นชื่อครบ',
      'มีพยานเซ็นอย่างน้อย 1 คน',
    ],
    note: 'นำมาพร้อมสำเนาบัตรประชาชนของผู้รับมอบอำนาจด้วย',
  },
  proxyId: {
    title: 'ตัวอย่างการเตรียม: สำเนาบัตรผู้รับมอบอำนาจ',
    checklist: [
      'ใช้สำเนาบัตรประชาชนของ "คนที่มารับแทน"',
      'เขียน "สำเนาถูกต้อง" + เซ็นชื่อกำกับ',
      'ชื่อต้องตรงกับผู้รับมอบอำนาจในหนังสือมอบอำนาจ',
    ],
  },
}

function IdCardSvg() {
  return (
    <svg viewBox="0 0 340 200" className="w-full h-auto" role="img" aria-label="ตัวอย่างสำเนาบัตรประชาชน">
      <rect x="12" y="12" width="316" height="176" rx="14" fill="#eff6ff" stroke="#bcd2ef" strokeWidth="2" />
      <text x="28" y="36" fontSize="11" fill="#1d4ed8" fontWeight="700">บัตรประจำตัวประชาชน</text>
      <line x1="28" y1="44" x2="312" y2="44" stroke="#cdddf3" strokeWidth="1.5" />
      {/* photo */}
      <rect x="28" y="56" width="62" height="74" rx="6" fill="#dbe7f6" stroke="#bcd2ef" />
      <circle cx="59" cy="80" r="12" fill="#b9cbe6" />
      <path d="M42 122 q17 -22 34 0 z" fill="#b9cbe6" />
      {/* info bars */}
      <rect x="104" y="58" width="170" height="9" rx="4" fill="#c9d6e8" />
      <rect x="104" y="76" width="200" height="9" rx="4" fill="#dbe4f0" />
      <rect x="104" y="94" width="150" height="9" rx="4" fill="#dbe4f0" />
      <rect x="104" y="112" width="180" height="9" rx="4" fill="#dbe4f0" />
      {/* certified — the important part */}
      <rect x="100" y="138" width="180" height="40" rx="8" fill="#fff7f7" stroke="#f87171" strokeWidth="1.5" strokeDasharray="5 3" />
      <g transform="rotate(-7 150 158)">
        <text x="112" y="160" fontSize="15" fill="#dc2626" fontWeight="800" fontFamily="'Mali','Noto Sans Thai',sans-serif">สำเนาถูกต้อง</text>
        <path d="M120 168 q12 -8 24 0 t24 0" stroke="#dc2626" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      <text x="104" y="194" fontSize="9.5" fill="#b91c1c" fontWeight="700">↑ เขียนข้อความนี้ + เซ็นชื่อจริงกำกับ</text>
    </svg>
  )
}

function PoaSvg() {
  return (
    <svg viewBox="0 0 340 220" className="w-full h-auto" role="img" aria-label="ตัวอย่างหนังสือมอบอำนาจ">
      <rect x="14" y="10" width="312" height="200" rx="10" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
      <text x="170" y="38" fontSize="15" fill="#14532d" fontWeight="800" textAnchor="middle">หนังสือมอบอำนาจ</text>
      <line x1="132" y1="46" x2="208" y2="46" stroke="#16a34a" strokeWidth="2" />
      {/* rows */}
      <text x="30" y="74" fontSize="11" fill="#334155" fontWeight="600">ผู้มอบอำนาจ</text>
      <line x1="108" y1="76" x2="248" y2="76" stroke="#cbd5e1" strokeDasharray="3 3" />
      <text x="254" y="74" fontSize="9.5" fill="#94a3b8">(ผู้โชคดี)</text>
      <text x="30" y="100" fontSize="11" fill="#334155" fontWeight="600">ผู้รับมอบอำนาจ</text>
      <line x1="118" y1="102" x2="256" y2="102" stroke="#cbd5e1" strokeDasharray="3 3" />
      <text x="262" y="100" fontSize="9.5" fill="#94a3b8">(คนรับแทน)</text>
      <text x="30" y="126" fontSize="11" fill="#334155" fontWeight="600">เรื่อง</text>
      <text x="68" y="126" fontSize="10.5" fill="#64748b">ขอมอบอำนาจให้รับรางวัลแทน</text>
      {/* signature area */}
      <rect x="22" y="146" width="296" height="56" rx="8" fill="#f0fdf4" stroke="#86efac" strokeWidth="1.5" strokeDasharray="5 3" />
      <path d="M52 176 q10 -9 20 0 t20 0" stroke="#15803d" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <line x1="40" y1="184" x2="118" y2="184" stroke="#cbd5e1" />
      <text x="48" y="196" fontSize="9.5" fill="#334155">ลงชื่อ ผู้มอบอำนาจ</text>
      <path d="M212 176 q10 -9 20 0 t20 0" stroke="#15803d" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <line x1="200" y1="184" x2="300" y2="184" stroke="#cbd5e1" />
      <text x="204" y="196" fontSize="9.5" fill="#334155">ลงชื่อ ผู้รับมอบอำนาจ</text>
    </svg>
  )
}

export default function DocExampleModal({ doc, onClose }: { doc: DocType | null; onClose: () => void }) {
  if (!doc) return null
  const m = META[doc]
  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl max-h-[88vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white/95 backdrop-blur px-5 py-3.5 border-b border-[var(--border)] flex items-center justify-between">
          <div className="font-bold text-[15px] text-[#14532d]">{m.title}</div>
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-gray-100 text-lg text-gray-500 leading-none">✕</button>
        </div>
        <div className="p-5">
          <div className="rounded-xl bg-[#f8fafc] border border-[var(--border)] p-3">
            {doc === 'poa' ? <PoaSvg /> : <IdCardSvg />}
          </div>
          <div className="mt-4 space-y-2">
            {m.checklist.map((c, i) => (
              <div key={i} className="flex gap-2 text-[13px] text-[var(--text)]">
                <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-[#dcfce7] text-[#15803d] text-[11px] font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                <span className="leading-relaxed">{c}</span>
              </div>
            ))}
          </div>
          {m.note && (
            <div className="mt-3 text-[12px] text-[#92400e] bg-[#fffbeb] border border-[#fde68a] rounded-lg px-3 py-2 flex gap-1.5">
              <span>⚠️</span>
              <span>{m.note}</span>
            </div>
          )}
          <button
            onClick={onClose}
            className="w-full mt-4 py-2.5 rounded-xl font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}
          >
            เข้าใจแล้ว
          </button>
        </div>
      </div>
    </div>
  )
}
