import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCertificate } from '../src/studio/certificate.mjs';
const now = Date.parse('2026-09-16T10:00:00Z');
const base = {schema:'gengen-certificate',version:1,id:'00000000-0000-4000-8000-000000000001',issuer:'Builder Nutch',achievement:'GenGen',issuedAt:'2026-09-16T09:00:00Z',totalTokens:100_000_000_000,route:'obsidian',graphiteReachedAt:null,eligibleAt:null,timeZone:'Europe/Paris',verification:'local-history'};
const parse = patch => parseCertificate(JSON.stringify({...base,...patch}),now);
test('Obsidian can retain unknown historical crossing dates',()=>assert.equal(parse({}).eligibleAt,null));
test('rejects locked counts, unsupported or oversized files and unsafe numbers',()=>{
 for(const patch of [{totalTokens:99_999_999_999},{totalTokens:Number.MAX_SAFE_INTEGER+1},{totalTokens:NaN},{version:2},{verification:'verified'},{accountEmail:'private@example.invalid'}]) assert.throws(()=>parse(patch));
 assert.throws(()=>parseCertificate('x'.repeat(65537),now)); assert.throws(()=>parseCertificate('not json',now));
});
test('calendar path requires sufficient tokens and both real dates',()=>{
 const valid={totalTokens:10_000_000_000,route:'graphite-duration',graphiteReachedAt:'2026-07-16T08:00:00Z',eligibleAt:'2026-09-16T08:00:00Z'};
 assert.equal(parse(valid).route,'graphite-duration');
 for(const patch of [{eligibleAt:null},{graphiteReachedAt:null},{totalTokens:9_999_999_999},{eligibleAt:'2026-09-15T08:00:00Z'},{eligibleAt:'2026-09-17T08:00:00Z'}])assert.throws(()=>parse({...valid,...patch}));
});
test('month ends clamp and daylight-saving changes preserve the local clock',()=>{
 assert.equal(parse({totalTokens:10_000_000_000,route:'graphite-duration',graphiteReachedAt:'2025-12-31T10:00:00Z',eligibleAt:'2026-02-28T10:00:00Z'}).route,'graphite-duration');
 assert.equal(parse({totalTokens:10_000_000_000,route:'graphite-duration',graphiteReachedAt:'2026-01-30T10:00:00Z',eligibleAt:'2026-03-30T09:00:00Z'}).route,'graphite-duration');
 assert.throws(()=>parse({totalTokens:10_000_000_000,route:'graphite-duration',graphiteReachedAt:'2026-01-30T10:00:00Z',eligibleAt:'2026-03-30T10:00:00Z'}));
});
test('DST nonexistent target time normalises forward only for an actual jump',()=>{
 assert.equal(parse({totalTokens:10_000_000_000,route:'graphite-duration',graphiteReachedAt:'2026-01-29T01:30:00Z',eligibleAt:'2026-03-29T01:30:00Z'}).route,'graphite-duration');
});
test('rejects date rollover, future timestamps and unknown zones',()=>{
 for(const patch of [{issuedAt:'2026-02-30T00:00:00Z'},{issuedAt:'2027-01-01T00:00:00Z'},{graphiteReachedAt:'2026-09-16T11:00:00Z'},{timeZone:'not/a-zone'}])assert.throws(()=>parse(patch));
});
