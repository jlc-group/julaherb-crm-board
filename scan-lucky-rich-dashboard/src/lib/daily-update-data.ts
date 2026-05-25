// Daily Update data — extracted from "Daily update/" folder
// Days 16, 17, 18, 19 (May 2026)
// Includes: KPI, outage, time-of-day, retention, support, heavy users, provinces

export interface OutageInfo {
  start: string  // ISO datetime
  end:   string
  durationHours: number
  cause: string
}

export interface DailyEntry {
  date:        string     // YYYY-MM-DD
  weekday:     string

  // ── 📱 สถิติสแกน (ครั้ง / events) ──
  success:     number     // สแกนสำเร็จ ⭐ — ใช้นับสิทธิ์
  tickets:     number     // สิทธิ์ที่ DB บันทึก (ปัจจุบัน DB ให้ 1:1 — bug)
  expectedTickets?: number // ⭐ สิทธิ์ตามสเปก = Σ(scans × rightsPerScan) จาก Excel master
  dupSelf:     number     // สแกนซ้ำตัวเอง (ไม่นับ)
  dupOther:    number     // สแกนซ้ำคนอื่น — QR ถูกใช้แล้ว (ไม่นับ)
  notFound:    number     // ไม่พบในระบบ — QR เก่า/ผิด/ก๊อป (ไม่นับ)
  scanFailedOther?: number // ไม่สำเร็จ (Newly) อื่นๆ — ปกติ = 0
  scanByNew?:  number     // สแกนโดยสมาชิกใหม่ (ครั้ง)
  scanByOld?:  number     // สแกนโดยสมาชิกเก่า (ครั้ง)
  successRate: number     // % = สำเร็จ ÷ ทั้งหมด

  // ── 👥 สมาชิก (คน / people) ──
  memberNew?:   number    // สมาชิกใหม่วันนี้ — สมัครใหม่ (คน)
  memberOld?:   number    // สมาชิกเก่ามาวันนี้ (คน)
  memberTotal?: number    // สมาชิกสะสมทั้งหมดในระบบ (cumulative)

  // ── อื่นๆ ──
  uniqueUsers: number     // จำนวนคนไม่ซ้ำที่สแกนวันนั้น
  newSignup:   number     // (legacy) สมัครใหม่ — กำลัง migrate → memberNew
  newScanned:  number     // (legacy) สมัครใหม่และสแกนเลย
  oldScanned:  number     // (legacy) สมาชิกเก่าที่มาสแกน
  firstTimePct: number    // % ที่ scan ครั้งแรก ever
  returningPct: number    // % ที่เคย scan มาก่อน
  // Engagement
  avgScansPerUser:    number
  medianScansPerUser: number
  maxScansPerUser:    number
  // Distribution buckets
  engagementBuckets: { label: string; users: number; pct: number }[]
  // Peak hours (top 3 hour:scan)
  peakHours: { rank: 1 | 2 | 3; hour: string; scans: number }[]
  // Sign-up funnel
  signedNotScanned: number  // สมัครวันนั้นแต่ยังไม่ scan
  // Per-day baseline vs prev months (same date)
  baselineMar: { scans: number; users: number; weekday: string; note?: string }
  baselineApr: { scans: number; users: number; weekday: string; note?: string }
  timeOfDay:   { range: string; scans: number; pct: number }[]
  topProvinces:{ rank: number; name: string; scans: number; users: number }[]
  topSku:      { rank: number; sku: string; name: string; tickets: number; perScan: number; pct: number }[]
  heavyUsers:  { rank: number; userHash: string; province: string; scans: number; skuDiversity: number; age?: number }[]
  supportCases:{ topic: string; count: number }[]
  totalSupport: number
  outage?:     OutageInfo
}

// ─── DAY 16 พ.ค. (เสาร์) — ค่าจริงจาก dashboard widget ───
const DAY_16: DailyEntry = {
  date: '2026-05-16', weekday: 'เสาร์',
  success: 7163, tickets: 7163, expectedTickets: 9871, uniqueUsers: 2624,
  dupSelf: 660, dupOther: 78, notFound: 181, scanFailedOther: 0,
  scanByNew: 1120, scanByOld: 6962,
  memberNew: 384, memberOld: 2305, memberTotal: 833440,
  newSignup: 384, newScanned: 367, oldScanned: 2257,
  successRate: 88.6,
  firstTimePct: 14.3, returningPct: 85.7,
  avgScansPerUser: 2.73, medianScansPerUser: 1, maxScansPerUser: 54,
  engagementBuckets: [
    { label: '1 scan',     users: 1312, pct: 50.0 },
    { label: '2-5 scans',  users: 1050, pct: 40.0 },
    { label: '6-10 scans', users:  184, pct:  7.0 },
    { label: '10+ scans',  users:   78, pct:  3.0 },
  ],
  peakHours: [
    { rank: 1, hour: '21:00', scans: 603 },
    { rank: 2, hour: '20:00', scans: 516 },
    { rank: 3, hour: '13:00', scans: 480 },
  ],
  signedNotScanned: 73,
  baselineMar: { scans: 6852, users: 2553, weekday: 'จันทร์', note: 'baseline (no campaign)' },
  baselineApr: { scans: 6732, users: 2547, weekday: 'พฤหัส', note: 'no campaign' },
  timeOfDay: [
    { range: '00-06', scans:   686, pct:  9.6 },
    { range: '07-09', scans: 1061, pct: 14.8 },
    { range: '10-12', scans: 1287, pct: 18.0 },
    { range: '13-15', scans:  959, pct: 13.4 },
    { range: '16-18', scans:  994, pct: 13.9 },
    { range: '19-21', scans: 1552, pct: 21.7 },
    { range: '22-23', scans:  621, pct:  8.7 },
  ],
  topProvinces: [
    { rank:1, name:'กรุงเทพมหานคร', scans:976, users:366 },
    { rank:2, name:'ชลบุรี',          scans:278, users:107 },
    { rank:3, name:'นครราชสีมา',     scans:264, users: 97 },
    { rank:4, name:'ระยอง',           scans:237, users: 57 },
    { rank:5, name:'สมุทรปราการ',     scans:221, users:108 },
    { rank:6, name:'เชียงราย',        scans:217, users: 50 },
    { rank:7, name:'เชียงใหม่',       scans:215, users: 89 },
    { rank:8, name:'สงขลา',           scans:205, users: 71 },
    { rank:9, name:'ปทุมธานี',        scans:187, users: 69 },
    { rank:10,name:'สมุทรสาคร',       scans:176, users: 42 },
  ],
  topSku: [
    { rank:1, sku:'L3-8G',    name:'ดีดีครีมแตงโม',          tickets:2452, perScan:1, pct:34.2 },
    { rank:2, sku:'L4-8G',    name:'เซรั่มลำไย',              tickets: 659, perScan:1, pct: 9.2 },
    { rank:3, sku:'L6-8G',    name:'เซรั่มแครอท',             tickets: 499, perScan:1, pct: 7.0 },
    { rank:4, sku:'L10-7G',   name:'กันแดด 3D ออร่า',         tickets: 471, perScan:1, pct: 6.6 },
    { rank:5, sku:'L13-10G',  name:'ครีมกุหลาบ',              tickets: 328, perScan:1, pct: 4.6 },
  ],
  heavyUsers: [
    { rank:1, userHash:'02854cd3', province:'เชียงราย',     scans:54, skuDiversity:13 },
    { rank:2, userHash:'81313ac2', province:'ระยอง',         scans:53, skuDiversity: 5 },
    { rank:3, userHash:'0a3fbb7f', province:'ปทุมธานี',     scans:50, skuDiversity: 2 },
    { rank:4, userHash:'9df77750', province:'สกลนคร',       scans:46, skuDiversity: 5 },
    { rank:5, userHash:'234cefd6', province:'ลำปาง',         scans:39, skuDiversity: 9 },
    { rank:6, userHash:'c05d792d', province:'ลำพูน',         scans:36, skuDiversity: 2 },
    { rank:7, userHash:'0342fa6b', province:'กรุงเทพ',       scans:35, skuDiversity: 7 },
    { rank:8, userHash:'d3c40898', province:'นครราชสีมา',   scans:35, skuDiversity: 8 },
    { rank:9, userHash:'72503ee0', province:'สตูล',          scans:30, skuDiversity: 1 },
    { rank:10,userHash:'9abdac79', province:'พิษณุโลก',     scans:26, skuDiversity: 8 },
  ],
  supportCases: [
    { topic: 'สแกนไม่ได้',     count: 5 },
    { topic: 'สะสมแต้มไม่ได้', count: 3 },
  ],
  totalSupport: 8,
}

