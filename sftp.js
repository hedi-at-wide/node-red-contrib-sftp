(function() {
	
	var debug = false;
	
  module.exports = function(RED) {
    var SFTPCredentialsNode, SFTPNode;
	var Client = require('ssh2-sftp-client');

    SFTPCredentialsNode = function(config) {
      
      RED.nodes.createNode(this, config);
	  
	  var node = this;
      
	  if(debug) {node.warn(config);}
	  
	  this.host = config.host;
	  this.port = config.port;
	  this.username = config.username;
	  this.password = config.password;
    };
	
    SFTPNode = function(config) {
      var key, node, value;
	  
      RED.nodes.createNode(this, config);
	  
      node = this;
	  
      for (key in config) {
        value = config[key];
        node[key] = value;
      }
	  
      this.server = RED.nodes.getNode(config.server);
	  
	  if(debug) {node.warn(this);}
	  
      return this.on('input', (function(_this) {
		  
        return function(msg) {
			
			  var body, req, request;
			  
			  node.status({
				fill: "grey",
				shape: "dot",
				text: "connecting"
			  });
			  
			
			var sftp = new Client();
			
			if(debug) {node.warn(node);}
			
			sftp.connect({
				host: msg.sftp_host || node.server.host,
				port: msg.sftp_port || node.server.port,
				username: msg.sftp_username || node.server.username,
				password: msg.sftp_password || node.server.password
			}).then(() => {
				
				this.method = msg.method || node.method;
				this.remoteFilePath = msg.remoteFilePath || node.remoteFilePath;
				this.useCompression = msg.useCompression || node.useCompression;
				this.encoding = msg.encoding || node.encoding;
				this.localFilePath = msg.localFilePath || node.localFilePath;
				this.remoteDestPath = msg.remoteDestPath || node.remoteDestPath;
				this.mode = msg.mode || node.mode;
				
				if(debug) {node.warn(this.method);}
				
				node.status({
				  shape: "dot",
				  fill: "yellow",
				  text : node.method
				});
				
				switch(this.method) {
					case "list":
						return sftp.list(this.remoteFilePath);
					case "get":
						return sftp.get(this.remoteFilePath, this.localFilePath, this.useCompression, this.encoding);
					case "put":
						return sftp.put(this.localFilePath, this.remoteFilePath, this.useCompression, this.encoding);
					case "mkdir":
						return sftp.mkdir(this.remoteFilePath);
					case "rmdir":
						return sftp.rmdir(this.remoteFilePath);
					case "delete":
						return sftp.delete(this.remoteFilePath);
					case "rename":
						return sftp.rename(this.remoteFilePath, this.remoteDestPath);
					case "chmod":
						return sftp.chmod(this.remoteFilePath, this.mode);
				}
				
			}).then((data) => {
				
				if(debug) {node.warn(data);}
				
				sftp.end();
				
				node.status({
				  shape: "dot",
				  fill: "green",
				  text : "Success"
				});
				
				msg.payload = data;
				msg.remoteFilePath = this.remoteFilePath;
				
				node.send(msg);
				
				
			}).catch((err) => {
				
				if(debug) {node.warn(err);}
				
				sftp.end();
				
				node.status({
				  shape: "dot",
				  fill: "red",
				  text : "Error: " + err
				});
				
				msg.payload = err;
				msg.error = true;
				
				node.send(msg);
				
			});
		
        };
      })(this));
	  
    };
    RED.nodes.registerType("SFTP-credentials", SFTPCredentialsNode);
    return RED.nodes.registerType("SFTP-w-params", SFTPNode);
  };

}).call(this);
