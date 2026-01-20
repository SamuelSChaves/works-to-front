from pathlib import Path
lines = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text().splitlines()
for i in range(2320, 2355):
    print(f'{i+1:04d}: {lines[i]!r}')
