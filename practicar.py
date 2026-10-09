"""Practicar el deck en voz alta: lo sirve en localhost, graba el audio y lo transcribe con Whisper, en esta compu.

Instalar una vez: python practicar.py --instalar   → queda corriendo en segundo plano y arranca con Windows
                                                   (--desinstalar lo saca). Whisper se carga recién al transcribir;
                                                   a los 10 min sin uso se reinicia solo para liberar la memoria.
El botón Practicar del Artifact abre http://localhost:8766/?fecha=15 OCT 2026: el Artifact no puede arrancar
programas, así que esto tiene que estar corriendo.
A mano: python practicar.py [--sin-abrir] → abre el deck más reciente; se apaga a los 10 min de cerrarlo.
En el deck, "Practicar" graba y anota cuándo pasa cada slide; "Terminar" guarda en practicas/
el audio y <id>.json, que al terminar de transcribir tiene, por slide, lo dicho, el ritmo, las pausas y las muletillas.
"""
import base64
import json
import os
import re
import sys
import threading
import time
import webbrowser
from datetime import datetime
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

AQUI = Path(__file__).resolve().parent
DISENO = AQUI / 'design'
PRACTICAS = AQUI / 'practicas'
if not (AQUI / 'config.json').exists():
    raise SystemExit('Falta config.json: copiá config.ejemplo.json como config.json y completalo.')
CONFIG = json.loads((AQUI / 'config.json').read_text(encoding='utf-8'))
DS = DISENO / CONFIG['design_system']
PUERTO = 8766
MODELO = 'medium'
# El prompt con muletillas hace que Whisper las escriba en vez de limpiarlas.
PROMPT = 'Eh, bueno, este... o sea, digamos que, mm, la idea es esta.'
MULETILLAS = ['eh', 'em', 'mm', 'este', 'o sea', 'digamos', 'bueno', 'tipo', 'viste', 'nada']
PAUSA_LARGA = 2.0  # segundos sin hablar
APAGAR_TRAS = 10 * 60  # segundos sin pedidos; el deck abierto pide /latido cada minuto
DESCARGAR_TRAS = int(os.environ.get('PRACTICAR_DESCARGAR_TRAS', 10 * 60))  # segundos sin transcribir (la variable es para probarlo)


def deck(fecha=None):
    """El deck de esa fecha (la del Artifact desde donde se apretó Practicar), el más reciente, o None si no hay."""
    if fecha and (p := DISENO / f'Avances Semanales - {fecha}.html').exists():
        return p
    decks = [p for p in DISENO.glob('Avances Semanales - *.html') if 'Template' not in p.name]
    return max(decks, key=lambda p: p.stat().st_mtime, default=None)


ultimo_pedido = time.time()
ultimo_uso = 0.0  # última transcripción
transcribiendo = 0  # no apagarse ni descargar Whisper en medio de una transcripción

_modelo, _lock = None, threading.Lock()


def librerias_cuda():
    """Las DLL de CUDA que instala pip (nvidia-cublas-cu12, nvidia-cudnn-cu12) no están en el PATH: sumarlas."""
    try:
        import nvidia
    except ImportError:
        return
    for raiz in nvidia.__path__:
        for carpeta in Path(raiz).glob('*/bin'):
            os.add_dll_directory(str(carpeta))
            os.environ['PATH'] = str(carpeta) + os.pathsep + os.environ['PATH']


def modelo():
    global _modelo
    with _lock:
        if _modelo is None:
            librerias_cuda()
            import numpy as np
            from faster_whisper import WhisperModel
            try:  # la placa falla recién al transcribir si faltan las librerías de CUDA: probarla con un segundo de silencio
                _modelo = WhisperModel(MODELO, device='cuda', compute_type='float16')
                list(_modelo.transcribe(np.zeros(16000, dtype=np.float32))[0])
            except Exception:
                _modelo = WhisperModel(MODELO, device='cpu', compute_type='int8')
        return _modelo


def leer_audio(ruta):
    """El audio a 16 kHz mono. faster-whisper 1.2.1 lo lee con un argumento que PyAV 19 ya no acepta."""
    import av
    import numpy as np
    remuestreo = av.AudioResampler(format='s16', layout='mono', rate=16000)
    with av.open(ruta) as archivo:
        trozos = [r.to_ndarray() for cuadro in archivo.decode(audio=0) for r in remuestreo.resample(cuadro)]
    trozos += [r.to_ndarray() for r in remuestreo.resample(None)]
    return np.concatenate(trozos, axis=1).flatten().astype(np.float32) / 32768


