@echo off
REM ── Wrapper ให้ Windows Task Scheduler เรียก (รัน 11:00 ทุกวัน) ──
REM ดึง PDF รายชื่อสิทธิ์ลูกค้า (catch-up อัตโนมัติ) → เซฟลงโฟลเดอร์ เดือน/วัน
chcp 65001 >nul
cd /d "C:\My GitHub\julaherb-crm-board-final"
echo ===== RUN %DATE% %TIME% ===== >> "scripts\daily-print-export.runlog.txt"
set "NODE_EXE=C:\Program Files\nodejs\node.exe"
if not exist "%NODE_EXE%" set "NODE_EXE=node"
"%NODE_EXE%" "scripts\daily-print-export.mjs" >> "scripts\daily-print-export.runlog.txt" 2>&1
