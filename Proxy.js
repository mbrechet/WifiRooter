var http = require("http"),
	net = require("net"),
	url = require("url"),
	os = require("os"),
	fs = require("fs"),
	overwrideCors =true,
	ethWifiKey ="sans fil",
	port=3129;


// catch all uncaught exception and log them
process.on('uncaughtException', logError);
function logError(e){
	console.warn('*** ' + e);
}


// read configuraiton file
var conf = JSON.parse(fs.readFileSync("./config.json"));

if(conf){
	overwrideCors = conf.overwrideCors || true;
	ethWifiKey = conf.ethWifiKey || "sans fil";
	port = conf.port || 3129;
}

// search for wifi ip to redirect flows
var ethWifi = null,
	localWifiAddress = null;

function getAvailableIntefaces(){
	var IPs = os.networkInterfaces();
	for(var networkType in IPs){
		//console.info("ethWifiKey", ethWifiKey, networkType);
		if(networkType.indexOf(ethWifiKey)!= -1){
			ethWifi = IPs[networkType];
			console.log("found wifi card");
		}
	}
	if(ethWifi){
		for(var ip in ethWifi){
			var ipObj = ethWifi[ip];
			if(!ipObj.internal && ipObj.family.toLowerCase() == "ipv4"){
				localWifiAddress = ipObj.address;
				console.info("ip to use :: ",localWifiAddress);
			}
		}
	}else{
		console.error("*** ERROR : No Wifi network available, please enalbe/connect wifi and restart proxy ***");
		process.exit(0);
	}
}



getAvailableIntefaces();

// create HTTP agent to forward request
var agent = new http.Agent({
	maxSockets:Infinity
});
// server initailisation
var server = http.createServer(function(req,res){
				console.info("HTTP : ",req.url);
				var options = url.parse(req.url);
				options.localAddress = localWifiAddress;
				options.method = req.method;
				options.headers = req.headers;
				options.agent = agent;

				var serverRequest = http.request(options);
				req.pipe(serverRequest);
				serverRequest.on("response",function(serverResponse){
					console.log("response for",req.url);

					if(overwrideCors){
						for(var header in serverResponse.headers){
							//console.info("header", header, serverResponse.headers[header]);
							if(header.toLowerCase() != "access-control-allow-origin" || header.toLowerCase() != "access-control-allow-credential"){
								res.setHeader(header,serverResponse.headers[header]);
							}
						}
						res.setHeader("Access-Control-Allow-Origin","*");
						res.setHeader("Access-Control-Allow-Credential","true");
					}else{
						res.writeHead(serverResponse.headers);
					}
					res.writeHead(serverResponse.statusCode);
					return serverResponse.pipe(res);
				}).on("error",function(error){
					res.writeHead(502);
					return res.end();
				});
			}).listen(port);

// enable HTTPS threw socket communication
server.addListener("connect",function(req,socket,head){
	console.info("HTTPS : ",req.url);
	var parts = req.url.split(':', 2);
	// open a TCP connection to the remote host
	var options = {
		port:parts[1],
		host:parts[0],
		localAddress:localWifiAddress
	};
	var conn = net.connect(options, function() {
		// respond to the client that the connection was made
		socket.write("HTTP/1.1 200 OK\r\n\r\n");
		// create a tunnel between the two hosts
		socket.pipe(conn);
		conn.pipe(socket);

	});
});

console.info("Server Started on port :", port);
