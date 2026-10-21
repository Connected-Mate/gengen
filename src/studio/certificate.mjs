// A portable local-history attestation, not a cryptographic identity credential.
// Import never writes to storage or makes a network request.
const FIELDS = ['schema', 'version', 'id', 'issuer', 'achievement', 'issuedAt', 'totalTokens', 'route', 'graphiteReachedAt', 'eligibleAt', 'timeZone', 'verification'];
const DAY = 86_400_000;
const fail = message => { throw new Error(message); };
const invalid = () => fail('This certificate is not supported. Export a new GenGen certificate from Builder Nutch.');

function timestamp(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(value)) invalid();
  const date = new Date(value);
  if (!Number.isFinite(date.getTime()) || date.getTime() < 0) invalid();
  if (date.toISOString().slice(0, 19) !== value.slice(0, 19)) invalid();
  return date.getTime();
}

function parts(time, zone) {
  return Object.fromEntries(new Intl.DateTimeFormat('en-GB-u-ca-gregory-nu-latn', {
    timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(time).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]));
}
const civil = p => Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);

/** Calendar-month validation uses the certificate's zone, including month-end clamping. */
function durationDateMatches(start, eligible, zone) {
  const from = parts(start, zone);
  const month = new Date(Date.UTC(from.year, from.month - 1 + 2, 1));
  const lastDay = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate();
  const expected = { ...from, year: month.getUTCFullYear(), month: month.getUTCMonth() + 1, day: Math.min(from.day, lastDay) };
  const actual = civil(parts(eligible, zone));
  const target = civil(expected);
  if (actual === target) return true;
  // A target wall time inside a daylight-saving gap is normalised forward by Calendar.
  // Confirm an actual offset jump, rather than accepting an arbitrary late timestamp.
  const offset = time => civil(parts(time, zone)) - Math.floor(time / 1000) * 1000;
  const jump = offset(eligible + DAY) - offset(eligible - DAY);
  return jump > 0 && jump <= 3_600_000 * 2 && actual === target + jump;
}

export function parseCertificate(text, now = Date.now()) {
  if (typeof text !== 'string' || text.length > 65_536) fail('Choose a GenGen certificate smaller than 64 KB.');
  let value;
  try { value = JSON.parse(text); } catch { fail('This file is not a readable GenGen certificate. Choose the JSON file exported by Builder Nutch.'); }
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  if (Object.keys(value).length !== FIELDS.length || FIELDS.some(key => !Object.hasOwn(value, key))) invalid();
  if (value.schema !== 'gengen-certificate' || value.version !== 1 || value.issuer !== 'Builder Nutch' || value.achievement !== 'GenGen' || value.verification !== 'local-history') invalid();
  if (typeof value.id !== 'string' || !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value.id)) invalid();
  if (!Number.isSafeInteger(value.totalTokens) || value.totalTokens < 0) invalid();
  if (!['obsidian', 'graphite-duration'].includes(value.route)) invalid();
  if (typeof value.timeZone !== 'string' || value.timeZone.length > 80) invalid();
  try { parts(now, value.timeZone); } catch { invalid(); }
  const issued = timestamp(value.issuedAt);
  if (issued > now + 300_000) fail('This certificate is dated in the future. Check your Mac’s clock and export it again.');
  const graphite = value.graphiteReachedAt === null ? null : timestamp(value.graphiteReachedAt);
  const eligible = value.eligibleAt === null ? null : timestamp(value.eligibleAt);
  if ((graphite !== null && graphite > issued) || (eligible !== null && eligible > issued)) invalid();
  if (value.route === 'obsidian') {
    if (value.totalTokens < 100_000_000_000) fail('This recorded history has not reached GenGen yet.');
  } else {
    if (value.totalTokens < 10_000_000_000 || graphite === null || eligible === null ||
        !durationDateMatches(graphite, eligible, value.timeZone)) {
      fail('This recorded history does not establish two calendar months after Graphite. Export a new certificate once GenGen is reached.');
    }
  }
  // Reconstruct only the public contract; no arbitrary properties reach the editor.
  return Object.freeze(Object.fromEntries(FIELDS.map(key => [key, value[key]])));
}
