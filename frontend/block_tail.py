from pathlib import Path
text = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text()
start = text.find("{activeTab === 'acoes' && (")
end = text.find("{activeTab === 'cadastro-ativo' && (")
block = text[start:end]
print(block[-200:])
