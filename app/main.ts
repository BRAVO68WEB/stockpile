import net, { Socket } from "net";
import fs from "fs";
import path from "path";
import pkg from "../package.json" assert { type: "json" };
import { createBinaryData, readBinaryData } from "./buffer";

interface IAuthConfig {
    enabled: boolean;
    isAuthenticated: boolean;
    password: string;
}

export interface IConfig {
    port: number;
    auth?: string;
    dumppath: string;
    configpath: string;
    name: string;
    logpath: string;
}

interface IConnection extends Socket {
    id: number;
}

export default (config: IConfig) => {
    const MAX_DATABASES = 16;
    const DEFAULT_DATABASE = 0;

    const authConfig: IAuthConfig = {
        enabled: config.auth ? true : false,
        isAuthenticated: false,
        password: config.auth ? config.auth : "",
    };

    let dataStore: any[] | Buffer = new Array(MAX_DATABASES);
    for (let i = 0; i < MAX_DATABASES; i++) {
        dataStore[i] = new Map();
    }

    if (fs.existsSync(path.join(config.dumppath))) {
        dataStore = fs.readFileSync(path.join(config.dumppath));
        dataStore = readBinaryData(dataStore);
    }

    let currentDatabase = DEFAULT_DATABASE;

    const parseIncomingData = (data) => {
        const lines: string[] = data.toString().split("\r\n");
        return lines;
    };

    const assignHandler = (command: string[], connection: IConnection) => {
        command[2] = command[2].toUpperCase();
        if (
            authConfig.enabled &&
            !authConfig.isAuthenticated &&
            command[2] !== "AUTH"
        ) {
            connection.write("-ERR NOAUTH Authentication required.\r\n");
            return;
        }

        switch (command[2] as string) {
            case "INFO": {
                connection.write(`+# Stockpile Server ${pkg.version}\r\n`);
                break;
            }
            case "AUTH": {
                if (authConfig.enabled) {
                    if (authConfig.isAuthenticated) {
                        connection.write("-ERR Already authenticated\r\n");
                    } else if (command[4] == authConfig.password) {
                        authConfig.isAuthenticated = true;
                        connection.write("+OK Auth Successfull\r\n");
                    } else if (command[4] != authConfig.password) {
                        connection.write("-ERR Invalid Password\r\n");
                    }
                } else {
                    connection.write("-ERR Authentication is not enabled\r\n");
                }
                break;
            }

            case "PING": {
                connection.write("+PONG\r\n");
                break;
            }

            case "SET": {
                dataStore[currentDatabase].set(command[4], command[6]);
                let expireTime: number | null = null;

                for (let i = 8; i < command.length; i += 2) {
                    if (command[i].toUpperCase() === "PX") {
                        expireTime = Date.now() + parseInt(command[i + 2]);
                    } else if (command[i].toUpperCase() === "EX") {
                        expireTime =
                            Date.now() + parseInt(command[i + 2]) * 1000;
                    }
                }

                if (expireTime) {
                    dataStore[currentDatabase].set(
                        command[4] + "_expire",
                        expireTime
                    );
                }
                connection.write("+OK\r\n");
                break;
            }

            case "GET": {
                if (
                    dataStore[currentDatabase].get(command[4] + "_expire") &&
                    dataStore[currentDatabase].get(command[4] + "_expire") <
                        Date.now()
                ) {
                    connection.write("$-1\r\n");
                    dataStore[currentDatabase].delete(command[4]);
                    dataStore[currentDatabase].delete(command[4] + "_expire");
                } else if (dataStore[currentDatabase].get(command[4]))
                    connection.write(
                        "+" +
                            dataStore[currentDatabase].get(command[4]) +
                            "\r\n"
                    );
                else connection.write("$-1\r\n");
                break;
            }

            case "DEL": {
                dataStore[currentDatabase].delete(command[4]);
                connection.write(":1\r\n");
                break;
            }

            case "ECHO": {
                connection.write(
                    "$" + command[4].length + "\r\n" + command[4] + "\r\n"
                );
                break;
            }

            case "EXISTS": {
                if (dataStore[currentDatabase].has(command[4]))
                    connection.write(":1\r\n");
                else connection.write(":0\r\n");
                break;
            }

            case "KEYS": {
                let pattern = command[4];
                let keys = Array.from(dataStore[currentDatabase].keys());
                let matchingKeys = keys.filter((key: any) => {
                    const regex = new RegExp(pattern.replace("*", ".*"));
                    return regex.test(key);
                }) as any[];
                let response = "*" + matchingKeys.length + "\r\n";
                for (let key of matchingKeys) {
                    response += "$" + key.length + "\r\n" + key + "\r\n";
                }
                connection.write(response);
                break;
            }

            case "APPEND": {
                let key = command[4];
                let value = command[6];
                if (dataStore[currentDatabase].has(key)) {
                    let newValue = dataStore[currentDatabase].get(key) + value;
                    dataStore[currentDatabase].set(key, newValue);
                    connection.write(":" + newValue.length + "\r\n");
                } else {
                    dataStore[currentDatabase].set(key, value);
                    connection.write(":" + value.length + "\r\n");
                }
                break;
            }

            case "STRLEN": {
                let key = command[4];
                if (dataStore[currentDatabase].has(key)) {
                    let value = dataStore[currentDatabase].get(key);
                    connection.write(":" + value.length + "\r\n");
                } else {
                    connection.write(":0\r\n");
                }
                break;
            }

            case "SETNX": {
                let key = command[4];
                let value = command[6];
                if (dataStore[currentDatabase].has(key)) {
                    connection.write(":0\r\n");
                } else {
                    dataStore[currentDatabase].set(key, value);
                    connection.write(":1\r\n");
                }
                break;
            }

            case "SETRANGE": {
                let key = command[4];
                let offset = command[6];
                let value = command[8];
                if (dataStore[currentDatabase].has(key)) {
                    let oldValue = dataStore[currentDatabase].get(key);
                    let newValue =
                        oldValue.substring(0, offset) +
                        value +
                        oldValue.substring(offset + value.length);
                    dataStore[currentDatabase].set(key, newValue);
                    connection.write(":" + newValue.length + "\r\n");
                } else {
                    dataStore[currentDatabase].set(key, value);
                    connection.write(":" + value.length + "\r\n");
                }
                break;
            }

            case "GETRANGE": {
                let key = command[4];
                let start = command[6];
                let end = command[8];
                if (dataStore[currentDatabase].has(key)) {
                    let value = dataStore[currentDatabase].get(key);
                    let newValue = value.substring(start, end + 1);
                    connection.write(
                        "$" + newValue.length + "\r\n" + newValue + "\r\n"
                    );
                } else {
                    connection.write("$-1\r\n");
                }
                break;
            }

            case "MSET": {
                const keyValuePairs = command.slice(4);
                for (let i = 0; i < keyValuePairs.length; ) {
                    dataStore[currentDatabase].set(
                        keyValuePairs[i],
                        keyValuePairs[i + 2]
                    );
                    i += 4;
                }
                connection.write("+OK\r\n");
                break;
            }

            case "MGET": {
                const keys = command.slice(1);
                const values = keys.map(
                    (key) => dataStore[currentDatabase].get(key) ?? null
                );

                if (values.includes(null)) {
                    connection.write("$-1\r\n");
                } else {
                    const response = values.reduce((acc, value) => {
                        return `${acc}\r\n$${value.length}\r\n${value}`;
                    }, `*${values.length}`);
                    connection.write(response);
                }
                break;
            }

            case "FLUSHDB": {
                dataStore[currentDatabase].clear();
                connection.write("+OK\r\n");
                break;
            }

            case "FLUSHALL": {
                dataStore = [];
                for (let i = 0; i < 16; i++) {
                    dataStore.push(new Map());
                }
                connection.write("+OK\r\n");
                break;
            }

            case "DBSIZE": {
                let size = dataStore[currentDatabase].size;
                connection.write(":" + size + "\r\n");
                break;
            }

            case "SELECT": {
                let database = Number(command[4]);
                currentDatabase = database;
                connection.write("+OK\r\n");
                break;
            }

            case "RANDOMKEY": {
                let keys = Array.from(dataStore[currentDatabase].keys());
                if (keys.length == 0) {
                    connection.write("$-1\r\n");
                    return;
                }
                let randomKey: string[] = keys[
                    Math.floor(Math.random() * keys.length)
                ] as string[];
                connection.write(
                    "$" + randomKey.length + "\r\n" + randomKey + "\r\n"
                );
                break;
            }

            case "INCR": {
                let key = command[4];
                if (dataStore[currentDatabase].has(key)) {
                    let value = dataStore[currentDatabase].get(key);
                    let newValue = parseInt(value) + 1;
                    dataStore[currentDatabase].set(key, newValue.toString());
                    connection.write(":" + newValue + "\r\n");
                } else {
                    dataStore[currentDatabase].set(key, "1");
                    connection.write(":1\r\n");
                }
                break;
            }

            case "INCRBY": {
                let key = command[4];
                let increment = command[6];
                if (dataStore[currentDatabase].has(key)) {
                    let value = dataStore[currentDatabase].get(key);
                    let newValue = parseInt(value) + parseInt(increment);
                    dataStore[currentDatabase].set(key, newValue.toString());
                    connection.write(":" + newValue + "\r\n");
                } else {
                    dataStore[currentDatabase].set(key, increment);
                    connection.write(":" + increment + "\r\n");
                }
                break;
            }

            case "DECR": {
                let key = command[4];
                if (dataStore[currentDatabase].has(key)) {
                    let value = dataStore[currentDatabase].get(key);
                    let newValue = parseInt(value) - 1;
                    dataStore[currentDatabase].set(key, newValue.toString());
                    connection.write(":" + newValue + "\r\n");
                } else {
                    dataStore[currentDatabase].set(key, "-1");
                    connection.write(":-1\r\n");
                }
                break;
            }

            case "DECRBY": {
                let key = command[4];
                let decrement = command[6];
                if (dataStore[currentDatabase].has(key)) {
                    let value = dataStore[currentDatabase].get(key);
                    let newValue = parseInt(value) - parseInt(decrement);
                    dataStore[currentDatabase].set(key, newValue.toString());
                    connection.write(":" + newValue + "\r\n");
                } else {
                    dataStore[currentDatabase].set(key, "-" + decrement);
                    connection.write(":-" + decrement + "\r\n");
                }
                break;
            }

            case "EXPIRE": {
                const key = command[4];
                const seconds = parseInt(command[6]);
                if (dataStore[currentDatabase].has(key)) {
                    const timestamp = Math.floor(Date.now() / 1000) + seconds;
                    dataStore[currentDatabase].set(`${key}:expire`, timestamp);
                    connection.write(":1\r\n");

                    setTimeout(() => {
                        if (dataStore[currentDatabase].has(key)) {
                            dataStore[currentDatabase].delete(key);
                            dataStore[currentDatabase].delete(`${key}:expire`);
                        }
                    }, seconds * 1000);
                } else {
                    connection.write(":0\r\n");
                }
                break;
            }

            case "TTL": {
                const key = command[4];
                if (dataStore[currentDatabase].has(key)) {
                    // Get the expiration time of the key
                    const expireKey = `${key}:expire`;
                    if (dataStore[currentDatabase].has(expireKey)) {
                        const timestamp =
                            dataStore[currentDatabase].get(expireKey);
                        const ttl = Math.max(
                            timestamp - Math.floor(Date.now() / 1000),
                            0
                        );
                        connection.write(`:${ttl}\r\n`);
                    } else {
                        connection.write(":-1\r\n");
                    }
                } else {
                    connection.write(":-2\r\n");
                }
                break;
            }

            case "PERSIST": {
                const key = command[4];
                if (dataStore[currentDatabase].has(`${key}:expire`)) {
                    dataStore[currentDatabase].delete(`${key}:expire`);
                    connection.write(":1\r\n");
                } else {
                    connection.write(":0\r\n");
                }
                break;
            }

            case "HGET": {
                const key = command[4];
                const field = command[6];
                if (dataStore[currentDatabase].has(key)) {
                    const value = dataStore[currentDatabase].get(key)[field];
                    if (value !== undefined) {
                        connection.write(`$${value.length}\r\n${value}\r\n`);
                    } else {
                        connection.write("$-1\r\n");
                    }
                } else {
                    connection.write("$-1\r\n");
                }
                break;
            }

            case "HSET": {
                const key = command[4];
                const field = command[6];
                const value = command[8];
                if (!dataStore[currentDatabase].has(key)) {
                    dataStore[currentDatabase].set(key, {});
                }
                dataStore[currentDatabase].get(key)[field] = value;
                connection.write(":1\r\n");
                break;
            }

            case "HGETALL": {
                const key = command[4];
                if (dataStore[currentDatabase].has(key)) {
                    const obj = dataStore[currentDatabase].get(key);
                    let response = "*" + Object.keys(obj).length * 2 + "\r\n";
                    for (const [field, value] of Object.entries(obj) as any) {
                        response += `$${field.length}\r\n${field}\r\n`;
                        response += `$${value.length}\r\n${value}\r\n`;
                    }
                    connection.write(response);
                } else {
                    connection.write("*0\r\n");
                }
                break;
            }

            case "HSETNX": {
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
                } else {
                    connection.write(":0\r\n");
                }
                break;
            }

            case "HMSET": {
                const hash = command[1];
                const fieldsAndValues = command.slice(2);
                const hashExists =
                    dataStore[currentDatabase].hasOwnProperty(hash);

                if (!hashExists) {
                    dataStore[currentDatabase][hash] = {};
                }

                for (let i = 0; i < fieldsAndValues.length; i += 2) {
                    const field = fieldsAndValues[i];
                    const value = fieldsAndValues[i + 1];
                    dataStore[currentDatabase][hash][field] = value;
                }

                connection.write("+OK\r\n");
                break;
            }

            case "HINCRBY": {
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
                connection.write(
                    ":" + obj[field].length + "\r\n" + obj[field] + "\r\n"
                );
                break;
            }

            case "HDEL": {
                const key = command[4];
                const fields = command.slice(6);
                if (!dataStore[currentDatabase].has(key)) {
                    connection.write(":0\r\n");
                } else {
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
                break;
            }

            case "HEXISTS": {
                const key = command[4];
                const field = command[6];
                if (!dataStore[currentDatabase].has(key)) {
                    connection.write(":0\r\n");
                } else {
                    const obj = dataStore[currentDatabase].get(key);
                    if (obj.hasOwnProperty(field)) {
                        connection.write(":1\r\n");
                    } else {
                        connection.write(":0\r\n");
                    }
                }
                break;
            }

            case "HKEYS": {
                const key = command[4];
                if (!dataStore[currentDatabase].has(key)) {
                    connection.write("*0\r\n");
                } else {
                    const obj = dataStore[currentDatabase].get(key);
                    const fields = Object.keys(obj);
                    let response = "*" + fields.length + "\r\n";
                    for (const field of fields) {
                        response +=
                            "$" + field.length + "\r\n" + field + "\r\n";
                    }
                    connection.write(response);
                }
                break;
            }

            case "HLEN": {
                const key = command[4];
                if (!dataStore[currentDatabase].has(key)) {
                    connection.write(":0\r\n");
                } else {
                    const obj = dataStore[currentDatabase].get(key);
                    const count = Object.keys(obj).length;
                    connection.write(":" + count + "\r\n");
                }
                break;
            }

            case "HSTRLEN": {
                const key = command[4];
                const field = command[6];
                if (!dataStore[currentDatabase].has(key)) {
                    connection.write(":0\r\n");
                } else {
                    const obj = dataStore[currentDatabase].get(key);
                    if (obj.hasOwnProperty(field)) {
                        const value = obj[field];
                        connection.write(":" + value.length + "\r\n");
                    } else {
                        connection.write(":0\r\n");
                    }
                }
                break;
            }

            case "HVALS": {
                const key = command[4];
                if (!dataStore[currentDatabase].has(key)) {
                    connection.write("*0\r\n");
                } else {
                    const obj = dataStore[currentDatabase].get(key);
                    const values = Object.values(obj);
                    let response = "*" + values.length + "\r\n";
                    for (const value of values as string[]) {
                        response +=
                            "$" + value.length + "\r\n" + value + "\r\n";
                    }
                    connection.write(response);
                }
                break;
            }

            case "DUMP": {
                saveDataToFile(dataStore);
                connection.write("+OK Saving Current State\r\n");
                break;
            }

            default: {
                connection.write("-ERR unknown command " + command[2] + "\r\n");
                break;
            }
        }
    };

    let id = 0;
    const handleConnection = (connection: IConnection) => {
        connection.id = id;
        id += 1;

        connection.on("data", (data) => {
            let command = parseIncomingData(data);
            assignHandler(command, connection);
        });

        connection.on("end", () => {
            console.log(`Client ${connection.id} disconnected`);
        });

        connection.on("error", (err) => {
            console.log(`Error in connection ${connection.id}`);
            console.log(err);
        });
    };

    const server: net.Server = net.createServer(handleConnection as any);

    server.listen(config.port, "0.0.0.0", () => {
        console.log("Listening on port " + config.port);
    });

    function saveDataToFile(data) {
        const binaryData = createBinaryData(data);
        fs.writeFileSync(config.dumppath, binaryData);
    }

    process.on("SIGINT", () => {
        console.log("\nTaking Snapshot !!");
        saveDataToFile(dataStore);
        console.log("Shutting down server ...");
        process.exit(0);
    });
};
