import { describe, expect, it } from 'vitest'

import { motivoDe, publicadaDesde } from './kelvo-biblioteca'

const lista = [
  {
    pieza: 'tmax-quinta-normal-oct2026',
    ruta_origen: '/home/user_diego/kelvo-prueba/hermes-motor/greenlab/trabajo/temperatura/tmax_quinta_normal_oct2026.png'
  },
  { pieza: 'otra', ruta_origen: '/home/user_diego/kelvo-prueba/hermes-motor/greenlab/trabajo/otra.csv' }
]

describe('publicadaDesde', () => {
  it('reconoce la ruta de Salidas con /trabajo/', () => {
    expect(publicadaDesde(lista, '/trabajo/temperatura/tmax_quinta_normal_oct2026.png')?.pieza).toBe(
      'tmax-quinta-normal-oct2026'
    )
  })

  it('reconoce la ruta con /workspace/', () => {
    expect(publicadaDesde(lista, '/workspace/trabajo/temperatura/tmax_quinta_normal_oct2026.png')?.pieza).toBe(
      'tmax-quinta-normal-oct2026'
    )
  })

  it('reconoce la ruta exacta de la caja', () => {
    expect(publicadaDesde(lista, lista[1].ruta_origen)?.pieza).toBe('otra')
  })

  it('no calza por un trozo del nombre ni con ruta vacía', () => {
    expect(publicadaDesde(lista, '/trabajo/ra.csv')).toBeUndefined()
    expect(publicadaDesde(lista, '/trabajo/temperatura/otro.png')).toBeUndefined()
    expect(publicadaDesde(lista, '/')).toBeUndefined()
  })
})

describe('motivoDe', () => {
  it('distingue llave ausente, llave rechazada y servicio caído', () => {
    expect(motivoDe({ ok: false, status: 401, error: 'falta la llave kelvo-biblioteca en el Llavero' })).toBe('falta la llave')
    expect(motivoDe({ ok: false, status: 401, error: 'sin autorización' })).toBe('la llave no calza')
    expect(motivoDe({ ok: false, status: 0, error: 'fetch failed' })).toBe('no responde')
  })
})
