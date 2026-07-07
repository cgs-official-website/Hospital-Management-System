import glob
import re

files = glob.glob('src/**/*.jsx', recursive=True)
fixed = 0

pattern = re.compile(
    r'(<div className="flex-1 overflow-auto custom-scrollbar border border-slate-200 rounded-2xl bg-white/50">)([\s\S]*?)(return\s*\(\s*<>\s*)(<table[\s\S]*?</table>)([\s\S]*?)(<div className="[^"]*p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between bg-slate-50/80 sticky bottom-0 z-10 gap-4[^"]*")([\s\S]*?)(</>\s*\);\s*\}\)\(\)\}\s*</div>)'
)

for file in files:
    with open(file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    def repl(m):
        res = '<div className="flex-1 flex flex-col border border-slate-200 rounded-2xl bg-white/50 overflow-hidden">' + m.group(2) + m.group(3)
        res += '\n                <div className="flex-1 overflow-auto custom-scrollbar">\n                  ' + m.group(4).strip() + '\n                </div>' + m.group(5)
        new_pag = m.group(6).replace('sticky bottom-0 z-10', 'shrink-0')
        res += new_pag + m.group(7) + m.group(8)
        return res

    new_content = pattern.sub(repl, content)
    
    if new_content != content:
        with open(file, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print('Fixed', file)
        fixed += 1

print('Total fixed:', fixed)
