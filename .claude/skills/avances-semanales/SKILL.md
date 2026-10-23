---
name: avances-semanales
description: Flujo para preparar la presentación semanal de avances de los jueves 10:00 (Flock Labs · I+D). Actualiza el design system desde Claude Design, revisa qué cambió en la carpeta de proyectos, pregunta qué incluir, arma el deck como Artifact, lo itera con la persona (a mano y por chat), escucha su práctica y le da feedback de storytelling, y lo deja listo para presentar. Usar cuando digan "Vamos a preparar las slides semanales" o algo parecido ("preparemos los avances", "armemos la presentación del jueves", "practiquemos los avances semanales"), cuando la corra la rutina de los miércoles, o cuando pidan "configurá avances semanales" o "creá la rutina de avances semanales".
---

# Avances semanales

La persona trabaja de viernes a miércoles y presenta sus avances los jueves a las 10:00. Este flujo arranca de dos formas:
- Cuando dice "Vamos a preparar las slides semanales", en cualquier momento.
- Con la rutina programada de los miércoles a las 18:00. Si ese miércoles ya lo corrió antes, la rutina le pasa el link del deck y sigue desde "Iterar juntos".

Todo pasa en la carpeta de este repo (donde está esta skill, dentro de `.claude/skills/`). El repo tiene que estar clonado al lado de los proyectos de la persona: `cambios.py` revisa la carpeta padre.

`config.json` tiene lo que cambia de persona a persona: `nombre`, `area` (la línea de la portada), `vertical` (paleta e imágenes de Flock), `design_proyecto` (el proyecto de Claude Design con su Template) y `design_system` (la carpeta del design system dentro de ese proyecto) y `navegador` (`"edge"`, o vacío para el predeterminado: donde `practicar.py` abre el deck de práctica). Leelo al empezar.

## Primera vez

Si falta `design/_ds/`, `PRODUCT.md` o `DESIGN.md` (no se suben al repo: cada persona los genera), o la persona pide "configurá avances semanales":

1. Chequeá que esté Impeccable (ver "Antes de empezar"). Sin Impeccable no se sigue.
2. Si no existe `config.json`, copialo de `config.ejemplo.json` (no se sube al repo). Revisalo con la persona: que el nombre, el área y la vertical sean los suyos, y que tenga acceso al proyecto de Design. Las imágenes de cada vertical tienen que estar en `design/assets/verticals/<vertical>/` (`shader-sidebar.png` y `mask-group.png`). DesignSync no baja bien imágenes grandes: si faltan, pedile que las exporte de Claude Design y las deje ahí.
3. Corré `python revisar_ds.py`. Baja el design system, `slide.css`, `CLAUDE.md` y el Template. Si no puede traer nada, pedile que corra `/design-consent` y que vuelva a intentar.
4. Si no existe `PRODUCT.md`, invocá `impeccable:impeccable` con `init`. Contexto para responderle: son decks de avances semanales de Flock Labs I+D, 1920×1080, para presentar a un equipo técnico; se ven como Artifact en claude.ai; la identidad visual es el design system de Flock en `design/_ds/` y las reglas de `design/CLAUDE.md`. Si no existe `DESIGN.md`, invocala con `document` para que deje el design system ahí.
5. Para las figuras (opcional): si la skill `anatomy` no está disponible, ofrecé instalarla con `git clone --depth 1 https://github.com/wheresryan22/anatomy "$HOME/.claude/skills/anatomy"` (pedí permiso; hace falta una sesión nueva para que aparezca). Necesita Node 20.10 o más nuevo y Chrome o Edge para sus chequeos. Sin anatomy el flujo anda igual, solo que sin figuras.
6. Para practicar: `python -m pip install faster-whisper` (y, con placa NVIDIA, `nvidia-cublas-cu12 "nvidia-cudnn-cu12==9.*"`), y después `python practicar.py --instalar`, que lo deja corriendo en segundo plano y arrancando con Windows (sin eso, el botón Practicar no anda). Pedí permiso antes de cada uno. El feedback automático usa el comando `claude`: si `claude --version` no anda, avisale.
7. Si no existe `memoria.md`, crealo con el título "Memoria de avances semanales" y las secciones "Cómo trabajar", "Mi estilo", "Cómo presento", "Para mejorar" y "Prácticas". Si ya hay decks en `design/`, llená "Mi estilo" y "Para mejorar" leyéndolos (con la skill `orquestar`).
8. Ofrecé crear la rutina (ver "Crear la rutina", más abajo).