def analizar(palabras, cambios, slides, total):
    """Reparte las palabras por slide según cuándo pasó cada una, y mide ritmo, pausas y muletillas."""
    bordes = cambios + [{'slide': None, 't': total}]
    por_slide = {}
    for desde, hasta in zip(bordes, bordes[1:]):
        dentro = [w for w in palabras if desde['t'] <= w['inicio'] < hasta['t']]
        s = por_slide.setdefault(desde['slide'], {'segundos': 0.0, 'palabras': []})
        s['segundos'] += hasta['t'] - desde['t']
        s['palabras'] += dentro
    resultado = []
    for i, info in enumerate(slides):
        s = por_slide.get(i, {'segundos': 0.0, 'palabras': []})
        ws = s['palabras']
        texto = ' '.join(w['texto'] for w in ws)
        huecos = [b['inicio'] - a['fin'] for a, b in zip(ws, ws[1:])]
        bajo = ' ' + re.sub(r'[^\wáéíóúñü ]', ' ', texto.lower()) + ' '
        resultado.append({
            'slide': i + 1,
            'titulo': info['titulo'],
            'contenido': info['contenido'],
            'segundos': round(s['segundos']),
            'dijo': texto,
            'palabras': len(ws),
            'palabras_por_minuto': round(len(ws) / s['segundos'] * 60) if s['segundos'] >= 5 else None,
            'pausas_largas': sum(h >= PAUSA_LARGA for h in huecos),
            'pausa_mas_larga': round(max(huecos, default=0), 1),
            'muletillas': {m: n for m in MULETILLAS if (n := bajo.count(f' {m} '))},
        })
    return resultado


FEEDBACK = '''Sos coach de presentaciones. {nombre} practicó en voz alta su presentación semanal de avances de I+D y Whisper
la transcribió. Abajo van su memoria de estilo y la práctica: por slide, segundos, lo que dijo, palabras por minuto,
pausas largas y muletillas, más los minutos que tiene. La transcripción puede tener errores de Whisper: no los marques.

Criterios: timing (total contra los minutos; slides que se comieron más tiempo del que valen o que pasó demasiado
rápido), ritmo (cómodo: 130 a 160 palabras por minuto; dónde se aceleró o se trabó), muletillas (solo si se repiten;
"este" y "bueno" también son palabras normales), hilo, orden, qué sobra, qué no se entiende o qué dijo que la slide
no muestra, y estilo según "Para mejorar" de la memoria.

Respondé SOLO un objeto JSON, sin markdown ni texto antes o después, con esta forma:
{{"general": {{"titular": "la idea principal, hasta 8 palabras", "resumen": "una o dos oraciones", "bien": ["hasta 3, cortos"], "mejorar": ["hasta 3, cortos"]}},
 "slides": [{{"slide": 1, "estado": "bien" o "ajustar" o "cortar", "comentario": "una o dos oraciones",
   "sugerencia": "un cambio concreto a la slide o a cómo contarla, o vacío si no hace falta"}}],
 "aprendido": ["1 a 3 observaciones sobre cómo habla y presenta {nombre} (ritmo, muletillas, hábitos) que no estén ya en la memoria"]}}
Una entrada en "slides" por cada slide de la práctica, en orden. Si en una slide no dijo nada ("dijo" vacío), su
"estado" es "sin_hablar" y el comentario solo dice que no la presentó: no la califiques por cómo está armada.
Castellano rioplatense, frases cortas.

MEMORIA
{memoria}

PRÁCTICA
{practica}'''

EDITAR = '''Esta es una slide (una <section>) de un deck de avances semanales de Flock Labs I+D. Reescribila aplicando el
pedido. Mantené las clases, la estructura y los estilos que ya tiene: es un design system. Nada de cursiva; los
títulos en una línea, hasta unos 32 caracteres. Un mensaje por slide: si queda cargada de texto, recortá.
Respondé SOLO con el HTML de la <section>, sin markdown ni texto extra.
{contexto}
PEDIDO
{pedido}

SLIDE
{html}'''


