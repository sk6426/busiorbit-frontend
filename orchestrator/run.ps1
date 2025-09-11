# D:\xbytechat\orchestrator\run.ps1
param(
  [string]$Idea = "Hello feature: health ping + login E2E",
  [string]$Branch = "feat/orchestrator-mvp"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSCommandPath
Set-Location (Join-Path $root "..")

# 1) Git branch
git fetch
if (-not (git rev-parse --verify $Branch 2>$null)) {
  git checkout -b $Branch
} else {
  git checkout $Branch
}

# 2) Build API
Write-Host "== Build API =="
dotnet build .\xbytechat-api\xbytechat.sln

# 3) Start API
Write-Host "== Start API on :7113 =="
$apiLog = ".\orchestrator\artifacts\api.log"
New-Item -ItemType Directory -Force -Path .\orchestrator\artifacts | Out-Null
if ($apiProc) { try { Stop-Process -Id $apiProc.Id -Force } catch {} }
$apiProc = Start-Process pwsh -ArgumentList "-NoProfile","-Command","cd ..\xbytechat-api; dotnet run --urls=http://localhost:7113" -RedirectStandardOutput $apiLog -RedirectStandardError $apiLog -PassThru

# Wait for health
Write-Host "== Wait for API health =="
$ok = $false
for ($i=0;$i -lt 30;$i++){
  try {
    $r = Invoke-WebRequest "http://localhost:7113/api/health/ping" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -eq 200) { $ok = $true; break }
  } catch {}
  Start-Sleep -Seconds 2
}
if (-not $ok) { Write-Error "API did not become healthy. See $apiLog" }

# 4) Start UI (dev server assumed on :3000)
Write-Host "== Start UI dev server on :3000 =="
$uiLog = ".\orchestrator\artifacts\ui.log"
if ($uiProc) { try { Stop-Process -Id $uiProc.Id -Force } catch {} }
$uiProc = Start-Process pwsh -ArgumentList "-NoProfile","-Command","cd ..\xbytechat-ui; npm install; npm start" -RedirectStandardOutput $uiLog -RedirectStandardError $uiLog -PassThru

# Wait for UI to respond
$ok = $false
for ($i=0;$i -lt 30;$i++){
  try {
    $r = Invoke-WebRequest "http://localhost:3000" -UseBasicParsing -TimeoutSec 3
    if ($r.StatusCode -in 200,304) { $ok = $true; break }
  } catch {}
  Start-Sleep -Seconds 2
}
if (-not $ok) { Write-Error "UI did not become available. See $uiLog" }

# 5) Run API tests (optional if you have)
Write-Host "== Run dotnet tests =="
dotnet test .\xbytechat-api\xbytechat.sln

# 6) Run Playwright E2E
Write-Host "== Run Playwright E2E =="
$env:E2E_BASE_URL = "http://localhost:3000"
$env:E2E_USER = $env:E2E_USER ?? "e2e.user@example.com"
$env:E2E_PASS = $env:E2E_PASS ?? "E2E_Pass_123"

cd .\xbytechat-ui
npx playwright install
npx playwright test --reporter=list
$code = $LASTEXITCODE
cd ..

# 7) Stop servers
try { if ($uiProc) { Stop-Process -Id $uiProc.Id -Force } } catch {}
try { if ($apiProc) { Stop-Process -Id $apiProc.Id -Force } } catch {}

# 8) Commit if green
if ($code -eq 0) {
  git add -A
  git commit -m "feat(orchestrator): MVP loop + health ping + E2E login" | Out-Null
  Write-Host "`n✅ All green. Branch '$Branch' ready. Review diffs and push:"
  Write-Host "   git push -u origin $Branch"
} else {
  Write-Host "`n❌ E2E failed. Check artifacts:"
  Write-Host "   $apiLog"
  Write-Host "   $uiLog"
  Write-Host "   xbytechat-ui\\playwright-report (if generated)"
  exit 1
}
