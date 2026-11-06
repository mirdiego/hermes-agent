// Marca Kelvo sobre los textos de Hermes Desktop, sin editar sus catálogos.
//
// Recorre el catálogo incluido de un idioma (src/i18n/<id>.ts) y arma un parcial con cada texto que nombra la
// marca del motor, ya reescrito. Las funciones (textos con parámetros) se envuelven: se llama a la original y se
// reescribe lo que devuelve. El parcial se registra con host.i18n.registerAppLocale, que lo mezcla encima del
// catálogo de fábrica (src/i18n/registry.ts). Como parte del catálogo de la versión armada, cada salto de
// versión queda cubierto solo.

const REEMPLAZOS: Array<[RegExp, string]> = [
  [/https?:\/\/[^\s"'`)\]]*nousresearch[^\s"'`)\]]*/g, 'kelvo.cloud'],
  [/https?:\/\/github\.com\/NousResearch[^\s"'`)\]]*/g, 'kelvo.cloud'],
  [/\bNous Research\b/g, 'Kelvo'],
  [/\bNous Portal\b/g, 'portal de Kelvo'],
  [/\bHermes Agent\b/g, 'Kelvo'],
  [/\bHermes Light\b/g, 'Kelvo'],
  [/\bHermes Desktop\b/g, 'Kelvo'],
  [/\bHermes Cloud\b/g, 'Kelvo'],
  [/\bHermes\b/g, 'Kelvo'],
  [/\bHERMES\b/g, 'KELVO'],
  [/\bNous\b/g, 'Kelvo'],
  [/☤/g, '·']
]

const MARCA = /hermes|nous|☤/i

export function reescribir(texto: string): string {
  return REEMPLAZOS.reduce((acc, [patron, nuevo]) => acc.replace(patron, nuevo), texto)
}

type Nodo = Record<string, unknown>

/** Parcial del catálogo con sólo los textos de marca, reescritos. `null` si no hay ninguno. */
export function parcialConMarca(catalogo: unknown): Nodo | null {
  if (typeof catalogo !== 'object' || catalogo === null || Array.isArray(catalogo)) {
    return null
  }

  const salida: Nodo = {}

  for (const [clave, valor] of Object.entries(catalogo as Nodo)) {
    if (typeof valor === 'string') {
      if (MARCA.test(valor)) {
        salida[clave] = reescribir(valor)
      }
    } else if (typeof valor === 'function') {
      if (MARCA.test(Function.prototype.toString.call(valor))) {
        const original = valor as (...args: unknown[]) => unknown

        salida[clave] = (...args: unknown[]) => {
          const resultado = original(...args)

          return typeof resultado === 'string' ? reescribir(resultado) : resultado
        }
      }
    } else {
      const hijo = parcialConMarca(valor)

      if (hijo) {
        salida[clave] = hijo
      }
    }
  }

  return Object.keys(salida).length > 0 ? salida : null
}
