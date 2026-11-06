# Probar Kelvo Hermes en Windows (guía para Alejandro)

Tu Claude sigue esta guía contigo, paso a paso. Vas a probar la app con la que Diego hace la demo de Greenlab del lunes 9-nov: Hermes Desktop con la marca Kelvo, conectada al modelo de gpu-01. En Windows se llama «Kelvo Hermes»; adentro dice Kelvo. Entras al mismo perfil de la demo, greenlab, y tus conversaciones quedan junto a las de Diego. Por eso **no pauses, borres ni ejecutes las rutinas de Tareas**, y no borres conversaciones que no sean tuyas. Critica todo: lo que sobra, lo que confunde y lo que falla.

Lo que necesitas: Windows 10 u 11 de 64 bits (x64), Tailscale y PowerShell. No hace falta ser administrador ni compilar nada.

Para tu Claude: los comandos son de PowerShell. El token no se escribe, no se lee y no se pega en la conversación. Sólo pasa por el portapapeles hacia `llavero-socio.ps1`.

## 1. Tailscale: la tailnet de Kelvo

1. Abre Tailscale desde el ícono de la bandeja del sistema (abajo a la derecha) y revisa la cuenta activa. Tiene que ser la tailnet de **Kelvo**. Si estás en la de Battex, cambia de cuenta desde ese mismo menú. Si no tienes cuenta en la de Kelvo, pídele a Diego que te invite.
2. Para comprobarlo, abre https://gpu-01.tail3ecca3.ts.net/desktop/ en el navegador. Tiene que abrir una lista de archivos.

## 2. Descargar y revisar

1. Desde https://gpu-01.tail3ecca3.ts.net/desktop/ descarga estos tres archivos a `Descargas`:
   - `Kelvo-Hermes-socios-win-x64.exe`
   - `Kelvo-Hermes-socios-win-x64.exe.sha256`
   - `llavero-socio.ps1`

   Si Edge dice que el archivo «no se descarga con frecuencia», elige «…» › Conservar › Conservar de todas formas.
2. Revisa que la descarga esté entera. En PowerShell:

   ```powershell
   cd $env:USERPROFILE\Downloads
   (Get-FileHash .\Kelvo-Hermes-socios-win-x64.exe -Algorithm SHA256).Hash.ToLower() -eq (Get-Content .\Kelvo-Hermes-socios-win-x64.exe.sha256).Split(' ')[0]
   ```

   Tiene que decir `True`. Si dice `False`, bórralo y descárgalo de nuevo.

## 3. Instalar

1. Abre `Kelvo-Hermes-socios-win-x64.exe` con doble clic.
2. El instalador no está firmado, así que Windows muestra «Windows protegió su PC» (SmartScreen). Haz clic en **Más información** y luego en **Ejecutar de todas formas**. Es esperable: la app no se compró un certificado de firma para esta prueba.
3. Sigue el instalador: Siguiente y Terminar. No pide administrador. Queda en `%LOCALAPPDATA%\Programs\Kelvo Hermes`, con accesos en el menú Inicio y el escritorio.

## 4. Guardar el token

1. Diego te manda el token por un canal privado. No va en esta guía ni en el Drive.
2. Cópialo (Ctrl+C) y corre en PowerShell:

   ```powershell
   powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\llavero-socio.ps1"
   ```

   Lo guarda en el Administrador de credenciales de Windows (Credenciales web, `kelvo-gateway`) sin mostrarlo y vacía el portapapeles. Al final revisa si gpu-01 responde por Tailscale.

## 5. Abrir

Abre «Kelvo Hermes» desde el menú Inicio. Tiene que abrir conectada, en español, con la marca Kelvo y con la barra de estado «gpu-01 · motor 0.23.0 · 0 salieron del computador». La primera vez puede demorar unos segundos.

Si sale «Configurar Kelvo» o un asistente para elegir proveedor, no elijas nada. Cierra la app y revisa:
- que Tailscale esté en la tailnet de Kelvo (paso 1);
- que el token esté guardado: Panel de control › Administrador de credenciales › Credenciales web, tiene que aparecer `kelvo-gateway`. Si no aparece, repite el paso 4.

Si sigue igual, avísale a Diego. Puede faltar la llave del modelo en la caja.

## 6. Qué probar

- Una conversación nueva, con una pregunta que necesite herramientas. Por ejemplo: «¿En qué licitaciones del MMA de 2026 perdimos ofertando más caro que el ganador? Grafícalo».
- La tarjeta Agentes que aparece sobre el compositor, con Orientar y Detener.
- Capacidades › Conexiones.
- La Bandeja. En Windows pide una llave de la plataforma que no tienes, así que lo normal es que diga que falta la llave; anótalo sólo si muestra otra cosa.
- Tareas: mira las rutinas y su detalle, sin pausarlas, borrarlas ni ejecutarlas.
- El panel derecho con las salidas: html, png y pdf.
- Lo propio de Windows: ventanas, menús, acentos, el ícono, el acceso del menú Inicio, y cerrar y volver a abrir la app.

## 7. Reportar

Cada problema y cada crítica va como un pendiente en la plataforma, uno por cosa. Tu Claude lo crea con el MCP de Kelvo:

- `crear_pendiente` con **«Kelvo Hermes»** en el título, en una línea. Por ejemplo: «Kelvo Hermes: la Bandeja no muestra…», «Kelvo Hermes (Windows): sobra el botón…»;
- dueño Diego Mir y trabajo `rediseno-plataforma-y-desktop`;
- en el detalle: qué hiciste, qué esperabas y qué pasó, más una captura si sirve.

Nada de datos reales de Greenlab en los reportes, y nunca el token.

## Si hay que desinstalar

Configuración › Aplicaciones › Kelvo Hermes › Desinstalar. Quedan dos cosas, a propósito, para que una reinstalación abra igual: la carpeta de datos `%APPDATA%\Kelvo-Hermes` y el token en el Administrador de credenciales (`kelvo-gateway`). Si quieres borrarlas, bórralas a mano.
