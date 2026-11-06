// Puente de la Bandeja con la API del estudio: el proceso principal de Electron (parche 18, window.kelvoEstudio) hace la
// llamada con la llave del Llavero; aquí sólo viaja el pedido y la respuesta.

export type Pedido = { method?: 'GET' | 'POST'; path: string; body?: unknown }
export type Respuesta = { ok: boolean; status: number; datos?: unknown; error?: string }
declare global {
  interface Window {
    kelvoEstudio?: { pedir: (pedido: Pedido) => Promise<Respuesta> }
  }
}

export async function pedir(pedido: Pedido): Promise<Respuesta> {
  if (!window.kelvoEstudio) {
    return { ok: false, status: 0, error: 'La app no trae el puente kelvoEstudio' }
  }

  return window.kelvoEstudio.pedir(pedido)
}
