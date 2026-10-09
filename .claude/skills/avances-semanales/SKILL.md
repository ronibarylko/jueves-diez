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
5. Para practicar: `python -m pip install faster-whisper` (y, con placa NVIDIA, `nvidia-cublas-cu12 "nvidia-cudnn-cu12==9.*"`), y después `python practicar.py --instalar`, que lo deja corriendo en segundo plano y arrancando con Windows (sin eso, el botón Practicar no anda). Pedí permiso antes de cada uno. El feedback automático usa el comando `claude`: si `claude --version` no anda, avisale.
6. Si no existe `memoria.md`, crealo con el título "Memoria de avances semanales" y las secciones "Cómo trabajar", "Mi estilo", "Cómo presento", "Para mejorar" y "Prácticas". Si ya hay decks en `design/`, llená "Mi estilo" y "Para mejorar" leyéndolos (con la skill `orquestar`).
7. Ofrecé crear la rutina (ver "Crear la rutina", más abajo).

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
3. Pasada de Impeccable, siempre, antes de publicar, invocando `impeccable:impeccable` sobre el archivo:
   1. `critique`: qué se ve mal o confuso.
   2. `distill` en las slides con mucho texto: un mensaje por slide (está en "Para mejorar").
   3. `typeset`: jerarquía y legibilidad de los textos.
   4. `polish`: el pulido final.

   **Límites de Impeccable**, en este paso y en todos los que lo usan: no salir del design system de Flock (clases y tokens de `design/_ds/`) ni de `design/CLAUDE.md` (nada de cursiva, un solo estilo por título), y no tocar el formato de arriba (`data-p`, los `<link>`, los `<script>`, `deck-stage`). Contale en una línea qué cambió por Impeccable.
4. Publicalo con la herramienta Artifact:
   - `file_path`: el archivo.
   - `icon: "slides"`, una `description` de una oración y `capabilities: {"artifact": {}}`.
   - `root`: la carpeta `design`.
   - `files`:
     - `deck-stage.js`, `editor.js` y `slide.css`, con su mismo nombre.
     - `ds/tokens/<archivo>` desde `<design_system>/tokens/<archivo>`, para los seis tokens de arriba.
     - Las imágenes que use el deck, con su path de `assets/`. Como mínimo, `assets/brand/Vector-black.svg` y las dos de `assets/verticals/<vertical>/`.

     El servicio no acepta paths que empiecen con `_`: por eso el design system se publica como `ds/`.
5. Agregá una línea `<fecha> <link>` a `design/artifacts.txt`.
6. Pasale el link y contale en 3 líneas el hilo que elegiste y qué dejaste afuera.

## 4. Iterar juntos

- **A mano:** en el Artifact, botón "Editar" de la barra de abajo a la derecha. Hace click en un texto, lo cambia y aprieta "Guardar", que publica una versión nueva. ◀ ▶ mueven entre slides.
- **Por chat:** la persona pide cambios y vos los hacés.
  1. Antes de cada edición, leé el Artifact (`action: "read"` con su link): los cambios a mano solo están ahí.
  2. Copiá al archivo local lo que está entre `<body>` y `</body>`.
  3. Editá el archivo. Si el cambio toca el diseño (no solo el texto: slides nuevas, layout, gráficos), pasá `polish` de Impeccable sobre esas slides, y `distill` si alguna quedó cargada de texto. Con los límites del paso 3.
  4. Republicalo con el mismo `url` (en esta misma sesión alcanza con el mismo `file_path`).
- Cada cambio que pide, o que hizo a mano (lo ves al comparar el Artifact con tu archivo local), dice algo de su estilo. Si sirve para otras semanas, sumalo en una línea a "Mi estilo" de `memoria.md`, o actualizá la línea que ya hay.

## 5. Practicar

