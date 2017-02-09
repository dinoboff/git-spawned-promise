#!/usr/bin/env node --harmony_async_await

'use strict';

const gitPromise = require('../');

const [repo] = process.argv.slice(2);

init(repo)
  .then(([hash, feats]) => {
    console.log(`As of ${hash.slice(0, 7)}...`);
    console.log(feats.map(title => `  ${title}`).join('\n'));
  })
  .catch(err => console.log(`${err.stderr} (${err.code})`));

async function init(path = '.') {
  const git = gitPromise();

  // `run()`` ignores stdout.
  await git.run('init', path);
  await git.run('commit', '--allow-empty', '--message', 'chore: first commit');
  await git.run('commit', '--allow-empty', '--message', 'feat: first feature');
  await git.run('commit', '--allow-empty', '--message', 'fix: first fix');
  await git.run('commit', '--allow-empty', '--message', 'feat: second feature');

  // `get()` resolves with stdout
  const hash = git.get('parse-rev', 'HEAD');

  // `array` splits stdout stream and pipe transform stream.
  const cmd = ['log', '--format="%s"', '--no-merges', '--grep', 'feat', 'HEAD'];
  const map = msg => msg.slice(5).trim();
  const feats = git.array(...cmd, {map, sep: '\n'});

  return Promise.all([hash, feats]);
}
