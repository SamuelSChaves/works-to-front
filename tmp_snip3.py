from pathlib import Path
lines = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text().splitlines()
for i in range(1650, 1668):
    print(f'{i+1:04d}: {lines[i]!r}')
