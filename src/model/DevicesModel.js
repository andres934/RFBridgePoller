class DevicesModel {

    constructor(name, trigger) {
        this.deviceName = name;
        this.lastTrigger = trigger;
    }

    toString() {
        return `${this.deviceName} last Trigger on: ${this.lastTrigger}`;
    }

}

module.exports = DevicesModel;