// https://en.wikipedia.org/wiki/Prime-counting_function#Table_of_%CF%80(x),_x/log(x),_and_li(x)

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'delcom-client';
import { exit } from 'node:process';

dotenv.config();

const MAX = 10;
const NUM_WORKERS = 1;
const INTERVAL = Math.ceil(MAX/NUM_WORKERS);
// const INTERVAL = MAX;
const MAX_LOCAL_WORKERS = 0;
const SLEEP_TIME_MS = 500;

const DOCK_PATHNAME = 'Dockerfile';
const PROG_PATHNAME = 'sha256.py';
const OUTPUT_PATH_DIR = await fsp.mkdtemp(`${os.tmpdir()}${path.sep}shaout-`);
const OUTPUT_PATH = `${OUTPUT_PATH_DIR}${path.sep}sha256.txt`;

function getRandElement<T>(arr: T[] | undefined) {
  if (!arr || arr.length == 0) {
    return undefined;
  }
  return arr[Math.floor(Math.random() * arr.length)];
}

function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function sleepRand(ms: number) {
  return sleep(ms * (Math.random() + 1 / 2));
}

const IP = process.env.IP;
const PORT = parseInt(process.env.PORT || '');

if (!IP || !PORT) {
  console.error('no ip or port');
  exit();
}

const clients: Client[] = [];

// add the clients, doing this in order to reuse for ordered programs
for (let i = 0; i < MAX; i += INTERVAL) {
  clients.push(new Client(IP, PORT, { timeout: 10_000 }));
}

const values: string[][] = [];

await Promise.all(
  clients.map(async (client, idx) => {
    await client.init();
    if (idx < MAX_LOCAL_WORKERS) {
      await client.joinWorkforce();
    }
    const lower = idx * INTERVAL + 1;
    const upper = Math.min((idx + 1) * INTERVAL, MAX);
    const dir = await fsp.mkdtemp(`${os.tmpdir()}${path.sep}shajob-`);
    const dockDir = `${dir}${path.sep}${DOCK_PATHNAME}`;
    const progDir = `${dir}${path.sep}${PROG_PATHNAME}`;

    try {
      await fsp.copyFile(DOCK_PATHNAME, dockDir);
      await fsp.copyFile(PROG_PATHNAME, progDir);
      await fsp.appendFile(
        progDir,
        `\n\ngetSHA256Between(${lower}, ${upper})`
      );
    } catch (err) {
      console.log('File error');
      console.log(err);
    }
    while (true) {
      try {
        const users = await client.getWorkers();
        const rand = getRandElement(users.res);
        if (rand && rand.workerID) {
          const userID = rand.workerID;
          const { res, err } = await client.delegateJob(userID, [
            dockDir,
            progDir,
          ]);
          if (err) {
            await sleepRand(SLEEP_TIME_MS);
          } else if (res) {
            const file = await fsp.open(`${res}${path.sep}run_std_out`);
            values[idx] = [];
            for await (const line of file.readLines()) {
              values[idx].push(line);
            }
            return;
          }
        } else {
          await sleepRand(SLEEP_TIME_MS);
        }
      } catch (err) {
        console.log(`${idx} Error ${err}`);
        console.log(err);
      }
    }
  })
);

const sol = values.flat();

clients.forEach((client) => {
  try {
    client.quit();
  } catch (err) {
    console.log(err);
  }
});

const ws = fs.createWriteStream(OUTPUT_PATH);
sol.forEach((val) => {
  ws.write(`${val}\n`);
});
ws.end();
await new Promise<void>((res) => {
  ws.on('finish', ()=> {
    return res();
  })
});

console.log(`See ${OUTPUT_PATH}`);

exit();
