// Servicios en la Bandeja: la ficha de sólo lectura de cada servicio de Greenlab y «Probar como cliente», en tres pasos:
// describir al cliente → aprobar o ajustar el perfil que arma el cliente simulado → probar la interacción.
// Catálogo: GET /servicios?estudio=greenlab (API del estudio). Cliente simulado: corridas del perfil cliente-simulado
// de la caja por el puente del proceso principal (parche 30), con los usos «ARMAR PERFIL», «APROBAR PERFIL» y
// «PROBAR INTERACCIÓN» al comienzo del texto, todas en la misma sesión.

import { Button, cn, MessageTextContent } from '@hermes/plugin-sdk'
import { type ReactNode, useCallback, useEffect, useState } from 'react'

import { correrCliente, pedir } from './bandeja-api'

type Registro = Record<string, unknown>

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : valor == null ? '' : String(valor))

export function serviciosDe(datos: unknown): Registro[] {
  const crudo = (datos as Registro | null)?.servicios ?? datos

  return Array.isArray(crudo) ? (crudo as Registro[]) : []
}

export function preguntasDe(servicio: Registro): string[] {
  const p = servicio.preguntas

  return Array.isArray(p) ? p.map(x => texto((x as Registro)?.pregunta ?? x)).filter(Boolean) : []
}

export const publicado = (servicio: Registro): boolean => texto(servicio.estado) !== 'pausado'

export function useServicios() {
  const [servicios, setServicios] = useState<Registro[]>([])
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const r = await pedir({ path: '/servicios?estudio=greenlab' })

    if (!r.ok) {
      setError(texto((r.datos as Registro | null)?.error) || r.error || `La plataforma respondió ${r.status}`)

      return
    }

    setError('')
    setServicios(serviciosDe(r.datos))
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return { servicios, error, cargar }
}

function PildoraServicio({ servicio }: { servicio: Registro }) {
  const activo = publicado(servicio)

  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 text-[11px] leading-[18px]',
        activo ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
      )}
    >
      <i className="size-1.5 rounded-full bg-current" />
      {activo ? 'Publicado' : 'Pausado'}
    </span>
  )
}

export function FilaServicio({ servicio, elegido, onElegir }: { servicio: Registro; elegido: boolean; onElegir: () => void }) {
  return (
    <button
      className={cn('flex w-full items-center gap-2 border-b border-border/60 px-3 py-2 text-left', elegido ? 'bg-accent' : 'hover:bg-accent/50')}
      onClick={onElegir}
      type="button"
    >
      <b className="min-w-0 flex-1 truncate text-[13px] font-medium">{texto(servicio.nombre) || texto(servicio.slug)}</b>
      <PildoraServicio servicio={servicio} />
    </button>
  )
}

