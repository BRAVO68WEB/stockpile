const net = require("net");
const fs = require("fs");
const path = require("path");

const MAX_DATABASES = 16;
const DEFAULT_DATABASE = 0;

let dataStore = new Array(MAX_DATABASES);
for (let i = 0; i < MAX_DATABASES; i++) {
  dataStore[i] = new Map();
}

if(fs.existsSync(path.join(__dirname, "data.json"))){
    dataStore = JSON.parse(fs.readFileSync(path.join(__dirname, "data.json")));
    console.log("Data  Restored");
    dataStore = dataStore.map((item) => {
        return new Map(Object.entries(item));
      });
}

let currentDatabase = DEFAULT_DATABASE;

const parseIncomingData = (data) => {
    console.log(JSON.stringify(data.toString()));
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
            let oldValue = dataStore[currentDatabase].get(key);
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
        const keys = command.slice(1);
        const values = keys.map(key => dataStore[currentDatabase].get(key) ?? null);
    
        if (values.includes(null)) {
            connection.write("$-1\r\n");
            console.log("Some keys not found");
        } else {
            const response = values.reduce((acc, value) => {
                return `${acc}\r\n$${value.length}\r\n${value}`;
            }, `*${values.length}`);
            connection.write(response);
            console.log(`MGET response: ${response}`);
        }
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

    else if(command[2] == "INCR"){
        let key = command[4];
        if(dataStore[currentDatabase].has(key)){
            let value = dataStore[currentDatabase].get(key);
            let newValue = parseInt(value) + 1;
            dataStore[currentDatabase].set(key, newValue.toString());
            connection.write(":" + newValue + "\r\n");
        }
        else{
            dataStore[currentDatabase].set(key, "1");
            connection.write(":1\r\n");
        }
    }

    else if(command[2] == "INCRBY"){
        let key = command[4];
        let increment = command[6];
        if(dataStore[currentDatabase].has(key)){
            let value = dataStore[currentDatabase].get(key);
            let newValue = parseInt(value) + parseInt(increment);
            dataStore[currentDatabase].set(key, newValue.toString());
            connection.write(":" + newValue + "\r\n");
        }
        else{
            dataStore[currentDatabase].set(key, increment);
            connection.write(":" + increment + "\r\n");
        }
    }

    else if(command[2] == "DECR"){
        let key = command[4];
        if(dataStore[currentDatabase].has(key)){
            let value = dataStore[currentDatabase].get(key);
            let newValue = parseInt(value) - 1;
            dataStore[currentDatabase].set(key, newValue.toString());
            connection.write(":" + newValue + "\r\n");
        }
        else{
            dataStore[currentDatabase].set(key, "-1");
            connection.write(":-1\r\n");
        }
    }

    else if(command[2] == "DECRBY"){
        let key = command[4];
        let decrement = command[6];
        if(dataStore[currentDatabase].has(key)){
            let value = dataStore[currentDatabase].get(key);
            let newValue = parseInt(value) - parseInt(decrement);
            dataStore[currentDatabase].set(key, newValue.toString());
            connection.write(":" + newValue + "\r\n");
        }
        else{
            dataStore[currentDatabase].set(key, "-" + decrement);
            connection.write(":-" + decrement + "\r\n");
        }
    }

    else if (command[2] == "EXPIRE") {
        const key = command[4];
        const seconds = parseInt(command[6]);
        if (dataStore[currentDatabase].has(key)) {
          // Set the expiration time of the key
          const timestamp = Math.floor(Date.now() / 1000) + seconds;
          dataStore[currentDatabase].set(`${key}:expire`, timestamp);
          connection.write(":1\r\n");
      
          // Schedule the key for deletion when the expiration time has elapsed
          setTimeout(() => {
            if (dataStore[currentDatabase].has(key)) {
              dataStore[currentDatabase].delete(key);
              dataStore[currentDatabase].delete(`${key}:expire`);
            }
          }, seconds * 1000);
        }
        else {
          connection.write(":0\r\n");
        }
      }
      
      else if (command[2] == "TTL") {
        const key = command[4];
        if (dataStore[currentDatabase].has(key)) {
          // Get the expiration time of the key
          const expireKey = `${key}:expire`;
          if (dataStore[currentDatabase].has(expireKey)) {
            const timestamp = dataStore[currentDatabase].get(expireKey);
            const ttl = Math.max(timestamp - Math.floor(Date.now() / 1000), 0);
            connection.write(`:${ttl}\r\n`);
          }
          else {
            connection.write(":-1\r\n");
          }
        }
        else {
          connection.write(":-2\r\n");
        }
      }
      
      else if (command[2] == "EXPIREAT") {
        const key = command[4];
        const timestamp = parseInt(command[6]);
        if (dataStore[currentDatabase].has(key)) {
          // Set the expiration time of the key
          dataStore[currentDatabase].set(`${key}:expire`, timestamp);
          connection.write(":1\r\n");
        }
        else {
          connection.write(":0\r\n");
        }
      }
      else if (command[2] == "PERSIST") {
        const key = command[4];
        if (dataStore[currentDatabase].has(`${key}:expire`)) {
          dataStore[currentDatabase].delete(`${key}:expire`);
          connection.write(":1\r\n");
        }
        else {
          connection.write(":0\r\n");
        }
      }
      
      else if (command[2] == "HGET") {
        const key = command[4];
        const field = command[6];
        if (dataStore[currentDatabase].has(key)) {
          const value = dataStore[currentDatabase].get(key)[field];
          if (value !== undefined) {
            connection.write(`$${value.length}\r\n${value}\r\n`);
          }
          else {
            connection.write("$-1\r\n");
          }
        }
        else {
          connection.write("$-1\r\n");
        }
      }

      else if (command[2] == "HSET") {
        const key = command[4];
        const field = command[6];
        const value = command[8];
        if (!dataStore[currentDatabase].has(key)) {
          dataStore[currentDatabase].set(key, {});
        }
        dataStore[currentDatabase].get(key)[field] = value;
        connection.write(":1\r\n");
      }

      else if (command[2] == "HGETALL") {
        const key = command[4];
        if (dataStore[currentDatabase].has(key)) {
          const obj = dataStore[currentDatabase].get(key);
          let response = "*" + (Object.keys(obj).length * 2) + "\r\n";
          for (const [field, value] of Object.entries(obj)) {
            response += `$${field.length}\r\n${field}\r\n`;
            response += `$${value.length}\r\n${value}\r\n`;
          }
          connection.write(response);
        }
        else {
          connection.write("*0\r\n");
        }
      }
      
      // HSETNX, HINCRBY, HDEL, HEXISTS, HKEYS, HLEN, HSTRLEN, HVALS
      else if (command[2] == "HSETNX") {
        const key = command[4];
        const field = command[6];
        const value = command[8];
        if (!dataStore[currentDatabase].has(key)) {
          dataStore[currentDatabase].set(key, {});
        }
        const obj = dataStore[currentDatabase].get(key);
        if (obj[field] === undefined) {
          obj[field] = value;
          connection.write(":1\r\n");
        }
        else {
          connection.write(":0\r\n");
        }
      }

      else if (command[2] == "HMSET") {
        const hash = command[1];
        const fieldsAndValues = command.slice(2);
        const hashExists = dataStore[currentDatabase].hasOwnProperty(hash);
      
        if (!hashExists) {
          dataStore[currentDatabase][hash] = {};
        }
      
        for (let i = 0; i < fieldsAndValues.length; i += 2) {
          const field = fieldsAndValues[i];
          const value = fieldsAndValues[i + 1];
          dataStore[currentDatabase][hash][field] = value;
        }
      
        connection.write("+OK\r\n");
      }      

      else if (command[2] == "HINCRBY") {
        const key = command[4];
        const field = command[6];
        const increment = Number(command[8]);
        if (!dataStore[currentDatabase].has(key)) {
          dataStore[currentDatabase].set(key, {});
        }
        const obj = dataStore[currentDatabase].get(key);
        if (obj[field] === undefined) {
          obj[field] = "0";
        }
        obj[field] = String(Number(obj[field]) + increment);
        connection.write(":" + obj[field].length + "\r\n" + obj[field] + "\r\n");
      }

      else if (command[2] == "HDEL") {
        const key = command[4];
        const fields = command.slice(6);
        if (!dataStore[currentDatabase].has(key)) {
          connection.write(":0\r\n");
        }
        else {
          const obj = dataStore[currentDatabase].get(key);
          let count = 0;
          for (const field of fields) {
            if (obj.hasOwnProperty(field)) {
              delete obj[field];
              count += 1;
            }
          }
          if (Object.keys(obj).length === 0) {
            dataStore[currentDatabase].delete(key);
          }
          connection.write(":" + count + "\r\n");
        }
      }

      else if (command[2] == "HEXISTS") {
        const key = command[4];
        const field = command[6];
        if (!dataStore[currentDatabase].has(key)) {
          connection.write(":0\r\n");
        }
        else {
          const obj = dataStore[currentDatabase].get(key);
          if (obj.hasOwnProperty(field)) {
            connection.write(":1\r\n");
          }
          else {
            connection.write(":0\r\n");
          }
        }
      }

      else if (command[2] == "HKEYS") {
        const key = command[4];
        if (!dataStore[currentDatabase].has(key)) {
          connection.write("*0\r\n");
        }
        else {
          const obj = dataStore[currentDatabase].get(key);
          const fields = Object.keys(obj);
          let response = "*" + fields.length + "\r\n";
          for (const field of fields) {
            response += "$" + field.length + "\r\n" + field + "\r\n";
          }
          connection.write(response);
        }
      }

      else if (command[2] == "HLEN") {
        const key = command[4];
        if (!dataStore[currentDatabase].has(key)) {
          connection.write(":0\r\n");
        }
        else {
          const obj = dataStore[currentDatabase].get(key);
          const count = Object.keys(obj).length;
          connection.write(":" + count + "\r\n");
        }
      }      

      else if (command[2] == "HSTRLEN") {
        const key = command[4];
        const field = command[6];
        if (!dataStore[currentDatabase].has(key)) {
          connection.write(":0\r\n");
        }
        else {
          const obj = dataStore[currentDatabase].get(key);
          if (obj.hasOwnProperty(field)) {
            const value = obj[field];
            connection.write(":" + value.length + "\r\n");
          }
          else {
            connection.write(":0\r\n");
          }
        }
      }

      else if (command[2] == "HVALS") {
        const key = command[4];
        if (!dataStore[currentDatabase].has(key)) {
          connection.write("*0\r\n");
        }
        else {
          const obj = dataStore[currentDatabase].get(key);
          const values = Object.values(obj);
          let response = "*" + values.length + "\r\n";
          for (const value of values) {
            response += "$" + value.length + "\r\n" + value + "\r\n";
          }
          connection.write(response);
        }
      }
      
      else if (command[2] == "DUMP"){
        saveDataToFile(dataStore, "app/data.json");
        connection.write(":1\r\n");
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

function saveDataToFile(data, filename) {
    let newData = []
    for (let [key, value] of data.entries()) {
        newData.push(Object.fromEntries(value))
    }
    fs.writeFileSync(filename, JSON.stringify(newData), err => {
      if (err) {
        console.log(err);
      } else {
        console.log(`Data saved to ${filename}`);
      }
    });
  }