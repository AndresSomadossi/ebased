const uuid = require('uuid');
const Schema = require('schemy');
const { ErrorHandled } = require('../util/error');
const { customEvent } = require('../_metric/customEvent');

const ERROR_CODES = {
  CLIENT_VALIDATION_FAILED: 'CLIENT_VALIDATION_FAILED',
}

class InputValidation {
  constructor({ source, type, specversion, payload, schema }) {
    this.id = uuid.v4();
    this.time = Date.now();
    this.source = source;
    this.type = `${type}_RECEIVED`;
    this.specversion = specversion;
    this.payload = { ...payload };
    this.schema = new Schema(schema);
    this.validate();
    this.publish();
  }
  validate() {
    if (!this.schema.validate(this.payload)) {
      const message = this.schema.getValidationErrors();
      const error = new ErrorHandled(message, { code: ERROR_CODES.CLIENT_VALIDATION_FAILED, layer: this.type });
      this.type = `${this.type}_FAILED`;
      this.payload = { error: error.get(), originalPayload: this.payload };
      this.publish();
      throw error;
    } else this.payload = this.schema.getBody();
  }
  publish() {
    if (this.source === 'CLIENT_COMMAND') customEvent(this);
  }
}

module.exports = { InputValidation };