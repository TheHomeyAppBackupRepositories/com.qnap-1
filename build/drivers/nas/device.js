'use strict';

const { Device } = require('homey');

const qnapApi = require('../../qnapApi');
const defaultScanInterval = 5;

class nas extends Device {
    /**
     * onInit is called when the device is initialized.
     */
      async onInit() {
        this.log('NAS has been initialized');
  
        await this.updateCapabilities();

        // register eventhandler for maintenance buttons
        this.registerCapabilityListener('button.wake_on_lan', this.wakeOnLan.bind(this));

        // register flow trigger
        this.nasAvailableTrigger = this.homey.flow.getDeviceTriggerCard('nas_available');
        this.nasUnavailableTrigger = this.homey.flow.getDeviceTriggerCard('nas_unavailable');

        this.qnap = new qnapApi();
  
        // Start update-loop
        this.updateDevice();
      }
  
      async updateCapabilities(){
        // Add new capabilities (if not already added)
        if (!this.hasCapability("measure_nas_temp_warn_cpu")){
            await this.addCapability("measure_nas_temp_warn_cpu");
        }
        if (!this.hasCapability("measure_nas_temp_error_cpu")){
            await this.addCapability("measure_nas_temp_error_cpu");
        }
        if (!this.hasCapability("measure_nas_temp_warn_sys")){
            await this.addCapability("measure_nas_temp_warn_sys");
        }
        if (!this.hasCapability("measure_nas_temp_error_sys")){
            await this.addCapability("measure_nas_temp_error_sys");
        }
        if (!this.hasCapability("measure_nas_temp_warn_hdd")){
            await this.addCapability("measure_nas_temp_warn_hdd");
        }
        if (!this.hasCapability("measure_nas_temp_error_hdd")){
            await this.addCapability("measure_nas_temp_error_hdd");
        }
        if (!this.hasCapability("measure_nas_temp_warn_ssd")){
            await this.addCapability("measure_nas_temp_warn_ssd");
        }
        if (!this.hasCapability("measure_nas_temp_error_ssd")){
            await this.addCapability("measure_nas_temp_error_ssd");
        }
        if (!this.hasCapability("alarm_cpu_temp")){
            await this.addCapability("alarm_cpu_temp");
        }
        if (!this.hasCapability("alarm_sys_temp")){
            await this.addCapability("alarm_sys_temp");
        }
        if (!this.hasCapability("button.wake_on_lan")){
            await this.addCapability("button.wake_on_lan");
        }
      }
    
    async setDeviceAvailable(){
        if ( !this.getAvailable() ){
            this.nasAvailableTrigger.trigger( this );
        }
        this.setAvailable();
        let hddList = this.homey.drivers.getDriver('hdd').getDevices();
        for (let i=0; i<hddList.length; i++){
            hddList[i].setAvailable();
        }
        let ethList = this.homey.drivers.getDriver('eth').getDevices();
        for (let i=0; i<ethList.length; i++){
            ethList[i].setAvailable();
        }
        let volList = this.homey.drivers.getDriver('vol').getDevices();
        for (let i=0; i<volList.length; i++){
            volList[i].setAvailable();
        }
    }

    async setDeviceUnavailable(message){
        if ( this.getAvailable() ){
            const tokens = { "nas_unavailable_reason": message };
            this.nasUnavailableTrigger.trigger( this,  tokens );
        }
        this.setUnavailable(message);
        let hddList = this.homey.drivers.getDriver('hdd').getDevices();
        for (let i=0; i<hddList.length; i++){
            hddList[i].setUnavailable(message);
        }
        let ethList = this.homey.drivers.getDriver('eth').getDevices();
        for (let i=0; i<ethList.length; i++){
            ethList[i].setUnavailable(message);
        }
        let volList = this.homey.drivers.getDriver('vol').getDevices();
        for (let i=0; i<volList.length; i++){
            volList[i].setUnavailable(message);
        }
    }   