function Fila({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[90px_1fr] gap-3 py-1">
      <span className="text-muted-foreground">{etiqueta}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

/** Ficha del servicio (sólo lectura) y la entrada a «Probar como cliente». */
export function FichaServicio({ servicio, onSolicitudCreada }: { servicio: Registro; onSolicitudCreada: () => void }) {
  const [probando, setProbando] = useState(false)

  if (probando) {
    return <ProbarComoCliente onSalir={() => setProbando(false)} onSolicitudCreada={onSolicitudCreada} servicio={servicio} />
  }

  const preguntas = preguntasDe(servicio)

  return (
    <div className="flex flex-col gap-3 px-5 py-4 text-[12.5px]">
      <div className="flex items-center gap-2">
        <b className="text-[15px]">{texto(servicio.nombre)}</b>
        <PildoraServicio servicio={servicio} />
      </div>
      <div>
        <Fila etiqueta="Entrega">{texto(servicio.descripcion) || '—'}</Fila>
        <Fila etiqueta="Pregunta">
          {preguntas.length ? (
            <ol className="m-0 list-decimal pl-4">
              {preguntas.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ol>
          ) : (
            '—'
          )}
        </Fila>
        <Fila etiqueta="Skill">
          <code className="font-mono">{texto(servicio.skill) || '—'}</code>
        </Fila>
      </div>
      <div>
        <Button disabled={!publicado(servicio)} onClick={() => setProbando(true)} size="sm" type="button">
          Probar como cliente
        </Button>
      </div>
    </div>
  )
}

type Paso = 'describir' | 'revisar' | 'probar' | 'hecho'

/** Los tres pasos, uno a la vez. Todo corre en la misma sesión del cliente simulado. */
function ProbarComoCliente({
  servicio,
  onSalir,
  onSolicitudCreada
}: {
  servicio: Registro
  onSalir: () => void
  onSolicitudCreada: () => void
}) {
  const [sesion] = useState(() => `sim-${texto(servicio.slug).replace(/[^A-Za-z0-9_-]/g, '')}-${Date.now()}`)
  const [paso, setPaso] = useState<Paso>('describir')
  const [descripcion, setDescripcion] = useState('')
  const [perfil, setPerfil] = useState('')
  const [ajustando, setAjustando] = useState(false)
  const [correccion, setCorreccion] = useState('')
  const [resultado, setResultado] = useState('')
  const [trabajando, setTrabajando] = useState('')
  const [error, setError] = useState('')

  const ficha = `Servicio: ${texto(servicio.nombre)} (${texto(servicio.slug)}). ${texto(servicio.descripcion)} Preguntas del servicio: ${preguntasDe(servicio).join(' / ')}`

  const correr = async (input: string, aviso: string): Promise<string | null> => {
    setTrabajando(aviso)
    setError('')
    const r = await correrCliente({ input, sesion })
    setTrabajando('')

    if (!r.ok) {
      setError(r.error || `La corrida terminó como ${texto(r.status)}`)

      return null
    }

    return texto(r.output)
  }

  const armar = async () => {
    const salida = await correr(`ARMAR PERFIL: ${descripcion.trim()}\n\n${ficha}`, 'Armando el perfil del cliente…')

    if (salida !== null) {
      setPerfil(salida)
      setPaso('revisar')
    }
  }

  const reajustar = async () => {
    const salida = await correr(`ARMAR PERFIL: corrige el perfil anterior con esto: ${correccion.trim()}`, 'Ajustando el perfil…')

    if (salida !== null) {
      setPerfil(salida)
      setCorreccion('')
      setAjustando(false)
    }
  }

  const aprobar = async () => {
    const salida = await correr('APROBAR PERFIL', 'Guardando el perfil aprobado…')

    if (salida !== null) {
      setPaso('probar')
    }
  }

  const probar = async () => {
    const salida = await correr(
      `PROBAR INTERACCIÓN: contrata el servicio ${texto(servicio.slug)} (${texto(servicio.nombre)}) por el conector de servicios, como el cliente del perfil aprobado.`,
      'El cliente simulado está contratando el servicio…'
    )

    if (salida !== null) {
      setResultado(salida)
      setPaso('hecho')
      onSolicitudCreada()
    }
  }

  const numero = (n: number, actual: boolean) => (
    <span
      className={cn(
        'grid size-5 shrink-0 place-items-center rounded-full border text-[11px]',
        actual ? 'border-foreground text-foreground' : 'border-border text-muted-foreground'
      )}
    >
      {n}
    </span>
  )

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 py-4 text-[12.5px]">
      <div className="flex items-center gap-2">
        <button className="text-muted-foreground hover:text-foreground" onClick={onSalir} type="button">
          ‹ Volver
        </button>
        <b className="text-[15px]">Probar como cliente · {texto(servicio.nombre)}</b>
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        {numero(1, paso === 'describir')} Describe al cliente
        <span>·</span>
        {numero(2, paso === 'revisar')} Perfil
        <span>·</span>
        {numero(3, paso === 'probar' || paso === 'hecho')} Interacción
      </div>

      {paso === 'describir' && (
        <div className="flex flex-col gap-2">
          <label className="text-muted-foreground" htmlFor="kelvo-sim-descripcion">
            Quién es el cliente y qué información tiene
          </label>
          <textarea
            className="min-h-28 rounded-md border border-border bg-background px-2 py-1.5"
            id="kelvo-sim-descripcion"
            onChange={e => setDescripcion(e.target.value)}
            placeholder="Analista de un ministerio; tiene datos de urgencias por comuna y quiere ver el efecto del calor en enero…"
            value={descripcion}
          />
          <div>
            <Button disabled={descripcion.trim().length < 10 || Boolean(trabajando)} onClick={() => void armar()} size="sm" type="button">
              Armar perfil
            </Button>
          </div>
        </div>
      )}

      {paso === 'revisar' && (
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-border bg-card px-3 py-2">
            <MessageTextContent text={perfil} />
          </div>
          {ajustando ? (
            <div className="flex flex-col gap-2">
              <textarea
                className="min-h-20 rounded-md border border-border bg-background px-2 py-1.5"
                id="kelvo-sim-correccion"
                onChange={e => setCorreccion(e.target.value)}
                placeholder="Qué cambiar del perfil"
                value={correccion}
              />
              <div className="flex gap-2">
                <Button onClick={() => setAjustando(false)} size="sm" type="button" variant="outline">
                  Cancelar
                </Button>
                <Button disabled={correccion.trim().length < 3 || Boolean(trabajando)} onClick={() => void reajustar()} size="sm" type="button">
                  Volver a armar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button disabled={Boolean(trabajando)} onClick={() => setAjustando(true)} size="sm" type="button" variant="outline">
                Ajustar
              </Button>
              <Button disabled={Boolean(trabajando)} onClick={() => void aprobar()} size="sm" type="button">
                Aprobar
              </Button>
            </div>
          )}
        </div>
      )}

      {paso === 'probar' && (
        <div className="flex flex-col gap-2">
          <div className="text-muted-foreground">
            El perfil está aprobado. Al probar, el cliente simulado contrata el servicio; la solicitud cae en la Bandeja con la etiqueta «prueba».
          </div>
          <div>
            <Button disabled={Boolean(trabajando)} onClick={() => void probar()} size="sm" type="button">
              Probar interacción
            </Button>
          </div>
        </div>
      )}

      {paso === 'hecho' && (
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-border bg-card px-3 py-2">
            <MessageTextContent text={resultado} />
          </div>
          <div className="text-muted-foreground">La solicitud quedó en la Bandeja, en «Solicitudes», con la etiqueta «prueba».</div>
        </div>
      )}

      {trabajando && <div className="text-muted-foreground">{trabajando} Puede tardar un par de minutos.</div>}
      {error && <div className="text-destructive">{error}</div>}
    </div>
  )
}
