// server-side helpers สำหรับระบบรับรางวัล (อ่าน winners/claims, เก็บไฟล์ใน data/) — ใช้เฉพาะใน route (มี fs)
import fs from 'fs'
import path from 'path'
import type { NextRequest } from 'next/server'
import type { DrawWinner, DrawClaim } from '@/config/draw-rounds'

// DATA_DIR override ได้ด้วย env — production ต้องชี้ออกนอก app folder เพราะ deploy.ps1 robocopy /PURGE ลบทุกอย่างที่ไม่ได้ exclude
export const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
export const WINNERS_FILE = path.join(DATA_DIR, 'draw-winners.json')
export const CLAIMS_FILE = path.join(DATA_DIR, 'draw-claims.json')
export const CLAIMS_DIR = path.join(DATA_DIR, 'claims')

export function last9(phone: string): string {
  const d = (phone || '').replace(/\D/g, '')
  return d.length >= 9 ? d.slice(-9) : d
}

function readJson<T>(file: string, fallback: T): T {
  try {
    const v = JSON.parse(fs.readFileSync(file, 'utf-8'))
    return v as T
  } catch {
    return fallback
  }
}

export function readWinners(): DrawWinner[] {
  const v = readJson<DrawWinner[]>(WINNERS_FILE, [])
  return Array.isArray(v) ? v : []
}

export function readClaims(): DrawClaim[] {
  const v = readJson<DrawClaim[]>(CLAIMS_FILE, [])
  return Array.isArray(v) ? v : []
}

export function writeClaims(arr: DrawClaim[]) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
  fs.writeFileSync(CLAIMS_FILE, JSON.stringify(arr, null, 2), 'utf-8')
}

// หาว่าเบอร์นี้เป็นผู้โชคดีไหม + ได้รางวัลอะไรบ้าง (จาก winners)
export interface WinnerPrize {
  round: number
  slotId: string
  prizeLabel: string
}
export function findWinnerPrizes(phone: string): { name: string; prizes: WinnerPrize[] } {
  const key = last9(phone)
  if (!key) return { name: '', prizes: [] }
  const mine = readWinners().filter((w) => last9(w.phone) === key)
  return {
    name: mine[0]?.name ?? '',
    prizes: mine.map((w) => ({ round: w.round, slotId: w.slotId, prizeLabel: w.prizeLabel })),
  }
}

export function claimPersonDir(phoneLast9: string): string {
  return path.join(CLAIMS_DIR, phoneLast9)
}

// ลบไฟล์ทั้งหมดของคนนี้ (ตอน "มอบของแล้ว" — retention PII)
export function purgeClaimFiles(phoneLast9: string) {
  const dir = claimPersonDir(phoneLast9)
  try {
    fs.rmSync(dir, { recursive: true, force: true })
  } catch {
    /* ignore */
  }
}

// gate ฝั่งแอดมิน: ถ้าตั้ง ADMIN_KEY ไว้ต้องใส่ header ให้ตรง · ถ้าไม่ตั้ง = เปิด (local สะดวก)
export function adminKeyOk(req: NextRequest): boolean {
  const key = process.env.ADMIN_KEY
  if (!key) return true // ยังไม่ตั้ง = local mode เปิด
  return req.headers.get('x-admin-key') === key
}
