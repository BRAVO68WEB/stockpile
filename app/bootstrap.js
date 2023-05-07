#!/usr/bin/env node

// This is the main entry point for the application.

// CLI arguments are passed to this file, and then passed to the main application.
// Do not use any CLI framework here, as it will be difficult to maintain.

const commandName = process.argv[2];
const commandArgs = process.argv.slice(3);
const fs = require("fs");
const os = require("os");
const path = require("path");
const pkg = require("../package.json");

if (commandName === "help") {
    console.log("Stockpile CLI");
    console.log("Version " + pkg.version);
    console.log("");
    console.log("Commands:");
    console.log(
        "  init --name <name> --configpath <path> --auth <password> --port <port> --dumppath <path>  | Create a new config file"
    );
    console.log("  start --configpath <path>  | Start Stockpile");
    console.log("  help  Display this help message");
    console.log("");
    console.log("Github : ", pkg.repository.url.split("+")[1]);
    console.log("Author : ", pkg.author.name);
    process.exit(0);
} else if (commandName === "init") {
    try {
        console.log("Initializing new Stockpile config file");

        let config = {
            name: "",
            configpath: os.homedir() + "/.stockpile.config.json",
            auth: "",
            port: 6379,
            dumppath: os.homedir() + "/.stockpile.dump",
        };

        if (commandArgs.length % 2 !== 0) {
            console.log("Invalid init syntax");
            return;
        }

        for (const i in commandArgs) {
            if (commandArgs[i] === "--name") {
                config.name = commandArgs[parseInt(i) + 1];
            } else if (commandArgs[i] === "--configpath") {
                config.configpath = commandArgs[parseInt(i) + 1];
            } else if (commandArgs[i] === "--auth") {
                config.auth = commandArgs[parseInt(i) + 1];
            } else if (commandArgs[i] === "--port") {
                config.port = commandArgs[parseInt(i) + 1];
            } else if (commandArgs[i] === "--dumppath") {
                config.dumppath = commandArgs[parseInt(i) + 1];
            }
        }

        fs.writeFileSync(
            path.resolve(config.configpath),
            JSON.stringify(config)
        );
        console.log("Config file created at " + config.configpath);
        process.exit(0);
    } catch (err) {
        console.log(err);
        process.exit(1);
    }
} else if (commandName === "start") {
    console.log("Starting Stockpile");

    let configpath = "";
    for (const i in commandArgs) {
        if (commandArgs[i] === "--configpath") {
            configpath = commandArgs[parseInt(i) + 1];
        }
    }
    if (configpath === "") {
        console.log("No config file specified");
        return;
    }

    if (!fs.existsSync(configpath)) {
        console.log("Config file does not exist");
        return;
    }

    const config = JSON.parse(fs.readFileSync(configpath));

    ["name", "configpath", "port", "dumppath"].forEach((key) => {
        if (!config[key]) {
            console.log("Invalid config file");
            process.exit(1);
        }
    });

    const Stockpile = require("./main.js");
    Stockpile(config);
} else {
    console.log("Invalid command");
}
