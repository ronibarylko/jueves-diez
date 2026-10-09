"""Correr: python test_cambios.py"""
from datetime import datetime

from cambios import ultimo_jueves

assert ultimo_jueves(datetime(2026, 10, 9, 12)) == datetime(2026, 10, 8, 10)    # viernes → jueves de ayer
assert ultimo_jueves(datetime(2026, 10, 14, 18)) == datetime(2026, 10, 8, 10)   # miércoles de la rutina → jueves pasado
assert ultimo_jueves(datetime(2026, 10, 15, 9)) == datetime(2026, 10, 8, 10)    # jueves antes de presentar → el anterior
assert ultimo_jueves(datetime(2026, 10, 15, 11)) == datetime(2026, 10, 15, 10)  # jueves después de presentar → hoy
print('ok')
