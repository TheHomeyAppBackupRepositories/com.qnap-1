'use strict';

/* encode function start */
var ezEncodeChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var ezDecodeChars = new Array(
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1,
    -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, -1, 62, -1, -1, -1, 63,
    52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1, -1, -1, -1, -1, -1,
    -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14,
    15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -1, -1, -1, -1, -1,
    -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -1, -1, -1, -1, -1);

function utf16to8(str)
{
	var out, i, len, c;
	out = "";
	len = str.length;
	for (i=0; i<len; i++) {
		c = str.charCodeAt(i);
		if ((c >= 0x0001) && (c <= 0x007F)) {
			out += str.charAt(i);
		} 
		else if (c > 0x07FF) {
			out += String.fromCharCode(0xE0 | ((c >> 12) & 0x0F));
			out += String.fromCharCode(0x80 | ((c >>6) & 0x3F));
			out += String.fromCharCode(0x80 | ((c >>0) & 0x3F));

		}
		else {
			out += String.fromCharCode(0xC0 | ((c >>6) & 0x1F));
			out += String.fromCharCode(0x80 | ((c >>0) & 0x3F));
		}
	}
	return out;
}
function utf8to16(str) {
	var out, i, len, c;
	var char2, char3;

	out = "";
	len = str.length;
	i = 0;
	while(i < len) {
		c = str.charCodeAt(i++);
		switch(c >> 4)
		{
		case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
		// 0xxxxxxx
			out += str.charAt(i-1);
			break;
		case 12: case 13:
		// 110x xxxx 10xx xxxx
			char2 = str.charCodeAt(i++);
			out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
			break;
		case 14:
		// 1110 xxxx10xx xxxx10xx xxxx
			char2 = str.charCodeAt(i++);
			char3 = str.charCodeAt(i++);
			out += String.fromCharCode(((c & 0x0F) << 12) |
			((char2 & 0x3F) << 6) |
			((char3 & 0x3F) << 0));
		}
	}
	return out;
}

function ezEncode(str)
{
  var out, i, len;
  var c1, c2, c3;

  len = str.length;
  i = 0;
  out = "";
  while(i < len)
	{
		c1 = str.charCodeAt(i++) & 0xff;
		if(i == len)
		{
			out += ezEncodeChars.charAt(c1 >> 2);
		  out += ezEncodeChars.charAt((c1 & 0x3) << 4);
		  out += "==";
		  break;
		}
		c2 = str.charCodeAt(i++);
		if(i == len)
		{
	    out += ezEncodeChars.charAt(c1 >> 2);
	    out += ezEncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
	    out += ezEncodeChars.charAt((c2 & 0xF) << 2);
	    out += "=";
	    break;
		}
		c3 = str.charCodeAt(i++);
		out += ezEncodeChars.charAt(c1 >> 2);
		out += ezEncodeChars.charAt(((c1 & 0x3)<< 4) | ((c2 & 0xF0) >> 4));
		out += ezEncodeChars.charAt(((c2 & 0xF) << 2) | ((c3 & 0xC0) >> 6));
		out += ezEncodeChars.charAt(c3 & 0x3F);
	}
  return out;
}


const https = require('https');
const parser = require('fast-xml-parser');
// const parserOptions = {
//     attributeNamePrefix : "@_",
//     attrNodeName: "attr", //default is 'false'
//     textNodeName : "#text",
//     ignoreAttributes : true,
//     ignoreNameSpace : false,
//     allowBooleanAttributes : false,
//     parseNodeValue : true,
//     parseAttributeValue : false,
//     trimValues: true,
//     cdataTagName: "__cdata", //default is 'false'
//     cdataPositionChar: "\\c",
//     parseTrueNumberOnly: false,
//     numParseOptions:{
//         hex: true,
//         leadingZeros: true,
//         //skipLike: /\+[0-9]{10}/
//     }
//     arrayMode: false, //"strict"
//     attrValueProcessor: (val, attrName) => he.decode(val, {isAttributeValue: true}),//default is a=>a
//     tagValueProcessor : (val, tagName) => he.decode(val), //default is a=>a
//     stopNodes: ["parse-me-as-string"]
// };

