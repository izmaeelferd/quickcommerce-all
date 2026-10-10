# One-command local demo for Windows (PowerShell). Requires Docker Desktop.
#   powershell -ExecutionPolicy Bypass -File scripts\demo.ps1          # this PC only
#   powershell -ExecutionPolicy Bypass -File scripts\demo.ps1 -Lan     # also reachable from phones on the same Wi-Fi
#   powershell -ExecutionPolicy Bypass -File scripts\demo.ps1 -Stop    # stop (data kept)
#   powershell -ExecutionPolicy Bypass -File scripts\demo.ps1 -Reset   # stop and DELETE demo data
param([switch]$Lan, [switch]$Stop, [switch]$Reset)
$ErrorActionPreference = 'Stop'
Set-Location (Split-Path -Parent $PSScriptRoot)
$dc = @('compose', '-f', 'docker-compose.demo.yml')

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { Write-Host 'Install Docker Desktop first: https://docs.docker.com/desktop/'; exit 1 }
if ($Stop)  { docker @dc down; exit 0 }
if ($Reset) { docker @dc down -v; exit 0 }
if (-not (Test-Path 'demo/web/customer/index.html')) { Write-Host 'demo/web is missing. Use the all-in-one zip, or build it with scripts/build-web-demo.sh'; exit 1 }

$hostName = 'localhost'
if ($Lan) {
  $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1).IPAddress
  if (-not $ip) { Write-Host 'Could not detect the LAN IP. Set $env:DEMO_HOST and $env:BIND_HOST=0.0.0.0 manually.'; exit 1 }
  $hostName = $ip
  $env:BIND_HOST = '0.0.0.0'
}
if (-not $env:DEMO_HOST) { $env:DEMO_HOST = $hostName }
$adminPw = if ($env:DEMO_ADMIN_PASSWORD) { $env:DEMO_ADMIN_PASSWORD } else { 'Admin@12345' }

Write-Host '> Starting containers (first run builds the API image; takes a few minutes)'
docker @dc up -d --build
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host '> Waiting for the API'
for ($i = 0; $i -lt 60; $i++) {
  docker @dc exec -T backend wget -qO- http://127.0.0.1:5000/api/health *> $null
  if ($LASTEXITCODE -eq 0) { break }
  Start-Sleep -Seconds 2
}
Write-Host '> Seeding demo data (safe to repeat)'
docker @dc exec -T backend node seeders/seedDatabase.js

$h = $env:DEMO_HOST
Write-Host ''
Write-Host 'Demo is running'
Write-Host "  Customer app      http://${h}:8080/customer/   customer@example.com / Password@123"
Write-Host "  Partner app       http://${h}:8080/partner/    vendor1@example.com  / Password@123"
Write-Host "  Rider app         http://${h}:8080/rider/      rider@example.com    / Password@123"
Write-Host "  Admin panel       http://${h}:5173             admin@yourapp.com    / $adminPw"
Write-Host "  Vendor dashboard  http://${h}:5174             vendor1@example.com  / Password@123"
Write-Host ''
Write-Host 'Stop: scripts\demo.ps1 -Stop     Wipe data: scripts\demo.ps1 -Reset'