      async updateDevice(){
        this.log("updateDevice() NAS-ID: "+this.getData().id+' Name: '+this.getName());
        
        // DiagnosticLog
        this.homey.app.writeLog("Device-Update NAS-ID: "+this.getData().id+' Name: '+this.getName());
        
        let scanInterval = await this.getSetting('scan_interval');
        if (!scanInterval || scanInterval <= 0){
            scanInterval = defaultScanInterval;
            await this.setSettings({'scan_interval': scanInterval});
        }
        this.log('scanInterval: '+scanInterval);
        
        this.homey.clearTimeout(this.timeoutupdateDevice);
        this.timeoutupdateDevice = this.homey.setTimeout(() => 
            this.updateDevice(),  scanInterval * 1000 * 60 );

        if (!this.qnap.isLoggedin()){
            try{
                // DiagnosticLog
                this.homey.app.writeLog("Login... using host "+this.getStoreValue('ip')+':'+this.getStoreValue('port')+' and user '+this.getStoreValue('user'));
                this.log("Login... using host "+this.getStoreValue('ip')+':'+this.getStoreValue('port')+' and user '+this.getStoreValue('user'));

                let loggedIn = await this.qnap.login(
                        this.getStoreValue('ip'), 
                        this.getStoreValue('port'), 
                        this.getStoreValue('user'), 
                        this.getStoreValue('pw'));
                if (!loggedIn){
                    this.error('Login-Error, set devices unavailable. Retry at next scan interval.');

                    // DiagnosticLog
                    this.homey.app.writeLog("Login-Error! "+error.stack);

                    // Not logged in: Set device unavailable
                    this.setDeviceUnavailable(this.homey.__("device_unavailable_reason.auth_error"));
                    //throw 'Login-Error, retry at next scan interval.';
                    return false;
                }
                else{
                    // DiagnosticLog
                    this.homey.app.writeLog("Login ok");
                    this.log("Login ok");
                }
            }
            catch(error){
                this.error('Login-Error: '+error+' Set devices unavailable.');
                // Not logged in: Set device unavailable
                this.setDeviceUnavailable(this.homey.__("device_unavailable_reason.connection_error")+" ("+error.message+")");

                // DiagnosticLog
                this.homey.app.writeLog("Login-Error! "+error.stack);

                //throw 'Login-Error: '+error;
                return false;
            }
        }
        // Proceed with getting device data.
        let sysInfo;
        try{
            sysInfo = await this.qnap.getSystemInfo();
        }
        catch(error){
            this.error('Error getting NAS data! Set devices unavailable. Error: '+error);
            // Not logged in: Set device unavailable
            this.setDeviceUnavailable(this.homey.__("device_unavailable_reason.connection_error")+" ("+error.message+")");
            this.qnap.logoff();
            // DiagnosticLog
            this.homey.app.writeLog("Error getting NAS data! Set devices unavailable. Error: "+error.stack);
            //throw 'Login-Error: '+error;
            return false;
        }

        this.log(sysInfo);

        // DiagnosticLog
        this.homey.app.writeLog("NAS system data:");
        this.homey.app.writeLog(sysInfo);

        //check for auth or user rights...
        if (sysInfo.QDocRoot.authPassed == '0' || !sysInfo.QDocRoot.func || !sysInfo.QDocRoot.func.ownContent){
            this.error('Login/Auth/Right-Error. Set devices unavailable.');
            this.setDeviceUnavailable(this.homey.__("device_unavailable_reason.auth_error"));
            this.qnap.logoff();
            // DiagnosticLog
            this.homey.app.writeLog('Login/Auth/Right-Error. Set devices unavailable.');
            return false;
        }
        
        // DiagnosticLog
        this.homey.app.writeLog('Logon-Status ok, Data request ok.');

        // Logged in: Set device available
        this.setDeviceAvailable();
        this.log(sysInfo.QDocRoot.func.ownContent.root);
        // Set device data...
        try{
            this.setCapabilityValue('measure_nas_last_update', await this.convertDateToString(new Date()));
            this.setCapabilityValue('measure_nas_model_name', sysInfo.QDocRoot.model.displayModelName);
            this.setCapabilityValue('measure_nas_firmware', sysInfo.QDocRoot.firmware.version + '.' + sysInfo.QDocRoot.firmware.number);
            this.setCapabilityValue('measure_nas_firmware_build_time', sysInfo.QDocRoot.firmware.buildTime);
            this.setCapabilityValue('measure_nas_cpu_usage', parseFloat(parseFloat(sysInfo.QDocRoot.func.ownContent.root.cpu_usage.split(' ')[0]).toFixed(2)));
            let total_memory = parseFloat(sysInfo.QDocRoot.func.ownContent.root.total_memory);
            let free_memory = parseFloat(sysInfo.QDocRoot.func.ownContent.root.free_memory);
            let used_memory = total_memory - free_memory;
            let memory_usage = used_memory * 100 / total_memory;  
            this.setCapabilityValue('measure_nas_mem_usage', parseFloat((memory_usage).toFixed(2)));
            this.setCapabilityValue('measure_nas_mem_used', parseFloat((used_memory/1024).toFixed(2)));
            this.setCapabilityValue('measure_nas_mem_free', parseFloat((free_memory/1024).toFixed(2)));
            this.setCapabilityValue('measure_nas_mem_total', parseFloat((total_memory/1024).toFixed(2)));
            if (sysInfo.QDocRoot.func.ownContent.root.cpu_tempc){
                this.setCapabilityValue('measure_nas_cpu_temp', parseInt(sysInfo.QDocRoot.func.ownContent.root.cpu_tempc));
            }
            if (sysInfo.QDocRoot.func.ownContent.root.sys_tempc){
                this.setCapabilityValue('measure_nas_sys_temp', parseInt(sysInfo.QDocRoot.func.ownContent.root.sys_tempc));
            }
            if (   sysInfo.QDocRoot.func.ownContent.root.sysfan_count 
                && parseInt(sysInfo.QDocRoot.func.ownContent.root.sysfan_count) > 0
                && sysInfo.QDocRoot.func.ownContent.root.sysfan1 ){
                this.setCapabilityValue('measure_nas_fan_speed', parseInt(sysInfo.QDocRoot.func.ownContent.root.sysfan1));
            }
            let uptime =    sysInfo.QDocRoot.func.ownContent.root.uptime_day + 
                            'd ' +
                            sysInfo.QDocRoot.func.ownContent.root.uptime_hour +
                            ':' +
                            sysInfo.QDocRoot.func.ownContent.root.uptime_min +
                            ':' +
                            sysInfo.QDocRoot.func.ownContent.root.uptime_sec;
            this.setCapabilityValue('measure_nas_uptime', uptime);

            if (sysInfo.QDocRoot.func.ownContent.root.HDTempWarnT){
                this.setCapabilityValue('measure_nas_temp_warn_hdd', parseInt(sysInfo.QDocRoot.func.ownContent.root.HDTempWarnT));
            }
            if (sysInfo.QDocRoot.func.ownContent.root.HDTempErrT){
                this.setCapabilityValue('measure_nas_temp_error_hdd', parseInt(sysInfo.QDocRoot.func.ownContent.root.HDTempErrT));
            }
            if (sysInfo.QDocRoot.func.ownContent.root.SSDTempWarnT){
                this.setCapabilityValue('measure_nas_temp_warn_ssd', parseInt(sysInfo.QDocRoot.func.ownContent.root.SSDTempWarnT));
            }
            if (sysInfo.QDocRoot.func.ownContent.root.SSDTempErrT){
                this.setCapabilityValue('measure_nas_temp_error_ssd', parseInt(sysInfo.QDocRoot.func.ownContent.root.SSDTempErrT));
            }
            if (sysInfo.QDocRoot.func.ownContent.root.CPUTempWarnT){
                this.setCapabilityValue('measure_nas_temp_warn_cpu', parseInt(sysInfo.QDocRoot.func.ownContent.root.CPUTempWarnT));
            }
            if (sysInfo.QDocRoot.func.ownContent.root.CPUTempErrT){
                this.setCapabilityValue('measure_nas_temp_error_cpu', parseInt(sysInfo.QDocRoot.func.ownContent.root.CPUTempErrT));
            }
            if (sysInfo.QDocRoot.func.ownContent.root.SysTempWarnT){
                this.setCapabilityValue('measure_nas_temp_warn_sys', parseInt(sysInfo.QDocRoot.func.ownContent.root.SysTempWarnT));
            }
            if (sysInfo.QDocRoot.func.ownContent.root.SysTempErrT){
                this.setCapabilityValue('measure_nas_temp_error_sys', parseInt(sysInfo.QDocRoot.func.ownContent.root.SysTempErrT));
            }

            if ((   sysInfo.QDocRoot.func.ownContent.root.SysTempWarnT 
                    && sysInfo.QDocRoot.func.ownContent.root.sys_tempc
                    && parseInt(sysInfo.QDocRoot.func.ownContent.root.SysTempWarnT) < parseInt(sysInfo.QDocRoot.func.ownContent.root.sys_tempc))
                ||
                (   sysInfo.QDocRoot.func.ownContent.root.SysTempErrT 
                    && sysInfo.QDocRoot.func.ownContent.root.sys_tempc
                    && parseInt(sysInfo.QDocRoot.func.ownContent.root.SysTempErrT) < parseInt(sysInfo.QDocRoot.func.ownContent.root.sys_tempc)) )
            {
                this.setCapabilityValue('alarm_sys_temp', true);
            }
            else{
              this.setCapabilityValue('alarm_sys_temp', false);
            }

            if ((   sysInfo.QDocRoot.func.ownContent.root.CPUTempWarnT 
                && sysInfo.QDocRoot.func.ownContent.root.cpu_tempc
                && parseInt(sysInfo.QDocRoot.func.ownContent.root.CPUTempWarnT) < parseInt(sysInfo.QDocRoot.func.ownContent.root.cpu_tempc))
            ||
            (   sysInfo.QDocRoot.func.ownContent.root.CPUTempErrT 
                && sysInfo.QDocRoot.func.ownContent.root.cpu_tempc
                && parseInt(sysInfo.QDocRoot.func.ownContent.root.CPUTempErrT) < parseInt(sysInfo.QDocRoot.func.ownContent.root.cpu_tempc)) )
            {
                this.setCapabilityValue('alarm_cpu_temp', true);
            }
            else{
            this.setCapabilityValue('alarm_cpu_temp', false);
            }

        }
        catch(error){
            this.log(error);
            // DiagnosticLog
            this.homey.app.writeLog(error.stack);
        }

        try{
            let fwInfo = await this.qnap.getFirmwareInfo();
            if (fwInfo && fwInfo.newVersion){
                // DiagnosticLog
                this.homey.app.writeLog("Firmware data:");
                this.homey.app.writeLog(fwInfo.newVersion);

                this.setCapabilityValue('measure_nas_firmware_new_version', fwInfo.newVersion);
            }
        }
        catch(error){
            this.log(error);
            // DiagnosticLog
            this.homey.app.writeLog(error.stack);
        }

        try{
            // Update child devices: Ethernet eth0...eth3
            await this.updateChildEth(sysInfo.QDocRoot.func.ownContent.root);

            // Get Bandtwith info
            await this.updateChildBw( await this.qnap.getBandwidthInfo() );

            // Get Disk info
            await this.updateChildHdd( await this.qnap.getDiskInfo() );

            // Get Volume info
            await this.updateChildVol( await this.qnap.getVolumeInfo() );
        }
        catch(error){
            this.log(error);
            // DiagnosticLog
            this.homey.app.writeLog(error.stack);
        }

        return true;
      }
     
