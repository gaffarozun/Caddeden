import { cafeDemoRoom, createCafeDemoSession, getCafeDemoVenue, reduceCafeDemo } from '../services/cafeDemoService';
function assert(condition: boolean, message: string) { if (!condition) throw new Error(message); }
export function checkCafeDemos() {
  const venue = getCafeDemoVenue('b2');
  assert(!!venue, 'Fincan cafe demo must exist');
  assert(getCafeDemoVenue('real-business-uuid') === null, 'Real businesses must not enter demo mode');
  const second = getCafeDemoVenue('b7');
  assert(!!second && second.tables.reduce((sum, table) => sum + table.seats, 0) === 32 && second.count === 24, 'Second cafe has its own capacity and sample occupancy');
  if (!venue) return;
  let session = createCafeDemoSession();
  assert(session.joined && !session.visible, 'Preview starts with a hidden sample photo');
  assert(cafeDemoRoom(venue, session).tables?.length === 6, 'Sample seating plan is available');
  session = reduceCafeDemo(session, { kind: 'preview', personId: 'demo-ece', name: 'Ece' });
  assert(!session.previewName, 'An unapproved sample profile must not open');
  session = reduceCafeDemo(session, { kind: 'request', personId: 'demo-ece' }, 1000);
  session = reduceCafeDemo(session, { kind: 'decide', personId: 'demo-ece', accept: true }, 1000);
  session = reduceCafeDemo(session, { kind: 'preview', personId: 'demo-ece', name: 'Ece' });
  assert(session.previewName === 'Ece', 'Approved sample profile opens locally');
  session = reduceCafeDemo(session, { kind: 'request', personId: 'demo-deniz' }, 1000);
  session = reduceCafeDemo(session, { kind: 'decide', personId: 'demo-deniz', accept: false }, 1000);
  assert(session.hiddenUntil['demo-deniz'] === 1000 + 259200000, 'Rejection hides the sample photo for 72 hours');
  const blocked = reduceCafeDemo(session, { kind: 'request', personId: 'demo-deniz' }, 2000);
  assert(blocked.requests['demo-deniz'] === 'rejected', 'Cannot request again during cooldown');
  session = reduceCafeDemo(session, { kind: 'leave' });
  assert(!session.joined && !session.previewName && !cafeDemoRoom(venue, session).plan_visible, 'Leaving hides local sample details');
  session = reduceCafeDemo(session, { kind: 'reset' });
  assert(session.joined && Object.keys(session.hiddenUntil).length === 0, 'Reset restores the isolated preview');
  const otherSession = createCafeDemoSession();
  session = reduceCafeDemo(session, { kind: 'visibility', visible: true });
  assert(!otherSession.visible && Object.keys(otherSession.requests).length === 0, 'Demo sessions remain independent');
  session = reduceCafeDemo(session, { kind: 'incoming', accept: false });
  assert(session.incoming === 'rejected', 'Incoming rejection is simulated locally');
  session = reduceCafeDemo(session, { kind: 'leave' });
  const inactiveRequest = reduceCafeDemo(session, { kind: 'request', personId: 'demo-ece' });
  assert(!inactiveRequest.requests['demo-ece'], 'Inactive demo cannot send sample requests');
  session = reduceCafeDemo(session, { kind: 'join', visible: false });
  assert(session.joined && !session.visible, 'Rejoining respects the new visibility choice');
}
