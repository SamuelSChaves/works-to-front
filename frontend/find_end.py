from pathlib import Path
text = Path('frontend/src/pages/ConfiguracaoAjustes.tsx').read_text()
end = text.find("{activeTab === 'cadastro-ativo' && (")
print('end index', end)
print(text[end-20:end+40].replace('\n', '\\n'))
