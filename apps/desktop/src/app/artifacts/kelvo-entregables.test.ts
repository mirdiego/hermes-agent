import { describe, expect, it } from 'vitest'

import type { ArtifactRecord } from './artifact-utils'
import { agruparEntregables } from './kelvo-entregables'

const a = (value: string, timestamp: number) =>
  ({ id: value, kind: 'file', label: value.split('/').pop(), sessionId: 's1', timestamp, value }) as unknown as ArtifactRecord

describe('entregables de una conversación', () => {
  it('un .html en una subcarpeta queda como fila propia, no entre los de trabajo', () => {
    const filas = agruparEntregables([
      a('/trabajo/FICalor_dashboard_2026-11-06.html', 1),
      a('/trabajo/comparacion-app-calor/salida/app_calor_dashboard.html', 2),
      a('/trabajo/comparacion-app-calor/salida/borrador.png', 3),
      a('/trabajo/ficalor/ficalor_dashboard.py', 9)
    ])

    const valores = filas.map(f => f.value)

    expect(valores).toContain('/trabajo/comparacion-app-calor/salida/app_calor_dashboard.html')
    expect(valores).not.toContain('/trabajo/comparacion-app-calor/salida/borrador.png')
  })
})