// ─── DAY 17 พ.ค. (อาทิตย์) — ค่าจริงจาก dashboard widget ───
const DAY_17: DailyEntry = {
  date: '2026-05-17', weekday: 'อาทิตย์',
  success: 8713, tickets: 8709, expectedTickets: 11634, uniqueUsers: 2968,
  dupSelf: 755, dupOther: 130, notFound: 174, scanFailedOther: 0,
  scanByNew: 1355, scanByOld: 8417,
  memberNew: 414, memberOld: 2617, memberTotal: 833906,
  newSignup: 414, newScanned: 401, oldScanned: 2567,
  successRate: 89.2,
  firstTimePct: 14.1, returningPct: 85.9,
  avgScansPerUser: 2.94, medianScansPerUser: 2, maxScansPerUser: 98,
  engagementBuckets: [
    { label: '1 scan',     users: 1453, pct: 49.0 },
    { label: '2-5 scans',  users: 1160, pct: 39.1 },
    { label: '6-10 scans', users:  241, pct:  8.1 },
    { label: '10+ scans',  users:  114, pct:  3.8 },
  ],
  peakHours: [
    { rank: 1, hour: '20:00', scans: 740 },
    { rank: 2, hour: '21:00', scans: 609 },
    { rank: 3, hour: '11:00', scans: 605 },
  ],
  signedNotScanned: 59,
  baselineMar: { scans: 7498, users: 2703, weekday: 'อังคาร', note: 'baseline' },
  baselineApr: { scans: 7211, users: 2689, weekday: 'ศุกร์', note: 'หลังสงกรานต์' },
  timeOfDay: [
    { range: '00-06', scans:  743, pct:  8.5 },
    { range: '07-09', scans: 1230, pct: 14.1 },
    { range: '10-12', scans: 1545, pct: 17.7 },
    { range: '13-15', scans: 1375, pct: 15.8 },
    { range: '16-18', scans: 1262, pct: 14.5 },
    { range: '19-21', scans: 1917, pct: 22.0 },
    { range: '22-23', scans:  641, pct:  7.4 },
  ],
  topProvinces: [
    { rank:1, name:'กรุงเทพมหานคร', scans:1006,users:378 },
    { rank:2, name:'สมุทรปราการ',     scans: 435,users:137 },
    { rank:3, name:'ชลบุรี',          scans: 392,users:130 },
    { rank:4, name:'นครราชสีมา',     scans: 361,users: 93 },
    { rank:5, name:'ปทุมธานี',        scans: 285,users: 88 },
    { rank:6, name:'เชียงใหม่',       scans: 264,users: 95 },
    { rank:7, name:'สงขลา',           scans: 242,users: 78 },
    { rank:8, name:'นนทบุรี',         scans: 218,users: 65 },
    { rank:9, name:'ระยอง',           scans: 202,users: 53 },
    { rank:10,name:'เชียงราย',        scans: 196,users: 48 },
  ],
  topSku: [
    { rank:1, sku:'L3-8G',    name:'ดีดีครีมแตงโม',          tickets:2822, perScan:1, pct:32.4 },
    { rank:2, sku:'L4-8G',    name:'เซรั่มลำไย',              tickets: 813, perScan:1, pct: 9.3 },
    { rank:3, sku:'L6-8G',    name:'เซรั่มแครอท',             tickets: 631, perScan:1, pct: 7.2 },
    { rank:4, sku:'L10-7G',   name:'กันแดด 3D ออร่า',         tickets: 539, perScan:1, pct: 6.2 },
    { rank:5, sku:'L7-6G',    name:'โดสส้มแดงกลูต้า',         tickets: 443, perScan:1, pct: 5.1 },
  ],
  heavyUsers: [
    { rank:1, userHash:'d74b8ca0', province:'ปราจีนบุรี',     scans:98, skuDiversity:10, age:39 },
    { rank:2, userHash:'c93f2337', province:'ขอนแก่น',         scans:79, skuDiversity: 4, age:34 },
    { rank:3, userHash:'8634e133', province:'สมุทรปราการ',     scans:64, skuDiversity: 7, age:21 },
    { rank:4, userHash:'86508aa4', province:'สงขลา',           scans:48, skuDiversity: 1, age:17 },
    { rank:5, userHash:'73c56a35', province:'กรุงเทพมหานคร',   scans:42, skuDiversity: 2, age:30 },
    { rank:6, userHash:'1d238c96', province:'กรุงเทพมหานคร',   scans:42, skuDiversity: 7, age:38 },
    { rank:7, userHash:'4616df97', province:'นครราชสีมา',     scans:41, skuDiversity: 3, age:31 },
    { rank:8, userHash:'b4a28177', province:'เชียงใหม่',       scans:40, skuDiversity: 4, age:30 },
    { rank:9, userHash:'a430af07', province:'นครราชสีมา',     scans:39, skuDiversity: 3, age:35 },
  ],
  supportCases: [
    { topic: 'สแกนไม่ได้',     count: 6 },
    { topic: 'สะสมแต้มไม่ได้', count: 2 },
    { topic: 'รางวัล',          count: 1 },
  ],
  totalSupport: 9,
}