      async getSystemInfo(){
          return await this.qnap.getSystemInfo();
      }

      async getFirmwareInfo(){
        return await this.qnap.getFirmwareInfo();
      }

      async getBandtwithInfo(){
        return await this.qnap.getBandwidthInfo();
      }

      async getDiskInfo(){
        return await this.qnap.getDiskInfo();
      }

      async getVolumeInfo(){
        return await this.qnap.getVolumeInfo();
      }


      async updateChildEth(data){
        let devices = this.homey.drivers.getDriver('eth').getDevices();
        for (let i=0; i<devices.length; i++){
            if (devices[i].getData().nasId == this.getData().id){
                //this.log("Device eth NasID: "+devices[i].getData().nasId +" ethID: "+devices[i].getData().ethId) ;
                let ethId = devices[i].getData().ethId + 1;
                let ifname = '';
                if ( data['ifname'+ethId] ){
                    ifname = data['ifname'+ethId]
                }
                else{
                    ifname = 'eth'+i;
                }
                let dname = '';
                if ( data['dname'+ethId] ){ 
                    dname = data['dname'+ethId];
                }
                let dns1 = '';
                if ( data['dnsinfo'+ethId] && data['dnsinfo'+ethId].dns1 ){
                    dns1 = data['dnsinfo'+ethId].dns1
                }
                let dns2 = '';
                if ( data['dnsinfo'+ethId] && data['dnsinfo'+ethId].dns2 ){
                    dns2 = data['dnsinfo'+ethId].dns2
                }
                if ( data['dnsinfo'] && data['dnsinfo'].DNS_LIST && data['dnsinfo'].DNS_LIST[0] )
                {
                    dns1 = data['dnsinfo'].DNS_LIST[0];
                }
                if ( data['dnsinfo'] && data['dnsinfo'].DNS_LIST && data['dnsinfo'].DNS_LIST[1] )
                {
                    dns2 = data['dnsinfo'].DNS_LIST[1];
                }

                let ethData = {
                        ifname:         ifname,
                        dname:          dname,
                        rx_packet:      data['rx_packet'+ethId],
                        tx_packet:      data['tx_packet'+ethId],
                        err_packet:     data['err_packet'+ethId],
                        eth_max_speed:  data['eth_max_speed'+ethId],
                        eth_ip:         data['eth_ip'+ethId],
                        eth_mask:       data['eth_mask'+ethId],
                        eth_mac:        data['eth_mac'+ethId],
                        eth_usage:      data['eth_usage'+ethId],
                        dns1:           dns1,
                        dns2:           dns2,
                        eth_status:     data['eth_status'+ethId]
                    }

                    // DiagnosticLog
                    this.homey.app.writeLog("Ethernet data:");
                    this.homey.app.writeLog(ethData);

                    devices[i].updateDevice(ethData)
            }
        }
      }