La única forma de practicar es con Whisper: el deck en el navegador de la persona, servido por `practicar.py`, graba el audio y Whisper (`faster-whisper`, modelo `medium`) lo transcribe en esta compu. Claude no recibe audio, solo el texto y las medidas. El botón Practicar del Artifact no graba (el Artifact no puede usar el micrófono) ni arranca programas: abre en otra pestaña `http://localhost:8766/?fecha=<fecha>`, que responde porque `practicar.py` corre en segundo plano desde que se instaló (`--instalar`: arranca con Windows, Whisper se carga solo al transcribir). Probado y descartado para que el botón lo arranque: `jueves-diez://` directo desde el Artifact (no llega a Windows), `file://` (no se abre) y una página puente publicada en el Artifact (claude.ai la bloquea desde la web). No ofrezcas otras formas (dictado de Windows, micrófono del chat).

1. Traé al archivo local los cambios hechos a mano en el Artifact (como en el paso 4: leerlo y copiar el `<body>`): `practicar.py` sirve el archivo local, no el Artifact. **Salvo** que exista `design/cambios_sin_publicar.txt`: ahí el local tiene cambios de la revisión del feedback (se guardan con "Guardar cambios" en el deck de práctica) que el Artifact no tiene. En ese caso leé el Artifact y compará con el local: si el Artifact no tiene cambios propios, pasá `polish` de Impeccable sobre las slides que cambiaron en la revisión (con los límites del paso 3), publicá el local y borrá ese archivo; si los dos cambiaron, mostrale las diferencias y preguntale cuál queda. Lo mismo cuando pida "publicá los cambios".
2. Si el botón abrió una pestaña con error, fijate si `practicar.py` responde en el puerto 8766; si no, corré `python practicar.py --instalar` (con permiso: deja el arranque con Windows). Si cambiaste `practicar.py`, también `--instalar`, que reemplaza al que corre. Si `faster-whisper` no está, pedí permiso para `python -m pip install faster-whisper`. Pasale los 5 pasos de "Cómo practicar" del `README.md`, tal cual, si no los conoce.
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

Cuando diga que el deck está listo (o al cerrar la rutina del miércoles), última pasada: invocá `impeccable:impeccable` con `audit` sobre el archivo, contale en pocas líneas lo que encontró y aplicá lo que apruebe, con los límites del paso 3. Republicá.

El jueves abre el link del Artifact y aprieta "Pantalla completa". Se avanza con click o con las flechas. Si se lo tiene que mandar a alguien, se comparte desde el menú Share del Artifact.

## Crear la rutina

Cuando la persona lo pida, o al configurar por primera vez, creá con `create_scheduled_task` una tarea:
- `taskId`: `avances-semanales`.
- `cronExpression`: `0 18 * * 3`, salvo que pida otro horario.
- `prompt`, con la ruta absoluta de este repo en lugar de `<repo>`:

> Rutina de avances semanales: mañana jueves a las 10:00 se presenta. 1) Leé `<repo>/ultima_corrida.txt`. Si la fecha que tiene es la de hoy, el deck ya se armó a mano: no lo vuelvas a armar. Buscá en `<repo>/design/artifacts.txt` la línea con la fecha del próximo jueves (o la última) y respondé "Las slides del jueves están acá: <link>. Sigamos trabajándolas: decime qué cambiar, o abrilas y tocá Editar. Cuando quieras, practicamos." Después seguí desde el paso 4 (Iterar juntos) de la skill. Si no está el link, decilo y preguntá si arrancar de cero. Si el archivo no existe o tiene otra fecha, seguí. 2) Trabajá en `<repo>`. Invocá la skill `avances-semanales`; si no está disponible, leé `<repo>/.claude/skills/avances-semanales/SKILL.md` y seguila completa. Los pasos 1 y 2 corrélos sin esperar; después preguntá qué incluir y seguí con la persona.

Avisale que la rutina solo corre con la app de Claude abierta. Si está cerrada a esa hora, corre la próxima vez que la abra.
