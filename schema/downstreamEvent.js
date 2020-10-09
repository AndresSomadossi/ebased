const uuid = require('uuid');
const Schema = require('schemy');
const { FaultHandled } = require('../util/error');
const { customEvent } = require('../_metric/customEvent');
const { validationSkipped } = require('../_metric/warning');

const ERROR_CODES = {
  CREATION_FAULT: 'DOWNSTREAM_EVENT_CREATION_FAULT',
};

const skip = (process.env.EBASED_SKIP_SCHEMA_VALIDATIONS == 'true') ? true : false;

const getSource = () => {
  const name = process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (!name) return 'missing:AWS_LAMBDA_FUNCTION_NAME'
  return (name.includes('-')) ? name.split('-').pop() : name;
}

class DownstreamEvent {
  constructor({ type, specversion, payload, meta, schema }) {
    this.id = uuid.v4();
    this.source = getSource();
    this.time = Date.now();
    this.type = type;
    this.specversion = specversion;
    this.payload = { ...payload };
    this.meta = meta;
    this.schema = schema;
    this.validate();
    this.publish();
  }
  validate() {
    if (!this.schema || skip) return validationSkipped(this.type);
    this.schema = new Schema(this.schema);
    if (!this.schema.validate(this.payload)) {
      const message = this.schema.getValidationErrors();
      throw new FaultHandled(message, { code: ERROR_CODES.CREATION_FAULT, layer: this.type, });
    } else this.payload = this.schema.getBody();
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