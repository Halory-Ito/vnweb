const fs = require('fs');
const path = require('path');

const p = path.join('coverage', 'coverage-final.json');
const j = JSON.parse(fs.readFileSync(p, 'utf8'));

const agg = {};
const pct = (c, t) => (t ? (c / t) * 100 : 100);

for (const [file, data] of Object.entries(j)) {
  const rel = file.replace(/\\/g, '/').replace(/^.*?\/vnweb\//, '');
  const dir = rel.split('/').slice(0, -1).join('/') || '.';

  const stTot = Object.keys(data.statementMap || {}).length;
  const stCov = Object.values(data.s || {}).filter((v) => v > 0).length;

  const fnTot = Object.keys(data.fnMap || {}).length;
  const fnCov = Object.values(data.f || {}).filter((v) => v > 0).length;

  let brTot = 0;
  let brCov = 0;
  for (const arr of Object.values(data.b || {})) {
    if (Array.isArray(arr)) {
      brTot += arr.length;
      brCov += arr.filter((v) => v > 0).length;
    }
  }

  const lnTot = stTot;
  const lnCov = stCov;

  if (!agg[dir]) {
    agg[dir] = {
      stCov: 0,
      stTot: 0,
      fnCov: 0,
      fnTot: 0,
      brCov: 0,
      brTot: 0,
      lnCov: 0,
      lnTot: 0,
      files: 0,
    };
  }

  agg[dir].stCov += stCov;
  agg[dir].stTot += stTot;
  agg[dir].fnCov += fnCov;
  agg[dir].fnTot += fnTot;
  agg[dir].brCov += brCov;
  agg[dir].brTot += brTot;
  agg[dir].lnCov += lnCov;
  agg[dir].lnTot += lnTot;
  agg[dir].files += 1;
}

const rows = Object.entries(agg)
  .map(([dir, m]) => ({
    dir,
    stm: pct(m.stCov, m.stTot),
    br: pct(m.brCov, m.brTot),
    fn: pct(m.fnCov, m.fnTot),
    ln: pct(m.lnCov, m.lnTot),
    files: m.files,
  }))
  .sort((a, b) => a.dir.localeCompare(b.dir));

console.log('DIR\tstm\tbr\tfn\tln\tfiles');
for (const r of rows) {
  if (r.stm < 80 || r.br < 80 || r.fn < 80 || r.ln < 80) {
    console.log(`${r.dir}\t${r.stm.toFixed(2)}\t${r.br.toFixed(2)}\t${r.fn.toFixed(2)}\t${r.ln.toFixed(2)}\t${r.files}`);
  }
}
console.log(`\nTOTAL_DIRS\t${rows.length}`);
