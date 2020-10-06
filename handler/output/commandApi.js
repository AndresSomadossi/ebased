const outputMetric = require('../../_metric/output');
const { FaultHandled } = require('../../util/error');
const mode = 'OUTPUT_COMMAND_API';

module.exports = {
  response: ({ body = {}, status = 200 } = {}, meta) => {
    outputMetric.responseReturned({ body, status }, mode, meta);
    return {
      statusCode: status,
      body: (typeof body === 'string') ? body : JSON.stringify(body),
    };
  },
  responseError: (error, meta) => {
    error = FaultHandled.captureUnhanlded(error, { code: 'UHANDLED_OUTPUT_FAULT', layer: mode });
    outputMetric.responseErrorReturned(error, mode, meta);
    const { status, code, detail } = error.get()
    return { statusCode: status, body: JSON.stringify({ code, detail }) };
  },
}