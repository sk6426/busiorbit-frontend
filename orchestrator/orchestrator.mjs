// orchestrator/orchestrator.mjs
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { execSync, spawnSync } from 'child_process';
import OpenAI from 'openai';

const root = process.cwd();

// 1) Load env from .env.local then .env
dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(root, '.env') });

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY. Put it in .env or .env.local at repo root.');
}

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---- config loader (config.json takes priority, then project.config.json) ----
function loadCfg() {
  const c1 = path.join(root, 'orchestrator', 'config.json');
  const c2 = path.join(root, 'orchestrator', 'project.config.json');
  const file = fs.existsSync(c1) ? c1 : (fs.existsSync(c2) ? c2 : null);
  if (!file) throw new Error('No orchestrator/config.json or project.config.json found.');
  const cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
  // reasonable defaults
  cfg.repoName ||= 'xbytechat-ui';
  cfg.branchPrefix ||= 'feat/agent';
  cfg.testCommand ||= 'npx playwright test';
  cfg.contextMaxFiles ||= 120;
  cfg.contextGlobs ||= ['src/**/*', 'tests/e2e/**/*', 'playwright.config.ts', 'package.json'];
  cfg.allowedWriteRoots ||= ['src', 'tests', 'orchestrator'];
  return cfg;
}
const cfg = loadCfg();

// ---- model selection ----
const MODEL = cfg.model || process.env.OPENAI_MODEL || 'gpt-5-mini';

const IDEA_DEFAULT_PATH = path.join(root, 'orchestrator', 'IDEA.md');
const SYS_PROMPT_DEFAULT = path.join(root, 'orchestrator', 'prompts', 'system.orchestrator.md');

// ---- small argv helpers ----
function getArg(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1) return null;
  return process.argv[idx + 1] && !process.argv[idx + 1].startsWith('-')
    ? process.argv[idx + 1]
    : null;
}
function hasFlag(flag) {
  return process.argv.includes(flag);
}
function readStdin() {
  return new Promise(resolve => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => (data += chunk));
    process.stdin.on('end', () => resolve(data));
    if (process.stdin.isTTY) resolve(''); // nothing piped
  });
}

// ---- load task idea (several sources) ----
async function loadIdea() {
  const inline = getArg('--idea');
  const ideaFile = getArg('--idea-file');
  const useStdin = hasFlag('--stdin');

  if (inline) return inline;
  if (ideaFile) {
    const abs = path.isAbsolute(ideaFile) ? ideaFile : path.join(root, ideaFile);
    if (!fs.existsSync(abs)) throw new Error(`--idea-file not found: ${abs}`);
    return fs.readFileSync(abs, 'utf8');
  }
  if (useStdin) {
    const piped = await readStdin();
    if (!piped.trim()) throw new Error('No stdin provided for --stdin.');
    return piped;
  }
  if (!fs.existsSync(IDEA_DEFAULT_PATH)) {
    throw new Error('Missing orchestrator/IDEA.md. Create it or use --idea / --idea-file / --stdin.');
  }
  return fs.readFileSync(IDEA_DEFAULT_PATH, 'utf8');
}

// ---- load system prompt (allow override) ----
function loadSystemPrompt() {
  const override = getArg('--system-file');
  const file = override
    ? (path.isAbsolute(override) ? override : path.join(root, override))
    : SYS_PROMPT_DEFAULT;
  if (!fs.existsSync(file)) {
    throw new Error(`System prompt not found: ${file}`);
  }
  return fs.readFileSync(file, 'utf8');
}

// ---- repo context (very light globbing) ----
function listFilesForContext() {
  const globs = cfg.contextGlobs || [];
  const matches = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(p);
      } else {
        matches.push(p);
      }
    }
  }

  for (const g of globs) {
    const stop = g.indexOf('*');
    const base = stop === -1 ? g : g.slice(0, stop);
    const baseAbs = path.join(root, base);
    if (fs.existsSync(baseAbs)) {
      try { walk(baseAbs); } catch { /* ignore */ }
    }
  }

  const max = cfg.contextMaxFiles || 120;
  return matches.slice(0, max).map(p => {
    const safe = path.relative(root, p);
    let snippet = '';
    try { snippet = fs.readFileSync(p, 'utf8').slice(0, 4000); } catch { /* ignore */ }
    return { path: safe, snippet };
  });
}

