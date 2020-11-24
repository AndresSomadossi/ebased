const { FaultHandled } = require('./error');
const { missingConfig } = require('../_metric/warning');

/**
 * @var {Object} jsonStaticConfig Parsed and cached static settings
 */
let jsonStaticConfig;

module.exports = {
  /**
   * Gets a config from the static configs or defaults to env var
   * 
   * @param {String} configName The config var name
   * @param {String} defaultValue Default setting if fail to obtain from other sources
   */
  get: (configName, defaultValue = null) => {
    if (!jsonStaticConfig) parseStaticConfig();
    const value = jsonStaticConfig[configName] || process.env[configName] || defaultValue;
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