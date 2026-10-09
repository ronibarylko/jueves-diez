// Visor mínimo que reemplaza al deck-stage.js de Claude Design (135 KB, casi todo es el editor de miniaturas).
// Escala cada slide a la ventana y avanza con flechas/espacio/click. editor.js le suma la barra y el guardado.
// Todo lo que agrega va en <style id="deck-stage-css"> y en data-activa, para poder sacarlo al guardar.
customElements.define('deck-stage', class extends HTMLElement {
  connectedCallback() {
    const w = +this.getAttribute('width') || 1920, h = +this.getAttribute('height') || 1080;
    this.slides = [...this.children];
    document.head.insertAdjacentHTML('beforeend', `<style id="deck-stage-css">
      deck-stage { position: fixed; inset: 0; overflow: hidden; background: #000 }
      deck-stage > * { position: absolute !important; width: ${w}px !important; height: ${h}px !important; margin: 0 !important;
        left: calc(50% - ${w / 2}px) !important; top: calc(50% - ${h / 2}px) !important; transform: scale(var(--k, 1)) !important }
      deck-stage > :not([data-activa]) { visibility: hidden }
      [contenteditable]:focus { outline: 3px dashed #ffd400; outline-offset: 4px }
    </style>`);
    const ajustar = () => document.documentElement.style.setProperty('--k', Math.min(innerWidth / w, innerHeight / h));
    addEventListener('resize', ajustar);
    addEventListener('keydown', e => {
      if (e.target.isContentEditable || e.target.matches?.('input, textarea')) return;  // escribiendo: las teclas son texto      const paso = { ArrowRight: 1, ArrowDown: 1, PageDown: 1, ' ': 1, ArrowLeft: -1, ArrowUp: -1, PageUp: -1 }[e.key];
      if (paso) { e.preventDefault(); this.ir(this.i + paso); }
      if (e.key === 'Home') this.ir(0);
      if (e.key === 'End') this.ir(this.slides.length - 1);
    });
    addEventListener('click', e => { if (!e.target.isContentEditable) this.ir(this.i + (e.clientX > innerWidth / 2 ? 1 : -1)); });
    ajustar();
    this.ir((+location.hash.slice(1) || 1) - 1);
  }

  ir(n) {
    this.i = Math.max(0, Math.min(this.slides.length - 1, n));
    this.slides.forEach((s, j) => s.toggleAttribute('data-activa', j === this.i));
    history.replaceState(null, '', '#' + (this.i + 1));
  }

  editar(si) {
    for (const s of this.slides) if (si) s.contentEditable = 'true'; else s.removeAttribute('contenteditable');
  }
});