## Al arrancar el flujo

1. Escribí en `ultima_corrida.txt` la fecha y la hora de ahora (`2026-10-14 16:30`). La rutina de los miércoles lo lee para no correr dos veces el mismo día.
2. Si tenés la herramienta para cambiar el título de la sesión (`set_session_title`), poné "Avances semanales · <fecha del deck>", así la encuentra en la barra lateral.

## Antes de empezar

- **Impeccable es obligatorio.** Si la skill `impeccable:impeccable` no está disponible, pará y explicale cómo instalarlo: el repo ya lo declara en `.claude/settings.json`, así que alcanza con confiar en la carpeta al abrirla y, si `/plugin` dice que está habilitado pero no instalado, instalarlo desde ahí con alcance de proyecto (o `/plugin marketplace add pbakaus/impeccable` y después instalar Impeccable desde `/plugin` → Discover). Después hay que abrir una sesión nueva.
- La carpeta padre tiene un proyecto por subcarpeta. Algunos son repos git. También puede haber notas y listas de pendientes sueltas.
- Leé `memoria.md` (lo aprendido en semanas anteriores) y `design/CLAUDE.md` (reglas de tipografía, obligatorias). Respetá ambos en todo lo que hagas.
- Fecha del deck: el próximo jueves (hoy, si es jueves), en formato `15 OCT 2026`. Meses: ENE FEB MAR ABR MAY JUN JUL AGO SEPT OCT NOV DIC.
- Para repartir lecturas grandes, usá la skill `orquestar` (si no está disponible, leé `.claude/skills/orquestar/SKILL.md`). Los workers que nombra pueden no estar instalados: en ese caso usá `general-purpose` con `model: "haiku"` para leer y resumir, y `model: "sonnet"` si hace falta criterio. Los subagentes no tienen DesignSync ni la herramienta Artifact: eso lo hacés vos.
- Escribí corto y en castellano rioplatense. Una pregunta a la vez cuando necesites una decisión.
- **Anatomy, para explicar con un dibujo.** Cuando un frente se entiende mejor viendo cómo funciona (un sistema, un algoritmo, un pipeline, un componente, un antes y después de un mecanismo), la skill `anatomy` lo dibuja como un objeto físico isométrico e interactivo. Se usa como dice "Figuras con anatomy" (paso 3). No es para datos (eso es un gráfico) ni para listas o cronogramas. Si no está disponible, seguí sin figuras y mencionalo una vez.
- Solo escribís en `design/`, `memoria.md`, `ultima_corrida.txt`, lo que genera Impeccable (`PRODUCT.md`, `DESIGN.md`) y lo que guarda `practicar.py` en `practicas/`. Claude Design es solo lectura. Nada de git add, commit ni push.

## 1. Design System

Corré en background `python revisar_ds.py` (tarda un par de minutos) y seguí con el paso 2 mientras tanto. Compara el design system, `slide.css`, `CLAUDE.md` y el Template de Claude Design con la copia en `design/` y actualiza lo que cambió.

Si dice que no pudo traer archivos, puede ser falta de autorización: pedile que corra `/design-consent` y seguí con la copia local.

Contale en una línea lo que imprimió el script. Si actualizó algo del design system, invocá `impeccable:impeccable` con `document` para que `DESIGN.md` quede al día.

## 2. Qué cambió en la semana

