'use client'
import { useEffect, useRef, useState } from 'react'

export interface ApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

export interface UseApiOptions {
  /**
   * Auto-refresh interval in ms. Omit หรือ 0 = ยิงครั้งเดียว (พฤติกรรมเดิม ไม่ poll).
   * ใส่ค่า เช่น 30000 เพื่อให้ refresh เองทุก 30 วิ (polling แบบสุภาพ).
   */
  refreshMs?: number
  /** ตั้ง false เพื่อหยุดทั้งหมด (เช่น แท็บที่ยังไม่ถูกเลือก). Default true. */
  enabled?: boolean
}

// เพดาน backoff: ยิงพลาดติดกันแล้วถอยเวลาออกได้ไกลสุด 5 นาที — กันไม่ให้กระหน่ำ DB ตอนมันแย่
const MAX_BACKOFF_MS = 5 * 60_000

export function useApi<T>(url: string | null, options: UseApiOptions = {}): ApiState<T> {
  const { refreshMs = 0, enabled = true } = options
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: !!url, error: null })

  // เก็บข้อมูลล่าสุดที่ดึงสำเร็จ — เวลา refresh พลาด ตัวเลขบนจอจะไม่กระพริบหาย
  const lastGood = useRef<T | null>(null)

  useEffect(() => {
    if (!url || !enabled) {
      setState({ data: null, loading: false, error: null })
      return
    }

    const polling = refreshMs > 0
    let cancelled = false
    let timer: ReturnType<typeof setTimeout> | null = null
    let failures = 0

    const schedule = (ms: number) => {
      if (cancelled || !polling) return
      timer = setTimeout(tick, ms)
    }

    const tick = async () => {
      // สุภาพข้อ 1: แท็บอยู่พื้นหลัง → ไม่ยิง network เลย รอ re-check รอบหน้า
      if (polling && typeof document !== 'undefined' && document.hidden) {
        schedule(refreshMs)
        return
      }

      try {
        const r = await fetch(url)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        if (cancelled) return
        failures = 0
        lastGood.current = data
        setState({ data, loading: false, error: null })
      } catch (err: any) {
        if (cancelled) return
        failures++
        // สุภาพข้อ 3: คงข้อมูลเดิมไว้ แค่ขึ้น error flag
        setState({ data: lastGood.current, loading: false, error: err.message })
      }

      // สุภาพข้อ 2: ยิงพลาดติดกัน → backoff แบบ exponential (refreshMs, x2, x4, ... เพดาน 5 นาที)
      if (polling) {
        const next = failures > 0
          ? Math.min(refreshMs * 2 ** Math.min(failures, 5), MAX_BACKOFF_MS)
          : refreshMs
        schedule(next)
      }
    }

    // กลับมาที่แท็บแล้ว refresh ทันที (เฉพาะตอน polling) — ไม่ต้องรอครบรอบ
    const onVisible = () => {
      if (polling && !document.hidden && !cancelled) {
        if (timer) clearTimeout(timer)
        tick()
      }
    }
    if (polling && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', onVisible)
    }

    setState(s => ({ ...s, loading: true, error: null }))
    tick()

    return () => {
      cancelled = true
      if (timer) clearTimeout(timer)
      if (typeof document !== 'undefined') document.removeEventListener('visibilitychange', onVisible)
    }
  }, [url, refreshMs, enabled])

  return state
}
