const mqtt = require('mqtt') 
const manuh = require('manuh')
const ManuhBridge = require('manuh-bridge').ManuhBridge
const debug  = require('debug')('mqtt-provider-debug')


module.exports.new = () => new function() {
    this.init = function(mqttBrokerHost, mqttUserName, mqttPassword, mqttBaseTopic, readyCB) {        
        if (!mqttBrokerHost) {
            console.error("mqttBrokerHost not FOUND!")
            throw "mqttBrokerHost parameter is not set. Please provide a MQTT broker host to connect"
        }

        const _self = this
        if (this.bootstrapStatus == 0) {
            this.bootstrapStatus = 1 //running bootstrap
            let mqttCredentials = undefined
            if (mqttUserName) {
                mqttCredentials = {
                    username: mqttUserName,
                    password: mqttPassword
                }
            }
            debug("Connecting to MQTT with: \nMQTT_BROKER_HOST="+mqttBrokerHost, 
                                        "\nMQTT_USERNAME="+mqttUserName,
                                        "\nMQTT_PASSWORD="+mqttPassword,
                                        "\nMQTT_BASE_TOPIC="+mqttBaseTopic);            
                                        
            this.baseTopic = mqttBaseTopic           
            debug("baseTopic:", this.baseTopic)
            

            // Manuh Bridge MQTT config
            let hostArr = mqttBrokerHost.split("://")
            let proto = "mqtt"
            let port = null
            let host = hostArr[1]
            let context = ""
            if (hostArr[0].indexOf("https") != -1) {
                proto = "wss"
            }else if (hostArr[0].indexOf("http") != -1) {
                proto = "ws"
            }

            //port and host
            if (hostArr[1].indexOf(":") != -1) {
                let temp = hostArr[1].split(":")
                host = temp[0]
                if (temp[1].indexOf("/") != -1) {
                    port = temp[1].split("/")[0]
                }else{
                    port = temp[1]
                }
            }
            //context and host
            if (hostArr[1].indexOf("/") != -1 && hostArr[1].indexOf("/") != hostArr[1].length-1) {
                let temp = hostArr[1].split("/")
                if (temp[0].indexOf(":") != -1) {
                    host = temp[0].split(":")[0]
                }else{
                    host = temp[0]
                }
                context = temp[1]
            }

            const mqttConnectionConfig = {
                protocol: proto,
                host: host,
                port: port,
                context: context
            }
            const brokerURL = `${mqttConnectionConfig.protocol}://${mqttConnectionConfig.host}${mqttConnectionConfig.port ? ":"+mqttConnectionConfig.port : ""}/${mqttConnectionConfig.context}`
            
            debug('mqttConnectionConfig=',mqttConnectionConfig)
            this.manuhBridge = new ManuhBridge(manuh, mqttConnectionConfig, () => {

                debug('ManuhBridge connections completed.')                        
                debug('Connecting directly to MQTT. brokerURL:', brokerURL)
                this.mqttClient = mqtt.connect(brokerURL, mqttCredentials);
                this.mqttClient.on('connect', function (connack) {                        
                    
                    if (!connack) {
                        console.error(t("Error connecting to interaction bus"));
                        return;
                    }      
                    
                    if (_self.bootstrapStatus < 2) { //avoid calling every time the connection succeeds
                        _self.bootstrapStatus = 2 //bootstrap completed
                        debug("connection succeed. Details:",connack)
                        readyCB(_self)
                    }else{
                        debug("connected again. Details:",connack)
                    }                    
                })

            });                        
        }else{
            return readyCB(_self)
        }
    }
    this.publish = function(topic, msg) {
        if (!this.isReady()) {
            throw "mqttProvider not yet initiated. Call `init` method with correspondent parameters"
        }
        let topicToPublish;
        if(!this.baseTopic){
            topicToPublish = topic;
        }else{
            topicToPublish = this.baseTopic + "/" + topic;
        }
        if (typeof(msg) !== "object") {
            throw "Could not publish non-objects to the chat mqtt provider"
        }
        this.mqttClient.publish(topicToPublish, JSON.stringify(msg))
    }
    this.subscribe = function(topic, onMessageReceived, subscriptionId="mqtt-provider") {
        if (!this.isReady()) {
            throw "mqttProvider not yet initiated. Call `init` method with correspondent parameters"
        }
        let topicToSubscribe;
        if(!this.baseTopic){
            topicToSubscribe = topic;
        }else{
            topicToSubscribe = this.baseTopic + "/" + topic;
        }       
        this.manuhBridge.subscribeRemote2LocalTopics([ topicToSubscribe ]); //connect to manuh
        manuh.unsubscribe(topicToSubscribe, subscriptionId) //avoid duplicated subs
        manuh.subscribe(topicToSubscribe, subscriptionId, function(msg, _){            
            if (typeof(msg) === "string") {
                msg = JSON.parse(msg)
            }
            onMessageReceived(msg)              
        })
    }
    this.unsubscribe = function(topic, subscriptionId="mqtt-provider") {
        const topicToUnsubscribe = this.baseTopic + "/" + topic
        manuh.unsubscribe(topicToUnsubscribe, subscriptionId)
    }
    this.isReady = function() {
        return this.bootstrapStatus == 2;
    }
    this.baseTopic = null
    this.mqttClient = null
    this.manuhBridge = null
    this.bootstrapStatus = 0
}