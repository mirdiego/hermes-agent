// Bandeja de solicitudes de Kelvo: la tarjeta de lista y detalle (la forma de la de Cron) para las solicitudes que
// llegan de agentes de clientes por Kelvo Servicios. Lee y escribe la cola con la API del estudio de la plataforma
// (PR #124) a través del proceso principal de Electron (parche 18, window.kelvoEstudio): la llave no pasa por aquí.

import { Button, cn } from '@hermes/plugin-sdk'
import { useCallback, useEffect, useMemo, useState } from 'react'

type Pedido = { method?: 'GET' | 'POST'; path: string; body?: unknown }
type Respuesta = { ok: boolean; status: number; datos?: unknown; error?: string }
type Registro = Record<string, unknown>

declare global {
  interface Window {
    kelvoEstudio?: { pedir: (pedido: Pedido) => Promise<Respuesta> }
  }
}

export async function pedir(pedido: Pedido): Promise<Respuesta> {
  if (!window.kelvoEstudio) {
    return { ok: false, status: 0, error: 'La app no trae el puente kelvoEstudio' }
  }

  return window.kelvoEstudio.pedir(pedido)
}

/** Píldoras de la Bandeja a partir de los estados reales de la cola. */
export const ESTADOS: Record<string, { etiqueta: string; tono: string }> = {
  abierta: { etiqueta: 'nueva', tono: 'text-blue-600 dark:text-blue-400' },
  en_validacion: { etiqueta: 'nueva', tono: 'text-blue-600 dark:text-blue-400' },
  esperando_pago: { etiqueta: 'nueva', tono: 'text-blue-600 dark:text-blue-400' },
  en_proceso: { etiqueta: 'en trabajo', tono: 'text-amber-600 dark:text-amber-400' },
  esperando_cliente: { etiqueta: 'en trabajo', tono: 'text-amber-600 dark:text-amber-400' },
  en_revision: { etiqueta: 'esperando aprobación', tono: 'text-[#ff4d00]' },
  aprobada: { etiqueta: 'lista', tono: 'text-emerald-600 dark:text-emerald-400' },
  retirada: { etiqueta: 'entregada', tono: 'text-muted-foreground' },
  rechazada: { etiqueta: 'rechazada', tono: 'text-muted-foreground' },
  fuera_de_alcance: { etiqueta: 'fuera de alcance', tono: 'text-muted-foreground' }
}

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : valor == null ? '' : String(valor))

export function lista(datos: unknown): Registro[] {
  const crudo = (datos as Registro | null)?.solicitudes ?? datos

  return Array.isArray(crudo) ? (crudo as Registro[]) : []
}

export function mensajes(datos: unknown): Registro[] {
  const d = datos as Registro | null
  const crudo = d?.mensajes ?? d?.conversacion ?? datos

  return Array.isArray(crudo) ? (crudo as Registro[]) : []
}

export function titulo(s: Registro): string {
  return texto(s.titulo ?? s.asunto ?? s.resumen ?? s.servicio ?? s.codigo) || 'Solicitud'
}

export function borradorDe(ficha: Registro | null): string {
  if (!ficha) {
    return ''
  }

  const b = ficha.borrador ?? ficha.borrador_caja ?? ficha.resultado ?? ficha.entregable

  if (b && typeof b === 'object') {
    const o = b as Registro

    return texto(o.texto ?? o.contenido ?? o.markdown ?? JSON.stringify(o, null, 2))
  }

  return texto(b)
}

const GRUPOS = [
  { id: 'solicitudes', nombre: 'Solicitudes', filtra: (e: string) => !['retirada', 'rechazada', 'fuera_de_alcance'].includes(e) },
  { id: 'todas', nombre: 'Todas', filtra: () => true },
  { id: 'entregadas', nombre: 'Entregadas', filtra: (e: string) => e === 'retirada' }
] as const

function Pildora({ estado }: { estado: string }) {
  const e = ESTADOS[estado] ?? { etiqueta: estado.replace(/_/g, ' '), tono: 'text-muted-foreground' }

  return (
    <span className={cn('inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 text-[11px] leading-[18px]', e.tono)}>
      <i className="size-1.5 rounded-full bg-current" />
      {e.etiqueta}
    </span>
  )
}

