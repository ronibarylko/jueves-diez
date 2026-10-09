---
name: Avances semanales de Roni
description: Decks de avances de Flock Labs I+D, Computer Vision, sobre el design system de Flock.
colors:
  lab-black: "#000000"
  lab-black-subtle: "#0A0A0A"
  chalk-white: "#FFFFFF"
  graphite-gray: "#A8A8A8"
  disabled-gray: "#6B6B6B"
  hairline: "#1A1A1A"
  hairline-strong: "#3D3D3D"
  glass-6: "rgb(255 255 255 / 6%)"
  glass-12: "rgb(255 255 255 / 12%)"
  cv-magenta: "#EC00FF"
  cv-magenta-light: "#ECB0FF"
  cv-magenta-dark: "#590069"
typography:
  display:
    fontFamily: "Poppins, sans-serif"
    fontSize: "128px"
    fontWeight: 500
    lineHeight: "118px"
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Poppins, sans-serif"
    fontSize: "80px"
    fontWeight: 500
    lineHeight: "80px"
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Poppins, sans-serif"
    fontSize: "32px"
    fontWeight: 500
    lineHeight: "36px"
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Poppins, sans-serif"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: "26px"
  label:
    fontFamily: "Poppins, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: "16px"
    letterSpacing: "0.18em"
rounded:
  sm: "4px"
  md: "8px"
  card: "12px"
  lg: "20px"
  pill: "999px"
spacing:
  label: "12px"
  card-padding: "24px"
  gutter: "32px"
  region: "64px"
  slide-inset: "80px"
components:
  card-highlight:
    backgroundColor: "{colors.glass-6}"
    textColor: "{colors.chalk-white}"
    rounded: "{rounded.card}"
    padding: "24px"
  card-surface:
    backgroundColor: "{colors.lab-black}"
    textColor: "{colors.chalk-white}"
    rounded: "{rounded.card}"
    padding: "24px"
  stat:
    backgroundColor: "{colors.glass-6}"
    textColor: "{colors.chalk-white}"
    rounded: "{rounded.card}"
    padding: "32px 40px"
  number-badge:
    backgroundColor: "{colors.glass-6}"
    textColor: "{colors.chalk-white}"
    rounded: "{rounded.pill}"
    size: "72px"
  button-primary:
    backgroundColor: "{colors.chalk-white}"
    textColor: "{colors.lab-black}"
    rounded: "{rounded.pill}"
  button-secondary:
    backgroundColor: "{colors.glass-6}"
    textColor: "{colors.chalk-white}"
    rounded: "{rounded.pill}"
  button-secondary-hover:
    backgroundColor: "{colors.glass-12}"
---

# Design System: Avances semanales de Roni

<!-- Basado en el design system de Flock Labs I+D (design/_ds/, bajado de Claude Design con revisar_ds.py). Ese sistema manda: este archivo documenta cómo lo usan los decks de Roni y sus excepciones. -->

## Overview

**Creative North Star: "El laboratorio con calle"** *(propuesta: Roni no tenía una metáfora; se puede cambiar)*

Decks técnicos con un poco de cancha. El fondo es negro y plano, el texto blanco y gris, y el único color es el de la vertical, que aparece poco y en lugares fijos. La personalidad no viene de la decoración sino de la escritura: títulos que afirman con un número ("16 hilos no alcanzan"), tesis grandes que se animan a una conclusión ("Se compra por hilos, no por GPU") y un castellano rioplatense directo, sin vender.

Cada slide hace una sola afirmación. La jerarquía se arma con tamaño, peso y el contraste entre blanco y gris; lo que no entra en una línea se reescribe más corto, no se achica. Los momentos fuertes son los números grandes y las tesis; las tarjetas son soporte, no estructura.

**Key Characteristics:**
- Negro plano, sin degradados, sombras ni vidrio.
- Títulos de una línea que afirman, con el dato adentro.
- Un mensaje por slide; el resto se dice en voz alta.
- El color de la vertical solo donde el design system de Flock lo permite.
- Nada de cursiva en estos decks.

## Colors

Neutros que cargan toda la jerarquía, más un acento por vertical que se usa con cuentagotas.

### Primary
- **Magenta Computer Vision** (cv-magenta): el color de la vertical de Roni. Solo en la barra de las tesis y citas, en los puntos de la "Lista centrada", en el shader de la portada, en la marca de la vertical y en el foco. Las otras verticales cambian este color por el suyo con `data-vertical`.

