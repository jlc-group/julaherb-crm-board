// GET /api/print-slips-pdf?from=YYYY-MM-DD&to=YYYY-MM-DD
// สร้าง PDF สลิปจับฉลากฝั่ง server ด้วย Puppeteer (headless Chrome) — เรนเดอร์ HTML/CSS
// เดียวกับบนจอ → PDF เหมือนหน้าจอเป๊ะ (ภาษาไทยถูก 100% · ชื่อสินค้ายาวได้ ตัดแค่ท้ายด้วย …)
//
// ✅ rule-safe: สร้างที่ dashboard server เอง · consume saversureV2 read-only · ไม่แตะ saversureV2
// ✅ ตัดพนักงานแล้ว (getPrintSlips → matchExcluded เบอร์+ชื่อ) · ดึงเต็มช่วง (ครบทั้งวัน)
// ✅ ใช้ Chrome เรนเดอร์ → ไทย shape ถูก (pdfkit เดิมเพี้ยน) + ฟอนต์ Sarabun (Google Fonts ชุดเดียวกับบนจอ) → PDF เหมือนจอเป๊ะ
import { NextRequest, NextResponse } from 'next/server'
import puppeteer from 'puppeteer'
import { ds } from '@/lib/api/adapter'
import { getRange, DEFAULT_RANGE } from '../_utils'
import { maskPhone6 } from '@/lib/utils'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 600 // เผื่อช่วงกว้าง (สลิปเยอะ) — render นาน

// แบ่ง PDF เป็นไฟล์ละ PART_SIZE ใบ — ต้องเล็กพอที่ Puppeteer render < Cloudflare timeout (~100s)
// 2,000 ใบ = ~112 หน้า A4 ≈ 25 วิ render + 8 วิ font cap = ~33 วิ/request (ปลอดภัย · ลด part เหลือ 3-6)
// client loop download หลาย part อัตโนมัติ (logic อยู่ใน PrintListTab.downloadPdf)
const PART_SIZE = 2000
const MAX_PARTS = 10 // รองรับสูงสุด 20,000 ใบ (2,000×10) — เกินนี้ช่วงกว้างเกินไป

