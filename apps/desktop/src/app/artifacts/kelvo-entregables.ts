// kelvo: parche 32. Salidas muestra por defecto sólo los entregables finales de cada conversación; los archivos de
// trabajo (cuadros de revisión, escenas, borradores de imagen) quedan plegados bajo el entregable principal.
//
// Regla: es final lo que está en la raíz de la carpeta del trabajo (…/trabajo/archivo) o lo que el agente nombra en
// su último mensaje con archivos (el de fecha más nueva en la conversación). Los enlaces web se muestran siempre.
// Un .html es siempre final (parche 46): un dashboard en una subcarpeta no queda escondido entre los de trabajo.
// Lo demás es de trabajo. Si una conversación no tiene ningún final, se muestran todos sus archivos.

import type { ArtifactRecord } from './artifact-utils'

export type ArtifactConTrabajo = ArtifactRecord & { trabajo?: ArtifactRecord[] }

const PRIORIDAD: Array<[RegExp, number]> = [
  [/\.(mp4|mov|webm|m4v)$/i, 0],
  [/\.html?$/i, 1],
  [/\.(pdf|docx?|pptx?|xlsx?)$/i, 2],
  [/\.(png|jpe?g|svg|gif|webp)$/i, 3]
]

function prioridad(artifact: ArtifactRecord): number {
  return PRIORIDAD.find(([patron]) => patron.test(artifact.value))?.[1] ?? 4
}

export function enRaizDelTrabajo(value: string): boolean {
  const partes = value.replace(/\\/g, '/').split('/').filter(Boolean)

  return partes.length >= 2 && partes[partes.length - 2] === 'trabajo'
}

export function agruparEntregables(artifacts: ArtifactRecord[]): ArtifactConTrabajo[] {
  const porSesion = new Map<string, ArtifactRecord[]>()

  for (const artifact of artifacts) {
    const lista = porSesion.get(artifact.sessionId) ?? []
    lista.push(artifact)
    porSesion.set(artifact.sessionId, lista)
  }

  const salida: ArtifactConTrabajo[] = []

  for (const lista of porSesion.values()) {
    const archivos = lista.filter(a => a.kind !== 'link')
    const ultimo = archivos.reduce((max, a) => Math.max(max, a.timestamp), Number.NEGATIVE_INFINITY)
    const esFinal = (a: ArtifactRecord) => a.kind === 'link' || /\.html?$/i.test(a.value) || enRaizDelTrabajo(a.value) || a.timestamp === ultimo
    const finales = lista.filter(esFinal)
    const trabajo = lista.filter(a => !esFinal(a))

    if (finales.filter(a => a.kind !== 'link').length === 0) {
      salida.push(...lista)

      continue
    }

    const principal = [...finales].filter(a => a.kind !== 'link').sort((x, y) => prioridad(x) - prioridad(y))[0]

    for (const final of finales) {
      salida.push(final === principal && trabajo.length > 0 ? { ...final, trabajo } : final)
    }
  }

  return salida
}