// ─── DAY 18 พ.ค. (จันทร์) — ค่าจริงจาก dashboard widget ───
const DAY_18: DailyEntry = {
  date: '2026-05-18', weekday: 'จันทร์',
  success: 6459, tickets: 6432, expectedTickets: 8654, uniqueUsers: 2509,
  dupSelf: 639, dupOther: 79, notFound: 181, scanFailedOther: 0,
  scanByNew: 1078, scanByOld: 6280,
  memberNew: 428, memberOld: 2153, memberTotal: 834360,
  newSignup: 428, newScanned: 408, oldScanned: 2101,
  successRate: 87.8,
  firstTimePct: 17.1, returningPct: 82.9,
  avgScansPerUser: 2.56, medianScansPerUser: 1, maxScansPerUser: 103,
  engagementBuckets: [
    { label: '1 scan',     users: 1239, pct: 49.4 },
    { label: '2-5 scans',  users: 1051, pct: 41.9 },
    { label: '6-10 scans', users:  153, pct:  6.1 },
    { label: '10+ scans',  users:   66, pct:  2.6 },
  ],
  peakHours: [
    { rank: 1, hour: '19:00', scans: 544 },
    { rank: 2, hour: '21:00', scans: 521 },
    { rank: 3, hour: '20:00', scans: 497 },
  ],
  signedNotScanned: 72,
  baselineMar: { scans: 7114, users: 2658, weekday: 'พุธ', note: 'baseline' },
  baselineApr: { scans: 8581, users: 2916, weekday: 'เสาร์', note: 'หยุด/สงกรานต์ tail' },
  timeOfDay: [
    { range: '00-06', scans:  548, pct:  8.5 },
    { range: '07-09', scans:  925, pct: 14.4 },
    { range: '10-12', scans: 1112, pct: 17.3 },
    { range: '13-15', scans:  920, pct: 14.3 },
    { range: '16-18', scans:  907, pct: 14.1 },
    { range: '19-21', scans: 1496, pct: 23.3 },
    { range: '22-23', scans:  524, pct:  8.1 },
  ],
  topProvinces: [
    { rank:1, name:'กรุงเทพมหานคร', scans:881, users:312 },
    { rank:2, name:'ชลบุรี',          scans:285, users: 98 },
    { rank:3, name:'สมุทรปราการ',     scans:267, users:101 },
    { rank:4, name:'นครราชสีมา',     scans:248, users: 91 },
    { rank:5, name:'ปทุมธานี',        scans:226, users: 79 },
    { rank:6, name:'เชียงใหม่',       scans:204, users: 76 },
    { rank:7, name:'นนทบุรี',         scans:198, users: 62 },
    { rank:8, name:'สงขลา',           scans:188, users: 64 },
    { rank:9, name:'เชียงราย',        scans:175, users: 45 },
    { rank:10,name:'ระยอง',           scans:171, users: 49 },
  ],
  topSku: [
    { rank:1, sku:'L3-8G',    name:'ดีดีครีมแตงโม',          tickets:2162, perScan:1, pct:33.6 },
    { rank:2, sku:'L4-8G',    name:'เซรั่มลำไย',              tickets: 692, perScan:1, pct:10.8 },
    { rank:3, sku:'L10-7G',   name:'กันแดด 3D ออร่า',         tickets: 513, perScan:1, pct: 8.0 },
    { rank:4, sku:'L6-8G',    name:'เซรั่มแครอท',             tickets: 472, perScan:1, pct: 7.3 },
    { rank:5, sku:'L7-6G',    name:'โดสส้มแดงกลูต้า',         tickets: 339, perScan:1, pct: 5.3 },
  ],
  heavyUsers: [
    { rank:1, userHash:'c25f0278', province:'กรุงเทพมหานคร',  scans:103, skuDiversity: 7, age:29 },
    { rank:2, userHash:'7fd7a8e7', province:'อุบลราชธานี',    scans: 74, skuDiversity: 6, age:33 },
    { rank:3, userHash:'7b4e3b0f', province:'กรุงเทพมหานคร',  scans: 36, skuDiversity: 2, age:33 },
    { rank:4, userHash:'7b0a6472', province:'สุรินทร์',         scans: 34, skuDiversity: 8, age:53 },
    { rank:5, userHash:'a34ef4a8', province:'ปทุมธานี',        scans: 33, skuDiversity: 9, age:36 },
    { rank:6, userHash:'82ab7a2c', province:'นครศรีธรรมราช',  scans: 33, skuDiversity: 4, age:54 },
    { rank:7, userHash:'109f456a', province:'นราธิวาส',        scans: 32, skuDiversity: 4, age:38 },
    { rank:8, userHash:'039e3e30', province:'มหาสารคาม',        scans: 31, skuDiversity: 5, age:46 },
    { rank:9, userHash:'fa104e70', province:'นนทบุรี',         scans: 27, skuDiversity: 3, age:45 },
  ],
  supportCases: [
    { topic: 'สแกนไม่ได้',     count: 4 },
    { topic: 'สะสมแต้มไม่ได้', count: 2 },
  ],
  totalSupport: 6,
}

