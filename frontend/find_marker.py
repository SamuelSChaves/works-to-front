from pathlib import Path
text = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text()
start = text.find("{activeTab === 'acoes' && (")
print('start index', start)
print(text[start-20:start+40].replace('\n', '\\n'))
