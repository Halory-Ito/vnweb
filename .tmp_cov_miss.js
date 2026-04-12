const fs=require('fs');const path=require('path');
const j=JSON.parse(fs.readFileSync('coverage/coverage-final.json','utf8'));
const agg={};
for(const [file,d] of Object.entries(j)){
 const rel=file.replace(/\\/g,'/').replace(/^.*?\/vnweb\//,'');
 const dir=rel.split('/').slice(0,-1).join('/')||'.';
 const stTot=Object.keys(d.statementMap||{}).length;
 const stCov=Object.values(d.s||{}).filter(v=>v>0).length;
 if(!agg[dir])agg[dir]={tot:0,cov:0};
 agg[dir].tot+=stTot; agg[dir].cov+=stCov;
}
const rows=Object.entries(agg).map(([dir,m])=>({dir,tot:m.tot,cov:m.cov,miss:m.tot-m.cov,pct:m.tot?100*m.cov/m.tot:100})).sort((a,b)=>b.miss-a.miss);
console.log('dir\tpct\tmiss/tot');
for(const r of rows.slice(0,30)){console.log(`${r.dir}\t${r.pct.toFixed(2)}\t${r.miss}/${r.tot}`)}
