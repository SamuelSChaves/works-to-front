from pathlib import Path
lines = Path('frontend/src/pages/AcoesTO.tsx').read_text().splitlines()
for i in range(1435, 1465):
    print(f'{i+1:04d}: {lines[i]!r}')
