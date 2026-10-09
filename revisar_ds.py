"""Trae de Claude Design el design system y el Template a design/, o los actualiza si cambiaron.

Correr: python revisar_ds.py   (el proyecto de Design sale de config.json)
Los subagentes no tienen DesignSync, así que cada archivo lo trae un `claude -p` propio, en paralelo.
"""
import difflib
import json
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

AQUI = Path(__file__).resolve().parent
DISENO = AQUI / 'design'
TEMP = AQUI / '.revision_ds'
if not (AQUI / 'config.json').exists():
    raise SystemExit('Falta config.json: copiá config.ejemplo.json como config.json y completalo.')
CONFIG = json.loads((AQUI / 'config.json').read_text(encoding='utf-8'))
PROYECTO, DS = CONFIG['design_proyecto'], CONFIG['design_system']
# shortcut: lista fija de tokens; uno nuevo en Design no se trae. Sumar list_files si pasa.
TOKENS = ['fonts', 'colors', 'typography', 'spacing', 'radius-size', 'icons', 'type-styles']
ARCHIVOS = [f'{DS}/readme.md', f'{DS}/styles.css', *(f'{DS}/tokens/{t}.css' for t in TOKENS),
            'slide.css', 'CLAUDE.md', 'Avances Semanales - Template.html']


def posix(p):
    s = p.as_posix()
    return '//' + s[0].lower() + s[2:]


def traer(ruta):
    """Baja un archivo de Design a TEMP. Devuelve la ruta local o None si falló."""
    destino = TEMP / ruta.replace('/', '__')
    pedido = (f'Con DesignSync (projectId {PROYECTO}) hacé get_file del path "{ruta}" y guardá el content EXACTO, '
              f'sin cambiar ni un carácter, con Write en {destino}. Respondé solo ok o el error.')
    subprocess.run(['claude', '-p', pedido, '--model', 'sonnet', '--allowedTools', 'DesignSync', 'Write',
                    f'Edit({posix(TEMP)}/**)', '--permission-prompts', 'none', '--max-turns', '6'],
                   capture_output=True, text=True, encoding='utf-8', errors='replace', timeout=600)
    return destino if destino.exists() else None


def normal(texto):
    # la copia la escribe un modelo: ignorar diferencias de espacios al final de línea y del archivo
    return [l.rstrip() for l in texto.strip().splitlines()]


if __name__ == '__main__':
    TEMP.mkdir(exist_ok=True)
    try:
        with ThreadPoolExecutor(len(ARCHIVOS)) as pool:
            bajados = dict(zip(ARCHIVOS, pool.map(traer, ARCHIVOS)))
        cambios, fallas = [], [r for r, d in bajados.items() if d is None]
        for ruta, nuevo in bajados.items():
            if nuevo is None:
                continue
            local = DISENO / ruta
            viejo = local.read_text(encoding='utf-8') if local.exists() else ''
            dif = [l for l in difflib.unified_diff(normal(viejo), normal(nuevo.read_text(encoding='utf-8')), lineterm='', n=0)
                   if l[:1] in '+-' and not l.startswith(('+++', '---'))]
            if dif:
                local.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(nuevo, local)
                cambios.append(f'{ruta}: ' + ('nuevo' if not viejo else f'{len(dif)} líneas distintas, por ejemplo {dif[0][:120]}'))
        print('\n'.join(cambios) or 'Design System sin cambios.')
        if fallas:
            print('No pude traer:', ', '.join(fallas))
    finally:
        shutil.rmtree(TEMP, ignore_errors=True)
