import { describe, expect, it } from 'vitest'

import type { SessionInfo } from '@/types/hermes'

import { collectArtifactsForSession } from './artifact-utils'

const sesion = {
  ended_at: null,
  id: 'sesion-1',
  input_tokens: 0,
  is_active: false,
  last_active: 1000,
  message_count: 1,
  model: null,
  output_tokens: 0,
  preview: null,
  source: null,
  started_at: 1000,
  title: 'App Calor',
  tool_call_count: 0
} as SessionInfo

describe('salidas: scripts', () => {
  it('lista los .R y .py que nombra el agente, junto al dashboard', () => {
    const valores = collectArtifactsForSession(sesion, [
      {
        content:
          'Listo: /trabajo/ficalor/ficalor_dlnm.R, /trabajo/ficalor/ficalor.py y /trabajo/ficalor/salida/ficalor_dashboard.html',
        role: 'assistant',
        timestamp: 2000
      }
    ]).map(a => a.value)

    expect(valores).toContain('/trabajo/ficalor/ficalor_dlnm.R')
    expect(valores).toContain('/trabajo/ficalor/ficalor.py')
    expect(valores).toContain('/trabajo/ficalor/salida/ficalor_dashboard.html')
  })
})
