const logger = require('../utils/logger');

module.exports = {
  customEvent(event) {
    logger.info({
      type: `CUS.${event.type}`,
      specversion: event.specversion,
      source: event.source,
      id: event.id,
      time: event.time,
      payload: JSON.stringify(event.payload),
    })
  }
}