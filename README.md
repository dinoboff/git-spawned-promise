# git-spawned-promise [![Build Status][ci-badge]][travis]

Run git command with `child_process.spawn`.

## Usage

Run a command. `stdout` and `stderr` are captured and used as resolve/reject
values:
```
const gitPromise = require('git-spawned-promise');

// gitDir is optional - you can let git find the repo in the parent directory.
const git = gitPromise({gitDir: process.env.GIT_DIR});

git(['rev-parse', 'HEAD'])
  .then(hash => console.log('hash:', hash))
  .catch(err => console.log(err.stderr));
```

You can ignore stdout by setting `ignore` option to true:
```
git(['init'], , {ignore: true})
  .catch(err => console.log(err.stderr));

// or
git.run('init')
  .catch(err => console.log(err.stderr));
```

To capture std in an array, define how to split or a map function:
```
function map(line) {
  return line.includes('fix') ? line : null;
}

git(['log', '--oneline', 'v1.0.0..v1.0.1'], {split: '\n', map})
  .then(fixes => console.log(fixes.join('\n')))

// or
git.array('log', '--oneline', 'v1.0.0..v1.0.1', {split: '\n', map})
  .then(fixes => console.log(fixes.join('\n')))
```

## install

using npm:

```
npm install -g git-spawned-promise
```

## License

MIT License

Copyright (c) 2017 Damien Lebrun


[hub]: https://github.com/github/hub#installation
[travis]: https://travis-ci.org/dinoboff/git-spawned-promise
[ci-badge]: https://travis-ci.org/dinoboff/git-spawned-promise.svg?branch=master
