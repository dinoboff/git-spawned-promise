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
  t.is(await git('rev-parse', '--git-dir'), gitDir);
});

test('can ignore stdout', async t => {
  const git = t.context.git;

  t.is(await git({ignore: true}, 'rev-parse', '--git-dir'), undefined);
  t.is(await git.run('rev-parse', '--git-dir'), undefined);
});

test('resolve with stdout by default', async t => {
  const git = t.context.git;
  const gitDir = t.context.gitDir;

  t.is(await git('rev-parse', '--git-dir'), gitDir);
  t.is(await git({}, 'rev-parse', '--git-dir'), gitDir);
});

test('resolve with stderr if git exit if non zero code', async t => {
  const git = t.context.git;
  const error = await t.throws(git('rev-parse', 'HEAD^2'));

  t.regex(error.stderr, /ambiguous argument 'HEAD\^2'/);
});

test('can return an array of line', async t => {
  const git = t.context.git;

  await git.run('commit', '--allow-empty', '--message', 'feat foo');
  await git.run('tag', 'v0.0.0');

  const tags = await git({sep: '\0'}, 'tag', '-l', '--format', '%(objectname)%00%(refname:strip=2)');

  t.is(tags.filter(item => item).length, 2);
  t.is(tags[1].trim(), 'v0.0.0');
});

test('can map items', async t => {
  const git = t.context.git;

  await git.run('commit', '--allow-empty', '--message', 'feat foo');
  await git.run('commit', '--allow-empty', '--message', 'fix foo');
  await git.run('commit', '--allow-empty', '--message', 'feat bar');

  function map(line) {
    const message = line.split(' ').slice(1).join(' ');

    return message.startsWith('feat') ? message : null;
  }

  const feats = await git.array({map}, 'log', '--oneline', 'HEAD');

  t.deepEqual(feats, ['feat bar', 'feat foo']);
});

function init() {
  const repo = tempfile();

  shell.mkdir('-p', repo);
  shell.exec(`git init`, {cwd: repo});

  return repo;
}
