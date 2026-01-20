from pathlib import Path
lines = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text().splitlines()
for idx, line in enumerate(lines):
    if 'Ã' in line:
        print(idx+1, line)
