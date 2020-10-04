class Metadata {
  constructor(context = {}, meta = {}) {
    this.tracedDuration = new TracedDuration(meta.tracedDuration);
    this.traceId = meta.traceId || process.env._X_AMZN_TRACE_ID;
    this.clientId = meta.clientId;
    this.trackingTag = meta.trackingTag;
    this.id = meta.id;
    this.source = meta.source || 'CLIENT_COMMAND';
    this.time = meta.time;
    this.type = meta.type;
    this.specversion = meta.specversion;
    this.context = context;
    this.setEnvVars();
  }
  setEnvVars() {
    const arn = (this.context.invokedFunctionArn) ? this.context.invokedFunctionArn.split(':') : [];
    process.env.REGION = arn[3];
    process.env.ACCOUNT_ID = arn[4];
    this.traceId && (process.env.traceId = this.traceId) && (process.env._X_AMZN_TRACE_ID = this.traceId);
    this.clientId && (process.env.clientId = this.clientId);
    this.trackingTag && (process.env.trackingTag = this.trackingTag);
  }
  get() {
    const objectMeta = {};
    this.id && (objectMeta.id = this.id);
    this.source && (objectMeta.source = this.source);
    this.time && (objectMeta.time = this.time);
    this.type && (objectMeta.type = this.type);
    this.specversion && (objectMeta.specversion = this.specversion);
    objectMeta.tracedDuration = this.tracedDuration.get();
    return objectMeta;
  }
  publish() {
    return this.tracedDuration.publish();
  }
  inject(source) {
    const metaToInject = {}
    metaToInject.tracedDuration = this.tracedDuration.addStep(source);
    this.clientId && (metaToInject.clientId = this.clientId);
    this.trackingTag && (metaToInject.trackingTag = this.trackingTag);
    return metaToInject;
  }
}
class TracedDuration {
  constructor({ order, source, time, acumDuration } = {}) {
    this.rawInput = { order, source, time, acumDuration };
    this.source = source || 'CLIENT_COMMAND';
    this.order = (!isNaN(order)) ? order + 1 : 0;
    this.pStarted = { name: 'PROCESSING_STARTED', time: Date.now() };
    this.pStarted.stepDuration = (!isNaN(time)) ? this.pStarted.time - time : 0;
    this.pStarted.acumDuration = (!isNaN(acumDuration)) ? acumDuration + this.pStarted.stepDuration : 0;
  }
  get() { return this.rawInput }
  addStep(source) { return { order: this.order, source, time: Date.now(), acumDuration: this.pStarted.acumDuration } }
  publish() {
    this.pFinished = { name: 'PROCESSING_FINISHED', time: Date.now() };
    this.pFinished.stepDuration = this.pFinished.time - this.pStarted.time;
    this.pFinished.acumDuration = this.pStarted.acumDuration + this.pFinished.stepDuration;
    return {
      order: this.order,
      source: this.source,
      [this.pStarted.name]: {
        time: this.pStarted.time,
        stepDuration: this.pStarted.stepDuration,
        acumDuration: this.pStarted.acumDuration,
      },
      [this.pFinished.name]: {
        time: this.pFinished.time,
        stepDuration: this.pFinished.stepDuration,
        acumDuration: this.pFinished.acumDuration,
      }
    };
  }
}

module.exports = { Metadata };