def contexto_impeccable():
    """PRODUCT.md y DESIGN.md, los que arma Impeccable al configurar: el claude -p sin herramientas no puede correr
    Impeccable, pero sí seguir sus reglas. La skill le pasa polish a estos cambios antes de publicarlos."""
    partes = [f'\n{n} (de Impeccable: respetalo)\n{(AQUI / n).read_text(encoding="utf-8")[:6000]}\n'
              for n in ('PRODUCT.md', 'DESIGN.md') if (AQUI / n).exists()]
    return ''.join(partes)


def claude(prompt):
    """Claude Code sin herramientas (claude -p, solo texto, con la cuenta de la persona)."""
    import subprocess
    r = subprocess.run(['claude', '-p', '--tools', '', '--no-session-persistence'], input=prompt,
                       cwd=AQUI, capture_output=True, text=True, encoding='utf-8', timeout=600,
                       creationflags=getattr(subprocess, 'CREATE_NO_WINDOW', 0))
    if r.returncode != 0 or not r.stdout.strip():
        raise RuntimeError(r.stderr.strip()[:200] or 'Claude no respondió')
    return r.stdout.strip()


def pedir_feedback(datos):
    """El feedback como dict (general, slides, aprendido), o None si falla: se pide en el chat."""
    memoria = AQUI / 'memoria.md'
    practica = {k: v for k, v in datos.items() if k not in ('cambios', 'estado')}
    try:
        texto = claude(FEEDBACK.format(nombre=CONFIG.get('nombre') or 'la persona', memoria=memoria.read_text(encoding='utf-8') if memoria.exists() else '(vacía)',
                                       practica=json.dumps(practica, ensure_ascii=False)))
        return json.loads(texto[texto.find('{'):texto.rfind('}') + 1])
    except Exception as e:
        print(f'Feedback falló: {e}', flush=True)
        return None


def mmss(segundos):
    return f'{int(segundos) // 60}:{int(segundos) % 60:02d}'


def sumar_a_seccion(texto, titulo, lineas):
    """Agrega líneas al final de la sección de memoria.md que empieza con ese título."""
    ini = texto.index(titulo)
    fin = texto.find('\n## ', ini + len(titulo))
    fin = len(texto) if fin == -1 else fin
    return texto[:ini] + texto[ini:fin].rstrip('\n') + '\n' + '\n'.join(lineas) + '\n' + texto[fin:]


def propuesta_memoria(datos, aprendido):
    """Lo que se sumaría a memoria.md: lo aprendido para "Cómo presento" y una fila para "Prácticas". Se guarda solo si
    la persona dice que sí en el deck (POST /memoria)."""
    larga = max(datos['slides'], key=lambda s: s['segundos'])
    deck = str(datos.get('deck', '')).split('·')[-1].strip()
    return {
        'aprendido': [str(a).strip() for a in aprendido if str(a).strip()],
        'fila': (f"| {deck} | {datos.get('minutos') or '?'} | {mmss(datos['total'])} | {datos.get('palabras_por_minuto') or '?'} "
                 f"| {larga['slide']}. {larga['titulo']} ({mmss(larga['segundos'])}) |"),
        'resumen': f'La práctica en la tabla: {mmss(datos["total"])}, {datos.get("palabras_por_minuto") or "?"} palabras por minuto',
    }


def guardar_en_memoria(datos, propuesta):
    """Escribe la propuesta en memoria.md."""
    ruta = AQUI / 'memoria.md'
    texto = ruta.read_text(encoding='utf-8').replace('(Se llena con las prácticas.)\n', '')
    if propuesta['aprendido']:
        texto = sumar_a_seccion(texto, '## Cómo presento', [f"- {datos['id'][:10]}: {a}" for a in propuesta['aprendido']])
    texto = sumar_a_seccion(texto, '## Prácticas', [propuesta['fila']])
    ruta.write_text(texto, encoding='utf-8')


def transcribir(id_):
    global transcribiendo, ultimo_uso
    transcribiendo += 1
    try:
        _transcribir(id_)
    finally:
        transcribiendo -= 1
        ultimo_uso = time.time()


