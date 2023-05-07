const { BSON } = require("bson");

function createBinaryData(mapData) {
    const data = {};
    // Add each map in the array to the data object
    for (let i = 0; i < mapData.length; i++) {
        data[i] = Object.fromEntries(mapData[i]);
    }
    // Serialize the data object with BSON
    return BSON.serialize(data);
}

function readBinaryData(buffer) {
    const data = BSON.deserialize(buffer);
    const mapData = [];

    // Convert each object in the data object to a Map
    for (const key in data) {
        const obj = data[key];
        const map = new Map();
        for (const [key, value] of Object.entries(obj)) {
            if (typeof value === "object") {
                map.set(key, value);
            } else {
                map.set(key, value);
            }
        }
        mapData.push(map);
    }

    return mapData;
}
module.exports = {
    createBinaryData,
    readBinaryData,
};
