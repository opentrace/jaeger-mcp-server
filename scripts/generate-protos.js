

'use strict';

const cp = require('child_process');
const path = require('path');

const appRoot = process.cwd();
const rootBinDir = path.resolve(__dirname, '..', 'node_modules', '.bin');

const generatedPath = path.resolve(appRoot, './src/generated');
const protosPath = path.resolve(appRoot, './protos');
const protos = [
  'jaeger/api_v3/query_service.proto',
  'opentelemetry/proto/common/v1/common.proto',
  'opentelemetry/proto/resource/v1/resource.proto',
  'opentelemetry/proto/trace/v1/trace.proto',
].map(it => {
  return path.join(protosPath, it);
});

function exec(command, argv) {
  return new Promise((resolve, reject) => {
    const child = cp.spawn(command, argv, {
      shell: true,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    child.on('exit', (code, signal) => {
      if (code !== 0) {
        reject(new Error(`${command} exited with non-zero code(${code}, ${signal})`));
        return;
      }
      resolve();
    });
  });
}

function pbts(pbjsOutFile) {
  const pbtsOptions = [
    '-o', path.join(generatedPath, 'root.d.ts'),
  ];
  return exec(path.resolve(rootBinDir, 'pbts'), [...pbtsOptions, pbjsOutFile]);
}

async function pbjs(files) {
  const outFile = path.join(generatedPath, 'root.js');
  const pbjsOptions = [
    '-t', 'static-module',
    '-p', protosPath,
    '-w', 'commonjs',
    '--null-defaults',
    '-o', outFile,
  ];
  await exec(path.resolve(rootBinDir, 'pbjs'), [...pbjsOptions, ...files]);
  return outFile;
}

(async function main() {
  const pbjsOut = await pbjs(protos);
  await pbts(pbjsOut);
})();
