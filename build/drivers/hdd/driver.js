'use strict';

const { Driver } = require('homey');

class hddDriver extends Driver {

  /**
   * onInit is called when the driver is initialized.
   */
  async onInit() {
    this.log('Driver "hdd" has been initialized');
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
        return await this.onPairListHdd(session);
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
  //     let hddInfo = await nasList[i].getDiskInfo();
  //     for (let j=0; j < hddInfo.QDocRoot.Disk_Info.entry.length; j++){
  //       devices.push(
  //         {
  //           name: nasList[i].getName() + 
  //                 ': HDD ' +
  //                 hddInfo.QDocRoot.Disk_Info.entry[j].HDNo + 
  //                 ' (' + 
  //                 // hddInfo.QDocRoot.Disk_Info.entry[j].Model +
  //                 // ' ' +
  //                 hddInfo.QDocRoot.Disk_Info.entry[j].Capacity +
  //                 ')'
  //                 ,
  //           data: {
  //             nasId: nasList[i].getData().id,
  //             hddId: hddInfo.QDocRoot.Disk_Info.entry[j].HDNo
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

  async onPairListHdd(session) {
    this.log("onPairListHdd()" );
    let devices = [];
    let nasList = this.homey.drivers.getDriver('nas').getDevices();
    for (let i=0; i<nasList.length; i++){
      if (nasList[i].getData().id == this.selectedNas.data.nasId){
        let hddInfo = await nasList[i].getDiskInfo();
        this.log(hddInfo);
        // DiagnosticLog
        this.homey.app.writeLog("HDD pairing - devices list:");
        this.homey.app.writeLog(hddInfo);

        for (let j=0; j < hddInfo.entry.length; j++){
          devices.push(
            {
              name: nasList[i].getName() + 
                   ': HDD ' +
                    hddInfo.entry[j].HDNo + 
                    ' (' + 
                    // hddInfo.QDocRoot.Disk_Info.entry[j].Model +
                    // ' ' +
                    hddInfo.entry[j].Capacity +
                    ')'
                    ,
              data: {
                nasId: nasList[i].getData().id,
                hddId: hddInfo.entry[j].HDNo
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

module.exports = hddDriver;