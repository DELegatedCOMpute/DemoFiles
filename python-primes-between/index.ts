/*
Define intervals
Create an empty list clients[]
for each interval:
  create and connect a DELCOM client
  copy Dockerfile primesBetween.py to new folder
  append primesBetween(x, y) to the end of the python file
  start the job
wait for all jobs to complete
Open all res.stdout files
Add the values up
wait for all files to be read
return value
*/

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'delcom-client';
import { exit } from 'node:process';
// import type { DelcomClient, DelcomClientConstructor } from 'delcom-client';

dotenv.config();

const MAX = 1_000_000;
const INTERVAL = 10_000;
const SLEEP_TIME_MS = 10000

const SUBFOLDER = 'tmp';
const DOCK_DIR = 'Dockerfile';
const PROG_DIR = 'primesBetween.py';

function sleep(ms: number) {
  return new Promise((resolve) => {
    console.log('sleep');
    setTimeout(resolve, ms)
  });
}

const IP = process.env.IP;
const PORT = parseInt(process.env.PORT || '');

if (!IP || !PORT) {
  console.error('no ip or port');
  exit();
}

const clients: Client[] = [];

// add the clients, doing this in order to reuse for ordered programs
for (let i = 0; i <= MAX; i+=INTERVAL) {
  clients.push(new Client(IP, PORT));
}

await Promise.all(
  clients.map(async (client) => {
    await client.init();
    await client.joinWorkforce();
}));

const outDirs: fs.PathLike[] = [];


if (!fs.existsSync(SUBFOLDER)) {
  await fsp.mkdir(SUBFOLDER);
}

await Promise.all(
  clients.map(async (client, idx) => {
    const lower = idx * INTERVAL + 1;
    const upper = Math.min((idx + 1) * INTERVAL, MAX);
    const dir = `${SUBFOLDER}${path.sep}${idx}`;
    const dockDir = `${dir}${path.sep}${DOCK_DIR}`;
    const progDir = `${dir}${path.sep}${PROG_DIR}`;

    if (!fs.existsSync(dir)) {
      await fsp.mkdir(dir);
    }
    try {
      await fsp.copyFile(DOCK_DIR, dockDir);
      await fsp.copyFile(PROG_DIR, progDir);
      await fsp.appendFile(progDir, `\n\nprimesBetween(${lower}, ${upper})`);
    } catch (err) {
      console.log('File error');
      console.log(err);
    }
    while (true) {
      try {
        const users = await client.getWorkers();
        // TODO fix with [0]
        if (users.res && users.res[idx] && users.res[idx].workerID) {
          const userID = users.res[idx].workerID;
          const res = await client.delegateJob(userID, [dockDir, progDir]);
          if (res.err) {
            console.log(`${idx} error ${res.err}`);
            console.log(res.err);
            console.log('here1');
            await sleep(SLEEP_TIME_MS);
            console.log('here2');
          } else {
            outDirs[idx] = res;
            console.log('res');
            return;
          }
        } else {
          await sleep(SLEEP_TIME_MS);
        }
      } catch (err) {
        console.log(`${idx} Error ${err}`);
        console.log(err);
      }
    }
  })
);

let sum = 0;
try {
  await Promise.all(outDirs.map(async (val) => {
    console.log(val);
    const file = await fsp.readFile(`${val}${path.sep}run_std_out`);
    console.log(file);
    console.log(file.toString());
    sum += file.toString().split('\n').length - 1;
  }));

} catch (err) {
  console.log('pall promise');
}

console.log(`\n\nThere are ${sum} primes between 1 and ${MAX}`);

