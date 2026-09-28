# web-kit — AGENTS.md

> Estructura compartida de los sitios de cliente. Documentación completa:
> https://docs.adwebcrm.com/web-kit/ (fuente: `sitio-docs`). Este fichero
> repite solo lo que cuesta dinero.

## Qué es este repo

Biblioteca de estilos, componentes, layout, scripts y librería que consumen
todos los sitios de cliente vía `github:Dacasan/web-kit#semver:^X.Y.Z`.
Los sitios son SOLO composición: páginas, `src/data/site.ts`, `brand.css`,
`public/`. Si estás editando un componente de cliente desde aquí, o un
componente del kit desde un sitio, la frontera está cruzada.

## Reglas que cuestan dinero

1. **`demo/` es el release gate.** `pnpm --dir demo build` debe pasar antes
   de tagear — el catálogo importa TODOS los componentes: si compila, no
   hay componente roto. Tag solo con build verde.
2. **Versiones por tag, no por rama.** Los sitios resuelven
   `semver:^X.Y.Z` contra tags de git. Un cambio debe salir con tag
   (`v1.2.N`) o ningún sitio lo verá.
3. **Mobile-first literal, un breakpoint: `900px`.** Cero
   `@media (max-width` — si escribes uno, la lógica está invertida.
4. **Sin dependencias nuevas.** `astro` como peer dep y nada más. Ni
   Tailwind, ni React, ni librería de iconos.
5. **Los datos del negocio nunca entran al kit.** El kit consume
   `@agenciaweb/kit-site` (alias que cada sitio resuelve a su `site.ts`).

## Medición (v1.2.8, 2026-09-28)

`SeoHead.astro` emite tags opt-in según el `site.ts` del consumidor:

| Campo | Emite | Estado vacío |
|---|---|---|
| `googleAdsConversionId` | Google tag (gtag.js) base, `AW-…` | No emite nada |
| `metaPixelId` | Meta pixel base code (v1.2.8+) + noscript fallback | No emite nada |

- **Cast defensivo** en SeoHead: los campos son opcionales a nivel de tipos
  (`site as {...}`) — un sitio viejo que actualice el kit sigue compilando.
- **demo/scaffold nacen apagados** (`""`): el catálogo no debe emitir tags
  de terceros y los sitios nuevos heredan el estado neutro.
- **Las conversiones NO viven aquí.** El píxel y el gtag son señal de
  página/cookies de primera parte; las conversiones las entrega el CRM
  server-side (Google Data Manager, Meta CAPI — ver
  https://docs.adwebcrm.com/crm/attribution/).
- **`ContactFields.astro` es contrato con el CRM** (`god.js` rellena,
  `lead-form.ts` lee). Los campos ad-level de Google Ads llevan prefijo
  `gads_`. Cambiar names de un solo lado = pérdida silenciosa de datos
  (two-PR change junto con `god.ts` del CRM).

## Verify

```bash
pnpm --dir demo build                              # release gate
grep -c 'metaPixelId' components/SeoHead.astro     # opt-in presente
grep -rn 'gtag\|fbq\|connect.facebook' demo/src/   # debe devolver 0:
                                                   # el catálogo no emite tags
```