1. Corré `python cambios.py`. Lista por carpeta los commits, los cambios sin commitear y los archivos modificados desde el jueves anterior a las 10:00.
2. Entendé qué avanzó, leyendo solo lo que importa. "Sin commitear" puede ser trabajo viejo: mirá la fecha del archivo antes de contarlo como avance de la semana. Revisá también si hay material de semanas anteriores que nunca se presentó.
3. Armá la lista de candidatos: un frente por ítem, con una línea sobre qué avanzó y la evidencia (archivo o commit).
4. Preguntá con AskUserQuestion:
   - Qué frentes incluir (multiSelect, hasta 4 opciones por pregunta; si hay más, partilas en varias preguntas).
   - La audiencia.
   - Los minutos que tiene. Las opciones son minutos ("10 minutos"), nunca cantidad de slides: eso lo decidís vos.

   Con "Other" puede sumar algo que no apareció, como reuniones o gestión comercial.

## 3. Armar el deck

El deck es un Artifact de claude.ai: la persona lo ve, lo edita a mano y lo presenta desde ahí.

1. Leé `design/_ds/*/readme.md` (qué clases hay y cuándo usarlas), el Template y los decks anteriores en `design/`, sobre todo el más reciente, para seguir el estilo y el hilo de lo que ya se contó. Armalo con el estilo de la sección "Mi estilo" de `memoria.md`, y aplicá lo que esté en "Para mejorar".
2. Escribí `design/Avances Semanales - <fecha>.html` con el contenido de slides del Template y los decks anteriores, en este formato:
   - Sin `<!DOCTYPE>`, `<html>`, `<head>` ni `<body>`: el Artifact los pone al publicar.
   - `data-p` en cada elemento de primer nivel: `<title>`, cada `<link>`, el `<style>`, `<deck-stage>` y los dos `<script>`. Es lo que se guarda cuando la persona edita a mano.
   - Los `<link>` apuntan a `ds/tokens/<archivo>` (`fonts.css`, `colors.css`, `typography.css`, `spacing.css`, `radius-size.css`, `type-styles.css`) y a `slide.css`.
   - `<deck-stage data-p data-vertical="<vertical>" data-minutos="<minutos que tiene>" width="1920" height="1080">`, la portada con el `area` de `config.json` y la fecha fija en `data-auto-date="<fecha>"`.
   - Al final, `<script data-p src="deck-stage.js"></script>` y `<script data-p src="editor.js"></script>`.
   - Unas slides por minuto, con el hilo pensado para esa audiencia. Títulos de hasta unos 32 caracteres, para que entren en una línea.

   Si ya existe el archivo o la fecha ya está en `design/artifacts.txt`, preguntá antes de pisarlo.
3. **Figuras con anatomy.** Mirá si algún frente tiene una idea que se explica mejor mostrando el mecanismo que con texto (ver "Antes de empezar"). Si hay uno, proponelo en una pregunta: qué frente, qué objeto lo explicaría (en una línea: qué se mueve y qué significa) y que tarda hasta una hora. Si dice que no, o no hay ninguno, seguí. Si dice que sí:
   - Una figura por deck como máximo, salvo que pida más, y siempre de tamaño **Figure** de anatomy (nunca Hero ni Epic, salvo que lo pida).
   - Armala en un subagente `general-purpose` en segundo plano, sin `model` (la calidad la pone el modelo de la sesión), mientras seguís con Impeccable. Pasale: que invoque la skill `anatomy` y la siga completa (incluida su verificación); el concepto y los números reales del frente, que tienen que ser verdad; el objeto elegido; que el build quede en `design/figuras/<fecha ISO>-<nombre>/build.mjs`, importe el kit desde la carpeta de la skill (`$HOME/.claude/skills/anatomy/kit/` y `scripts/inline-kit.mjs`) y escriba la página sola en `design/figuras/<fecha ISO>-<nombre>.html`; el tema (`--light` si la slide es de fondo claro); los textos de la tarjeta (título, pista, lectura) en castellano y cortos; y que no use WebGL salvo que la idea lo pida. Que devuelva el path del HTML y una línea con lo que muestra.
   - En el deck, una slide para la figura: el título con el mensaje y `<iframe class="figura" src="figuras/<fecha ISO>-<nombre>.html" title="<qué muestra>" loading="lazy"></iframe>` ocupando el cuerpo (la regla `.figura` va en el `<style data-p>`: sin borde, `display: block` y el tamaño del área de contenido del Template). Hasta que el subagente termine, el iframe puede apuntar a un archivo que todavía no existe: no publiques antes de que esté.
   - Probado el 23/10/2026: un `<iframe>` a una página publicada en `files` del mismo Artifact carga y se mueve. `practicar.py` sirve `design/` entero, así que en la práctica también anda.