function esc(s: string): string {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const { from, to } = getRange(url, DEFAULT_RANGE)
  const partParam = Math.max(1, parseInt(url.searchParams.get('part') || '1', 10) || 1)

  // 1) ดึงสลิปเต็มช่วง (ตัดพนักงานแล้ว) — retry เผื่อ backend timeout ชั่วคราว
  let slips: { name: string; phone: string; scanCode: string; productName: string }[] = []
  let lastErr = ''
  for (let a = 0; a < 3; a++) {
    try {
      const d = await ds.getPrintSlips(from, to, PART_SIZE * MAX_PARTS)
      slips = d.slips ?? []
      lastErr = ''
      break
    } catch (e: any) {
      lastErr = e?.message ?? String(e)
    }
  }
  if (lastErr) {
    return NextResponse.json(
      { error: 'ดึงข้อมูลจาก saversureV2 ไม่สำเร็จ (อาจ timeout) — ลองช่วงวันที่แคบลง: ' + lastErr },
      { status: 502 },
    )
  }
  // แบ่งเป็นส่วน (part) — แต่ละไฟล์ ≤ PART_SIZE ใบ → render เร็ว ไม่ตัน protocolTimeout
  const total = slips.length
  // ดึงมาชนเพดาน (PART_SIZE×MAX_PARTS) = ช่วงกว้างเกินไป (อาจถูกตัดบางส่วน) → ให้เลือกแคบลง กัน slip หาย
  if (total >= PART_SIZE * MAX_PARTS) {
    return NextResponse.json(
      {
        error: `ช่วงวันที่นี้สลิปเยอะเกิน ${(PART_SIZE * MAX_PARTS).toLocaleString('en-US')} ใบ — กว้างเกินไป กรุณาเลือกช่วงแคบลง (ราว 1-2 วัน หรือดาวน์โหลดทีละวัน)`,
      },
      { status: 413 },
    )
  }
  const totalParts = Math.max(1, Math.ceil(total / PART_SIZE)) // ≤ MAX_PARTS เสมอ (เพราะ total < PART_SIZE×MAX_PARTS)
  const partNum = Math.min(partParam, totalParts)
  const pageSlips = slips.slice((partNum - 1) * PART_SIZE, partNum * PART_SIZE)

  // 2) สร้าง HTML การ์ด (mirror หน้าจอ) — ใช้ฟอนต์ระบบของ Chrome (เหมือนบนจอ)
  const cards = pageSlips
    .map(
      (s) =>
        `<div class="c"><div class="nm">${esc(s.name)}</div><div class="ph">${esc(maskPhone6(s.phone))}</div><div class="cd">${esc(s.scanCode)}</div><div class="pd">${esc(s.productName)}</div></div>`,
    )
    .join('')

  const html = `<!doctype html><html><head><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sarabun:wght@400;500;600;700;800&display=swap">
<style>
@page{size:A4 landscape;margin:5mm}
*{box-sizing:border-box}
body{margin:0;font-family:'Sarabun',sans-serif;color:#000}
.grid{display:grid;grid-template-columns:repeat(3,80mm);justify-content:center;gap:0}
.c{width:80mm;height:30mm;border:1px solid #94a3b8;border-radius:2px;background:#fff;padding:2mm 4mm;display:flex;flex-direction:column;justify-content:flex-start;text-align:center;gap:0.8mm;overflow:hidden;break-inside:avoid}
.nm{font-weight:700;font-size:15px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ph{font-size:12px;line-height:1.5}
.cd{font-size:12px;line-height:1.5;letter-spacing:.5px}
.pd{font-size:11.5px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
</style></head><body><div class="grid">${cards || '<div style="padding:10mm;font-size:16px">ไม่มีข้อมูลสลิปในช่วง ' + esc(from) + ' ถึง ' + esc(to) + '</div>'}</div></body></html>`

  // 3) Puppeteer เรนเดอร์ → PDF
  const browser = await puppeteer.launch({
    headless: 'new' as any,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
    timeout: 60000, // timeout เปิด browser
    protocolTimeout: 540000, // CDP timeout (default 180s น้อยไป) → 9 นาที กัน Page.printToPDF timed out ตอนหน้าเยอะ
  })
  try {
    const page = await browser.newPage()
    // domcontentloaded = รวดเร็ว ไม่บล็อกรอ Google Fonts (networkidle0 ช้า 30+ วิ → 524)
    await page.setContent(html, { waitUntil: 'domcontentloaded' as any, timeout: 30000 })
    // รอฟอนต์โหลด แต่กำหนด cap 8 วิ — ถ้า Google Fonts ช้าให้ fallback font แทน (ไทยยังอ่านได้)
    await Promise.race([
      page.evaluate(async () => {
        const d: any = document
        try {
          await Promise.all([
            d.fonts.load('400 15px Sarabun'),
            d.fonts.load('500 12px Sarabun'),
            d.fonts.load('700 15px Sarabun'),
          ])
        } catch {}
        await d.fonts.ready
      }),
      new Promise(r => setTimeout(r, 8000)),
    ])
    const pdf = await page.pdf({ printBackground: false, preferCSSPageSize: true, timeout: 0 }) // bg ขาวไม่ต้องวาด · timeout 0 (หน้าเยอะ)
    await browser.close()
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="print-slips-${from}_${to}${totalParts > 1 ? `_part${partNum}of${totalParts}` : ''}.pdf"`,
        'Cache-Control': 'no-store',
        'X-Total-Parts': String(totalParts), // client ใช้ตัดสินว่าต้องโหลดอีกกี่ส่วน
        'X-Part': String(partNum),
        'X-Total-Slips': String(total),
      },
    })
  } catch (e: any) {
    await browser.close().catch(() => {})
    return NextResponse.json(
      { error: 'สร้าง PDF ไม่สำเร็จ: ' + (e?.message ?? String(e)) + ' (ลองช่วงวันที่แคบลง)' },
      { status: 500 },
    )
  }
}
