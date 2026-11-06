# Guarda en el Administrador de credenciales de Windows una llave de Kelvo copiada al portapapeles, sin mostrarla.
# Es el equivalente de llavero-socio.sh del Mac.
#
#   gateway (por defecto): el token del gateway que Diego te mandó por un canal privado.
#       powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\llavero-socio.ps1"
#   estudio: tu llave kv_ de la plataforma, para la Bandeja. Se genera en la plataforma, Mi configuración › sección 1
#       «Para Claude Code o si tu cliente no hace OAuth» › Generar llave (no la sección «Llaves de la caja»).
#       powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\llavero-socio.ps1" estudio
#
# Lo guarda en «Credenciales web» con el recurso kelvo-gateway o kelvo-estudio y el usuario «diego» (es sólo la
# etiqueta que busca la app, igual en todas las instalaciones) y vacía el portapapeles. La llave no se imprime.
param(
  [ValidateSet('gateway', 'estudio')]
  [string]$Modo = 'gateway'
)
$ErrorActionPreference = 'Stop'

if ($PSVersionTable.PSEdition -ne 'Desktop') {
  # PasswordVault sólo carga en Windows PowerShell 5.1; desde PowerShell 7 se vuelve a lanzar ahí.
  & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File $PSCommandPath $Modo
  exit $LASTEXITCODE
}

$recurso = "kelvo-$Modo"
$usuario = 'diego'

$texto = [string](Get-Clipboard -Raw)
if ($Modo -eq 'estudio') {
  $candidatos = @([regex]::Matches($texto, '(?<![A-Za-z0-9_-])kv_[A-Za-z0-9_-]{43}(?![A-Za-z0-9_-])') | ForEach-Object { $_.Value } | Select-Object -Unique)
  $mensaje = 'El portapapeles no tiene una llave kv_ válida. Genérala en la plataforma (Mi configuración › sección 1 › Generar llave), cópiala y vuelve a correr esto.'
} else {
  # 64 hexadecimales; se toma ese tramo aunque venga con texto o caracteres invisibles alrededor (WhatsApp).
  $candidatos = @([regex]::Matches($texto, '(?<![0-9a-fA-F])[0-9a-fA-F]{64}(?![0-9a-fA-F])') | ForEach-Object { $_.Value.ToLower() } | Select-Object -Unique)
  $mensaje = 'El token copiado no es válido. Copia sólo el token del mensaje de Diego y vuelve a correr esto.'
}
Remove-Variable texto
if ($candidatos.Count -ne 1) {
  Write-Host $mensaje -ForegroundColor Red
  exit 1
}
$valor = $candidatos[0]
$huella = -join ([Security.Cryptography.SHA256]::Create().ComputeHash([Text.Encoding]::ASCII.GetBytes($valor))[0..3] | ForEach-Object { $_.ToString('x2') })

[void][Windows.Security.Credentials.PasswordVault, Windows.Security.Credentials, ContentType = WindowsRuntime]
$boveda = New-Object Windows.Security.Credentials.PasswordVault

try {
  $boveda.Remove($boveda.Retrieve($recurso, $usuario))
} catch {
  # no había una anterior
}
$boveda.Add((New-Object Windows.Security.Credentials.PasswordCredential($recurso, $usuario, $valor)))

Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Clipboard]::Clear()

$guardado = $boveda.Retrieve($recurso, $usuario)
$guardado.RetrievePassword()
if ($guardado.Password -cne $valor) {
  Write-Host 'No quedó guardada igual a la copiada. Avísale a Diego.' -ForegroundColor Red
  exit 1
}
Remove-Variable valor, guardado
Write-Host "Listo: guardada en el Administrador de credenciales (Credenciales web, $recurso, huella $huella). Portapapeles vaciado." -ForegroundColor Green

if ($Modo -eq 'estudio') {
  Write-Host 'La Bandeja la toma sola en unos segundos; si no, cierra y vuelve a abrir Kelvo Hermes.' -ForegroundColor Green
  exit 0
}

$alcance = Test-NetConnection -ComputerName 'gpu-01.tail3ecca3.ts.net' -Port 8443 -InformationLevel Quiet -WarningAction SilentlyContinue
if (-not $alcance) {
  Write-Host 'gpu-01 no responde: revisa que Tailscale esté conectado a la tailnet de Kelvo (no la de Battex).' -ForegroundColor Yellow
}

# Si la app ya está instalada, se reabre para que tome el token nuevo.
$app = Join-Path $env:LOCALAPPDATA 'Programs\Kelvo Hermes\Kelvo Hermes.exe'
if (Test-Path -LiteralPath $app) {
  Get-Process -Name 'Kelvo Hermes' -ErrorAction SilentlyContinue | Stop-Process -Force
  Start-Sleep -Seconds 2
  Start-Process -FilePath $app
  Write-Host 'Abriendo Kelvo Hermes...' -ForegroundColor Green
}
