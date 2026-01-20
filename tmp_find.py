from pathlib import Path
lines = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text().splitlines()
for idx, line in enumerate(lines):
    if 'const ajustesTabs' in line:
        print(idx, line)
        break
