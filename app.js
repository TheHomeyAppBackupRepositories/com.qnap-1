if (process.env.DEBUG === '1')
{
    require('inspector').open(9222, '0.0.0.0', true);
}

'use strict';

const Homey = require('homey');
const wol = require('./wol');
 
class qnapApp extends Homey.App {

  /**
   * onInit is called when the app is initialized.
   */
  async onInit() {
    this.log('qnapApp has been initialized');
    this.diagLog = "";

    // Register Flow-Action-Listener
    const wakeOnLanAction = this.homey.flow.getActionCard('wake_on_lan');
    // wakeOnLanAction.registerRunListener(async (args, state) => {
    //         return args.device.wakeOnLan();
    // });
    wakeOnLanAction.registerRunListener(async (args, state) => {
            return await this.wakeOnLanAction(args, state);
    });
    wakeOnLanAction.registerArgumentAutocompleteListener('nas', async (query, args) => {
      let results = [];
      let cloudId = await this.homey.cloud.getHomeyId();
      let iconUri = 'https://'+cloudId+'.connect.athom.com/app/com.qnap/drivers/nas/assets/icon.svg';
      //let iconUri = 'https://'+cloudId+'.connect.athom.com/app/com.qnap/drivers/nas/assets/images/small_foto.png';
      let devices = this.homey.drivers.getDriver('nas').getDevices();
      for (let i=0; i<devices.length; i++){
        results.push( 
          {
            name: devices[i].getName(),
            icon: iconUri, 
            // You can freely add additional properties to access in registerRunListener
            id: devices[i].getData().id
          }
        );
      }

      // filter based on the query
      return results.filter((result) => {
        return result.name.toLowerCase().includes(query.toLowerCase());
      });
    });
  }

  async wakeOnLanAction(args, state){
    let nasList = this.homey.drivers.getDriver('nas').getDevices();
    for (let i=0; i<nasList.length; i++){
      if (nasList[i].getData().id == args.nas.id){
        try{
          await nasList[i].wakeOnLan();
        }
        catch (error){
          this.log("WakeOnLan Error:"+err.message);
          // DiagnosticLog
          this.writeLog("WakeOnLan Error:"+err.message);
        }
      }
    }
  }

  async wakeOnLan(mac){
    const self = this;
    return new Promise( ( resolve, reject ) =>
    {
      try
      {
        wol.wake(mac, ( response ) =>{
          self.log("WakeOnLan request sent.");
          // DiagnosticLog
          self.writeLog("WakeOnLan request sent.");

          resolve(response);
        });
      }
      catch ( err )
      {
        self.log("WakeOnLan Error:"+err.message);
        // DiagnosticLog
        self.writeLog("WakeOnLan Error:"+err.message);
        reject( new Error( "WakeOnLan error: " + err.message ) );
      }
    });        
  }

  writeLog(message){
    if (!this.homey.settings.get('logEnabled')){
      return;
    }

    const tz  = this.homey.clock.getTimezone();
    const nowTime = new Date();
    const now = nowTime.toLocaleString('en-US', 
        { 
            hour12: false, 
            timeZone: tz,
            hour: "2-digit",
            minute: "2-digit",
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        });
    let date = now.split(", ")[0];
    date = date.split("/")[2] + "-" + date.split("/")[0] + "-" + date.split("/")[1]; 
    let time = now.split(", ")[1];
    
    this.diagLog += "\r\n* ";
    this.diagLog += date + " " + time + ":";
    this.diagLog += nowTime.getSeconds();
    this.diagLog += ".";
    let milliSeconds = nowTime.getMilliseconds().toString();
    if (milliSeconds.length == 2)
    {
        this.diagLog += '0';
    }
    else if (milliSeconds.length == 1)
    {
        this.diagLog += '00';
    }
    this.diagLog += milliSeconds;
    this.diagLog += "\r\n";

    this.diagLog += JSON.stringify(message);
    this.diagLog += "\r\n";
    if (this.diagLog.length > 60000)
    {
        this.diagLog = this.diagLog.substr(this.diagLog.length - 60000);
    }

    this.homey.api.realtime('com.qnap.logupdated', { 'log': this.diagLog });
  }

}

module.exports = qnapApp;
