import fs from 'node:fs';
import path from 'node:path'
import { spawn } from 'child_process';

const handleChunk = (chunk, writeStream) => {
  writeStream.write(chunk.toString());
}

// get all entries in run dir
const dirEntries = await fs.promises.readdir('./', {withFileTypes: true});

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
  const buildOutStream = fs.createWriteStream(`${name}${path.sep}${name}.build.out`, {flags: 'w'});
  const buildErrStream = fs.createWriteStream(`${name}${path.sep}${name}.build.err`, {flags: 'w'});
  const build = spawn('docker', ['build', `-t${name}`, '--progress=plain', name]);
  build.stdout.on('data', (chunk) => {
    handleChunk(chunk, buildOutStream);
  });
  build.stderr.on('data', (chunk) => {
    handleChunk(chunk, buildErrStream);
  });
  build.on('close', async (code) => {
    console.log(`\nBuild closed with code ${code}\n`);
    buildOutStream.close();
    buildErrStream.close();
    const runOutStream = fs.createWriteStream(`${name}${path.sep}${name}.run.out`, {flags: 'w'});
    const runErrStream = fs.createWriteStream(`${name}${path.sep}${name}.run.err`, {flags: 'w'});
    if (code) {
      return;
    }
    const run = spawn('docker', ['run', name]);
    run.stdout.on('data', (chunk) => {
      handleChunk(chunk, runOutStream);
    });
    run.stderr.on('data', (chunk) => {
      handleChunk(chunk, runErrStream);
    })
    run.on('close', ()=> {
      buildOutStream.close();
      buildErrStream.close();
      mutex = false;
    })
  })
}
