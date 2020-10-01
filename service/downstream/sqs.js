const SQS = require('aws-sdk/clients/sqs');
const { DownstreamEventMetric } = require('../../_metric/downstreamEvent');
const { FaultHandled } = require('../../util/error');
const { captureAWSClient } = require('../../_helper/tracer');
const sqs = captureAWSClient(new SQS());

const layer = 'DOWNSTREAM_SQS';
const CODES = {
  SQS_SEND_DELIVERY_OK: 'SQS_SEND_DELIVERY_OK',
  SQS_SEND_DELIVERY_FAULT: 'SQS_SEND_DELIVERY_FAULT',
};

module.exports = {
  send: async (sendParams, eventMeta) => {
    try {
      sendParams.QueueUrl = arnCheck(sendParams.QueueUrl);
      sendParams.MessageBody = JSON.stringify(sendParams.MessageBody);
      injectMeta(sendParams, eventMeta);
      const timeout = sqs.config.httpOptions.timeout;
      const { QueueUrl, MessageBody, MessageAttributes = {} } = sendParams;
      const metric = new DownstreamEventMetric(layer, timeout, QueueUrl, { MessageBody, MessageAttributes });
      await sqs.sendMessage(sendParams).promise().catch(error => {
        metric.finish().setCode(CODES.SQS_SEND_DELIVERY_FAULT).publish();
        throw error;
      });
      metric.finish().setCode(CODES.SQS_SEND_DELIVERY_OK).publish();
    } catch (error) {
      throw FaultHandled.captureUnhanlded(error, { code: CODES.SQS_SEND_DELIVERY_FAULT, layer });
    }
  },
}

const arnCheck = (QueueUrl) => {
  if (!QueueUrl) throw new Error('missing QueueUrl');
  if (QueueUrl.startsWith('https')) return QueueUrl;
  return `https://sqs.${process.env.REGION}.amazonaws.com/${process.env.ACCOUNT_ID}/${QueueUrl}`;
}

function injectMeta(sendParams, eventMeta) {
  if (eventMeta) {
    sendParams.MessageAttributes = {};
    Object.keys(eventMeta).forEach(eventMetaKey => {
      const el = eventMeta[eventMetaKey];
      sendParams.MessageAttributes[eventMetaKey] = {
        StringValue: (typeof el === 'string') ? el : JSON.stringify(el),
        DataType: 'String'
      };
    });
  }
}