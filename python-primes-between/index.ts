// https://en.wikipedia.org/wiki/Prime-counting_function#Table_of_%CF%80(x),_x/log(x),_and_li(x)

import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { Client } from 'delcom-client';
import { exit } from 'node:process';

dotenv.config();

const MAX = 1_000_000;
const INTERVAL = 35_000;
// const INTERVAL = MAX;
const MAX_LOCAL_WORKERS = 2;
const SLEEP_TIME_MS = 500;

const logPrimes = true;

const SUBFOLDER = 'tmp';
const DOCK_DIR = 'Dockerfile';
const PROG_DIR = 'primesBetween.py';

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

if (!fs.existsSync(SUBFOLDER)) {
  await fsp.mkdir(SUBFOLDER);
}

const outDirs: fs.PathLike[] = [];

await Promise.all(
  clients.map(async (client, idx) => {
    await client.init();
    if (idx < MAX_LOCAL_WORKERS) {
      await client.joinWorkforce();
    }
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
      await fsp.appendFile(
        progDir,
        `\n\nprimesBetween(${lower}, ${upper}, ${logPrimes?'True':'False'})`
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
            outDirs[idx] = res;
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

const values: number[][] = [];

try {
  await Promise.all(
    outDirs.map(async (val, idx) => {
      const file = await fsp.open(`${val}${path.sep}run_std_out`);
      values[idx] = [];
      for await (const line of file.readLines()) {
        values[idx].push(parseInt(line));
      }
    })
  );
} catch (err) {
  console.log('pall promise');
}

// console.log(values);

const sol = values.flat();

clients.forEach((client) => {
  try {
    client.quit();
  } catch (err) {
    console.log('here');
    console.log(err);
  }
});

if (logPrimes) {
  const ws = fs.createWriteStream('primes.txt');
  sol.forEach((val) => {
    ws.write(`${val}\n`);
  });
  ws.end();
  await new Promise<void>((res) => {
    ws.on('finish', ()=> {
      return res();
    })
  });
}

console.log(sol.length);

exit();
