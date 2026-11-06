# Probar Kelvo Hermes en Windows (guía para Alejandro)

Tu Claude sigue esta guía contigo, paso a paso. Vas a probar la app con la que Diego hace la demo de Greenlab del lunes 9-nov: Hermes Desktop con la marca Kelvo, conectada al modelo de gpu-01. En Windows se llama «Kelvo Hermes»; adentro dice Kelvo. Entras al mismo perfil de la demo, greenlab, y tus conversaciones quedan junto a las de Diego. Por eso **no pauses, borres ni ejecutes las rutinas de Tareas**, y no borres conversaciones que no sean tuyas. Critica todo: lo que sobra, lo que confunde y lo que falla.

Necesitas Windows 10 u 11 de 64 bits, Tailscale y tu usuario en la plataforma de Kelvo. No hace falta ser administrador ni compilar nada. Son cuatro pasos y toman unos 7 minutos.

Para tu Claude: los comandos son de PowerShell. El token no se escribe, no se lee y no se pega en la conversación. Sólo pasa por el portapapeles hacia el script.

## 1. Tailscale en la tailnet de Kelvo (1 minuto)

Abre Tailscale desde el ícono de la bandeja del sistema (abajo a la derecha) y revisa la cuenta activa. Tiene que ser la tailnet de **Kelvo**. Si estás en la de Battex, cambia de cuenta desde ese mismo menú. Si no tienes cuenta en la de Kelvo, pídele a Diego que te invite.

Para comprobarlo, abre https://gpu-01.tail3ecca3.ts.net/desktop/ en el navegador. Tiene que abrir una lista de archivos.

## 2. Copiar el token (unos segundos)

Diego te manda el token por un canal privado; no va en esta guía ni en el Drive. Cópialo con Ctrl+C.

## 3. Pegar un comando (2 a 4 minutos)

Abre PowerShell (tecla Windows, escribe «PowerShell», Enter) y pega esta línea:

```powershell
$f="$env:TEMP\instalar-kelvo-hermes.ps1"; iwr -UseBasicParsing https://gpu-01.tail3ecca3.ts.net/desktop/instalar-kelvo-hermes.ps1 -OutFile $f; powershell -ExecutionPolicy Bypass -File $f
```

El script hace todo lo demás, en cinco pasos que va mostrando:
1. toma el token del portapapeles, sin mostrarlo;
2. baja el instalador desde gpu-01, unos 140 MB;
3. revisa que la descarga esté entera (sha256);
4. instala la app sólo para tu usuario, sin pedir administrador, en `%LOCALAPPDATA%\Programs\Kelvo Hermes`, con accesos en el menú Inicio y el escritorio;
5. guarda el token en el Administrador de credenciales de Windows (Credenciales web, `kelvo-gateway`), vacía el portapapeles y abre Kelvo Hermes.

Como el instalador se baja con PowerShell, Windows no muestra el aviso de SmartScreen.

La app tiene que abrir conectada, en español, con la marca Kelvo y con la barra de estado «gpu-01 · motor 0.23.0 · 0 salieron del computador».

Si el script dice que no pudo bajar el instalador, revisa Tailscale (paso 1). Si dice que el portapapeles no tiene el token, cópialo de nuevo y vuelve a pegar la línea. Si la app abre en «Configurar Kelvo» o con un asistente para elegir proveedor, no elijas nada y avísale a Diego: puede faltar la llave del modelo en la caja.

Para tu Claude, si hay que diagnosticar: el registro de la app está en `%LOCALAPPDATA%\hermes\logs\desktop.log`. La línea `[kelvo] gateway remoto:` dice si la app encontró el token: «https://gpu-01… con el token kelvo-gateway del llavero» si lo encontró, o «sin token kelvo-gateway en el llavero» si no. Esa línea nunca trae el token.

Para reinstalar una versión nueva, pega la misma línea; si no copiaste un token, usa el que ya quedó guardado.

## 4. La llave de la Bandeja (2 minutos)