// ─── DAY 19 พ.ค. (อังคาร) — มี outage 6h — ค่าจริงจาก dashboard widget ───
const DAY_19: DailyEntry = {
  date: '2026-05-19', weekday: 'อังคาร',
  success: 5707, tickets: 5687, expectedTickets: 7876, uniqueUsers: 1929,
  dupSelf: 588, dupOther: 164, notFound: 162, scanFailedOther: 0,
  scanByNew: 973, scanByOld: 5648,
  memberNew: 283, memberOld: 1702, memberTotal: 834705,
  newSignup: 283, newScanned: 278, oldScanned: 1651,
  successRate: 86.2,
  firstTimePct: 15.2, returningPct: 84.8,
  avgScansPerUser: 2.96, medianScansPerUser: 2, maxScansPerUser: 84,
  engagementBuckets: [
    { label: '1 scan',     users: 935, pct: 48.5 },
    { label: '2-5 scans',  users: 767, pct: 39.8 },
    { label: '6-10 scans', users: 148, pct:  7.7 },
    { label: '10+ scans',  users:  79, pct:  4.1 },
  ],
  peakHours: [
    { rank: 1, hour: '20:00', scans: 765 },
    { rank: 2, hour: '19:00', scans: 608 },
    { rank: 3, hour: '21:00', scans: 604 },
  ],
  signedNotScanned: 30,
  baselineMar: { scans: 6643, users: 2553, weekday: 'พฤหัส', note: 'baseline' },
  baselineApr: { scans: 9261, users: 3073, weekday: 'อาทิตย์', note: 'weekend strong day' },
  timeOfDay: [
    { range: '00-03 (pre)',    scans:  225, pct:  3.9 },
    { range: '03-09 (OUTAGE)', scans:    0, pct:  0.0 },
    { range: '09-12 (recover)',scans: 1174, pct: 20.6 },
    { range: '13-15',          scans:  890, pct: 15.6 },
    { range: '16-18',          scans: 1001, pct: 17.5 },
    { range: '19-22 (peak)',   scans: 2417, pct: 42.3 },
  ],
  topProvinces: [
    { rank:1, name:'กรุงเทพมหานคร', scans:782, users:289 },
    { rank:2, name:'ชลบุรี',          scans:248, users: 89 },
    { rank:3, name:'สมุทรปราการ',     scans:234, users: 92 },
    { rank:4, name:'นครราชสีมา',     scans:212, users: 81 },
    { rank:5, name:'ปทุมธานี',        scans:198, users: 71 },
    { rank:6, name:'เชียงใหม่',       scans:185, users: 68 },
    { rank:7, name:'นนทบุรี',         scans:172, users: 54 },
    { rank:8, name:'สงขลา',           scans:158, users: 56 },
    { rank:9, name:'ระยอง',           scans:148, users: 41 },
    { rank:10,name:'เชียงราย',        scans:139, users: 38 },
  ],
  topSku: [
    { rank:1, sku:'L3-8G',    name:'ดีดีครีมแตงโม',          tickets:1746, perScan:1, pct:30.7 },
    { rank:2, sku:'L4-8G',    name:'เซรั่มลำไย',              tickets: 656, perScan:1, pct:11.5 },
    { rank:3, sku:'L6-8G',    name:'เซรั่มแครอท',             tickets: 473, perScan:1, pct: 8.3 },
    { rank:4, sku:'L10-7G',   name:'กันแดด 3D ออร่า',         tickets: 354, perScan:1, pct: 6.2 },
    { rank:5, sku:'L13-10G',  name:'ครีมกุหลาบ',              tickets: 225, perScan:1, pct: 4.0 },
  ],
  heavyUsers: [
    { rank:1, userHash:'dfcc0925', province:'สระแก้ว',        scans:84, skuDiversity: 3, age:45 },
    { rank:2, userHash:'8b19f418', province:'สมุทรปราการ',    scans:75, skuDiversity:11, age:24 },
    { rank:3, userHash:'c77a7adb', province:'สระแก้ว',        scans:70, skuDiversity: 4, age:20 },
    { rank:4, userHash:'f4960d2f', province:'สมุทรปราการ',    scans:52, skuDiversity: 6, age:46 },
    { rank:5, userHash:'e0fa8b98', province:'อุบลราชธานี',    scans:46, skuDiversity: 3, age:19 },
    { rank:6, userHash:'81ce6ad2', province:'กรุงเทพมหานคร',  scans:42, skuDiversity:16, age:32 },
    { rank:7, userHash:'6381498f', province:'กรุงเทพมหานคร',  scans:40, skuDiversity:11, age:44 },
    { rank:8, userHash:'3b8afe6a', province:'ปทุมธานี',        scans:39, skuDiversity: 6, age:28 },
    { rank:9, userHash:'28a0fb72', province:'หนองคาย',         scans:39, skuDiversity: 8, age:36 },
  ],
  supportCases: [],  // 0 cases (อาจเพราะ outage เปิดช่องอื่น)
  totalSupport: 0,
  outage: {
    start: '2026-05-19T02:49:00+07:00',
    end:   '2026-05-19T09:00:14+07:00',
    durationHours: 6.18,
    cause: 'API/Cloudflare tunnel (suspected) — log lost จาก container restart',
  },
}

// ─── DAY 20 พ.ค. (พุธ) — recovery จาก outage — ข้อมูลจาก DB ครบ ───
// NOTE: dupOther จาก saversure = 107 (ซ้ำคนอื่น) + 164 (ไม่พบ) → DB รวม 271
const DAY_20: DailyEntry = {
  date: '2026-05-20', weekday: 'พุธ',
  success: 7669, tickets: 7663, expectedTickets: 9092, uniqueUsers: 2618,
  dupSelf: 654, dupOther: 271, notFound: 0, scanFailedOther: 0,  // DB รวม dup-other+notFound เป็น 271
  scanByNew: 1197, scanByOld: 7397,  // จาก saversure
  memberNew: 413, memberOld: 2316, memberTotal: 835107,
  newSignup: 413, newScanned: 362, oldScanned: 2256,
  successRate: 89.2,
  firstTimePct: 14.5, returningPct: 85.5,
  avgScansPerUser: 2.93, medianScansPerUser: 2, maxScansPerUser: 201,  // ⚠ bot/fraud suspect
  engagementBuckets: [
    { label: '1 scan',     users: 1282, pct: 49.0 },
    { label: '2-5 scans',  users: 1056, pct: 40.3 },
    { label: '6-10 scans', users:  199, pct:  7.6 },
    { label: '10+ scans',  users:   81, pct:  3.1 },
  ],
  peakHours: [
    { rank: 1, hour: '19:00', scans: 635 },
    { rank: 2, hour: '20:00', scans: 617 },
    { rank: 3, hour: '18:00', scans: 610 },
  ],
  signedNotScanned: 51,
  baselineMar: { scans: 6772, users: 2481, weekday: 'ศุกร์', note: 'baseline (no campaign)' },
  baselineApr: { scans: 7746, users: 2900, weekday: 'จันทร์', note: 'higher than may (DoW mismatch)' },
  timeOfDay: [
    { range: '00-06', scans: 1009, pct: 13.2 },  // 320 (23-02) + 689 (03-06)
    { range: '07-12', scans: 2237, pct: 29.2 },
    { range: '13-15', scans: 1100, pct: 14.4 },  // est: 13-18 = 2,290 → split
    { range: '16-18', scans: 1190, pct: 15.5 },
    { range: '19-22', scans: 2173, pct: 28.3 },
  ],
  topProvinces: [
    { rank:1, name:'กรุงเทพมหานคร', scans:917, users:365 },
    { rank:2, name:'สมุทรปราการ',    scans:453, users:104 },
    { rank:3, name:'สระบุรี',         scans:356, users: 20 },  // 🚨 17.80 scans/user — fraud cluster
    { rank:4, name:'เชียงใหม่',       scans:320, users:105 },
    { rank:5, name:'ชลบุรี',          scans:289, users:103 },
    { rank:6, name:'นครราชสีมา',     scans:254, users: 77 },
    { rank:7, name:'สงขลา',           scans:213, users: 58 },
    { rank:8, name:'นนทบุรี',         scans:181, users: 80 },
    { rank:9, name:'ปทุมธานี',        scans:177, users: 81 },
    { rank:10,name:'อุบลราชธานี',    scans:174, users: 51 },
  ],
  topSku: [
    { rank:1, sku:'L3-8G',    name:'ดีดีครีมแตงโม',    tickets:2699, perScan:1, pct:35.2 },
    { rank:2, sku:'L4-8G',    name:'เซรั่มลำไย',        tickets: 685, perScan:1, pct: 8.9 },
    { rank:3, sku:'L6-8G',    name:'เซรั่มแครอท',       tickets: 620, perScan:1, pct: 8.1 },
    { rank:4, sku:'L10-7G',   name:'กันแดด 3D ออร่า',   tickets: 449, perScan:1, pct: 5.9 },
    { rank:5, sku:'L7-6G',    name:'โดสส้มแดง',         tickets: 302, perScan:1, pct: 3.9 },
  ],
  heavyUsers: [
    { rank:1, userHash:'a5b2d2d6', province:'สมุทรปราการ',     scans:201, skuDiversity: 8,  age:32 },  // 🚨 201 exact
    { rank:2, userHash:'bbe6c398', province:'สระบุรี',          scans:201, skuDiversity:29,  age:37 },  // 🚨 201 exact
    { rank:3, userHash:'59820080', province:'เพชรบุรี',         scans:108, skuDiversity:14,  age:36 },
    { rank:4, userHash:'9e8ae769', province:'สระบุรี',          scans:103, skuDiversity:20,  age:43 },
    { rank:5, userHash:'cdd58ec8', province:'พิษณุโลก',         scans: 66, skuDiversity: 5,  age:41 },
    { rank:6, userHash:'08468750', province:'ชลบุรี',           scans: 37, skuDiversity:10,  age:32 },
    { rank:7, userHash:'4ecc7c3f', province:'นครราชสีมา',      scans: 36, skuDiversity: 4,  age:49 },
    { rank:8, userHash:'21ac4b3c', province:'พระนครศรีอยุธยา',  scans: 35, skuDiversity: 4,  age:29 },
    { rank:9, userHash:'2e9264b4', province:'ระนอง',            scans: 34, skuDiversity:12,  age:23 },
    { rank:10,userHash:'55549caa', province:'ประจวบคีรีขันธ์',   scans: 31, skuDiversity: 8,  age:21 },
  ],
  supportCases: [
    { topic: 'reward',  count: 4 },  // 2 resolved + 1 in_progress + 1 waiting
    { topic: 'scan',    count: 4 },  // 2 resolved + 1 open + 1 closed — aftermath outage?
  ],
  totalSupport: 8,
}

