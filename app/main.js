const net = require("net");
console.log("Logs from your program will appear here!");

const MAX_DATABASES = 16;
const DEFAULT_DATABASE = 0;

let dataStore = new Array(MAX_DATABASES);
for (let i = 0; i < MAX_DATABASES; i++) {
  dataStore[i] = new Map();
}

let currentDatabase = DEFAULT_DATABASE;

const parseIncomingData = (data) => {
    const lines = data.toString().split("\r\n");
    return lines;
}

const assignHandler = (command, connection) => {
    command[2] = command[2].toUpperCase();
    if(command[2] == "PING"){
        connection.write("+PONG\r\n");
    }
    else if(command[2] == "SET"){
        dataStore[currentDatabase].set(command[4], command[6]);
        connection.write("+OK\r\n");
    }
    else if(command[2] == "GET"){
        if(dataStore[currentDatabase].get(command[4]))
            connection.write("+" + dataStore[currentDatabase].get(command[4]) + "\r\n");
        else
            connection.write("$-1\r\n");
    }
    else if(command[2] == "DEL"){
        dataStore[currentDatabase].delete(command[4]);
        connection.write(":1\r\n");
    }

    else if(command[2] == "ECHO"){
        connection.write("$" + command[4].length + "\r\n" + command[4] + "\r\n");
    }

    else if(command[2] == "EXISTS"){
        if(dataStore[currentDatabase].has(command[4]))
            connection.write(":1\r\n");
        else
            connection.write(":0\r\n");
    }

    else if(command[2] == "KEYS"){
        let pattern = command[4];
        let keys = Array.from(dataStore[currentDatabase].keys());
        let matchingKeys = keys.filter(key => {
            const regex = new RegExp(pattern.replace("*", ".*"));
            return regex.test(key);
        });
        let response = "*" + matchingKeys.length + "\r\n";
        for(let key of matchingKeys){
            response += "$" + key.length + "\r\n" + key + "\r\n";
        }
        connection.write(response);
    }

    else if(command[2] == "APPEND"){
        let key = command[4];
        let value = command[6];
        if(dataStore[currentDatabase].has(key)){
            let newValue = dataStore[currentDatabase].get(key) + value;
            dataStore[currentDatabase].set(key, newValue);
            connection.write(":" + newValue.length + "\r\n");
        }
        else{
            dataStore[currentDatabase].set(key, value);
            connection.write(":" + value.length + "\r\n");
        }
    }

    else if(command[2] == "STRLEN"){
        let key = command[4];
        if(dataStore[currentDatabase].has(key)){
            let value = dataStore[currentDatabase].get(key);
            connection.write(":" + value.length + "\r\n");
        }
        else{
            connection.write(":0\r\n");
        }
    }

    else if(command[2] == "SETNX"){
        let key = command[4];
        let value = command[6];
        if(dataStore[currentDatabase].has(key)){
            connection.write(":0\r\n");
        }
        else{
            dataStore[currentDatabase].set(key, value);
            connection.write(":1\r\n");
        }
    }

    else if(command[2] == "SETRANGE"){
        let key = command[4];
        let offset = command[6];
        let value = command[8];
        if(dataStore[currentDatabase].has(key)){
            let oldValue = dataStore.get(key);
            let newValue = oldValue.substring(0, offset) + value + oldValue.substring(offset + value.length);
            dataStore[currentDatabase].set(key, newValue);
            connection.write(":" + newValue.length + "\r\n");
        }
        else{
            dataStore[currentDatabase].set(key, value);
            connection.write(":" + value.length + "\r\n");
        }
    }

    else if(command[2] == "GETRANGE"){
        let key = command[4];
        let start = command[6];
        let end = command[8];
        if(dataStore[currentDatabase].has(key)){
            let value = dataStore[currentDatabase].get(key);
            let newValue = value.substring(start, end + 1);
            connection.write("$" + newValue.length + "\r\n" + newValue + "\r\n");
        }
        else{
            connection.write("$-1\r\n");
        }
    }

    else if (command[2] == "MSET") {
        const keyValuePairs = command.slice(4);
        console.log(keyValuePairs);
        for (let i = 0; i < keyValuePairs.length; i += 2) {
          dataStore[currentDatabase].set(keyValuePairs[i], keyValuePairs[i + 2]);
        }
        connection.write("+OK\r\n");
    }
      
    else if (command[2] == "MGET") {
        const keys = command.slice(4);
        const values = keys.map(key => dataStore[currentDatabase].get(key) ?? "$-1\r\n");
        const response = values.reduce((acc, value) => {
            return `${acc}\r\n$${value.length}\r\n${value}`;
        }, `*${values.length}`);
        connection.write(response);
    }

    // TODO: Monitor command is not working
    else if (command[2] == "MONITOR") {
        console.log("Monitoring started.");
        connection.write("+OK\r\n");
    }

    else if (command[2] == "FLUSHDB") {
        dataStore[currentDatabase].clear();
        connection.write("+OK\r\n");
    }

    else if(command[2] == "FLUSHALL"){
        dataStore = [];
        for(let i = 0; i < 16; i++){
            dataStore.push(new Map());
        }
        connection.write("+OK\r\n");
    }

    else if(command[2] == "DBSIZE"){
        let size = dataStore[currentDatabase].size;
        connection.write(":" + size + "\r\n");
    }

    else if(command[2] == "SELECT"){
        let database = command[4];
        currentDatabase = database;
        connection.write("+OK\r\n");
    }

    else if(command[2] == "RANDOMKEY"){
        let keys = Array.from(dataStore[currentDatabase].keys());
        if(keys.length == 0){
            connection.write("$-1\r\n");
            return;
        }
        let randomKey = keys[Math.floor(Math.random() * keys.length)];
        connection.write("$" + randomKey.length + "\r\n" + randomKey + "\r\n");
    }
}

const stateChecker = (state) => {
    if(state.includes("*")){
        console.log("Array");
    }
    else if(state.includes("$")){
        console.log("String");
    }
    else if(state.includes(":")){
        console.log("Integer");
    }
    else if(state.includes("+")){
        console.log("Simple String");
    }
    else if(state.includes("-")){
        console.log("Error");
    }
    else{
        console.log("Unknown");
    }
}

let id = 0;
const server = net.createServer((connection) => {
    connection.id = id;
	id += 1;

    connection.on("data", (data) => {
        let command = parseIncomingData(data);
        console.log(dataStore)
        assignHandler(command, connection);
    })
});

server.listen(6379, "127.0.0.1");