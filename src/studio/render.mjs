export const FORMATS = Object.freeze({
  profile: { width: 800, height: 800, label: 'Profile', detail: '800 × 800 · transparent PNG' },
  linkedin: { width: 1584, height: 396, label: 'LinkedIn banner', detail: '1584 × 396 · PNG' },
  x: { width: 1500, height: 500, label: 'X banner', detail: '1500 × 500 · PNG' },
  certificate: { width: 1600, height: 1200, label: 'Certificate post', detail: '1600 × 1200 · PNG' },
});
const C = { paper: '#fafafa', ink: '#242424', muted: '#626262', line: '#e3e3e3', silver: '#cdcdcd', stage: '#070808', high: '#24262a', metal: '#636970' };
const FONT = '"Bricolage Grotesque", sans-serif';
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// A square source crop, independent of export dimensions. Pan can never expose an empty edge.
export function photoCrop(width, height, zoom = 1, x = 0, y = 0) {
  if (!(width > 0 && height > 0) || ![width, height, zoom, x, y].every(Number.isFinite)) throw new Error('Invalid photo dimensions or crop.');
  const size = Math.min(width, height) / clamp(zoom, 1, 3);
  return { sx: (width - size) * (clamp(x, -1, 1) + 1) / 2, sy: (height - size) * (clamp(y, -1, 1) + 1) / 2, size };
}
function font(ctx, size, weight = 500) { ctx.font = `${weight} ${size}px ${FONT}`; }
function text(ctx, value, x, y, size, color = C.ink, weight = 500) { font(ctx, size, weight); ctx.fillStyle = color; ctx.fillText(value, x, y); }
function fittedText(ctx, value, x, y, size, width, color = C.ink, weight = 500, min = 16) {
  font(ctx, size, weight);
  while (size > min && ctx.measureText(value).width > width) font(ctx, --size, weight);
  let label = value;
  while (label && ctx.measureText(label).width > width) label = label.slice(0, -1);
  if (label !== value) label = label.slice(0, -1) + '…';
  ctx.fillStyle = color; ctx.fillText(label, x, y);
}
function circle(ctx, x, y, r, color) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill(); }
function portrait(ctx, state, x, y, r) {
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
  if (state.photo) {
    const crop = photoCrop(state.photo.naturalWidth, state.photo.naturalHeight, state.zoom, state.panX, state.panY);
    ctx.drawImage(state.photo, crop.sx, crop.sy, crop.size, crop.size, x-r, y-r, r*2, r*2);
  } else {
    const gradient = ctx.createLinearGradient(x-r, y-r, x+r, y+r); gradient.addColorStop(0, C.metal); gradient.addColorStop(1, C.high);
    ctx.fillStyle = gradient; ctx.fillRect(x-r, y-r, r*2, r*2);
    circle(ctx, x, y-r*.2, r*.28, C.silver); circle(ctx, x, y+r*.83, r*.65, C.silver);
  }
  ctx.restore();
}
function seal(ctx, image, x, y, diameter) {
  // Original PNG already contains the exact −8° lettering tilt. Do not rotate it again.
  if (image) ctx.drawImage(image, 224, 256, 1600, 1600, x-diameter/2, y-diameter/2, diameter, diameter);
}
function material(ctx, width, height) {
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, C.high); gradient.addColorStop(.6, C.stage); gradient.addColorStop(1, C.high);
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = '#cdcdcd0c'; ctx.lineWidth = 1;
  for (let i = -height; i < width; i += 12) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i+height*.4, height); ctx.stroke(); }
}
function curvedText(ctx, value, cx, cy, radius) {
  font(ctx, 28, 650); ctx.fillStyle = C.paper; ctx.textAlign = 'center';
  const widths = [...value].map(char => ctx.measureText(char).width + 5);
  const total = widths.reduce((a,b) => a+b, 0); let offset = -total/2;
  [...value].forEach((char, i) => {
    const angle = (offset + widths[i]/2) / radius;
    ctx.save(); ctx.translate(cx + Math.sin(angle)*radius, cy - Math.cos(angle)*radius); ctx.rotate(angle); ctx.fillText(char, 0, 9); ctx.restore();
    offset += widths[i];
  });
  ctx.textAlign = 'left';
}
function profile(ctx, state) {
  const gradient = ctx.createLinearGradient(60, 40, 750, 790);
  gradient.addColorStop(0, C.silver); gradient.addColorStop(.2, C.metal); gradient.addColorStop(.45, C.high); gradient.addColorStop(.7, C.silver); gradient.addColorStop(1, C.metal);
  circle(ctx, 400, 400, 390, gradient); circle(ctx, 400, 400, 381, C.high);
  ctx.strokeStyle = C.metal; ctx.lineWidth = 2;
  for (let i=0; i<120; i++) {
    const a=i*Math.PI/60; const inner=i%5===0?370:375;
    ctx.beginPath(); ctx.moveTo(400+Math.sin(a)*inner,400+Math.cos(a)*inner);ctx.lineTo(400+Math.sin(a)*380,400+Math.cos(a)*380);ctx.stroke();
  }
  circle(ctx,400,400,334,C.silver); portrait(ctx,state,400,400,329);
  curvedText(ctx,'GENGEN · RECORDED ACTIVITY',400,400,354);
  seal(ctx,state.seal,572,611,178);
}
function banner(ctx, state, isX) {
  const {width:w,height:h}=FORMATS[state.format]; material(ctx,w,h);
  const left=isX?440:400, top=isX?96:68;
  ctx.fillStyle=C.metal;ctx.fillRect(left-32,top-8,2,isX?286:260);
  text(ctx,'BUILDER NUTCH / AI PODIUM',left,top,18,C.silver,550);
  text(ctx,'GenGen.',left,top+95,88,C.paper,650);
  fittedText(ctx,state.name||'Recorded AI practice.',left,top+154,34,470,C.silver,450,20);
  text(ctx,state.certificate?'Local recorded history':'Certificate preview',left,top+207,19,C.silver,500);
  if (state.photo) {circle(ctx,w-493,h/2,104,C.metal);portrait(ctx,state,w-493,h/2,100);}
  seal(ctx,state.seal,w-195,h/2,isX?318:292);
}
function certificate(ctx,state) {
  const cert=state.certificate; ctx.fillStyle=C.paper;ctx.fillRect(0,0,1600,1200);
  // Sparse engraved rule and paper grain; no generated textures or remote assets.
  ctx.strokeStyle=C.line;ctx.lineWidth=1;
  for(let y=2;y<1200;y+=6){ctx.globalAlpha=.18;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(1600,y);ctx.stroke();}ctx.globalAlpha=1;
  ctx.strokeStyle=C.ink;ctx.lineWidth=2;ctx.strokeRect(48,48,1504,1104);
  text(ctx,'BUILDER NUTCH',108,130,26,C.ink,700);text(ctx,'RECORD OF AI PRACTICE',108,211,20,C.muted,550);
  text(ctx,'GenGen.',102,386,146,C.ink,650);
  fittedText(ctx,state.name||'Recorded AI activity',108,493,56,910,C.ink,500,30);
  text(ctx,cert?'Lifetime recorded tokens':'Your recorded history',108,601,24,C.muted);
  if(cert) fittedText(ctx,new Intl.NumberFormat('en-US').format(cert.totalTokens),108,677,60,940,C.ink,650,40);
  else text(ctx,'Import your certificate to unlock',108,670,34,C.muted);
  ctx.strokeStyle=C.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(108,753);ctx.lineTo(980,753);ctx.stroke();
  if(cert){
    const date=new Intl.DateTimeFormat('en-GB',{day:'numeric',month:'long',year:'numeric',timeZone:cert.timeZone}).format(new Date(cert.issuedAt));
    text(ctx,`Issued ${date}`,108,821,25,C.ink);
    text(ctx,cert.route==='obsidian'?'Eligibility · 100 billion lifetime tokens':'Eligibility · Graphite + two calendar months',108,869,23,C.muted);
    text(ctx,`Certificate ${cert.id}`,108,918,20,C.muted);
  }else{ text(ctx,'Issued date and certificate ID appear here.',108,821,24,C.muted); }
  seal(ctx,state.seal,1280,440,458);
  if(state.photo){circle(ctx,1302,921,103,C.silver);portrait(ctx,state,1302,921,100);}
  text(ctx,'LOCAL RECORDED HISTORY · NOT INDEPENDENTLY VERIFIED',108,1058,19,C.muted,550);
  text(ctx,'Display name chosen by its owner. Identity is not verified.',108,1097,18,C.muted);
}
function sample(ctx, width, height, isProfile) {
  ctx.save(); if(isProfile){ctx.beginPath();ctx.arc(400,400,329,0,Math.PI*2);ctx.clip();}
  ctx.translate(width/2,height/2);ctx.rotate(-Math.PI/14);
  font(ctx,isProfile?42:height*.115,700);ctx.textAlign='center';
  const message='SAMPLE · EXPORT LOCKED';const textWidth=ctx.measureText(message).width;
  ctx.fillStyle='#070808d9';ctx.fillRect(-textWidth/2-24,-height*.075,textWidth+48,height*.15);
  ctx.fillStyle=C.paper;ctx.fillText(message,0,height*.035);ctx.restore();
}
export function renderImage(canvas,state) {
  const format=FORMATS[state.format]; if(!format)throw new Error('Unknown image format.');
  canvas.width=format.width;canvas.height=format.height;
  const ctx=canvas.getContext('2d'); if(!ctx)throw new Error('Your browser could not create an image canvas.');
  ctx.clearRect(0,0,canvas.width,canvas.height);
  if(state.format==='profile')profile(ctx,state);
  else if(state.format==='certificate')certificate(ctx,state);
  else banner(ctx,state,state.format==='x');
  if(!state.certificate)sample(ctx,canvas.width,canvas.height,state.format==='profile');
  return canvas;
}