// ─── DAY 21 พ.ค. (พฤหัสบดี) — mini-outage 2h + recurring Saraburi risk ───
const DAY_21: DailyEntry = {
  date: '2026-05-21', weekday: 'พฤหัสบดี',
  success: 6590, tickets: 6560, expectedTickets: 8563, uniqueUsers: 2470,
  dupSelf: 617, dupOther: 245, notFound: 0, scanFailedOther: 0,
  memberNew: 403, memberOld: 2100, memberTotal: 835510,
  newSignup: 403, newScanned: 356, oldScanned: 2100,
  successRate: 88.4,
  firstTimePct: 15.0, returningPct: 85.0,
  avgScansPerUser: 2.67, medianScansPerUser: 1, maxScansPerUser: 162,
  engagementBuckets: [
    { label: '1 scan',     users: 1280, pct: 51.8 },
    { label: '2-5 scans',  users:  956, pct: 38.7 },
    { label: '6-10 scans', users:  168, pct:  6.8 },
    { label: '10+ scans',  users:   66, pct:  2.7 },
  ],
  peakHours: [
    { rank: 1, hour: '21:00', scans: 673 },
    { rank: 2, hour: '20:00', scans: 560 },
    { rank: 3, hour: '17:00', scans: 490 },
  ],
  signedNotScanned: 47,
  baselineMar: { scans: 6935, users: 2413, weekday: 'เสาร์', note: 'same date baseline' },
  baselineApr: { scans: 7757, users: 2850, weekday: 'อังคาร', note: 'DoW mismatch' },
  timeOfDay: [
    { range: '23-02', scans:  351, pct:  5.3 },
    { range: '03-06 (OUTAGE)', scans:  525, pct:  8.0 },
    { range: '07-12', scans: 1841, pct: 27.9 },
    { range: '13-18', scans: 1745, pct: 26.5 },
    { range: '19-22', scans: 2128, pct: 32.3 },
  ],
  topProvinces: [
    { rank: 1, name: 'กรุงเทพมหานคร', scans: 937, users: 345 },
    { rank: 2, name: 'สระบุรี', scans: 319, users: 32 },
    { rank: 3, name: 'ชลบุรี', scans: 299, users: 109 },
    { rank: 4, name: 'เชียงใหม่', scans: 203, users: 84 },
    { rank: 5, name: 'สมุทรปราการ', scans: 201, users: 86 },
    { rank: 6, name: 'นครราชสีมา', scans: 190, users: 82 },
    { rank: 7, name: 'เชียงราย', scans: 170, users: 52 },
    { rank: 8, name: 'ปทุมธานี', scans: 163, users: 60 },
    { rank: 9, name: 'สงขลา', scans: 158, users: 61 },
    { rank: 10, name: 'นราธิวาส', scans: 134, users: 50 },
    { rank: 11, name: 'ปัตตานี', scans: 132, users: 47 },
    { rank: 12, name: 'ฉะเชิงเทรา', scans: 119, users: 41 },
  ],
  topSku: [
    { rank: 1, sku: 'L3-8G', name: 'ดีดีครีมแตงโม', tickets: 2272, perScan: 1, pct: 34.6 },
    { rank: 2, sku: 'L4-8G', name: 'เซรั่มลำไย', tickets: 705, perScan: 1, pct: 10.7 },
    { rank: 3, sku: 'L6-8G', name: 'เซรั่มแครอท', tickets: 462, perScan: 1, pct: 7.0 },
    { rank: 4, sku: 'L10-7G', name: 'กันแดดแตงโม 3D', tickets: 430, perScan: 1, pct: 6.6 },
    { rank: 5, sku: 'L13-10G', name: 'ครีมกุหลาบน้ำเงิน', tickets: 268, perScan: 1, pct: 4.1 },
    { rank: 6, sku: 'L7-6G', name: 'โดสส้มแดง', tickets: 252, perScan: 1, pct: 3.8 },
    { rank: 7, sku: 'C4-8G', name: 'เซรั่มขิงดำซิงก์', tickets: 219, perScan: 1, pct: 3.3 },
    { rank: 8, sku: 'L19-8G', name: 'มอยส์เจลฉ่ำบัว', tickets: 200, perScan: 1, pct: 3.0 },
    { rank: 9, sku: 'L3-40G', name: 'ดีดีครีมแตงโม', tickets: 182, perScan: 5, pct: 2.8 },
    { rank: 10, sku: 'L8B-6G', name: 'อีอีคูชั่น 02', tickets: 114, perScan: 1, pct: 1.7 },
    { rank: 11, sku: 'JHA1-40G', name: 'บีบีโลชั่นแตงโม', tickets: 103, perScan: 1, pct: 1.6 },
    { rank: 12, sku: 'L8A-6G', name: 'อีอีคูชั่น 01', tickets: 103, perScan: 1, pct: 1.6 },
    { rank: 13, sku: 'D3-70G', name: 'ยาสีฟันลดกลิ่นปาก', tickets: 93, perScan: 2, pct: 1.4 },
    { rank: 14, sku: 'L20-7G', name: 'กันแดดทานตะวัน', tickets: 93, perScan: 1, pct: 1.4 },
    { rank: 15, sku: 'JH906-70G', name: 'สบู่ลำไย', tickets: 81, perScan: 1, pct: 1.2 },
    { rank: 16, sku: 'L4-40G', name: 'เซรั่มลำไย', tickets: 71, perScan: 5, pct: 1.1 },
    { rank: 17, sku: 'C2-8G', name: 'เซรั่มมะรุมเปบไทด์', tickets: 68, perScan: 1, pct: 1.0 },
    { rank: 18, sku: 'JH703-8G', name: 'ดีดีครีมแตงโม', tickets: 62, perScan: 1, pct: 0.9 },
    { rank: 19, sku: 'JH905-70G', name: 'สบู่แตงโม', tickets: 54, perScan: 1, pct: 0.8 },
    { rank: 20, sku: 'L6-40G', name: 'เซรั่มแครอท', tickets: 52, perScan: 5, pct: 0.8 },
    { rank: 21, sku: 'JH706-8G', name: 'เซรั่มแครอท', tickets: 47, perScan: 1, pct: 0.7 },
    { rank: 22, sku: 'L10-30G', name: 'กันแดดแตงโม 3D', tickets: 45, perScan: 5, pct: 0.7 },
    { rank: 23, sku: 'C3-7G', name: 'กันแดดน้ำนมเมลอน', tickets: 44, perScan: 1, pct: 0.7 },
    { rank: 24, sku: 'JH904-70G', name: 'สบู่ดาวเรือง', tickets: 42, perScan: 1, pct: 0.6 },
    { rank: 25, sku: 'L11-40G', name: 'โลชั่นโดสส้มแดง', tickets: 34, perScan: 1, pct: 0.5 },
  ],
  heavyUsers: [
    { rank: 1, userHash: 'bbe6c398', province: 'สระบุรี', scans: 162, skuDiversity: 20, age: 37 },
    { rank: 2, userHash: '5b874437', province: 'กรุงเทพมหานคร', scans: 131, skuDiversity: 10, age: 44 },
    { rank: 3, userHash: '3dbb8626', province: 'สระบุรี', scans: 82, skuDiversity: 18, age: 53 },
    { rank: 4, userHash: 'd6f976ba', province: 'ศรีสะเกษ', scans: 54, skuDiversity: 3, age: 58 },
    { rank: 5, userHash: '5c4ac73d', province: 'นราธิวาส', scans: 41, skuDiversity: 7, age: 35 },
    { rank: 6, userHash: 'a6176973', province: 'อำนาจเจริญ', scans: 40, skuDiversity: 6, age: 33 },
    { rank: 7, userHash: '9ae25f84', province: 'เชียงใหม่', scans: 29, skuDiversity: 5, age: 22 },
    { rank: 8, userHash: '6b4a8217', province: 'ยโสธร', scans: 28, skuDiversity: 4, age: 25 },
    { rank: 9, userHash: '54444d61', province: 'ชลบุรี', scans: 26, skuDiversity: 3, age: 31 },
    { rank: 10, userHash: '5767046f', province: 'บุรีรัมย์', scans: 25, skuDiversity: 5, age: 24 },
  ],
  supportCases: [
    { topic: 'reward', count: 5 },
    { topic: 'account', count: 1 },
  ],
  totalSupport: 6,
  outage: {
    start: '2026-05-21T03:00:00+07:00',
    end: '2026-05-21T04:59:00+07:00',
    durationHours: 2.0,
    cause: 'Mini-outage 03:00-04:59 — suspected scheduled job/maintenance window',
  },
}

