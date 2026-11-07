// Biblioteca en la Bandeja: lo que Greenlab publicó para clientes, en un solo lugar, con Retirar. Es la carpeta que el
// agente de servicios ve en sólo lectura. La lista y el retiro pasan por el proceso principal (parche 36,
// window.kelvoEstudio.biblioteca), que llama al servicio de la caja con la llave del Llavero.

import { Button, cn } from '@hermes/plugin-sdk'
import { useCallback, useEffect, useState } from 'react'

import { biblioteca } from './bandeja-api'

type Registro = Record<string, unknown>

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : valor == null ? '' : String(valor))

export function piezasDe(datos: unknown): Registro[] {
  const crudo = (datos as Registro | null)?.piezas

  return Array.isArray(crudo) ? (crudo as Registro[]) : []
}

function tamano(bytes: unknown): string {
  const n = Number(bytes)

  if (!Number.isFinite(n) || n <= 0) {
    return ''
  }

  return n < 1024 ? `${n} B` : n < 1024 * 1024 ? `${Math.round(n / 1024)} KB` : `${(n / 1024 / 1024).toFixed(1)} MB`
}

export function useBibliotecaBandeja() {
  const [piezas, setPiezas] = useState<Registro[]>([])
  const [error, setError] = useState('')

  const cargar = useCallback(async () => {
    const r = await biblioteca({ accion: 'piezas' })

    if (!r.ok) {
      setError(r.error || `La biblioteca respondió ${r.status}`)

      return
    }

    setError('')
    setPiezas(piezasDe(r.datos))
  }, [])

  useEffect(() => {
    void cargar()
  }, [cargar])

  return { piezas, error, cargar }
}

export function FilaPieza({ pieza, elegida, onElegir }: { pieza: Registro; elegida: boolean; onElegir: () => void }) {
  return (
    <button
      className={cn('flex w-full items-center gap-2 border-b border-border/60 px-3 py-2 text-left', elegida ? 'bg-accent' : 'hover:bg-accent/50')}
      onClick={onElegir}
      type="button"
    >
      <span className="min-w-0 flex-1">
        <b className="block truncate text-[13px] font-medium">{texto(pieza.titulo) || texto(pieza.pieza)}</b>
        <span className="block truncate text-[11.5px] text-muted-foreground">
          {texto(pieza.pieza)} · {texto(pieza.publicado_en).slice(0, 10)}
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border px-2 text-[11px] leading-[18px] text-emerald-600 dark:text-emerald-400">
        <i className="size-1.5 rounded-full bg-current" />
        Publicada
      </span>
    </button>
  )
}

export function FichaPieza({ pieza, onRetirada }: { pieza: Registro; onRetirada: () => void }) {
  const [motivo, setMotivo] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [aviso, setAviso] = useState('')

  const retirar = async () => {
    setEnviando(true)
    const r = await biblioteca({ accion: 'retirar', pieza: texto(pieza.pieza), motivo: motivo.trim() || 'retirada desde la Bandeja' })
    setEnviando(false)

    if (!r.ok) {
      setAviso(r.error || `Error ${r.status}`)

      return
    }

    setAviso('')
    onRetirada()
  }

  const filas: Array<[string, string]> = [
    ['Archivo', texto(pieza.pieza)],
    ['De qué trabajo sale', texto(pieza.origen) || 'sin indicar'],
    ['Archivo original', texto(pieza.ruta_origen)],
    ['Publicó', texto(pieza.publicado_por)],
    ['Cuándo', texto(pieza.publicado_en).replace('T', ' ').slice(0, 16)],
    ['Tamaño', tamano(pieza.bytes)]
  ]

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <b className="mb-1 block text-[15px]">{texto(pieza.titulo) || texto(pieza.pieza)}</b>
        <p className="mb-4 text-[12.5px] text-muted-foreground">
          El agente de servicios la ve y la puede citar en sus informes. Si la retiras, deja de verla desde la próxima
          pregunta; la pieza se guarda en el retiro con fecha.
        </p>
        <dl className="grid grid-cols-[150px_1fr] gap-x-3 gap-y-1.5 text-[12.5px]">
          {filas
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div className="contents" key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="min-w-0 break-words">{v}</dd>
              </div>
            ))}
        </dl>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-t border-border px-5 py-3">
        <input
          className="min-w-0 flex-1 rounded-md border border-border bg-background px-2 py-1 text-[12.5px]"
          onChange={e => setMotivo(e.target.value)}
          placeholder="Motivo (opcional)"
          value={motivo}
        />
        {aviso && <span className="text-xs text-destructive">{aviso}</span>}
        <Button disabled={enviando} onClick={() => void retirar()} size="sm" type="button" variant="outline">
          {enviando ? 'Retirando…' : 'Retirar'}
        </Button>
      </div>
    </div>
  )
}
