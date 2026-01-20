from pathlib import Path
path = Path('frontend/src/pages/ConfiguracaoAjustes.tsx')
text = path.read_text()
old = "        </div>\n\n      {activeTab === 'acoes' && ("
new = "        </div>\n      )}\n\n      {activeTab === 'acoes' && ("
if old not in text:
    raise SystemExit('pattern not found for insertion')
path.write_text(text.replace(old, new, 1))
