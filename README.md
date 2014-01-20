WifiRooter
==========

A simple Node HTTP/HTTPS proxy to force all requests to pass threw the Wifi network interface

Very usefull if your ethernet network is plugged under a restricted proxy. 

By using this proxy in addition of the ProxySwitchy! extension in Chrome, you don't have to disconnect network cards to swich networks.

Usage
======
  As it has been tested on french Windows OS, feel free to change the key witch identify the Wifi IP.
  To find the key, execute the command ipconfig in a prompt and find a key which identify your ip
  Modify the config.json to put the appropriate key, and start the proxy.
  The wifi ip is automatically discovered
  
Launch
======
  execute node Proxy.js