La Bandeja de solicitudes habla con la plataforma con tu propia llave `kv_`.

1. En la plataforma de Kelvo, entra a **Mi configuración**, sección 1, «Para Claude Code o si tu cliente no hace OAuth», y presiona **Generar llave**. Ojo: no es la sección 8, «Llaves de la caja». La llave se muestra una sola vez, y generar otra invalida la anterior.
2. Cópiala (Ctrl+C) y pega en PowerShell:

   ```powershell
   $g="$env:TEMP\llavero-socio.ps1"; iwr -UseBasicParsing https://gpu-01.tail3ecca3.ts.net/desktop/llavero-socio.ps1 -OutFile $g; powershell -ExecutionPolicy Bypass -File $g estudio
   ```

   La guarda en el Administrador de credenciales (Credenciales web, `kelvo-estudio`) sin mostrarla y vacía el portapapeles. La Bandeja la toma sola en unos segundos.

## 5. Qué probar

- Una conversación nueva, con una pregunta que necesite herramientas. Por ejemplo: «¿En qué licitaciones del MMA de 2026 perdimos ofertando más caro que el ganador? Grafícalo».
- La tarjeta Agentes que aparece sobre el compositor, con Orientar y Detener.
- Capacidades › Conexiones.
- La Bandeja, con las solicitudes y «Dar acceso a un cliente». No apruebes ni devuelvas solicitudes de la demo.
- Tareas: mira las rutinas y su detalle, sin pausarlas, borrarlas ni ejecutarlas.
- El panel derecho con las salidas: html, png y pdf.
- Lo propio de Windows: ventanas, menús, acentos, el ícono, el acceso del menú Inicio, y cerrar y volver a abrir la app.

## 6. Reportar

Cada problema y cada crítica va como un pendiente en la plataforma, uno por cosa. Tu Claude lo crea con el MCP de Kelvo:

- `crear_pendiente` con **«Kelvo Hermes»** en el título, en una línea. Por ejemplo: «Kelvo Hermes: la Bandeja no muestra…», «Kelvo Hermes (Windows): sobra el botón…»;
- dueño Diego Mir y trabajo `rediseno-plataforma-y-desktop`;
- en el detalle: qué hiciste, qué esperabas y qué pasó, más una captura si sirve.

Nada de datos reales de Greenlab en los reportes, y nunca el token.

## Igual que en el Mac, y lo que cambia en Windows

La app es la misma que usa Diego en el Mac, armada de la misma rama: mismas vistas, Bandeja, Salidas con vista previa, Tareas, Agentes, Conexiones y el perfil greenlab. Lo que cambia por ser Windows:

- No hay barra de menú. Los botones de minimizar, maximizar y cerrar quedan arriba a la derecha, dentro de la ventana, y los atajos usan Ctrl en vez de Cmd.
- Las llaves quedan en el Administrador de credenciales (Credenciales web) en vez del Llavero.
- Los datos quedan en `%APPDATA%\Kelvo-Hermes`.
- El instalador no está firmado. Por el comando no aparece SmartScreen; si lo abres desde el navegador, sí.

Si ves otra diferencia con lo que muestra Diego, repórtala como pendiente con «Kelvo Hermes (Windows)» en el título.

## Si el comando no sirve: a mano

En https://gpu-01.tail3ecca3.ts.net/desktop/ están `Kelvo-Hermes-socios-win-x64.exe`, su `.sha256` y `llavero-socio.ps1`. Abre el .exe; como viene del navegador, SmartScreen avisa «Windows protegió su PC»: haz clic en Más información y luego en Ejecutar de todas formas. Después copia el token y corre `powershell -ExecutionPolicy Bypass -File "$env:USERPROFILE\Downloads\llavero-socio.ps1"`.

## Desinstalar

Configuración › Aplicaciones › Kelvo Hermes › Desinstalar. A propósito quedan la carpeta de datos `%APPDATA%\Kelvo-Hermes` y el token en el Administrador de credenciales, para que una reinstalación abra igual. Si quieres borrarlos, hazlo a mano.
