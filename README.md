# git-spawned-promise [![Build Status][ci-badge]][travis]

Run git command with `child_process.spawn`.

## Usage

Run a command. Std will be capture and used as part of an error message
```
const gitPromise = require('git-spawned-promise');

// gitDir is optional - you can let git find the repo in the parent directory.
const git = gitPromise({gitDir: process.env.GIT_DIR});

git(['init']).catch(err => err.stderr);
```

You can capture a command stdout with:
```
git(['rev-parse', 'HEAD'], {capture: true})
  .then(hash => console.log('hash:', hash));
```

To capture as an array, define how to split, a map function pr a filter function:
```
function map(line) {
  return line.includes('fix') ? line : null;
}

git(['log', '--oneline', 'v1.0.0..v1.0.1'], {split: '\n', map})
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