4. Pasada de Impeccable, siempre, antes de publicar, invocando `impeccable:impeccable` sobre el archivo:
   1. `critique`: qué se ve mal o confuso.
   2. `distill` en las slides con mucho texto: un mensaje por slide (está en "Para mejorar").
   3. `typeset`: jerarquía y legibilidad de los textos.
   4. `polish`: el pulido final.

   **Límites de Impeccable**, en este paso y en todos los que lo usan: no salir del design system de Flock (clases y tokens de `design/_ds/`) ni de `design/CLAUDE.md` (nada de cursiva, un solo estilo por título), no tocar el formato de arriba (`data-p`, los `<link>`, los `<script>`, `deck-stage`) y no tocar las figuras de `design/figuras/` (sí la slide que las contiene). Contale en una línea qué cambió por Impeccable.
5. Publicalo con la herramienta Artifact:
   - `file_path`: el archivo.
   - `icon: "slides"`, una `description` de una oración y `capabilities: {"artifact": {}}`.
   - `root`: la carpeta `design`.
   - `files`:
     - `deck-stage.js`, `editor.js` y `slide.css`, con su mismo nombre.
     - `ds/tokens/<archivo>` desde `<design_system>/tokens/<archivo>`, para los seis tokens de arriba.
     - Las imágenes que use el deck, con su path de `assets/`. Como mínimo, `assets/brand/Vector-black.svg` y las dos de `assets/verticals/<vertical>/`.
     - Las figuras, con su path de `figuras/` (solo el `.html`, no el `build.mjs`).

     El servicio no acepta paths que empiecen con `_`: por eso el design system se publica como `ds/`.
6. Agregá una línea `<fecha> <link>` a `design/artifacts.txt`.
7. Pasale el link y contale en 3 líneas el hilo que elegiste y qué dejaste afuera.

## 4. Iterar juntos

- **A mano:** en el Artifact, botón "Editar" de la barra de abajo a la derecha. Hace click en un texto, lo cambia y aprieta "Guardar", que publica una versión nueva. ◀ ▶ mueven entre slides.
- **Por chat:** la persona pide cambios y vos los hacés.
  1. Antes de cada edición, leé el Artifact (`action: "read"` con su link): los cambios a mano solo están ahí.
  2. Copiá al archivo local lo que está entre `<body>` y `</body>`.
  3. Editá el archivo. Si el cambio toca el diseño (no solo el texto: slides nuevas, layout, recuadros, íconos, separadores, gráficos), invocá `impeccable:impeccable` con `polish` sobre esas slides **antes de republicar**, y `distill` si alguna quedó cargada de texto. Con los límites del paso 3. Siempre con la herramienta Skill: revisar el deck a mano o en el navegador no cuenta como polish. Cambiar textos, títulos, negritas u orden no lo necesita. Cerrá cada respuesta con una línea: "Polish: sí (slides 4 y 7)" o "Polish: no hizo falta, solo texto". El 15/10 y el 22/10 se iteraron decks enteros sin polish: no lo saltees por ir rápido. El hook `.claude/hooks/recordar_polish.py` te lo recuerda antes de cada publish del deck. Si pide un dibujo o diagrama que explique cómo funciona algo, o un cambio en una figura, usá anatomy como en "Figuras con anatomy" (para cambiar una figura, el subagente edita su `build.mjs` y lo vuelve a correr), y republicá con la figura en `files`.
  4. Republicalo con el mismo `url` (en esta misma sesión alcanza con el mismo `file_path`).
- Si pide "correle Impeccable" (o algo parecido), invocá la skill `impeccable:impeccable` (`audit` si el deck está casi listo, `critique` si no), no una revisión propia.
- Cada cambio que pide, o que hizo a mano (lo ves al comparar el Artifact con tu archivo local), dice algo de su estilo. Si sirve para otras semanas, sumalo en una línea a "Mi estilo" de `memoria.md`, o actualizá la línea que ya hay.

