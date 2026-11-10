import { describe, expect, it } from 'vitest'

import { BASE_CONECTOR, urlConector } from './clientes'

describe('URL del conector', () => {
  it('pega la llave al final de la base, sin espacios', () => {
    expect(BASE_CONECTOR).toBe('https://kelvo-plataforma.vercel.app/api/servicios/mcp/')
    expect(urlConector(' ks_abc123 ')).toBe('https://kelvo-plataforma.vercel.app/api/servicios/mcp/ks_abc123')
  })
})
