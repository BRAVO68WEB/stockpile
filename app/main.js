const net = require("net");

console.log("Logs from your program will appear here!");

const server = net.createServer((connection) => {
  connection.on("data", (data) => {
    // console.log(JSON.stringify(data.toString()));
    const command = data.toString().split("\r\n")[2];
    if(command == "PING" || command == "ping")
        connection.write("+PONG\r\n");
  })
});

server.listen(6379, "127.0.0.1");
