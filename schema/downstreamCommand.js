const uuid = require('uuid');
const Schema = require('schemy');
const { FaultHandled, ErrorHandled } = require('../util/error');
const { validationSkipped } = require('../_metric/warning');

const ERROR_CODES = {
  REQUEST_FAULT: 'DOWNSTREAM_COMMAND_REQUEST_FAULT',
  RESPONSE_FAULT: 'DOWNSTREAM_COMMAND_RESPONSE_FAULT',
  UNMATCHED_CATALOG_FAULT: 'DOWNSTREAM_COMMAND_UNMATCHED_CATALOG_FAULT',
};

const skip = (process.env.EBASED_SKIP_SCHEMA_VALIDATIONS == 'true') ? true : false;

const getSource = () => {
  const name = process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (!name) return 'missing:AWS_LAMBDA_FUNCTION_NAME'
  return (name.includes('-')) ? name.split('-').pop() : name;
}

class DownstreamCommand {
  constructor({ type, payload, meta, requestSchema, responseSchema, errorCatalog }) {
    this.id = uuid.v4();
    this.type = type;
    this.source = getSource();
    this.payload = { ...payload };
    this.meta = meta;
    this.requestSchema = requestSchema;
    this.responseSchema = responseSchema;
    this.errorCatalog = errorCatalog;
    this.validateRequest();
  }
  validateRequest() {
    if (!this.requestSchema || skip) return validationSkipped(this.type);
    this.requestSchema = new Schema(this.requestSchema);
    if (!this.requestSchema.validate(this.payload)) {
      const message = this.requestSchema.getValidationErrors();
      throw new FaultHandled(message, { code: ERROR_CODES.REQUEST_FAULT, layer: this.type, });
    } else this.payload = this.requestSchema.getBody();
  }
  validateResponse(response) {
    if (!this.responseSchema) return validationSkipped(this.type);
    this.responseSchema = new Schema(this.responseSchema);
    if (!this.responseSchema.validate(response)) {
      const message = this.responseSchema.getValidationErrors();
      throw new FaultHandled(message, { code: ERROR_CODES.RESPONSE_FAULT, layer: this.type, });
    } else this.payload = this.responseSchema.getBody();
  }
  getErrorCataloged(code, message) {
    const catalogedError = this.errorCatalog[code];
    if (catalogedError) {
      const errorMessage = (catalogedError.message) ? catalogedError.message : message;
      throw new ErrorHandled(errorMessage, { code: catalogedError.code, layer: this.type });
    }
    throw new FaultHandled(message, { code: ERROR_CODES.UNMATCHED_CATALOG_FAULT, layer: this.type, });
  }
  get() {
    const returnObject = { commandPayload: this.payload, }
    if (this.meta) returnObject.commandMeta = {
      ...this.meta.inject(this.source),
      id: this.id,
      source: this.source,
    }
    return returnObject;
  }
}

module.exports = { DownstreamCommand };