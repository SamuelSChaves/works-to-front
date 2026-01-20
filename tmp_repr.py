from pathlib import Path
line = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text().splitlines()[16]
print(repr(line))
line2 = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text().splitlines()[22]
print(repr(line2))