def _transcribir(id_):
    datos_path = PRACTICAS / f'{id_}.json'
    datos = json.loads(datos_path.read_text(encoding='utf-8'))
    try:
        segmentos, _ = modelo().transcribe(leer_audio(str(PRACTICAS / f'{id_}.webm')), language='es', word_timestamps=True,
                                           vad_filter=True, initial_prompt=PROMPT)
        palabras = [{'texto': w.word.strip(), 'inicio': float(w.start), 'fin': float(w.end)}  # numpy no pasa a JSON
                    for seg in segmentos for w in seg.words]
        datos['slides'] = analizar(palabras, datos['cambios'], datos['slides'], datos['total'])
        datos['palabras_por_minuto'] = round(len(palabras) / datos['total'] * 60) if datos['total'] else None
        datos['estado'] = 'analizando'
        datos_path.write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding='utf-8')
        datos['feedback'] = pedir_feedback(datos)
        callada = {s['slide'] for s in datos['slides'] if not s['dijo'].strip()}
        for s in (datos['feedback'] or {}).get('slides', []):  # una slide sin hablar no se califica, diga lo que diga Claude
            if s.get('slide') in callada:
                s['estado'] = 'sin_hablar'
        datos['memoria_propuesta'] = propuesta_memoria(datos, (datos['feedback'] or {}).get('aprendido', []))
        datos['memoria'] = 'pendiente'  # la persona decide en el deck si se guarda
        datos['estado'] = 'listo'
        texto = json.dumps(datos, ensure_ascii=False, indent=1)
    except Exception as e:  # cualquier falla tiene que llegar a la página, si no se queda esperando
        datos = json.loads(datos_path.read_text(encoding='utf-8'))
        datos['estado'] = f'error: {e}'
        texto = json.dumps(datos, ensure_ascii=False, indent=1)
    datos_path.write_text(texto, encoding='utf-8')


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **k):
        super().__init__(*a, directory=str(DISENO), **k)

    def log_message(self, *a):
        pass

    def responder(self, cuerpo, tipo='application/json; charset=utf-8', codigo=200):
        datos = cuerpo.encode('utf-8') if isinstance(cuerpo, str) else cuerpo
        self.send_response(codigo)
        self.send_header('Content-Type', tipo)
        self.send_header('Content-Length', str(len(datos)))
        self.end_headers()
        self.wfile.write(datos)

    def do_GET(self):
        global ultimo_pedido
        ultimo_pedido = time.time()
        url = urlsplit(self.path)
        if url.path in ('/', '/index.html'):
            fecha = parse_qs(url.query).get('fecha', [None])[0]
            print(f'Deck pedido por: {self.headers.get("User-Agent")}', flush=True)  # para saber en qué navegador se abrió
            if not (archivo := deck(fecha)):
                return self.responder('<!doctype html><meta charset="utf-8"><p style="font:24px system-ui;padding:40px">'
                                      'Todavía no hay ningún deck en design/: armalo primero con Claude.</p>',
                                      'text/html; charset=utf-8', 404)
            pagina = ('<!doctype html><html><head><meta charset="utf-8">'
                      '<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>'
                      + archivo.read_text(encoding='utf-8')
                      + '<script src="practica-local.js"></script></body></html>')
            return self.responder(pagina, 'text/html; charset=utf-8')
        if url.path == '/latido':  # el deck abierto avisa que sigue ahí
            return self.responder('{}')
        if m := re.fullmatch(r'/estado/([\w-]+)', self.path):
            archivo = PRACTICAS / f'{m[1]}.json'
            datos = json.loads(archivo.read_text(encoding='utf-8')) if archivo.exists() else {'estado': 'no existe'}
            medidas = [{k: s.get(k) for k in ('slide', 'titulo', 'segundos', 'palabras', 'palabras_por_minuto', 'pausas_largas', 'muletillas')}
                       for s in datos.get('slides', []) if 'segundos' in s]
            return self.responder(json.dumps({k: datos.get(k) for k in ('id', 'estado', 'total', 'minutos', 'palabras_por_minuto',
                                                                        'feedback', 'memoria', 'memoria_propuesta')} | {'slides': medidas},
                                             ensure_ascii=False))
        if self.path.startswith('/ds/'):  # el deck publicado llama ds/ a la carpeta del design system
            archivo = (DS / self.path[4:].split('?')[0]).resolve()
            if DS.resolve() in archivo.parents and archivo.is_file():
                return self.responder(archivo.read_bytes(), self.guess_type(str(archivo)))
            return self.send_error(404)
        return super().do_GET()

    def do_POST(self):
        global ultimo_pedido
        ultimo_pedido = time.time()
        datos = json.loads(self.rfile.read(int(self.headers['Content-Length'])))
        if self.path == '/editar':  # Claude reescribe una slide con el pedido de la persona
            try:
                html = re.sub(r'^```\w*\s*|\s*```$', '', claude(EDITAR.format(pedido=datos['pedido'], html=datos['html'],
                                                                              contexto=contexto_impeccable())))
                if not re.fullmatch(r'\s*<section[\s\S]*</section>\s*', html) or '<script' in html or re.search(r'\son\w+\s*=', html):
                    raise ValueError('Claude no devolvió una slide válida')
                return self.responder(json.dumps({'html': html.strip()}, ensure_ascii=False))
            except Exception as e:
                return self.responder(json.dumps({'error': str(e)}, ensure_ascii=False))
        if self.path == '/apagar':  # lo usa --instalar para reemplazar uno viejo, y --desinstalar
            self.responder('{}')
            return threading.Thread(target=self.server.shutdown, daemon=True).start()
        if self.path == '/memoria':  # la persona decidió si lo aprendido de esta práctica va a memoria.md
            archivo = PRACTICAS / f"{re.sub(r'[^\w-]', '', str(datos.get('id')))}.json"
            if not archivo.exists():
                return self.responder(json.dumps({'error': 'no existe esa práctica'}))
            practica = json.loads(archivo.read_text(encoding='utf-8'))
            if practica.get('memoria') == 'pendiente':
                try:
                    if datos.get('guardar'):
                        guardar_en_memoria(practica, practica['memoria_propuesta'])
                    practica['memoria'] = 'guardada' if datos.get('guardar') else 'descartada'
                except Exception as e:
                    return self.responder(json.dumps({'error': f'no se pudo escribir memoria.md: {e}'}, ensure_ascii=False))
                archivo.write_text(json.dumps(practica, ensure_ascii=False, indent=1), encoding='utf-8')
            return self.responder(json.dumps({'memoria': practica['memoria']}))
        if self.path == '/guardar':  # los cambios de la revisión van al deck de esta compu; Claude los publica después
            html = datos['html']
            if not (html.startswith('<deck-stage') and html.endswith('</deck-stage>')) or '<script' in html:
                return self.responder(json.dumps({'error': 'deck inválido'}))
            if not (archivo := deck(datos.get('fecha'))):
                return self.responder(json.dumps({'error': 'no hay deck'}))
            archivo.write_text(re.sub(r'<deck-stage[\s\S]*?</deck-stage>', lambda _: html, archivo.read_text(encoding='utf-8'), count=1),
                               encoding='utf-8')
            with open(DISENO / 'cambios_sin_publicar.txt', 'a', encoding='utf-8') as f:
                f.write(f'{datetime.now():%Y-%m-%d %H:%M} {archivo.name}\n')
            return self.responder(json.dumps({'ok': True, 'deck': archivo.name}, ensure_ascii=False))
        if self.path != '/practica':
            return self.send_error(404)
        id_ = datetime.now().strftime('%Y-%m-%d_%H%M%S')
        PRACTICAS.mkdir(exist_ok=True)
        (PRACTICAS / f'{id_}.webm').write_bytes(base64.b64decode(datos.pop('audio')))
        datos.update(id=id_, estado='transcribiendo')
        (PRACTICAS / f'{id_}.json').write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding='utf-8')
        threading.Thread(target=transcribir, args=(id_,), daemon=True).start()
        self.responder(json.dumps({'id': id_}))


