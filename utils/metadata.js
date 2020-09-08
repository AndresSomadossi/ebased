const STEP_TYPE = {
  STARTED: 'TRACE_STARTED',
  FINISHED: 'TRACE_FINISHED',
}

class Metadata {
  constructor(meta = {}) {
    this.tracedDuration = new TracedDuration(meta.tracedDuration);
    this.traceId = process.env._X_AMZN_TRACE_ID;
    this.clientId = meta.clientId;
    this.trackingTag = meta.trackingTag;
    this.id = meta.id;
    this.source = meta.source || 'CLIENT_COMMAND';
    this.time = meta.time;
    this.type = meta.type;
    this.specversion = meta.specversion;
    this.setEnvVars();
  }
  setEnvVars() {
    this.traceId && (process.env.traceId = this.traceId);
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
  constructor(steps) {
    this.steps = steps || [{ name: STEP_TYPE.STARTED, time: Date.now() }];
    this.initStep = { name: 'INIT_PROCESSING', time: Date.now() };
  }
  get() { return this.steps; }
  addStep(name) {
    const steps = [...this.steps];
    steps.push({ name: `STEP_${name}`, time: Date.now() });
    return steps;
  }
  publish() {
    this.steps.push(this.initStep);
    this.steps.push({ name: STEP_TYPE.FINISHED, time: Date.now() });
    const logObject = {}
    this.steps.forEach((step, index, arr) => {
      if (index === 0) {
        step.stepDuration = 0;
        step.totalDuration = 0;
      } else {
        step.stepDuration = step.time - arr[index - 1].time;
        step.totalDuration = step.time - arr[0].time;
      }
      logObject[step.name] = { time: step.time, stepDuration: step.stepDuration, totalDuration: step.totalDuration };
    });
    return logObject;
  }
}

module.exports = { Metadata };