from pathlib import Path
lines = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text().splitlines()
for idx in range(1510, 1660):
    print(idx+1, lines[idx])
