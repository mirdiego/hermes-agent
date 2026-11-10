; kelvo: parches W1 y W3, instalador de Windows de «Kelvo» (variante light, sólo remota), en español y sin firma.
;
; Hermes Desktop arma MSIX en Windows, que exige firma. Este instalador NSIS envuelve la carpeta que deja
; `npm run builder -- --dir --win --x64` (release/win-unpacked). Lo arma .github/workflows/kelvo-windows.yml:
;
;   makensis /DORIGEN=<win-unpacked> /DICONO=<icon.ico> /DSALIDA=<instalador.exe> /DVERSION=0.23.0 kelvo.nsi
;
; Instala por usuario (sin pedir administrador) en %LOCALAPPDATA%\Programs\Kelvo: ruta corta, lejos del
; límite de 260 caracteres. Los datos de la app quedan en %APPDATA%\Kelvo-Hermes (parche 20) y el token en el
; Administrador de credenciales (parche W1); desinstalar no borra ninguno de los dos.

Unicode true
ManifestDPIAware true

!ifndef ORIGEN
  !error "Falta /DORIGEN=<carpeta win-unpacked>"
!endif
!ifndef ICONO
  !error "Falta /DICONO=<icon.ico>"
!endif
!ifndef SALIDA
  !define SALIDA "Kelvo-socios-win-x64.exe"
!endif
!ifndef VERSION
  !define VERSION "0.23.0"
!endif

!define NOMBRE "Kelvo"
!define EJECUTABLE "Kelvo.exe"
!define DESINSTALADOR "Desinstalar Kelvo.exe"
; La clave se llama igual que cuando la app era «Kelvo Hermes»: así Aplicaciones muestra una sola entrada.
!define CLAVE_DESINSTALAR "Software\Microsoft\Windows\CurrentVersion\Uninstall\KelvoHermes"
; Lo que dejaba la versión que se llamaba «Kelvo Hermes» (parche W3 lo borra al instalar).
!define VIEJO_NOMBRE "Kelvo Hermes"
!define VIEJO_DIR "$LOCALAPPDATA\Programs\Kelvo Hermes"

!include "MUI2.nsh"

Name "${NOMBRE}"
Caption "Instalar ${NOMBRE}"
UninstallCaption "Desinstalar ${NOMBRE}"
OutFile "${SALIDA}"
InstallDir "$LOCALAPPDATA\Programs\Kelvo"
RequestExecutionLevel user
SetCompressor /SOLID lzma
BrandingText "Kelvo"
ShowInstDetails nevershow
ShowUninstDetails nevershow

VIProductVersion "${VERSION}.0"
VIFileVersion "${VERSION}.0"
VIAddVersionKey /LANG=1034 "ProductName" "${NOMBRE}"
VIAddVersionKey /LANG=1034 "CompanyName" "Kelvo"
VIAddVersionKey /LANG=1034 "LegalCopyright" "Copyright © 2026 Kelvo"
VIAddVersionKey /LANG=1034 "FileDescription" "Instalador de ${NOMBRE}"
VIAddVersionKey /LANG=1034 "FileVersion" "${VERSION}"
VIAddVersionKey /LANG=1034 "ProductVersion" "${VERSION}"

!define MUI_ICON "${ICONO}"
!define MUI_UNICON "${ICONO}"
!define MUI_ABORTWARNING

!define MUI_WELCOMEPAGE_TITLE "Kelvo"
!define MUI_WELCOMEPAGE_TEXT "Se va a instalar Kelvo, la app de Kelvo conectada al modelo de gpu-01.$\r$\n$\r$\nSe instala sólo para tu usuario y no pide permisos de administrador. Si la app está abierta, se cierra.$\r$\n$\r$\nPresiona Siguiente para continuar."
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_TITLE "Kelvo quedó instalada"
!define MUI_FINISHPAGE_TEXT "Antes de abrirla, guarda el token con llavero-socio.ps1 (lo explica la guía).$\r$\n$\r$\nDespués ábrela desde el menú Inicio o el escritorio: «Kelvo»."
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Spanish"

!macro CerrarApp
  ; Por ruta y no por nombre (parche W4): el Kelvo Desktop anterior (0.2.x, en Programs\kelvo-desktop) también es Kelvo.exe.
  nsExec::Exec `"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -Command "Get-Process -Name 'Kelvo' -ErrorAction SilentlyContinue | Where-Object { $$_.Path -like '$INSTDIR\*' } | Stop-Process -Force"`
  Pop $0
  nsExec::Exec '"$SYSDIR\taskkill.exe" /IM "${VIEJO_NOMBRE}.exe" /F /T'
  Pop $0
  Sleep 800
!macroend

Section "Kelvo" SeccionApp
  !insertmacro CerrarApp

  ; La versión «Kelvo Hermes» se reemplaza entera: carpeta, accesos y ancla de la barra de tareas. Los datos
  ; (%APPDATA%\Kelvo-Hermes) y el token del Administrador de credenciales no se tocan.
  RMDir /r "${VIEJO_DIR}"
  Delete "$SMPROGRAMS\${VIEJO_NOMBRE}.lnk"
  Delete "$DESKTOP\${VIEJO_NOMBRE}.lnk"
  Delete "$APPDATA\Microsoft\Internet Explorer\Quick Launch\User Pinned\TaskBar\${VIEJO_NOMBRE}.lnk"

  ; Una versión anterior no debe dejar archivos sueltos entre los nuevos.
  RMDir /r "$INSTDIR\resources"
  RMDir /r "$INSTDIR\locales"

  SetOutPath "$INSTDIR"
  File /r "${ORIGEN}\*.*"

  WriteUninstaller "$INSTDIR\${DESINSTALADOR}"

  CreateShortcut "$SMPROGRAMS\${NOMBRE}.lnk" "$INSTDIR\${EJECUTABLE}" "" "$INSTDIR\${EJECUTABLE}" 0
  CreateShortcut "$DESKTOP\${NOMBRE}.lnk" "$INSTDIR\${EJECUTABLE}" "" "$INSTDIR\${EJECUTABLE}" 0

  WriteRegStr HKCU "${CLAVE_DESINSTALAR}" "DisplayName" "${NOMBRE}"
  WriteRegStr HKCU "${CLAVE_DESINSTALAR}" "DisplayVersion" "${VERSION}"
  WriteRegStr HKCU "${CLAVE_DESINSTALAR}" "Publisher" "Kelvo"
  WriteRegStr HKCU "${CLAVE_DESINSTALAR}" "DisplayIcon" "$INSTDIR\${EJECUTABLE}"
  WriteRegStr HKCU "${CLAVE_DESINSTALAR}" "InstallLocation" "$INSTDIR"
  WriteRegStr HKCU "${CLAVE_DESINSTALAR}" "UninstallString" '"$INSTDIR\${DESINSTALADOR}"'
  WriteRegStr HKCU "${CLAVE_DESINSTALAR}" "QuietUninstallString" '"$INSTDIR\${DESINSTALADOR}" /S'
  WriteRegDWORD HKCU "${CLAVE_DESINSTALAR}" "NoModify" 1
  WriteRegDWORD HKCU "${CLAVE_DESINSTALAR}" "NoRepair" 1
SectionEnd

Section "Uninstall"
  !insertmacro CerrarApp

  Delete "$SMPROGRAMS\${NOMBRE}.lnk"
  Delete "$DESKTOP\${NOMBRE}.lnk"
  RMDir /r "$INSTDIR"
  DeleteRegKey HKCU "${CLAVE_DESINSTALAR}"
SectionEnd
