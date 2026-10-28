// Live PROGRESS line in the PR's ONE "Check status" comment (owner Oct 28 2026 2:2x PM, ChatGPT idea 5 verified: the comment said "RUNNING, about
// 8-10 min" for 45 minutes because it was written once). Called at the start and end of every play job (and by the plan job): counts this run's
// play parts (finished / running / queued), the longest running one with its current step, and how long the oldest queued one has waited for a
// runner. Rewrites ONLY the <!-- progress --> block, and only while the comment still says RUNNING / RETRYING (never over PASSED / FAILED / ROBOT).
// DRY=1 prints the line and writes nothing. Needs GH_TOKEN, GITHUB_REPOSITORY, GITHUB_RUN_ID and the PR number (GITHUB_EVENT_PATH or PR env).
import fs from 'node:fs';
const T = process.env.GH_TOKEN, REPO = process.env.GITHUB_REPOSITORY, RUN = process.env.GITHUB_RUN_ID;
let PR = process.env.PR;
if (!PR && process.env.GITHUB_EVENT_PATH) { try { PR = JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH, 'utf8')).pull_request?.number; } catch {} }
const H = { Authorization: 'Bearer ' + T, Accept: 'application/vnd.github+json', 'User-Agent': 'check-progress' };
const api = async (p, o = {}) => { const r = await fetch('https://api.github.com/repos/' + REPO + p, { headers: H, ...o }); if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); };
const min = (a, b) => Math.max(0, Math.round((b - a) / 60000));
export function progressLine(jobs, run, now = Date.now()) {
  const play = jobs.filter(j => /^play/.test(j.name));
  if (!play.length) return '';
  const done = play.filter(j => j.status === 'completed'), run_ = play.filter(j => j.status === 'in_progress'), q = play.filter(j => j.status === 'queued' || j.status === 'waiting' || j.status === 'pending');
  const parts = [`${done.length} of ${play.length} play parts finished`];
  if (run_.length) {
    const L = run_.slice().sort((a, b) => Date.parse(a.started_at) - Date.parse(b.started_at))[0];
    const step = (L.steps || []).find(s => s.status === 'in_progress');
    parts.push(`${run_.length} running (longest ${min(Date.parse(L.started_at), now)} min${step ? ', now: ' + step.name.replace(/\s+/g, ' ').slice(0, 60) : ''})`);
  }
  if (q.length) { const w = Math.max(...q.map(j => min(Date.parse(j.created_at), now))); parts.push(`${q.length} waiting for a runner (oldest ${w} min - a PR check uses at most 5 runners at once)`); }
  const failed = done.filter(j => j.conclusion && j.conclusion !== 'success').length;
  if (failed) parts.push(`${failed} not green`);
  const age = run?.created_at ? ` · check started ${min(Date.parse(run.created_at), now)} min ago` : '';
  return parts.join(' · ') + age;
}
if (process.argv[1] && process.argv[1].endsWith('progress-update.mjs')) {
  if (!T || !REPO || !RUN || !PR) { console.log('progress: missing env, nothing to do'); process.exit(0); }
  try {
    const jobs = (await api('/actions/runs/' + RUN + '/jobs?per_page=100')).jobs || [], run = await api('/actions/runs/' + RUN);
    const line = progressLine(jobs, run);
    if (!line) { console.log('progress: no play jobs yet'); process.exit(0); }
    const stamp = new Date().toISOString().slice(11, 16) + ' UTC';
    const block = `<!-- progress -->\n**Progress (${stamp}):** ${line}\n<!-- /progress -->`;
    console.log(block);
    if (process.env.DRY) process.exit(0);
    const cs = await api('/issues/' + PR + '/comments?per_page=100');
    const c = cs.filter(x => (x.body || '').startsWith('<!-- check-status -->')).pop();
    if (!c || !/🟡 RUNNING|🟠 RETRYING/.test(c.body)) { console.log('progress: comment is not RUNNING - left alone'); process.exit(0); }
    let body = c.body;
    if (body.includes('<!-- progress -->')) body = body.replace(/<!-- progress -->[\s\S]*?<!-- \/progress -->/, block);
    else body = body.replace(/\n_Updated /, '\n' + block + '\n\n_Updated ');
    await api('/issues/comments/' + c.id, { method: 'PATCH', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ body }) });
    console.log('progress: comment updated');
  } catch (e) { console.log('progress: ' + e.message + ' (ignored)'); }
}
