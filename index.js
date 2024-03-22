import fs from 'node:fs/promises';
import { exec } from 'child_process';
import util from 'node:util'

const my_exec = util.promisify(exec);

// get all entries in run dir
const dir_entries = await fs.readdir('./', {withFileTypes: true});

// filter to only dirs that don't start with '.'
const sub_dirs = dir_entries.filter((dir_entry) => {
  return dir_entry.isDirectory() && !dir_entry.name.startsWith('.');
});

const res = {};

// docker build -t {name} {dir}
// docker run {name}

const promises = sub_dirs.map(async (dir) => {
  
  const name = dir.name;
  res[name] = {};

  console.log(`Starting ${name}`);

  const build_out = await my_exec(`docker build -t ${name} ${name}`);
  res[name].build = build_out;

  console.log(`Built ${name}`);

  const run_out = await my_exec(`docker run ${name}`);
  if ((await fs.readdir(dir.name)).includes('.fake-json')) {
    run_out.stdout = JSON.parse(run_out.stdout);
  }
  res[name].run = run_out;
  console.log(`Finished ${name}`);
})

await Promise.all(promises);

console.log(res);
