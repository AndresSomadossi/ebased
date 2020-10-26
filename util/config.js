const { FaultHandled } = require('./error')
const { missingConfig } = require('../_metric/warning')
let jsonStaticConfig;

module.exports = {
  get: (configName) => {
    if (!jsonStaticConfig) parseStaticConfig();
    const value = jsonStaticConfig[configName] || process.env[configName] || null;
    if (value === null) missingConfig(configName, 'GET_STATIC_CONFIG');
    return value;
  }
}

const parseStaticConfig = () => {
  const staticConfig = process.env.STATIC_CONFIG;
  if (staticConfig === undefined) return jsonStaticConfig = {};
  try {
    jsonStaticConfig = JSON.parse(staticConfig);
  } catch (error) {
    throw new FaultHandled(staticConfig, { code: 'INVALID_STATIC_CONFIG_FAULT', layer: 'CONFIG' })
  }
}