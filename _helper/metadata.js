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
  constructor({ order, source, time, accumDuration } = {}) {
    this.stepCounter = 0;
    this.rawInput = { order, source, time, accumDuration };
    this.source = source || 'CLIENT_COMMAND';
    this.baseOrder = (order !== undefined) ? order : 1;
    this.pStarted = { name: 'PROCESSING_STARTED', time: Date.now() };
    this.pStarted.stepDuration = (!isNaN(time)) ? this.pStarted.time - time : 0;
    this.pStarted.accumDuration = (!isNaN(accumDuration)) ? accumDuration + this.pStarted.stepDuration : 0;
  }
  get() { return this.rawInput }
  addStep(source) {
    const newOrder = `${this.baseOrder}.${++this.stepCounter}`;
    const now = Date.now();
    const accum = Date.now() - this.pStarted.time + this.pStarted.accumDuration; 
    return { order: newOrder, source, time: now, accumDuration: accum }
  }
  publish() {
    this.pFinished = { name: 'PROCESSING_FINISHED', time: Date.now() };
    this.pFinished.stepDuration = this.pFinished.time - this.pStarted.time;
    this.pFinished.accumDuration = this.pStarted.accumDuration + this.pFinished.stepDuration;
    return {
      order: this.baseOrder,
      [this.pStarted.name]: {
        time: this.pStarted.time,
        stepDuration: this.pStarted.stepDuration,
        accumDuration: this.pStarted.accumDuration,
      },
      [this.pFinished.name]: {
        time: this.pFinished.time,
        stepDuration: this.pFinished.stepDuration,
        accumDuration: this.pFinished.accumDuration,
      }
    };
  }
}

module.exports = { Metadata };