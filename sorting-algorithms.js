// NAV
const navBtns=document.querySelectorAll('.nav-btn'), sections=document.querySelectorAll('.algo-section');
function show(t){sections.forEach(s=>s.classList.remove('visible'));navBtns.forEach(b=>b.classList.remove('active'));const s=document.getElementById('sec-'+t);if(s)s.classList.add('visible');navBtns.forEach(b=>{if(b.dataset.target===t)b.classList.add('active')});window.scrollTo({top:0,behavior:'smooth'})}
navBtns.forEach(b=>b.addEventListener('click',()=>show(b.dataset.target)));
document.querySelectorAll('.overview-card').forEach(c=>c.addEventListener('click',()=>show(c.dataset.algo)));

// BOGO UNLOCK (easter egg)
function setBogoUnlocked(unlocked){
  const els=[
    document.getElementById('card-bogo'),
    document.getElementById('row-overview-bogo'),
    document.getElementById('row-compare-bogo')
  ].filter(Boolean);
  els.forEach(el=>el.classList.toggle('is-hidden',!unlocked));
  // Always keep Bogo hidden from the navbar (footer link is the entry point).
  const navBogo=document.getElementById('nav-bogo');
  if(navBogo)navBogo.classList.add('is-hidden');
}
function isBogoUnlocked(){try{return localStorage.getItem('bogoUnlocked')==='1'}catch{return false}}
function unlockBogo(){
  try{localStorage.setItem('bogoUnlocked','1')}catch{}
  setBogoUnlocked(true);
  show('bogo');
}

// DEMO
const D={},N=15;
// Make counting sort visually straightforward (small n + small integer range).
const COUNTING_N=15, COUNTING_MIN=1, COUNTING_MAX=9;
// Make radix sort readable as boxed numbers.
const RADIX_N=15;
// Keep bogo safe: small n + hard attempt cap.
const BOGO_N=12, BOGO_MAX_ATTEMPTS=1500;
function gen(n){const a=[];for(let i=0;i<n;i++)a.push(Math.floor(Math.random()*180)+20);return a}
function genCounting(n){const a=[];for(let i=0;i<n;i++)a.push(Math.floor(Math.random()*(COUNTING_MAX-COUNTING_MIN+1))+COUNTING_MIN);return a}
function genRadix(n){
  const a=[];
  for(let i=0;i<n;i++){
    // Generate diverse numbers: mix of 2-digit (20-99) and 3-digit (100-999) numbers
    // Ensure good distribution across hundreds digits (1-9)
    if(Math.random()<0.4){
      // 40% chance: 2-digit numbers (20-99)
      a.push(Math.floor(Math.random()*80)+20);
    }else{
      // 60% chance: 3-digit numbers (100-999) with diverse hundreds digits
      const hundreds=Math.floor(Math.random()*9)+1; // 1-9
      const remainder=Math.floor(Math.random()*100); // 0-99
      a.push(hundreds*100+remainder);
    }
  }
  return a;
}
function inv(a){let c=0;for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++)if(a[i]>a[j])c++;return c}
function $(id){return document.getElementById(id)}
function setT(id,v){
  const e=$(id);
  if(!e)return;
  if(e instanceof HTMLInputElement) e.value=String(v);
  else e.textContent=v;
}
function getCustomN(nm,def){
  const el=$('n-'+nm);
  if(!(el instanceof HTMLInputElement)) return def;
  const raw=parseInt(el.value,10);
  if(!Number.isFinite(raw)) return def;
  const min=el.min!==''?parseInt(el.min,10):undefined;
  const max=el.max!==''?parseInt(el.max,10):undefined;
  let v=raw;
  if(Number.isFinite(min)) v=Math.max(min,v);
  if(Number.isFinite(max)) v=Math.min(max,v);
  if(v!==raw) el.value=String(v);
  return v;
}
function sizeFor(nm){
  if(nm==='bogo')return BOGO_N;
  if(nm==='heap')return getCustomN('heap',15);
  if(nm==='counting')return getCustomN('counting',COUNTING_N);
  if(nm==='radix')return getCustomN('radix',RADIX_N);
  if(nm==='bucket')return getCustomN('bucket',N);
  return getCustomN(nm,N);
}

const conceptDefaults={
  insertion:'Press Run to watch insertion sort build the sorted prefix one key at a time.',
  selection:'Press Run to watch selection sort grow the sorted prefix by repeatedly selecting the minimum.',
  bubble:'Press Run to watch each pass bubble the largest remaining element to the end.',
  merge:'Press Run to watch merge sort recursively split the array and then merge sorted subarrays.',
  quick:'Press Run to watch quicksort choose pivots, partition the array, and recurse on subarrays.',
  heap:'Press Run to see the array and its heap side by side. Yellow = comparing, red = swapping, green = already in sorted position.',
  counting:'Press Run to watch counting sort build a count array, compute prefix sums, and place elements into their final positions.',
  radix:'Press Run to watch radix sort distribute elements into digit buckets for each pass.',
  bucket:'Press Run to watch bucket sort scatter elements into buckets, sort within each bucket, and then gather them back.',
  bogo:'Press Run to watch bogo sort shuffle-and-hope (with a safety cap).'
};

function setConcept(algo,text){const el=$('concept-'+algo);if(el)el.textContent=text}

function clearAuxPanels(nm){
  if(nm==='merge'){const e=$('merge-subarrays');if(e)e.innerHTML='';}
  if(nm==='bucket'){const e=$('bucket-board');if(e)e.textContent='Buckets and their elements will appear here during the run.'}
  if(nm==='counting'){
    const c=$('counting-count'),p=$('counting-pos');
    if(c)c.textContent='Counts will appear here during the run.';
    if(p)p.textContent='Positions (prefix sums) will appear here during the run.';
  }
  if(nm==='radix'){
    ensureRadixBuckets();
    for(let d=0;d<10;d++){const b=$('radix-bucket-'+d);if(b)b.innerHTML=''}
  }
}

function setMergeLegend(leftCls,rightCls){
  const L=$('legend-merge-left'),R=$('legend-merge-right');
  if(L){
    L.className='swatch';
    L.style.background=leftCls||'';
  }
  if(R){
    R.className='swatch';
    R.style.background=rightCls||'';
  }
}

