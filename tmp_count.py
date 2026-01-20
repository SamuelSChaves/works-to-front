from pathlib import Path
text = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text()
start = text.index("{activeTab === 'acoes' && (")
end = text.index("{activeTab === 'cadastro-ativo' && (", start)
block = text[start:end]
print('block length', len(block))
print('(', block.count('('), ')', block.count(')'))
print('{', block.count('{'), '}', block.count('}'))
