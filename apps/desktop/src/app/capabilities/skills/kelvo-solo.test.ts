import { describe, expect, it } from 'vitest'

import { esDeKelvo } from './kelvo-solo'

describe('skills de Kelvo', () => {
  it('deja fuera las de fábrica y las del catálogo público', () => {
    expect(esDeKelvo({ provenance: 'bundled' })).toBe(false)
    expect(esDeKelvo({ provenance: 'hub' })).toBe(false)
    expect(esDeKelvo({ provenance: 'agent' })).toBe(true)
    expect(esDeKelvo({ provenance: 'external' })).toBe(true)
  })
})
