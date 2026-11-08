// Red de seguridad de la marca para lo que no viene de los catálogos de idioma: textos que manda el motor de la
// caja (autores y descripciones de skills, tarjetas de mensajería, nombres de proveedores) y textos fijos que se
// escaparon del catálogo. Reescribe lo que se ve en pantalla con las mismas reglas de marca.ts.
//
// No toca: las conversaciones ([data-message-id]), el código, los campos que la persona escribe ni las rutas.
// Las reglas distinguen mayúsculas, así que una ruta como /home/…/hermes-motor/ o una variable HERMES_X no
// cambian: el texto que se copia o se usa queda igual que en la caja.

import { reescribir } from './marca'

/** Sólo la marca con mayúscula inicial o el nombre del autor de las skills de fábrica. */
const MARCA_VISIBLE = /\b(?:Hermes|Nous|Teknium)\b|☤/

const ATRIBUTOS = ['title', 'aria-label', 'placeholder', 'alt'] as const

const SALTAR = '[data-message-id], pre, code, textarea, input, [contenteditable="true"], script, style, .cm-editor'

const REGLAS_EXTRA: Array<[RegExp, string]> = [
  [/\bHermes Agent \+ Teknium\b/g, 'Kelvo'],
  [/\bTeknium\b/g, 'Kelvo']
]

export function limpiarTexto(texto: string): string {
  if (!MARCA_VISIBLE.test(texto)) {
    return texto
  }

  return reescribir(REGLAS_EXTRA.reduce((acc, [patron, nuevo]) => acc.replace(patron, nuevo), texto))
}

function saltar(el: Element | null): boolean {
  return !el || Boolean(el.closest(SALTAR))
}

function limpiarNodoTexto(nodo: Text) {
  const antes = nodo.data

  if (!MARCA_VISIBLE.test(antes) || saltar(nodo.parentElement)) {
    return
  }

  const despues = limpiarTexto(antes)

  if (despues !== antes) {
    nodo.data = despues
  }
}

function limpiarAtributos(el: Element) {
  if (saltar(el)) {
    return
  }

  for (const nombre of ATRIBUTOS) {
    const valor = el.getAttribute(nombre)

    if (valor && MARCA_VISIBLE.test(valor)) {
      const nuevo = limpiarTexto(valor)

      if (nuevo !== valor) {
        el.setAttribute(nombre, nuevo)
      }
    }
  }
}

export function limpiarArbol(raiz: Node) {
  if (raiz.nodeType === Node.TEXT_NODE) {
    limpiarNodoTexto(raiz as Text)

    return
  }

  if (raiz.nodeType !== Node.ELEMENT_NODE || saltar(raiz as Element)) {
    return
  }

  limpiarAtributos(raiz as Element)

  const textos = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT)

  for (let n = textos.nextNode(); n; n = textos.nextNode()) {
    limpiarNodoTexto(n as Text)
  }

  for (const el of (raiz as Element).querySelectorAll(ATRIBUTOS.map(a => `[${a}]`).join(','))) {
    limpiarAtributos(el)
  }
}

/** Arranca la limpieza y la mantiene mientras la app cambia. Devuelve cómo apagarla. */
export function vigilarPantalla(): () => void {
  if (typeof document === 'undefined' || typeof MutationObserver === 'undefined') {
    return () => {}
  }

  const observador = new MutationObserver(cambios => {
    for (const cambio of cambios) {
      if (cambio.type === 'characterData') {
        limpiarNodoTexto(cambio.target as Text)
      } else if (cambio.type === 'attributes') {
        limpiarAtributos(cambio.target as Element)
      } else {
        cambio.addedNodes.forEach(limpiarArbol)
      }
    }
  })

  const empezar = () => {
    limpiarArbol(document.body)
    observador.observe(document.body, {
      attributeFilter: [...ATRIBUTOS],
      attributes: true,
      characterData: true,
      childList: true,
      subtree: true
    })
  }

  if (document.body) {
    empezar()
  } else {
    document.addEventListener('DOMContentLoaded', empezar, { once: true })
  }

  if (MARCA_VISIBLE.test(document.title)) {
    document.title = limpiarTexto(document.title)
  }

  return () => observador.disconnect()
}
