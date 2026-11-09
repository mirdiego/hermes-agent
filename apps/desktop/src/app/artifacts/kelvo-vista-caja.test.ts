import { describe, expect, it } from 'vitest'

import { abrirHtmlDeSalidas, claveFuente, conCsp, conTope, CSP_CAJA, esHtml, htmlDeDataUrl, rutaEnCaja, TOPE_HTML_BYTES } from './kelvo-vista-caja'

const dataUrl = (html: string, tipo = 'text/html') =>
  `data:${tipo};base64,${btoa(String.fromCharCode(...new TextEncoder().encode(html)))}`

describe('CSP de la vista de la caja', () => {
  it('no deja salir nada a la red', () => {
    expect(CSP_CAJA).toContain("default-src 'none'")
    expect(CSP_CAJA).toContain("connect-src 'none'")
    expect(CSP_CAJA).toContain("frame-src 'none'")
    expect(CSP_CAJA).toContain("form-action 'none'")
    expect(CSP_CAJA).not.toMatch(/https?:|\*/)
  })

  it('va antes de cualquier script del documento', () => {
    const html = conCsp('<!doctype html><html lang="es"><head><script>x()</script></head><body></body></html>')
    expect(html.indexOf('Content-Security-Policy')).toBeGreaterThan(-1)
    expect(html.indexOf('Content-Security-Policy')).toBeLessThan(html.indexOf('<script>'))
  })

  it('arma el head si el documento no lo trae, y envuelve un fragmento', () => {
    expect(conCsp('<html><body><script>x()</script></body></html>')).toMatch(/^<html><head><meta http-equiv/)
    const fragmento = conCsp('<div id="g"></div><script>x()</script>')
    expect(fragmento.startsWith('<!doctype html>')).toBe(true)
    expect(fragmento.indexOf('Content-Security-Policy')).toBeLessThan(fragmento.indexOf('<script>'))
  })
})

describe('qué se abre', () => {
  it('sólo .html locales o de la caja, no enlaces', () => {
    expect(esHtml('/trabajo/ficalor/salida/ficalor_dashboard.html')).toBe(true)
    expect(esHtml('/trabajo/x.HTM')).toBe(true)
    expect(esHtml('/trabajo/x.png')).toBe(false)
    expect(esHtml('https://example.org/x.html')).toBe(false)
  })

  it('lee el HTML con acentos y rechaza otro tipo', () => {
    expect(htmlDeDataUrl(dataUrl('<p>Ola de calor en Ñuñoa</p>'))).toBe('<p>Ola de calor en Ñuñoa</p>')
    expect(() => htmlDeDataUrl(dataUrl('hola', 'text/plain'))).toThrow('no es HTML')
    expect(() => htmlDeDataUrl('no es un data url')).toThrow('no es HTML')
  })

  it('rechaza un archivo sobre el tope', () => {
    const grande = `data:text/html;base64,${'A'.repeat(Math.ceil((TOPE_HTML_BYTES * 4) / 3) + 8)}`
    expect(() => htmlDeDataUrl(grande)).toThrow('16 MB')
  })
})

describe('espera', () => {
  it('una lectura colgada termina en un aviso', async () => {
    await expect(conTope(new Promise(() => {}), 20)).rejects.toThrow('no respondió a tiempo')
    await expect(conTope(Promise.resolve('ok'), 20)).resolves.toBe('ok')
  })
})

describe('ruta de un enlace en la conversación', () => {
  it('resuelve una relativa contra la carpeta de trabajo y deja la absoluta', () => {
    expect(rutaEnCaja('salida/ficalor_dashboard.html', '/trabajo/ficalor')).toBe('/trabajo/ficalor/salida/ficalor_dashboard.html')
    expect(rutaEnCaja('./x.html', '/trabajo/')).toBe('/trabajo/x.html')
    expect(rutaEnCaja('/trabajo/ficalor/salida/ficalor_dashboard.html', '/otra')).toBe('/trabajo/ficalor/salida/ficalor_dashboard.html')
    expect(rutaEnCaja('file:///trabajo/x.html', null)).toBe('/trabajo/x.html')
  })
})

describe('una carga por archivo', () => {
  it('la clave distingue archivo y conversación', () => {
    expect(claveFuente({ ruta: '/trabajo/a.html', sessionId: 's1' })).toBe(claveFuente({ ruta: '/trabajo/a.html', sessionId: 's1' }))
    expect(claveFuente({ ruta: '/trabajo/a.html', sessionId: 's1' })).not.toBe(claveFuente({ ruta: '/trabajo/a.html', sessionId: 's2' }))
  })
})

describe('abrir desde Salidas', () => {
  it('sólo toma un .html de la caja cuando la app trabaja contra la caja', () => {
    const fuente = { ruta: '/trabajo/x.py', sessionId: 's1', titulo: 'x.py' }

    expect(abrirHtmlDeSalidas(fuente, true)).toBe(false)
    expect(abrirHtmlDeSalidas({ ...fuente, ruta: '/trabajo/x.html' }, false)).toBe(false)
    expect(abrirHtmlDeSalidas({ ...fuente, ruta: '/trabajo/x.html', sessionId: '' }, true)).toBe(false)
  })
})
