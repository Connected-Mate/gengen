import { parseCertificate } from './certificate.mjs';
import { FORMATS, renderImage, photoCrop } from './render.mjs';

const $ = id => document.getElementById(id);
const canvas = $('preview');
const state = { format: 'profile', name: '', certificate: null, photo: null, seal: null, zoom: 1, panX: 0, panY: 0 };
let ready = false, photoPending = false, certificatePending = false, exporting = false;
let photoSequence = 0, certificateSequence = 0, revision = 0, photoURL = null, certificateText = null, frame = 0;
const say = message => { $('status').textContent = message; };
function exportReason() {
  if (!ready) return 'The studio must finish loading before export.';
  if (certificatePending) return 'Reading your certificate…';
  if (!state.certificate) return 'Import your certificate to unlock PNG exports.';
  if (photoPending) return 'Preparing your photo…';
  if (state.format === 'profile' && !state.photo) return 'Choose a photo to create your profile image.';
  if (exporting) return 'Preparing your PNG…';
  return 'Your image is ready to keep.';
}
function canExport() { return ready && !certificatePending && !photoPending && !exporting && !!state.certificate && (state.format !== 'profile' || !!state.photo); }
function update() {
  revision++;
  $('export').disabled = !canExport();
  $('export-reason').textContent = exportReason();
  const needsCertificate = !state.certificate;
  const needsPhoto = state.format === 'profile' && !state.photo;
  $('next-input').hidden = !needsCertificate && !needsPhoto;
  $('next-input').href = needsCertificate ? '#certificate-title' : '#photo-title';
  $('next-input').textContent = needsCertificate ? 'Choose certificate ↓' : 'Choose photo ↓';
  $('dimensions').textContent = FORMATS[state.format].detail;
  $('crop-controls').disabled = !state.photo || photoPending;
  $('clear-certificate').hidden = !state.certificate;
  canvas.classList.toggle('draggable', !!state.photo && state.format === 'profile');
  $('preview-tip').textContent = state.format === 'profile' ? 'With a photo, drag the profile preview to position it.' : state.format === 'x' ? 'Text stays clear of the lower-left profile photo area.' : 'Portrait crop is shared across all formats.';
  canvas.setAttribute('aria-label', `${state.certificate ? 'GenGen' : 'Sample GenGen'} ${FORMATS[state.format].label.toLowerCase()} preview${state.name ? ` for ${state.name}` : ''}. ${state.certificate ? 'Based on local recorded history.' : 'Export locked until a certificate is imported.'}`);
  if (frame) cancelAnimationFrame(frame);
  if (ready) frame = requestAnimationFrame(() => {
    frame = 0;
    try { renderImage(canvas, state); } catch (error) { ready = false; $('export').disabled = true; say(`Preview unavailable: ${error.message}`); }
  });
}
function resetCrop() {
  state.zoom=1;state.panX=0;state.panY=0;
  for (const [id,value] of [['zoom',1],['pan-x',0],['pan-y',0]]) $(id).value = value;
  cropLabels();
}
function cropLabels() {
  $('zoom-value').textContent = `${state.zoom.toFixed(2)}×`;
  for (const [id,value] of [['pan-x',state.panX],['pan-y',state.panY]]) $(`${id}-value`).textContent = Math.abs(value)<.005?'Center':`${Math.round(value*100)}%`;
}
function revokePhoto() { if (photoURL) { URL.revokeObjectURL(photoURL); photoURL=null; } }
function clearPhoto() {
  photoSequence++;photoPending=false;state.photo=null;revokePhoto();resetCrop();$('photo').value='';
  $('photo-status').textContent='No photo selected. SVG and HEIC are not supported.';update();
}
function clearCertificate() {
  certificateSequence++;certificatePending=false;state.certificate=null;certificateText=null;$('certificate').value='';
  $('certificate-status').textContent='No certificate yet. Previews are marked SAMPLE.';update();
}
function loadImage(url) {
  return new Promise((resolve,reject) => {
    const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>reject(new Error('The image could not be opened. Choose a valid PNG, JPEG or WebP.'));image.src=url;
  });
}
$('certificate').addEventListener('change', async event => {
  const file=event.target.files[0];if(!file)return;
  const sequence=++certificateSequence;certificatePending=true;state.certificate=null;certificateText=null;
  $('certificate-status').textContent='Reading certificate…';update();
  try {
    if(file.size>64*1024)throw new Error('This certificate is too large. Choose the original JSON, up to 64 KB.');
    if(!file.name.toLowerCase().endsWith('.json'))throw new Error('Choose the JSON certificate downloaded from Builder Nutch.');
    const source=await file.text();const certificate=parseCertificate(source);
    if(sequence!==certificateSequence)return;
    state.certificate=certificate;certificateText=source;
    $('certificate-status').textContent=`GenGen certificate loaded · ${new Intl.NumberFormat('en-US').format(certificate.totalTokens)} lifetime tokens.`;
    say('Certificate accepted. Choose a format and download your image.');
  } catch(error) {
    if(sequence!==certificateSequence)return;
    state.certificate=null;certificateText=null;$('certificate-status').textContent=`Certificate not accepted: ${error.message}`;say('Exports are locked. Choose a valid GenGen certificate.');
  } finally {if(sequence===certificateSequence){certificatePending=false;event.target.value='';update();}}
});
$('clear-certificate').addEventListener('click',()=>{clearCertificate();say('Certificate removed. Exports are locked and previews are marked SAMPLE.');});
$('photo').addEventListener('change', async event => {
  const file=event.target.files[0];if(!file)return;
  const sequence=++photoSequence;photoPending=true;state.photo=null;revokePhoto();resetCrop();
  $('photo-status').textContent='Preparing photo…';update();
  let url=null;
  try {
    if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw new Error('Choose a PNG, JPEG or WebP. SVG and HEIC are not supported.');
    if(file.size>15*1024*1024)throw new Error('This photo is too large. Choose one smaller than 15 MB.');
    url=URL.createObjectURL(file);const image=await loadImage(url);
    if(sequence!==photoSequence){URL.revokeObjectURL(url);return;}
    if(!image.naturalWidth||!image.naturalHeight||image.naturalWidth*image.naturalHeight>32_000_000)throw new Error('Choose a photo with no more than 32 million pixels.');
    state.photo=image;photoURL=url;url=null;
    $('photo-status').textContent=`Photo ready · ${image.naturalWidth} × ${image.naturalHeight}. Adjust the crop below.`;say('Photo ready. Adjust its position with the sliders or drag the profile preview.');
  } catch(error) {
    if(sequence!==photoSequence)return;
    state.photo=null;$('photo-status').textContent=error.message;say('Photo not accepted. Choose another image.');
  } finally {
    if(url)URL.revokeObjectURL(url);
    if(sequence===photoSequence){photoPending=false;event.target.value='';update();}
  }
});
$('clear-photo').addEventListener('click',()=>{clearPhoto();say('Photo removed. Banners and certificate posts can still be created without it.');});
$('reset-crop').addEventListener('click',()=>{resetCrop();update();say('Photo crop reset.');});
for(const [id,key] of [['zoom','zoom'],['pan-x','panX'],['pan-y','panY']]) $(id).addEventListener('input',event=>{state[key]=Number(event.target.value);cropLabels();update();});
$('name').addEventListener('input',event=>{state.name=event.target.value.trim().slice(0,48);update();});
document.querySelectorAll('[data-format]').forEach(button=>button.addEventListener('click',()=>{
  state.format=button.dataset.format;document.querySelectorAll('[data-format]').forEach(item=>item.setAttribute('aria-pressed',String(item===button)));update();say(`${FORMATS[state.format].label} selected.`);
}));
let drag=null;
canvas.addEventListener('pointerdown',event=>{
  if(!state.photo||state.format!=='profile'||event.button!==0)return;
  drag={id:event.pointerId,x:event.clientX,y:event.clientY,panX:state.panX,panY:state.panY};canvas.setPointerCapture(event.pointerId);canvas.classList.add('dragging');
});
canvas.addEventListener('pointermove',event=>{
  if(!drag||event.pointerId!==drag.id||!state.photo)return;
  const rect=canvas.getBoundingClientRect();const photo=state.photo;const crop=photoCrop(photo.naturalWidth,photo.naturalHeight,state.zoom);
  // Moving the portrait right means moving the source crop left.
  const sourcePerPixel=crop.size/(rect.width*658/800);
  const dx=(event.clientX-drag.x)*sourcePerPixel,dy=(event.clientY-drag.y)*sourcePerPixel;
  const rangeX=photo.naturalWidth-crop.size,rangeY=photo.naturalHeight-crop.size;
  state.panX=rangeX>0?Math.max(-1,Math.min(1,drag.panX-2*dx/rangeX)):0;
  state.panY=rangeY>0?Math.max(-1,Math.min(1,drag.panY-2*dy/rangeY)):0;
  $('pan-x').value=state.panX;$('pan-y').value=state.panY;cropLabels();update();
});
function endDrag(){drag=null;canvas.classList.remove('dragging');}
canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
$('export').addEventListener('click',async()=>{
  if(!canExport())return;
  exporting=true;update();const exportRevision=revision;
  try {
    // Revalidate the certificate at export time. Freeze every input in a fresh offscreen canvas.
    const certificate=parseCertificate(certificateText);const snapshot={...state,certificate};const output=document.createElement('canvas');renderImage(output,snapshot);
    const blob=await new Promise((resolve,reject)=>output.toBlob(value=>value?resolve(value):reject(new Error('The PNG could not be created. Try a smaller photo.')),'image/png'));
    if(revision!==exportRevision){say('The image changed while preparing the download. Download again to use the latest version.');return;}
    const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;
    link.download=`gengen-${snapshot.format}-${certificate.issuedAt.slice(0,10)}-${certificate.id.slice(0,8)}.png`;
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),30_000);
    say(`${FORMATS[snapshot.format].label} PNG prepared. Your browser will save the download.`);
  }catch(error){say(`Download unavailable: ${error.message}`);}
  finally{exporting=false;update();}
});
window.addEventListener('pagehide',()=>{photoSequence++;certificateSequence++;revokePhoto();});
update();
try {
  if(!document.fonts)throw new Error('This browser cannot load the studio font. Try a current browser.');
  const [sealImage,fontFaces]=await Promise.all([loadImage('/gengen/assets/gengen-seal.png').catch(()=>{throw new Error('The GenGen seal could not be loaded. Reload the page to try again.');}),document.fonts.load('650 48px "Bricolage Grotesque"')]);
  if(!fontFaces.length)throw new Error('The studio font could not be loaded. Reload the page to try again.');
  state.seal=sealImage;ready=true;update();say('Studio ready. Preview every format; import your certificate to export.');
}catch(error){say(`Studio unavailable: ${error.message}`);$('export-reason').textContent='Reload the page to try loading the studio again.';}
