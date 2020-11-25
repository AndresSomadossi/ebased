const Dyanamo = require('aws-sdk/clients/dynamodb');
const { FaultHandled } = require('../../util/error');
const { StorageCommandMetric } = require('../../_metric/storageCommand');

const service = 'DYNAMO_COMMAND';
const dynamo = new Dyanamo.DocumentClient();

module.exports = {
  /**
   * Scans a DynamoDB table
   * 
   * @param {Object} params Scan table params as seen on AWS SDK
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#scan-property
   */
  async scanTable(params) {
    params.ReturnConsumedCapacity = 'TOTAL';
    
    const metric = new StorageCommandMetric(service, 'SCAN_TABLE', params);
    const { Items, LastEvaluatedKey, ConsumedCapacity, Count, ScannedCount } = await dynamo.scan(params).promise().catch(e => {
      metric.finish({ error: e.message });
      throw new FaultHandled(e.message, { code: 'SCAN_TABLE', layer: service });
    });

    metric.finish({ Items, LastEvaluatedKey, ConsumedCapacity, Count, ScannedCount });
    return { Items, LastEvaluatedKey };
  },

  /**
   * Performs a query against a DynamoDB table
   * 
   * @param {Object} params Query table params as seen on AWS SDK
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#query-property
   */
  async queryTable(params) {
    params.ReturnConsumedCapacity = 'TOTAL';
    
    const metric = new StorageCommandMetric(service, 'QUERY_TABLE', params);
    const { Items, LastEvaluatedKey, ConsumedCapacity, Count, ScannedCount } = await dynamo.query(params).promise().catch(e => {
      metric.finish({ error: e.message });
      throw new FaultHandled(e.message, { code: 'QUERY_TABLE', layer: service });
    });

    metric.finish({ Items, LastEvaluatedKey, ConsumedCapacity, Count, ScannedCount });
    return { Items, LastEvaluatedKey };
  },

  /**
   * Performs a get operation against a DynamoDB table
   * 
   * @param {Object} params Get item params as seen on AWS SDK
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#getItem-property
   */
  async getItem(params) {
    params.ReturnConsumedCapacity = 'TOTAL';
    
    const metric = new StorageCommandMetric(service, 'SCAN_TABLE', params);
    const { Item, ConsumedCapacity } = await dynamo.get(params).promise().catch(e => {
      metric.finish({ error: e.message });
      throw new FaultHandled(e.message, { code: 'SCAN_TABLE', layer: service });
    });

    metric.finish({ Item, ConsumedCapacity });
    return { Item };
  },

  /**
   * Performs a put item operation in a DynamoDB item
   * 
   * @param {Object} params Put item params as seen on AWS SDK
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#putItem-property
   */
  async putItem(params) {
    params.ReturnConsumedCapacity = 'TOTAL';
    
    const metric = new StorageCommandMetric(service, 'PUT_ITEM', params);
    const { ConsumedCapacity, Attributes } = await dynamo.put(params).promise().catch(e => {
      metric.finish({ error: e.message });
      throw new FaultHandled(e.message, { code: 'PUT_ITEM', layer: service });
    });

    metric.finish({ ConsumedCapacity, Attributes });
    return { Item: params.Item, Attributes };
  },

  /**
   * Deletes an item from a DynamoDB table
   * 
   * @param {Object} params Delete item params as seen on AWS SDK
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#deleteItem-property
   */
  async deleteItem(params) {
    params.ReturnConsumedCapacity = 'TOTAL';
    
    const metric = new StorageCommandMetric(service, 'DELETE_ITEM', params);
    const { ConsumedCapacity, Attributes } = await dynamo.delete(params).promise().catch(e => {
      metric.finish({ error: e.message });
      throw new FaultHandled(e.message, { code: 'DELETE_ITEM', layer: service });
    });

    metric.finish({ ConsumedCapacity, Attributes });
    return { Attributes };
  },

  /**
   * Updates a DynamoDB item
   * 
   * @param {Object} params Update item params as seen on AWS SDK
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/DynamoDB.html#updateItem-property
   */
  async updateItem(params) {
    params.ReturnConsumedCapacity = 'TOTAL';
    
    const metric = new StorageCommandMetric(service, 'UPDATE_ITEM', params);
    const { ConsumedCapacity, Attributes } = await dynamo.update(params).promise().catch(e => {
      metric.finish({ error: e.message });
      throw new FaultHandled(e.message, { code: 'UPDATE_ITEM', layer: service });
    });

    metric.finish({ ConsumedCapacity, Attributes });
    return { Attributes };
  },
};