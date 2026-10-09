"""Qué cambió en el escritorio desde la última presentación (el jueves anterior a las 10:00).

Correr: python cambios.py   → imprime, por carpeta, commits, cambios sin commitear y archivos modificados.
"""
import os
import subprocess
from datetime import datetime, timedelta
from pathlib import Path

AQUI = Path(__file__).resolve().parent
ESCRITORIO = AQUI.parent  # los proyectos viven al lado de este repo
IGNORAR = {'.git', 'node_modules', '__pycache__', '.venv', 'venv', '.ipynb_checkpoints', '.claude', AQUI.name}


def ultimo_jueves(ahora):
    """La última presentación: el jueves a las 10:00 más reciente antes de ahora."""
    d = ahora.replace(hour=10, minute=0, second=0, microsecond=0) - timedelta(days=(ahora.weekday() - 3) % 7)
    return d if d < ahora else d - timedelta(days=7)


def git(carpeta, *args):
    r = subprocess.run(['git', '-C', str(carpeta), *args], capture_output=True, text=True, encoding='utf-8', errors='replace')
    return r.stdout.strip()


def cambios_de_la_semana(desde, max_archivos=40):
    """Por carpeta del escritorio: commits, cambios sin commitear y archivos modificados desde `desde`."""
    ts, partes = desde.timestamp(), []
    sueltos = [p.name for p in ESCRITORIO.iterdir() if p.is_file() and p.stat().st_mtime > ts]
    if sueltos:
        partes.append('## Archivos sueltos del escritorio\n' + '\n'.join(sueltos))
    for carpeta in sorted(p for p in ESCRITORIO.iterdir() if p.is_dir() and p.name not in IGNORAR):
        archivos = []
        for raiz, dirs, nombres in os.walk(carpeta):
            dirs[:] = [d for d in dirs if d not in IGNORAR]
            for n in nombres:
                try:
                    m = os.stat(os.path.join(raiz, n)).st_mtime
                except OSError:
                    continue
                if m > ts:
                    archivos.append((m, Path(raiz, n).relative_to(carpeta).as_posix()))
        bloque = []
        if (carpeta / '.git').exists():
            commits = git(carpeta, 'log', f'--since={desde.isoformat()}', '--format=%h %ad %s', '--date=short', '--stat=100', '-n', '30')
            pendientes = git(carpeta, 'status', '--short')
            if commits:
                bloque.append('Commits:\n' + commits[:3000])
            if pendientes:
                bloque.append('Sin commitear (puede incluir cambios de semanas anteriores):\n' + pendientes[:1500])
        if archivos:
            archivos.sort(reverse=True)
            extra = f'\n… y {len(archivos) - max_archivos} más' if len(archivos) > max_archivos else ''
            bloque.append(f'Archivos modificados ({len(archivos)}):\n' + '\n'.join(a for _, a in archivos[:max_archivos]) + extra)
        if bloque:
            partes.append(f'## {carpeta.name}\n' + '\n'.join(bloque))
    return '\n\n'.join(partes) or 'No cambió nada en el escritorio.'


if __name__ == '__main__':
    desde = ultimo_jueves(datetime.now())
    print(f'Cambios desde el {desde:%d/%m %H:%M}\n')
    print(cambios_de_la_semana(desde))
