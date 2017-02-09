# git-spawned-promise

[![Build Status][ci-badge]][travis]
[![Build Status (win)][ci-badge-win]][appveyor]
[![Coverage][codecov-badge]][codecov]
[![bitHound Overall Score][bithound-badge]][bithound]

Promisify a [git][git] [child process], settling once the process exit and its [stdio] streams and [transformers][transformer] close.


## Usage

Operations can ignore `stdout` (`run(...cmd)` method), can return it (`get(...cmd)`method) or can split it while transforming each element (`array(...cmd, {sep, map})`).

In any case, they capture `stderr` and reject errors when the exit codes are not zero, which will including `sdterr` in their messages and as a property:

```js
const gitSpawnedPromise = require('../');

async function init(path = '.') {
  const git = gitPromise();

  // `run()`` ignores stdout.
  await git.run('init', path);
  await git.run('commit', '--allow-empty', '--message', 'chore: first commit');
  await git.run('commit', '--allow-empty', '--message', 'feat: first feature');
  await git.run('commit', '--allow-empty', '--message', 'fix: first fix');
  await git.run('commit', '--allow-empty', '--message', 'feat: second feature');

  const log = ['log', '--format="%s"', '--no-merges', '--grep', 'feat', 'HEAD'];
  const map = msg => msg.slice(5).trim();

  const [hash, feats] = await Promise.all([
    // `get()` resolves with stdout
    git.get('parse-rev', 'HEAD'),

    // `array` splits stdout stream and pipe transform stream.
    git.array(...log, {map, sep: '\n'})
  ]);

  console.log(`Status up to ${hash.slice(0, 7)}...`);
  console.log(feats.map(title => `  ${title}`).join('\n'));
}

// stderr available (when the error is a git error).
init(repo)
  .catch(err => console.log(`${err.stderr} (${err.code})`));
```


## API

- `gitSpawnedPromise`: `function({gitDir: ?string}): GitClient`

  Bound a `GitClient` to a local repository.

- `GitClient`: `function(cmd: string[], ?options: ClientOption): Promise<any,Error>`

  Run the git command and settle once the git child process exit and the stdout/stderr pipe closes, or when either fail.

- `ClientOption`: `{ignore: ?boolean, sep: ?string, map: mapper[]}`

  * `ignore`: ignore stdout when set to `true` (`false` by default).
  * `sep`: separator to split the stream (default to `\n` if a mapper is provided).
  * `map`: when splitting a stream, apply each element and replace the returned value. If the value is a promise it will resolve it.

  if `sep` or `map` are set, the `gitCLient` `Promise` will resolve to an `Array`.

- `Mapper`: function(item: any): any

  A handler for a `stream.Transformer` for `stdout`. Unlike regular handler async values are passed via a `Promise` instead of a callback function, and returning `null` (or `Promise<null>)` does not close the stream; the Transformer would just skip the value.

  If the mapper throws or reject, the `GitClient` returned `Promise` will reject with that error.

- `GitClient.run`: `function(...cmd: string[]): Promise<void,GitError>`

  `gitClient.run(...cmd)` is equivalent to `gitClient(cmd, {capture: true})`.

- `GitClient.get`: `function(...cmd: string[]): Promise<string,GitError>`

  `gitClient.get(...cmd)` is equivalent to `gitClient(cmd)`.

- `GitClient.array`: `function(...cmd: string[], ?options: ClientOption): Promise<any[],Error>`

  `gitClient.array(...cmd)` is equivalent to `gitClient(cmd, {sep: '\n', map: someMapperOrMappperArray})`.



## Installation

using npm:

```shell
npm install git-spawned-promise
```


## License

MIT License

Copyright (c) 2017 Damien Lebrun

[git]: https://git-scm.com/
[child process]: https://nodejs.org/api/child_process.html#child_process_class_childprocess
[stdio]: https://nodejs.org/api/child_process.html#child_process_options_stdio
[transformer]: https://nodejs.org/api/stream.html#stream_duplex_and_transform_streams
[travis]: https://travis-ci.org/dinoboff/git-spawned-promise
[ci-badge]: https://travis-ci.org/dinoboff/git-spawned-promise.svg?branch=master
[appveyor]: https://ci.appveyor.com/project/dinoboff/git-spawned-promise/branch/master
[ci-badge-win]: https://ci.appveyor.com/api/projects/status/sgjrh23qgd1g5bd9/branch/master?svg=true
[bithound]: https://www.bithound.io/github/dinoboff/git-spawned-promise
[bithound-badge]: https://www.bithound.io/github/dinoboff/git-spawned-promise/badges/score.svg
[codecov]: https://codecov.io/gh/dinoboff/git-spawned-promise
[codecov-badge]: https://codecov.io/gh/dinoboff/git-spawned-promise/branch/master/graph/badge.svg
