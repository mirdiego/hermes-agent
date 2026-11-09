import { describe, expect, it } from 'vitest'

import { enlazarRutasHtmlKelvo } from './markdown-preprocess'

describe('rutas a .html en el texto del agente', () => {
  it('enlaza la ruta seguida de raya, coma, punto o paréntesis', () => {
    for (const fin of [' — KPIs', ', y', '.', ')', '']) {
      const salida = enlazarRutasHtmlKelvo(`Dashboard: /trabajo/comparacion-app-calor/salida/app_calor_dashboard.html${fin}`)
      expect(salida).toContain('[app_calor_dashboard.html](')
      expect(salida.endsWith(fin)).toBe(true)
    }
  })

  it('enlaza una ruta sola entre comillas invertidas', () => {
    expect(enlazarRutasHtmlKelvo('ver `/trabajo/x/salida/d.html` ahora')).toMatch(/^ver \[d\.html\]\(.+\) ahora$/)
  })

  it('no toca código con más cosas, enlaces ya hechos, URLs ni otros archivos', () => {
    expect(enlazarRutasHtmlKelvo('`cp /trabajo/a.html /tmp/`')).toBe('`cp /trabajo/a.html /tmp/`')
    expect(enlazarRutasHtmlKelvo('[d](/trabajo/d.html)')).toBe('[d](/trabajo/d.html)')
    expect(enlazarRutasHtmlKelvo('https://ejemplo.cl/a/b.html')).toBe('https://ejemplo.cl/a/b.html')
    expect(enlazarRutasHtmlKelvo('/trabajo/salida/resultado.json')).toBe('/trabajo/salida/resultado.json')
  })
})
