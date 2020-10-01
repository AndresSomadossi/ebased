const SNS = require('aws-sdk/clients/sns');
const { DownstreamEventMetric } = require('../../_metric/downstreamEvent');
const { FaultHandled } = require('../../util/error');
const { captureAWSClient } = require('../../_helper/tracer');
const sns = captureAWSClient(new SNS());

const layer = 'DOWNSTREAM_SNS';
const CODES = {
  SNS_PUBLISH_DELIVERY_OK: 'SNS_PUBLISH_DELIVERY_OK',
  SNS_PUBLISH_DELIVERY_FAULT: 'SNS_PUBLISH_DELIVERY_FAULT',
};

module.exports = {
  publish: async (publishParams, eventMeta) => {
    try {
      publishParams.TopicArn = arnCheck(publishParams.TopicArn);
      publishParams.Message = JSON.stringify(publishParams.Message);
      injectMeta(publishParams, eventMeta);
      const timeout = sns.config.httpOptions.timeout;
      const { TopicArn, Message, MessageAttributes = {} } = publishParams;
      const metric = new DownstreamEventMetric(layer, timeout, TopicArn, { Message, MessageAttributes });
      await sns.publish(publishParams).promise().catch(error => {
        metric.finish().setCode(CODES.SNS_PUBLISH_DELIVERY_FAULT).publish();
        throw error;
      });
      metric.finish().setCode(CODES.SNS_PUBLISH_DELIVERY_OK).publish();
    } catch (error) {
      throw FaultHandled.captureUnhanlded(error, { code: CODES.SNS_PUBLISH_DELIVERY_FAULT, layer });
    }
  },
}

const arnCheck = (TopicArn) => {
  if (!TopicArn) throw new Error('missing TopicArn');
  if (TopicArn.includes('arn')) return TopicArn;
  return `arn:aws:sns:${process.env.REGION}:${process.env.ACCOUNT_ID}:${TopicArn}`;
}

function injectMeta(publishParams, eventMeta) {
  if (eventMeta) {
    publishParams.MessageAttributes = {};
    Object.keys(eventMeta).forEach(eventMetaKey => {
      const el = eventMeta[eventMetaKey];
      publishParams.MessageAttributes[eventMetaKey] = {
        StringValue: (typeof el === 'string') ? el : JSON.stringify(el),
        DataType: 'String'
      };
    });
  }
}