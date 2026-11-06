// Tema «Kelvo grafito» para Hermes Desktop (variante B de la decisión del 5-nov-2026,
// 03-producto/decisiones/2026-11-05-desktop-sobre-hermes-desktop.md).
//
// Es un preset con la forma de `DesktopTheme` de Hermes Desktop (apps/desktop/src/themes/types.ts:96-115,
// commit 323c318 de NousResearch/hermes-agent). Se deriva del tema Mono de Hermes: la paleta oscura es la de
// Mono tal cual (apps/shared/src/theme-presets.ts:469-496); la paleta clara se escribe a mano porque Mono no
// trae una y Hermes la sintetiza desde el `ring` (src/themes/context.tsx:152-186). Fuente del sistema (la
// misma pila que `DEFAULT_TYPOGRAPHY` en src/themes/presets.ts:32-46); esquinas, sombras y densidad las pone
// Hermes (`--shadow-nous`, `--stroke-nous` son fijos en src/styles.css:187-194) y este tema no las toca.
//
// El naranjo de la marca (#FF4D00) no entra en la paleta: ningún control lo deriva. Entra sólo por `customCSS`,
// en dos lugares, el punto del logotipo «kelvo·» y el contador de soberanía «N salieron del computador». El
// plugin de Kelvo marca esos dos nodos con las clases `kelvo-logo` y `kelvo-soberania`; nada más las usa.
//
// Cómo entra a Hermes: (a) como tema de fábrica, agregándolo a `BUILTIN_THEMES` en src/themes/presets.ts:444
// (parche 11 de la lista KD-0.3), o (b) sin parche, contribuido por el plugin de Kelvo al área `themes`
// (src/themes/user-themes.ts:131-147). Para el paso cero sin fork, el mismo contenido se vuelca a una skin
// YAML en ~/Kelvo/.motor/skins/kelvo-grafito.yaml (electron/local-skin.ts:153-171), que acepta CSS crudo.
//
// Este archivo no importa nada de Hermes para que se pueda leer y comprobar desde el repo kelvo; los tipos
// de abajo copian los campos que Hermes exige y nada más.

export interface ColoresDeTema {
  background: string
  foreground: string
  card: string
  cardForeground: string
  muted: string
  mutedForeground: string
  popover: string
  popoverForeground: string
  primary: string
  primaryForeground: string
  secondary: string
  secondaryForeground: string
  accent: string
  accentForeground: string
  border: string
  input: string
  ring: string
  destructive: string
  destructiveForeground: string
  midground?: string
  midgroundForeground?: string
  composerRing?: string
  sidebarBackground?: string
  sidebarBorder?: string
  userBubble?: string
  userBubbleBorder?: string
}

export interface TemaDeHermes {
  name: string
  label: string
  description: string
  colors: ColoresDeTema
  darkColors?: ColoresDeTema
  typography?: { fontSans?: string; fontMono?: string; fontUrl?: string }
  customCSS?: string
}

/** El único naranjo de Kelvo. Sólo lo usan el logotipo y el contador de soberanía. */
export const BRASA = '#FF4D00'

const EMOJI = '"Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji", emoji'

// Las mismas pilas que Hermes usa por defecto (src/themes/presets.ts:32-46): fuente del sistema para la
// interfaz y JetBrains Mono, empaquetada con la app, para lo monoespaciado.
const FUENTE_SISTEMA =
  '"Segoe WPC", "Segoe UI", -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", system-ui, sans-serif, ' +
  EMOJI

const FUENTE_MONO =
  '"JetBrains Mono", "Cascadia Code", "Cascadia Mono", "DejaVu Sans Mono", "Liberation Mono", "Noto Sans Mono", ' +
  '"Noto Mono", "SF Mono", ui-monospace, Menlo, Monaco, Consolas, monospace, ' +
  EMOJI

/**
 * Paleta clara. Grises neutros sin tinte y tinta casi negra como acento, igual que la página de propuestas
 * (cromo #f3f3f3, barra lateral #f0f0f0, editor #fafafa, tarjeta #ffffff, burbuja #ececec, tinta #1f1f22).
 * `ring` y `midground` llevan el gris medio que Mono usa de semilla (#9a9a9a) aclarado para contraste 4,5:1
 * sobre la barra lateral, que es lo que Hermes exige al reteñir (src/themes/retint.ts:127-129).
 */
export const CLARO: ColoresDeTema = {
  background: '#fafafa',
  foreground: '#161616',
  card: '#ffffff',
  cardForeground: '#161616',
  muted: '#ececec',
  mutedForeground: '#6b6b6b',
  popover: '#ffffff',
  popoverForeground: '#161616',
  primary: '#1f1f22',
  primaryForeground: '#ffffff',
  secondary: '#e4e4e4',
  secondaryForeground: '#303030',
  accent: '#ececec',
  accentForeground: '#1f1f22',
  border: '#d9d9d9',
  input: '#d9d9d9',
  ring: '#6b6b6b',
  midground: '#6b6b6b',
  midgroundForeground: '#ffffff',
  destructive: '#b94a3a',
  destructiveForeground: '#fef2f2',
  sidebarBackground: '#f0f0f0',
  sidebarBorder: '#e3e3e3',
  userBubble: '#ececec',
  userBubbleBorder: '#dcdcdc'
}

/** Paleta oscura: la de Mono de Hermes, sin cambios (apps/shared/src/theme-presets.ts:469-496). */
export const OSCURO: ColoresDeTema = {
  background: '#0e0e0e',
  foreground: '#eaeaea',
  card: '#141414',
  cardForeground: '#eaeaea',
  muted: '#1e1e1e',
  mutedForeground: '#808080',
  popover: '#181818',
  popoverForeground: '#eaeaea',
  primary: '#eaeaea',
  primaryForeground: '#0e0e0e',
  secondary: '#262626',
  secondaryForeground: '#c8c8c8',
  accent: '#222222',
  accentForeground: '#d8d8d8',
  border: '#2a2a2a',
  input: '#2a2a2a',
  ring: '#9a9a9a',
  midground: '#9a9a9a',
  destructive: '#a84040',
  destructiveForeground: '#fef2f2',
  sidebarBackground: '#0a0a0a',
  sidebarBorder: '#202020',
  userBubble: '#1a1a1a',
  userBubbleBorder: '#363636'
}

/**
 * Lo único que se inyecta aparte de la paleta. Hermes lo mete como <style id="hermes-desktop-custom-css">
 * al aplicar el tema (src/themes/context.tsx:432-449). La variable queda disponible por si una vista de
 * Kelvo la necesita, pero la regla es que sólo estos dos selectores la lean.
 */
export const CSS_BRASA = `
:root { --kelvo-brasa: ${BRASA}; }
.kelvo-logo i { background: var(--kelvo-brasa); }
.kelvo-soberania { color: var(--kelvo-brasa); font-weight: 500; }
`.trim()

export const kelvoGrafito: TemaDeHermes = {
  name: 'kelvo-grafito',
  label: 'Kelvo grafito',
  description: 'Grises neutros y acento tinta, derivado de Mono; el naranjo de Kelvo sólo en el logotipo y en el contador de soberanía',
  colors: CLARO,
  darkColors: OSCURO,
  typography: { fontSans: FUENTE_SISTEMA, fontMono: FUENTE_MONO },
  customCSS: CSS_BRASA
}

export default kelvoGrafito
