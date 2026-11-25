// UserPromptSubmit hook: if context is large, tell Claude to ask the user about optimising.
// Cross-platform (Node). Change THRESHOLD or set TOKEN_SAVER_THRESHOLD to tune.
const fs = require('fs');
const THRESHOLD = parseInt(process.env.TOKEN_SAVER_THRESHOLD || '80000', 10);
let raw = '';
process.stdin.on('data', c => (raw += c)).on('end', () => {
  try {
    const p = JSON.parse(raw).transcript_path;
    if (!p || !fs.existsSync(p)) return;
    const lines = fs.readFileSync(p, 'utf8').trim().split('\n').slice(-200);
    let u = null;
    for (const l of lines) {
      try { const o = JSON.parse(l); if (o.message && o.message.usage) u = o.message.usage; } catch {}
    }
    if (!u) return;
    const n = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0);
    if (n < THRESHOLD) return;
    const k = Math.round(n / 1000);
    const ctx = `TOKEN WARNING: this session's context is already ~${k}k tokens, so every message is costly. Before doing the task, use AskUserQuestion once: 'Context is ~${k}k tokens. Optimise?' with options: 'Continue as is', 'Compact first (/compact)', 'Fresh session (/clear)', 'Use cheaper model'. Then follow their choice; if they pick compact/clear/model, tell them the command to type and wait.`;
    process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: ctx } }));
  } catch {}
});
