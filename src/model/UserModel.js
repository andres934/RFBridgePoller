class UserModel {

    constructor(idFB, rfDevices, credentials, token) {
        this.idFB = idFB;
        this.rfDevices = rfDevices;
        this.credentials = credentials;
        this.token = token;
    }

}

module.exports = UserModel;