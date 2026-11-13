import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const url = 'http://127.0.0.1:4176/';

export default async function globalSetup() {
  const server = spawn(process.execPath, [
    path.join(projectRoot, 'node_modules/vite/bin/vite.js'),
    '--configLoader', 'runner', '--host', '127.0.0.1', '--port', '4176', '--strictPort',
  ], { cwd: projectRoot, stdio: 'ignore', windowsHide: true });

  let processError;
  server.once('error', error => { processError = error; });
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    if (processError) throw processError;
    if (server.exitCode !== null || server.signalCode !== null) {
      throw new Error(`Community Vite server exited before becoming ready (code ${server.exitCode}, signal ${server.signalCode}).`);
    }
    try {
      const response = await fetch(url);
      if (response.ok) break;
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Community Vite server returned HTTP ${response.status}.`);
  } catch (error) {
    server.kill();
    await new Promise(resolve => server.once('exit', resolve));
    throw new Error(`Community Vite server did not become ready at ${url}`, { cause: error });
  }

  return async () => {
    if (server.exitCode === null && server.signalCode === null) {
      server.kill();
      await new Promise(resolve => server.once('exit', resolve));
    }
  };
}
