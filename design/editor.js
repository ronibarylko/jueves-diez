// Barra del deck publicado como Artifact: navegar, editar el texto a mano, guardar y pantalla completa.
// Guardar republica la página con la capacidad `artifact`; solo se serializa lo marcado con data-p.
(() => {
  // El esqueleto exacto que pone el Artifact al publicar: la página que se republica tiene que empezar igual.
  const ESQUELETO = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#faf9f5;color:#141413}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}</style></head><body>';

  const stage = () => document.querySelector('deck-stage');
  const css = document.createElement('style');
  css.textContent = `
    #barra { position: fixed; z-index: 10; right: 16px; bottom: calc(16px + env(safe-area-inset-bottom, 0px)); display: flex; gap: 8px; align-items: center;
      padding: 8px; border-radius: 999px; background: rgba(20, 20, 20, .92); border: 1px solid #3d3d3d; font: 500 16px/1 Poppins, system-ui, sans-serif; color: #fff }
    #barra button { font: inherit; color: inherit; background: rgba(255, 255, 255, .08); border: 1px solid #3d3d3d; border-radius: 999px; padding: 10px 16px; cursor: pointer }
    #barra button:hover { background: rgba(255, 255, 255, .16) }
    #barra button:focus-visible { outline: 3px solid #fff; outline-offset: 2px }
    #barra button.activo { background: #fff; color: #000 }
    #b-estado { padding: 0 8px; color: #a8a8a8 }
    #b-estado:empty { display: none }
    :fullscreen #barra { opacity: 0; transition: opacity .2s } :fullscreen #barra:hover { opacity: 1 }
    @media (prefers-reduced-motion: reduce) { :fullscreen #barra { transition: none } }`;
  document.head.append(css);

  const barra = document.createElement('div');
  barra.id = 'barra';
  barra.innerHTML = '<button id="b-ant" aria-label="Slide anterior">◀</button><button id="b-sig" aria-label="Slide siguiente">▶</button>'
    + '<button id="b-editar" hidden>Editar</button><button id="b-practicar">Practicar</button><button id="b-full">Pantalla completa</button><span id="b-estado" role="status"></span>';
  document.body.append(barra);
  barra.addEventListener('click', e => e.stopPropagation());  // que un click en la barra no pase de slide
  const $ = id => document.getElementById(id);
  const estado = t => { $('b-estado').textContent = t; };

  $('b-ant').onclick = () => stage().ir(stage().i - 1);
  $('b-sig').onclick = () => stage().ir(stage().i + 1);
  $('b-full').onclick = () => document.documentElement.requestFullscreen?.().catch(() => estado('Pantalla completa no disponible acá'));
  // Practicar abre en otra pestaña el deck que sirve practicar.py en localhost: ahí graba y transcribe Whisper. El
  // Artifact no puede usar el micrófono ni arrancar programas (jueves-diez://, file:// y una página puente publicada
  // en claude.ai: probados, no andan), así que practicar.py corre en segundo plano (python practicar.py --instalar).
  // La página no puede saber si la pestaña cargó: el mensaje no lo afirma. En el deck local, practica-local.js
  // reemplaza este botón.
  $('b-practicar').onclick = () => {
    const fecha = document.querySelector('[data-auto-date]')?.dataset.autoDate || '';
    const a = Object.assign(document.createElement('a'), { href: 'http://localhost:8766/?fecha=' + encodeURIComponent(fecha), target: '_blank', rel: 'noopener' });
    a.click();
    estado('Si la pestaña da error, practicar.py no está corriendo: python practicar.py --instalar');
  };

  let artifact = null, editando = false;
  window.claude?.use?.('artifact').then(a => { artifact = a; $('b-editar').hidden = !a; });

  // La página tal como se escribió, con el texto editado y sin nada de lo que agregan el visor y esta barra.
  function documento() {
    const partes = [...document.body.children].filter(el => el.hasAttribute('data-p')).map(el => {
      const c = el.cloneNode(true);
      for (const x of [c, ...c.querySelectorAll('[data-activa], [contenteditable]')]) { x.removeAttribute('data-activa'); x.removeAttribute('contenteditable'); }
      return c.outerHTML;
    });
    return ESQUELETO + partes.join('\n') + '</body></html>';
  }

  $('b-editar').onclick = async () => {
    editando = !editando;
    stage().editar(editando);
    $('b-editar').textContent = editando ? 'Guardar' : 'Editar';
    $('b-editar').classList.toggle('activo', editando);
    estado(editando ? 'Click en un texto para cambiarlo' : 'Guardando…');
    if (editando) return;
    try {
      await artifact.publish(documento());
      estado('Guardado');
    } catch (e) {
      estado(e?.code === 'conflict' ? 'Alguien guardó antes: se recarga la última versión'
        : e?.code === 'not_granted' || e?.code === 'not_writer' ? 'No tenés permiso para guardar este deck'
        : 'No se pudo guardar: ' + (e?.message || e?.code || 'error'));
    }
  };
})();
