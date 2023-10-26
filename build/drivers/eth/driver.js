'use strict';

const { Driver } = require('homey');

class ethDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Driver "eth" has been initialized');
  }

  async onPair(session){
    this.log("onPair()");
    this.selectedNas = {};
    let listView = 1;

    session.setHandler("list_devices", async () => {
      //return await this.onPairListDevices(session);
      console.log("handler: list_devices");
      if (listView == 1){
        listView = 2;
        return await this.onPairListNas(session);
      }
      else{
        listView = 1;
        return await this.onPairListEth(session);
      }
    });

    session.setHandler('list_devices_selection', async (data) => {
      console.log("handler: list_devices_selection");
      return await this.onListDeviceSelection(session, data);
    });
  }

  async onListDeviceSelection(session, data){
    console.log("handler: list_devices_selection: ");
    console.log(data);
    this.selectedNas = data[0];
    return;
  }

  // async onPairListDevices(session) {
  //   this.log("onPairListDevices()" );
  //   let devices = [];
  //   let nasList = this.homey.drivers.getDriver('nas').getDevices();
  //   for (let i=0; i<nasList.length; i++){
  //     let sysInfo = await nasList[i].getSystemInfo();
  //     let nicCount = parseInt(sysInfo.QDocRoot.func.ownContent.root.nic_cnt);
  //     for (let j=0; j < nicCount; j++){
  //       devices.push(
  //         {
  //           name: nasList[i].getName() + ': eth'+j,
  //           data: {
  //             nasId: nasList[i].getData().id,
  //             ethId: j
  //           }
  //         }
  //       );
  //     }
  //   }
  //   this.log("New devices:");
  //   this.log(devices);
  //   return devices;
  // }

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

  async onPairListEth(session) {
    this.log("onPairListEth()" );
    let devices = [];
    let nasList = this.homey.drivers.getDriver('nas').getDevices();
    for (let i=0; i<nasList.length; i++){
      if (nasList[i].getData().id == this.selectedNas.data.nasId){
        let sysInfo = await nasList[i].getSystemInfo();
        this.log(sysInfo);
        // DiagnosticLog
        this.homey.app.writeLog("Ethernet pairing - devices list:");
        this.homey.app.writeLog(sysInfo);

        let nicCount = parseInt(sysInfo.QDocRoot.func.ownContent.root.nic_cnt);
        for (let j=0; j < nicCount; j++){
          devices.push(
            {
              name: nasList[i].getName() + ': eth'+j,
              data: {
                nasId: nasList[i].getData().id,
                ethId: j
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

module.exports = ethDriver;