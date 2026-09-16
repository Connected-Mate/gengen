import test from 'node:test';
import assert from 'node:assert/strict';
import { photoCrop, FORMATS } from '../src/studio/render.mjs';

test('portrait and landscape source crops cover a square at every pan extreme',()=>{
  for(const [width,height] of [[4000,3000],[2400,4000],[800,800]])for(const zoom of [1,1.7,3])for(const x of [-1,0,1])for(const y of [-1,0,1]){
    const crop=photoCrop(width,height,zoom,x,y);
    assert.ok(crop.sx>=0&&crop.sy>=0);
    assert.ok(crop.sx+crop.size<=width+1e-9&&crop.sy+crop.size<=height+1e-9);
    assert.equal(crop.size,Math.min(width,height)/zoom);
  }
});
test('crop panning reaches both edges and rejects invalid values',()=>{
  assert.deepEqual(photoCrop(4000,2000,1,-1,0),{sx:0,sy:0,size:2000});
  assert.deepEqual(photoCrop(4000,2000,1,1,0),{sx:2000,sy:0,size:2000});
  assert.deepEqual(photoCrop(1000,2000,2,0,1),{sx:250,sy:1500,size:500});
  assert.throws(()=>photoCrop(0,100));assert.throws(()=>photoCrop(100,100,NaN));
});
test('export formats retain requested exact native dimensions',()=>{
  assert.deepEqual(Object.values(FORMATS).map(({width,height})=>[width,height]),[[800,800],[1584,396],[1500,500],[1600,1200]]);
});
