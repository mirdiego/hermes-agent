# Guarda en el Administrador de credenciales de Windows el token del gateway de Kelvo que Diego te mandó por un canal
# privado, sin mostrarlo. Es el equivalente de llavero-socio.sh del Mac.
#
#   1. Copia el token (Ctrl+C) desde el mensaje de Diego.
#   2. En PowerShell:  powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\llavero-socio.ps1"
#
# Lo guarda en «Credenciales web» con el recurso kelvo-gateway y el usuario «diego» (es sólo la etiqueta que busca la
# app, igual en todas las instalaciones) y vacía el portapapeles. El token no se imprime ni queda en el historial.
$ErrorActionPreference = 'Stop'

if ($PSVersionTable.PSEdition -ne 'Desktop') {
  # PasswordVault sólo carga en Windows PowerShell 5.1; desde PowerShell 7 se vuelve a lanzar ahí.
  & "$env:SystemRoot\System32\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -ExecutionPolicy Bypass -File $PSCommandPath
  exit $LASTEXITCODE
}

$recurso = 'kelvo-gateway'
$usuario = 'diego'

$valor = (Get-Clipboard -Raw)
if ($null -ne $valor) { $valor = $valor -replace '\s', '' }
if ([string]::IsNullOrEmpty($valor) -or $valor.Length -lt 16) {
  Write-Host 'El portapapeles no tiene el token. Cópialo del mensaje de Diego y vuelve a correr esto.' -ForegroundColor Red
  exit 1
}

[void][Windows.Security.Credentials.PasswordVault, Windows.Security.Credentials, ContentType = WindowsRuntime]
$boveda = New-Object Windows.Security.Credentials.PasswordVault

try {
  $boveda.Remove($boveda.Retrieve($recurso, $usuario))
} catch {
  # no había uno anterior
}
$boveda.Add((New-Object Windows.Security.Credentials.PasswordCredential($recurso, $usuario, $valor)))
Remove-Variable valor

Add-Type -AssemblyName System.Windows.Forms
[System.Windows.Forms.Clipboard]::Clear()

$guardado = $boveda.Retrieve($recurso, $usuario)
$guardado.RetrievePassword()
if ($guardado.Password.Length -lt 16) {
  Write-Host 'No quedó guardado. Avísale a Diego.' -ForegroundColor Red
  exit 1
}
Write-Host "Listo: token guardado en el Administrador de credenciales (Credenciales web, $recurso). Portapapeles vaciado." -ForegroundColor Green

$alcance = Test-NetConnection -ComputerName 'gpu-01.tail3ecca3.ts.net' -Port 8443 -InformationLevel Quiet -WarningAction SilentlyContinue
if ($alcance) {
  Write-Host 'gpu-01 responde por Tailscale. Ya puedes abrir Kelvo Hermes.' -ForegroundColor Green
} else {
  Write-Host 'gpu-01 no responde: revisa que Tailscale esté conectado a la tailnet de Kelvo (no la de Battex).' -ForegroundColor Yellow
}
