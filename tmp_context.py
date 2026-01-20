from pathlib import Path
text = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text()
pos = text.index("{activeTab === 'acoes' && (")
print(repr(text[pos-60:pos+40]))
