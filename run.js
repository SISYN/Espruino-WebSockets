/**************************************************************************************************************
 * @file main.js
 * @author Dan Lindsey
 * @version 0.0.1
 * @copyright NodeJoy.com 2018
 * @description Espruino program to connect Espressif chips to WebSocket servers and send/receive data
**************************************************************************************************************/
/**************************************************************************************************************
* Preliminary index
* 1. Define configs
* 2. Imported modules
* 3. Define globals
* 4. Program procedures
**************************************************************************************************************/
/**************************************************************************************************************
* Fatal errors:
* 1. Boot failure
* 2. WiFi connection failure
* 3. WebSocket connection failure
* 4. AccessPoint failure
* 5. AccessPoint WebServer failure
**************************************************************************************************************/
/**************************************************************************************************************
* Planned implementations:
* 1. Make DEBUG an import module
**************************************************************************************************************/
function onInit() {
  /**************************************************************************************************************
   * Configuration & Options
   **************************************************************************************************************/
  var
    CONFIG = {
      'WIFI' : {
        'SSID' : '[YOUR WIFI SSID]',
        'PASS' : '[YOUR WIFI PASS]'
      },
      'SOCKET' : {
        'HOST' : '127.0.0.1', // WebSockets server IP
        'PORT' : '1337'       // WebSockets server port
      },
      'SERVER' : {            // WiFi Access Point config (optional)
        'SSID' : 'NAP--{ID}',
        'PASS' : ''
      },
      'DEBUG' : {             // Whether to log DEBUG() calls or not
        'CONSOLE' : 1
      }
    };

  /**************************************************************************************************************
   * Import modules
   **************************************************************************************************************/
  var
    wifi = require('Wifi'),
    http = require('http'),
    WebSocket = require("ws"),
    WebServer = require('WebServer'),
    cryptography = require('https://nodejoy.com/cdn/espruino/modules/cryptography.js');

  /**************************************************************************************************************
   * Declare globals
   **************************************************************************************************************/
  var
    WS,
    SELF = {},
    DEBUG = function(input , _type) {
      _type = (_type || 'debug').toUpperCase();
      if ( CONFIG.DEBUG.CONSOLE )
        console.log('['+_type+'] ' + input);
    },
    Boot = function() {
      return new Promise(function(resolve, reject) {
        DEBUG('Boot initiating');
        Boot_Config().then(Boot_WiFi).then(Boot_Socket).then(function() {
          DEBUG('Boot resolving');
          resolve();
        });
      }); // end new Promise()
    }, // end Boot
    Boot_Config = function() {
      return new Promise(function(resolve, reject) {
        DEBUG('Boot_Config initiating');
        if ( CONFIG.WIFI.SSID !== undefined ) {
          DEBUG('Boot_Config resolving');
          resolve(CONFIG);
        } else {
          reject(CONFIG);
        }
      }); // end new Promise()
    }, // end Boot_Config
    Boot_WiFi = function() {
      return new Promise(function(resolve, reject) {
        DEBUG('Boot_WiFi initiating');
        wifi.connect(CONFIG.WIFI.SSID, {password: CONFIG.WIFI.PASS}, function() {
          var IP_Object = wifi.getIP();
          DEBUG(CONFIG.WIFI.SSID + ' issued IP ' + IP_Object.ip);
          if ( IP_Object.ip != '0.0.0.0' ) {
            SELF.ID = cryptography.encrypt(IP_Object.mac);
            DEBUG('Boot_WiFi resolving');
            resolve(IP_Object);
          } else {
            DEBUG('Boot_WiFi failed');
            setTimeout(function(){
              DEBUG('Boot_WiFi restarting');
              Boot_WiFI();
            } , 750);
          } // End if ( success ) else
        }); // end wifi.connect()
      }); // end new Promise()
    },
    Boot_Socket = function() {
      return new Promise(function(resolve, reject) {
        DEBUG('Boot_Socket initiating');
        try {
          WS = new WebSocket( CONFIG.SOCKET.HOST , {
            port: CONFIG.SOCKET.PORT,
            keepAlive: 5000
          });
          WS.on('error', function() {
            DEBUG('Socket error has occurred');
          });
          WS.on('open', function() {
            DEBUG("Connected to socket");
            DEBUG('Boot_Socket resolving');
            resolve(WS);
          });
          WS.on('message', function(data) {
            DEBUG('Received data: ');
            DEBUG(data);
          });
        } catch(exception) {
          // If unsuccessful, restart the attempt
          DEBUG('Socket connection failed');
          DEBUG('Boot_Socket restarting');
          Boot_Socket(); // no delay needed, takes a while to fail
        }
      }); // end new Promise()
    }; // end Boot_WiFi



   /**************************************************************************************************************
   * Program procedures index
   * 1. Boot -- check for API/acct details and enter setup mode if not found (on file maybe?)
   *   1-1. Validate boot
   *   1-2. Connect to WiFi
   *   1-3. Connect to WebSocket
   *   1-4. Create WiFi Access Point
   *   1-5. Create HTTP WebServer for the AP
   * 2. Transmit data
   *   2-1. HTTP request is sent to the AP WebServer via http://192.168.4.1/ from vanilla ESP32s
   *   2-2. JSON from ?data= is accompanied by SELF.ID and relayed to Remote Server via WebSocket
   **************************************************************************************************************/


   Boot().then(function() {
     DEBUG('All promises resolved. Ready for Step #2.');
   });

}
save();

