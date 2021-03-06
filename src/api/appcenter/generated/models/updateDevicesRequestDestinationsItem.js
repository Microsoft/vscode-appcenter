/*
 * Code generated by Microsoft (R) AutoRest Code Generator.
 * Changes may cause incorrect behavior and will be lost if the code is
 * regenerated.
 */

'use strict';

/**
 * Class representing a UpdateDevicesRequestDestinationsItem.
 */
class UpdateDevicesRequestDestinationsItem {
  /**
   * Create a UpdateDevicesRequestDestinationsItem.
   * @member {string} [name]
   */
  constructor() {
  }

  /**
   * Defines the metadata of UpdateDevicesRequestDestinationsItem
   *
   * @returns {object} metadata of UpdateDevicesRequestDestinationsItem
   *
   */
  mapper() {
    return {
      required: false,
      serializedName: 'UpdateDevicesRequest_destinationsItem',
      type: {
        name: 'Composite',
        className: 'UpdateDevicesRequestDestinationsItem',
        modelProperties: {
          name: {
            required: false,
            serializedName: 'name',
            type: {
              name: 'String'
            }
          }
        }
      }
    };
  }
}

module.exports = UpdateDevicesRequestDestinationsItem;