function renderMergePanel(left,right,merged,highlight){
  const e=$('merge-subarrays');if(!e)return;
  e.innerHTML='';
  const wrap=arr=>Array.isArray(arr)?arr:[];
  const leftArr=wrap(left),rightArr=wrap(right),mergedArr=merged!=null?wrap(merged):null;
  const allVals=[...leftArr,...rightArr,...(mergedArr||[])];
  const scaleMax=allVals.length?Math.max(...allVals,1):1;
  function addRow(label,values,bgColor,compareIdx){
    const row=document.createElement('div');row.className='merge-subarray-row';
    const lbl=document.createElement('span');lbl.className='merge-row-label';lbl.textContent=label;row.appendChild(lbl);
    const barCont=document.createElement('div');barCont.className='merge-row-bars';
    values.forEach((v,idx)=>{
      const b=document.createElement('div');b.className='bar';
      b.style.height=(v/scaleMax*100)+'%';if(bgColor)b.style.background=bgColor;
      if(compareIdx===idx)b.classList.add('comparing');
      barCont.appendChild(b);
    });
    row.appendChild(barCont);e.appendChild(row);
  }
  addRow('Left:',leftArr,'var(--merge-left)',highlight&&typeof highlight.leftIdx==='number'?highlight.leftIdx:-1);
  addRow('Right:',rightArr,'var(--merge-right)',highlight&&typeof highlight.rightIdx==='number'?highlight.rightIdx:-1);
  if(mergedArr!==null)addRow('Merged:',mergedArr,'var(--merge-run-sorted)',-1);
}

function renderBucketLegend(k){
  const legend=$('legend-bucket');if(!legend)return;
  legend.innerHTML='';
  const allBucketColors=['bucket0','bucket1','bucket2','bucket3','bucket4','bucket5','bucket6','bucket7','bucket8','bucket9'];
  const item1=document.createElement('span');item1.className='legend-item';
  const sw1=document.createElement('span');sw1.className='swatch unsorted';
  item1.appendChild(sw1);item1.appendChild(document.createTextNode('Unassigned'));
  legend.appendChild(item1);
  for(let i=0;i<k;i++){
    const item=document.createElement('span');item.className='legend-item';
    const sw=document.createElement('span');sw.className='swatch '+allBucketColors[i%allBucketColors.length];
    item.appendChild(sw);
    const label='Bucket '+String.fromCharCode(65+(i%26));
    item.appendChild(document.createTextNode(label));
    legend.appendChild(item);
  }
  const item2=document.createElement('span');item2.className='legend-item';
  const sw2=document.createElement('span');sw2.className='swatch swapping';
  item2.appendChild(sw2);item2.appendChild(document.createTextNode('Writing'));
  legend.appendChild(item2);
  const item3=document.createElement('span');item3.className='legend-item';
  const sw3=document.createElement('span');sw3.className='swatch sorted';
  item3.appendChild(sw3);item3.appendChild(document.createTextNode('Gathered (sorted)'));
  legend.appendChild(item3);
}

function renderBucketBoard(labelPrefix,buckets,ranges,colors,highlight){
  const board=$('bucket-board')||$('digit-buckets');if(!board)return;
  board.innerHTML='';
  const k=buckets.length;
  for(let i=0;i<k;i++){
    const col=document.createElement('div');
    let colCls='bucket-col';
    if(colors&&colors.length)colCls+=' '+colors[i%colors.length];
    col.className=colCls;
    const title=document.createElement('div');title.className='bucket-col-title';
    const baseLabel=labelPrefix?labelPrefix+' '+String.fromCharCode(65+(i%26)):String(i);
    if(ranges&&ranges[i]){
      const r=ranges[i];
      title.textContent=baseLabel+' ('+r.low+'–'+r.high+')';
    }else{
      title.textContent=baseLabel;
    }
    const items=document.createElement('div');items.className='bucket-items';
    buckets[i].forEach((v,idx)=>{
      const chip=document.createElement('div');
      chip.className='bucket-chip';
      chip.textContent=String(v);
      if(highlight&&highlight.sortedBuckets&&highlight.sortedBuckets.has(i)){
        chip.classList.add('sorted');
      }else if(highlight&&highlight.bucketIdx===i){
        if(highlight.sorted&&highlight.sorted.has(idx))chip.classList.add('sorted');
        else if(highlight.swapping&&highlight.swapping.has(idx))chip.classList.add('swapping');
        else if(highlight.comparing&&highlight.comparing.has(idx))chip.classList.add('comparing');
      }
      items.appendChild(chip);
    });
    col.appendChild(title);col.appendChild(items);board.appendChild(col);
  }
}

function renderCountRow(targetId,mn,mx,arr,activeIdx){
  const wrap=$(targetId);if(!wrap)return;wrap.innerHTML='';
  for(let v=mn;v<=mx;v++){
    const idx=v-mn,cell=document.createElement('div');cell.className='count-cell'+(idx===activeIdx?' active':'');
    const kEl=document.createElement('span');kEl.className='count-cell-key';kEl.textContent=String(v);
    const vEl=document.createElement('span');vEl.className='count-cell-val';vEl.textContent=String(arr? (arr[idx]??0) : 0);
    cell.appendChild(kEl);cell.appendChild(vEl);wrap.appendChild(cell);
  }
}
function renderCountingAux(mn,mx,counts,positions,activeIdx){
  renderCountRow('counting-count',mn,mx,counts,activeIdx);
  renderCountRow('counting-pos',mn,mx,positions,activeIdx);
}

function getCase(nm){
  const el=$('case-'+nm);
  return el ? el.value : 'avg';
}

function updatePauseBtn(nm){
  const b=$('pause-'+nm);
  if(!b)return;
  const s=D[nm];
  if(!s||!s.running){b.textContent='Pause';return;}
  b.textContent = s.paused ? 'Resume' : 'Pause';
}

function togglePause(nm){
  const s=D[nm];
  if(!s||!s.running)return;
  s.paused=!s.paused;
  updatePauseBtn(nm);
  if(s.paused) setConcept(nm,'Paused. Click Resume to continue.');
}

