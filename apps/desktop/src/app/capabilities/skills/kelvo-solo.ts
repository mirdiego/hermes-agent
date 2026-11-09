// kelvo: parche 43. En Capacidades › Skills el catálogo queda como de fábrica y se agrega un filtro visible
// «Todas / Instaladas»: «Instaladas» muestra sólo las skills instaladas en el perfil que se está configurando.
import { atom } from 'nanostores'

export const $soloInstaladas = atom(false)

/** Una entrada del catálogo es instalada si corresponde a una skill del perfil. */
export function esInstalada(skill: unknown): boolean {
  return Boolean(skill)
}
