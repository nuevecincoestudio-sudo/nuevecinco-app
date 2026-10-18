# Reel de marca en Higgsfield — nuevecinco diseño

## Idea

**"Todo sale del módulo."** Los bloques del 9|5 se vuelven cada servicio: logo, render, pantallas. Un solo hilo visual, 15 segundos, 5 tomas.

## Reglas de marca

- Fondo crema `#F2F1EC`, módulos negro carbón `#1D1D1B`, un solo acento naranja `#FF4B1F`.
- Formas: rectángulos verticales con esquinas redondeadas, superficie mate.
- Textos en Manrope ExtraBold, en minúsculas. Los textos se agregan en la edición; la IA no escribe texto.
- Nada de personas, neón, degradados ni colores fuera de la paleta.

## Por qué el anterior no funcionó

Se generó solo con texto y sin imágenes de la marca, así que la IA inventó formas y colores. Esta vez **cada toma parte de una imagen de la marca** (fotograma de inicio y, cuando aplica, de fin).

## Imágenes para subir (esta carpeta)

| Archivo | Uso |
|---|---|
| `01-modulo-d-macro.png` | Primer plano del módulo naranja con la «d» |
| `02-modulos-sin-d.png` | El 9\|5 sin el módulo naranja |
| `03-logo-crema.png` | Logo completo sobre crema |
| `04-logo-negativo.png` | Logo completo sobre negro |
| `05-modulos-fila.png` | Fila de módulos (base para el render) |
| `06-cierre.png` | Tarjeta final, sin IA |

## Modelo y ajustes

- **MiniMax H3** (10 créditos por 5 s, 2K, acepta imagen de inicio y de fin). Alternativa barata: **Kling 3.0 std sin sonido** (6,25 créditos por 5 s).
- Formato **9:16**, duración **5 s** por toma; en la edición se usan 2,5–3 s de cada una.
- Sonido desactivado: la música se pone al editar.
- Si Higgsfield sugiere un preset, recházalo.

## Tomas

Los prompts van en inglés porque los modelos responden mejor.

**Toma 1 · Gancho (0–3 s)** — inicio `01-modulo-d-macro.png`, fin `03-logo-crema.png`
> Fast smooth camera pull-back from an extreme close-up of a matte vivid orange rounded block with a cream letter "d", revealing the full logo made of matte charcoal black rounded vertical blocks standing on a seamless cream studio floor. Real 3D objects, soft studio light, soft shadows. Keep every shape, color and proportion exactly as in the frames. No new text.

Texto en pantalla: **todo lo que tu marca muestra,** → **lo diseñamos.**

**Toma 2 · Identidad y animación (3–6 s)** — inicio `02-modulos-sin-d.png`, fin `03-logo-crema.png`
> The missing vivid orange rounded block with a cream letter "d" falls from above in slow motion and lands with a soft bounce, completing the logo. Matte 3D blocks on a seamless cream floor, subtle camera push-in, tactile and satisfying. Keep the black blocks unchanged. No new text.

Texto: **identidad de marca · animación**

**Toma 3 · Renderizado (6–9 s)** — inicio `05-modulos-fila.png`, sin fin
> The charcoal black rounded blocks grow and transform into a photorealistic minimalist interior: they become tall columns and shelves, and the orange block becomes a low modular vivid orange sofa. Warm cream plaster walls, late afternoon sunlight with long shadows, slow cinematic dolly forward, architectural render quality. No people, no text.

Texto: **renderizado**

**Toma 4 · Web y redes (9–12 s)** — inicio `04-logo-negativo.png`, sin fin
> The cream rounded blocks on a charcoal background rotate and turn into floating smartphone and laptop screens showing clean minimalist layouts in cream, charcoal and one orange accent; layout cards slide into a neat grid. Slow camera orbit, sleek product-film lighting. No readable text, no logos.

Texto: **diseño web · redes sociales**

**Toma 5 · Cierre (12–15 s)** — sin IA: `06-cierre.png` fija, o el cierre de `reel-resumen.mp4`.

Texto: **un estudio. cinco servicios.** · **escríbenos por dm**

## Edición

- Corta cada toma en su mejor momento: 2,5–3 s.
- Música mínima electrónica de 110–125 BPM; corta las tomas en el golpe del ritmo.
- Pon un golpe suave cuando cae el bloque naranja (toma 2).
- Los textos entran palabra por palabra, en la parte superior, con margen; nunca encima del logo.
- Exporta en 1080 × 1920.

## Presupuesto

| Plan | Tomas con IA | Créditos |
|---|---|---|
| MiniMax H3 | 4 × 10 | 40 |
| Kling 3.0 std | 4 × 6,25 | 25 |
| Mixto (H3 en tomas 1 y 3, Kling en 2 y 4) | 4 | 32,5 |

Repite solo la toma que salga mal, no el reel completo.