function makeCaseArray(nm,cs){
  const size=sizeFor(nm);
  const base=gen(size);
  if(nm==='counting')return genCounting(size);
  if(nm==='radix')return genRadix(size);
  if(nm==='insertion' || nm==='bubble'){
    if(cs==='best')return [...base].sort((a,b)=>a-b);
    if(cs==='worst')return [...base].sort((a,b)=>b-a);
    return base;
  }
  if(nm==='quick'){
    if(cs==='best' || cs==='worst')return [...base].sort((a,b)=>a-b);
    return base;
  }
  if(nm==='bucket'){
    if(cs==='best'){
      const min=20,max=199,out=[];
      for(let i=0;i<size;i++){
        const t=size===1?0:i/(size-1);
        out.push(Math.round(min + (max-min)*t));
      }
      return out;
    }
    if(cs==='worst'){
      // Force everything into the last bucket by keeping values in [171..199] with max=199 (mx=200).
      const out=[];
      for(let i=0;i<size;i++){
        const t=size===1?0:i/(size-1);
        out.push(Math.round(199 - 28*t));
      }
      return out;
    }
    return base;
  }
  return base;
}

function initD(nm){
  D[nm]={arr:makeCaseArray(nm,getCase(nm)),running:false,cancel:false,paused:false};
  updatePauseBtn(nm);
  if(nm==='radix')renderRadixBoard();
  else render(nm);
  setT('n-'+nm,D[nm].arr.length);
  if(nm==='insertion')setT('x1-insertion',inv(D[nm].arr));
  if(nm==='counting'){const a=D[nm].arr;setT('x1-counting',Math.max(...a)-Math.min(...a)+1)}
  if(nm==='radix'){setT('x1-radix',Math.max(...D[nm].arr).toString().length);setT('x2-radix','–')}
  if(nm==='bucket'){
    const k=Math.ceil(Math.sqrt(D[nm].arr.length));
    setT('x1-bucket',k);
    setT('x2-bucket','–');
    renderBucketLegend(k);
  }
  if(nm==='bogo'){setT('x1-bogo',BOGO_MAX_ATTEMPTS)}
  if(conceptDefaults[nm])setConcept(nm,conceptDefaults[nm]);
  clearAuxPanels(nm);
  if(nm==='merge'){setMergeActive(null);setMergeLegend('#6366f1','#0891b2');}
}

let mergeActiveRange=null;
function setMergeActive(rangeOrNull,r2){
  if(rangeOrNull&&typeof rangeOrNull==='object'&&typeof rangeOrNull.l==='number'&&typeof rangeOrNull.r==='number')mergeActiveRange={l:rangeOrNull.l,r:rangeOrNull.r};
  else if(typeof rangeOrNull==='number'&&typeof r2==='number')mergeActiveRange={l:rangeOrNull,r:r2};
  else mergeActiveRange=null;
}

function render(nm,hl={}){
  if(nm==='heap'){
    renderHeapView(nm,hl);
    return;
  }
  const c=$('bars-'+nm);if(!c)return;
  const arr=D[nm].arr,mx=Math.max(...arr);c.innerHTML='';

  // Decide whether to show numeric labels based on n and device size.
  let isMobile=false;
  try{
    if(window.matchMedia&&window.matchMedia('(max-width: 640px)').matches)isMobile=true;
    else if(window.innerWidth&&window.innerWidth<=640)isMobile=true;
  }catch{}
  const cutoff=isMobile?10:30;
  const showLabels=arr.length<=cutoff;

  arr.forEach((v,i)=>{
    const b=document.createElement('div');b.className='bar';
    b.style.height=(v/mx*100)+'%';
    if(showLabels){
      const lbl=document.createElement('span');
      lbl.className='bar-label';
      lbl.textContent=String(v);
      b.appendChild(lbl);
    }
    if(nm==='merge'&&mergeActiveRange&&i>=mergeActiveRange.l&&i<=mergeActiveRange.r)b.classList.add('down');
    if(hl.bg){
      const col=Array.isArray(hl.bg)?hl.bg[i]:hl.bg[i];
      if(col)b.style.background=col; else b.style.background='';
    }else{
      b.style.background='';
    }
    if(hl.sorted&&hl.sorted.has(i))b.classList.add('sorted');
    else if(hl.pivot===i)b.classList.add('pivot');
    else if(hl.sw&&hl.sw.has(i))b.classList.add('swapping');
    else if(hl.cmp&&hl.cmp.has(i))b.classList.add('comparing');
    else if(hl.bc&&hl.bc[i])b.classList.add(hl.bc[i]);
    c.appendChild(b);
  });
}

