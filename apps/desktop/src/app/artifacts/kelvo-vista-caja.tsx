// kelvo: parche 38. «Ver aquí» para un .html de Salidas: se lee por el puente de archivos (el mismo que usa la
// vista previa) y se abre como pestaña de artifact en la conversación de la que salió. Corre en el iframe
// sandbox="allow-scripts" de los artifacts (origen opaco, sin acceso a la app) y además lleva una CSP propia que
// no deja salir nada a la red: ni internet ni la caja. El HTML no recibe llaves ni datos de la app.
//
// Vuelta atrás: revertir este commit (y los dos usos en artifacts/index.tsx y preview-artifact.tsx).

import { useState } from 'react'

import { sessionFileOwnerScope } from '@/api/client'
import { artifactContentHash } from '@/lib/artifact-detect'
import { isDesktopFsRemoteMode, readDesktopFileDataUrl } from '@/lib/desktop-fs'
import { getArtifact, openArtifact, selectArtifactVersion, upsertArtifact } from '@/store/artifacts'
import { artifactPreviewTarget } from '@/store/artifacts'
import { notifyError } from '@/store/notifications'
import { openPreview } from '@/store/preview'

/** Lo mismo que acepta la vista previa remota de Desktop. */
export const TOPE_HTML_BYTES = 16 * 1024 * 1024

/** Sólo lo que viene dentro del archivo: scripts y estilos en línea, imágenes y fuentes embebidas. */
export const CSP_CAJA = [
  "default-src 'none'",
  "script-src 'unsafe-inline' 'unsafe-eval' data: blob:",
  "style-src 'unsafe-inline' data: blob:",
  'img-src data: blob:',
  'font-src data:',
  'media-src data: blob:',
  'worker-src blob:',
  "connect-src 'none'",
  "frame-src 'none'",
  "child-src 'none'",
  "form-action 'none'",
  "base-uri 'none'"
].join('; ')

export function esHtml(ruta: string): boolean {
  return /\.html?$/i.test(ruta.trim()) && !/^https?:\/\//i.test(ruta.trim())
}

/** Pone la CSP como primer hijo del <head>, antes de cualquier script del documento. */
export function conCsp(html: string): string {
  const meta = `<meta http-equiv="Content-Security-Policy" content="${CSP_CAJA}">`

  if (/<head[\s>]/i.test(html)) {
    return html.replace(/<head(\s[^>]*)?>/i, cabeza => `${cabeza}${meta}`)
  }

  if (/<html[\s>]/i.test(html)) {
    return html.replace(/<html(\s[^>]*)?>/i, raiz => `${raiz}<head>${meta}</head>`)
  }

  return `<!doctype html><html><head><meta charset="utf-8">${meta}</head><body>${html}</body></html>`
}

/** Saca el texto de un data: URL de HTML; rechaza otro tipo o un archivo sobre el tope. */
export function htmlDeDataUrl(dataUrl: string): string {
  const coma = dataUrl.indexOf(',')
  const cabecera = coma > 0 ? dataUrl.slice(0, coma) : ''

  if (!/^data:text\/html(;[^,]*)?;base64$/i.test(cabecera)) {
    throw new Error('el archivo no es HTML')
  }

  const datos = dataUrl.slice(coma + 1)

  if ((datos.length * 3) / 4 > TOPE_HTML_BYTES) {
    throw new Error('el archivo pasa de 16 MB')
  }

  const bytes = Uint8Array.from(atob(datos), c => c.charCodeAt(0))

  return new TextDecoder().decode(bytes)
}

export type FuenteCaja = { profile?: string; ruta: string; sessionId: string; titulo: string }

const fuentes = new Map<string, FuenteCaja>()

export function fuenteDeCaja(artifactId: string): FuenteCaja | undefined {
  return fuentes.get(artifactId)
}

/** Tope de espera de una lectura: mejor un aviso que un botón en «…» para siempre. */
export const ESPERA_MS = 90000 // parche 45: un dashboard de 5 MB por la red privada puede tardar

export function conTope<T>(promesa: Promise<T>, ms = ESPERA_MS): Promise<T> {
  return new Promise((resolver, rechazar) => {
    const reloj = setTimeout(() => rechazar(new Error('la caja no respondió a tiempo')), ms)
    promesa.then(
      valor => {
        clearTimeout(reloj)
        resolver(valor)
      },
      error => {
        clearTimeout(reloj)
        rechazar(error)
      }
    )
  })
}

/**
 * Lee el archivo con el perfil y la conversación de la fila. Con la conversación abierta, el alcance completo de
 * Desktop (perfil más conexión) dejaba la lectura colgada; pedir con perfil y session_id responde en ~1 s.
 */
async function leer(fuente: FuenteCaja): Promise<string> {
  const api = window.hermesDesktop?.api

  if (!api || !fuente.profile) {
    return readDesktopFileDataUrl(fuente.ruta, { sessionId: fuente.sessionId })
  }

  const ruta = `/api/fs/read-data-url?path=${encodeURIComponent(fuente.ruta)}&session_id=${encodeURIComponent(fuente.sessionId)}`
  const r = await api<string | { dataUrl?: string }>({ path: ruta, profile: fuente.profile })

  return typeof r === 'string' ? r : r?.dataUrl || ''
}

async function cargar(fuente: FuenteCaja): Promise<string> {
  const dataUrl = await conTope(leer(fuente))
  const html = conCsp(htmlDeDataUrl(dataUrl))
  const nombre = fuente.ruta.split('/').pop() || fuente.titulo
  const r = upsertArtifact(fuente.sessionId, { kind: 'html', language: `caja-${artifactContentHash(fuente.ruta)}`, title: nombre }, html)

  if (!r) {
    throw new Error('no se pudo abrir')
  }

  fuentes.set(r.artifactId, fuente)

  return r.artifactId
}

