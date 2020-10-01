const Lambda = require('aws-sdk/clients/lambda');
const { DownstreamCommandMetric } = require('../../_metric/downstreamCommand');
const { DownstreamEventMetric } = require('../../_metric/downstreamEvent');
const { FaultHandled, ErrorHandled } = require('../../util/error');
const { captureAWSClient } = require('../../_helper/tracer');
const lambda = captureAWSClient(new Lambda());

const CODES = {
  LAMBDA_INVOKE_FINISHED_OK: 'LAMBDA_INVOKE_FINISHED_OK',
  LAMBDA_INVOKE_SERVER_FAULT: 'LAMBDA_INVOKE_SERVER_FAULT',
  LAMBDA_INVOKE_INVOCATION_FAULT: 'LAMBDA_INVOKE_INVOCATION_FAULT',
  LAMBDA_ASYNC_INVOKE_DELIVERY_OK: 'LAMBDA_ASYNC_INVOKE_DELIVERY_OK',
  LAMBDA_ASYNC_INVOKE_DELIVERY_FAULT: 'LAMBDA_ASYNC_INVOKE_DELIVERY_FAULT',
};
const layer = 'DOWNSTREAM_LAMBDA';

module.exports = {
  invoke: async (invokeParams, commandMeta) => {
    try {
      invokeParams.InvocationType = 'RequestResponse';
      injectMeta(invokeParams, commandMeta);
      if (invokeParams.Payload) invokeParams.Payload = JSON.stringify(invokeParams.Payload);
      const timeout = lambda.config.httpOptions.timeout;
      const metric = new DownstreamCommandMetric(`${layer}_INVOKE`);
      metric.setRequest(timeout, invokeParams.FunctionName, invokeParams.Payload);
      const { Payload, StatusCode } = await lambda.invoke(invokeParams).promise().catch(error => {
        metric.finish(true).setResponse(CODES.LAMBDA_ASYNC_INVOKE_DELIVERY_FAULT, 500).publish();
        throw error;
      });
      const payload = await parsePayload(Payload).catch(error => {
        metric.finish().setResponse(error.code, error.status, Payload).publish();
        throw error;
      });
      metric.finish().setResponse(CODES.LAMBDA_INVOKE_FINISHED_OK, StatusCode, Payload).publish();
      return payload;
    } catch (error) {
      throw FaultHandled.captureUnhanlded(error, { code: CODES.LAMBDA_ASYNC_INVOKE_DELIVERY_FAULT, layer });
    }
  },
  invokeAsync: async (invokeParams, eventMeta) => {
    try {
      invokeParams.InvocationType = 'Event';
      injectMeta(invokeParams, eventMeta);
      if (invokeParams.Payload) invokeParams.Payload = JSON.stringify(invokeParams.Payload);
      const timeout = lambda.config.httpOptions.timeout;
      const metric = new DownstreamEventMetric(`${layer}_ASYNC_INVOKE`, timeout, invokeParams.FunctionName, invokeParams.Payload);
      await lambda.invoke(invokeParams).promise().catch(error => {
        metric.finish(true).setCode(CODES.LAMBDA_ASYNC_INVOKE_DELIVERY_FAULT).publish();
        throw error;
      });
      metric.finish().setCode({ code: CODES.LAMBDA_ASYNC_INVOKE_DELIVERY_OK }).publish();
    } catch (error) {
      throw FaultHandled.captureUnhanlded(error, { code: CODES.LAMBDA_ASYNC_INVOKE_DELIVERY_FAULT, layer });
    }
  },
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
      if (status < 500) throw new ErrorHandled(detail, { code: code, status: status, layer });
      else throw new FaultHandled(detail, { code: code, layer });
    }
    // Unhandled Downstream Error
    throw new FaultHandled(payloadError, { code: CODES.LAMBDA_INVOKE_SERVER_FAULT, layer });
  }
  return payload;
}

function toJSON(str) {
  try {
    const jsonPayload = JSON.parse(str);
    if (typeof jsonPayload !== 'object') throw new Error();
    return jsonPayload;
  } catch (error) {
    throw new FaultHandled('Malformed JSON in payload', { code: CODES.LAMBDA_INVOKE_SERVER_FAULT, layer });
  }
}

function injectMeta(invokeParams, meta) {
  if (meta) invokeParams.Payload.meta = meta;
}