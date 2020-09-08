const Lambda = require('aws-sdk/clients/lambda');
const { captureAWSClient } = require('../utils/tracer');
const lambda = captureAWSClient(new Lambda());

const { LambdaCallMetric } = require('../metrics/downtreams/lambda');
const { FaultHandled, ErrorHandled, Handled } = require('../utils/error');

const LAYER = 'DOWNSTREAM_LAMBDA_CALL';
const CODES = {
  LAMBDA_CALL_FINISHED_OK: 'LAMBDA_CALL_FINISHED_OK',
  LAMBDA_CALL_CLIENT_ERROR: 'LAMBDA_CALL_CLIENT_ERROR',
  LAMBDA_CALL_SERVER_ERROR: 'LAMBDA_CALL_SERVER_ERROR',
  LAMBDA_CALL_INVOCATION_ERROR: 'LAMBDA_CALL_INVOCATION_ERROR',
};

module.exports = {
  invoke: async (invokeParams) => {
    invokeParams.InvocationType = 'RequestResponse';
    return await lambdaCall(invokeParams);
  },
  invokeAsync: async (invokeParams) => {
    invokeParams.InvocationType = 'Event';
    return await lambdaCall(invokeParams);
  },
}

async function lambdaCall(invokeParams) {
  try {
    const timeout = lambda.config.httpOptions.timeout;
    if (invokeParams.Payload) invokeParams.Payload = JSON.stringify(invokeParams.Payload);
    const metric = new LambdaCallMetric(invokeParams, timeout);
    const { Payload, StatusCode, ExecutedVersion } = await lambda.invoke(invokeParams).promise().catch(error => {
      metric.finish('null').setResponse({ level: 'error', code: CODES.LAMBDA_CALL_INVOCATION_ERROR, status: 500, }).publish();
      throw error;
    });
    metric.finish();
    const payload = await parsePayload(Payload).catch(error => {
      metric.setResponse({
        level: 'error',
        code: error.code,
        status: error.status,
        responsePayload: Payload,
        functionVersion: ExecutedVersion,
      }).publish();
      throw error;
    });
    metric.setResponse({
      level: 'info',
      code: CODES.LAMBDA_CALL_FINISHED_OK,
      status: StatusCode,
      responsePayload: Payload,
      functionVersion: ExecutedVersion,
    }).publish();
    return payload;
  } catch (error) {
    if (error instanceof Handled) throw error;
    throw new FaultHandled(`${error.name}-${error.message}`, { code: CODES.LAMBDA_CALL_INVOCATION_ERROR, layer: LAYER });
  }
}

async function parsePayload(Payload) {
  if (!Payload || Payload === 'null') return {};
  const payload = toJSON(Payload);
  // Error handling
  if (payload.errorMessage) {
    const payloadError = toJSON(payload.errorMessage);
    // Handled Downstream Error
    const { status, code, detail } = payloadError;
    if (status && code && detail) {
      if (status < 500) throw new ErrorHandled(detail, { code: code, status: status, layer: LAYER });
      else throw new FaultHandled(detail, { code: code, layer: LAYER });
    }
    // Unhandled Downstream Error
    throw new FaultHandled(payloadError, { code: CODES.LAMBDA_CALL_SERVER_ERROR, layer: LAYER });
  }
  return payload;
}

function toJSON(str) {
  try {
    const jsonPayload = JSON.parse(str);
    if (typeof jsonPayload !== 'object') throw new Error();
    return jsonPayload;
  } catch (error) {
    throw new FaultHandled('Malformed JSON in payload', { code: CODES.LAMBDA_CALL_SERVER_ERROR, layer: LAYER });
  }
}