## 5. Practicar

La única forma de practicar es con Whisper: el deck en el navegador de la persona, servido por `practicar.py`, graba el audio y Whisper (`faster-whisper`, modelo `medium`) lo transcribe en esta compu. Claude no recibe audio, solo el texto y las medidas. El botón Practicar del Artifact no graba (el Artifact no puede usar el micrófono) ni arranca programas: abre en otra pestaña `http://localhost:8766/?fecha=<fecha>`, que responde porque `practicar.py` corre en segundo plano desde que se instaló (`--instalar`: arranca con Windows, Whisper se carga solo al transcribir). Probado y descartado para que el botón lo arranque: `jueves-diez://` directo desde el Artifact (no llega a Windows), `file://` (no se abre) y una página puente publicada en el Artifact (claude.ai la bloquea desde la web). No ofrezcas otras formas (dictado de Windows, micrófono del chat).

1. Traé al archivo local los cambios hechos a mano en el Artifact (como en el paso 4: leerlo y copiar el `<body>`): `practicar.py` sirve el archivo local, no el Artifact. No llegan solos: el link de Practicar lleva solo `&guardado=` (la hora del último Guardar, `data-guardado` en el `<deck-stage>`), y si es más nueva que la de la copia local, `practica-local.js` avisa "Pedile a Claude: traé mis cambios". Mandar el deck entero en el link (`#sync=`) se probó el 15/10 y no anda: la app de Claude no abre links tan largos ("No se pudo abrir el enlace"). **Salvo** que exista `design/cambios_sin_publicar.txt`: ahí el local tiene cambios de la revisión del feedback (se guardan con "Guardar cambios" en el deck de práctica) que el Artifact no tiene. En ese caso leé el Artifact y compará con el local: si el Artifact no tiene cambios propios, pasá `polish` de Impeccable sobre las slides que cambiaron en la revisión (con los límites del paso 3), publicá el local y borrá ese archivo; si los dos cambiaron, mostrale las diferencias y preguntale cuál queda. Lo mismo cuando pida "publicá los cambios".
2. Si el botón abrió una pestaña con error, fijate si `practicar.py` responde en el puerto 8766; si no, corré `python practicar.py --instalar` (con permiso: deja el arranque con Windows). Si cambiaste `practicar.py`, también `--instalar`, que reemplaza al que corre. Si el deck avisa que no hay servidor mientras graba, o "No pude guardar la práctica" al terminar, levantalo igual y decile que apriete "Reintentar guardar": la grabación sigue en el navegador mientras no cierre la pestaña. Si `faster-whisper` no está, pedí permiso para `python -m pip install faster-whisper`. Pasale los 5 pasos de "Cómo practicar" del `README.md`, tal cual, si no los conoce.
3. El feedback lo arma solo `practicar.py` al terminar de transcribir (`claude -p` sin herramientas, con el prompt `FEEDBACK` de `practicar.py`, que sigue los mismos criterios que este paso) y lo muestra en el deck: datos (tiempo, ritmo, muletillas, pausas), "Feedback general", una tarjeta por slide y "¿Guardo esto en tu memoria?": lo aprendido y la fila de la práctica se escriben en `memoria.md` ("Cómo presento" y "Prácticas") solo si la persona dice que sí (`POST /memoria`; el `.json` queda con `memoria` en `guardada`, `descartada` o `pendiente`). Desde ahí puede revisar slide por slide y cambiar cada una a mano o pidiéndoselo a Claude (`/editar`, `claude -p` sin herramientas que devuelve la `<section>`). Queda en los campos `feedback`, `memoria_propuesta` y `memoria` del `.json`. La persona no tiene que avisarte nada. Si en el chat pide más detalle, o `feedback` vino vacío, leé el `.json` más nuevo de `practicas/` y armalo vos. Si `estado` sigue en `transcribiendo` o `analizando`, esperá. Por slide tenés `segundos`, `dijo`, `palabras_por_minuto`, `pausas_largas`, `pausa_mas_larga` y `muletillas`. La transcripción puede tener errores de Whisper: no los marques. Dale feedback en 12 líneas como máximo, lo más importante primero, nombrando las slides por número y título:
   - Timing: total contra `minutos`, y las slides que se comieron más tiempo del que valen o que pasó demasiado rápido.
   - Ritmo: palabras por minuto (cómodo: 130 a 160), dónde se aceleró o se trabó (pausas largas).
   - Muletillas: solo si se repiten. "Este" y "bueno" también son palabras normales: mirá el contexto en `dijo`.
   - Hilo.
   - Orden.
   - Qué sobra.
   - Qué no se entiende, o qué dijo que la slide no muestra (y al revés).
   - Estilo: una recomendación según "Para mejorar" de `memoria.md`, y si mejoró respecto de semanas anteriores.
