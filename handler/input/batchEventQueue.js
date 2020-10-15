const SQS = require('aws-sdk/clients/sqs');
const sqs = new SQS();
const inputMetric = require('../../_metric/input');
const { Metadata } = require('../../_helper/metadata');
const { FaultHandled } = require('../../util/error');
const mode = 'INPUT_BATCH_EVENT_QUEUE';

module.exports = {
  batchEventReceived: async (event = {}, context = {}) => {
    try {
      const rawEvent = event;
      const { id, source, time, specversion, tracedDuration, clientId, trackingTag } = event.messageAttributes;
      const eventPayload = JSON.parse(event.body);
      const eventMeta = new Metadata(context, {
        traceId: event.attributes.AWSTraceHeader,
        id: id && id.stringValue,
        source: source && source.stringValue,
        time: time && parseInt(time.stringValue),
        specversion: specversion && specversion.stringValue,
        tracedDuration: tracedDuration && JSON.parse(tracedDuration.stringValue),
        clientId: clientId && clientId.stringValue,
        trackingTag: trackingTag && trackingTag.stringValue,
      });
      inputMetric.input(event, context, mode, eventMeta.get());
      return { eventPayload, eventMeta, rawEvent };
    } catch (error) {
      throw new FaultHandled(error.message, { code: 'BAD_INPUT_PROTOCOL_ERROR', layer: mode });
    }
  },
  commitEvent: async (rawEvent) => {
    const { receiptHandle, eventSourceARN, messageAttributes = {} } = rawEvent;
    const arr = eventSourceARN.split(':');
    const QueueUrl = `https://sqs.${arr[3]}.amazonaws.com/${arr[4]}/${arr[5]}`;
    if (!process.env.IS_LOCAL)
      await sqs.deleteMessage({ QueueUrl, ReceiptHandle: receiptHandle }).promise();
    const id = (messageAttributes.id) ? messageAttributes.id.stringValue : null;
    return { id, status: 'COMMITED' };
  },
  retryEvent: async (rawEvent, retryStrategy) => {
    const { receiptHandle, eventSourceARN, messageAttributes = {}, attributes = {} } = rawEvent;
    const arr = eventSourceARN.split(':');
    const QueueUrl = `https://sqs.${arr[3]}.amazonaws.com/${arr[4]}/${arr[5]}`;
    const waitingTime = retryStrategy(parseInt(attributes.ApproximateReceiveCount) || 1);
    if (!process.env.IS_LOCAL && waitingTime > 0)
      await sqs.changeMessageVisibility({ QueueUrl, ReceiptHandle: receiptHandle, VisibilityTimeout: waitingTime }).promise();
    const id = (messageAttributes.id) ? messageAttributes.id.stringValue : null;
    return { id: id, status: 'FAILED', waitingTime };
  },
}