      async updateChildBw(data){
        let devices = this.homey.drivers.getDriver('eth').getDevices();
        for (let i=0; i<devices.length; i++){
            if (devices[i].getData().nasId == this.getData().id){
                //this.log("Device eth NasID: "+devices[i].getData().nasId +" ethID: "+devices[i].getData().ethId) ;
                // Get the JSON element corresponding to Eth-ID
                // Eth-device-ID=0 => read element eth0 
                let bwData = data['eth'+devices[i].getData().ethId];
                //this.log(bwData);

                // DiagnosticLog
                this.homey.app.writeLog("Bandwith data:");
                this.homey.app.writeLog(bwData);

                devices[i].updateDeviceBw(bwData)
            }
        }
      }

      async updateChildHdd(data){
        let devices = this.homey.drivers.getDriver('hdd').getDevices();
        for (let i=0; i<devices.length; i++){
            if (devices[i].getData().nasId == this.getData().id){
                //this.log("Device hdd NasID: "+devices[i].getData().nasId +" hddID: "+devices[i].getData().hddId);
                for (let j=0; j < data.entry.length; j++){
                    if (data.entry[j].HDNo == devices[i].getData().hddId){

                        // DiagnosticLog
                        this.homey.app.writeLog("HDD data:");
                        this.homey.app.writeLog(data.entry[j]);

                        devices[i].updateDevice(data.entry[j]);
                    }
                }
            }
        }
      }