function renderHeapView(nm,hl){
  const arr=D[nm]?.arr;if(!arr)return;
  const n=arr.length;
  const sorted=hl.sorted||new Set();
  const heapSize=n-sorted.size;

  const arrayEl=$('heap-array'),treeEl=$('heap-tree');
  if(!arrayEl||!treeEl)return;
  arrayEl.innerHTML='';
  treeEl.innerHTML='';
  function cellClass(i){
    if(hl.sorted&&hl.sorted.has(i))return 'sorted';
    if(hl.sw&&hl.sw.has(i))return 'swapping';
    if(hl.cmp&&hl.cmp.has(i))return 'comparing';
    return '';
  }
  // Array: single row of rectangles
  for(let i=0;i<n;i++){
    const cell=document.createElement('div');
    cell.className='heap-array-cell'+ (cellClass(i)?' '+cellClass(i):'');
    cell.dataset.idx=String(i);
    const idxSpan=document.createElement('span');idxSpan.className='heap-cell-idx';idxSpan.textContent=String(i);
    const valSpan=document.createElement('span');valSpan.className='heap-cell-val';valSpan.textContent=String(arr[i]);
    cell.appendChild(idxSpan);cell.appendChild(valSpan);
    arrayEl.appendChild(cell);
  }
  // Tree: SVG with circles and connecting lines (only heap region 0..heapSize-1)
  if(heapSize<=0)return;
  const levels=Math.max(1,Math.ceil(Math.log2(heapSize+1)));
  const levelHeight=48;
  const radius=18;
  const pad=radius+8;
  const treeW=800;
  const treeH=levels*levelHeight+2*pad;
  const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox','0 0 '+treeW+' '+treeH);
  svg.setAttribute('preserveAspectRatio','xMidYMid meet');
  function nodePos(i){
    const L=Math.floor(Math.log2(i+1));
    const posInLevel=i-((1<<L)-1);
    const nodesInLevel=1<<L;
    const x=(posInLevel+0.5)*(treeW/nodesInLevel);
    const y=pad+(L+0.5)*levelHeight;
    return{x,y};
  }
  const edges=document.createElementNS('http://www.w3.org/2000/svg','g');
  edges.setAttribute('class','heap-edges');
  for(let i=0;i<heapSize;i++){
    const left=2*i+1,right=2*i+2;
    const p=nodePos(i);
    if(left<heapSize){
      const c=nodePos(left);
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('class','heap-edge');
      line.setAttribute('x1',p.x);line.setAttribute('y1',p.y);
      line.setAttribute('x2',c.x);line.setAttribute('y2',c.y);
      edges.appendChild(line);
    }
    if(right<heapSize){
      const c=nodePos(right);
      const line=document.createElementNS('http://www.w3.org/2000/svg','line');
      line.setAttribute('class','heap-edge');
      line.setAttribute('x1',p.x);line.setAttribute('y1',p.y);
      line.setAttribute('x2',c.x);line.setAttribute('y2',c.y);
      edges.appendChild(line);
    }
  }
  svg.appendChild(edges);
  const nodes=document.createElementNS('http://www.w3.org/2000/svg','g');
  nodes.setAttribute('class','heap-nodes');
  for(let i=0;i<heapSize;i++){
    const cls=cellClass(i);
    const{x,y}=nodePos(i);
    const circle=document.createElementNS('http://www.w3.org/2000/svg','circle');
    circle.setAttribute('class','heap-node-circle'+(cls?' '+cls:''));
    circle.setAttribute('cx',x);circle.setAttribute('cy',y);circle.setAttribute('r',radius);
    nodes.appendChild(circle);
    const text=document.createElementNS('http://www.w3.org/2000/svg','text');
    text.setAttribute('class','heap-node-text');
    text.setAttribute('x',x);text.setAttribute('y',y);
    text.textContent=String(arr[i]);
    nodes.appendChild(text);
  }
  svg.appendChild(nodes);
  treeEl.appendChild(svg);
}

function ensureRadixBuckets(){
  const bucketsEl=$('radix-buckets');if(!bucketsEl)return null;
  if(bucketsEl.dataset.ready==='1')return bucketsEl;
  bucketsEl.innerHTML='';
  for(let d=0;d<10;d++){
    const row=document.createElement('div');row.className='radix-bucket-row';row.dataset.digit=String(d);
    const lab=document.createElement('div');lab.className='radix-bucket-label';lab.textContent=String(d);
    const items=document.createElement('div');items.className='radix-bucket-items';items.id='radix-bucket-'+d;
    row.appendChild(lab);row.appendChild(items);bucketsEl.appendChild(row);
  }
  bucketsEl.dataset.ready='1';
  return bucketsEl;
}
function padRadixNumber(v){
  // Pad numbers less than 100 with leading zeros (e.g., 43 -> 043)
  return v<100?String(v).padStart(3,'0'):String(v);
}
function radixItemEl(v){
  const el=document.createElement('div');
  el.className='radix-item';
  el.textContent=padRadixNumber(v);
  el.dataset.value=String(v);
  return el;
}
function renderRadixBoard(){
  const arrayEl=$('radix-array');if(!arrayEl)return;
  ensureRadixBuckets();
  // Fill array from current state.
  const arr=D.radix?.arr||[];
  arrayEl.innerHTML='';
  for(const v of arr)arrayEl.appendChild(radixItemEl(v));
  // Clear buckets.
  for(let d=0;d<10;d++){const b=$('radix-bucket-'+d);if(b)b.innerHTML=''}
}
function radixAnimMs(nm){
  // delay(nm) is 3..950ms. Use a slightly snappier transform duration.
  return Math.min(420,Math.max(90,Math.round(delay(nm)*0.75)));
}
async function moveElAnimated(nm,el,newParent,ms){
  const first=el.getBoundingClientRect();
  newParent.appendChild(el);
  const last=el.getBoundingClientRect();
  const dx=first.left-last.left,dy=first.top-last.top;
  el.style.transition='transform 0s';
  el.style.transform=`translate(${dx}px,${dy}px)`;
  el.getBoundingClientRect(); // reflow
  el.style.transition=`transform ${ms}ms cubic-bezier(0.2, 0.85, 0.2, 1)`;
  el.style.transform='translate(0,0)';
  // Use the same pause-aware sleep helper as the other demos so that
  // radix movements actually respect the Pause/Resume state.
  await sleepControlled(nm,ms);
  el.style.transition='';
  el.style.transform='';
}

function delay(nm){
  const s=$('speed-'+nm);
  const v=Math.min(100,Math.max(1,s?parseInt(s.value):50)); // 1..100
  const t=(100-v)/99; // 0 (fast) -> 1 (slow)
  const minMs=3;
  const maxMs=950; // make slowest noticeably slower
  return Math.round(minMs + (t*t)*(maxMs-minMs));
}
function slp(ms){return new Promise(r=>setTimeout(r,ms))}

async function sleepControlled(nm,ms){
  let remaining=Math.max(0,ms|0);
  while(remaining>0){
    const s=D[nm];
    if(!s||s.cancel) return;
    while(s.paused && !s.cancel) await slp(60);
    const chunk=Math.min(30,remaining);
    await slp(chunk);
    remaining-=chunk;
  }
}