// ─── DAY 22 พ.ค. (ศุกร์) — mini-outage 02-04 (suspected scheduled job) ───
const DAY_22: DailyEntry = {
  date: '2026-05-22', weekday: 'ศุกร์',
  success: 6147, tickets: 6137, expectedTickets: 8051, uniqueUsers: 2423,
  dupSelf: 560, dupOther: 231, notFound: 0, scanFailedOther: 0,
  memberNew: 418, memberOld: 1994, memberTotal: 835928,
  newSignup: 418, newScanned: 380, oldScanned: 1994,
  successRate: 88.6,
  firstTimePct: 15.4, returningPct: 81.8,
  avgScansPerUser: 2.54, medianScansPerUser: 1, maxScansPerUser: 72,
  engagementBuckets: [
    { label: '1 scan',     users: 1295, pct: 53.4 },
    { label: '2-5 scans',  users:  893, pct: 36.9 },
    { label: '6-10 scans', users:  175, pct:  7.2 },
    { label: '10+ scans',  users:   60, pct:  2.5 },
  ],
  peakHours: [
    { rank: 1, hour: '20:00', scans: 541 },
    { rank: 2, hour: '19:00', scans: 466 },
    { rank: 3, hour: '21:00', scans: 430 },
  ],
  signedNotScanned: 38,
  baselineMar: { scans: 8268, users: 0, weekday: 'อาทิตย์', note: 'weekend baseline' },
  baselineApr: { scans: 7603, users: 0, weekday: 'พุธ', note: 'weekday baseline' },
  timeOfDay: [
    { range: '00-06', scans:  909, pct: 14.8 },
    { range: '07-09', scans: 1082, pct: 17.6 },
    { range: '10-12', scans:  693, pct: 11.3 },
    { range: '13-15', scans:  507, pct:  8.2 },
    { range: '16-18', scans:  980, pct: 15.9 },
    { range: '19-21', scans: 1437, pct: 23.4 },
    { range: '22-23', scans:  539, pct:  8.8 },
  ],
  topProvinces: [
    { rank:  1, name: 'กรุงเทพมหานคร', scans: 819, users: 329 },
    { rank:  2, name: 'ชลบุรี',         scans: 290, users:  96 },
    { rank:  3, name: 'เชียงใหม่',      scans: 239, users:  77 },
    { rank:  4, name: 'สมุทรปราการ',    scans: 189, users:  98 },
    { rank:  5, name: 'นครราชสีมา',     scans: 183, users:  77 },
    { rank:  6, name: 'อุบลราชธานี',    scans: 177, users:  40 },
    { rank:  7, name: 'ปทุมธานี',       scans: 175, users:  75 },
    { rank:  8, name: 'นนทบุรี',        scans: 170, users:  78 },
    { rank:  9, name: 'เชียงราย',       scans: 153, users:  59 },
    { rank: 10, name: 'สระบุรี',        scans: 124, users:  20 },  // 🚨 avg 6.2 — still hotspot
  ],
  topSku: [
    { rank: 1, sku: 'L3-8G',   name: 'ดีดีครีมแตงโม',          tickets: 2023, perScan: 1, pct: 32.9 },
    { rank: 2, sku: 'L4-8G',   name: 'เซรั่มลำไย',              tickets:  656, perScan: 1, pct: 10.7 },
    { rank: 3, sku: 'L6-8G',   name: 'เซรั่มแครอท',             tickets:  486, perScan: 1, pct:  7.9 },
    { rank: 4, sku: 'L10-7G',  name: 'กันแดด 3D ออร่า',         tickets:  446, perScan: 1, pct:  7.3 },
    { rank: 5, sku: 'L13-10G', name: 'ครีมกุหลาบน้ำเงิน',       tickets:  255, perScan: 1, pct:  4.2 },
  ],
  heavyUsers: [
    { rank:  1, userHash: '9407dacb', province: 'สระบุรี',          scans: 72, skuDiversity: 18, age: undefined },
    { rank:  2, userHash: 'bd955bcd', province: 'อุบลราชธานี',      scans: 41, skuDiversity:  2 },  // ⚠ reseller pattern
    { rank:  3, userHash: '0ba86539', province: 'ชลบุรี',           scans: 38, skuDiversity:  8 },
    { rank:  4, userHash: 'a5663068', province: 'พิจิตร',           scans: 36, skuDiversity:  4 },
    { rank:  5, userHash: '1fcda3c0', province: 'อุบลราชธานี',      scans: 33, skuDiversity:  8 },
    { rank:  6, userHash: '46e60b34', province: 'ประจวบคีรีขันธ์',   scans: 32, skuDiversity:  4 },
    { rank:  7, userHash: '0019b9ec', province: 'เพชรบูรณ์',         scans: 32, skuDiversity:  2 },  // ⚠ reseller
    { rank:  8, userHash: 'ad669a5a', province: 'กรุงเทพมหานคร',    scans: 30, skuDiversity:  9 },
    { rank:  9, userHash: '92cfbf87', province: 'พระนครศรีอยุธยา',  scans: 26, skuDiversity:  4 },
    { rank: 10, userHash: '0bd60b90', province: 'เชียงใหม่',         scans: 24, skuDiversity:  2 },  // ⚠ reseller
  ],
  supportCases: [],  // n/a — support table ไม่อยู่ใน V2 DB
  totalSupport: 0,
  outage: {
    start: '2026-05-22T02:00:00+07:00',
    end:   '2026-05-22T04:30:00+07:00',
    durationHours: 2.5,
    cause: 'Mini-outage ช่วง 02-04 — suspected scheduled job (ครั้งที่ 3 ใน 4 วัน — pattern ชัดเจน)',
  },
}

