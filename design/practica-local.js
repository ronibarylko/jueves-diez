// Solo en el deck que sirve practicar.py (la única forma de practicar). "Practicar" graba el audio y anota cuándo pasa
// cada slide; "Terminar" se lo manda a practicar.py, que lo transcribe con Whisper y le pide el feedback a Claude. Acá
// se muestra: la espera por pasos, el feedback (general y por slide, con la miniatura de cada slide), la pregunta de si
// guardar lo aprendido en memoria.md, y una revisión slide por slide para aplicar cambios (a mano o pidiéndoselos a
// Claude) que se guardan en el deck local. Revisado con Impeccable (critique + polish).
(() => {
  const $ = id => document.getElementById(id);
  const stage = () => document.querySelector('deck-stage');
  const estado = t => { $('b-estado').textContent = t; };
  const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const el = (tag, cls, texto) => { const e = document.createElement(tag); if (cls) e.className = cls; if (texto != null) e.textContent = texto; return e; };
  const boton = (texto, cls, alClick) => { const b = el('button', cls, texto); b.type = 'button'; b.onclick = alClick; return b; };
  const ESTADOS = { bien: 'Bien', ajustar: 'Ajustar', cortar: 'Cortar', sin_hablar: 'Sin presentar' };
  const fecha = () => document.querySelector('[data-auto-date]')?.dataset.autoDate || '';

  // ---------- Estilos: alto contraste, nada legible por debajo de 18px, el color de la vertical del design system ----------
  const css = el('style');
  css.textContent = `
    #pp { --acento: var(--vertical-main, #05ecf1); --fondo: #0b0b0c; --caja: #17171a; --borde: #33333a; --suave: #b9b9c2;
      --bien: #3ddc84; --ajustar: #ffc53d; --cortar: #ff6b6b;
      position: fixed; inset: 0; z-index: 30; overflow: auto; background: var(--fondo);
      color: #fff; font: 400 20px/1.5 Poppins, system-ui, sans-serif }
    #pp[hidden], #pp-grabando[hidden] { display: none }
    #pp * { box-sizing: border-box }
    #pp ::selection { background: var(--acento); color: #000 }
    #pp button { font: 500 18px/1 Poppins, system-ui, sans-serif; border-radius: 999px; padding: 14px 22px; cursor: pointer;
      color: #fff; background: transparent; border: 1px solid var(--borde); transition: border-color .15s, background-color .15s }
    #pp button:hover { border-color: #fff }
    #pp button.pp-principal { color: #000; background: #fff; border-color: #fff }
    #pp button.pp-acento { border-color: var(--acento); color: var(--acento) }
    #pp button.pp-acento:hover { background: color-mix(in srgb, var(--acento) 14%, transparent) }
    #pp button:disabled { opacity: .45; cursor: default }
    #pp button:focus-visible, #pp textarea:focus-visible { outline: 3px solid var(--acento); outline-offset: 3px }
    @media (prefers-reduced-motion: reduce) { #pp button { transition: none } }
    .pp-cont { width: min(1100px, 100%); margin: 0 auto; padding: 48px 24px 0; display: grid; gap: 44px }
    .pp-eyebrow { margin: 0; font-size: 18px; letter-spacing: .1em; text-transform: uppercase; color: var(--suave) }
    .pp-h { margin: 0; font-size: clamp(36px, 5vw, 56px); line-height: 1.08; font-weight: 500; letter-spacing: -.025em; text-wrap: balance }
    .pp-bajada { margin: 0; font-size: 22px; color: var(--suave); max-width: 62ch; text-wrap: pretty }
    .pp-h2 { margin: 0 0 18px; font-size: 26px; font-weight: 500 }
    .pp-fila { display: flex; flex-wrap: wrap; gap: 12px; align-items: center }
    .pp-pie { position: sticky; bottom: 0; margin-top: 8px; padding: 16px 0 24px; display: flex; flex-wrap: wrap; gap: 12px;
      background: var(--fondo); border-top: 1px solid var(--borde) }

    /* Espera */
    .pp-espera { min-height: 100vh; display: grid; place-content: center; padding: 24px }
    .pp-espera-caja { width: min(640px, 100%); display: grid; gap: 36px }
    .pp-total { margin: 0; font-size: clamp(72px, 12vw, 128px); line-height: 1; font-weight: 500; letter-spacing: -.04em; font-variant-numeric: tabular-nums }
    .pp-total span { font-size: .28em; color: var(--suave); letter-spacing: 0; margin-left: 14px }
    .pp-pasos { list-style: none; margin: 0; padding: 0; display: grid; gap: 18px }
    .pp-pasos li { display: grid; grid-template-columns: 36px 1fr; gap: 16px; align-items: center; font-size: 24px; color: var(--suave) }
    .pp-pasos li::before { content: ""; width: 28px; height: 28px; border-radius: 50%; border: 2px solid var(--borde) }
    .pp-pasos li[data-e="activo"] { color: #fff }
    .pp-pasos li[data-e="activo"]::before { border-color: var(--acento); border-top-color: transparent; animation: pp-gira .9s linear infinite }
    .pp-pasos li[data-e="hecho"] { color: #fff }
    .pp-pasos li[data-e="hecho"]::before { content: "✓"; display: grid; place-items: center; font-size: 16px; color: #000; background: var(--bien); border-color: var(--bien) }
    .pp-pasos li[data-e="error"]::before { content: "!"; display: grid; place-items: center; color: #000; background: var(--cortar); border-color: var(--cortar) }
    .pp-nota { margin: 0; font-size: 18px; color: var(--suave) }
    @keyframes pp-gira { to { transform: rotate(360deg) } }
    @media (prefers-reduced-motion: reduce) { .pp-pasos li[data-e="activo"]::before { animation: none; border-top-color: var(--acento) } }

    /* Resultado */
    .pp-cab { display: grid; gap: 16px }
    .pp-corto { min-height: 100vh; align-content: center }
    .pp-datos { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px }
    .pp-dato { background: var(--caja); border: 1px solid var(--borde); border-radius: 16px; padding: 18px 20px; display: grid; gap: 6px; align-content: start }
    .pp-dato b { font-size: 40px; font-weight: 500; line-height: 1.1; letter-spacing: -.02em; font-variant-numeric: tabular-nums }
    .pp-dato small { font-size: 18px; color: var(--suave); line-height: 1.35 }
    .pp-dato[data-t="bien"] b { color: var(--bien) } .pp-dato[data-t="ajustar"] b { color: var(--ajustar) } .pp-dato[data-t="cortar"] b { color: var(--cortar) }
    .pp-chips { display: flex; flex-wrap: wrap; gap: 6px }
    .pp-chip { font-size: 18px; padding: 3px 10px; border-radius: 999px; background: #26262b }
    .pp-general { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px }
    .pp-lista { background: var(--caja); border: 1px solid var(--borde); border-radius: 16px; padding: 22px 24px }
    .pp-lista h3 { margin: 0 0 12px; font-size: 18px; font-weight: 500; letter-spacing: .08em; text-transform: uppercase }
    .pp-lista ul { margin: 0; padding-left: 22px; display: grid; gap: 8px }
    .pp-lista.bien h3 { color: var(--bien) } .pp-lista.mejorar h3 { color: var(--ajustar) }
    .pp-slides { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px; align-items: start }
    .pp-card { background: var(--caja); border: 1px solid var(--borde); border-radius: 16px; padding: 16px 18px 20px; display: grid; gap: 12px; align-content: start }
    .pp-card[data-e="sin_hablar"] { opacity: .72 }
    .pp-card h3 { margin: 0; font-size: 21px; font-weight: 500; line-height: 1.3 }
    .pp-card p { margin: 0 }
    .pp-num { color: var(--suave); margin-right: 8px; font-variant-numeric: tabular-nums }
    .pp-badge { font-size: 16px; font-weight: 600; letter-spacing: .04em; padding: 4px 12px; border-radius: 999px; color: #000; white-space: nowrap }
    .pp-badge[data-e="bien"] { background: var(--bien) } .pp-badge[data-e="ajustar"] { background: var(--ajustar) }
    .pp-badge[data-e="cortar"] { background: var(--cortar) } .pp-badge[data-e="sin_hablar"] { background: #3a3a42; color: #fff }
    .pp-mini { position: relative; aspect-ratio: 16 / 9; overflow: hidden; border-radius: 10px; background: var(--background-default, #000);
      border: 1px solid var(--borde); cursor: pointer }
    .pp-mini > section { position: absolute !important; inset: auto !important; left: 0 !important; top: 0 !important; margin: 0 !important;
      width: 1920px !important; height: 1080px !important; transform-origin: 0 0; transform: scale(var(--m, .17)) !important; visibility: visible !important; pointer-events: none }
    .pp-barra { height: 8px; border-radius: 999px; background: #26262b; overflow: hidden }
    .pp-barra i { display: block; height: 100%; background: var(--acento); border-radius: 999px }
    .pp-meta { font-size: 18px; color: var(--suave) }
    .pp-sug { padding: 12px 14px; border-radius: 12px; background: #202026 }
    .pp-sug::before { content: "Probá: "; color: #fff; font-weight: 500 }
    .pp-card button { justify-self: start; padding: 10px 18px }
    .pp-memoria { background: var(--caja); border: 1px solid var(--borde); border-radius: 16px; padding: 22px 24px; display: grid; gap: 10px }
    .pp-memoria ul { margin: 0; padding-left: 22px; display: grid; gap: 6px }
    .pp-aviso { margin: 0; padding: 16px 20px; border-radius: 12px; background: #2a2412; color: #ffe39a }

    /* Revisión: el panel pasa a un costado y la slide queda a la vista */
    #pp.pp-rev { inset: 0 0 0 auto; width: min(460px, 100%); border-left: 1px solid var(--borde); background: var(--fondo) }
    .pp-rev .pp-cont { padding: 24px 24px 0; gap: 20px }
    .pp-rev-cab { display: flex; justify-content: space-between; align-items: center; gap: 12px }
    #pp .pp-x { padding: 10px 14px; line-height: 1 }
    .pp-rev textarea { width: 100%; min-height: 110px; resize: vertical; padding: 12px 14px; border-radius: 12px; border: 1px solid var(--borde);
      background: #141417; color: #fff; font: 400 18px/1.45 Poppins, system-ui, sans-serif }
    .pp-rev textarea::placeholder { color: #a3a3ad }
    .pp-bloque { display: grid; gap: 12px; padding-top: 16px; border-top: 1px solid var(--borde) }
    .pp-estado { margin: 0; font-size: 18px; color: var(--suave); min-height: 1.5em }

    /* Grabando: que se vea de lejos */
    #pp-grabando { position: fixed; z-index: 25; top: 16px; left: 50%; transform: translateX(-50%); display: flex; gap: 10px; align-items: center;
      padding: 10px 20px; border-radius: 999px; background: rgba(11, 11, 12, .9); border: 1px solid #ff6b6b; color: #fff;
      font: 500 22px/1 Poppins, system-ui, sans-serif; font-variant-numeric: tabular-nums }
    #pp-grabando::before { content: ""; width: 12px; height: 12px; border-radius: 50%; background: #ff6b6b }
  `;
  document.head.append(css);

  const pp = el('div');
  pp.id = 'pp';
  pp.hidden = true;
  pp.setAttribute('role', 'dialog');
  pp.setAttribute('aria-modal', 'true');
  pp.setAttribute('aria-label', 'Práctica');
  // El panel vive fuera de <deck-stage>: hereda la vertical del deck para que --vertical-main sea la suya y no la de Producto.
  customElements.whenDefined('deck-stage').then(() => { pp.dataset.vertical = stage().dataset.vertical || ''; });
  document.body.append(pp);
  pp.addEventListener('click', e => e.stopPropagation());

  const grabando = el('div');
  grabando.id = 'pp-grabando';
  grabando.hidden = true;
  document.body.append(grabando);

  // El botón de la barra de editor.js pasa a grabar; "Feedback" reabre el último.
  const viejo = $('b-practicar'), practicar = viejo.cloneNode(true);  // el clon no trae el onclick de editor.js
  viejo.replaceWith(practicar);
  const verFeedback = el('button', null, 'Feedback');
  verFeedback.hidden = true;
  practicar.after(verFeedback);
  verFeedback.onclick = () => { if (ultimo) mostrarResultado(ultimo); };

  // practicar.py se apaga a los 10 min sin pedidos si se lo arrancó a mano: el deck abierto le avisa que sigue.
  setInterval(() => fetch('/latido').catch(() => {}), 60000);

  // ---------- Teclado: Esc cierra; con el panel abierto, las flechas no pasan slides por detrás ----------
  addEventListener('keydown', e => {
    if (pp.hidden) return;
    if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); return cerrar(); }
    if (!revisando && ['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', ' ', 'Home', 'End'].includes(e.key)
        && !e.target.matches?.('input, textarea')) { e.stopImmediatePropagation(); return; }
    if (e.key === 'Tab' && !revisando) {  // el foco no se escapa al deck tapado
      const f = [...pp.querySelectorAll('button:not(:disabled), textarea')];
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f.at(-1).focus(); }
      else if (!e.shiftKey && document.activeElement === f.at(-1)) { e.preventDefault(); f[0].focus(); }
    }
  }, true);

  // ---------- Grabar ----------
  let grabadora = null, partes = [], cambios = [], inicio = 0, reloj = null, ultimo = null, revisando = false, oculto = false;
  const ahora = () => (performance.now() - inicio) / 1000;
  customElements.whenDefined('deck-stage').then(() => {
    const s = stage(), ir = s.ir.bind(s);
    s.ir = n => {
      const antes = s.i; ir(n);
      if (grabadora && s.i !== antes) cambios.push({ slide: s.i, t: ahora() });
      if (revisando) pintarRevision();
    };
    s.addEventListener('input', () => { sucio = true; });
  });

  async function empezar() {
    let mic;
    try { mic = await navigator.mediaDevices.getUserMedia({ audio: true }); }
    catch { return estado('Sin micrófono: permitilo en el navegador y probá de nuevo'); }
    partes = [];
    grabadora = new MediaRecorder(mic, { mimeType: 'audio/webm;codecs=opus' });
    grabadora.ondataavailable = e => partes.push(e.data);
    grabadora.start(1000);
    inicio = performance.now();
    cambios = [{ slide: stage().i, t: 0 }];
    grabando.hidden = false;
    grabando.textContent = 'Grabando · 0:00';
    estado('Grabando: apretá Terminar al final');
    reloj = setInterval(() => { grabando.textContent = `Grabando · ${mmss(ahora())}`; }, 500);
    practicar.textContent = 'Terminar';
    practicar.classList.add('activo');
  }
  practicar.onclick = async () => {
    if (!grabadora) return empezar();
    const total = ahora();
    clearInterval(reloj);
    const listo = new Promise(r => { grabadora.onstop = r; });
    grabadora.stop();
    grabadora.stream.getTracks().forEach(t => t.stop());
    await listo;
    grabadora = null;
    grabando.hidden = true;
    practicar.textContent = 'Practicar';
    practicar.classList.remove('activo');
    estado('');
    procesar(total);
  };
  const practicarDeNuevo = () => { cerrar(); stage().ir(0); empezar(); };

  function abrir(clase) {
    pp.className = clase || '';
    pp.hidden = false;
    oculto = false;
    pp.replaceChildren();
    pp.scrollTop = 0;
  }
  function cerrar() {
    if (revisando && sucio && !confirmarSalida) {
      confirmarSalida = true;
      return estadoRev('Tenés cambios sin guardar. Volvé a cerrar para salir sin guardarlos.');
    }
    salirDeRevision();
    pp.hidden = true;
    oculto = true;
    practicar.focus();
  }

  // ---------- Espera por pasos ----------
  function pintarEspera(total, minutos) {
    abrir();
    const fuera = el('div', 'pp-espera');
    const caja = el('div', 'pp-espera-caja');
    caja.append(el('p', 'pp-eyebrow', 'Práctica terminada'));
    const t = el('p', 'pp-total', mmss(total));
    if (minutos) t.append(el('span', null, `de ${minutos}:00`));
    caja.append(t);
    const pasos = el('ol', 'pp-pasos');
    pasos.setAttribute('aria-live', 'polite');
    for (const [id, texto] of [['guardar', 'Guardando la grabación'], ['transcribir', 'Whisper transcribe tu voz'], ['analizar', 'Claude arma el feedback']]) {
      const li = el('li', null, texto);
      li.dataset.paso = id;
      pasos.append(li);
    }
    caja.append(pasos, el('p', 'pp-nota', 'Suele tardar uno o dos minutos. Podés seguir mirando el deck: cuando esté, el botón Feedback de la barra lo abre.'));
    const seguir = boton('Seguir mirando el deck', null, () => cerrar());
    seguir.style.justifySelf = 'start';
    caja.append(seguir);
    fuera.append(caja);
    pp.append(fuera);
  }
  const paso = (id, e, texto) => {
    const li = pp.querySelector(`[data-paso="${id}"]`);
    if (!li) return;
    li.dataset.e = e;
    if (texto) li.textContent = texto;
  };

  async function procesar(total) {
    const minutos = +stage().dataset.minutos || null;
    pintarEspera(total, minutos);
    paso('guardar', 'activo');
    const audio = await new Promise(r => {
      const lector = new FileReader();
      lector.onload = () => r(lector.result.split(',')[1]);
      lector.readAsDataURL(new Blob(partes, { type: 'audio/webm' }));
    });
    const slides = stage().slides.map(s => ({
      titulo: (s.querySelector('h1, h2')?.textContent || s.dataset.label || '').trim(),
      contenido: s.innerText.replace(/\s+/g, ' ').trim().slice(0, 400),
    }));
    let id;
    try {
      const r = await fetch('/practica', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deck: document.title, fecha: new Date().toISOString(), minutos, total, cambios, slides, audio }) });
      ({ id } = await r.json());
    } catch {
      return paso('guardar', 'error', 'No pude guardar la práctica: ¿sigue corriendo practicar.py?');
    }
    paso('guardar', 'hecho', 'Grabación guardada');
    paso('transcribir', 'activo');
    const espera = setInterval(async () => {
      let d;
      try { d = await (await fetch('/estado/' + id)).json(); } catch { return; }
      if (d.estado === 'transcribiendo') return;
      if (d.estado === 'analizando') { paso('transcribir', 'hecho', 'Voz transcripta'); return paso('analizar', 'activo'); }
      clearInterval(espera);
      if (d.estado !== 'listo') {
        paso('transcribir', 'error', 'No se pudo transcribir el audio.');
        const otra = boton('Practicar de nuevo', 'pp-principal', practicarDeNuevo);
        otra.style.justifySelf = 'start';
        return pp.querySelector('.pp-espera-caja')?.append(otra);
      }
      paso('transcribir', 'hecho', 'Voz transcripta');
      paso('analizar', 'hecho', 'Feedback listo');
      ultimo = d;
      verFeedback.hidden = false;
      if (oculto) estado('Tu feedback está listo: tocá Feedback');
      else setTimeout(() => mostrarResultado(d), 500);
    }, 2000);
  }

  // ---------- Resultado ----------
  const fbDe = (d, n) => d.feedback?.slides?.find(s => +s.slide === n) || {};
  const palabras = d => d.slides.reduce((a, s) => a + (s.palabras || 0), 0);
  const muletillasTotales = d => {
    const suma = {};
    for (const s of d.slides) for (const [m, n] of Object.entries(s.muletillas || {})) suma[m] = (suma[m] || 0) + n;
    return Object.entries(suma).sort((a, b) => b[1] - a[1]);
  };
  const badge = e => { const b = el('span', 'pp-badge', ESTADOS[e] || e); b.dataset.e = e; return b; };

  function dato(titulo, valor, detalle, tono) {
    const c = el('div', 'pp-dato');
    if (tono) c.dataset.t = tono;
    c.append(el('small', null, titulo), el('b', null, valor));
    if (detalle instanceof Node) c.append(detalle); else if (detalle) c.append(el('small', null, detalle));
    return c;
  }

  function miniatura(i, alClick) {  // la slide de verdad, achicada, para reconocerla de un vistazo
    const caja = el('div', 'pp-mini');
    caja.setAttribute('role', 'img');
    caja.setAttribute('aria-label', `Slide ${i + 1}`);
    const copia = stage().slides[i].cloneNode(true);
    for (const x of [copia, ...copia.querySelectorAll('[data-activa], [contenteditable], [id]')]) {
      x.removeAttribute('data-activa'); x.removeAttribute('contenteditable'); x.removeAttribute('id');
    }
    caja.append(copia);
    new ResizeObserver(([e]) => caja.style.setProperty('--m', e.contentRect.width / (+stage().getAttribute('width') || 1920))).observe(caja);
    caja.onclick = alClick;
    return caja;
  }

  function mostrarResultado(d, verDetalle) {
    salirDeRevision();
    abrir();
    const c = el('div', 'pp-cont');
    pp.append(c);
    const habladas = d.slides.filter(s => s.palabras > 0).length;

    // Si casi no te escuchó, no tiene sentido un informe: decirlo y ofrecer otra vuelta.
    if (!verDetalle && (palabras(d) < 15 || habladas < Math.max(1, Math.ceil(d.slides.length / 4)))) {
      c.classList.add('pp-corto');
      const cab = el('header', 'pp-cab');
      cab.append(el('p', 'pp-eyebrow', `Práctica de ${mmss(d.total)}`),
        el('h2', 'pp-h', palabras(d) < 15 ? 'No te escuché' : `Presentaste ${habladas} de ${d.slides.length} slides`),
        el('p', 'pp-bajada', palabras(d) < 15
          ? 'Whisper no encontró casi nada de voz. Fijate que el navegador esté usando el micrófono correcto y hablá como en la presentación.'
          : 'Con tan pocas slides el feedback sirve poco. Para que valga, hacé una pasada completa.'));
      c.append(cab);
      const pie = el('div', 'pp-pie');
      const otra = boton('Practicar de nuevo', 'pp-principal', practicarDeNuevo);
      pie.append(otra);
      if (palabras(d) >= 15) pie.append(boton('Ver el detalle igual', null, () => mostrarResultado(d, true)));
      pie.append(boton('Cerrar', null, cerrar));
      c.append(pie);
      return otra.focus({ preventScroll: true });
    }

    const general = d.feedback?.general || {};
    const cab = el('header', 'pp-cab');
    cab.append(el('p', 'pp-eyebrow', 'Feedback de la práctica'), el('h2', 'pp-h', general.titular || 'Así te fue'));
    if (general.resumen) cab.append(el('p', 'pp-bajada', general.resumen));
    c.append(cab);

    // Los números de la práctica
    const objetivo = (d.minutos || 0) * 60;
    const desvio = objetivo ? d.total / objetivo : 1;
    const ppm = d.palabras_por_minuto;
    const mul = muletillasTotales(d);
    const chips = el('div', 'pp-chips');
    mul.slice(0, 4).forEach(([m, n]) => chips.append(el('span', 'pp-chip', `${m} ×${n}`)));
    const datos = el('div', 'pp-datos');
    datos.append(
      dato('Tiempo', mmss(d.total), objetivo ? `de ${d.minutos}:00` : '', !objetivo ? null : desvio > 1.1 ? 'cortar' : desvio < 0.75 ? 'ajustar' : 'bien'),
      dato('Ritmo', ppm ? `${ppm}` : '—', 'palabras por minuto; cómodo, de 130 a 160', !ppm ? null : ppm > 170 || ppm < 115 ? 'ajustar' : 'bien'),
      dato('Muletillas', String(mul.reduce((a, [, n]) => a + n, 0)), mul.length ? chips : 'ninguna'),
      dato('Pausas largas', String(d.slides.reduce((a, s) => a + (s.pausas_largas || 0), 0)), 'de más de 2 segundos'),
    );
    c.append(datos);

    if (!d.feedback) c.append(el('p', 'pp-aviso', 'Claude no pudo armar el feedback desde acá. Los números de arriba sí están: pedíselo en el chat.'));

    if (general.bien?.length || general.mejorar?.length) {
      const sec = el('section');
      sec.append(el('h2', 'pp-h2', 'Feedback general'));
      const g = el('div', 'pp-general');
      for (const [clave, titulo] of [['bien', 'Lo que funcionó'], ['mejorar', 'Para mejorar']]) {
        const items = general[clave] || [];
        if (!items.length) continue;
        const caja = el('div', 'pp-lista ' + clave);
        const ul = el('ul');
        items.forEach(t => ul.append(el('li', null, t)));
        caja.append(el('h3', null, titulo), ul);
        g.append(caja);
      }
      sec.append(g);
      c.append(sec);
    }

    // Slide por slide, con la miniatura de cada una
    const sec = el('section');
    sec.append(el('h2', 'pp-h2', 'Slide por slide'));
    const grilla = el('div', 'pp-slides');
    const ideal = objetivo && d.slides.length ? objetivo / d.slides.length : 60;
    for (const s of d.slides) {
      const f = fbDe(d, s.slide), i = s.slide - 1;
      const card = el('article', 'pp-card');
      if (f.estado) card.dataset.e = f.estado;
      if (stage().slides[i]) card.append(miniatura(i, () => entrarARevision(d, i)));
      const arriba = el('div', 'pp-fila');
      const h = el('h3');
      h.append(el('span', 'pp-num', String(s.slide).padStart(2, '0')), document.createTextNode(s.titulo || 'Sin título'));
      arriba.append(h);
      if (f.estado) arriba.append(badge(f.estado));
      card.append(arriba);
      if (f.estado !== 'sin_hablar') {
        const barra = el('div', 'pp-barra');
        const llena = el('i');
        llena.style.width = Math.min(100, (s.segundos / (ideal * 2)) * 100) + '%';
        barra.append(llena);
        barra.title = `${mmss(s.segundos)} de unos ${mmss(ideal)} por slide`;
        const meta = [mmss(s.segundos), s.palabras_por_minuto ? `${s.palabras_por_minuto} palabras/min` : '', s.pausas_largas ? `${s.pausas_largas} pausas largas` : '',
          ...Object.entries(s.muletillas || {}).map(([m, n]) => `${m} ×${n}`)].filter(Boolean).join(' · ');
        card.append(barra, el('p', 'pp-meta', meta));
        if (f.comentario) card.append(el('p', null, f.comentario));
        if (f.sugerencia) card.append(el('p', 'pp-sug', f.sugerencia));
        card.append(boton('Revisar esta slide', null, () => entrarARevision(d, i)));
      }
      grilla.append(card);
    }
    sec.append(grilla);
    c.append(sec);

    const mem = el('section', 'pp-memoria');
    c.append(mem);
    pintarMemoria(d, mem);

    const pie = el('div', 'pp-pie');
    const rev = boton('Revisar slide por slide', 'pp-principal', () => entrarARevision(d, 0));
    pie.append(rev, boton('Practicar de nuevo', null, practicarDeNuevo), boton('Cerrar', null, cerrar));
    c.append(pie);
    rev.focus({ preventScroll: true });
  }

  // ---------- memoria.md: se guarda solo si la persona dice que sí ----------
  function pintarMemoria(d, mem) {
    mem.replaceChildren();
    const p = d.memoria_propuesta;
    if (!p) return mem.append(el('h2', 'pp-h2', 'Tu memoria de estilo'), el('p', null, 'Esta práctica no tiene nada para guardar.'));
    const lista = () => {
      const ul = el('ul');
      [...p.aprendido, p.resumen].forEach(t => ul.append(el('li', null, t)));
      return ul;
    };
    if (d.memoria === 'guardada') {
      return mem.append(el('h2', 'pp-h2', 'Guardado en tu memoria de estilo'), lista(),
        el('p', 'pp-meta', 'Claude lo usa para conocerte mejor las próximas semanas.'));
    }
    if (d.memoria === 'descartada') return mem.append(el('h2', 'pp-h2', 'Tu memoria de estilo'), el('p', null, 'No se guardó nada de esta práctica.'));
    mem.append(el('h2', 'pp-h2', '¿Guardo esto en tu memoria de estilo?'), lista(),
      el('p', 'pp-meta', 'Claude lo usa para conocerte mejor las próximas semanas.'));
    const fila = el('div', 'pp-fila');
    const nota = el('p', 'pp-estado');
    nota.setAttribute('role', 'status');
    const decidir = async guardar => {
      fila.querySelectorAll('button').forEach(b => { b.disabled = true; });
      try {
        const r = await (await fetch('/memoria', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: d.id, guardar }) })).json();
        if (r.error) throw new Error(r.error);
        d.memoria = r.memoria;
        pintarMemoria(d, mem);
      } catch (e) {
        nota.textContent = 'No se pudo: ' + e.message;
        fila.querySelectorAll('button').forEach(b => { b.disabled = false; });
      }
    };
    fila.append(boton('Sí, guardar', 'pp-acento', () => decidir(true)), boton('No, gracias', null, () => decidir(false)));
    mem.append(fila, nota);
  }

  // ---------- Revisión slide por slide ----------
  let deshacer = new Map(), sucio = false, editando = false, rev = null, confirmarSalida = false;
  const ANCHO = () => Math.min(460, innerWidth);
  function encajar() {  // achica el deck para que la slide entre al lado del panel
    if (!revisando) return;
    const s = stage(), w = +s.getAttribute('width') || 1920, h = +s.getAttribute('height') || 1080, libre = innerWidth - ANCHO();
    s.style.right = ANCHO() + 'px';
    document.documentElement.style.setProperty('--k', Math.max(0.1, Math.min(libre / w, innerHeight / h)));
  }
  addEventListener('resize', encajar);
  // En revisión, un click en la slide no pasa de slide (se navega con los botones o las flechas).
  addEventListener('click', e => { if (revisando && !pp.contains(e.target) && !e.target.isContentEditable) e.stopPropagation(); }, true);

  function entrarARevision(d, n) {
    rev = d;
    revisando = true;
    confirmarSalida = false;
    abrir('pp-rev');
    $('barra').style.display = 'none';  // en la revisión se navega desde el panel: una sola botonera
    encajar();
    stage().ir(n);
    pintarRevision();
  }
  function salirDeRevision() {
    if (!revisando) return;
    revisando = false;
    if (editando) { stage().editar(false); editando = false; }
    stage().style.right = '';
    $('barra').style.display = '';
    dispatchEvent(new Event('resize'));
  }

  function pintarRevision() {
    const d = rev, i = stage().i, s = d.slides[i] || { slide: i + 1, titulo: '' }, f = fbDe(d, i + 1);
    pp.replaceChildren();
    const c = el('div', 'pp-cont');
    pp.append(c);
    const cab = el('div', 'pp-rev-cab');
    const x = boton('✕', 'pp-x', cerrar);
    x.setAttribute('aria-label', 'Cerrar la revisión');
    cab.append(el('p', 'pp-eyebrow', `Slide ${i + 1} de ${stage().slides.length}`), x);
    c.append(cab);
    const arriba = el('div', 'pp-fila');
    arriba.append(el('h2', 'pp-h2', s.titulo || 'Sin título'));
    if (f.estado) arriba.append(badge(f.estado));
    c.append(arriba);
    if (f.estado !== 'sin_hablar' && s.segundos != null) {
      c.append(el('p', 'pp-meta', [mmss(s.segundos), s.palabras_por_minuto ? `${s.palabras_por_minuto} palabras/min` : '',
        ...Object.entries(s.muletillas || {}).map(([m, n]) => `${m} ×${n}`)].filter(Boolean).join(' · ')));
    }
    if (f.comentario) c.append(el('p', null, f.comentario));
    if (f.sugerencia) c.append(el('p', 'pp-sug', f.sugerencia));

    // Cambiarla: pedírselo a Claude o a mano
    const bloque = el('div', 'pp-bloque');
    const pedido = el('textarea');
    pedido.setAttribute('aria-label', 'Qué cambiarle a esta slide');
    pedido.placeholder = 'Qué cambiarle a esta slide';
    pedido.value = f.sugerencia || '';
    const aplicar = boton('Aplicar con Claude', 'pp-acento', async () => {
      if (!pedido.value.trim()) return estadoRev('Escribí qué cambiar.');
      aplicar.disabled = true;
      estadoRev('Claude está reescribiendo la slide…');
      const viejaEl = stage().slides[i];
      const limpia = viejaEl.cloneNode(true);
      limpia.removeAttribute('data-activa');
      limpia.removeAttribute('contenteditable');
      try {
        const r = await (await fetch('/editar', { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pedido: pedido.value, html: limpia.outerHTML }) })).json();
        if (r.error) throw new Error(r.error);
        const t = document.createElement('template');
        t.innerHTML = r.html;
        const nueva = t.content.firstElementChild;
        if (!deshacer.has(i)) deshacer.set(i, []);
        deshacer.get(i).push(viejaEl);
        nueva.toggleAttribute('data-activa', true);
        if (editando) nueva.contentEditable = 'true';
        viejaEl.replaceWith(nueva);
        stage().slides[i] = nueva;
        sucio = true;
        pintarRevision();
        estadoRev('Listo. Si no te gusta, Deshacer.');
      } catch (e) {
        aplicar.disabled = false;
        estadoRev('No se pudo: ' + e.message);
      }
    });
    const volver = boton('Deshacer', null, () => {
      const anterior = deshacer.get(i).pop(), actual = stage().slides[i];
      actual.replaceWith(anterior);
      stage().slides[i] = anterior;
      anterior.toggleAttribute('data-activa', true);
      pintarRevision();
    });
    volver.disabled = !deshacer.get(i)?.length;
    const mano = boton(editando ? 'Listo de editar' : 'Editar el texto a mano', null, () => {
      editando = !editando;
      stage().editar(editando);
      pintarRevision();
      if (editando) estadoRev('Hacé click en un texto de la slide y cambialo.');
    });
    const filaAplicar = el('div', 'pp-fila');
    filaAplicar.append(aplicar, volver, mano);
    bloque.append(pedido, filaAplicar);
    c.append(bloque);

    const est = el('p', 'pp-estado');
    est.id = 'pp-est';
    est.setAttribute('role', 'status');
    c.append(est);

    const nav = el('div', 'pp-fila');
    const ant = boton('◀ Anterior', null, () => stage().ir(i - 1));
    ant.disabled = i === 0;
    const sig = boton('Siguiente ▶', null, () => stage().ir(i + 1));
    sig.disabled = i === stage().slides.length - 1;
    nav.append(ant, sig);
    c.append(nav);

    const pie = el('div', 'pp-pie');
    const guardar = boton('Guardar cambios', 'pp-principal', guardarCambios);
    guardar.disabled = !sucio && !editando;
    pie.append(guardar, boton('Volver al feedback', null, () => mostrarResultado(rev, true)));
    c.append(pie);
  }
  const estadoRev = t => { const e = $('pp-est'); if (e) e.textContent = t; };

  async function guardarCambios() {
    if (editando) { stage().editar(false); editando = false; }
    const copia = stage().cloneNode(true);
    for (const x of [copia, ...copia.querySelectorAll('[data-activa], [contenteditable]')]) { x.removeAttribute('data-activa'); x.removeAttribute('contenteditable'); }
    copia.removeAttribute('style');
    try {
      const r = await (await fetch('/guardar', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: fecha(), html: copia.outerHTML }) })).json();
      if (r.error) throw new Error(r.error);
      sucio = false;
      confirmarSalida = false;
      pintarRevision();
      estadoRev('Guardado en el deck de tu compu. Para que llegue al Artifact, pedile a Claude "publicá los cambios".');
    } catch (e) {
      estadoRev('No se pudo guardar: ' + e.message);
    }
  }
})();