4. Proponé cambios concretos al deck. Aplicá los que apruebe (como en el paso 4).
5. Las prácticas que la persona aceptó guardar ya están en `memoria.md`: no las repitas, y no guardes las que descartó. Vos, cuando hables con la persona, ordená lo que se fue acumulando: sacá repetidos, pasá a "Para mejorar" lo que se repite semana a semana, y si algo de "Para mejorar" ya lo resolvió, sacalo y anotalo como logro en "Cómo presento".
6. Repetí las veces que quiera.

## 6. Presentar

El `audit` de Impeccable corre solo en la primera práctica de cada deck: `practicar.py` pasa el detector de Impeccable (`impeccable detect --json`) y le da a `claude -p` su guía de audit, las reglas, la memoria de estilo y el deck. Los hallazgos aparecen en la devolución ("Revisión de diseño (Impeccable)") y en la revisión de cada slide, con el arreglo listo para aplicar. Queda en `auditoria` del `.json` de esa práctica.

Cuando diga que el deck está listo (o al cerrar la rutina del miércoles): si ninguna práctica de este deck tiene `auditoria` (no practicó, o falló), invocá vos `impeccable:impeccable` con `audit`, sin preguntar. Si la tiene, revisá que lo que aprobó esté aplicado y que nada cambiado después en el Artifact lo haya roto. Contale en pocas líneas lo que encontró y aplicá lo que apruebe, con los límites del paso 3. Republicá. El `polish` del paso 4 en cada cambio de diseño va siempre, aunque después corra el audit.

El jueves abre el link del Artifact y aprieta "Pantalla completa". Se avanza con click o con las flechas. Si se lo tiene que mandar a alguien, se comparte desde el menú Share del Artifact.

## Crear la rutina

Cuando la persona lo pida, o al configurar por primera vez, creá con `create_scheduled_task` una tarea:
- `taskId`: `avances-semanales`.
- `cronExpression`: `0 18 * * 3`, salvo que pida otro horario.
- `prompt`, con la ruta absoluta de este repo en lugar de `<repo>`:

> Rutina de avances semanales: mañana jueves a las 10:00 se presenta. 1) Leé `<repo>/ultima_corrida.txt`. Si la fecha que tiene es la de hoy, el deck ya se armó a mano: no lo vuelvas a armar. Buscá en `<repo>/design/artifacts.txt` la línea con la fecha del próximo jueves (o la última) y respondé "Las slides del jueves están acá: <link>. Sigamos trabajándolas: decime qué cambiar, o abrilas y tocá Editar. Cuando quieras, practicamos." Después seguí desde el paso 4 (Iterar juntos) de la skill. Si no está el link, decilo y preguntá si arrancar de cero. Si el archivo no existe o tiene otra fecha, seguí. 2) Trabajá en `<repo>`. Invocá la skill `avances-semanales`; si no está disponible, leé `<repo>/.claude/skills/avances-semanales/SKILL.md` y seguila completa. Los pasos 1 y 2 corrélos sin esperar; después preguntá qué incluir y seguí con la persona.

Avisale que la rutina solo corre con la app de Claude abierta. Si está cerrada a esa hora, corre la próxima vez que la abra.
