import { describe, expect, it } from 'vitest'

import { limpiarArbol, limpiarTexto } from './limpieza-pantalla'

describe('limpieza de marca en pantalla', () => {
  it('reescribe la marca y el autor de las skills de fábrica', () => {
    expect(limpiarTexto('Use, configure and orchestrate Hermes Agent.')).toBe('Use, configure and orchestrate Kelvo.')
    expect(limpiarTexto('Hermes Agent + Teknium')).toBe('Kelvo')
    expect(limpiarTexto('Run Hermes from Telegram DMs')).toBe('Run Kelvo from Telegram DMs')
    expect(limpiarTexto('Nous Portal')).toBe('portal de Kelvo')
  })

  it('no toca rutas, variables ni texto sin marca', () => {
    expect(limpiarTexto('/home/user_diego/kelvo-prueba/hermes-motor/greenlab')).toBe(
      '/home/user_diego/kelvo-prueba/hermes-motor/greenlab'
    )
    expect(limpiarTexto('HERMES_EPHEMERAL_SYSTEM_PROMPT')).toBe('HERMES_EPHEMERAL_SYSTEM_PROMPT')
    expect(limpiarTexto('Temperatura máxima')).toBe('Temperatura máxima')
  })

  it('limpia textos y ayudas, pero no las conversaciones ni los campos', () => {
    document.body.innerHTML = `
      <div><span title="Hermes Agent">Hermes Agent</span></div>
      <div data-message-id="1"><p>El agente Hermes dijo algo</p></div>
      <textarea>Hermes</textarea>`
    limpiarArbol(document.body)
    expect(document.querySelector('span')?.textContent).toBe('Kelvo')
    expect(document.querySelector('span')?.getAttribute('title')).toBe('Kelvo')
    expect(document.querySelector('[data-message-id] p')?.textContent).toBe('El agente Hermes dijo algo')
    expect(document.querySelector('textarea')?.value).toBe('Hermes')
  })
})