// ─── DAY 23 พ.ค. (เสาร์) — recovery + weekend boost, no outage ───
const DAY_23: DailyEntry = {
  date: '2026-05-23', weekday: 'เสาร์',
  success: 7147, tickets: 7146, expectedTickets: 9648, uniqueUsers: 2612,
  dupSelf: 614, dupOther: 229, notFound: 0, scanFailedOther: 0,
  memberNew: 424, memberOld: 2178, memberTotal: 836352,
  newSignup: 424, newScanned: 376, oldScanned: 2178,
  successRate: 89.4,
  firstTimePct: 14.7, returningPct: 85.3,
  avgScansPerUser: 2.81, medianScansPerUser: 2, maxScansPerUser: 52,
  engagementBuckets: [
    { label: '1 scan',     users: 1306, pct: 50.0 },
    { label: '2-5 scans',  users:  993, pct: 38.0 },
    { label: '6-10 scans', users:  209, pct:  8.0 },
    { label: '10+ scans',  users:  104, pct:  4.0 },
  ],
  peakHours: [
    { rank: 1, hour: '20:00', scans: 641 },
    { rank: 2, hour: '21:00', scans: 552 },
    { rank: 3, hour: '11:00', scans: 512 },
  ],
  signedNotScanned: 48,
  baselineMar: { scans: 6600, users: 0, weekday: 'จันทร์', note: 'baseline (no campaign)' },
  baselineApr: { scans: 6920, users: 0, weekday: 'พฤหัส',  note: 'baseline (no campaign)' },
  timeOfDay: [
    { range: '00-06', scans:  482, pct:  6.7 },
    { range: '07-09', scans: 1253, pct: 17.5 },
    { range: '10-12', scans: 1353, pct: 18.9 },
    { range: '13-15', scans: 1044, pct: 14.6 },
    { range: '16-18', scans:  873, pct: 12.2 },
    { range: '19-21', scans: 1523, pct: 21.3 },
    { range: '22-23', scans:  619, pct:  8.7 },
  ],
  topProvinces: [
    { rank:  1, name: 'กรุงเทพมหานคร', scans: 882, users: 321 },
    { rank:  2, name: 'สมุทรปราการ',    scans: 317, users: 105 },
    { rank:  3, name: 'ชลบุรี',         scans: 289, users:  98 },
    { rank:  4, name: 'นครราชสีมา',     scans: 240, users:  79 },
    { rank:  5, name: 'เชียงใหม่',      scans: 229, users: 101 },
    { rank:  6, name: 'สงขลา',          scans: 207, users:  44 },  // 🔥 hotspot ใหม่ avg 4.70
    { rank:  7, name: 'นนทบุรี',        scans: 203, users:  81 },
    { rank:  8, name: 'ระยอง',          scans: 177, users:  50 },
    { rank:  9, name: 'เชียงราย',       scans: 174, users:  66 },
    { rank: 10, name: 'ปทุมธานี',       scans: 173, users:  78 },
  ],
  topSku: [
    { rank: 1, sku: 'L3-8G',   name: 'ดีดีครีมแตงโม',          tickets: 2579, perScan: 1, pct: 36.1 },
    { rank: 2, sku: 'L4-8G',   name: 'เซรั่มลำไย',              tickets:  672, perScan: 1, pct:  9.4 },
    { rank: 3, sku: 'L6-8G',   name: 'เซรั่มแครอท',             tickets:  586, perScan: 1, pct:  8.2 },
    { rank: 4, sku: 'L10-7G',  name: 'กันแดด 3D ออร่า',         tickets:  517, perScan: 1, pct:  7.2 },
    { rank: 5, sku: 'L13-10G', name: 'ครีมกุหลาบน้ำเงิน',       tickets:  297, perScan: 1, pct:  4.2 },
  ],
  heavyUsers: [
    { rank:  1, userHash: '6a70e407', province: 'สงขลา',           scans: 52, skuDiversity: 7 },
    { rank:  2, userHash: '662b1a2a', province: 'สมุทรปราการ',     scans: 43, skuDiversity: 5 },
    { rank:  3, userHash: 'f6137ef6', province: 'กาญจนบุรี',       scans: 43, skuDiversity: 3 },  // ⚠ reseller
    { rank:  4, userHash: '41a1ab09', province: 'สงขลา',           scans: 40, skuDiversity: 9 },
    { rank:  5, userHash: '5ece08fb', province: 'ระยอง',           scans: 38, skuDiversity: 2 },  // 🚨 reseller
    { rank:  6, userHash: '3159270a', province: 'สมุทรปราการ',     scans: 36, skuDiversity: 5 },
    { rank:  7, userHash: '6734c17a', province: 'สกลนคร',          scans: 35, skuDiversity: 2 },  // 🚨 reseller
    { rank:  8, userHash: '02ac49ed', province: 'พระนครศรีอยุธยา', scans: 32, skuDiversity: 8 },
    { rank:  9, userHash: '6418e6d7', province: 'ชลบุรี',          scans: 30, skuDiversity: 5 },
    { rank: 10, userHash: 'ce330e24', province: 'พัทลุง',          scans: 27, skuDiversity: 3 },
  ],
  supportCases: [],
  totalSupport: 0,
}

