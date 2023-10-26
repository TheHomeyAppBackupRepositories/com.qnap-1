'use strict';

const { Device } = require('homey');

class vol extends Device {
    /**
     * onInit is called when the device is initialized.
     */
      async onInit() {
        this.log('Volume has been initialized');
        await this.updateCapabilities();
      }
  
      async updateCapabilities(){
          // Add new capabilities (if not already added)
      }
    
      async updateDevice(volData){
        this.log("updateDevice() NAS-ID"+ this.getData().nasId +" Vol-ID: "+this.getData().volId+' Name: '+this.getName());
        this.log(volData);

        // DiagnosticLog
        this.homey.app.writeLog("Volume-Update NAS-ID"+ this.getData().nasId +" Vol-ID: "+this.getData().volId+' Name: '+this.getName());
        this.homey.app.writeLog(volData);

        // "measure_vol_name",
        // "measure_vol_id",
        // "measure_vol_disks",
        // "measure_vol_type",
    
        // "alarm_vol_progress",
        // "measure_vol_progress",
    
        // "measure_vol_size_free",
        // "measure_vol_size_total",
        // "measure_vol_size_used",
        // "measure_vol_folder"
        if (volData.volume != undefined && volData.volume.volumeLabel != undefined){
          this.setCapabilityValue('measure_vol_name', volData.volume.volumeLabel);
        }
        this.setCapabilityValue('measure_vol_id', parseInt(volData.volume.volumeValue));
        this.setCapabilityValue('measure_vol_disks', volData.volume.volumeDisks);
        this.setCapabilityValue('measure_vol_type', volData.volume.volumeStat);

        this.setCapabilityValue('measure_vol_progress', parseInt(volData.volume.Progress));
        if ( parseInt(volData.volume.Progress) < 100){
          this.setCapabilityValue('alarm_vol_progress', true);
        }
        else{
          this.setCapabilityValue('alarm_vol_progress', false);
        }
        if (volData.volumeUse){
          this.setCapabilityValue('measure_vol_size_total', Math.round(parseInt(volData.volumeUse.total_size) /1024 /1024 /1024 *100) /100 );
          this.setCapabilityValue('measure_vol_size_free', Math.round(parseInt(volData.volumeUse.free_size) /1024 /1024 /1024 *100) /100);
          this.setCapabilityValue('measure_vol_size_data', Math.round(parseInt(volData.volumeUse.others_size) /1024 /1024 /1024 *100) /100 );
          this.setCapabilityValue('measure_vol_size_others', Math.round(parseInt(volData.volumeUse.total_size - volData.volumeUse.free_size - volData.volumeUse.others_size ) /1024 /1024 /1024 *100) /100 );
          this.setCapabilityValue('measure_vol_size_used', Math.round(parseInt(volData.volumeUse.total_size - volData.volumeUse.free_size ) /1024 /1024 /1024 *100) /100 );
          this.setCapabilityValue('measure_vol_folder', parseInt(volData.volume.FolderCounter));
        }

        return true;
      }
    
    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
      this.log('Volume has been added');
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
        this.log('Volume settings where changed');
    }
  
    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name) {
        this.log('Volume was renamed');
    }
  
    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('Volume has been deleted');
    }
  }
  
  module.exports = vol;
  