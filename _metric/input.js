const logger = require('../_helper/logger');

const METRIC_TYPES = {
  INPUT_RECEIVED: 'SYS.METRIC.INPUT.INPUT_RECEIVED',
  DETAILED_INPUT_RECEIVED: 'SYS.LOG.INPUT.DETAILED_INPUT_RECEIVED',
};

module.exports.input = (inputPayload, context, inputMode, inputMeta) => {
  logger.info({
    type: METRIC_TYPES.INPUT_RECEIVED,
    functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
    functionVersion: process.env.AWS_LAMBDA_FUNCTION_VERSION,
    timeout: (context.getRemainingTimeInMillis) && context.getRemainingTimeInMillis(),
    logLevel: process.env.LOG_LEVEL || 'INFO',
    inputMode: inputMode,
    metaParams: inputMeta,
  }, { color: ['FgGreen', 'Reverse'] });
  logger.debug({
    type: METRIC_TYPES.DETAILED_INPUT_RECEIVED,
    env: JSON.stringify(process.env),
    inputPayload: JSON.stringify(inputPayload),
  }, { color: ['FgGreen'] });
}