/*
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is
 * regenerated.
 */

'use strict';

const models = require('./index');

/**
 * Object returned in response to accepting an event occurance
 *
 * @extends models['AlertOperationResult']
 */
class EventResponseResult extends models['AlertOperationResult'] {
  /**
   * Create a EventResponseResult.
   */
  constructor() {
    super();
  }

  /**
   * Defines the metadata of EventResponseResult
   *
   * @returns {object} metadata of EventResponseResult
   *
   */
  mapper() {
    return {
      required: false,
      serializedName: 'EventResponseResult',
      type: {
        name: 'Composite',
        className: 'EventResponseResult',
        modelProperties: {
          requestId: {
            required: true,
            serializedName: 'request_id',
            type: {
              name: 'String'
            }
          }
        }
      }
    };
  }
}

module.exports = EventResponseResult;
