const logger = require('../_helper/logger');

const METRIC_TYPES = {
  VALIDATION_SKIPPED: 'SYS.LOG.WARINING.SCHEMA_VALIDATION_SKIPPED',
  MISSING_CONFIG: 'SYS.LOG.WARINING.MISSING_CONFIG',
};

module.exports = {
  validationSkipped(layer) {
    logger.warn({
      layer,
      type: METRIC_TYPES.VALIDATION_SKIPPED,
    }, { color: ['FgYellow', 'Reverse'] });
  },
  missingConfig(name, layer) {
    logger.warn({
      name,
      layer,
      type: METRIC_TYPES.MISSING_CONFIG,
    }, { color: ['FgYellow', 'Reverse'] });
  },
}