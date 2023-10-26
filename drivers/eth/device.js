'use strict';

const { Device } = require('homey');

class eth extends Device {
    /**
     * onInit is called when the device is initialized.
     */
      async onInit() {
        this.log('Eth has been initialized');
        await this.updateCapabilities();

        // register eventhandler for maintenance buttons
        this.registerCapabilityListener('button.wake_on_lan', this.wakeOnLan.bind(this));

      }
  
      async updateCapabilities(){
        // Add new capabilities (if not already added)
        if (!this.hasCapability("button.wake_on_lan")){
          await this.addCapability("button.wake_on_lan");
      }

      }
    
      async updateDevice(ethData){
        this.log("updateDevice() NAS-ID"+ this.getData().nasId +" Eth-ID: "+this.getData().ethId+' Name: '+this.getName());
        this.log(ethData);

        // DiagnosticLog
        this.homey.app.writeLog("Ethernet-Update NAS-ID"+ this.getData().nasId +" Eth-ID: "+this.getData().ethId+' Name: '+this.getName());
        this.homey.app.writeLog(ethData);

        this.setCapabilityValue('measure_eth_id', ethData.ifname);
        if (ethData.dname != undefined){
          this.setCapabilityValue('measure_eth_name', ethData.dname);
        }
        else{
          this.setCapabilityValue('measure_eth_name', '');
        }
        if (ethData.eth_mac != undefined){
          this.setCapabilityValue('measure_eth_mac', ethData.eth_mac);
        }
        else{
          this.setCapabilityValue('measure_eth_mac', '');
        }
        if (ethData.eth_mask != undefined){
          this.setCapabilityValue('measure_eth_mask', ethData.eth_mask);
        }
        else{
          this.setCapabilityValue('measure_eth_mask', '');
        }
        if (ethData.eth_usage != undefined){
          this.setCapabilityValue('measure_eth_ip_alloc', ethData.eth_usage);
        }
        else{
          this.setCapabilityValue('measure_eth_ip_alloc', '');
        }
        if (ethData.eth_ip != undefined){
          this.setCapabilityValue('measure_eth_ip', ethData.eth_ip);
        }
        else{
          this.setCapabilityValue('measure_eth_ip', '');
        }
        this.setCapabilityValue('measure_eth_rx_packet', parseInt(ethData.rx_packet));
        this.setCapabilityValue('measure_eth_tx_packet', parseInt(ethData.tx_packet));
        this.setCapabilityValue('measure_eth_err_packet', parseInt(ethData.err_packet));
        this.setCapabilityValue('measure_eth_max_speed', parseInt(ethData.eth_max_speed));
        if (ethData.dns1){
          this.setCapabilityValue('measure_eth_dns1', ethData.dns1);
        }
        else{
          this.setCapabilityValue('measure_eth_dns1', '-');
        }
        if (ethData.dns2){
          this.setCapabilityValue('measure_eth_dns2', ethData.dns2);
        }
        else{
          this.setCapabilityValue('measure_eth_dns2', '-');
        }
        if (ethData.eth_status == '1'){
          this.setCapabilityValue('measure_eth_status', 'Online');
        }
        else{
          this.setCapabilityValue('measure_eth_status', 'Offline');
        }
    
        return true;
      }
    
      async updateDeviceBw(bwData){
        this.log("updateDeviceBw() NAS-ID"+ this.getData().nasId +" Eth-ID: "+this.getData().ethId+' Name: '+this.getName());
        this.log(bwData);

        // DiagnosticLog
        this.homey.app.writeLog("Bandwith-Update NAS-ID"+ this.getData().nasId +" Eth-ID: "+this.getData().ethId+' Name: '+this.getName());
        this.homey.app.writeLog(bwData);

        // calculate MB/s, correction with /5 to get identival data like in QTS
        if (bwData != undefined && bwData.tx != undefined){
          this.setCapabilityValue('measure_eth_tx', Math.round((parseInt(bwData.tx) / 1000 / 8) *100) / 100 );
        }
        if (bwData != undefined && bwData.rx != undefined){
          this.setCapabilityValue('measure_eth_rx', Math.round((parseInt(bwData.rx) / 1000 / 8) *100) / 100 );
        }
        return true;
      }

      async wakeOnLan(){
        this.log("Flow-Action wakeOnLan() NAS-ID"+ this.getData().nasId +" Eth-ID: "+this.getData().ethId+' Name: '+this.getName() + ' MAC: '+this.getCapabilityValue('measure_eth_mac'));
        // DiagnosticLog
        this.homey.app.writeLog("Flow-Action wakeOnLan() NAS-ID"+ this.getData().nasId +" Eth-ID: "+this.getData().ethId+' MAC: '+this.getCapabilityValue('measure_eth_mac'));

        try{
          await this.homey.app.wakeOnLan(this.getCapabilityValue('measure_eth_mac'));
        }
        catch(error){
          this.log("Flow-Action Error: "+ error.message);
          // DiagnosticLog
          this.homey.app.writeLog("Flow-Action Error: "+ error.message);
          throw error;
          }
      }


    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
      this.log('Eth has been added');
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
        this.log('Eth settings where changed');
    }
  
    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name) {
        this.log('Eth was renamed');
    }
  
    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('Eth has been deleted');
    }
  }
  
  module.exports = eth;
  