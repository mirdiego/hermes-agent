# Instala Kelvo Hermes en Windows en un solo paso: baja el instalador de gpu-01 por Tailscale, revisa su sha256,
# lo instala para tu usuario, guarda el token del gateway que copiaste y abre la app.
#
#   1. Copia el token (Ctrl+C) desde el mensaje de Diego.
#   2. En PowerShell pega el comando de la guía, que baja este archivo y lo corre.
#
# El token pasa del portapapeles al Administrador de credenciales («Credenciales web», recurso kelvo-gateway, usuario
# diego) sin imprimirse, y el portapapeles queda vacío. Si ya lo guardaste antes, puedes correrlo sin copiar nada:
# sólo reinstala. Bajado con PowerShell, el instalador no trae la marca de Internet, así que SmartScreen no lo frena.
param(
  [string]$Base = 'https://gpu-01.tail3ecca3.ts.net/desktop',
  [switch]$SinAbrir
)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

if ($PSVersionTable.PSEdition -ne 'Desktop') {
  # PasswordVault sólo carga en Windows PowerShell 5.1.
  $resto = @('-Base', $Base); if ($SinAbrir) { $resto += '-SinAbrir' }
  & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File $PSCommandPath @resto
  exit $LASTEXITCODE
}

$nombre = 'Kelvo-Hermes-socios-win-x64.exe'
$recurso = 'kelvo-gateway'
$usuario = 'diego'
$carpeta = Join-Path $env:LOCALAPPDATA 'Programs\Kelvo Hermes'
$app = Join-Path $carpeta 'Kelvo Hermes.exe'

function Paso($n, $texto) { Write-Host "[$n/5] $texto" -ForegroundColor Cyan }
function Falla($texto) { Write-Host $texto -ForegroundColor Red; exit 1 }

[void][Windows.Security.Credentials.PasswordVault, Windows.Security.Credentials, ContentType = WindowsRuntime]
$boveda = New-Object Windows.Security.Credentials.PasswordVault

Paso 1 'Token del portapapeles'
$token = Get-Clipboard -Raw
if ($null -ne $token) { $token = $token -replace '\s', '' }
if ([string]::IsNullOrEmpty($token) -or $token.Length -lt 16 -or $token.Length -gt 512) {
  $token = $null
  $previo = $null
  try { $previo = $boveda.Retrieve($recurso, $usuario) } catch { }
  if (-not $previo) { Falla 'El portapapeles no tiene el token. Cópialo del mensaje de Diego (Ctrl+C) y vuelve a pegar el comando.' }
  Write-Host '      No copiaste un token nuevo: uso el que ya estaba guardado.'
} else {
  Write-Host '      Token encontrado (no se muestra).'
}

Paso 2 'Bajar el instalador desde gpu-01'
$tmp = Join-Path $env:TEMP 'kelvo-hermes'
New-Item -ItemType Directory -Force $tmp | Out-Null
try {
  Invoke-WebRequest -UseBasicParsing -Uri "$Base/$nombre.sha256" -OutFile (Join-Path $tmp "$nombre.sha256")
  Invoke-WebRequest -UseBasicParsing -Uri "$Base/$nombre" -OutFile (Join-Path $tmp $nombre)
} catch {
  Falla "No pude bajar $Base/$nombre. Revisa que Tailscale esté conectado a la tailnet de Kelvo (no la de Battex) y vuelve a intentar."
}

Paso 3 'Revisar que la descarga esté entera (sha256)'
$esperado = ((Get-Content -Raw (Join-Path $tmp "$nombre.sha256")) -split '\s+')[0].ToLower()
$real = (Get-FileHash -Algorithm SHA256 (Join-Path $tmp $nombre)).Hash.ToLower()
if ($esperado -ne $real) { Falla 'La descarga llegó incompleta (sha256 distinto). Vuelve a pegar el comando.' }
Write-Host '      Bien.'

Paso 4 'Instalar (sólo para tu usuario, sin administrador)'
$p = Start-Process -FilePath (Join-Path $tmp $nombre) -ArgumentList '/S' -Wait -PassThru
if ($p.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $app)) { Falla "El instalador terminó con código $($p.ExitCode). Avísale a Diego." }
Remove-Item -Recurse -Force $tmp

Paso 5 'Guardar el token en el Administrador de credenciales'
if ($token) {
  try { $boveda.Remove($boveda.Retrieve($recurso, $usuario)) } catch { }
  $boveda.Add((New-Object Windows.Security.Credentials.PasswordCredential($recurso, $usuario, $token)))
  Remove-Variable token
  Add-Type -AssemblyName System.Windows.Forms
  [System.Windows.Forms.Clipboard]::Clear()
  Write-Host '      Guardado (Credenciales web, kelvo-gateway). Portapapeles vaciado.'
} else {
  Write-Host '      Se mantiene el token guardado antes.'
}

Write-Host 'Listo: Kelvo Hermes quedó instalada (menú Inicio y escritorio).' -ForegroundColor Green
if (-not $SinAbrir) {
  Start-Process -FilePath $app
  Write-Host 'Abriendo Kelvo Hermes...' -ForegroundColor Green
}
