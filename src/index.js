const app = require('express')();
const logger = require('morgan');
const http = require('http').createServer(app);
const getMyDevices = require('./utils/tools').getMyDevices;
const Poller = require('./utils/Poller');
const firebase = require('./utils/FirebaseHandler');
const logging = require('node-color-log');
const emitterClass = require('./utils/Emitter.js');
const emitter = new emitterClass();

app.use(logger('dev'));

let poller = new Poller(5000);
var users = []

//Rx Observer, se guarda en la variable subscription en caso de ser necesario agregar un dispose()
let subscription = emitter.listen('data', data => {
    logging.info(`Device triggered: ${JSON.stringify(data)}`);
});

async function retrieveUserData() {
    console.log(`Retrieving user data`);
    users = await firebase.getUsers();
    if (users.length > 0) {
        //console.log(`User Data not empty, found ${JSON.stringify(users)}`);
        initPoller();
    } else {
        console.log(`Users are empty`);
    }
}

async function initPoller() {
    logging.debug(`Init poller`);
    poller.onPoll( () => {
        let promises = []
        users.forEach( data => {
            //console.log(`Init polling with credentials: ${JSON.stringify(data)}`);
            if (data.credentials) {
                promises.push(getMyDevices(data, emitter));
            }
        });
        if (promises.length > 0 ) {
            Promise.all(promises).then( values => {
                //logging.info(`Promise all values: ${values}`);
                poller.poll(); // Go for the next poll
            }).catch( reason => {
                logging.warn(`Reject: ${reason}`);
                poller.poll(); // Go for the next poll
            });
        } else {
            poller.poll(); // Go for the next poll
        }
    });

    poller.poll();
}

app.get('/', function (req, res) {
    res.send('Hello Noders');
})

http.listen(process.env.PORT || 3000, function () {
    console.log('Process listening');
    retrieveUserData();
  })