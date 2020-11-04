const uuid = require('uuid');
const Schema = require('schemy');
const { ErrorHandled, FaultHandled } = require('../util/error');
const { customEvent } = require('../_metric/customEvent');
const { validationSkipped } = require('../_metric/warning');

const ERROR_CODES = {
  CLIENT_VALIDATION_FAILED: 'CLIENT_VALIDATION_FAILED',
  CREATION_FAULT: 'METRIC_EVENT_CREATION_FAULT',
};

const skip = (process.env.EBASED_SKIP_SCHEMA_VALIDATIONS == 'true') ? true : false;

class InputValidation {
  constructor({ source, type, specversion, payload, schema }) {
    this.id = uuid.v4();
    this.time = Date.now();
    this.source = source;
    this.type = `${type}_RECEIVED`;
    this.specversion = specversion;
    this.payload = { ...payload };
    this.schema = schema;
    this.validate();
    this.publish();
  }
  validate() {
    if (skip) return validationSkipped(this.type);
    if (!this.schema) throw new FaultHandled('Missing schema', { code: ERROR_CODES.CREATION_FAULT, layer: this.type })
    this.schema = new Schema(this.schema);
    if (!this.schema.validate(this.payload)) {
      const message = this.schema.getValidationErrors();
      const error = new ErrorHandled(message, { code: ERROR_CODES.CLIENT_VALIDATION_FAILED, layer: this.type });
      this.type = `${this.type}_FAILED`;
      this.payload = { error: error.get(), originalPayload: this.payload };
      this.publish();
      throw error;
    } else this.payload = this.schema.getBody();
  }
  publish() { if (this.source === 'CLIENT_COMMAND') customEvent(this) }
  get() { return this.payload }
}

module.exports = { InputValidation };