// kelvo: parche 45. Una carga por archivo a la vez: un doble clic, la tarjeta y la fila del cuadro de mensaje
// reusan la misma promesa en vez de lanzar otra lectura que puede vencer y avisar un error sobre una vista que sí cargó.
const enCurso = new Map<string, Promise<string>>()

export function claveFuente(fuente: Pick<FuenteCaja, 'ruta' | 'sessionId'>): string {
  return `${fuente.sessionId}\u0000${fuente.ruta}`
}

/** ¿Ya hay una vista cargada de este archivo en esta conversación? */
export function yaCargada(fuente: Pick<FuenteCaja, 'ruta' | 'sessionId'>): boolean {
  const clave = claveFuente(fuente)

  for (const [id, otra] of fuentes) {
    if (claveFuente(otra) === clave && getArtifact(id)) {
      return true
    }
  }

  return false
}

function cargarUnaVez(fuente: FuenteCaja): Promise<string> {
  const clave = claveFuente(fuente)
  const previa = enCurso.get(clave)

  if (previa) {
    return previa
  }

  const nueva = cargar(fuente).finally(() => enCurso.delete(clave))
  enCurso.set(clave, nueva)

  return nueva
}

/** El aviso de error sólo si no hay ya una vista buena de ese archivo. */
export function avisarSiFalta(fuente: Pick<FuenteCaja, 'ruta' | 'sessionId'>, error: unknown, titulo: string) {
  if (yaCargada(fuente)) {
    console.warn('[kelvo] lectura posterior falló; la vista cargada se mantiene', error)

    return
  }

  notifyError(error, titulo)
}

/** Abre el archivo en la conversación de la que salió. */
export async function verEnKelvo(fuente: FuenteCaja, irAConversacion?: (sessionId: string) => void): Promise<void> {
  const id = await cargarUnaVez(fuente)
  irAConversacion?.(fuente.sessionId)

  const record = getArtifact(id)

  if (record) {
    selectArtifactVersion(id, record.versions.length - 1)
    openPreview(artifactPreviewTarget(record), fuente.sessionId)
  } else {
    openArtifact(id)
  }
}

/** Ruta absoluta en la caja: una relativa se resuelve contra la carpeta de trabajo de la conversación. */
export function rutaEnCaja(ruta: string, cwd?: null | string): string {
  const limpia = ruta.trim().replace(/^file:\/\//i, '')

  if (limpia.startsWith('/') || limpia.startsWith('~') || !cwd) {
    return limpia
  }

  return `${cwd.replace(/\/+$/, '')}/${limpia.replace(/^\.\//, '')}`
}

/** kelvo: parche 40. Si la app trabaja contra la caja y el enlace es un .html, lo abre aquí; si no, false. */
export function abrirHtmlDeConversacion(ruta: string, cwd: null | string | undefined, sessionId: string): boolean {
  if (!esHtml(ruta) || !sessionId || !isDesktopFsRemoteMode()) {
    return false
  }

  const completa = rutaEnCaja(ruta, cwd)
  const profile = sessionFileOwnerScope(sessionId)?.profile

  const fuente = { profile, ruta: completa, sessionId, titulo: completa.split('/').pop() || completa }
  verEnKelvo(fuente).catch(error => avisarSiFalta(fuente, error, 'No se pudo abrir aquí'))

  return true
}

/** Vuelve a leer el archivo de la caja; si cambió queda como versión nueva. */
export async function recargarDeCaja(artifactId: string): Promise<void> {
  const fuente = fuentes.get(artifactId)

  if (!fuente) {
    throw new Error('no se sabe de dónde vino')
  }

  const id = await cargarUnaVez(fuente)
  const record = getArtifact(id)

  if (record) {
    selectArtifactVersion(id, record.versions.length - 1)
  }
}

const CLASE = 'text-[0.625rem] font-bold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-50'

/** Botón en la fila de Salidas. */
export function BotonVerAqui({ fuente, irAConversacion }: { fuente: FuenteCaja; irAConversacion?: (sessionId: string) => void }) {
  const [abriendo, setAbriendo] = useState(false)

  if (!esHtml(fuente.ruta) || !fuente.sessionId) {
    return null
  }

  return (
    <button
      className={CLASE}
      disabled={abriendo}
      onClick={event => {
        event.stopPropagation()
        setAbriendo(true)
        verEnKelvo(fuente, irAConversacion)
          .catch(error => avisarSiFalta(fuente, error, 'No se pudo abrir aquí'))
          .finally(() => setAbriendo(false))
      }}
      title="Lo abre dentro de Kelvo, sin red"
      type="button"
    >
      {abriendo ? '…' : 'Ver aquí'}
    </button>
  )
}

/** En la cabecera de la pestaña: de dónde viene y Recargar. */
export function BarraCaja({ artifactId }: { artifactId: string }) {
  const [cargando, setCargando] = useState(false)
  const fuente = fuentes.get(artifactId)

  if (!fuente) {
    return null
  }

  return (
    <span className="inline-flex min-w-0 items-center gap-1.5 text-[0.625rem] text-muted-foreground">
      <span className="truncate" title={fuente.ruta}>
        De la caja · {fuente.ruta.split('/').pop()} · sin red
      </span>
      <button
        className={CLASE}
        disabled={cargando}
        onClick={() => {
          setCargando(true)
          recargarDeCaja(artifactId)
            .catch(error => notifyError(error, 'No se pudo recargar'))
            .finally(() => setCargando(false))
        }}
        type="button"
      >
        {cargando ? '…' : 'Recargar'}
      </button>
    </span>
  )
}
