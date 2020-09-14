const { FaultHandled } = require('../../util/error');
const outputMetric = require('../../metric/output');
const mode = 'OUTPUT_COMMAND_INVOKE';

module.exports = {
  response: ({ body, status = 200 }, meta) => {
    outputMetric.responseReturned({ body, status }, mode, meta);
    return body;
  },
  responseError: (error) => {
    error = FaultHandled.captureUnhanlded(error, { code: 'UHANDLED_OUTPUT_FAULT', layer: mode });
    outputMetric.responseErrorReturned(error, mode);
    throw JSON.stringify(error.get());
  },
}