const ewelink = require('ewelink-api');
const deviceModel = require('../model/DevicesModel');
const triggerEvent = require('../model/TriggerEvent');
const firebase = require('./FirebaseHandler');
const logger = require('node-color-log');

var self = module.exports = {
    getMyDevices: function(userData, emitter) {
      return new Promise( async (resolve, reject) => {
        var updateDevices = false;
        var email = userData.credentials.email;
        var password = userData.credentials.password;
        var myDevices = new Map();
        //logger.debug(`Getting devices for user ${email}`);
        myDevices = userData.rfDevices;
        const conn1 = new ewelink({
            region: "eu",
            email: email,
            password: password,
          });
        
        /* get all devices */
        const devices = await conn1.getDevices();
    
        try {
  
          if (devices) {
            devices.forEach( async element => {
              if (self.getDeviceTypeByUiid(element.uiid) == "RF_BRIDGE") {
      
                var rfParams = new Map();
                let rfDevices = element.tags.zyx_info;
      
                Object.assign(rfParams, element.params);
      
                //console.log(`\nDatos del RF Bridge "${element.name}":`);
    
                for (var i = 0; i < rfDevices.length; i++) {
                  let triggerName = `rfTrig${i}`; //Nombre del elemento en el map de valores
                  
                  if (myDevices != undefined && myDevices[triggerName] != undefined) {
                    // Si existe el dispositivo en firebase se revisa la diferencia de las fechas de ejecucion y si es mas reciente se notifica
    
                    let oldDate = new Date(myDevices[triggerName].lastTrigger).getTime();
    
                    let deviceDate = new Date(rfParams[triggerName]).getTime();
                    if (deviceDate > oldDate) {
                      var map = {
                        "name": rfDevices[i].name,
                        "lastTrigger": deviceDate
                      }
    
                      myDevices[triggerName].name = rfDevices[i].name;
                      myDevices[triggerName].lastTrigger= deviceDate;
    
                      updateDevices = true;
    
                      // La fecha es mas reciente, se notifica
                      let event = new triggerEvent(
                        userData.idFB,  // idFB del usuario
                        userData.token, // Token del usuario para notificaciones
                        rfDevices[i].name, // Nombre del dispositivo que se accionó
                        rfParams[triggerName]); // Fecha en milisegundos de la accion
                      emitter.emit('data', event);
                    }
                  } else {
                    // Si no existe dispositivo en firebase se actualiza y se notifica por ser 1ra vez
                    var triggerDate = new Date(rfParams[triggerName]);
                    var triggerMillis = triggerDate.getTime();
    
                    var map = {
                      "name": rfDevices[i].name,
                      "lastTrigger": triggerMillis
                    }
    
                    if (myDevices == undefined) {
                      var finalMap = {
                        triggerName: map
                      }
      
                      myDevices = finalMap;
                    } else {
                      myDevices[triggerName] = map;
                    }
                    
                    //myDevices.set(triggerName, map);
    
                    updateDevices = true;
                    logger.info(`Data does not have device ${triggerName}`);
    
                    // La fecha es mas reciente, se notifica
                    let event = new triggerEvent(
                      userData.idFB,  // idFB del usuario
                      userData.token, // Token del usuario para notificaciones
                      rfDevices[i].name, // Nombre del dispositivo que se accionó
                      rfParams[triggerName]); // Fecha en milisegundos de la accion
                    emitter.emit('data', event);
                  }
    
                  if (updateDevices) {
                    logger.debug(`User idFb: ${userData.idFB}`);
                    await firebase.updateDevicesByUser(userData.idFB, myDevices);
                    updateDevices = false
                    
                  }
                }
                resolve(`Success updating devices for user ${email}`);
              } else {
                reject(`RF Bridge does not exist for user: ${email}`);
                let powerState = await conn1.getDevicePowerState(element.deviceid)
                //console.log(`Estado de dispositivo "${element.name}":\n ${JSON.stringify(powerState)}`);
              }
            });
          } else {
            reject(`Devices are null for user: ${email}`);
          }
          
    
        }catch(err) {
          logger.error(`Error: ${err}`);
          reject(err);
        }
      });
    },
    
    getDeviceTypeByUiid: function(uiid) {
      const MAPPING = {
        1: 'SOCKET',
        2: 'SOCKET_2',
        3: 'SOCKET_3',
        4: 'SOCKET_4',
        5: 'SOCKET_POWER',
        6: 'SWITCH',
        7: 'SWITCH_2',
        8: 'SWITCH_3',
        9: 'SWITCH_4',
        10: 'OSPF',
        11: 'CURTAIN',
        12: 'EW-RE',
        13: 'FIREPLACE',
        14: 'SWITCH_CHANGE',
        15: 'THERMOSTAT',
        16: 'COLD_WARM_LED',
        17: 'THREE_GEAR_FAN',
        18: 'SENSORS_CENTER',
        19: 'HUMIDIFIER',
        22: 'RGB_BALL_LIGHT',
        23: 'NEST_THERMOSTAT',
        24: 'GSM_SOCKET',
        25: 'AROMATHERAPY',
        26: 'BJ_THERMOSTAT',
        27: 'GSM_UNLIMIT_SOCKET',
        28: 'RF_BRIDGE',
        29: 'GSM_SOCKET_2',
        30: 'GSM_SOCKET_3',
        31: 'GSM_SOCKET_4',
        32: 'POWER_DETECTION_SOCKET',
        33: 'LIGHT_BELT',
        34: 'FAN_LIGHT',
        35: 'EZVIZ_CAMERA',
        36: 'SINGLE_CHANNEL_DIMMER_SWITCH',
        38: 'HOME_KIT_BRIDGE',
        40: 'FUJIN_OPS',
        41: 'CUN_YOU_DOOR',
        42: 'SMART_BEDSIDE_AND_NEW_RGB_BALL_LIGHT',
        43: '',
        44: '',
        45: 'DOWN_CEILING_LIGHT',
        46: 'AIR_CLEANER',
        49: 'MACHINE_BED',
        51: 'COLD_WARM_DESK_LIGHT',
        52: 'DOUBLE_COLOR_DEMO_LIGHT',
        53: 'ELECTRIC_FAN_WITH_LAMP',
        55: 'SWEEPING_ROBOT',
        56: 'RGB_BALL_LIGHT_4',
        57: 'MONOCHROMATIC_BALL_LIGHT',
        59: 'MEARICAMERA',
        1001: 'BLADELESS_FAN',
        1002: 'NEW_HUMIDIFIER',
        1003: 'WARM_AIR_BLOWER',
      };
      return MAPPING[uiid] || '';
    },
};

const isToday = (someDate) => {
  const today = new Date()
  return someDate.getDate() == today.getDate() &&
    someDate.getMonth() == today.getMonth() &&
    someDate.getFullYear() == today.getFullYear()
}


/*io.on('connection', function(socket){
  console.log("Tools emitter connected");
  isIOConnected = true;
});*/