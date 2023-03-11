const net = require("net");
console.log("Logs from your program will appear here!");

let dataStore = new Map();

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
        dataStore.set(command[4], command[6]);
        connection.write("+OK\r\n");
    }
    else if(command[2] == "GET"){
        if(dataStore.get(command[4]))
            connection.write("+" + dataStore.get(command[4]) + "\r\n");
        else
            connection.write("$-1\r\n");
    }
    else if(command[2] == "DEL"){
        dataStore.delete(command[4]);
        connection.write(":1\r\n");
    }

    else if(command[2] == "ECHO"){
        connection.write("$" + command[4].length + "\r\n" + command[4] + "\r\n");
    }

    else if(command[2] == "EXISTS"){
        if(dataStore.has(command[4]))
            connection.write(":1\r\n");
        else
            connection.write(":0\r\n");
    }

    else if(command[2] == "KEYS"){
        let pattern = command[4];
        let keys = Array.from(dataStore.keys());
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
        if(dataStore.has(key)){
            let newValue = dataStore.get(key) + value;
            dataStore.set(key, newValue);
            connection.write(":" + newValue.length + "\r\n");
        }
        else{
            dataStore.set(key, value);
            connection.write(":" + value.length + "\r\n");
        }
    }

    else if(command[2] == "STRLEN"){
        let key = command[4];
        if(dataStore.has(key)){
            let value = dataStore.get(key);
            connection.write(":" + value.length + "\r\n");
        }
        else{
            connection.write(":0\r\n");
        }
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
        // console.log(dataStore)
        assignHandler(command, connection);
    })
});

server.listen(6379, "127.0.0.1");