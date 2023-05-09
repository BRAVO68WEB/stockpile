import fs from "fs";
import os from "os";
import path from "path";
import Stockpile from "./main";

const [commandName, ...commandArgs] = process.argv.slice(2);
const version = "v0.2.0";

if (commandName === "help") {
    console.log("Stockpile CLI");
    console.log(`Version : ${version}`);
    console.log("");
    console.log("Commands:");
    console.log(
        "  init --name <name> --configpath <path> --auth <password> --port <port> --dumppath <path>  | Create a new config file"
    );
    console.log("  start --configpath <path>  | Start Stockpile");
    console.log("  help  Display this help message");
    console.log("");
    console.log("Github : ", "https://github.com/BRAVO68WEB/stockpile");
    console.log("Author : ", "https://github.com/BRAVO68WEB/");
} else if (commandName === "init") {
    try {
        console.log("Initializing new Stockpile config file");

        const config = {
            name: "",
            configpath: path.resolve(os.homedir(), ".stockpile.config.json"),
            auth: "",
            port: 6379,
            dumppath: path.resolve(os.homedir(), ".stockpile.dump"),
        };

        if (commandArgs.length % 2 !== 0) {
            console.log("Invalid init syntax");
            process.exit(1);
        }

        for (let i = 0; i < commandArgs.length; i += 2) {
            const option = commandArgs[i];
            const value = commandArgs[i + 1];

            switch (option) {
                case "--name":
                    config.name = value;
                    break;
                case "--configpath":
                    config.configpath = value;
                    break;
                case "--auth":
                    config.auth = value;
                    break;
                case "--port":
                    config.port = parseInt(value);
                    break;
                case "--dumppath":
                    config.dumppath = value;
                    break;
                default:
                    console.log("Invalid init syntax");
                    process.exit(1);
            }
        }

        fs.writeFileSync(config.configpath, JSON.stringify(config));
        console.log(`Config file created at ${config.configpath}`);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
} else if (commandName === "start") {
    console.log(`Stockpile ${version}`);

    let configpath = "";

    for (let i = 0; i < commandArgs.length; i += 2) {
        const option = commandArgs[i];
        const value = commandArgs[i + 1];

        if (option === "--configpath") {
            configpath = value;
            break;
        }
    }

    if (configpath === "") {
        console.log("No config file specified");
        process.exit(1);
    }

    if (!fs.existsSync(configpath)) {
        console.log("Config file does not exist");
        process.exit(1);
    }

    const config = JSON.parse(fs.readFileSync(configpath, "utf-8"));

    if (
        !config.name ||
        !config.configpath ||
        !config.port ||
        !config.dumppath
    ) {
        console.log("Invalid config file");
        process.exit(1);
    }

    Stockpile(config);
} else {
    console.log("Invalid command");
    process.exit(1);
}
