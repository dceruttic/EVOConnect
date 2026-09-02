# REVAI × STAAR — Demo environment

Deploy estático de las tres superficies de la demo REVAI × STAAR:

- **`/stella`** — Stella (STAAR, system of record): réplica de la calculadora y entorno de pedido de
  STAAR. Arranca en la pantalla de login. Punto de entrada del recorrido STELLA-first del ESCRS

- **`/dashboard`** — EVO Connect (cara clínica): flujo por paciente pre-op → selección de ICL →
  planificador quirúrgico → cirugía → post-op, más Phase Demo Mode
- **`/intelligence`** — STAAR Intelligence Center (cara HQ): analítica clínica, operations pulse,
  supply chain, agentes de IA

## Estructura

```
index.html                landing estilo Apple con DS de STAAR Surgical: hero, tres tiles, un capítulo por
                          superficie, bento del decision record, CTA. 100% autocontenida (logos, fondo y capturas
                          embebidos) — abre bien incluso con file://. Reveal con IntersectionObserver
assets/showcase/*.webp    capturas reales de /stella, /dashboard e /intelligence (1800px, para la landing)
assets/staar-surgical-logo-white.svg, stella-hero-bg.webp — extraídos de stella/; logo Stella: assets/marketplace/stella_logo_official.svg
stella/
  index.html              archivo único, autocontenido (assets embebidos como data URIs)
assets/                   imágenes compartidas (WebP + SVG) — única copia
dashboard/
  index.html              shell + <link>/<script> (~660 líneas)
  css/01..40-*.css        estilos por sección
  js/01..34-*.js          app por módulo
intelligence/
  index.html              shell + <link>/<script> (~140 líneas)
  css/styles.css
  js/01..07-*.js
vercel.json
```

**El orden de carga importa.** Los `js/*.js` son *scripts clásicos*, no módulos ES: comparten
el scope global y se ejecutan en el orden en que aparecen en `index.html`. Por eso van
numerados. Si agregás un archivo, insertalo en la posición correcta; si movés uno, revisá que
nada anterior dependa de sus `const`/`let` de nivel superior.

Lo mismo con el CSS: `css/01-*` define los tokens del design system que consumen las demás
hojas.

### Rutas absolutas, no relativas

Todas las referencias a `css/`, `js/` y `assets/` son **absolutas desde la raíz**
(`/dashboard/css/…`, `/assets/…`). No es cosmético: con `cleanUrls: true` Vercel sirve
`/dashboard` **sin** barra final, y ahí una ruta relativa como `css/x.css` resuelve contra la
raíz del sitio (`/css/x.css`) y da 404. Con barra final funcionaría; sin ella, no. Las rutas
absolutas funcionan en los dos casos.

Por eso hay que abrir el proyecto con un servidor (`python3 -m http.server`), no con
`file://`.

## Assets

Una sola copia en `/assets`, referenciada desde `dashboard/` como `../assets/…`. Los PNG
pesados están en WebP (q95 para imágenes clínicas, lossless para mapas Pentacam y logos).
No vuelvas a duplicar la carpeta dentro de `dashboard/` o `intelligence/`.

Antes de borrar un asset, verificá que no esté referenciado:

```bash
grep -rn "nombre-del-asset" --include=*.html --include=*.js --include=*.css .
```

## Preview local

```bash
python3 -m http.server 8080
# o
npx serve .
```

Abrí http://localhost:8080

## Deploy

Push a GitHub → auto-deploy en Vercel (proyecto `revai-staar-demo`, team REVAI).
Sin build step: HTML/CSS/JS estático.

## Notas

- Toda la data clínica es **mockeada**. No hay PHI real.
- Backup del estado previo al refactor: `EVOConnect-StaarIntelCenter-backup-2026-09-01/` junto a este repo.

## Recorrido 1 (ESCRS) — Stella → EVO Connect handoff

Implementado en `stella/index.html` (tarjeta de lanzamiento en `#revai-launch-slot`, sólo tras
"Save and Calculate"), `dashboard/js/35-stella-handoff.js` (carga último: envuelve globals) y
`dashboard/css/41-stella-handoff.css`. El caso viaja Stella → EVO Connect por
`/dashboard?handoff=<base64url JSON>` (< 2 KB, sin PHI, espejo en sessionStorage). Cero bytes
vuelven a Stella: el retorno es `href="/stella"` sin nada adjunto.

Guion del presentador (6 líneas):
1. En STELLA abrir PSEUDO-4471, OD, **Save and Calculate** → "STELLA recomienda 13.2 mm. Es el número oficial."
2. Panel flotante a la derecha: "Otras metodologías de sizing se comparan en EVO Connect. Salimos de STELLA." **Open in EVO Connect** → elegir **OD** (o OS / OU) → se abre en pestaña nueva.
3. "Mismo caso, mismo ojo, mismos inputs — nada retipeado. El 13.2 de STELLA queda a la derecha, bloqueado."
4. **Run formulas**: "ICL Guru, ICLFIT, CASIA2 — cada uno con dispositivo y versión. Sin ranking."
5. **Your decision** → Prefer 13.6 mm · ICL Guru · Vault prediction · **Save decision**: "Queda la razón registrada; el mismo registro se guarda si mantiene 13.2."
6. **Return to STELLA to confirm the order**: "No se envió nada. El cirujano carga 13.6 en STELLA y STELLA crea la orden."