function reset(nm){
  if(D[nm])D[nm].cancel=true;
  D[nm]={arr:makeCaseArray(nm,getCase(nm)),running:false,cancel:false,paused:false};
  updatePauseBtn(nm);
  ['comps-','swaps-','x1-','x2-'].forEach(p=>{const e=$(p+nm);if(e)e.textContent='0'});
  setT('n-'+nm,D[nm].arr.length);
  if(nm==='insertion'){setT('x1-insertion',inv(D[nm].arr));setT('swaps-insertion','0')}
  if(nm==='bubble')setT('x1-bubble','0');
  if(nm==='counting'){const a=D[nm].arr;setT('x1-counting',Math.max(...a)-Math.min(...a)+1)}
  if(nm==='radix'){setT('x1-radix',Math.max(...D[nm].arr).toString().length);setT('x2-radix','–')}
  if(nm==='bucket'){
    const k=Math.ceil(Math.sqrt(D[nm].arr.length));
    setT('x1-bucket',k);
    setT('x2-bucket','–');
    renderBucketLegend(k);
  }
  if(nm==='bogo'){setT('x1-bogo',BOGO_MAX_ATTEMPTS)}
  if(nm==='radix')renderRadixBoard();
  else render(nm);
  if(conceptDefaults[nm])setConcept(nm,conceptDefaults[nm]);
  clearAuxPanels(nm);
  if(nm==='merge'){setMergeActive(null);setMergeLegend('#6366f1','#0891b2');}
}

