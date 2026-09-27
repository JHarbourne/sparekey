// How complete each step is, for the progress rail. Returns 'done' | 'part' | 'todo'.

export function stepStatus(inv, risks = []) {
  const filled = (...v) => v.filter((x) => String(x || '').trim()).length;
  const people = filled(inv.client.name || inv.client.organisation, inv.builder.name, inv.emergency.name);
  const complete = (s) => s.accountOwner && s.paidBy && s.secondAdmin !== 'unknown';
  const svcDone = inv.services.filter(complete).length;
  const access = filled(inv.passwordsLocation, inv.backupsLocation);
  const high = risks.filter((r) => r.level === 'high').length;
  const has = inv.services.length || inv.domains.length;
  return {
    people: people === 3 ? 'done' : people ? 'part' : 'todo',
    domains: inv.domains.length ? 'done' : 'todo',
    services: !inv.services.length ? 'todo' : svcDone === inv.services.length ? 'done' : 'part',
    access: access === 2 ? 'done' : access ? 'part' : 'todo',
    risks: !has ? 'todo' : risks.length === 0 ? 'done' : high === 0 ? 'part' : 'todo',
  };
}
