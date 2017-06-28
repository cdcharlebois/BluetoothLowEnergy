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
        objectToCreate: null,
        bluetoothName: null,
        microflowToCall: null,
        countField: null,
        // Internal variables.
        _handles: null,
        _contextObj: null,
        _deviceIds: [],

        constructor: function() {
            this._handles = [];
        },

        postCreate: function() {
            logger.debug(this.id + ".postCreate");
            this._scanForBLEDevice(this.bluetoothName);
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
            var self = this;
            console.log(ble);
            if (ble && typeof ble.scan === "function") {
                ble.scan(
                    this.bluetoothName ? [this.bluetoothName] : [],
                    5,
                    function(device) {
                        self._onDeviceFound(device);
                    },
                    function(err) {
                        console.log('there was an error');
                        console.log(err);
                    }
                )
            }
        },

        _onDeviceFound: function(deviceInfo) {
            // TODO: filter for particular device
            var self = this;
            console.log(deviceInfo);
            console.log(`ByteLength: ${deviceInfo.advertising.byteLength}`);
            if (device.platform == 'Android') {
                // TODO: Correctly read manufacturing data from ble
                var anID = this.__getUniqueIdFromAdvertising(deviceInfo.advertising)
                this._deviceIds.push(anID);
                ble.connect(
                    deviceInfo.id,
                    function(data) {
                        self._onDeviceConnect(data, deviceInfo.id);
                    },
                    function(err) {
                        console.log('device found, error connecting');
                        console.log(err);
                    }
                )
            } else if (device.platform == 'iOS') {
                var mfg = new Uint8Array(deviceInfo.advertising.kCBAdvDataManufacturerData);
                var ret = '';
                for (var i = 0; i < mfg.length; i++) {
                    ret += (mfg[i] > 15 ? (mfg[i]).toString(16) : '0' + (mfg[i]).toString(16));
                }
                var uniqueIdForFuelPump = this.__padRightTo16Chars(ret);
                this._deviceIds.push(uniqueIdForFuelPump);
                // connect to the device
                ble.connect(
                    uniqueIdForFuelPump,
                    function(data) {
                        self._onDeviceConnect(data, uniqueIdForFuelPump);
                    },
                    function(err) {
                        console.log('device found, error connecting');
                        console.log(err);
                    }
                )
            }


        },

        __padRightTo16Chars: function(text) {
            if (text.length >= 16)
                return text;
            else {
                while (text.length > 16) {
                    text += '0'
                }
                return text;
            }
        },

        __getUniqueIdFromAdvertising(ab) {
            return new Uint8Array(ab)
                .map(function(num) {
                    return num > 15 ? (num).toString(16) : '0' + (num).toString(16)
                })
                .join('')
        },

        _onDeviceConnect: function(data, uid) {
            var self = this;
            var isOn = false;
            console.log(data);
            //TODO subscribe to service, and begin reading pulses
            // 1. Read Fuel Meter Enable (deafb562-4970-4943-b47f-41419674ea2b)
            var checkIsMeterOn = new Promise(
                function(resolve, reject) {
                    ble.read(
                        uid, // device id
                        '47905c2b-6d3a-49db-ab09-abb90e53c9ac', // service ID
                        'deafb562-4970-4943-b47f-41419674ea2b', // Fuel meter uuid
                        function(data) {
                            var parsedResult = new Uint8Array(data);
                            if (parsedResult[0] == 1)
                                resolve(true)
                            else {
                                ble.write(
                                    uid,
                                    '47905c2b-6d3a-49db-ab09-abb90e53c9ac', // service ID
                                    'deafb562-4970-4943-b47f-41419674ea2b', // Fuel meter uuid
                                    new Uint8Array([1]).buffer,
                                    resolve(true),
                                    resolve(false)
                                )
                            }
                        },
                        function(err) {
                            reject(err)
                        }
                    )
                }
            );
            // a new comment
            var setupPulseListener = new Promise(
                function(resolve, reject) {
                    self._interval = setInterval(function() {
                        ble.read(
                            uid, // device id
                            '47905c2b-6d3a-49db-ab09-abb90e53c9ac',
                            'd0cc21bb-b098-4e95-8c51-9916f9540cd7',
                            function(data) {
                                var parsedResult = new Uint8Array(data)
                                console.log('>>>>> reading: number of pulses')
                                console.log(parsedResult)
                                    // TODO: Call the microflow with {count: xxx}
                            },
                            function(err) {
                                reject(err)
                            }

                        )
                    }, 1000 * 30)
                    resolve(true)

                }
            )
            checkIsMeterOn
                .then(setupPulseListener)
                .catch(function(err) {
                    console.log(err);
                });


            // then, 
            // 1. setup regular reads from Fuel Meter Pulse (d0cc21bb-b098-4e95-8c51-9916f9540cd7)
            // each time it reads, should call a microflow

        },

        _createObject: function(data) {
            // console.log(data)
            // create object and call microflow
            mx.data.create({
                entity: this.objectToCreate,
                callback: lang.hitch(this, function(obj) {
                    obj.set(this.countField, data.count);
                    this._callMicroflow(this.microflowToCall, obj);
                }),
            })

        },

        _callMicroflow: function(mf, param) {
            mx.data.action({
                params: {
                    actionname: mf,
                    applyto: "selection",
                    guids: [param.getGuid()]
                },
                callback: function(res) {
                    console.log('success')
                },
                error: function(err) {
                    console.log('error')
                }
            })
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