class qnap {

    constructor() {
        this.protocol = 'https://';
        this.path = '/cgi-bin/';
        this.ip = '';
        this.port = 0;
        this.user = '';
        this.pw = '';
        this.authId = '';

    }

    isLoggedin(){
        if (this.authId && this.authId != ''){
            return true;
        }
        else{
            return false;
        }
    }

    async login(ip, port, user, pw){
        //onsole.log("QNAP.login()");
        // clear authId before Login, clear old token
        this.authId = '';
        this.ip = ip;
        this.port = port;
        this.user = user;
        this.pw = ezEncode(pw);
        //console.log("Ecoded PW: "+this.pw);

        let path =  this.path +
                    'authLogin.cgi?user=' +
                    this.user + 
                    '&pwd=' +
                    this.pw;
        let url =   this.protocol + 
                    this.ip + 
                    ':' + 
                    this.port +
                    path;                    
        //console.log("URL: "+url);
        let options = {
            hostname: this.ip,
            port: this.port,
            path: path,
            method: 'GET',
            rejectUnauthorized: false
        }
        try{
            // API-call
            let result = await this.httpGet(url, options);
            
            //console.log("Result:");
            //console.log(result);

            let json = parser.parse(result);
            //console.log(json);
            if (json.QDocRoot 
                && json.QDocRoot.authSid
                && json.QDocRoot.authPassed == 1 
                && json.QDocRoot.authSid != '' )
            {
                this.authId = json.QDocRoot.authSid;
                return true;  
            }
            else{
                return false;
            }
        }
        catch(error){
            this.authId = '';
            //console.log("LoginError: "+error);
            throw error;
        }
    }

    async logoff(){
      // virtual logoff, just delete the sAuth flag to 
      this.authId = '';
    }

    async getSystemInfo(){
      //console.log("QNAP.getSystemInfo()");

      if (!this.isLoggedin()){
            throw 'Not logged in!';
      }
      
      let path =  this.path +
                  'management/manaRequest.cgi?subfunc=sysinfo&hd=no&multicpu=1' +
                  '&sid=' +
                  this.authId;
      let url =   this.protocol + 
                  this.ip + 
                  ':' + 
                  this.port +
                  path;                    
      let options = {
          hostname: this.ip,
          port: this.port,
          path: path,
          method: 'GET',
          rejectUnauthorized: false
      }
      //console.log("URL: "+url);
      try{
          // API-call
          let result = await this.httpGet(url, options);
          
          //console.log("Result:");
          //console.log(result);

          let json = parser.parse(result);
          // console.log(json);
          // console.log("QDocRoot.func.ownContent:");
          // console.log(json.QDocRoot.func.ownContent);

          return json;
      }
      catch(error){
          //console.log("Error: "+error);
          throw error;
      }
    }

    async getFirmwareInfo(){
      //console.log("QNAP.getSystemInfo()");

      if (!this.isLoggedin()){
            throw 'Not logged in!';
        }
        
        let path =  this.path +
                    'sys/sysRequest.cgi?subfunc=firm_update' +
                    '&sid=' +
                    this.authId;
        let url =   this.protocol + 
                    this.ip + 
                    ':' + 
                    this.port +
                    path;                    
        let options = {
            hostname: this.ip,
            port: this.port,
            path: path,
            method: 'GET',
            rejectUnauthorized: false
        }
        //console.log("URL: "+url);
        try{
            // API-call
            let result = await this.httpGet(url, options);
            
            //console.log("Result:");
            //console.log(result);

            let json = parser.parse(result);
            // console.log(json);
            // console.log("QDocRoot.func.ownContent:");
            // console.log(json.QDocRoot.func.ownContent);

            return json.QDocRoot.func.ownContent;
        }
        catch(error){
            //console.log("Error: "+error);
            throw error;
        }
    }

