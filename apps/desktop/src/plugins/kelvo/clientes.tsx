// Dar acceso a un cliente desde la Bandeja: crear la cuenta, mostrar la llave ks_ UNA sola vez y revocarla.
// Contrato de la API del estudio (demo-escena-claude, 6-nov): GET /clientes, POST /clientes {nombre},
// POST /clientes/<id>/llave, POST /llaves/<id>/revocar {motivo}. La llave nunca se guarda ni se registra en la app:
// vive sólo en el estado del panel mientras está abierto.

import { Button, cn } from '@hermes/plugin-sdk'
import { useCallback, useEffect, useState } from 'react'

import { pedir } from './bandeja-api'

type Registro = Record<string, unknown>

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : valor == null ? '' : String(valor))
const numero = (valor: unknown): number => (typeof valor === 'number' ? valor : Number(valor) || 0)

export function clientesDe(datos: unknown): Registro[] {
  const crudo = (datos as Registro | null)?.clientes ?? datos

  return Array.isArray(crudo) ? (crudo as Registro[]) : []
}

export function llavesDe(cliente: Registro | null): Registro[] {
  const l = cliente?.llaves

  return Array.isArray(l) ? (l as Registro[]) : []
}

export function useClientes() {
  const [clientes, setClientes] = useState<Registro[]>([])
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const r = await pedir({ path: '/clientes?estudio=greenlab' })

    if (!r.ok) {
      setError(texto((r.datos as Registro | null)?.error) || r.error || `La plataforma respondió ${r.status}`)

      return
    }

    setError('')
    setClientes(clientesDe(r.datos))
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return { clientes, error, cargar }
}

/** Dirección del conector de Kelvo Servicios en la plataforma (runbook de la escena de Claude, 2026-11-06). */
export const BASE_CONECTOR = 'https://kelvo-plataforma.vercel.app/api/servicios/mcp/'

/** La URL que se pega en Claude: la base con la llave al final, sin espacios. */
export function urlConector(llave: string): string {
  return `${BASE_CONECTOR}${llave.trim()}`
}

function FilaCopiable({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  const [copiada, setCopiada] = useState(false)

  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor)
      setCopiada(true)
    } catch {
      setCopiada(false)
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="font-mono text-[10.5px] uppercase tracking-wider text-muted-foreground">{etiqueta}</div>
      <div className="flex items-start gap-2">
        <code className="block min-w-0 flex-1 select-all break-all rounded-md border border-border bg-card px-3 py-2 font-mono text-[12.5px]">
          {valor}
        </code>
        <Button onClick={() => void copiar()} size="sm" type="button" variant="outline">
          {copiada ? 'Copiada' : 'Copiar'}
        </Button>
      </div>
    </div>
  )
}

/** La llave recién creada y la URL del conector: se muestran una vez y se olvidan al cerrar. */
function LlaveUnaVez({ llave, onCerrar }: { llave: string; onCerrar: () => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[12.5px] text-muted-foreground">
        Esta es la llave del cliente. <b className="text-foreground">No se vuelve a mostrar</b>: cópiala y mándasela por un canal privado.
      </div>
      <FilaCopiable etiqueta="Llave" valor={llave} />
      <FilaCopiable etiqueta="URL del conector" valor={urlConector(llave)} />
      <div className="text-[12px] text-muted-foreground">
        Pégala en Claude → Configuración → Conectores → Agregar conector personalizado.
      </div>
      <div className="flex justify-end gap-2">
        <Button onClick={onCerrar} size="sm" type="button">
          Listo
        </Button>
      </div>
    </div>
  )
}