// ─── DAY 24 พ.ค. (อาทิตย์) — peak weekend + ภูเก็ต super-outlier 166 scans ───
const DAY_24: DailyEntry = {
  date: '2026-05-24', weekday: 'อาทิตย์',
  success: 8168, tickets: 7962, expectedTickets: 11027, uniqueUsers: 2716,
  dupSelf: 938, dupOther: 298, notFound: 0, scanFailedOther: 0,
  memberNew: 408, memberOld: 2283, memberTotal: 836760,
  newSignup: 408, newScanned: 371, oldScanned: 2283,
  successRate: 86.9,
  firstTimePct: 13.9, returningPct: 86.1,
  avgScansPerUser: 3.09, medianScansPerUser: 2, maxScansPerUser: 166,  // 🚨 super-outlier
  engagementBuckets: [
    { label: '1 scan',     users: 1305, pct: 48.0 },
    { label: '2-5 scans',  users: 1100, pct: 40.5 },
    { label: '6-10 scans', users:  217, pct:  8.0 },
    { label: '10+ scans',  users:   94, pct:  3.5 },
  ],
  peakHours: [
    { rank: 1, hour: '20:00', scans: 808 },
    { rank: 2, hour: '21:00', scans: 658 },
    { rank: 3, hour: '19:00', scans: 627 },
  ],
  signedNotScanned: 37,
  baselineMar: { scans: 7171, users: 0, weekday: 'อังคาร', note: 'baseline weekday' },
  baselineApr: { scans: 6696, users: 0, weekday: 'ศุกร์',  note: 'baseline weekday' },
  timeOfDay: [
    { range: '00-06', scans:  396, pct:  4.8 },
    { range: '07-09', scans: 1321, pct: 16.2 },
    { range: '10-12', scans: 1282, pct: 15.7 },
    { range: '13-15', scans: 1020, pct: 12.5 },
    { range: '16-18', scans: 1264, pct: 15.5 },
    { range: '19-21', scans: 2093, pct: 25.6 },
    { range: '22-23', scans:  792, pct:  9.7 },
  ],
  topProvinces: [
    { rank:  1, name: 'กรุงเทพมหานคร', scans: 1031, users: 373 },
    { rank:  2, name: 'ชลบุรี',         scans:  401, users: 128 },
    { rank:  3, name: 'สมุทรปราการ',    scans:  359, users: 121 },
    { rank:  4, name: 'นครราชสีมา',     scans:  312, users:  89 },
    { rank:  5, name: 'ปทุมธานี',       scans:  276, users:  89 },
    { rank:  6, name: 'นนทบุรี',        scans:  256, users:  71 },
    { rank:  7, name: 'นครศรีธรรมราช',  scans:  251, users:  55 },
    { rank:  8, name: 'เชียงใหม่',      scans:  247, users:  78 },
    { rank:  9, name: 'นครปฐม',         scans:  229, users:  57 },
    { rank: 10, name: 'ภูเก็ต',         scans:  217, users:  18 },  // 🚨 avg 12.06 — single user 166 scans
  ],
  topSku: [
    { rank: 1, sku: 'L3-8G',   name: 'ดีดีครีมแตงโม',          tickets: 2685, perScan: 1, pct: 33.7 },
    { rank: 2, sku: 'L4-8G',   name: 'เซรั่มลำไย',              tickets:  857, perScan: 1, pct: 10.8 },
    { rank: 3, sku: 'L6-8G',   name: 'เซรั่มแครอท',             tickets:  649, perScan: 1, pct:  8.2 },
    { rank: 4, sku: 'L10-7G',  name: 'กันแดด 3D ออร่า',         tickets:  448, perScan: 1, pct:  5.6 },
    { rank: 5, sku: 'L13-10G', name: 'ครีมกุหลาบน้ำเงิน',       tickets:  395, perScan: 1, pct:  5.0 },
  ],
  heavyUsers: [
    { rank:  1, userHash: '09ffa88b', province: 'ภูเก็ต',           scans: 166, skuDiversity:  3 },  // 🚨🚨 super-outlier
    { rank:  2, userHash: '8bcd5803', province: 'กรุงเทพมหานคร',    scans:  57, skuDiversity: 10 },
    { rank:  3, userHash: 'f568814f', province: 'นครศรีธรรมราช',   scans:  50, skuDiversity: 14 },
    { rank:  4, userHash: '8033874d', province: 'นครราชสีมา',      scans:  50, skuDiversity:  8 },
    { rank:  5, userHash: '5a18d18d', province: 'ปทุมธานี',         scans:  45, skuDiversity:  6 },
    { rank:  6, userHash: '4037ea53', province: 'ปัตตานี',          scans:  44, skuDiversity:  5 },
    { rank:  7, userHash: '0503fc95', province: 'ชลบุรี',           scans:  42, skuDiversity:  3 },  // ⚠ reseller
    { rank:  8, userHash: 'cb4c3b73', province: 'ปราจีนบุรี',       scans:  40, skuDiversity:  6 },
    { rank:  9, userHash: 'dbf9dd8d', province: 'นครปฐม',           scans:  40, skuDiversity:  7 },
    { rank: 10, userHash: '8125ccbf', province: 'ราชบุรี',          scans:  38, skuDiversity:  3 },  // ⚠ reseller
  ],
  supportCases: [],
  totalSupport: 0,
}

export const DAILY_ENTRIES: DailyEntry[] = [DAY_16, DAY_17, DAY_18, DAY_19, DAY_20, DAY_21, DAY_22, DAY_23, DAY_24]

// Aggregates
export const TOTALS_6_DAY = {
  success: DAILY_ENTRIES.reduce((s, d) => s + d.success, 0),
  tickets: DAILY_ENTRIES.reduce((s, d) => s + d.tickets, 0),
  uniqueUsers: DAILY_ENTRIES.reduce((s, d) => s + d.uniqueUsers, 0),
  newSignup: DAILY_ENTRIES.reduce((s, d) => s + d.newSignup, 0),
  totalSupport: DAILY_ENTRIES.reduce((s, d) => s + d.totalSupport, 0),
  dupSelf:  DAILY_ENTRIES.reduce((s, d) => s + d.dupSelf, 0),
  dupOther: DAILY_ENTRIES.reduce((s, d) => s + d.dupOther, 0),
  notFound: DAILY_ENTRIES.reduce((s, d) => s + d.notFound, 0),
}

// Backward-compat alias (some legacy components still import TOTALS_4_DAY)
export const TOTALS_5_DAY = TOTALS_6_DAY
export const TOTALS_4_DAY = TOTALS_6_DAY

// System health (6-day)
export const SYSTEM_HEALTH = {
  totalHours: 6 * 24,
  outageHours: 8.18,
  uptimePct: ((6 * 24 - 8.18) / (6 * 24)) * 100,
  incidents: [
    { date: '2026-05-19', start: '02:49', end: '09:00', durationHours: 6.18,
      severity: 'critical', cause: 'API/Cloudflare tunnel (suspected)' },
    { date: '2026-05-21', start: '03:00', end: '04:59', durationHours: 2.0,
      severity: 'major', cause: 'Mini-outage during early-morning window' },
  ],
}
