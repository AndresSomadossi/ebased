const outputMetric = require('../../_metric/output');
const { FaultHandled } = require('../../util/error');
const mode = 'OUTPUT_COMMAND_INVOKE';

module.exports = {
  response: ({ body = {}, status = 200 } = {}, meta) => {
    outputMetric.responseReturned({ body, status }, mode, meta);
    return body;
  },
  responseError: (error, meta) => {
    error = FaultHandled.captureUnhanlded(error, { code: 'UHANDLED_OUTPUT_FAULT', layer: mode });
    outputMetric.responseErrorReturned(error, mode, meta);
    throw JSON.stringify(error.get());
  },
}