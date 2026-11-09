import { describe, expect, it } from 'vitest'

import { enlazarRutasHtmlKelvo, preprocessMarkdown } from './markdown-preprocess'

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

describe('ruta .html entre backticks en el mensaje completo (parche 47)', () => {
  it('queda como enlace de vista previa aunque el código en línea se separe antes', () => {
    const texto =
      '- **Dashboard:** `/trabajo/comparacion-app-calor/salida/app_calor_dashboard.html` (4,7 MB, autocontenido).'

    const salida = preprocessMarkdown(texto)

    expect(salida).toContain('[app_calor_dashboard.html](')
    expect(salida).not.toContain('`/trabajo/comparacion-app-calor/salida/app_calor_dashboard.html`')
  })
})

describe('ruta .html con cualquier envoltura de markdown (parche 48)', () => {
  const R = '/trabajo/ficalor-tmax/salida/ficalor_app_tmax.html'

  const casos: Array<[string, string]> = [
    ['negrita', `Listo: **${R}**`],
    ['negrita con guiones bajos', `Listo: __${R}__`],
    ['cursiva', `Listo: *${R}*`],
    ['cursiva con guion bajo', `Listo: _${R}_`],
    ['negrita y código', `Listo: **\`${R}\`**`],
    ['código', `Listo: \`${R}\``],
    ['final de oración', `El dashboard quedó en ${R}.`],
    ['paréntesis', `El dashboard (${R}) está listo.`],
    ['tachado no, pero comillas', `Abre "${R}"`],
    ['en una lista', `- ${R}`]
  ]

  for (const [nombre, texto] of casos) {
    it(nombre, () => {
      expect(preprocessMarkdown(texto)).toContain('[ficalor_app_tmax.html](')
    })
  }

  it('un enlace markdown ya hecho sigue llevando a la vista previa', () => {
    const salida = preprocessMarkdown(`Abre [el dashboard](${R}).`)

    expect(salida).toContain('[el dashboard](')
    expect(salida).not.toContain(`](${R})`)
  })
})
