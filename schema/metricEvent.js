const uuid = require('uuid');
const Schema = require('schemy');
const { FaultHandled } = require('../util/error');
const { customEvent } = require('../metric/customEvent');

const ERROR_CODES = {
  CREATION_FAULT: 'METRIC_EVENT_CREATION_FAULT',
}

class MetricEvent {
  constructor({ type, specversion, payload, schema }) {
    this.id = uuid.v4();
    this.source = `${process.env.AWS_LAMBDA_FUNCTION_NAME.split('-').pop()}`;
    this.time = Date.now();
    this.type = type;
    this.specversion = specversion;
    this.payload = { ...payload };
    this.schema = new Schema(schema);
    this.validate();
    this.publish();
  }
  validate() {
    if (!this.schema.validate(this.payload)) {
      const message = this.schema.getValidationErrors();
      throw new FaultHandled(message, { code: ERROR_CODES.CREATION_FAULT, layer: this.type, });
    }
  }
  publish() {
    customEvent(this);
  }
}

module.exports = { MetricEvent };