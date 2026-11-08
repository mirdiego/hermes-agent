// kelvo: parche 39. En Capacidades › Skills se ven por defecto sólo las de Kelvo: las que no vienen de fábrica
// (provenance distinta de «bundled» y de «hub»). Un botón muestra también las de fábrica y el catálogo público.
import { atom } from 'nanostores'

export const $soloKelvo = atom(true)

export function esDeKelvo(skill: { provenance?: null | string }): boolean {
  return skill.provenance !== 'bundled' && skill.provenance !== 'hub'
}
