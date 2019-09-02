const Rx = require('rxjs');

var hasOwnProp = {}.hasOwnProperty;

function createName (name) {
    return `$ ${name}`;
}

class Emitter {
    constructor() {
        this.subjects = {};
    }
    emit(name, data) {
        var fnName = createName(name);
        this.subjects[fnName] || (this.subjects[fnName] = new Rx.Subject());
        this.subjects[fnName].next(data);
    }
    listen(name, handler) {
        var fnName = createName(name);
        this.subjects[fnName] || (this.subjects[fnName] = new Rx.Subject());
        return this.subjects[fnName].subscribe(handler);
    }
    dispose() {
        var subjects = this.subjects;
        for (var prop in subjects) {
            if (hasOwnProp.call(subjects, prop)) {
                subjects[prop].dispose();
            }
        }
        this.subjects = {};
    }
}

module.exports = Emitter



