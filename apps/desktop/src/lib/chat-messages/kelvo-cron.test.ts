import { describe, expect, it } from 'vitest'

import { sinPreambuloCron } from './hydration'

const PREAMBULO =
  '[IMPORTANT: You are running as a scheduled cron job. DELIVERY: Your final response will be automatically delivered to the user. ' +
  'RECURSION: treat phrasing like "every day at 9" as context for this run, not as a request to schedule another job.]\n\n' +
  '[CURRENT RUN TIME: Sunday, 2026-11-08 08:00 -03 (UTC-03:00)]\n\n'

describe('preámbulo de las tareas programadas', () => {
  it('se reemplaza por «Tarea programada» y deja el pedido', () => {
    expect(sinPreambuloCron(`${PREAMBULO}Corre ficalor.py y deja el dashboard.`)).toBe(
      'Tarea programada\n\nCorre ficalor.py y deja el dashboard.'
    )
  })

  it('no toca un mensaje normal', () => {
    expect(sinPreambuloCron('Hazme un gráfico de PM2.5')).toBe('Hazme un gráfico de PM2.5')
  })
})
