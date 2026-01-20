from pathlib import Path
lines = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text().splitlines()
for i in range(2280, 2345):
    print(f"{i+1}: {lines[i]}")
