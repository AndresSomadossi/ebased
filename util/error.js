const errorMetrics = require('../_metric/error');

class Handled extends Error {
  constructor(message, { status, code, layer }) {
    super();
    this.message = message;
    this.status = status;
    this.code = code;
    this.layer = layer;
    this.publish();
  }
}

class FaultHandled extends Handled {
  constructor(message, { code, layer }) {
    super(message, { status: 500, code, layer });
  }
  get() {
    return { status: 500, code: 'INTERNAL_SERVER_ERROR', detail: 'INTERNAL_SERVER_ERROR' };
  }
  publish() {
    errorMetrics.faultHandled({ ...this, stack: this.stack.split('\n') });
  }
  static captureUnhanlded(error, { code, layer }) {
    if (error instanceof Handled) return error;
    return new FaultHandled(`${error.name}-${error.message}`, { code, layer });
  }
}

class ErrorHandled extends Handled {
  constructor(message, { status = 400, code, layer }) {
    super(message, { status, code, layer });
  }
  get() {
    return { status: this.status, code: this.code, detail: this.message };
  }
  publish() {
    errorMetrics.errorHandled({ ...this });
  }
}

module.exports = { FaultHandled, ErrorHandled };