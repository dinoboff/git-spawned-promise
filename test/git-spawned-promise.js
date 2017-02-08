import path from 'path';

import test from 'ava';
import shell from 'shelljs';
import tempfile from 'tempfile';

import gitPromise from '../';

shell.config.silent = true;

test.beforeEach(t => {
  const repo = init();
  const gitDir = path.join(repo, '.git');

  t.context.repo = repo;
  t.context.gitDir = gitDir;
  t.context.git = gitPromise({gitDir});
});

test.afterEach.always(t => {
  shell.rm('-rf', t.context.repo);
});

test('is bound to gitDir', async t => {
  const git = t.context.git;
  const gitDir = t.context.gitDir;

  t.truthy(gitDir);
  t.is(await git(['rev-parse', '--git-dir']), gitDir);
});

test('let git find gitDir', async t => {
  t.is(await gitPromise()(['rev-parse', '--git-dir']), '.git');
  t.is(await gitPromise({gitDir: undefined})(['rev-parse', '--git-dir']), '.git');
  t.is(await gitPromise({gitDir: null})(['rev-parse', '--git-dir']), '.git');
});

test('can ignore stdout', async t => {
  const git = t.context.git;

  t.is(await git(['rev-parse', '--git-dir'], {ignore: true}), undefined);
  t.is(await git.run('rev-parse', '--git-dir'), undefined);
});

test('resolve with stdout by default', async t => {
  const git = t.context.git;
  const gitDir = t.context.gitDir;

  t.is(await git(['rev-parse', '--git-dir']), gitDir);
  t.is(await git(['rev-parse', '--git-dir'], {}), gitDir);
});

test('resolve with stderr if git exit if non zero code', async t => {
  const git = t.context.git;
  const error = await t.throws(git(['rev-parse', 'HEAD^2']));

  t.regex(error.stderr, /ambiguous argument 'HEAD\^2'/);
});

test('can return an array', async t => {
  const git = t.context.git;

  await git.run('commit', '--allow-empty', '--message', 'feat foo');
  await git.run('tag', 'v0.0.0');

  const cmd = ['tag', '-l', '--format', '%(objectname)%00%(refname:strip=2)'];
  const tags = await git(cmd, {sep: '\0'});

  t.is(tags.filter(item => item).length, 2);
  t.is(tags[1].trim(), 'v0.0.0');
});

test('split line by default', async t => {
  const git = t.context.git;

  await git.run('commit', '--allow-empty', '--message', 'feat foo');
  await git.run('tag', 'v0.0.0');
  await git.run('tag', 'alpha');

  const tags = await git.array('tag', '--list');

  t.deepEqual(tags, ['alpha', 'v0.0.0', '']);
});

test('can map items', async t => {
  const git = t.context.git;

  await git.run('commit', '--allow-empty', '--message', 'feat foo');
  await git.run('commit', '--allow-empty', '--message', 'fix foo');
  await git.run('commit', '--allow-empty', '--message', 'feat bar');

  function msg(line) {
    return line.slice(8);
  }

  function keep(type) {
    return msg => ((msg.startsWith(type) && msg) || null);
  }

  const feats = await git.array('log', '--oneline', 'HEAD', {map: [msg, keep('feat')]});

  t.deepEqual(feats, ['feat bar', 'feat foo']);
});

test('reject if the command list is empty', async t => {
  const git = t.context.git;

  await t.throws(git(), /no git command/);
  await t.throws(git.array(), /no git command/);
  await t.throws(git.run(), /no git command/);
});

function init() {
  const repo = tempfile();

  shell.mkdir('-p', repo);
  shell.exec('git init', {cwd: repo});
  shell.exec('git config user.email "you@example.com"', {cwd: repo});
  shell.exec('git config user.name "Alice Smith"', {cwd: repo});

  return repo;
}
