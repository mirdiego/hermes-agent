; kelvo: parche W1, instalador de Windows de «Kelvo Hermes» (variante light, sólo remota), en español y sin firma.
;
; Hermes Desktop arma MSIX en Windows, que exige firma. Este instalador NSIS envuelve la carpeta que deja
; `npm run builder -- --dir --win --x64` (release/win-unpacked). Lo arma .github/workflows/kelvo-windows.yml:
;
;   makensis /DORIGEN=<win-unpacked> /DICONO=<icon.ico> /DSALIDA=<instalador.exe> /DVERSION=0.23.0 kelvo-hermes.nsi
;
; Instala por usuario (sin pedir administrador) en %LOCALAPPDATA%\Programs\Kelvo Hermes: ruta corta, lejos del
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
  !define SALIDA "Kelvo-Hermes-socios-win-x64.exe"
!endif
!ifndef VERSION
  !define VERSION "0.23.0"
!endif

!define NOMBRE "Kelvo Hermes"
!define EJECUTABLE "Kelvo Hermes.exe"
!define DESINSTALADOR "Desinstalar Kelvo Hermes.exe"
!define CLAVE_DESINSTALAR "Software\Microsoft\Windows\CurrentVersion\Uninstall\KelvoHermes"

!include "MUI2.nsh"

Name "${NOMBRE}"
Caption "Instalar ${NOMBRE}"
UninstallCaption "Desinstalar ${NOMBRE}"
OutFile "${SALIDA}"
InstallDir "$LOCALAPPDATA\Programs\Kelvo Hermes"
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

!define MUI_WELCOMEPAGE_TITLE "Kelvo Hermes"
!define MUI_WELCOMEPAGE_TEXT "Se va a instalar Kelvo Hermes, la app de Kelvo conectada al modelo de gpu-01.$\r$\n$\r$\nSe instala sólo para tu usuario y no pide permisos de administrador. Si la app está abierta, se cierra.$\r$\n$\r$\nPresiona Siguiente para continuar."
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_INSTFILES

!define MUI_FINISHPAGE_TITLE "Kelvo Hermes quedó instalada"
!define MUI_FINISHPAGE_TEXT "Antes de abrirla, guarda el token con llavero-socio.ps1 (lo explica la guía).$\r$\n$\r$\nDespués ábrela desde el menú Inicio o el escritorio: «Kelvo Hermes»."
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

!insertmacro MUI_LANGUAGE "Spanish"

!macro CerrarApp
  nsExec::Exec '"$SYSDIR\taskkill.exe" /IM "${EJECUTABLE}" /F /T'
  Pop $0
  Sleep 800
!macroend

Section "Kelvo Hermes" SeccionApp
  !insertmacro CerrarApp

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
