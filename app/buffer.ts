import { BSON } from "bson";

type MapData = Map<MapEntry, any>[];
type MapEntry = [string, any];

function createBinaryData(mapData: MapData) {
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
    const mapData: MapData = [];

    // Convert each object in the data object to a Map
    for (const key in data as MapEntry) {
        const obj = data[key];
        const map = new Map();
        for (const [key, value] of Object.entries(obj)) {
            map.set(key, value);
        }
        mapData.push(map);
    }

    return mapData;
}
export { createBinaryData, readBinaryData };
