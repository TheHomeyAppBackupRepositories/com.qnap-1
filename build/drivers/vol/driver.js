'use strict';

const { Driver } = require('homey');

class volDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Driver "vol" has been initialized');
  }

  async onPair(session){
    this.log("onPair()");
    this.selectedNas = {};
    let listView = 1;

    session.setHandler("list_devices", async () => {
      // return await this.onPairListDevices(session);
      console.log("handler: list_devices");
      if (listView == 1){
        listView = 2;
        return await this.onPairListNas(session);
      }
      else{
        listView = 1;
        return await this.onPairListVol(session);
      }
    });

    session.setHandler('list_devices_selection', async (data) => {
      console.log("handler: list_devices_selection");
      console.log(data);
      return await this.onListDeviceSelection(session, data);
    });
  }

  async onListDeviceSelection(session, data){
    console.log("handler: list_devices_selection: ");
    console.log(data);
    this.selectedNas = data[0];
    return;
  }

  async onPairListNas(session) {
    this.log("onPairListNas()" );
    let devices = [];
    let nasList = this.homey.drivers.getDriver('nas').getDevices();
    for (let i=0; i<nasList.length; i++){
      // let sysInfo = await nasList[i].getSystemInfo();
      // let nicCount = parseInt(sysInfo.QDocRoot.func.ownContent.root.nic_cnt);
      // for (let j=0; j < nicCount; j++){
        devices.push(
          {
            name: nasList[i].getName(),
            data: {
              nasId: nasList[i].getData().id
            },
            icon: "../../nas/assets/icon.svg"
          }
        );
      // }
    }
    this.log("New devices:");
    this.log(devices);
    return devices;
  }

  async onPairListVol(session) {
    this.log("onPairListVol()" );
    let devices = [];
    let nasList = this.homey.drivers.getDriver('nas').getDevices();
    for (let i=0; i<nasList.length; i++){
      if (nasList[i].getData().id == this.selectedNas.data.nasId){
        let volInfo = await nasList[i].getVolumeInfo();
        this.log(volInfo);
        // DiagnosticLog
        this.homey.app.writeLog("Volume pairing - devices list:");
        this.homey.app.writeLog(volInfo);

        for (let j=0; j < volInfo.volumeList.length; j++){
          devices.push(
            {
              name: nasList[i].getName() + 
                    ': Vol ' +
                    volInfo.volumeList[j].volumeValue + 
                    ' (' + 
                    // hddInfo.QDocRoot.Disk_Info.entry[j].Model +
                    // ' ' +
                    volInfo.volumeList[j].volumeLabel +
                    ')'
                    ,
              data: {
                nasId: nasList[i].getData().id,
                volId: volInfo.volumeList[j].volumeValue
              }
            }
          );
        }
      }
    }
    this.log("New devices:");
    this.log(devices);
    return devices;
  }

}

module.exports = volDriver;