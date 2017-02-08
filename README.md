# git-spawned-promise

[![Build Status][ci-badge]][travis]
[![Build Status (win)][ci-badge-win]][appveyor]
[![Coverage][codecov-badge]][codecov]
[![bitHound Overall Score][bithound-badge]][bithound]

Run git command with `child_process.spawn`.

## Usage

Run a command. `stdout` and `stderr` are captured and used as resolve/reject
values:
```js
const gitPromise = require('git-spawned-promise');

// gitDir is optional - you can let git find the repo in the parent directory.
const git = gitPromise({gitDir: process.env.GIT_DIR});

git(['rev-parse', 'HEAD'])
  .then(hash => console.log('hash:', hash))
  .catch(err => console.log(err.stderr));

// or
git.get('rev-parse', 'HEAD')
  .then(hash => console.log('hash:', hash))
  .catch(err => console.log(err.stderr));
```

You can ignore stdout by setting `ignore` option to true:
```js
git(['init'], , {ignore: true})
  .catch(err => console.log(err.stderr));

// or
git.run('init')
  .catch(err => console.log(err.stderr));
```

You can also split stdout (split lines by default):
```js
function map(line) {
  return line.includes('fix') ? line : null;
}

git(['log', '--oneline', 'v1.0.0..v1.0.1'], {sep: '\n', map})
  .then(fixes => console.log(fixes.join('\n')))

// or
git.array('log', '--oneline', 'v1.0.0..v1.0.1', {sep: '\n', map})
  .then(fixes => console.log(fixes.join('\n')))
```

## install

using npm:

```shell
npm install git-spawned-promise
```

## License

MIT License

Copyright (c) 2017 Damien Lebrun


[hub]: https://github.com/github/hub#installation
[travis]: https://travis-ci.org/dinoboff/git-spawned-promise
[ci-badge]: https://travis-ci.org/dinoboff/git-spawned-promise.svg?branch=master
[appveyor]: https://ci.appveyor.com/project/dinoboff/git-spawned-promise/branch/master
[ci-badge-win]: https://ci.appveyor.com/api/projects/status/sgjrh23qgd1g5bd9/branch/master?svg=true
[bithound]: https://www.bithound.io/github/dinoboff/git-spawned-promise
[bithound-badge]: https://www.bithound.io/github/dinoboff/git-spawned-promise/badges/score.svg
[codecov]: https://codecov.io/gh/dinoboff/git-spawned-promise
[codecov-badge]: https://codecov.io/gh/dinoboff/git-spawned-promise/branch/master/graph/badge.svg