async function go(nm){
  if(D[nm]&&D[nm].running){D[nm].cancel=true;return}
  reset(nm);const S=D[nm];S.running=true;S.cancel=false;S.paused=false;updatePauseBtn(nm);
  const arr=S.arr,n=arr.length,X=()=>S.cancel;
  let comps=0,swaps=0;

  if(nm==='insertion'){
    for(let i=1;i<n&&!X();i++){
      setConcept('insertion','Inserting key at index '+i+' into sorted prefix [0..'+(i-1)+'].');
      let key=arr[i],j=i-1;
      render(nm,{cmp:new Set([i])});await sleepControlled(nm,delay(nm));
      while(j>=0&&!X()){
        setConcept('insertion','Comparing key ('+key+') with A['+j+']; shifting right if larger.');
        comps++;render(nm,{cmp:new Set([j,j+1])});setT('comps-insertion',comps);await sleepControlled(nm,delay(nm));
        if(arr[j]>key){arr[j+1]=arr[j];swaps++;j--;setT('swaps-insertion',swaps);render(nm,{sw:new Set([j+1,j+2])});await sleepControlled(nm,delay(nm))}
        else break;
      }
      arr[j+1]=key;
      setConcept('insertion','Key placed at position '+(j+1)+'. Sorted prefix is now [0..'+i+'].');
    }
  }
  else if(nm==='selection'){
    for(let i=0;i<n-1&&!X();i++){
      setConcept('selection','Selecting the minimum from unsorted region ['+i+'..'+(n-1)+'].');
      let mi=i;const sd=new Set(Array.from({length:i},(_,k)=>k));
      for(let j=i+1;j<n&&!X();j++){comps++;render(nm,{cmp:new Set([mi,j]),sorted:sd});setT('comps-selection',comps);await sleepControlled(nm,delay(nm));if(arr[j]<arr[mi]){mi=j;setConcept('selection','New minimum candidate at index '+mi+'.')}}
      if(mi!==i&&!X()){[arr[i],arr[mi]]=[arr[mi],arr[i]];swaps++;setT('swaps-selection',swaps);render(nm,{sw:new Set([i,mi]),sorted:sd});await sleepControlled(nm,delay(nm));setConcept('selection','Placed minimum at index '+i+'; sorted prefix is now [0..'+i+'].');}
    }
  }
  else if(nm==='bubble'){
    let passes=0;
    for(let i=0;i<n-1&&!X();i++){
      setConcept('bubble','Pass #'+(i+1)+': bubbling the largest remaining element toward position '+(n-1-i)+'.');
      let sw2=false;const sd=new Set(Array.from({length:i},(_,k)=>n-1-k));
      for(let j=0;j<n-i-1&&!X();j++){
        setConcept('bubble','Comparing neighbors A['+j+'] and A['+(j+1)+']; swapping if out of order.');
        comps++;render(nm,{cmp:new Set([j,j+1]),sorted:sd});setT('comps-bubble',comps);await sleepControlled(nm,delay(nm));
        if(arr[j]>arr[j+1]){[arr[j],arr[j+1]]=[arr[j+1],arr[j]];swaps++;sw2=true;setT('swaps-bubble',swaps);render(nm,{sw:new Set([j,j+1]),sorted:sd});await sleepControlled(nm,delay(nm))}
      }
      passes++;setT('x1-bubble',passes);if(!sw2)break;
    }
    if(!X())setConcept('bubble','No swaps in last pass → array is sorted; early stop.');
  }
  else if(nm==='merge'){
    let maxD=0;
    const MERGE_LEFT='var(--merge-left)';
    const MERGE_RIGHT='var(--merge-right)';
    const MERGE_RUN_SORTED='var(--merge-run-sorted)';
    setMergeLegend(MERGE_LEFT,MERGE_RIGHT);

    const runSorted=new Array(n).fill(false);
    const msBg=new Array(n).fill('');
    function msBuildBg(focus){
      for(let i=0;i<n;i++)msBg[i]=runSorted[i]?MERGE_RUN_SORTED:'';
      if(focus){
        for(let i=focus.l;i<=focus.m;i++)msBg[i]=MERGE_LEFT;
        for(let i=focus.m+1;i<=focus.r;i++)msBg[i]=MERGE_RIGHT;
      }
    }
    async function ms(l,r,d){
      if(d>maxD){maxD=d;setT('x1-merge',maxD)}
      if(X())return;
      if(l>=r){runSorted[l]=true;return;}
      const m=(l+r)>>1;

      if(r-l>=2){
        setMergeActive(l,r);
        setConcept('merge','Splitting range ['+l+'..'+r+'] into ['+l+'..'+m+'] and ['+(m+1)+'..'+r+'] at depth '+d+'.');
        msBuildBg({l,m,r});
        render('merge',{bg:msBg});
        renderMergePanel(arr.slice(l,m+1),arr.slice(m+1,r+1),null);
        await sleepControlled(nm,Math.max(12,delay(nm)));
      }

      setMergeActive(l,m);
      await ms(l,m,d+1);
      setMergeActive(m+1,r);
      await ms(m+1,r,d+1);
      const L=arr.slice(l,m+1),R=arr.slice(m+1,r+1);
      setConcept('merge','Merging two sorted halves: ['+l+'..'+m+'] and ['+(m+1)+'..'+r+'] at depth '+d+'. Building a new merged array below.');
      renderMergePanel(L,R,[]);
      setMergeActive(l,r);
      msBuildBg({l,m,r});
      render('merge',{bg:msBg});
      await sleepControlled(nm,Math.max(10,delay(nm)*0.6));

      const merged=[];
      let i=0,j=0;
      while(i<L.length&&j<R.length&&!X()){
        comps++;setT('comps-merge',comps);
        renderMergePanel(L,R,merged,{leftIdx:i,rightIdx:j});
        render('merge',{cmp:new Set([l+i,m+1+j]),bg:msBg});
        await sleepControlled(nm,delay(nm));
        if(L[i]<=R[j]){merged.push(L[i]);i++}else{merged.push(R[j]);j++}
        swaps++;setT('swaps-merge',swaps);
        renderMergePanel(L,R,merged);
        render('merge',{sw:new Set([l+merged.length-1]),bg:msBg});
        await sleepControlled(nm,delay(nm));
      }
      while(i<L.length&&!X()){
        renderMergePanel(L,R,merged,{leftIdx:i,rightIdx:-1});
        merged.push(L[i]);i++;swaps++;setT('swaps-merge',swaps);
        render('merge',{sw:new Set([l+merged.length-1]),bg:msBg});
        await sleepControlled(nm,delay(nm));
      }
      while(j<R.length&&!X()){
        renderMergePanel(L,R,merged,{leftIdx:-1,rightIdx:j});
        merged.push(R[j]);j++;swaps++;setT('swaps-merge',swaps);
        render('merge',{sw:new Set([l+merged.length-1]),bg:msBg});
        await sleepControlled(nm,delay(nm));
      }
      for(let t=0;t<merged.length;t++)arr[l+t]=merged[t];

      // This range is now a sorted run; keep it visually distinct from unsorted regions.
      for(let t=l;t<=r;t++)runSorted[t]=true;
      msBuildBg(null);
      render('merge',{bg:msBg});
      if(!X())setConcept('merge','Finished merging range ['+l+'..'+r+'] into a single sorted run.');
    }
    await ms(0,n-1,0);
    setMergeActive(null);
  }
  else if(nm==='quick'){
    let parts=0,maxD2=0;
    const fixed=new Set();
    const mode=(()=>{const c=getCase('quick');if(c==='best')return 'middle';if(c==='worst')return 'last';return 'random';})();
    async function qs(lo,hi,d){
      if(d>maxD2){maxD2=d;setT('x2-quick',maxD2)}
      if(X())return;
      if(lo===hi){
        fixed.add(lo);
        render(nm,{sorted:fixed});
        await sleepControlled(nm,Math.max(8,delay(nm)*0.6));
        return;
      }
      if(lo>hi)return;
      let ri=hi;
      if(mode==='random')ri=lo+Math.floor(Math.random()*(hi-lo+1));
      else if(mode==='middle')ri=(lo+hi)>>1;
      // mode==='last' keeps ri=hi for degenerate pivot
      [arr[ri],arr[hi]]=[arr[hi],arr[ri]];
      const pv=arr[hi];let i2=lo-1;
      if(mode==='middle')setConcept('quick','Best-case: using middle-element pivot on sorted input to keep partitions balanced. Green bars are fixed (sorted) pivots/singletons.');
      else if(mode==='last')setConcept('quick','Worst-case: using last-element pivot on sorted input (degenerate partitions). Green bars are fixed (sorted) pivots/singletons.');
      else setConcept('quick','Average-case: randomized pivots on random input. Green bars are fixed (sorted) pivots/singletons.');
      for(let j=lo;j<hi&&!X();j++){
        comps++;setT('comps-quick',comps);
        render(nm,{cmp:new Set([j]),pivot:hi,sorted:fixed});
        await sleepControlled(nm,delay(nm));
        if(arr[j]<=pv){
          i2++;
          [arr[i2],arr[j]]=[arr[j],arr[i2]];
          swaps++;setT('swaps-quick',swaps);
          render(nm,{sw:new Set([i2,j]),pivot:hi,sorted:fixed});
          await sleepControlled(nm,delay(nm));
        }
      }
      [arr[i2+1],arr[hi]]=[arr[hi],arr[i2+1]];swaps++;setT('swaps-quick',swaps);parts++;setT('x1-quick',parts);
      fixed.add(i2+1);
      render(nm,{sw:new Set([i2+1,hi]),sorted:fixed});await sleepControlled(nm,delay(nm));
      setConcept('quick','Pivot fixed at index '+(i2+1)+'; recurse on ['+lo+'..'+i2+'] and ['+(i2+2)+'..'+hi+'].');
      await qs(lo,i2,d+1);await qs(i2+2,hi,d+1);
    }
    await qs(0,n-1,0);
  }
  else if(nm==='heap'){
    let extr=0;
    const s2ForSz=function(sz){return new Set(Array.from({length:n-sz},(_,k)=>n-1-k));};
    async function sd(sz,i){
      const s2=s2ForSz(sz);
      let lg=i,l=2*i+1,r=2*i+2;
      if(l<sz){
        comps++;setT('comps-heap',comps);
        render(nm,{cmp:new Set([i,l]),sorted:s2});await sleepControlled(nm,delay(nm));
        if(arr[l]>arr[lg])lg=l;
      }
      if(r<sz){
        comps++;setT('comps-heap',comps);
        render(nm,{cmp:new Set([i,r]),sorted:s2});await sleepControlled(nm,delay(nm));
        if(arr[r]>arr[lg])lg=r;
      }
      if(lg!==i&&!X()){
        [arr[i],arr[lg]]=[arr[lg],arr[i]];swaps++;setT('swaps-heap',swaps);
        render(nm,{sw:new Set([i,lg]),sorted:s2});await sleepControlled(nm,delay(nm));
        await sd(sz,lg);
      }
    }
    for(let i=(n>>1)-1;i>=0&&!X();i--){setConcept('heap','Building max-heap: sift-down at index '+i+' (compare parent with children, swap if a child is larger).');await sd(n,i);}
    for(let i=n-1;i>0&&!X();i--){setConcept('heap','Extract max: swap root with last heap element (index '+i+'); the max is now in place. Sift-down the new root.');[arr[0],arr[i]]=[arr[i],arr[0]];swaps++;extr++;setT('swaps-heap',swaps);setT('x1-heap',extr);const s2=s2ForSz(i);render(nm,{sw:new Set([0,i]),sorted:s2});await sleepControlled(nm,delay(nm));await sd(i,0)}
  }
  else if(nm==='counting'){
    const mn=Math.min(...arr),mx=Math.max(...arr),k=mx-mn+1;setT('x1-counting',k);
    const counts=new Array(k).fill(0);let reads=0,writes=0;
    setConcept('counting','Counting step: scanning input and incrementing count[value].');
    renderCountingAux(mn,mx,counts,null,null);
    for(let i=0;i<n&&!X();i++){
      const idx=arr[i]-mn;
      counts[idx]++;reads++;setT('comps-counting',reads);
      render(nm,{cmp:new Set([i])});
      renderCountingAux(mn,mx,counts,null,idx);
      await sleepControlled(nm,delay(nm));
    }
    setConcept('counting','Prefix sum step: building positions[] (end positions) from the counts.');
    const positions=counts.slice();
    const step=Math.max(1,Math.ceil(k/40));
    for(let i=1;i<k&&!X();i++){
      positions[i]+=positions[i-1];
      if(i%step===0||i===k-1){renderCountingAux(mn,mx,counts,positions,i);await sleepControlled(nm,delay(nm));}
    }
    const out=new Array(n);
    setConcept('counting','Stable placement step: scan right-to-left; use positions[val] as the next free slot (decrement then place).');
    for(let i=n-1;i>=0&&!X();i--){
      const v=arr[i],idx=v-mn;
      positions[idx]--;
      const pos=positions[idx];
      out[pos]=v;
      writes++;setT('swaps-counting',writes);
      render(nm,{cmp:new Set([i])});
      renderCountingAux(mn,mx,counts,positions,idx);
      await sleepControlled(nm,Math.max(8,delay(nm)*0.85));
    }
    for(let i=0;i<n&&!X();i++){arr[i]=out[i];writes++;setT('swaps-counting',writes);render(nm,{sorted:new Set(Array.from({length:i+1},(_,k)=>k))});await sleepControlled(nm,delay(nm))}
  }
  else if(nm==='radix'){
    const mx=Math.max(...arr),d=mx.toString().length;setT('x1-radix',d);
    ensureRadixBuckets();
    renderRadixBoard();
    const arrayEl=$('radix-array');
    if(!arrayEl){S.running=false;S.paused=false;updatePauseBtn(nm);return;}
    let writes=0;
    for(let dig=0;dig<d&&!X();dig++){
      setT('x2-radix',(dig+1)+'/'+d);
      const exp=Math.pow(10,dig);
      const ms=radixAnimMs('radix');

      setConcept('radix','Pass '+(dig+1)+'/'+d+': move each number into row 0–9 by its digit at 10^'+dig+' (LSD first).');
      const items=[...arrayEl.children];
      // Clear any previous digit highlighting before starting this pass.
      for(const el of items){
        const raw=el.dataset.value;
        if(raw!=null){
          const v=parseInt(raw,10);
          el.textContent=padRadixNumber(v);
        }
      }
      for(let i=0;i<items.length&&!X();i++){
        const el=items[i];
        el.classList.add('active');
        const v=parseInt(el.dataset.value,10);
        const vStr=padRadixNumber(v);
        const digit=Math.floor(v/exp)%10;
        const target=$('radix-bucket-'+digit);
        const highlightIndex=vStr.length-1-dig;
        if(highlightIndex>=0&&highlightIndex<vStr.length){
          let html='';
          for(let j=0;j<vStr.length;j++){
            const ch=vStr[j];
            if(j===highlightIndex)html+='<span class="radix-digit-highlight">'+ch+'</span>';
            else html+='<span>'+ch+'</span>';
          }
          el.innerHTML=html;
        }
        setConcept('radix','Reading '+v+' → digit '+digit+' at 10^'+dig+'; place into row '+digit+'.');
        if(target)await moveElAnimated(nm,el,target,ms);
        el.classList.remove('active');
        await sleepControlled(nm,Math.max(0,Math.round(delay('radix')*0.12)));
      }

      setConcept('radix','Collect: scan rows 0→9 and place numbers back into the array (stable).');
      let idx=0;
      for(let b=0;b<10&&!X();b++){
        const bucket=$('radix-bucket-'+b);
        if(!bucket)continue;
        while(bucket.firstChild&&!X()){
          const el=bucket.firstChild;
          el.classList.add('writing');
          await moveElAnimated(nm,el,arrayEl,ms);
          el.classList.remove('writing');
          arr[idx]=parseInt(el.dataset.value,10);
          writes++;setT('swaps-radix',writes);
          idx++;
          await sleepControlled(nm,Math.max(0,Math.round(delay('radix')*0.15)));
        }
      }

      await sleepControlled(nm,Math.min(280,Math.round(delay('radix')*0.9)));
    }
    // Mark done
    for(const el of arrayEl.children)el.classList.add('sorted');
  }
  else if(nm==='bucket'){
    const k=Math.ceil(Math.sqrt(n));setT('x1-bucket',k);
    const mn=Math.min(...arr),mxVal=Math.max(...arr),spanRaw=mxVal-mn+1;
    const buckets=Array.from({length:k},()=>[]);let writes=0;
    const allBucketColors=['bucket0','bucket1','bucket2','bucket3','bucket4','bucket5','bucket6','bucket7','bucket8','bucket9'];
    const bcols=allBucketColors.slice(0,Math.min(k,allBucketColors.length));
    const bc={};
    const bucketRanges=[];
    if(spanRaw>0){
      for(let bi=0;bi<k;bi++){
        const low=mn+Math.floor(bi*spanRaw/k);
        const high=mn+(bi===k-1?spanRaw-1:Math.floor((bi+1)*spanRaw/k)-1);
        bucketRanges.push({low,high});
      }
    }else{
      for(let bi=0;bi<k;bi++)bucketRanges.push({low:mn,high:mn});
    }
    renderBucketLegend(k);
    setConcept('bucket','Scatter step: assigning each value to a bucket based on its range.');
    renderBucketBoard('Bucket',buckets,bucketRanges,bcols);
    const denom=spanRaw||1;
    for(let i=0;i<n&&!X();i++){
      const v=arr[i];
      const bi=Math.min(Math.floor(((v-mn)/denom)*k),k-1);
      buckets[bi].push(v);
      bc[i]=bcols[bi%bcols.length];
      render(nm,{bc:{...bc}});
      setConcept('bucket','Scatter: placing value '+v+' into bucket '+bi+'.');
      renderBucketBoard('Bucket',buckets,bucketRanges,bcols);
      await sleepControlled(nm,delay(nm));
    }
    let maxBs=0;buckets.forEach(b=>{if(b.length>maxBs)maxBs=b.length});setT('x2-bucket',maxBs);
    setConcept('bucket','Sorting step: sorting each bucket (insertion sort works well on small buckets).');
    const sortedBucketIndices=new Set();
    for(let bi=0;bi<k&&!X();bi++){
      const b=buckets[bi];
      if(b.length<=1){
        sortedBucketIndices.add(bi);
        renderBucketBoard('Bucket',buckets,bucketRanges,bcols,{sortedBuckets:sortedBucketIndices});
      }else if(b.length>1){
        setConcept('bucket','Sorting bucket '+String.fromCharCode(65+(bi%26))+' with insertion sort (size '+b.length+').');
        renderBucketBoard('Bucket',buckets,bucketRanges,bcols,{sortedBuckets:sortedBucketIndices});
        await sleepControlled(nm,Math.max(8,delay(nm)*0.4));
        const noSortedYet=new Set();
        for(let i=1;i<b.length&&!X();i++){
          let key=b[i],j=i-1;
          setConcept('bucket','Inserting '+key+' into sorted prefix of bucket '+String.fromCharCode(65+(bi%26))+'.');
          renderBucketBoard('Bucket',buckets,bucketRanges,bcols,{bucketIdx:bi,comparing:new Set([i]),sorted:noSortedYet,sortedBuckets:sortedBucketIndices});
          await sleepControlled(nm,Math.max(6,delay(nm)*0.3));
          while(j>=0&&b[j]>key&&!X()){
            setConcept('bucket','Comparing '+key+' with '+b[j]+' in bucket '+String.fromCharCode(65+(bi%26))+'; shifting right.');
            renderBucketBoard('Bucket',buckets,bucketRanges,bcols,{bucketIdx:bi,comparing:new Set([j,j+1]),sorted:noSortedYet,sortedBuckets:sortedBucketIndices});
            await sleepControlled(nm,Math.max(6,delay(nm)*0.3));
            b[j+1]=b[j];
            renderBucketBoard('Bucket',buckets,bucketRanges,bcols,{bucketIdx:bi,swapping:new Set([j+1]),sorted:noSortedYet,sortedBuckets:sortedBucketIndices});
            await sleepControlled(nm,Math.max(6,delay(nm)*0.3));
            j--;
          }
          b[j+1]=key;
          renderBucketBoard('Bucket',buckets,bucketRanges,bcols,{bucketIdx:bi,sorted:noSortedYet,sortedBuckets:sortedBucketIndices});
          await sleepControlled(nm,Math.max(6,delay(nm)*0.3));
        }
        setConcept('bucket','Bucket '+String.fromCharCode(65+(bi%26))+' is now sorted.');
        sortedBucketIndices.add(bi);
        renderBucketBoard('Bucket',buckets,bucketRanges,bcols,{bucketIdx:bi,sorted:new Set(Array.from({length:b.length},(_,idx)=>idx)),sortedBuckets:sortedBucketIndices});
        await sleepControlled(nm,Math.max(8,delay(nm)*0.4));
      }
    }
    let idx=0;
    setConcept('bucket','Gather step: concatenating buckets back into the main array in order.');
    for(let bi=0;bi<k&&!X();bi++){for(let j=0;j<buckets[bi].length&&!X();j++){arr[idx]=buckets[bi][j];writes++;idx++;setT('swaps-bucket',writes);render(nm,{sorted:new Set(Array.from({length:idx},(_,k)=>k))});await sleepControlled(nm,delay(nm))}}
  }
  else if(nm==='bogo'){
    function isSorted(a){for(let i=1;i<a.length;i++)if(a[i-1]>a[i])return false;return true}
    function fyShuffle(a){
      for(let i=a.length-1;i>0;i--){
        const j=Math.floor(Math.random()*(i+1));
        [a[i],a[j]]=[a[j],a[i]];
      }
    }
    setT('x1-bogo',BOGO_MAX_ATTEMPTS);
    let checks=0,shuffles=0;
    setConcept('bogo','Step 1: check if the array is sorted. If not, shuffle and hope.');
    await sleepControlled(nm,Math.max(10,delay('bogo')));
    while(!X()){
      checks++;setT('comps-bogo',checks);
      if(isSorted(arr)){setConcept('bogo','It worked! Sorted after '+shuffles+' shuffle'+(shuffles===1?'':'s')+' and '+checks+' check'+(checks===1?'':'s')+'.');break;}
      if(shuffles>=BOGO_MAX_ATTEMPTS){setConcept('bogo','Safety cap reached ('+BOGO_MAX_ATTEMPTS+' shuffles). Bogo sort has decided to pursue other interests.');break;}
      setConcept('bogo','Not sorted. Shuffling... (attempt '+(shuffles+1)+' of '+BOGO_MAX_ATTEMPTS+')');
      render('bogo');
      await sleepControlled(nm,Math.max(6,Math.round(delay('bogo')*0.55)));
      fyShuffle(arr);
      shuffles++;setT('swaps-bogo',shuffles);
      render('bogo');
      await sleepControlled(nm,delay('bogo'));
    }
    if(!X()&&isSorted(arr))render('bogo',{sorted:new Set(Array.from({length:n},(_,i)=>i))});
  }

  if(!X() && nm!=='bogo')render(nm,{sorted:new Set(Array.from({length:n},(_,i)=>i))});
  S.running=false;S.paused=false;updatePauseBtn(nm);
}

['insertion','selection','bubble','merge','quick','heap','counting','radix','bucket','bogo'].forEach(initD);

// Wire bogo unlock after DOM is ready (this script is at end of body).
setBogoUnlocked(isBogoUnlocked());
const unlockBtn=document.getElementById('bogo-unlock');
if(unlockBtn)unlockBtn.addEventListener('click',unlockBogo);

