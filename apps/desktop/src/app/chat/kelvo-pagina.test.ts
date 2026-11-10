import { describe, expect, it, vi } from 'vitest'

import { paginaAnteriorKelvo } from './transcript-backfill'

const pagina = { messages: [], pagination: { limit: 50, offset: 50, order: 'latest', returned: 0 } } as never

describe('página anterior de una conversación', () => {
  it('si el alcance completo falla, vuelve a pedir sólo con el perfil', async () => {
    const pedir = vi.fn().mockRejectedValueOnce(new Error('404')).mockResolvedValueOnce(pagina)
    await expect(
      paginaAnteriorKelvo('s1', { connectionId: 'c1', profile: 'servicios-greenlab' }, 50, pedir)
    ).resolves.toBe(pagina)
    expect(pedir).toHaveBeenLastCalledWith('s1', 'servicios-greenlab', 50)
  })

  it('una petición colgada termina con error en vez de quedar en vuelo', async () => {
    vi.useFakeTimers()
    const pedir = vi.fn(() => new Promise<never>(() => {}))
    const promesa = paginaAnteriorKelvo('s1', undefined, 50, pedir as never)
    const resultado = expect(promesa).rejects.toThrow('no respondió a tiempo')
    await vi.advanceTimersByTimeAsync(20001)
    await resultado
    vi.useRealTimers()
  })
})