def abrir(url):
    """En el navegador de config.json ("navegador": "edge"), o en el predeterminado de Windows."""
    if CONFIG.get('navegador') == 'edge':  # el enlace microsoft-edge: no abrió nada (probado): llamar a msedge.exe
        import subprocess
        import winreg
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r'SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\msedge.exe') as k:
            subprocess.Popen([winreg.QueryValue(k, None), url])
    else:
        webbrowser.open(url)


def apagar_sin_uso(servidor):
    while transcribiendo or time.time() - ultimo_pedido < APAGAR_TRAS:
        time.sleep(60)
    servidor.shutdown()


def descargar_sin_uso(servidor, fondo):
    """A los 10 min de la última transcripción saca a Whisper de la memoria. Soltar el modelo libera la placa pero no
    la RAM (las librerías de NVIDIA quedan cargadas en el proceso): en segundo plano se reinicia y vuelve a unos 25 MB."""
    global _modelo
    while True:
        time.sleep(min(60, DESCARGAR_TRAS))
        with _lock:
            if _modelo is None or transcribiendo or time.time() - ultimo_uso <= DESCARGAR_TRAS:
                continue
            if fondo:
                import subprocess
                print(f'{datetime.now():%H:%M} Whisper sin uso: reinicio para liberar la memoria', flush=True)
                servidor.shutdown()
                servidor.server_close()
                subprocess.Popen([sys.executable, str(AQUI / 'practicar.py'), '--fondo'], cwd=AQUI,
                                 creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP)
                os._exit(0)
            _modelo = None
            import gc
            gc.collect()
            print(f'{datetime.now():%H:%M} Whisper descargado', flush=True)


