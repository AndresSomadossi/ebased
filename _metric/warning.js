const logger = require('../_helper/logger');

const METRIC_TYPES = {
  VALIDATION_SKIPPED: 'SYS.LOG.WARINING.SCHEMA_VALIDATION_SKIPPED',
};

module.exports = {
  validationSkipped(layer) {
    logger.warn({
      type: METRIC_TYPES.VALIDATION_SKIPPED,
      layer: layer,
    }, { color: ['FgYellow', 'Reverse'] });
  },
}