const Dyanamo = require('aws-sdk/clients/dynamodb');
const { FaultHandled } = require('../../util/error');
const { StorageCommandMetric } = require('../../_metric/storageCommand');

const service = 'DYNAMO_COMMAND';
const dynamo = new Dyanamo.DocumentClient();

module.exports = {
  async scanTable(params) {
    const operation = 'SCAN_TABLE';
    params.ReturnConsumedCapacity = 'TOTAL';
    const metric = new StorageCommandMetric(service, operation, params);

    const { Items, LastEvaluatedKey, ConsumedCapacity, Count, ScannedCount } = await dynamo.scan(params).promise().catch(e => {
      metric.finish({ error: e.message });
      throw new FaultHandled(e.message, { code: operation, layer: service });
    });

    metric.finish({ Items, LastEvaluatedKey, ConsumedCapacity, Count, ScannedCount });
    return { Items, LastEvaluatedKey };
  },
  async queryTable(params) {
    const operation = 'QUERY_TABLE';
    params.ReturnConsumedCapacity = 'TOTAL';
    const metric = new StorageCommandMetric(service, operation, params);

    const { Items, LastEvaluatedKey, ConsumedCapacity, Count, ScannedCount } = await dynamo.query(params).promise().catch(e => {
      metric.finish({ error: e.message });
      throw new FaultHandled(e.message, { code: operation, layer: service });
    });

    metric.finish({ Items, LastEvaluatedKey, ConsumedCapacity, Count, ScannedCount });
    return { Items, LastEvaluatedKey };
  },
  async getItem(params) {
    const operation = 'SCAN_TABLE';
    params.ReturnConsumedCapacity = 'TOTAL';
    const metric = new StorageCommandMetric(service, operation, params);

    const { Item, ConsumedCapacity } = await dynamo.get(params).promise().catch(e => {
      metric.finish({ error: e.message });
      throw new FaultHandled(e.message, { code: operation, layer: service });
    });

    metric.finish({ Item, ConsumedCapacity });
    return { Item };
  },
  async putItem(params) {
    const operation = 'PUT_ITEM';
    params.ReturnConsumedCapacity = 'TOTAL';
    const metric = new StorageCommandMetric(service, operation, params);

    const { ConsumedCapacity, Attributes } = await dynamo.put(params).promise().catch(e => {
      metric.finish({ error: e.message });
      throw new FaultHandled(e.message, { code: operation, layer: service });
    });

    metric.finish({ ConsumedCapacity, Attributes });
    return { Item: params.Item, Attributes };
  },
  async deleteItem(params) {
    const operation = 'DELETE_ITEM';
    params.ReturnConsumedCapacity = 'TOTAL';
    const metric = new StorageCommandMetric(service, operation, params);

    const { ConsumedCapacity, Attributes } = await dynamo.delete(params).promise().catch(e => {
      metric.finish({ error: e.message });
      throw new FaultHandled(e.message, { code: operation, layer: service });
    });

    metric.finish({ ConsumedCapacity, Attributes });
    return { Attributes };
  },
  async updateItem(params) {
    const operation = 'UPDATE_ITEM';
    params.ReturnConsumedCapacity = 'TOTAL';
    const metric = new StorageCommandMetric(service, operation, params);

    const { ConsumedCapacity, Attributes } = await dynamo.update(params).promise().catch(e => {
      metric.finish({ error: e.message });
      throw new FaultHandled(e.message, { code: operation, layer: service });
    });

    metric.finish({ ConsumedCapacity, Attributes });
    return { Attributes };
  },
};