    async getVolumeInfo(){
      //console.log("QNAP.getVolumeInfo()");

      if (!this.isLoggedin()){
          throw 'Not logged in!';
      }

      let path =  this.path +
                  'management/chartReq.cgi?chart_func=disk_usage&disk_select=all&include=all' +
                  '&sid=' +
                  this.authId;
      let url =   this.protocol + 
                  this.ip + 
                  ':' + 
                  this.port +
                  path;                    
      let options = {
          hostname: this.ip,
          port: this.port,
          path: path,
          method: 'GET',
          rejectUnauthorized: false
      }
      //console.log("URL: "+url);
      try{
          // API-call
          let result = await this.httpGet(url, options);
          
          //console.log("Result:");
          //console.log(result);

          // let json = parser.parse(result);
          let json = parser.parse(result, {
            arrayMode: tagName => ['volume', 'volumeUse'].includes(tagName)
          });

          // console.log(json);
          // console.log("volumeList:");
          // console.log(json.QDocRoot.volumeList);
          // console.log("volumeUseList:");
          // console.log(json.QDocRoot.volumeUseList);
          // console.log("folder_element:");
          // console.log(json.QDocRoot.volumeUseList.volumeUse[0].folder_element);

          return { 
            volumeList: json.QDocRoot.volumeList.volume,
            volumeUseList: json.QDocRoot.volumeUseList.volumeUse };
      }
      catch(error){
          //console.log("Error: "+error);
          throw error;
      }
    }

    async getDiskInfo(){
      //console.log("QNAP.getDiskInfo()");

      if (!this.isLoggedin()){
          throw 'Not logged in!';
      }

      let path =  this.path +
                  'disk/qsmart.cgi?func=all_hd_data' +
                  '&sid=' +
                  this.authId;
      let url =   this.protocol + 
                  this.ip + 
                  ':' + 
                  this.port +
                  path;                    
      let options = {
          hostname: this.ip,
          port: this.port,
          path: path,
          method: 'GET',
          rejectUnauthorized: false
      }
      //console.log("URL: "+url);
      try{
          // API-call
          let result = await this.httpGet(url, options);
          
          //console.log("Result:");
          //console.log(result);

          let json = parser.parse(result, {
            arrayMode: tagName => ['entry'].includes(tagName)
          });
          // console.log(json);
          // console.log("Disk_Info:");
          // console.log(json.QDocRoot.Disk_Info);
          // console.log("Temperature:");
          // console.log(json.QDocRoot.Disk_Info.entry[0].Temperature);

          return json.QDocRoot.Disk_Info;
      }
      catch(error){
          //console.log("Error: "+error);
          throw error;
      }
    }

    async getBandwidthInfo(){
      try{
        //console.log("getBandwidthInfo(new)");
        let bdInfo = await this.getBandwidthInfoVersion('new');
        if (!bdInfo.QDocRoot.bandwidth_info){
          //console.log("getBandwidthInfo(old)");
          bdInfo = await this.getBandwidthInfoVersion('old');
        }
        return bdInfo.QDocRoot.bandwidth_info;
      }
      catch(error){
          //console.log("Error: "+error);
          throw error;
      }
    }