export function BandejaPagina({ onCuenta }: { onCuenta?: (n: number) => void }) {
  const [solicitudes, setSolicitudes] = useState<Registro[]>([])
  const [error, setError] = useState('')
  const [grupo, setGrupo] = useState<(typeof GRUPOS)[number]['id']>('solicitudes')
  const [elegida, setElegida] = useState<string | null>(null)
  const [ficha, setFicha] = useState<Registro | null>(null)
  const [hilo, setHilo] = useState<Registro[]>([])
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')

  const cargar = useCallback(async () => {
    const r = await pedir({ path: '/solicitudes' })

    if (!r.ok) {
      setError(r.error || `La plataforma respondió ${r.status}`)

      return
    }

    setError('')
    const todas = lista(r.datos)
    setSolicitudes(todas)
    onCuenta?.(todas.filter(s => texto(s.estado) === 'en_revision').length)
  }, [onCuenta])

  useEffect(() => {
    void cargar()
    const reloj = setInterval(() => void cargar(), 15000)

    return () => clearInterval(reloj)
  }, [cargar])

  const abrir = useCallback(async (codigo: string) => {
    setElegida(codigo)
    setFicha(null)
    setHilo([])
    setAviso('')

    const [f, c] = await Promise.all([
      pedir({ path: `/solicitudes/${codigo}` }),
      pedir({ path: `/solicitudes/${codigo}/conversacion` })
    ])

    setFicha(f.ok ? (((f.datos as Registro)?.solicitud as Registro) ?? (f.datos as Registro)) : null)
    setHilo(c.ok ? mensajes(c.datos) : [])
  }, [])

  const filtro = GRUPOS.find(g => g.id === grupo) ?? GRUPOS[0]
  const visibles = useMemo(() => solicitudes.filter(s => filtro.filtra(texto(s.estado))), [solicitudes, filtro])
  const actual = solicitudes.find(s => texto(s.codigo) === elegida) ?? null
  const borrador = borradorDe(ficha)
  const puedeFirmar = texto(actual?.estado) === 'en_revision'

  const decidir = async (accion: 'aprobar' | 'devolver') => {
    if (!elegida) {
      return
    }

    setEnviando(true)

    const body =
      accion === 'aprobar'
        ? { resultado: borrador, motivo: nota.trim() || 'Aprobado por Greenlab' }
        : { nota: nota.trim() }

    const r = await pedir({ method: 'POST', path: `/solicitudes/${elegida}/${accion}`, body })
    setEnviando(false)
    setAviso(r.ok ? (accion === 'aprobar' ? 'Aprobada.' : 'Devuelta al agente con tu comentario.') : r.error || `Error ${r.status}`)

    if (r.ok) {
      setNota('')
      await cargar()
      await abrir(elegida)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col bg-background text-foreground">
      <div className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-4 text-sm font-semibold">
        Bandeja
        <span className="text-xs font-normal text-muted-foreground">
          {solicitudes.filter(s => texto(s.estado) === 'en_revision').length} esperan aprobación
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-[320px_1fr]">
        <div className="min-h-0 overflow-y-auto border-r border-border bg-sidebar py-2">
          <div className="mb-1 border-b border-border pb-2">
            {GRUPOS.map(g => {
              const n = solicitudes.filter(s => g.filtra(texto(s.estado))).length

              return (
                <button
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12.5px]',
                    grupo === g.id ? 'bg-accent text-foreground' : 'text-muted-foreground hover:bg-accent/50'
                  )}
                  key={g.id}
                  onClick={() => setGrupo(g.id)}
                  type="button"
                >
                  <span className="flex-1">{g.nombre}</span>
                  <span className="font-mono text-[10.5px]">{n}</span>
                </button>
              )
            })}
          </div>
          {error && <div className="px-3 py-2 text-xs text-destructive">{error}</div>}
          {!error && visibles.length === 0 && (
            <div className="px-3 py-2 text-xs text-muted-foreground">No hay solicitudes en este grupo.</div>
          )}
          {visibles.map(s => {
            const codigo = texto(s.codigo)

            return (
              <button
                className={cn(
                  'flex w-full items-center gap-2 border-b border-border/60 px-3 py-2 text-left',
                  elegida === codigo ? 'bg-accent' : 'hover:bg-accent/50'
                )}
                key={codigo}
                onClick={() => void abrir(codigo)}
                type="button"
              >
                <span className="min-w-0 flex-1">
                  <b className="block truncate text-[13px] font-medium">{titulo(s)}</b>
                  <span className="block truncate text-[11.5px] text-muted-foreground">
                    {codigo} · {texto(s.creado).slice(0, 10)}
                  </span>
                </span>
                <Pildora estado={texto(s.estado)} />
              </button>
            )
          })}
        </div>
        <div className="flex min-h-0 flex-col">
          {!actual ? (
            <div className="m-auto text-sm text-muted-foreground">Elige una solicitud para ver su hilo.</div>
          ) : (
            <>
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
                <div className="mb-3 flex items-center gap-2">
                  <b className="text-[15px]">{titulo(actual)}</b>
                  <Pildora estado={texto(actual.estado)} />
                </div>
                <div className="flex flex-col gap-2 text-[12.5px]">
                  {hilo.map((m, i) => (
                    <div className="rounded-lg border border-border bg-card px-3 py-2" key={i}>
                      <div className="mb-1 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                        {texto(m.autor ?? m.rol ?? 'mensaje')}
                        {texto(m.visibilidad) === 'interna' ? ' · interno' : ''}
                      </div>
                      <div className="whitespace-pre-wrap">{texto(m.texto ?? m.contenido ?? m.mensaje)}</div>
                    </div>
                  ))}
                  {borrador && (
                    <div className="rounded-lg border border-border bg-card px-3 py-3">
                      <div className="mb-1 font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">
                        Borrador · espera firma
                      </div>
                      <div className="whitespace-pre-wrap">{borrador}</div>
                    </div>
                  )}
                </div>
              </div>
              <div className="shrink-0 border-t border-border px-5 py-3">
                {aviso && <div className="mb-2 text-xs text-muted-foreground">{aviso}</div>}
                <div className="flex items-center gap-2">
                  <input
                    className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-[12.5px]"
                    disabled={!puedeFirmar || enviando}
                    id="kelvo-bandeja-nota"
                    onChange={e => setNota(e.target.value)}
                    placeholder={puedeFirmar ? 'Comentario (obligatorio para devolver)' : 'Esta solicitud no espera firma'}
                    value={nota}
                  />
                  <Button
                    disabled={!puedeFirmar || enviando || !nota.trim()}
                    onClick={() => void decidir('devolver')}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Devolver
                  </Button>
                  <Button disabled={!puedeFirmar || enviando || !borrador} onClick={() => void decidir('aprobar')} size="sm" type="button">
                    Aprobar
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
