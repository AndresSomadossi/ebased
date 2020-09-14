const uuid = require('uuid');
const Schema = require('schemy');
const { FaultHandled } = require('../util/error');
const { customEvent } = require('../metric/customEvent');

class DownstreamEvent {
  constructor({ type, specversion, payload, meta, schema }) {
    this.id = uuid.v4();
    this.source = `${process.env.AWS_LAMBDA_FUNCTION_NAME.split('-').pop()}`;
    this.time = Date.now();
    this.type = type;
    this.specversion = specversion;
    this.payload = {...payload};
    this.meta = meta,
    this.schema = new Schema(schema);
    this.validate();
    this.publish();
  }
  validate() {
    if (!this.schema.validate(this.payload)) {
      const message = this.schema.getValidationErrors();
      throw new FaultHandled(message, { code: 'DOWNSTREAM_EVENT_CREATION_FAULT', layer: this.type, });
    }
  }
  publish() {
    customEvent(this);
  }
  get() {
    return {
      eventPayload: this.payload,
      eventMeta: {
        ...this.meta.inject(this.source),
        id: this.id,
        source: this.source,
        time: this.time,
        type: this.type,
        specversion: this.specversion,
      }
    }
  }
}

module.exports = { DownstreamEvent };