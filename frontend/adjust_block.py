from pathlib import Path
path = Path('frontend/src/pages/ConfiguracaoAjustes.tsx')
text = path.read_text()
start_marker_line = "            {activeTab === 'acoes' && ("
end_marker_line = "      {activeTab === 'cadastro-ativo' && ("
if start_marker_line not in text or end_marker_line not in text:
    raise SystemExit('markers not found')
start_idx = text.index(start_marker_line)
end_idx = text.index(end_marker_line)
new_block = text[start_idx:end_idx]
needle = "\n                  )}\n\n              </div>\n\n          )}\n"
replacement = "\n                  )}\n\n              </div>\n\n            )}\n"
if needle not in new_block:
    raise SystemExit('needle not found in block')
new_block = new_block.replace(needle, replacement, 1)
new_text = text[:start_idx] + new_block + text[end_idx:]
path.write_text(new_text)
