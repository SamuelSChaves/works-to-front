
from pathlib import Path

path = Path('src/pages/AcoesTO.tsx')
text = path.read_text(encoding='utf-8')

start = text.index("  grupo_acao: ''")
end = text.index("  criticidade: 'Alta',", start) + len("  criticidade: 'Alta',")

replacement = (