    async getBandwidthInfoVersion(version='new'){
      //console.log("QNAP.getBandwidthInfo()");

      if (!this.isLoggedin()){
          throw 'Not logged in!';
      }
      let pathVersion = 'management/chartReq.cgi?chart_func=bandwidth'; //Old API-URL unti firmware 4.5.4
      if (version != 'new'){
        pathVersion = 'management/chartReq.cgi?chart_func=QSM40bandwidth'; //New API-URL since firmware 4.5.4
      }
      let path =  this.path +
                  //'management/chartReq.cgi?chart_func=QSM40bandwidth' + Old API-URL unti firmware 4.5.4
                  pathVersion +
                  '&sid=' +
                  this.authId;
      let url =   this.protocol + 
                  this.ip + 
                  ':' + 
                  this.port +
                  path;                    
      let options = {
          hostname: this.ip,
          port: this.port,
          path: path,
          method: 'GET',
          rejectUnauthorized: false
      }
      //console.log("URL: "+url);
      try{
          // API-call
          let result = await this.httpGet(url, options);
          
          //console.log("Result:");
          //console.log(result);

          let json = parser.parse(result);
          console.log(json);
          // console.log("Disk_Info:");
          // console.log(json.QDocRoot.Disk_Info);
          // console.log("Temperature:");
          // console.log(json.QDocRoot.Disk_Info.entry[0].Temperature);

          return json;
      }
      catch(error){
          //console.log("Error: "+error);
          throw error;
      }
    }

    async httpGet(url, options){
        return new Promise( ( resolve, reject ) =>
            {
                try
                {
                  let request = https
                    .get(url, options, (response) => { 
                      if (response.statusCode !== 200){
                        response.resume();

                        let message = "";
                        if ( response.statusCode === 204 )
                        { message = "No Data Found"; }
                        else if ( response.statusCode === 400 )
                        { message = "Bad request"; }
                        else if ( response.statusCode === 401 )
                        { message = "Unauthorized"; }
                        else if ( response.statusCode === 403 )
                        { message = "Forbidden"; }
                        else if ( response.statusCode === 404 )
                        { message = "Not Found"; }
                        reject( new Error( "HTTP Error: " + response.statusCode + " " + message ) );
                        return;
                      }
                      else{
                        let rawData = '';
                        response.setEncoding('utf8');
                        response.on( 'data', (chunk) => { rawData += chunk; })
                        response.on( 'end', () => {
                          resolve( rawData );
                        })
                      }
                    })
                    .on('error', (err) => {
                      //console.log(err);
                      reject( new Error( "HTTP Error: " + err.message ) );
                      return;
                    });
                  request.setTimeout( 5000, function()
                    {
                      request.destroy();
                      reject( new Error( "HTTP Catch: Timeout" ) );
                      return;
                    });
                  }
                catch ( err )
                {
                    reject( new Error( "HTTP Catch: " + err.message ) );
                    return;
                }
            });
    
      }

    //   async httpPost(options, data){
    //     return new Promise( ( resolve, reject ) =>
    //         {
    //             try
    //             {
    //               let request = https
    //                 .request(options, (response) => { 
    //                   if (response.statusCode !== 200){
    //                     response.resume();
    //                     let message = "";
    //                     if ( response.statusCode === 204 )
    //                     { message = "No Data Found"; }
    //                     else if ( response.statusCode === 400 )
    //                     { message = "Bad request"; }
    //                     else if ( response.statusCode === 401 )
    //                     { message = "Unauthorized"; }
    //                     else if ( response.statusCode === 403 )
    //                     { message = "Forbidden"; }
    //                     else if ( response.statusCode === 404 )
    //                     { message = "Not Found"; }
    //                     reject( new Error( "HTTP Error: " + response.statusCode + " " + message ) );
    //                     return;
    //                   }
    //                   else{
    //                     let rawData = '';
    //                     response.setEncoding('utf8');
    //                     response.on( 'data', (chunk) => { rawData += chunk; })
    //                     response.on( 'end', () => {
    //                       resolve( rawData );
    //                     })
    //                   }
    //                 })
    //                 .on('error', (err) => {
    //                   reject( new Error( "HTTP Error: " + err.message ) );
    //                   return;
    //                 });
    //               request.setTimeout( 5000, function()
    //                 {
    //                   request.destroy();
    //                   reject( new Error( "HTTP Catch: Timeout" ) );
    //                   return;
    //                 });
    //               request.write(data);
    //               request.end();
    //             }
    //             catch ( err )
    //             {
    //                 reject( new Error( "HTTP Catch: " + err.message ) );
    //                 return;
    //             }
    //         });
    //   }

}

module.exports = qnap;