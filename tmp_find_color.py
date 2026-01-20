from pathlib import Path
path = Path('frontend/src/pages/ConfiguracaoAjustes.tsx')
text = path.read_text()
start = text.index("{activeTab === 'produtividade' && (")
end = text.index("{activeTab === 'acoes'", start)
block = text[start:end]
idx = 0
while True:
    idx = block.find("color: '#94a3b8'", idx)
    if idx == -1:
        break
    print('found at', idx)
    idx += 1
