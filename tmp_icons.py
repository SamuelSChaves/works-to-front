import re
from pathlib import Path
icons = set()
for path in Path('teste').glob('*.jsx'):
    text = path.read_text(encoding='utf-8')
    for match in re.finditer(r"from\s+['\"]lucide-react['\"]", text):
        pass
    for line in text.splitlines():
        if "from \"lucide-react\"" in line or "from 'lucide-react'" in line:
            m = re.search(r"import\s+\{([^}]+)\}\s+from", line)
            if m:
                parts = m.group(1)
                for name in parts.split(','):
                    icons.add(name.strip())
print('\n'.join(sorted(i for i in icons if i)))
