import { describe, expect, it } from 'vitest'

import { $soloInstaladas, esInstalada } from './kelvo-solo'

describe('filtro de skills instaladas', () => {
  it('parte en «Todas» y reconoce las instaladas', () => {
    expect($soloInstaladas.get()).toBe(false)
    expect(esInstalada({ name: 'ficalor', provenance: 'agent' })).toBe(true)
    expect(esInstalada({ name: 'codex', provenance: 'bundled' })).toBe(true)
    expect(esInstalada(undefined)).toBe(false)
  })
})
