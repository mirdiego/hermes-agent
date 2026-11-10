// Puente de la Bandeja con la API del estudio y con el cliente simulado: el proceso principal de Electron (parches 18 y
// 30 y 36, window.kelvoEstudio) hace las llamadas con las llaves del Llavero; aquí sólo viajan el pedido y la respuesta.

export type Pedido = { method?: 'GET' | 'POST'; path: string; body?: unknown }
export type Respuesta = { ok: boolean; status: number; datos?: unknown; error?: string }
export type PedidoCliente = { input: string; sesion: string }
export type RespuestaCliente = { ok: boolean; status?: number | string; run_id?: string; output?: string; error?: string }
export type PedidoArchivo = { codigo: string; id: string; nombre?: string; accion: 'abrir' | 'descargar' }
export type PedidoBiblioteca = { accion: 'piezas' | 'publicar' | 'retirar'; ruta?: string; titulo?: string; origen?: string; pieza?: string; motivo?: string }

declare global {
  interface Window {
    kelvoEstudio?: {
      pedir: (pedido: Pedido) => Promise<Respuesta>
      cliente?: (pedido: PedidoCliente) => Promise<RespuestaCliente>
      biblioteca?: (pedido: PedidoBiblioteca) => Promise<Respuesta>
      archivo?: (pedido: PedidoArchivo) => Promise<{ ok: boolean; nombre?: string; error?: string }>
    }
  }
}

export async function pedir(pedido: Pedido): Promise<Respuesta> {
  if (!window.kelvoEstudio) {
    return { ok: false, status: 0, error: 'La app no trae el puente kelvoEstudio' }
  }

  return window.kelvoEstudio.pedir(pedido)
}

/** Una corrida del perfil cliente-simulado de la caja; espera hasta que termine. */
export async function correrCliente(pedido: PedidoCliente): Promise<RespuestaCliente> {
  if (!window.kelvoEstudio?.cliente) {
    return { ok: false, error: 'La app no trae el puente del cliente simulado' }
  }

  return window.kelvoEstudio.cliente(pedido)
}

/** La biblioteca de servicios de la caja (parche 36): listar, publicar y retirar piezas. */
export async function biblioteca(pedido: PedidoBiblioteca): Promise<Respuesta> {
  if (!window.kelvoEstudio?.biblioteca) {
    return { ok: false, status: 0, error: 'La app no trae el puente de la biblioteca' }
  }

  return window.kelvoEstudio.biblioteca(pedido)
}

/** Abre o descarga un archivo del informe de una solicitud (parche 37); lo baja el proceso principal. */
export async function archivoSolicitud(pedido: PedidoArchivo): Promise<{ ok: boolean; nombre?: string; error?: string }> {
  if (!window.kelvoEstudio?.archivo) {
    return { ok: false, error: 'La app no trae el puente de archivos' }
  }

  return window.kelvoEstudio.archivo(pedido)
}
