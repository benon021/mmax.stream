const fs = require('fs');
const path = require('path');
const cssDir = path.join(__dirname, '..', 'src', 'css');
const files = fs.readdirSync(cssDir).filter((f) => f.endsWith('.css'));
let hadError = false;

for (const file of files) {
  const content = fs.readFileSync(path.join(cssDir, file), 'utf8');
  let depth = 0;
  const lines = content.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth < 0) {
          console.log(`${file}:${i + 1} extra }`);
          hadError = true;
          depth = 0;
        }
      }
    }
  }
  if (depth !== 0) {
    console.log(`${file}: unbalanced braces (depth ${depth})`);
    hadError = true;
  }
}

if (!hadError) console.log('All CSS files balanced');
