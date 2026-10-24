import { cafeEntryRadiusMeters, cafeMaximumAccuracyMeters, cafePositionParameters, CafePosition, isCafePositionUsable, isCafeWithinEntryRadius } from '../services/cafeLocationRules';
function assert(value: boolean, message: string) { if (!value) throw new Error(message); }
export function runCafeArrivalChecks() {
  const now = Date.parse('2026-10-24T12:00:00Z');
  const position: CafePosition = { latitude: 41, longitude: 29, accuracy: 10, capturedAt: now };
  assert(cafeEntryRadiusMeters === 20 && cafeMaximumAccuracyMeters === 20, '20-metre distance and accuracy contracts.');
  assert(isCafeWithinEntryRadius(0) && isCafeWithinEntryRadius(19.999), 'Only distances below 20 m accepted.');
  assert(!isCafeWithinEntryRadius(20) && !isCafeWithinEntryRadius(100), 'Exact boundary and previous 100 m limit denied.');
  assert(!isCafeWithinEntryRadius(-1) && !isCafeWithinEntryRadius(NaN) && !isCafeWithinEntryRadius(Infinity), 'Invalid distances fail closed.');
  assert(isCafePositionUsable(position, now), 'Fresh, accurate fix accepted.');
  assert(isCafePositionUsable({ ...position, accuracy: 20, capturedAt: now - 60000 }, now), 'Accuracy and freshness edges accepted.');
  assert(!isCafePositionUsable({ ...position, accuracy: 20.01 }, now), 'Imprecise fix rejected.');
  assert(!isCafePositionUsable({ ...position, accuracy: null }, now), 'Missing accuracy rejected.');
  assert(!isCafePositionUsable({ ...position, latitude: NaN }, now), 'Nonfinite location rejected.');
  assert(!isCafePositionUsable({ ...position, longitude: 181 }, now), 'Invalid coordinates rejected.');
  assert(!isCafePositionUsable({ ...position, capturedAt: now - 60001 }, now), 'Stale fix rejected.');
  assert(!isCafePositionUsable({ ...position, capturedAt: now + 15001 }, now), 'Future fix rejected.');
  const body = cafePositionParameters(position);
  assert(body.p_accuracy === 10 && body.p_captured_at === '2026-10-24T12:00:00.000Z', 'RPC uses transient captured fix.');
  return 'passed: strict 20 m boundary, accuracy, freshness, finite coordinates and RPC parameters';
}
