import fs from 'node:fs/promises';
import { spawn } from 'child_process';

/**
 * 
 * @param {*} chunk stream of data
 * @param {*} isBuild as opposed to isRuntime
 * @param {*} isStdOut as oppsed to isStdErr
 */
const handleChunk = (chunk, isBuild, isStdOut) => {
  console.log(chunk.toString());
}

// get all entries in run dir
const dirEntries = await fs.readdir('./', {withFileTypes: true});

// filter to only dirs that don't start with '.'
const subDirs = dirEntries.filter((dirEntry) => {
  return dirEntry.isDirectory() && !dirEntry.name.startsWith('.');
});

// this is bad code to force it to be synchronous
let mutex = false;
for (const dir of Object.values(subDirs)) {
  const name = dir.name;

  // horrible code, just make a promise next time :)
  if (mutex) {
    await new Promise(r => setTimeout(r, 100)); 
  }
  mutex = true;

  console.log(`\nBuilding ${name}\n`);

  const build = spawn('docker', ['build', `-t${name}`, '--progress', 'plain', name]);
  build.stdout.on('data', (chunk) => {
    handleChunk(chunk, true, true);
  });
  build.stderr.on('data', (chunk) => {
    handleChunk(chunk, true, false);
  });
  build.on('close', (code) => {
    console.log(`\nBuild closed with code ${code}\n`);
    if (code) {
      return;
    }
    const run = spawn('docker', ['run', name]);
    run.stdout.on('data', (chunk) => {
      handleChunk(chunk, false, true);
    });
    run.stderr.on('data', (chunk) => {
      handleChunk(chunk, false, false);
    })
    run.on('close', ()=> {
      mutex = false;
    })
  })
}