# El botón Practicar del Artifact solo puede abrir localhost: para que ande sin pedirle nada a Claude, --instalar deja
# este script arrancando con Windows en segundo plano (--fondo), con un .pyw en la carpeta Inicio del usuario.
INICIO = Path(os.environ.get('APPDATA', '')) / 'Microsoft' / 'Windows' / 'Start Menu' / 'Programs' / 'Startup' / 'jueves-diez-practicar.pyw'


def corriendo():
    import socket
    with socket.socket() as s:  # en Windows dos servidores pueden tomar el mismo puerto: preguntar si ya hay uno
        return s.connect_ex(('127.0.0.1', PUERTO)) == 0


def apagar_el_que_corre():
    import urllib.request
    try:
        urllib.request.urlopen(urllib.request.Request(f'http://127.0.0.1:{PUERTO}/apagar', b'{}', method='POST'), timeout=5)
    except Exception:
        pass
    for _ in range(20):
        if not corriendo():
            return
        time.sleep(0.5)


def instalar():
    import subprocess
    INICIO.write_text('import runpy, sys\n'
                      f'sys.argv = [r"{AQUI / "practicar.py"}", "--fondo"]\n'
                      'runpy.run_path(sys.argv[0], run_name="__main__")\n', encoding='utf-8')
    apagar_el_que_corre()  # si había uno con código viejo
    pythonw = Path(sys.executable).with_name('pythonw.exe')
    subprocess.Popen([str(pythonw), str(AQUI / 'practicar.py'), '--fondo'], cwd=AQUI,
                     creationflags=subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP)
    for _ in range(40):
        if corriendo():
            return print(f'Listo: practicar.py corre en segundo plano y arranca con Windows ({INICIO}).')
        time.sleep(0.5)
    print('Se instaló el arranque con Windows, pero no arrancó ahora: mirá practicar.log.')


def desinstalar():
    INICIO.unlink(missing_ok=True)
    apagar_el_que_corre()
    print('Listo: practicar.py ya no arranca con Windows y está apagado.')


if __name__ == '__main__':
    if sys.stdout is None:  # con pythonw (segundo plano) no hay consola: lo impreso y los errores van a practicar.log
        sys.stdout = sys.stderr = open(AQUI / 'practicar.log', 'a', encoding='utf-8', buffering=1)
        print(f'--- {datetime.now():%Y-%m-%d %H:%M:%S} {sys.argv[1:]}')
    if '--instalar' in sys.argv:
        sys.exit(instalar())
    if '--desinstalar' in sys.argv:
        sys.exit(desinstalar())
    fondo = '--fondo' in sys.argv
    url = f'http://localhost:{PUERTO}/'
    servidor = None if corriendo() else ThreadingHTTPServer(('127.0.0.1', PUERTO), Handler)
    if not fondo and '--sin-abrir' not in sys.argv:
        abrir(url)
    if servidor:
        print(f'Practicando {getattr(deck(), "name", "(todavía no hay deck)")} en {url}', flush=True)
        threading.Thread(target=descargar_sin_uso, args=(servidor, fondo), daemon=True).start()
        if not fondo:  # a mano: cargar Whisper mientras practica y apagarse al cerrar el deck
            threading.Thread(target=modelo, daemon=True).start()
            threading.Thread(target=apagar_sin_uso, args=(servidor,), daemon=True).start()
        servidor.serve_forever()
