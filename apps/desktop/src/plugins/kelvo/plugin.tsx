// Plugin empaquetado de Kelvo para Hermes Desktop (decisión 2026-11-06-hermes-desktop-grafito-sobre-hermes-sin-modificar).
//
// Vive en el repo kelvo (desktop/hermes-desktop/plugin-kelvo/) y copiar-al-fork.sh lo copia a
// apps/desktop/src/plugins/kelvo/ del fork al armar; en el fork no se edita. Sólo usa el SDK
// (@hermes/plugin-sdk) y los catálogos de idioma de la app.
//
// Qué hace: el tema «Kelvo grafito», la marca Kelvo en todos los textos (marca.ts), esconde las filas de la
// barra lateral que no se usan y pone en la barra de estado dónde corre el motor.

// BUNDLED_TRANSLATIONS lo exporta el parche 16 del fork (KELVO-PARCHES.md).
import {
  BUNDLED_TRANSLATIONS,
  type HermesPlugin,
  host,
  SIDEBAR_NAV_PREFS_AREA,
  STATUSBAR_AREAS,
  THEMES_AREA
} from '@hermes/plugin-sdk'

import { parcialConMarca } from './marca'
import kelvoGrafito from './tema-kelvo-grafito'

/** Versión del motor de la caja. Se actualiza en cada salto (README del plugin). */
const MOTOR = '0.23.0'

/** Textos propios de Kelvo, encima de la marca general. */
const PROPIOS_ES = {
  connectorsPage: { title: 'Conexiones' }
}

const PROPIOS_EN = {
  connectorsPage: { title: 'Connections' }
}

function mezclar(base: Record<string, unknown> | null, encima: Record<string, unknown>): Record<string, unknown> {
  const salida: Record<string, unknown> = { ...(base ?? {}) }

  for (const [clave, valor] of Object.entries(encima)) {
    const previo = salida[clave]

    salida[clave] =
      valor && typeof valor === 'object' && previo && typeof previo === 'object'
        ? mezclar(previo as Record<string, unknown>, valor as Record<string, unknown>)
        : valor
  }

  return salida
}

const plugin: HermesPlugin = {
  id: 'kelvo',
  name: 'Kelvo',
  description: 'Marca, tema y barra de estado de Kelvo.',
  register(ctx) {
    host.i18n.registerAppLocale('es', {
      translations: mezclar(parcialConMarca(BUNDLED_TRANSLATIONS.es), PROPIOS_ES)
    })
    host.i18n.registerAppLocale('en', {
      translations: mezclar(parcialConMarca(BUNDLED_TRANSLATIONS.en), PROPIOS_EN)
    })

    ctx.registerMany([
      { id: 'tema', area: THEMES_AREA, data: kelvoGrafito },
      // Mensajería y Pairing no se usan; la fila la ocupará la Bandeja de solicitudes.
      { id: 'barra', area: SIDEBAR_NAV_PREFS_AREA, data: { hide: ['messaging'] } },
      {
        id: 'motor',
        area: STATUSBAR_AREAS.right,
        order: 10,
        data: {
          id: 'kelvo-motor',
          label: `gpu-01 · motor ${MOTOR} · 0 salieron del computador`,
          variant: 'text'
        }
      }
    ])
  }
}

export default plugin