### Neutral
- **Negro laboratorio** (lab-black): el fondo de todas las slides y de las tarjetas con borde.
- **Negro de borde de pantalla** (lab-black-subtle): solo fuera del lienzo.
- **Blanco tiza** (chalk-white): títulos, números grandes y texto principal.
- **Gris grafito** (graphite-gray): texto secundario, notas y rótulos.
- **Línea fina** (hairline) y **línea fuerte** (hairline-strong): los únicos bordes, de 1px.
- **Vidrio 6 %** (glass-6): el relleno de las tarjetas destacadas, los números grandes y los badges.

### Named Rules
**The Accent Rarity Rule.** El color de la vertical nunca va en números, títulos, bordes de tarjeta, rótulos ni fondos. Si un dato tiene que destacarse, se destaca con tamaño, posición o con el resto en gris.

## Typography

**Display Font:** Poppins (sans-serif)
**Body Font:** Poppins (sans-serif)

**Character:** una sola familia en dos pesos, 500 para estructura y 400 para texto. El design system de Flock trae Newsreader en cursiva para frases destacadas, pero **en estos decks la cursiva está prohibida** (regla de Roni en `design/CLAUDE.md`).

### Hierarchy
- **Display** (500, 128px, 118px de interlínea): solo el título de la portada.
- **Headline** (500, 80px, una línea de hasta unos 32 caracteres): el título de cada slide, siempre una afirmación.
- **Title** (500, 32px): los títulos de las tarjetas.
- **Body** (400, 24px): el texto de las tarjetas y las notas; una o dos frases como máximo.
- **Label** (500, 18px, mayúsculas, espaciado 18 %): el rótulo arriba del título y la línea de la portada.

### Named Rules
**The One Style Rule.** Un título va en un solo peso y estilo: nada de mitad negrita, mitad cursiva.
**The Rewrite Rule.** Si no entra, se reescribe; nunca se achica la letra ni el padding.

## Layout

Lienzo fijo de 1920 × 1080 con 80px de margen y 1632px de ancho de contenido. Grillas de 2, 3 o 4 columnas con 32px de separación. El contenido corto se centra ópticamente en el área segura en vez de pegarse arriba. Los rótulos del frente ("Avedis · …", "Pistachos · …") ordenan el deck cuando hay más de un tema.

## Elevation & Depth

Plano por completo: no hay sombras. La profundidad se da con rellenos de vidrio (6 %, 12 % al pasar el mouse) y líneas finas de 1px.

## Shapes

Esquinas de 12px en tarjetas y números grandes; píldora en botones, badges numerados y la barra de las tesis. Líneas de 1px.

## Components

### Tesis (why-statement)
La conclusión de una sección a 72px junto a una barra vertical del color de la vertical, con 3 o 4 filas de razones al costado y la última destacada. Es el momento fuerte de cada frente y la forma del cierre "Qué aprendimos".

### Números grandes (stat-row)
Tres números a 96px sobre vidrio 6 %, con una línea de explicación y una nota abajo. Para comparar equipos o pruebas, dos slides gemelas con el mismo orden de métricas.

### Tarjetas
- **Destacada:** vidrio 6 %, esquina de 12px, 24px de padding.
- **Con borde:** negro con línea fina, para listas de pasos.
- Título de tarjeta a 32px y una o dos frases a 24px como máximo.

### Pasos numerados
Badge redondo de 72px con 01 a 0n, solo cuando el orden importa. Cada paso dice cuándo está terminado.

### Cita
Frase de campo a 56px con la barra del color de la vertical, y el porqué debajo en gris.

## Do's and Don'ts

### Do:
- **Do** poner la conclusión en el título, con el número adentro.
- **Do** cerrar cada deck con "Qué aprendimos" y "Qué sigue".
- **Do** usar números grandes y tesis como los momentos fuertes.
- **Do** escribir los siguientes pasos con "Terminado cuando…".

### Don't:
- **Don't** usar cursiva, ni la de Newsreader.
- **Don't** pintar números, títulos, bordes o rótulos con el color de la vertical.
- **Don't** usar sombras, degradados, vidrio esmerilado ni bordes de color a un costado.
- **Don't** llenar una slide de tarjetas iguales con párrafos: un mensaje por slide.
- **Don't** usar emoji, signos de exclamación ni preguntas retóricas como título.
