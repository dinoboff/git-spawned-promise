/**
 * Git client.
 *
 * @typedef {function(cmd: string[], opts: {ignore: boolean, map: Mapper[], sep, string}): Promise<any,Error>} GitClient
 * @typedef {function(item: object): Promise<any,Error>} Mapper
 */

'use strict';

const ps = require('child_process');

const getStream = require('get-stream');
const split = require('split');
const through = require('through2');

/**
 * Create a git client bound to a local repository.
 *
 * @param  {string} options.gitDir Path to the git repository (let git find the repository by default)
 * @return {GitClient}
 */
module.exports = function ({gitDir} = {}) {
  const gitDirOpts = gitDir == null ? [] : ['--git-dir', gitDir];

  const get = tryFn.bind(null, (...args) => {
    const proc = spawn(args, ['ignore', 'pipe', 'pipe']);

    return captureStdout(proc);
  });

  const array = tryFn.bind(null, (...args) => {
    const [cmd, options] = getOptions(...args);
    const proc = spawn(cmd, ['ignore', 'pipe', 'pipe']);

    return transformStdout(proc, options);
  });

  const run = tryFn.bind(null, (...args) => {
    const proc = spawn(args, ['ignore', 'ignore', 'pipe']);

    return waitFor(proc);
  });

  function spawn(args, stdio) {
    assertCmd(args);

    const cmd = [].concat(gitDirOpts, args);

    return ps.spawn('git', cmd, {stdio});
  }

  /**
   * Run a command and settle once the process exit.
   *
   * Resolve if it exit with 0; reject with an error including stderr otherwise.
   *
   * @param  {string[]}         cmd             Git subcommand to run
   * @param  {object}           [options]       Options
   * @param  {boolean}          options.ignore  Ignore stdout and resolve with void content when set to true.
   * @param  {Mapper|Mapper[]}  options.map     Transform items
   * @param  {string|RegExp}    options.sep     Token used to split the stdout (to map each part)
   * @return {Promise<any,Error>}
   */
  function git(cmd = [], options) {
    if (options == null) {
      return get(...cmd);
    }

    if (options.sep || options.map) {
      return array(...cmd, options);
    }

    if (options.ignore) {
      return run(...cmd);
    }

    return get(...cmd);
  }

  return Object.assign(git, {array, run});
};

function assertCmd(cmd) {
  if (cmd == null || cmd.length === 0) {
    throw new Error('no git command!');
  }
}

function getOptions(...args) {
  if (args.length === 0) {
    return [args];
  }

  const options = args.slice(-1).pop();

  if (typeof options === 'string') {
    return [args];
  }

  return [args.slice(0, -1), options];
}

/**
 * Capture stdout and resolve to settle once the proc exit.
 *
 * It will resolve to the stdout content if the exit code is 0; to stderr
 * otherwise.
 *
 * @param  {ChildProcess} proc Child process with stdout and stderr set to pipe.
 * @return {Promise<String,Error>}
 */
function captureStdout(proc) {
  const result = getStream(proc.stdout);

  return Promise.all([result, waitFor(proc)])
    .then(([result]) => result.trim());
}

/**
 * Capture stdout split it and map each item, and settle once the proc exit.
 *
 * It will resolve to the array of item if the exit code is 0; to stderr
 * otherwise.
 *
 * @param  {ChildProcess}    proc           Child process with stdout and stderr set to pipe.
 * @param  {Mapper|Mapper[]} options.map    Transform items
 * @param  {string|RegExp}   options.sep    Token used to split the stdout (to map each part)
 * @return {Promise<object[],Error>}
 */
function transformStdout(proc, {sep = '\n', map = []} = {}) {
  const result = new Promise((resolve, reject) => {
    let stream = proc.stdout.pipe(split(sep));

    for (const fn of [].concat(map)) {
      stream = stream.pipe(transformer(fn).on('error', reject));
    }

    const result = [];

    stream.on('data', item => result.push(item));
    stream.on('error', reject);
    stream.on('end', () => resolve(result));
  });

  return Promise.all([result, waitFor(proc)])
    .then(([result]) => result);
}

/**
 * Create a map Transform stream.
 *
 * If the the mapper function return null, it will skip that item (it will
 * not close the stream).
 *
 * If the mapper reject, the stream will emit an error.
 *
 * @param  {function(object): Promise<object,Error>} mapper Mapper function.
 * @return {Transform}
 */
function transformer(mapper) {
  return through.obj(
    (item, enc, callback) => {
      tryFn(mapper, item)
        .then(val => callback(null, val === null ? undefined : val))
        .catch(callback);
    }
  );
}

/**
 * Wrap the function in a promise.
 *
 * Ensure the function returns a promise and capture any thrown error.
 *
 * @param  {function}  fn   Function to wrap
 * @param  {...[type]} args Arguments to call the function with
 * @return {Promise<any,Error>}
 */
function tryFn(fn, ...args) {
  return new Promise(resolve => resolve(fn(...args)));
}

/**
 * Report git child process error.
 */
class GitError extends Error {

  /**
   * Error displaying the child process argument, the exit code and a message.
   *
   * @param  {ChildProcess} proc    ChildProcess to report about.
   * @param  {number}       code    Its exit code
   * @param  {string}       stderr  An error message.
   */
  constructor(proc, code, stderr) {
    const msg = `"${proc.spawnargs.join(' ')}", code: ${code}, stderr:\n\n${stderr}\n`;

    super(msg);

    this.args = proc.spawnargs;
    this.code = code;
    this.stderr = stderr;
  }

}

/**
 * Settle once the process exits.
 *
 * Resolve if the process exit code is zero.
 *
 * Reject with an error message set to stderr content if the exit code is not zero.
 *
 * @param  {ChildProcess} proc Child process with stderr set to pipe.
 * @return {Promise<void,Error>}
 */
function waitFor(proc) {
  const stderr = getStream(proc.stderr);
  const code = new Promise((resolve, reject) => {
    proc.on('error', reject);
    proc.on('exit', code => resolve(code));
  });

  return Promise.all([code, stderr]).then(([code, stderr]) => {
    if (code === 0) {
      return;
    }

    return Promise.reject(new GitError(proc, code, stderr));
  });
}
