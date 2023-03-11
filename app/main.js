const net = require("net");

console.log("Logs from your program will appear here!");

const parseIncomingData = (data) => {
    const lines = data.toString().split("\r\n");
    // DEBUG input data
    console.log(lines);
    return lines;
}

let id = 0;

const server = net.createServer((connection) => {
    connection.id = id;
	id += 1;

    connection.on("data", (data) => {
        let command = parseIncomingData(data);
        if(command[2] == "PING" || command[2] == "ping")
            connection.write("+PONG\r\n");
    })
});

server.listen(6379, "127.0.0.1");
