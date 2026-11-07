// kelvo: parche 36. «Publicar para clientes» y «Retirar» sobre un archivo de la sala: la pieza se copia a la
// biblioteca de servicios, que el agente de servicios ve en sólo lectura. Lo llama el proceso principal
// (window.kelvoEstudio.biblioteca, ver electron/main.ts kelvo:biblioteca); la pantalla nunca ve la llave.
//
// La lista de piezas se lee una vez y se comparte entre todas las filas; publicar o retirar la vuelve a leer.

import { useEffect, useState, useSyncExternalStore } from 'react'

export type PiezaBiblioteca = {
  pieza: string
  titulo?: string
  origen?: string
  ruta_origen?: string
  publicado_por?: string
  publicado_en?: string
  bytes?: number
}

type Respuesta = { ok: boolean; status?: number; datos?: unknown; error?: string }
type Puente = { biblioteca?: (pedido: Record<string, string>) => Promise<Respuesta> }

function puente(): Puente['biblioteca'] {
  return (window as unknown as { kelvoEstudio?: Puente }).kelvoEstudio?.biblioteca
}

let piezas: PiezaBiblioteca[] = []
let disponible = false
let cargando: Promise<void> | null = null
const oyentes = new Set<() => void>()

function avisar() {
  for (const oyente of oyentes) {
    oyente()
  }
}

export function recargarBiblioteca(): Promise<void> {
  const llamar = puente()

  if (!llamar) {
    return Promise.resolve()
  }

  cargando = llamar({ accion: 'piezas' })
    .then(r => {
      const lista = (r.datos as { piezas?: unknown } | null)?.piezas
      disponible = r.ok && Array.isArray(lista)
      piezas = disponible ? (lista as PiezaBiblioteca[]) : []
    })
    .catch(() => {
      disponible = false
    })
    .finally(avisar)

  return cargando
}

function suscribir(oyente: () => void) {
  oyentes.add(oyente)

  if (!cargando) {
    void recargarBiblioteca()
  }

  return () => {
    oyentes.delete(oyente)
  }
}

let instantanea = { disponible, piezas }

function leer() {
  if (instantanea.piezas !== piezas || instantanea.disponible !== disponible) {
    instantanea = { disponible, piezas }
  }

  return instantanea
}

export function useBiblioteca() {
  return useSyncExternalStore(suscribir, leer)
}

/** Lo publicado desde esta ruta. La ficha guarda la ruta ya traducida a la caja; se compara también por el final. */
function publicadaDesde(lista: PiezaBiblioteca[], ruta: string): PiezaBiblioteca | undefined {
  const cola = ruta.replace(/^\/workspace\//, '')

  return lista.find(p => p.ruta_origen === ruta || (p.ruta_origen ?? '').endsWith(`/${cola}`))
}

async function llamarYRecargar(pedido: Record<string, string>): Promise<Respuesta> {
  const llamar = puente()

  if (!llamar) {
    return { ok: false, error: 'la app no trae el puente de la biblioteca' }
  }

  const r = await llamar(pedido)
  await recargarBiblioteca()

  return r
}

export function publicarPieza(ruta: string, titulo: string, origen: string): Promise<Respuesta> {
  return llamarYRecargar({ accion: 'publicar', ruta, titulo, origen })
}

export function retirarPieza(pieza: string, motivo: string): Promise<Respuesta> {
  return llamarYRecargar({ accion: 'retirar', pieza, motivo })
}

/** Botón chico para una fila de Salidas o la cabecera de la vista de un archivo. */
export function BotonBiblioteca({ origen, ruta, titulo }: { origen?: string; ruta: string; titulo?: string }) {
  const { disponible: hay, piezas: lista } = useBiblioteca()
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')
  const publicada = publicadaDesde(lista, ruta)

  useEffect(() => {
    setAviso('')
  }, [ruta])

  if (!hay || !ruta || /^https?:\/\//i.test(ruta)) {
    return null
  }

  const accion = async () => {
    setEnviando(true)
    setAviso('')

    const r = publicada
      ? await retirarPieza(publicada.pieza, 'retirada desde Kelvo Hermes')
      : await publicarPieza(ruta, titulo || ruta.split('/').pop() || ruta, origen || '')

    setEnviando(false)

    if (!r.ok) {
      setAviso(r.error || 'no se pudo')
    }
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[0.625rem]">
      {publicada && (
        <span className="rounded-full bg-[#ff4d00]/12 px-1.5 py-px font-medium text-[#ff4d00]" title={publicada.publicado_en}>
          En la biblioteca
        </span>
      )}
      <button
        className="font-bold text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
        disabled={enviando}
        onClick={event => {
          event.stopPropagation()
          void accion()
        }}
        title={publicada ? 'El agente de servicios deja de verla' : 'La copia a la biblioteca que ve el agente de servicios'}
        type="button"
      >
        {enviando ? '…' : publicada ? 'Retirar' : 'Publicar para clientes'}
      </button>
      {aviso && <span className="text-red-500">{aviso}</span>}
    </span>
  )
}
