const logLevels = {
  DEBUG: 1,
  INFO: 2,
  WARN: 3,
  ERROR: 4,
};
process.env.IS_LOCAL && (process.env.LOG_LEVEL = 'DEBUG');
const getCurrentLogLevel = () => logLevels[process.env.LOG_LEVEL] || logLevels['INFO'];

const addMetada = () => {
  const meta = {};
  if (process.env.traceId) meta.traceId = process.env.traceId;
  if (process.env.clientId) meta.clientId = process.env.clientId;
  if (process.env.trackingTag) meta.trackingTag = process.env.trackingTag;
  return meta;
}

const logger = level => async (log) => {
  if (getCurrentLogLevel() > logLevels[level]) return;
  if (typeof log === 'string') log = { message: log };
  const meta = addMetada();
  console.log({ level, ...log, meta });
};

module.exports = {
  debug: logger('DEBUG'),
  info: logger('INFO'),
  warn: logger('WARN'),
  error: logger('ERROR'),
};