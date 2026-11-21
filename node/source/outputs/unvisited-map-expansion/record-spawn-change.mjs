import fs from 'node:fs';
const path='docs/changelog/entries.json',entryPath='outputs/unvisited-map-expansion/spawn-changelog-entry.json';
const register=JSON.parse(fs.readFileSync(path,'utf8')),entry=JSON.parse(fs.readFileSync(entryPath,'utf8'));
if(register.entries.some(row=>row.title===entry.title))throw Error('Change already recorded');
entry.id=`NODE-${String(Math.max(...register.entries.map(row=>Number(row.id.slice(5))))+1).padStart(4,'0')}`;
register.entries.push(entry);fs.writeFileSync(path,JSON.stringify(register,null,2)+'\n');
fs.writeFileSync(entryPath,JSON.stringify(entry,null,2)+'\n');console.log(entry.id);
