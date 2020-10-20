const { FaultHandled } = require('./error')
let jsonStaticConfig;

module.exports = {
  get: (configName) => {
    if (!jsonStaticConfig) parseStaticConfig();
    return jsonStaticConfig[configName] || process.env[configName] || null;
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