/** Panel «Dar acceso a un cliente»: sólo el nombre; al generar, la llave una sola vez. */
export function DarAcceso({ onCerrar, onCreado }: { onCerrar: () => void; onCreado: () => void }) {
  const [nombre, setNombre] = useState('')
  const [prueba, setPrueba] = useState(false)
  const [llave, setLlave] = useState('')
  const [error, setError] = useState('')
  const [enviando, setEnviando] = useState(false)
  const valido = nombre.trim().length >= 2

  const generar = async () => {
    setEnviando(true)
    setError('')

    const r = await pedir({
      method: 'POST',
      path: '/clientes',
      body: { nombre: nombre.trim(), estudio: 'greenlab', ...(prueba ? { prueba: true } : {}) }
    })

    setEnviando(false)

    if (!r.ok) {
      setError(texto((r.datos as Registro | null)?.error) || r.error || `La plataforma respondió ${r.status}`)

      return
    }

    setLlave(texto((r.datos as Registro | null)?.llave))
    onCreado()
  }

  return (
    <div className="absolute inset-0 z-10 grid place-items-center bg-black/30 p-6">
      <div className="w-[440px] max-w-full rounded-xl border border-border bg-background p-5 shadow-xl">
        <div className="mb-3 text-[15px] font-semibold">Dar acceso a un cliente</div>
        {llave ? (
          <LlaveUnaVez
            llave={llave}
            onCerrar={() => {
              setLlave('')
              onCerrar()
            }}
          />
        ) : (
          <div className="flex flex-col gap-3 text-[12.5px]">
            <label className="flex flex-col gap-1" htmlFor="kelvo-cliente-nombre">
              <span className="text-muted-foreground">Nombre del cliente</span>
              <input
                className="rounded-md border border-border bg-background px-2 py-1.5"
                id="kelvo-cliente-nombre"
                onChange={e => setNombre(e.target.value)}
                placeholder="Ministerio, consultora o persona"
                value={nombre}
              />
            </label>
            <label className="flex items-center gap-2" htmlFor="kelvo-cliente-prueba">
              <input checked={prueba} id="kelvo-cliente-prueba" onChange={e => setPrueba(e.target.checked)} type="checkbox" />
              <span>Cliente de prueba (sus solicitudes se pueden archivar)</span>
            </label>
            {error && <div className="text-destructive">{error}</div>}
            <div className="flex justify-end gap-2">
              <Button onClick={onCerrar} size="sm" type="button" variant="outline">
                Cancelar
              </Button>
              <Button disabled={!valido || enviando} onClick={() => void generar()} size="sm" type="button">
                {enviando ? 'Generando…' : 'Generar'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Fila de un cliente en la lista de la izquierda. */
export function FilaCliente({ cliente, elegido, onElegir }: { cliente: Registro; elegido: boolean; onElegir: () => void }) {
  const activas = llavesDe(cliente).filter(l => texto(l.estado) === 'activa').length

  return (
    <button
      className={cn('flex w-full items-center gap-2 border-b border-border/60 px-3 py-2 text-left', elegido ? 'bg-accent' : 'hover:bg-accent/50')}
      onClick={onElegir}
      type="button"
    >
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[13px] font-medium">{texto(cliente.nombre)}</b>
        <span className="block truncate text-[11.5px] text-muted-foreground">{numero(cliente.solicitudes)} solicitudes</span>
      </span>
      <span className="shrink-0 font-mono text-[10.5px] text-muted-foreground">{activas ? 'con llave' : 'sin llave'}</span>
    </button>
  )
}

/** Detalle de un cliente: llaves por prefijo y Revocar. */
export function FichaCliente({ cliente, onCambio }: { cliente: Registro; onCambio: () => void }) {
  const [motivo, setMotivo] = useState('')
  const [llaveNueva, setLlaveNueva] = useState('')
  const [aviso, setAviso] = useState('')
  const [enviando, setEnviando] = useState(false)
  const llaves = llavesDe(cliente)

  const revocar = async (id: string) => {
    setEnviando(true)
    const r = await pedir({ method: 'POST', path: `/llaves/${id}/revocar`, body: { motivo: motivo.trim() } })
    setEnviando(false)
    setAviso(r.ok ? 'Llave revocada.' : texto((r.datos as Registro | null)?.error) || r.error || `Error ${r.status}`)

    if (r.ok) {
      setMotivo('')
      onCambio()
    }
  }

  const otraLlave = async () => {
    setEnviando(true)
    const r = await pedir({ method: 'POST', path: `/clientes/${texto(cliente.id)}/llave`, body: {} })
    setEnviando(false)

    if (r.ok) {
      setLlaveNueva(texto((r.datos as Registro | null)?.llave))
      onCambio()
    } else {
      setAviso(texto((r.datos as Registro | null)?.error) || r.error || `Error ${r.status}`)
    }
  }

  if (llaveNueva) {
    return (
      <div className="px-5 py-4">
        <LlaveUnaVez llave={llaveNueva} onCerrar={() => setLlaveNueva('')} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 px-5 py-4 text-[12.5px]">
      <div>
        <b className="text-[15px]">{texto(cliente.nombre)}</b>
        <div className="text-muted-foreground">{numero(cliente.solicitudes)} solicitudes</div>
      </div>
      <div className="flex flex-col">
        {llaves.length === 0 && <div className="text-muted-foreground">Sin llaves.</div>}
        {llaves.map(l => (
          <div className="flex items-center gap-2 border-b border-border/60 py-2" key={texto(l.id)}>
            <code className="font-mono">{texto(l.prefijo)}…</code>
            <span className="text-muted-foreground">{texto(l.estado)}</span>
            <span className="ml-auto text-[11.5px] text-muted-foreground">
              {texto(l.ultimo_uso) ? `usada ${texto(l.ultimo_uso).slice(0, 10)}` : 'sin uso'}
            </span>
            {texto(l.estado) === 'activa' && (
              <Button
                disabled={enviando || motivo.trim().length < 1}
                onClick={() => void revocar(texto(l.id))}
                size="sm"
                type="button"
                variant="outline"
              >
                Revocar llave
              </Button>
            )}
          </div>
        ))}
      </div>
      {llaves.some(l => texto(l.estado) === 'activa') && (
        <input
          className="rounded-md border border-border bg-background px-2 py-1.5"
          id="kelvo-cliente-motivo"
          onChange={e => setMotivo(e.target.value)}
          placeholder="Motivo para revocar (obligatorio)"
          value={motivo}
        />
      )}
      {aviso && <div className="text-muted-foreground">{aviso}</div>}
      <div>
        <Button disabled={enviando} onClick={() => void otraLlave()} size="sm" type="button" variant="outline">
          Generar otra llave
        </Button>
      </div>
    </div>
  )
}