// ---- write guard ----
function ensureAllowedWrite(targetRel) {
  if (targetRel === 'playwright.config.ts') return true;
  const first = targetRel.split(/[\\/]/)[0];
  return (cfg.allowedWriteRoots || []).includes(first);
}
function writeChange(change) {
  const rel = change.path.replace(/^[\\/]+/, '');
  if (!ensureAllowedWrite(rel)) {
    throw new Error(`Write blocked outside allowed roots: ${rel}`);
  }
  const abs = path.join(root, rel);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, change.content, 'utf8');
}

// ---- OpenAI call (Responses API) ----
async function callPlanner(idea, repoContext) {
  const system = loadSystemPrompt();

  const response = await client.responses.create({
    model: MODEL,
    reasoning: { effort: 'medium' },
    input: [
      { role: 'system', content: [{ type: 'input_text', text: system }] },
      {
        role: 'user',
        content: [
          { type: 'input_text', text: `IDEA:\n${idea}` },
          {
            type: 'input_text',
            text: `REPO CONTEXT (trimmed):\n${JSON.stringify(repoContext).slice(0, 150000)}`
          }
        ]
      }
    ],
    text: {
      format: {
        type: 'json_schema',
        name: 'OrchestratorPlan',
        strict: true,
        schema: {
          type: 'object',
          additionalProperties: false,
          required: ['plan', 'changes', 'test_updates', 'post_steps'],
          properties: {
            plan: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['step', 'rationale'],
                properties: {
                  step: { type: 'string' },
                  rationale: { type: 'string' }
                }
              }
            },
            changes: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['path', 'action', 'content'],
                properties: {
                  path: { type: 'string' },
                  action: { type: 'string', enum: ['create', 'overwrite'] },
                  content: { type: 'string' }
                }
              }
            },
            test_updates: {
              type: 'array',
              items: {
                type: 'object',
                additionalProperties: false,
                required: ['path', 'action', 'content'],
                properties: {
                  path: { type: 'string' },
                  action: { type: 'string', enum: ['create', 'overwrite'] },
                  content: { type: 'string' }
                }
              }
            },
            post_steps: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    }
  });

  const raw = response.output_text;
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error('Model did not return valid JSON. Raw:\n' + raw);
  }
  return parsed;
}

// ---- shell helpers ----
function run(cmd, opts = {}) {
  const res = spawnSync(cmd, { shell: true, stdio: 'inherit', ...opts });
  if (res.status !== 0) throw new Error(`Command failed: ${cmd}`);
}
function safeBranchName(title) {
  const slug = (title || 'change')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `${cfg.branchPrefix || 'feat/agent'}/${slug || 'change'}`;
}

// ---- main ----
async function main() {
  const idea = await loadIdea();
  const repoContext = { repo: cfg.repoName, files: listFilesForContext() };

  console.log('🤖 Planning & coding with model:', MODEL);
  const plan = await callPlanner(idea, repoContext);
  console.log('Plan:\n' + (plan.plan || []).map(p => `• ${p.step}`).join('\n'));

  [...(plan.changes || []), ...(plan.test_updates || [])].forEach(writeChange);

  console.log('\n🧪 Running tests:', cfg.testCommand);
  run(cfg.testCommand, { cwd: root });

  const firstStep = plan.plan?.[0]?.step || 'update';
  const branch = safeBranchName(firstStep);
  try { execSync(`git rev-parse --verify ${branch}`, { stdio: 'ignore' }); }
  catch { run(`git checkout -b ${branch}`); }

  run('git add -A');
  run(`git commit -m "agent: ${firstStep} [orchestrated]"`);

  console.log(`\n✅ Green! Push this branch:
  git push -u origin ${branch}

Notes:
- ${(plan.post_steps || []).join('\n- ')}`);
}

main().catch(err => {
  console.error('\n❌ Orchestration failed:', err?.message || err);
  process.exit(1);
});
