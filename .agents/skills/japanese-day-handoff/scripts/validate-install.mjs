#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';
import { Buffer } from 'node:buffer';
import console from 'node:console';

const root = resolve(process.argv[2] ?? process.cwd());
const atRoot = (path) => resolve(root, path);

const required = [
  'AGENTS.md',
  '.github/copilot-instructions.md',
  '.github/instructions/frontend.instructions.md',
  '.github/instructions/content.instructions.md',
  '.github/instructions/security.instructions.md',
  '.github/instructions/static-deployment.instructions.md',
  '.github/instructions/graphify.instructions.md',
  '.copilot/skills/graphify/SKILL.md',
  '.copilot/skills/graphify/references/query.md',
  '.copilot/skills/japan-day-project/SKILL.md',
  '.copilot/skills/japan-day-project/references/architecture.md',
  '.codex/skills/graphify/SKILL.md',
  '.codex/skills/graphify/references/query.md',
  '.codex/skills/japan-day-project/SKILL.md',
  '.codex/skills/japan-day-project/references/architecture.md',
  '.agents/skills/graphify/SKILL.md',
  '.agents/skills/japanese-day-handoff/SKILL.md',
  '.agents/skills/japanese-day-handoff/scripts/collect-state.mjs',
  '.agents/skills/japanese-day-handoff/scripts/validate-install.mjs',
  'docs/ai/WORKFLOW.md',
  'docs/ai/CONTEXT_AND_COST.md',
  'docs/ai/GRAPHIFY.md',
  'docs/ai/HANDOFF_TEMPLATE.md',
  'docs/codex/tasks/.gitkeep',
  'docs/notes/.gitkeep',
  'scripts/ai/setup-graphify.ps1',
];

let errors = 0;
let warnings = 0;

for (const path of required) {
  if (!existsSync(atRoot(path))) {
    console.error(`ERROR missing AI-support file: ${path}`);
    errors += 1;
  }
}

const copilotPath = atRoot('.github/copilot-instructions.md');
if (existsSync(copilotPath)) {
  const text = readFileSync(copilotPath, 'utf8');
  if (/^\s*@[^^\s]+/m.test(text)) {
    console.warn('WARN @file includes may not be portable across every Copilot surface; keep the bridge self-contained.');
    warnings += 1;
  }
  if (Buffer.byteLength(text, 'utf8') > 12000) {
    console.warn('WARN copilot-instructions.md exceeds 12 KB; review for repeated or task-specific context.');
    warnings += 1;
  }
}

const gitignorePath = atRoot('.gitignore');
if (existsSync(gitignorePath)) {
  const gitignore = readFileSync(gitignorePath, 'utf8');
  if (!/(^|\n)graphify-out\/?(\n|$)/.test(gitignore)) {
    console.warn('WARN graphify-out/ is not ignored; decide explicitly whether generated graphs should be committed.');
    warnings += 1;
  }
}

const graphifyTargets = [
  '.copilot/skills/graphify/SKILL.md',
  '.codex/skills/graphify/SKILL.md',
  '.agents/skills/graphify/SKILL.md',
];

const missingGraphifyTargets = graphifyTargets.filter((path) => !existsSync(atRoot(path)));
if (missingGraphifyTargets.length === 0) {
  console.log('INFO Copilot, Codex and generic project-scoped Graphify skills detected.');
} else {
  console.warn(`WARN incomplete project-scoped Graphify install: ${missingGraphifyTargets.join(', ')}`);
  warnings += 1;
}

console.log(`AI setup validation complete for ${root}: ${errors} error(s), ${warnings} warning(s).`);
process.exit(errors ? 1 : 0);
