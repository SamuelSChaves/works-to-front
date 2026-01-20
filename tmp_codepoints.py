from pathlib import Path
line = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text().splitlines()[16]
print([hex(ord(ch)) for ch in line])
