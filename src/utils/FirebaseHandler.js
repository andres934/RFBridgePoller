const admin = require("firebase-admin");
const serviceAccount = require("../keys/firebase_key.json");
const projectId = serviceAccount.project_id;
const credentials = require("../model/EwelinkCredentialsModel");
const userData = require("../model/UserModel");

function initializeApp() {
    if (admin.apps.length === 0) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            databaseURL: `https://${projectId}.firebaseio.com`
        });
    }
	return admin.firestore();
}

var self = module.exports = {
    getUsers: async function() {
        const dbFB = initializeApp();
        var result = [];

        const response = await dbFB.collection('users').get();
        
        if (response) {
            var snap = response.docs;
            if (snap.length > 0) {
                console.log(`Conseguidos ${snap.length} usuarios!`);
                snap.forEach( (user) => {
                    //console.log(`Datos ${JSON.stringify(user.data())}`);
                    result.push(
                        new userData(
                            user.data().idFB, 
                            user.data().rfDevices, 
                            user.data().ewelinkCredentials, 
                            user.data().token
                            )
                        );
                });
            } else {
                console.log(`No existen datos de usuarios`);
            }
        }

        return result;
    },

    getCredentialsByUser: async function(idFB) {
        const dbFB = initializeApp();
        var result = null;
    
        const response = await dbFB.collection('users').where('idFB', '==', idFB).get();
        if (response) {
            var snap = response.docs;
            if (snap.length > 0) {
                snap.forEach( (doc) => {
                    data = doc.data().ewelinkCredentials;
                    result = new credentials(data.email, data.password);
                    console.log(`Conseguido credenciales => ${JSON.stringify(result)}`);
                });
            } else {
                console.log(`El usuario ${idFB} no tiene credenciales guardadas`);
                result = null;
            }
        }
    
        return result;
    },

    getDevicesByUser: async function(idFB) {
        const dbFB = initializeApp();
        var result = "";
    
        const response = await dbFB.collection('users').where('idFB', '==', idFB).get();
        if (response) {
            var snap = response.docs;
            if (snap.length > 0) {
                snap.forEach( (doc) => {
                    data = doc.data().rfDevices;
                    console.log(`Conseguido dispositivos => ${JSON.stringify(data)}`);    
                    data.forEach( (map) => {
                        console.log(`Device data => ${JSON.stringify(map)}`);
                    });
                    result = "Success";
                    
                });
            } else {
                console.log(`El usuario ${idFB} no tiene credenciales guardadas`);
                result = null;
            }
        }
    
        return result;
    },

    updateDevicesByUser: async function(idFB, deviceData) {
        const dbFB = initializeApp();

        await dbFB.collection('users')
        .doc(idFB)
        .update("rfDevices", deviceData)
        .then( ref => {
            console.log('Actualizada informacion del dispositivo: ', ref.writeTime);
            return true;
        })
        .catch( err => {
            console.log('No se pudo actualizar la informacion del dispositivo: ', err);
            return false;
        });
    }
}