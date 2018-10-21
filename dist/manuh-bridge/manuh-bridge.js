"use strict";var _createClass=function(){function i(e,n){for(var t=0;t<n.length;t++){var i=n[t];i.enumerable=i.enumerable||!1,i.configurable=!0,"value"in i&&(i.writable=!0),Object.defineProperty(e,i.key,i)}}return function(e,n,t){return n&&i(e.prototype,n),t&&i(e,t),e}}();function _classCallCheck(e,n){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")}var manuhLocal=require("manuh"),info=require("debug")("ManuhBridge"),MqttClient=require("./modules/mqtt.js").MqttClient,ManuhClient=require("./modules/manuh.js").ManuhClient,__manuhClient=void 0,__mqttClient=void 0,ManuhBridge=function(){function i(e,n,t){_classCallCheck(this,i),__manuhClient=new ManuhClient(e),__mqttClient=new MqttClient(n),manuhLocal.subscribe("__message/manuh/mqtt","id",function(e,n){__mqttClient.publish(e.topic,e.message)}),manuhLocal.subscribe("__message/mqtt/manuh","id",function(e,n){__manuhClient.publish(e.topic,e.message)}),__mqttClient.connect(function(){__manuhClient.connect(),info("Connections Completed. Bridge ready to receive pub/sub."),t()})}return _createClass(i,[{key:"subscribeBridge",value:function(e){for(var n in e)__mqttClient.subscribe(e[n]),__manuhClient.subscribe(e[n])}},{key:"subscribeRemote2LocalTopics",value:function(e){for(var n in e)__mqttClient.subscribe(e[n])}},{key:"subscribeLocal2RemoteTopics",value:function(e){for(var n in e)__manuhClient.subscribe(e[n])}}]),i}();exports.ManuhBridge=ManuhBridge;