      async updateChildVol(data){
        let devices = this.homey.drivers.getDriver('vol').getDevices();
        for (let i=0; i<devices.length; i++){
            if (devices[i].getData().nasId == this.getData().id){
                //this.log("Device eth NasID: "+devices[i].getData().nasId +" ethID: "+devices[i].getData().ethId) ;
                for (let j=0; j < data.volumeList.length; j++){
                    if (data.volumeList[j].volumeValue == devices[i].getData().volId){

                        // DiagnosticLog
                        this.homey.app.writeLog("Volume data:");
                        this.homey.app.writeLog(
                            {
                                volume: data.volumeList[j],
                                volumeUse: data.volumeUseList[j]
                            }
                        );

                        devices[i].updateDevice(
                            {
                                volume: data.volumeList[j],
                                volumeUse: data.volumeUseList[j]
                            }
                        );
                    }
                }

            }
        }
      }

      async convertDateToString(dateObj){
        const tz  = this.homey.clock.getTimezone();
        const nowTime = dateObj;
        const now = nowTime.toLocaleString('de-DE', 
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
        
        let result = date + " " + time;
        return result;
      }

      async wakeOnLan(){
        this.log("Flow-Action wakeOnLan() NAS-ID"+ this.getData().id + ' Name: '+this.getName());
        // DiagnosticLog
        this.homey.app.writeLog("Flow-Action wakeOnLan() NAS-ID"+ this.getData().id + ' Name: '+this.getName());

        let devices = this.homey.drivers.getDriver('eth').getDevices();
        for (let i=0; i<devices.length; i++){
            if (devices[i].getData().nasId == this.getData().id){
                await devices[i].wakeOnLan();
            }
        }
      }

    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
      this.log('NAS has been added');
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
        this.log('NAS settings where changed');
        if (changedKeys.indexOf("scan_interval") >= 0){
            // Update device data with a short delay of 1sec
            this.homey.setTimeout(() => 
                this.updateDevice(),  1000 );
        }
    }
  
    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name) {
        this.log('NAS was renamed');
    }
  
    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('NAS has been deleted');
        if (this.timeoutupdateDevice){
            this.homey.clearTimeout(this.timeoutupdateDevice);
            this.timeoutupdateDevice = null;
        }
    }
  }
  
  module.exports = nas;
  