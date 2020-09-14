const SNS = require('aws-sdk/clients/sns');
const { DownstreamEventMetric } = require('../../metric/downstreamEvent');
const { FaultHandled } = require('../../util/error');
const { captureAWSClient } = require('../../util/tracer');
const sns = captureAWSClient(new SNS());

const layer = 'DOWNSTREAM_SNS';
const CODES = {
  SNS_PUBLISH_DELIVERY_OK: 'SNS_PUBLISH_DELIVERY_OK',
  SNS_PUBLISH_DELIVERY_FAULT: 'SNS_PUBLISH_DELIVERY_FAULT',
};

module.exports = {
  publish: async (publishParams, eventMeta) => {
    try {
      const timeout = sns.config.httpOptions.timeout;
      publishParams.Message = JSON.stringify(publishParams.Message);
      const { TopicArn, Message, MessageAttributes = {} } = publishParams;
      if (eventMeta) {
        Object.keys(eventMeta).forEach(eventMetaKey =>
          MessageAttributes[eventMetaKey] = { StringValue: eventMeta[eventMetaKey].toString(), DataType: 'String' })
      }
      const metric = new DownstreamEventMetric(layer, timeout, TopicArn, { Message, MessageAttributes });
      await sns.publish(publishParams).promise().catch(error => {
        metric.finish().setCode(CODES.SNS_PUBLISH_DELIVERY_FAULT).publish();
        throw error;
      });
      metric.finish().setCode(CODES.SNS_PUBLISH_DELIVERY_OK).publish();
    } catch (error) {
      throw FaultHandled.captureUnhanlded(error, { code: CODES.LAMBDA_INVOKE_INVOCATION_FAULT, layer });
    }
  },
}