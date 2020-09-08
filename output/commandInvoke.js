const { FaultHandled, Handled } = require('../utils/error');
const outputMetric = require('../metrics/output');
const mode = 'OUTPUT_COMMAND_INVOKE';

module.exports = {
  response: ({ body, status = 200 }, meta) => {
    outputMetric.responseReturned({ body, status }, mode, meta);
    return body;
  },
  responseError: (error) => {
    if (!(error instanceof Handled))
      error = new FaultHandled(`${error.name}-${error.message}`, { code: 'UHANDLED_OUTPUT_FAULT', layer: mode, });
    outputMetric.responseErrorReturned(error, mode);
    throw JSON.stringify(error.get());
  },
}