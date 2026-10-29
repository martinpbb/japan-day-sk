#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import process from 'node:process';
import console from 'node:console';

function git(args, { allowFailure = false } = {}) {
  try {
    return execFileSync('git', args, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trimEnd();
  } catch (error) {
    if (allowFailure) return '';
    const stderr = error?.stderr?.toString().trim();
    throw new Error(stderr || `git ${args.join(' ')} failed`, {
      cause: error,
    });
  }
}

function parseArgs(argv) {
  const options = {
    format: 'markdown',
    from: 'Unspecified',
    to: 'Unspecified',
    task: 'Not provided',
    execPlan: 'Not provided',
    handoff: 'Not provided',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const value = argv[index + 1];
    if (arg === '--format' && value) options.format = value;
    else if (arg === '--from' && value) options.from = value;
    else if (arg === '--to' && value) options.to = value;
    else if (arg === '--task' && value) options.task = value;
    else if (arg === '--exec-plan' && value) options.execPlan = value;
    else if (arg === '--handoff' && value) options.handoff = value;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else continue;
    if (arg !== '--help' && arg !== '-h') index += 1;
  }
  return options;
}

function help() {
  console.log(
    `Usage: node collect-state.mjs [options]\n\nOptions:\n  --format markdown|json\n  --from NAME\n  --to NAME\n  --task PATH\n  --exec-plan PATH\n  --handoff PATH\n  --help`,
  );
}

function classifyStatus(lines) {
  let staged = 0;
  let unstaged = 0;
  let untracked = 0;
  let conflicted = 0;

  for (const line of lines) {
    const x = line[0] ?? ' ';
    const y = line[1] ?? ' ';
    if (x === '?' && y === '?') {
      untracked += 1;
      continue;
    }
    if (x !== ' ') staged += 1;
    if (y !== ' ') unstaged += 1;
    if (x === 'U' || y === 'U' || (x === 'A' && y === 'A') || (x === 'D' && y === 'D')) {
      conflicted += 1;
    }
  }
  return { staged, unstaged, untracked, conflicted };
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}

const options = parseArgs(process.argv.slice(2));
if (options.help) {
  help();
  process.exit(0);
}
if (!new Set(['markdown', 'json']).has(options.format)) {
  console.error('--format must be markdown or json');
  process.exit(2);
}

try {
  git(['rev-parse', '--is-inside-work-tree']);
  const branch = git(['branch', '--show-current']) || 'DETACHED';
  const head = git(['rev-parse', '--short', 'HEAD']);
  const statusRaw = git(['status', '--porcelain=v1', '--untracked-files=all'], {
    allowFailure: true,
  });
  const statusLines = statusRaw ? statusRaw.split(/\r?\n/).filter(Boolean) : [];
  const statusCounts = classifyStatus(statusLines);

  const changed = uniqueSorted([
    ...git(['diff', '--name-only'], { allowFailure: true }).split(/\r?\n/),
    ...git(['diff', '--cached', '--name-only'], { allowFailure: true }).split(/\r?\n/),
    ...statusLines.filter((line) => line.startsWith('??')).map((line) => line.slice(3)),
  ]);
  const migrations = changed.filter((path) => /(^|\/)migrations\/.*\.sql$/i.test(path));

  const result = {
    generatedAt: new Date().toISOString(),
    from: options.from,
    to: options.to,
    branch,
    head,
    workingTree: {
      clean: statusLines.length === 0,
      entries: statusLines.length,
      ...statusCounts,
    },
    authoritativeFiles: {
      task: options.task,
      execPlan: options.execPlan,
      handoff: options.handoff,
    },
    changedFiles: changed,
    migrations,
  };

  if (options.format === 'json') {
    console.log(JSON.stringify(result, null, 2));
  } else {
    const tree = result.workingTree.clean
      ? 'clean'
      : `dirty: ${result.workingTree.entries} entries; ${result.workingTree.staged} staged; ${result.workingTree.unstaged} unstaged; ${result.workingTree.untracked} untracked; ${result.workingTree.conflicted} conflicted`;
    const list = (items) =>
      items.length ? items.map((item) => `  - \`${item}\``).join('\n') : '  - None';
    console.log(
      `## AI handoff Git snapshot\n\n- Generated: ${result.generatedAt}\n- From: ${result.from}\n- To: ${result.to}\n- Branch: \`${result.branch}\`\n- HEAD: \`${result.head}\`\n- Working tree: ${tree}\n- Task: \`${result.authoritativeFiles.task}\`\n- ExecPlan: \`${result.authoritativeFiles.execPlan}\`\n- Existing handoff/log: \`${result.authoritativeFiles.handoff}\`\n\n### Changed files\n\n${list(result.changedFiles)}\n\n### Changed migrations\n\n${list(result.migrations)}`,
    );
  }
} catch (error) {
  console.error(`collect-state: ${error.message}`);
  process.exit(1);
}

