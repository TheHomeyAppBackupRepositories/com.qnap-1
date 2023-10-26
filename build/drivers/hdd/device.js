'use strict';

const { Device } = require('homey');

class hdd extends Device {
  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {
    this.log('HDD has been initialized');
    await this.updateCapabilities();
  }

  async updateCapabilities(){
      // Add new capabilities (if not already added)
  }
    
  async updateDevice(hddData){
    this.log("updateDevice() NAS-ID"+ this.getData().nasId +" HDD-ID: "+this.getData().hddId+' Name: '+this.getName());
    this.log(hddData);

    // DiagnosticLog
    this.homey.app.writeLog("HDD-Update NAS-ID"+ this.getData().nasId +" HDD-ID: "+this.getData().hddId+' Name: '+this.getName());
    this.homey.app.writeLog(hddData);

    this.setCapabilityValue('measure_hdd_hdno', hddData.HDNo);
    this.setCapabilityValue('measure_hdd_capacity', hddData.Capacity);
    this.setCapabilityValue('measure_hdd_health', hddData.Health);
    if ( ! (hddData.Health=='OK' || hddData.Health=='Normal') ){
      this.setCapabilityValue('alarm_hdd_health', true);
    }
    else{
      this.setCapabilityValue('alarm_hdd_health', false);
    }
    this.setCapabilityValue('measure_hdd_model', hddData.Model);
    this.setCapabilityValue('measure_hdd_serial', hddData.Serial);
    if (hddData.hd_is_ssd == '1'){
      this.setCapabilityValue('measure_hdd_type', 'SSD');
    }
    else{
      this.setCapabilityValue('measure_hdd_type', 'HDD');
    }

    this.setCapabilityValue('measure_hdd_temp', parseInt(hddData.Temperature.oC));
    let nas = this.getNas();
    if (nas){
      let tempWarn = 0;
      let tempError = 0;
      if (hddData.hd_is_ssd == '1'){
        tempWarn = nas.getCapabilityValue("measure_nas_temp_warn_ssd");
        tempError = nas.getCapabilityValue("measure_nas_temp_error_ssd");
      }
      else{
        tempWarn = nas.getCapabilityValue("measure_nas_temp_warn_hdd");
        tempError = nas.getCapabilityValue("measure_nas_temp_error_hdd");
      }
      if ( (parseInt(hddData.Temperature.oC) > tempWarn) || (parseInt(hddData.Temperature.oC) > tempError) ){
        this.setCapabilityValue('alarm_hdd_temp', true);
      }
      else{
        this.setCapabilityValue('alarm_hdd_temp', false);
      }
    }

    return true;
  }      
    
  getNas() {
    let nasList = this.homey.drivers.getDriver('nas').getDevices();
    for (let i=0; i<nasList.length; i++){
      if (nasList[i].getData().id == this.getData().nasId){
        return nasList[i];
      }
    }
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {
    this.log('HDD has been added');
  }

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */
  async onSettings({ oldSettings, newSettings, changedKeys }) {
      this.log('HDD settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
      this.log('HDD was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
      this.log('HDD has been deleted');
  }
}

module.exports = hdd;
  