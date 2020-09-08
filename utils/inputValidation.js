const uuid = require('uuid');
const Schema = require('schemy');
const { ErrorHandled } = require('./error');
const { customEvent } = require('../metrics/customEvent');

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
      const error = new ErrorHandled(message, { code: 'CLIENT_VALIDATION_ERROR', layer: this.type });
      this.type = `${this.type}_ERROR`;
      this.payload = { error: error.get(), originalPayload: this.payload };
      this.publish();
      throw error;
    }
  }
  publish() {
    if (this.source === 'CLIENT_COMMAND') customEvent(this);
  }
}

module.exports = { InputValidation };