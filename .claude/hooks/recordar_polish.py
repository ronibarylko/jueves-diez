"""Hook PreToolUse de Artifact: antes de publicar un deck, le recuerda a Claude el polish de Impeccable.

El 15/10 y el 22/10 se iteraron decks con muchos cambios de diseño sin pasar polish, aunque la skill lo pide.
"""
import json
import re
import sys

sys.stdin.reconfigure(encoding='utf-8')  # en Windows, sin esto lee y escribe en cp1252
sys.stdout.reconfigure(encoding='utf-8')
datos = json.load(sys.stdin)
archivo = (datos.get('tool_input') or {}).get('file_path') or ''
if re.search(r'Avances Semanales - (?!Template).*\.html$', archivo):
    print(json.dumps({'hookSpecificOutput': {
        'hookEventName': 'PreToolUse',
        'additionalContext': (
            'Antes de publicar el deck: si desde la última pasada de Impeccable hubo cambios de diseño '
            '(slides nuevas, layout, recuadros, íconos, gráficos, figuras), invocá ahora la skill '
            'impeccable:impeccable con polish sobre esas slides (con la herramienta Skill, no a mano), y después publicá. '
            'Si fueron solo cambios de texto, seguí. En tu respuesta decí en una línea si pasó por polish.'),
    }}, ensure_ascii=False))
