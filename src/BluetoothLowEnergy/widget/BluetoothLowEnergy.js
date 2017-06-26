define([
    "dojo/_base/declare",
    "mxui/widget/_WidgetBase",

    "mxui/dom",
    "dojo/dom",
    "dojo/dom-prop",
    "dojo/dom-geometry",
    "dojo/dom-class",
    "dojo/dom-style",
    "dojo/dom-construct",
    "dojo/_base/array",
    "dojo/_base/lang",
    "dojo/text",
    "dojo/html",
    "dojo/_base/event",


], function(declare, _WidgetBase, dom, dojoDom, dojoProp, dojoGeometry, dojoClass, dojoStyle, dojoConstruct, dojoArray, lang, dojoText, dojoHtml, dojoEvent) {
    "use strict";

    return declare("BluetoothLowEnergy.widget.BluetoothLowEnergy", [_WidgetBase], {

        // modeler
        bluetoothName: null,
        // Internal variables.
        _handles: null,
        _contextObj: null,

        constructor: function() {
            this._handles = [];
        },

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
        },

        update: function(obj, callback) {
            logger.debug(this.id + ".update");

            this._contextObj = obj;
            this._updateRendering(callback);
        },

        resize: function(box) {
            logger.debug(this.id + ".resize");
        },

        uninitialize: function() {
            logger.debug(this.id + ".uninitialize");
        },

        _scanForBLEDevice: function(name) {
            // find the device by name
            console.log(ble);
            if (ble && typeof ble.scan === "function") {
                ble.scan(
                    [this.bluetoothName],
                    5,
                    this._onDeviceFound(device),
                    function(err) {
                        console.log('there was an error');
                        console.log(err);
                    }
                )
            }
        },

        _onDeviceFound: function(deviceInfo) {
            // connect to the device
            ble.connect(
                deviceInfo.id,
                this._onDeviceConnect(data),
                function(err) {
                    console.log('device found, error connecting');
                    console.log(err);
                }
            )
        },

        _onDeviceConnect: function(data) {
            console.log(data);
        },

        _updateRendering: function(callback) {
            logger.debug(this.id + "._updateRendering");

            if (this._contextObj !== null) {
                dojoStyle.set(this.domNode, "display", "block");
            } else {
                dojoStyle.set(this.domNode, "display", "none");
            }

            this._executeCallback(callback);
        },

        _executeCallback: function(cb) {
            if (cb && typeof cb === "function") {
                cb();
            }
        }
    });
});

require(["BluetoothLowEnergy/widget/BluetoothLowEnergy"]);