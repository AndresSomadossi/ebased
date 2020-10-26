const yml = require('js-yaml');
const logLevels = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};
const COLOR = {
  Reset: "\x1b[0m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",
  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m",
};

process.env.IS_LOCAL && (process.env.LOG_LEVEL = 'DEBUG');
const getCurrentLogLevel = () => logLevels[process.env.LOG_LEVEL] || logLevels['INFO'];
const addMetada = () => {
  const meta = {};
  if (process.env.traceId) meta.traceId = process.env.traceId;
  if (process.env.clientId) meta.clientId = process.env.clientId;
  if (process.env.trackingTag) meta.trackingTag = process.env.trackingTag;
  return meta;
};

const print = (log, ops) => {
  if (process.env.IS_LOCAL) {
    const ymlArray = yml.dump(log).split('\n');
    const color = (ops && Array.isArray(ops.color)) ? ops.color.map(c => COLOR[c]) : [''];
    console.log(...color, ymlArray.shift(), COLOR.Reset, '\n', ymlArray.join('\n'), '\n');
  } else console.log(log);
}

const logger = level => async (log, ops = {}) => {
  if (getCurrentLogLevel() > logLevels[level]) return;
  if (typeof log === 'string') log = { message: log };
  const meta = addMetada();
  print({ ...log, level, meta }, ops);
};

module.exports = {
  debug: logger('DEBUG'),
  info: logger('INFO'),
  warn: logger('WARN'),
  error: logger('ERROR'),
};