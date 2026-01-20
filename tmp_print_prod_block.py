from pathlib import Path
lines = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text().splitlines()
start = next(i for i, line in enumerate(lines) if "activeTab === 'produtividade'" in line)
for i in range(start, start + 80):
    print(f"{i+1}: {lines[i]}")
