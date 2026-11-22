import fs from 'node:fs';
const r = JSON.parse(fs.readFileSync(process.argv[2]));
console.log(Object.entries(r).map(([n, o]) => n.padEnd(12) + String(o.pal.length).padStart(3) + '  ' + o.pal.map(c => (c.flags ? c.flags[0].toUpperCase() : '') ).join('')).join('\n'));
