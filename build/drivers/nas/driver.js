'use strict';

const { Driver } = require('homey');
const net = require("net");
const qnapApi = require('../../qnapApi');
const qnap = new qnapApi();

class nasDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Driver "nas" has been initialized');
    this.nasIP = '';
    this.nasPort = 443;
    this.username = '';
    this.password = '';
  }

  async onPair(session) {
    this.log("onPair()");

    session.setHandler("list_devices", async () => {
      return await this.onPairListDevices(session);
    });

    session.setHandler("nasIPChanged", async (ip) => {
      return await this.onNasIPChanged(ip)
    });

    session.setHandler("nasPortChanged", async (port) => { 
      return await this.onNasPortChanged(port)
    });

    session.setHandler("login", async (data) => {
      return await this.onLogin(data);
    });

    session.setHandler('showView', async (view) => {
      return await this.onShowView(session, view);
    });

    session.setHandler('getNasData', async () => {
      this.log("View handler: getNasData");
      let data = {"ip": this.nasIP, "port": this.nasPort};
      this.log(data); 
      return data;
    });
  }

  async onRepair(session, device) {
    this.log("onRepair()");

    session.setHandler("nasIPChanged", async (ip) => {
      return await this.onNasIPChanged(ip)
    });

    session.setHandler("nasPortChanged", async (port) => { 
      return await this.onNasPortChanged(port)
    });

    session.setHandler("login", async (data) => {
      return await this.onRepairLogin(device, data);
    });

    session.setHandler('getNasData', async () => {
      this.log("View handler: getNasData");
      let data = {"ip": this.nasIP, "port": this.nasPort};
      this.log(data); 
      return data;
    });
  }

  async onNasIPChanged(ip){
    this.log("onNasIPChanged() => IP="+ip);
    this.nasIP = ip;
    this.log("call connect()");
    let result = await this.connect(this.nasIP, this.nasPort);
    if (result){
      this.log("connected succesful");
      return true;
    }
    else {
      this.log("no connection");
      return false;
    }
  }

  async onNasPortChanged(port){
    this.log("onNasPortChanged() => Port="+port);
    try{ 
      this.nasPort = parseInt(port);
    }
    catch{
      this.nasPort = 0;
    }
    this.log("call connect()");
    let result = await this.connect(this.nasIP, this.nasPort);
    if (result){
      this.log("connected succesfully");
      return true;
    }
    else {
      this.log("no connection");
      return false;
    }
  }

  async onShowView(session, view){
    if (view === 'loading') {
      this.log("onShowView(loading)");
      this.sysInfo = await qnap.getSystemInfo();
      //this.log(session);

      // await session.nextView();

      // Check sysInfo. If user has no admin rights, the subelements are missing
      if ( this.sysInfo.QDocRoot && this.sysInfo.QDocRoot.func && this.sysInfo.QDocRoot.func.ownContent ){
        await session.nextView();
      }
      else{
        await session.showView("loading_error");
      }
    }
  }

  async onRepairLogin(device, data){
    this.log("onRepairLogin()");
    this.username = data.username;
    this.password = data.password;

    this.homey.app.writeLog("Repair Login... using host "+this.nasIP+':'+this.nasPort+' and user '+this.username);
    this.log("Repair Login... using host "+this.nasIP+':'+this.nasPort+' and user '+this.username);

    let result = await this.login(data.username, data.password)
    if (result){
      this.log('onRepairLogin, New device settings:'+
              ' ip='+this.nasIP+
              ' port='+this.nasPort+
              ' user='+this.username
              //' pw='+this.password
              );
      device.setStoreValue('ip', this.nasIP);
      device.setStoreValue('port', this.nasPort);
      device.setStoreValue('user', this.username);
      device.setStoreValue('pw', this.password);
      if (await device.updateDevice()){
        return true;
      }
      else{
        return false;
      }
    }
    else{
      return false;
    }
  }


  async onLogin(data){
    this.log("onLogin()");
    this.username = data.username;
    this.password = data.password;

    this.homey.app.writeLog("Pair Login... using host "+this.nasIP+':'+this.nasPort+' and user '+this.username);
    this.log("Pair Login... using host "+this.nasIP+':'+this.nasPort+' and user '+this.username);

    let result = await this.login(data.username, data.password)

    if (result){
      //await session.showView("list_devices");
      return true;
    }
    else{
      return false;
    }
  }

  async login(username, password){
    try{
      let result = await qnap.login(this.nasIP, this.nasPort, username, password);
      return result;
    }
    catch(error){
      throw error;
    }
  }

  /**
   * onPairListDevices is called when a user is adding a device and the 'list_devices' view is called.
   * This should return an array with the data of devices that are available for pairing.
   */
  async onPairListDevices(session) {
    this.log("onPairListDevices()" );

    // DiagnosticLog
    this.homey.app.writeLog("NAS pairing - devices list:");
    this.homey.app.writeLog(this.sysInfo);

    let devices = [];
    let device = {};
    //let sysInfo = await qnap.getSystemInfo();
    let sysInfo = this.sysInfo;

    if ( this.sysInfo.QDocRoot && this.sysInfo.QDocRoot.func && this.sysInfo.QDocRoot.func.ownContent ){
      device = {
        name: sysInfo.QDocRoot.func.ownContent.root.server_name,
        data: {
          id: sysInfo.QDocRoot.func.ownContent.root.serial_number
        },
        store: {
          ip: this.nasIP,
          port: this.nasPort,
          user: this.username,
          pw: this.password,
        },
        settings:{
          scan_interval: 5
        }
      }
    }
    this.log("New device: ");
    this.log(device);
    devices.push(device);
    return devices;
  }

  async connect(ip, port){
    return new Promise( ( resolve, reject ) =>
    {
      const _this = this;
      _this.log("connect()");
      let client = new net.Socket();
      client.setTimeout(200);
      client.on('error', function(err)
      {
        _this.log("connection error: "+err);
        client.end();
        client.destroy();
        resolve(false);
      });
      client.on('timeout', function()
      {
        _this.log("connection timeout");
        client.end();
        client.destroy();
        resolve(false);
      });
      client.on('timeout', function()
      {
        _this.log("connection timeout");
        //client.destroy();
        resolve(false);
      });
      client.connect(port, ip, function () {
        _this.log("connected succesfully");
        client.end();
        client.destroy();
        resolve(true);
      });
    });
  }
  

}

module.exports = nasDriver;