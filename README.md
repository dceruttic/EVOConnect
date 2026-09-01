# REVAI × STAAR — Demo environment

Deploy estático de dos superficies de la plataforma EVO Connect:

- **`/dashboard`** — EVO Connect (cara clínica): flujo por paciente pre-op → selección de ICL →
  planificador quirúrgico → cirugía → post-op, más Phase Demo Mode
- **`/intelligence`** — STAAR Intelligence Center (cara HQ): analítica clínica, operations pulse,
  supply chain, agentes de IA

## Estructura

```
index.html                landing que enlaza ambas superficies
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
- Backup del estado previo al refactor: `EVOConnect-backup-2026-09-01/` junto a este repo.
