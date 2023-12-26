'use strict';
var fs = require("fs");

var mapDir = '../gds';
var buffTable = require(mapDir + '/buff_table.json')['Config'];
var lootGDS = require('./loot-gds.json');

var count = 0;

var mapId = 4;

//city 来自于 city.text
var basePoints = {
    "ports1": [
        { "x": 5, "y": 13 },
        { "x": 2, "y": 33 },
        { "x": 8, "y": 22 },
        { "x": 5, "y": 30 },
        { "x": 10, "y": 18 },
        { "x": 2, "y": 21 }
    ],
    "ports": [
        { "x": 7, "y": 16 },
        { "x": 3, "y": 38 },
        { "x": 9, "y": 34 },
        { "x": 6, "y": 33 },
        { "x": 10, "y": 18 },
        { "x": 2, "y": 23 },

        { "x": 7, "y": 5 },
        { "x": 5, "y": 4 },
        { "x": 3, "y": 4 },
        { "x": 1, "y": 6 },
        { "x": 9, "y": 1 },
        { "x": 1, "y": 27 }
    ],
    "mapConfig": {
        "-10^20": {
            "x_id": -10,
            "y_id": 20,
            "x": 0,
            "y": 0,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^20": {
            "x_id": -8,
            "y_id": 20,
            "x": 1,
            "y": 0,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-6^20": {
            "x_id": -6,
            "y_id": 20,
            "x": 2,
            "y": 0,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-4^20": {
            "x_id": -4,
            "y_id": 20,
            "x": 3,
            "y": 0,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-2^20": {
            "x_id": -2,
            "y_id": 20,
            "x": 4,
            "y": 0,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "0^20": {
            "x_id": 0,
            "y_id": 20,
            "x": 5,
            "y": 0,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "2^20": {
            "x_id": 2,
            "y_id": 20,
            "x": 6,
            "y": 0,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "4^20": {
            "x_id": 4,
            "y_id": 20,
            "x": 7,
            "y": 0,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "6^20": {
            "x_id": 6,
            "y_id": 20,
            "x": 8,
            "y": 0,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "8^20": {
            "x_id": 8,
            "y_id": 20,
            "x": 9,
            "y": 0,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "10^20": {
            "x_id": 10,
            "y_id": 20,
            "x": 10,
            "y": 0,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-9^19": {
            "x_id": -9,
            "y_id": 19,
            "x": 0,
            "y": 1,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-7^19": {
            "x_id": -7,
            "y_id": 19,
            "x": 1,
            "y": 1,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-5^19": {
            "x_id": -5,
            "y_id": 19,
            "x": 2,
            "y": 1,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-3^19": {
            "x_id": -3,
            "y_id": 19,
            "x": 3,
            "y": 1,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-1^19": {
            "x_id": -1,
            "y_id": 19,
            "x": 4,
            "y": 1,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "1^19": {
            "x_id": 1,
            "y_id": 19,
            "x": 5,
            "y": 1,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "3^19": {
            "x_id": 3,
            "y_id": 19,
            "x": 6,
            "y": 1,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "5^19": {
            "x_id": 5,
            "y_id": 19,
            "x": 7,
            "y": 1,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "7^19": {
            "x_id": 7,
            "y_id": 19,
            "x": 8,
            "y": 1,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "9^19": {
            "x_id": 9,
            "y_id": 19,
            "x": 9,
            "y": 1,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "11^19": {
            "x_id": 11,
            "y_id": 19,
            "x": 10,
            "y": 1,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^18": {
            "x_id": -10,
            "y_id": 18,
            "x": 0,
            "y": 2,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^18": {
            "x_id": -8,
            "y_id": 18,
            "x": 1,
            "y": 2,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-6^18": {
            "x_id": -6,
            "y_id": 18,
            "x": 2,
            "y": 2,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-4^18": {
            "x_id": -4,
            "y_id": 18,
            "x": 3,
            "y": 2,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-2^18": {
            "x_id": -2,
            "y_id": 18,
            "x": 4,
            "y": 2,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "0^18": {
            "x_id": 0,
            "y_id": 18,
            "x": 5,
            "y": 2,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "2^18": {
            "x_id": 2,
            "y_id": 18,
            "x": 6,
            "y": 2,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "4^18": {
            "x_id": 4,
            "y_id": 18,
            "x": 7,
            "y": 2,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "6^18": {
            "x_id": 6,
            "y_id": 18,
            "x": 8,
            "y": 2,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "8^18": {
            "x_id": 8,
            "y_id": 18,
            "x": 9,
            "y": 2,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "10^18": {
            "x_id": 10,
            "y_id": 18,
            "x": 10,
            "y": 2,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-9^17": {
            "x_id": -9,
            "y_id": 17,
            "x": 0,
            "y": 3,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-7^17": {
            "x_id": -7,
            "y_id": 17,
            "x": 1,
            "y": 3,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-5^17": {
            "x_id": -5,
            "y_id": 17,
            "x": 2,
            "y": 3,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-3^17": {
            "x_id": -3,
            "y_id": 17,
            "x": 3,
            "y": 3,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-1^17": {
            "x_id": -1,
            "y_id": 17,
            "x": 4,
            "y": 3,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "1^17": {
            "x_id": 1,
            "y_id": 17,
            "x": 5,
            "y": 3,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "3^17": {
            "x_id": 3,
            "y_id": 17,
            "x": 6,
            "y": 3,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "5^17": {
            "x_id": 5,
            "y_id": 17,
            "x": 7,
            "y": 3,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "7^17": {
            "x_id": 7,
            "y_id": 17,
            "x": 8,
            "y": 3,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "9^17": {
            "x_id": 9,
            "y_id": 17,
            "x": 9,
            "y": 3,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "11^17": {
            "x_id": 11,
            "y_id": 17,
            "x": 10,
            "y": 3,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^16": {
            "x_id": -10,
            "y_id": 16,
            "x": 0,
            "y": 4,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^16": {
            "x_id": -8,
            "y_id": 16,
            "x": 1,
            "y": 4,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-6^16": {
            "x_id": -6,
            "y_id": 16,
            "x": 2,
            "y": 4,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-4^16": {
            "x_id": -4,
            "y_id": 16,
            "x": 3,
            "y": 4,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-2^16": {
            "x_id": -2,
            "y_id": 16,
            "x": 4,
            "y": 4,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "0^16": {
            "x_id": 0,
            "y_id": 16,
            "x": 5,
            "y": 4,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "2^16": {
            "x_id": 2,
            "y_id": 16,
            "x": 6,
            "y": 4,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "4^16": {
            "x_id": 4,
            "y_id": 16,
            "x": 7,
            "y": 4,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "6^16": {
            "x_id": 6,
            "y_id": 16,
            "x": 8,
            "y": 4,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "8^16": {
            "x_id": 8,
            "y_id": 16,
            "x": 9,
            "y": 4,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "10^16": {
            "x_id": 10,
            "y_id": 16,
            "x": 10,
            "y": 4,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-9^15": {
            "x_id": -9,
            "y_id": 15,
            "x": 0,
            "y": 5,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-7^15": {
            "x_id": -7,
            "y_id": 15,
            "x": 1,
            "y": 5,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "-5^15": {
            "x_id": -5,
            "y_id": 15,
            "x": 2,
            "y": 5,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-3^15": {
            "x_id": -3,
            "y_id": 15,
            "x": 3,
            "y": 5,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-1^15": {
            "x_id": -1,
            "y_id": 15,
            "x": 4,
            "y": 5,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "1^15": {
            "x_id": 1,
            "y_id": 15,
            "x": 5,
            "y": 5,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "3^15": {
            "x_id": 3,
            "y_id": 15,
            "x": 6,
            "y": 5,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "5^15": {
            "x_id": 5,
            "y_id": 15,
            "x": 7,
            "y": 5,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "7^15": {
            "x_id": 7,
            "y_id": 15,
            "x": 8,
            "y": 5,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "9^15": {
            "x_id": 9,
            "y_id": 15,
            "x": 9,
            "y": 5,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "11^15": {
            "x_id": 11,
            "y_id": 15,
            "x": 10,
            "y": 5,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^14": {
            "x_id": -10,
            "y_id": 14,
            "x": 0,
            "y": 6,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^14": {
            "x_id": -8,
            "y_id": 14,
            "x": 1,
            "y": 6,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "-6^14": {
            "x_id": -6,
            "y_id": 14,
            "x": 2,
            "y": 6,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-4^14": {
            "x_id": -4,
            "y_id": 14,
            "x": 3,
            "y": 6,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-2^14": {
            "x_id": -2,
            "y_id": 14,
            "x": 4,
            "y": 6,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "0^14": {
            "x_id": 0,
            "y_id": 14,
            "x": 5,
            "y": 6,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "2^14": {
            "x_id": 2,
            "y_id": 14,
            "x": 6,
            "y": 6,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "4^14": {
            "x_id": 4,
            "y_id": 14,
            "x": 7,
            "y": 6,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "6^14": {
            "x_id": 6,
            "y_id": 14,
            "x": 8,
            "y": 6,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "8^14": {
            "x_id": 8,
            "y_id": 14,
            "x": 9,
            "y": 6,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "10^14": {
            "x_id": 10,
            "y_id": 14,
            "x": 10,
            "y": 6,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-9^13": {
            "x_id": -9,
            "y_id": 13,
            "x": 0,
            "y": 7,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-7^13": {
            "x_id": -7,
            "y_id": 13,
            "x": 1,
            "y": 7,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "-5^13": {
            "x_id": -5,
            "y_id": 13,
            "x": 2,
            "y": 7,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-3^13": {
            "x_id": -3,
            "y_id": 13,
            "x": 3,
            "y": 7,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-1^13": {
            "x_id": -1,
            "y_id": 13,
            "x": 4,
            "y": 7,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "1^13": {
            "x_id": 1,
            "y_id": 13,
            "x": 5,
            "y": 7,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "3^13": {
            "x_id": 3,
            "y_id": 13,
            "x": 6,
            "y": 7,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "5^13": {
            "x_id": 5,
            "y_id": 13,
            "x": 7,
            "y": 7,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "7^13": {
            "x_id": 7,
            "y_id": 13,
            "x": 8,
            "y": 7,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "9^13": {
            "x_id": 9,
            "y_id": 13,
            "x": 9,
            "y": 7,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "11^13": {
            "x_id": 11,
            "y_id": 13,
            "x": 10,
            "y": 7,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^12": {
            "x_id": -10,
            "y_id": 12,
            "x": 0,
            "y": 8,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^12": {
            "x_id": -8,
            "y_id": 12,
            "x": 1,
            "y": 8,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-6^12": {
            "x_id": -6,
            "y_id": 12,
            "x": 2,
            "y": 8,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-4^12": {
            "x_id": -4,
            "y_id": 12,
            "x": 3,
            "y": 8,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-2^12": {
            "x_id": -2,
            "y_id": 12,
            "x": 4,
            "y": 8,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "0^12": {
            "x_id": 0,
            "y_id": 12,
            "x": 5,
            "y": 8,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "2^12": {
            "x_id": 2,
            "y_id": 12,
            "x": 6,
            "y": 8,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "4^12": {
            "x_id": 4,
            "y_id": 12,
            "x": 7,
            "y": 8,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "6^12": {
            "x_id": 6,
            "y_id": 12,
            "x": 8,
            "y": 8,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "8^12": {
            "x_id": 8,
            "y_id": 12,
            "x": 9,
            "y": 8,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "10^12": {
            "x_id": 10,
            "y_id": 12,
            "x": 10,
            "y": 8,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-9^11": {
            "x_id": -9,
            "y_id": 11,
            "x": 0,
            "y": 9,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-7^11": {
            "x_id": -7,
            "y_id": 11,
            "x": 1,
            "y": 9,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-5^11": {
            "x_id": -5,
            "y_id": 11,
            "x": 2,
            "y": 9,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-3^11": {
            "x_id": -3,
            "y_id": 11,
            "x": 3,
            "y": 9,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-1^11": {
            "x_id": -1,
            "y_id": 11,
            "x": 4,
            "y": 9,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "1^11": {
            "x_id": 1,
            "y_id": 11,
            "x": 5,
            "y": 9,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "3^11": {
            "x_id": 3,
            "y_id": 11,
            "x": 6,
            "y": 9,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "5^11": {
            "x_id": 5,
            "y_id": 11,
            "x": 7,
            "y": 9,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "7^11": {
            "x_id": 7,
            "y_id": 11,
            "x": 8,
            "y": 9,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "9^11": {
            "x_id": 9,
            "y_id": 11,
            "x": 9,
            "y": 9,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "11^11": {
            "x_id": 11,
            "y_id": 11,
            "x": 10,
            "y": 9,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^10": {
            "x_id": -10,
            "y_id": 10,
            "x": 0,
            "y": 10,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^10": {
            "x_id": -8,
            "y_id": 10,
            "x": 1,
            "y": 10,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-6^10": {
            "x_id": -6,
            "y_id": 10,
            "x": 2,
            "y": 10,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-4^10": {
            "x_id": -4,
            "y_id": 10,
            "x": 3,
            "y": 10,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-2^10": {
            "x_id": -2,
            "y_id": 10,
            "x": 4,
            "y": 10,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "0^10": {
            "x_id": 0,
            "y_id": 10,
            "x": 5,
            "y": 10,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "2^10": {
            "x_id": 2,
            "y_id": 10,
            "x": 6,
            "y": 10,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "4^10": {
            "x_id": 4,
            "y_id": 10,
            "x": 7,
            "y": 10,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "6^10": {
            "x_id": 6,
            "y_id": 10,
            "x": 8,
            "y": 10,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "8^10": {
            "x_id": 8,
            "y_id": 10,
            "x": 9,
            "y": 10,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "10^10": {
            "x_id": 10,
            "y_id": 10,
            "x": 10,
            "y": 10,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-9^9": {
            "x_id": -9,
            "y_id": 9,
            "x": 0,
            "y": 11,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-7^9": {
            "x_id": -7,
            "y_id": 9,
            "x": 1,
            "y": 11,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-5^9": {
            "x_id": -5,
            "y_id": 9,
            "x": 2,
            "y": 11,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-3^9": {
            "x_id": -3,
            "y_id": 9,
            "x": 3,
            "y": 11,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-1^9": {
            "x_id": -1,
            "y_id": 9,
            "x": 4,
            "y": 11,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "1^9": {
            "x_id": 1,
            "y_id": 9,
            "x": 5,
            "y": 11,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "3^9": {
            "x_id": 3,
            "y_id": 9,
            "x": 6,
            "y": 11,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "5^9": {
            "x_id": 5,
            "y_id": 9,
            "x": 7,
            "y": 11,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "7^9": {
            "x_id": 7,
            "y_id": 9,
            "x": 8,
            "y": 11,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "9^9": {
            "x_id": 9,
            "y_id": 9,
            "x": 9,
            "y": 11,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "11^9": {
            "x_id": 11,
            "y_id": 9,
            "x": 10,
            "y": 11,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^8": {
            "x_id": -10,
            "y_id": 8,
            "x": 0,
            "y": 12,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^8": {
            "x_id": -8,
            "y_id": 8,
            "x": 1,
            "y": 12,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-6^8": {
            "x_id": -6,
            "y_id": 8,
            "x": 2,
            "y": 12,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-4^8": {
            "x_id": -4,
            "y_id": 8,
            "x": 3,
            "y": 12,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-2^8": {
            "x_id": -2,
            "y_id": 8,
            "x": 4,
            "y": 12,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "0^8": {
            "x_id": 0,
            "y_id": 8,
            "x": 5,
            "y": 12,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "2^8": {
            "x_id": 2,
            "y_id": 8,
            "x": 6,
            "y": 12,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "4^8": {
            "x_id": 4,
            "y_id": 8,
            "x": 7,
            "y": 12,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "6^8": {
            "x_id": 6,
            "y_id": 8,
            "x": 8,
            "y": 12,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "8^8": {
            "x_id": 8,
            "y_id": 8,
            "x": 9,
            "y": 12,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "10^8": {
            "x_id": 10,
            "y_id": 8,
            "x": 10,
            "y": 12,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-9^7": {
            "x_id": -9,
            "y_id": 7,
            "x": 0,
            "y": 13,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-7^7": {
            "x_id": -7,
            "y_id": 7,
            "x": 1,
            "y": 13,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-5^7": {
            "x_id": -5,
            "y_id": 7,
            "x": 2,
            "y": 13,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-3^7": {
            "x_id": -3,
            "y_id": 7,
            "x": 3,
            "y": 13,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-1^7": {
            "x_id": -1,
            "y_id": 7,
            "x": 4,
            "y": 13,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "1^7": {
            "x_id": 1,
            "y_id": 7,
            "x": 5,
            "y": 13,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "3^7": {
            "x_id": 3,
            "y_id": 7,
            "x": 6,
            "y": 13,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "5^7": {
            "x_id": 5,
            "y_id": 7,
            "x": 7,
            "y": 13,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "7^7": {
            "x_id": 7,
            "y_id": 7,
            "x": 8,
            "y": 13,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "9^7": {
            "x_id": 9,
            "y_id": 7,
            "x": 9,
            "y": 13,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "11^7": {
            "x_id": 11,
            "y_id": 7,
            "x": 10,
            "y": 13,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^6": {
            "x_id": -10,
            "y_id": 6,
            "x": 0,
            "y": 14,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^6": {
            "x_id": -8,
            "y_id": 6,
            "x": 1,
            "y": 14,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-6^6": {
            "x_id": -6,
            "y_id": 6,
            "x": 2,
            "y": 14,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-4^6": {
            "x_id": -4,
            "y_id": 6,
            "x": 3,
            "y": 14,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-2^6": {
            "x_id": -2,
            "y_id": 6,
            "x": 4,
            "y": 14,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "0^6": {
            "x_id": 0,
            "y_id": 6,
            "x": 5,
            "y": 14,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "2^6": {
            "x_id": 2,
            "y_id": 6,
            "x": 6,
            "y": 14,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "4^6": {
            "x_id": 4,
            "y_id": 6,
            "x": 7,
            "y": 14,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "6^6": {
            "x_id": 6,
            "y_id": 6,
            "x": 8,
            "y": 14,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "8^6": {
            "x_id": 8,
            "y_id": 6,
            "x": 9,
            "y": 14,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "10^6": {
            "x_id": 10,
            "y_id": 6,
            "x": 10,
            "y": 14,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-9^5": {
            "x_id": -9,
            "y_id": 5,
            "x": 0,
            "y": 15,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-7^5": {
            "x_id": -7,
            "y_id": 5,
            "x": 1,
            "y": 15,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-5^5": {
            "x_id": -5,
            "y_id": 5,
            "x": 2,
            "y": 15,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-3^5": {
            "x_id": -3,
            "y_id": 5,
            "x": 3,
            "y": 15,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-1^5": {
            "x_id": -1,
            "y_id": 5,
            "x": 4,
            "y": 15,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "1^5": {
            "x_id": 1,
            "y_id": 5,
            "x": 5,
            "y": 15,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "3^5": {
            "x_id": 3,
            "y_id": 5,
            "x": 6,
            "y": 15,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "5^5": {
            "x_id": 5,
            "y_id": 5,
            "x": 7,
            "y": 15,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "7^5": {
            "x_id": 7,
            "y_id": 5,
            "x": 8,
            "y": 15,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "9^5": {
            "x_id": 9,
            "y_id": 5,
            "x": 9,
            "y": 15,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "11^5": {
            "x_id": 11,
            "y_id": 5,
            "x": 10,
            "y": 15,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^4": {
            "x_id": -10,
            "y_id": 4,
            "x": 0,
            "y": 16,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^4": {
            "x_id": -8,
            "y_id": 4,
            "x": 1,
            "y": 16,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-6^4": {
            "x_id": -6,
            "y_id": 4,
            "x": 2,
            "y": 16,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-4^4": {
            "x_id": -4,
            "y_id": 4,
            "x": 3,
            "y": 16,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-2^4": {
            "x_id": -2,
            "y_id": 4,
            "x": 4,
            "y": 16,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "0^4": {
            "x_id": 0,
            "y_id": 4,
            "x": 5,
            "y": 16,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "2^4": {
            "x_id": 2,
            "y_id": 4,
            "x": 6,
            "y": 16,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "4^4": {
            "x_id": 4,
            "y_id": 4,
            "x": 7,
            "y": 16,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "6^4": {
            "x_id": 6,
            "y_id": 4,
            "x": 8,
            "y": 16,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "8^4": {
            "x_id": 8,
            "y_id": 4,
            "x": 9,
            "y": 16,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "10^4": {
            "x_id": 10,
            "y_id": 4,
            "x": 10,
            "y": 16,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-9^3": {
            "x_id": -9,
            "y_id": 3,
            "x": 0,
            "y": 17,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-7^3": {
            "x_id": -7,
            "y_id": 3,
            "x": 1,
            "y": 17,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-5^3": {
            "x_id": -5,
            "y_id": 3,
            "x": 2,
            "y": 17,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-3^3": {
            "x_id": -3,
            "y_id": 3,
            "x": 3,
            "y": 17,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-1^3": {
            "x_id": -1,
            "y_id": 3,
            "x": 4,
            "y": 17,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "1^3": {
            "x_id": 1,
            "y_id": 3,
            "x": 5,
            "y": 17,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "3^3": {
            "x_id": 3,
            "y_id": 3,
            "x": 6,
            "y": 17,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "5^3": {
            "x_id": 5,
            "y_id": 3,
            "x": 7,
            "y": 17,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "7^3": {
            "x_id": 7,
            "y_id": 3,
            "x": 8,
            "y": 17,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "9^3": {
            "x_id": 9,
            "y_id": 3,
            "x": 9,
            "y": 17,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "11^3": {
            "x_id": 11,
            "y_id": 3,
            "x": 10,
            "y": 17,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^2": {
            "x_id": -10,
            "y_id": 2,
            "x": 0,
            "y": 18,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^2": {
            "x_id": -8,
            "y_id": 2,
            "x": 1,
            "y": 18,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-6^2": {
            "x_id": -6,
            "y_id": 2,
            "x": 2,
            "y": 18,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-4^2": {
            "x_id": -4,
            "y_id": 2,
            "x": 3,
            "y": 18,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-2^2": {
            "x_id": -2,
            "y_id": 2,
            "x": 4,
            "y": 18,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "0^2": {
            "x_id": 0,
            "y_id": 2,
            "x": 5,
            "y": 18,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "2^2": {
            "x_id": 2,
            "y_id": 2,
            "x": 6,
            "y": 18,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "4^2": {
            "x_id": 4,
            "y_id": 2,
            "x": 7,
            "y": 18,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "6^2": {
            "x_id": 6,
            "y_id": 2,
            "x": 8,
            "y": 18,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "8^2": {
            "x_id": 8,
            "y_id": 2,
            "x": 9,
            "y": 18,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "10^2": {
            "x_id": 10,
            "y_id": 2,
            "x": 10,
            "y": 18,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-9^1": {
            "x_id": -9,
            "y_id": 1,
            "x": 0,
            "y": 19,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-7^1": {
            "x_id": -7,
            "y_id": 1,
            "x": 1,
            "y": 19,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-5^1": {
            "x_id": -5,
            "y_id": 1,
            "x": 2,
            "y": 19,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-3^1": {
            "x_id": -3,
            "y_id": 1,
            "x": 3,
            "y": 19,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-1^1": {
            "x_id": -1,
            "y_id": 1,
            "x": 4,
            "y": 19,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "1^1": {
            "x_id": 1,
            "y_id": 1,
            "x": 5,
            "y": 19,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "3^1": {
            "x_id": 3,
            "y_id": 1,
            "x": 6,
            "y": 19,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "5^1": {
            "x_id": 5,
            "y_id": 1,
            "x": 7,
            "y": 19,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "7^1": {
            "x_id": 7,
            "y_id": 1,
            "x": 8,
            "y": 19,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "9^1": {
            "x_id": 9,
            "y_id": 1,
            "x": 9,
            "y": 19,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "11^1": {
            "x_id": 11,
            "y_id": 1,
            "x": 10,
            "y": 19,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^0": {
            "x_id": -10,
            "y_id": 0,
            "x": 0,
            "y": 20,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^0": {
            "x_id": -8,
            "y_id": 0,
            "x": 1,
            "y": 20,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-6^0": {
            "x_id": -6,
            "y_id": 0,
            "x": 2,
            "y": 20,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-4^0": {
            "x_id": -4,
            "y_id": 0,
            "x": 3,
            "y": 20,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-2^0": {
            "x_id": -2,
            "y_id": 0,
            "x": 4,
            "y": 20,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "0^0": {
            "x_id": 0,
            "y_id": 0,
            "x": 5,
            "y": 20,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "2^0": {
            "x_id": 2,
            "y_id": 0,
            "x": 6,
            "y": 20,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "4^0": {
            "x_id": 4,
            "y_id": 0,
            "x": 7,
            "y": 20,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "6^0": {
            "x_id": 6,
            "y_id": 0,
            "x": 8,
            "y": 20,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "8^0": {
            "x_id": 8,
            "y_id": 0,
            "x": 9,
            "y": 20,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "10^0": {
            "x_id": 10,
            "y_id": 0,
            "x": 10,
            "y": 20,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-9^-1": {
            "x_id": -9,
            "y_id": -1,
            "x": 0,
            "y": 21,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-7^-1": {
            "x_id": -7,
            "y_id": -1,
            "x": 1,
            "y": 21,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-5^-1": {
            "x_id": -5,
            "y_id": -1,
            "x": 2,
            "y": 21,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-3^-1": {
            "x_id": -3,
            "y_id": -1,
            "x": 3,
            "y": 21,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-1^-1": {
            "x_id": -1,
            "y_id": -1,
            "x": 4,
            "y": 21,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "1^-1": {
            "x_id": 1,
            "y_id": -1,
            "x": 5,
            "y": 21,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "3^-1": {
            "x_id": 3,
            "y_id": -1,
            "x": 6,
            "y": 21,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "5^-1": {
            "x_id": 5,
            "y_id": -1,
            "x": 7,
            "y": 21,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "7^-1": {
            "x_id": 7,
            "y_id": -1,
            "x": 8,
            "y": 21,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "9^-1": {
            "x_id": 9,
            "y_id": -1,
            "x": 9,
            "y": 21,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "11^-1": {
            "x_id": 11,
            "y_id": -1,
            "x": 10,
            "y": 21,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^-2": {
            "x_id": -10,
            "y_id": -2,
            "x": 0,
            "y": 22,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^-2": {
            "x_id": -8,
            "y_id": -2,
            "x": 1,
            "y": 22,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-6^-2": {
            "x_id": -6,
            "y_id": -2,
            "x": 2,
            "y": 22,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-4^-2": {
            "x_id": -4,
            "y_id": -2,
            "x": 3,
            "y": 22,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-2^-2": {
            "x_id": -2,
            "y_id": -2,
            "x": 4,
            "y": 22,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "0^-2": {
            "x_id": 0,
            "y_id": -2,
            "x": 5,
            "y": 22,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "2^-2": {
            "x_id": 2,
            "y_id": -2,
            "x": 6,
            "y": 22,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "4^-2": {
            "x_id": 4,
            "y_id": -2,
            "x": 7,
            "y": 22,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "6^-2": {
            "x_id": 6,
            "y_id": -2,
            "x": 8,
            "y": 22,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "8^-2": {
            "x_id": 8,
            "y_id": -2,
            "x": 9,
            "y": 22,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "10^-2": {
            "x_id": 10,
            "y_id": -2,
            "x": 10,
            "y": 22,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-9^-3": {
            "x_id": -9,
            "y_id": -3,
            "x": 0,
            "y": 23,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-7^-3": {
            "x_id": -7,
            "y_id": -3,
            "x": 1,
            "y": 23,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-5^-3": {
            "x_id": -5,
            "y_id": -3,
            "x": 2,
            "y": 23,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-3^-3": {
            "x_id": -3,
            "y_id": -3,
            "x": 3,
            "y": 23,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-1^-3": {
            "x_id": -1,
            "y_id": -3,
            "x": 4,
            "y": 23,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "1^-3": {
            "x_id": 1,
            "y_id": -3,
            "x": 5,
            "y": 23,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "3^-3": {
            "x_id": 3,
            "y_id": -3,
            "x": 6,
            "y": 23,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "5^-3": {
            "x_id": 5,
            "y_id": -3,
            "x": 7,
            "y": 23,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "7^-3": {
            "x_id": 7,
            "y_id": -3,
            "x": 8,
            "y": 23,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "9^-3": {
            "x_id": 9,
            "y_id": -3,
            "x": 9,
            "y": 23,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "11^-3": {
            "x_id": 11,
            "y_id": -3,
            "x": 10,
            "y": 23,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^-4": {
            "x_id": -10,
            "y_id": -4,
            "x": 0,
            "y": 24,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^-4": {
            "x_id": -8,
            "y_id": -4,
            "x": 1,
            "y": 24,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-6^-4": {
            "x_id": -6,
            "y_id": -4,
            "x": 2,
            "y": 24,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-4^-4": {
            "x_id": -4,
            "y_id": -4,
            "x": 3,
            "y": 24,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-2^-4": {
            "x_id": -2,
            "y_id": -4,
            "x": 4,
            "y": 24,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "0^-4": {
            "x_id": 0,
            "y_id": -4,
            "x": 5,
            "y": 24,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "2^-4": {
            "x_id": 2,
            "y_id": -4,
            "x": 6,
            "y": 24,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "4^-4": {
            "x_id": 4,
            "y_id": -4,
            "x": 7,
            "y": 24,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "6^-4": {
            "x_id": 6,
            "y_id": -4,
            "x": 8,
            "y": 24,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "8^-4": {
            "x_id": 8,
            "y_id": -4,
            "x": 9,
            "y": 24,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "10^-4": {
            "x_id": 10,
            "y_id": -4,
            "x": 10,
            "y": 24,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-9^-5": {
            "x_id": -9,
            "y_id": -5,
            "x": 0,
            "y": 25,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-7^-5": {
            "x_id": -7,
            "y_id": -5,
            "x": 1,
            "y": 25,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-5^-5": {
            "x_id": -5,
            "y_id": -5,
            "x": 2,
            "y": 25,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-3^-5": {
            "x_id": -3,
            "y_id": -5,
            "x": 3,
            "y": 25,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "-1^-5": {
            "x_id": -1,
            "y_id": -5,
            "x": 4,
            "y": 25,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "1^-5": {
            "x_id": 1,
            "y_id": -5,
            "x": 5,
            "y": 25,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "3^-5": {
            "x_id": 3,
            "y_id": -5,
            "x": 6,
            "y": 25,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "5^-5": {
            "x_id": 5,
            "y_id": -5,
            "x": 7,
            "y": 25,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "7^-5": {
            "x_id": 7,
            "y_id": -5,
            "x": 8,
            "y": 25,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "9^-5": {
            "x_id": 9,
            "y_id": -5,
            "x": 9,
            "y": 25,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "11^-5": {
            "x_id": 11,
            "y_id": -5,
            "x": 10,
            "y": 25,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^-6": {
            "x_id": -10,
            "y_id": -6,
            "x": 0,
            "y": 26,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^-6": {
            "x_id": -8,
            "y_id": -6,
            "x": 1,
            "y": 26,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-6^-6": {
            "x_id": -6,
            "y_id": -6,
            "x": 2,
            "y": 26,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-4^-6": {
            "x_id": -4,
            "y_id": -6,
            "x": 3,
            "y": 26,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "-2^-6": {
            "x_id": -2,
            "y_id": -6,
            "x": 4,
            "y": 26,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "0^-6": {
            "x_id": 0,
            "y_id": -6,
            "x": 5,
            "y": 26,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "2^-6": {
            "x_id": 2,
            "y_id": -6,
            "x": 6,
            "y": 26,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "4^-6": {
            "x_id": 4,
            "y_id": -6,
            "x": 7,
            "y": 26,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "6^-6": {
            "x_id": 6,
            "y_id": -6,
            "x": 8,
            "y": 26,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "8^-6": {
            "x_id": 8,
            "y_id": -6,
            "x": 9,
            "y": 26,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "10^-6": {
            "x_id": 10,
            "y_id": -6,
            "x": 10,
            "y": 26,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-9^-7": {
            "x_id": -9,
            "y_id": -7,
            "x": 0,
            "y": 27,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-7^-7": {
            "x_id": -7,
            "y_id": -7,
            "x": 1,
            "y": 27,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-5^-7": {
            "x_id": -5,
            "y_id": -7,
            "x": 2,
            "y": 27,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-3^-7": {
            "x_id": -3,
            "y_id": -7,
            "x": 3,
            "y": 27,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "-1^-7": {
            "x_id": -1,
            "y_id": -7,
            "x": 4,
            "y": 27,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "1^-7": {
            "x_id": 1,
            "y_id": -7,
            "x": 5,
            "y": 27,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "3^-7": {
            "x_id": 3,
            "y_id": -7,
            "x": 6,
            "y": 27,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "5^-7": {
            "x_id": 5,
            "y_id": -7,
            "x": 7,
            "y": 27,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "7^-7": {
            "x_id": 7,
            "y_id": -7,
            "x": 8,
            "y": 27,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "9^-7": {
            "x_id": 9,
            "y_id": -7,
            "x": 9,
            "y": 27,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "11^-7": {
            "x_id": 11,
            "y_id": -7,
            "x": 10,
            "y": 27,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^-8": {
            "x_id": -10,
            "y_id": -8,
            "x": 0,
            "y": 28,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-8^-8": {
            "x_id": -8,
            "y_id": -8,
            "x": 1,
            "y": 28,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-6^-8": {
            "x_id": -6,
            "y_id": -8,
            "x": 2,
            "y": 28,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-4^-8": {
            "x_id": -4,
            "y_id": -8,
            "x": 3,
            "y": 28,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "-2^-8": {
            "x_id": -2,
            "y_id": -8,
            "x": 4,
            "y": 28,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "0^-8": {
            "x_id": 0,
            "y_id": -8,
            "x": 5,
            "y": 28,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "2^-8": {
            "x_id": 2,
            "y_id": -8,
            "x": 6,
            "y": 28,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "4^-8": {
            "x_id": 4,
            "y_id": -8,
            "x": 7,
            "y": 28,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "6^-8": {
            "x_id": 6,
            "y_id": -8,
            "x": 8,
            "y": 28,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "8^-8": {
            "x_id": 8,
            "y_id": -8,
            "x": 9,
            "y": 28,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "10^-8": {
            "x_id": 10,
            "y_id": -8,
            "x": 10,
            "y": 28,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-9^-9": {
            "x_id": -9,
            "y_id": -9,
            "x": 0,
            "y": 29,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-7^-9": {
            "x_id": -7,
            "y_id": -9,
            "x": 1,
            "y": 29,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-5^-9": {
            "x_id": -5,
            "y_id": -9,
            "x": 2,
            "y": 29,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-3^-9": {
            "x_id": -3,
            "y_id": -9,
            "x": 3,
            "y": 29,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "-1^-9": {
            "x_id": -1,
            "y_id": -9,
            "x": 4,
            "y": 29,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "1^-9": {
            "x_id": 1,
            "y_id": -9,
            "x": 5,
            "y": 29,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "3^-9": {
            "x_id": 3,
            "y_id": -9,
            "x": 6,
            "y": 29,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "5^-9": {
            "x_id": 5,
            "y_id": -9,
            "x": 7,
            "y": 29,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "7^-9": {
            "x_id": 7,
            "y_id": -9,
            "x": 8,
            "y": 29,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "9^-9": {
            "x_id": 9,
            "y_id": -9,
            "x": 9,
            "y": 29,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "11^-9": {
            "x_id": 11,
            "y_id": -9,
            "x": 10,
            "y": 29,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^-10": {
            "x_id": -10,
            "y_id": -10,
            "x": 0,
            "y": 30,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-8^-10": {
            "x_id": -8,
            "y_id": -10,
            "x": 1,
            "y": 30,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-6^-10": {
            "x_id": -6,
            "y_id": -10,
            "x": 2,
            "y": 30,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-4^-10": {
            "x_id": -4,
            "y_id": -10,
            "x": 3,
            "y": 30,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-2^-10": {
            "x_id": -2,
            "y_id": -10,
            "x": 4,
            "y": 30,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "0^-10": {
            "x_id": 0,
            "y_id": -10,
            "x": 5,
            "y": 30,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "2^-10": {
            "x_id": 2,
            "y_id": -10,
            "x": 6,
            "y": 30,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "4^-10": {
            "x_id": 4,
            "y_id": -10,
            "x": 7,
            "y": 30,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "6^-10": {
            "x_id": 6,
            "y_id": -10,
            "x": 8,
            "y": 30,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "8^-10": {
            "x_id": 8,
            "y_id": -10,
            "x": 9,
            "y": 30,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "10^-10": {
            "x_id": 10,
            "y_id": -10,
            "x": 10,
            "y": 30,
            "area": 4,
            "area_block": 2,
            "parameter": 0
        },
        "-9^-11": {
            "x_id": -9,
            "y_id": -11,
            "x": 0,
            "y": 31,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-7^-11": {
            "x_id": -7,
            "y_id": -11,
            "x": 1,
            "y": 31,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-5^-11": {
            "x_id": -5,
            "y_id": -11,
            "x": 2,
            "y": 31,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-3^-11": {
            "x_id": -3,
            "y_id": -11,
            "x": 3,
            "y": 31,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-1^-11": {
            "x_id": -1,
            "y_id": -11,
            "x": 4,
            "y": 31,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "1^-11": {
            "x_id": 1,
            "y_id": -11,
            "x": 5,
            "y": 31,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "3^-11": {
            "x_id": 3,
            "y_id": -11,
            "x": 6,
            "y": 31,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "5^-11": {
            "x_id": 5,
            "y_id": -11,
            "x": 7,
            "y": 31,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "7^-11": {
            "x_id": 7,
            "y_id": -11,
            "x": 8,
            "y": 31,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "9^-11": {
            "x_id": 9,
            "y_id": -11,
            "x": 9,
            "y": 31,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "11^-11": {
            "x_id": 11,
            "y_id": -11,
            "x": 10,
            "y": 31,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^-12": {
            "x_id": -10,
            "y_id": -12,
            "x": 0,
            "y": 32,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^-12": {
            "x_id": -8,
            "y_id": -12,
            "x": 1,
            "y": 32,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-6^-12": {
            "x_id": -6,
            "y_id": -12,
            "x": 2,
            "y": 32,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-4^-12": {
            "x_id": -4,
            "y_id": -12,
            "x": 3,
            "y": 32,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "-2^-12": {
            "x_id": -2,
            "y_id": -12,
            "x": 4,
            "y": 32,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "0^-12": {
            "x_id": 0,
            "y_id": -12,
            "x": 5,
            "y": 32,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "2^-12": {
            "x_id": 2,
            "y_id": -12,
            "x": 6,
            "y": 32,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "4^-12": {
            "x_id": 4,
            "y_id": -12,
            "x": 7,
            "y": 32,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "6^-12": {
            "x_id": 6,
            "y_id": -12,
            "x": 8,
            "y": 32,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "8^-12": {
            "x_id": 8,
            "y_id": -12,
            "x": 9,
            "y": 32,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "10^-12": {
            "x_id": 10,
            "y_id": -12,
            "x": 10,
            "y": 32,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "-9^-13": {
            "x_id": -9,
            "y_id": -13,
            "x": 0,
            "y": 33,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-7^-13": {
            "x_id": -7,
            "y_id": -13,
            "x": 1,
            "y": 33,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-5^-13": {
            "x_id": -5,
            "y_id": -13,
            "x": 2,
            "y": 33,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-3^-13": {
            "x_id": -3,
            "y_id": -13,
            "x": 3,
            "y": 33,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "-1^-13": {
            "x_id": -1,
            "y_id": -13,
            "x": 4,
            "y": 33,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "1^-13": {
            "x_id": 1,
            "y_id": -13,
            "x": 5,
            "y": 33,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "3^-13": {
            "x_id": 3,
            "y_id": -13,
            "x": 6,
            "y": 33,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "5^-13": {
            "x_id": 5,
            "y_id": -13,
            "x": 7,
            "y": 33,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "7^-13": {
            "x_id": 7,
            "y_id": -13,
            "x": 8,
            "y": 33,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "9^-13": {
            "x_id": 9,
            "y_id": -13,
            "x": 9,
            "y": 33,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "11^-13": {
            "x_id": 11,
            "y_id": -13,
            "x": 10,
            "y": 33,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^-14": {
            "x_id": -10,
            "y_id": -14,
            "x": 0,
            "y": 34,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-8^-14": {
            "x_id": -8,
            "y_id": -14,
            "x": 1,
            "y": 34,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-6^-14": {
            "x_id": -6,
            "y_id": -14,
            "x": 2,
            "y": 34,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-4^-14": {
            "x_id": -4,
            "y_id": -14,
            "x": 3,
            "y": 34,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-2^-14": {
            "x_id": -2,
            "y_id": -14,
            "x": 4,
            "y": 34,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "0^-14": {
            "x_id": 0,
            "y_id": -14,
            "x": 5,
            "y": 34,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "2^-14": {
            "x_id": 2,
            "y_id": -14,
            "x": 6,
            "y": 34,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "4^-14": {
            "x_id": 4,
            "y_id": -14,
            "x": 7,
            "y": 34,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "6^-14": {
            "x_id": 6,
            "y_id": -14,
            "x": 8,
            "y": 34,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "8^-14": {
            "x_id": 8,
            "y_id": -14,
            "x": 9,
            "y": 34,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "10^-14": {
            "x_id": 10,
            "y_id": -14,
            "x": 10,
            "y": 34,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-9^-15": {
            "x_id": -9,
            "y_id": -15,
            "x": 0,
            "y": 35,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-7^-15": {
            "x_id": -7,
            "y_id": -15,
            "x": 1,
            "y": 35,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-5^-15": {
            "x_id": -5,
            "y_id": -15,
            "x": 2,
            "y": 35,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-3^-15": {
            "x_id": -3,
            "y_id": -15,
            "x": 3,
            "y": 35,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-1^-15": {
            "x_id": -1,
            "y_id": -15,
            "x": 4,
            "y": 35,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "1^-15": {
            "x_id": 1,
            "y_id": -15,
            "x": 5,
            "y": 35,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "3^-15": {
            "x_id": 3,
            "y_id": -15,
            "x": 6,
            "y": 35,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "5^-15": {
            "x_id": 5,
            "y_id": -15,
            "x": 7,
            "y": 35,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "7^-15": {
            "x_id": 7,
            "y_id": -15,
            "x": 8,
            "y": 35,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "9^-15": {
            "x_id": 9,
            "y_id": -15,
            "x": 9,
            "y": 35,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "11^-15": {
            "x_id": 11,
            "y_id": -15,
            "x": 10,
            "y": 35,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^-16": {
            "x_id": -10,
            "y_id": -16,
            "x": 0,
            "y": 36,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^-16": {
            "x_id": -8,
            "y_id": -16,
            "x": 1,
            "y": 36,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-6^-16": {
            "x_id": -6,
            "y_id": -16,
            "x": 2,
            "y": 36,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-4^-16": {
            "x_id": -4,
            "y_id": -16,
            "x": 3,
            "y": 36,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-2^-16": {
            "x_id": -2,
            "y_id": -16,
            "x": 4,
            "y": 36,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "0^-16": {
            "x_id": 0,
            "y_id": -16,
            "x": 5,
            "y": 36,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "2^-16": {
            "x_id": 2,
            "y_id": -16,
            "x": 6,
            "y": 36,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "4^-16": {
            "x_id": 4,
            "y_id": -16,
            "x": 7,
            "y": 36,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "6^-16": {
            "x_id": 6,
            "y_id": -16,
            "x": 8,
            "y": 36,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "8^-16": {
            "x_id": 8,
            "y_id": -16,
            "x": 9,
            "y": 36,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "10^-16": {
            "x_id": 10,
            "y_id": -16,
            "x": 10,
            "y": 36,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "-9^-17": {
            "x_id": -9,
            "y_id": -17,
            "x": 0,
            "y": 37,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-7^-17": {
            "x_id": -7,
            "y_id": -17,
            "x": 1,
            "y": 37,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-5^-17": {
            "x_id": -5,
            "y_id": -17,
            "x": 2,
            "y": 37,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-3^-17": {
            "x_id": -3,
            "y_id": -17,
            "x": 3,
            "y": 37,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-1^-17": {
            "x_id": -1,
            "y_id": -17,
            "x": 4,
            "y": 37,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "1^-17": {
            "x_id": 1,
            "y_id": -17,
            "x": 5,
            "y": 37,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "3^-17": {
            "x_id": 3,
            "y_id": -17,
            "x": 6,
            "y": 37,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "5^-17": {
            "x_id": 5,
            "y_id": -17,
            "x": 7,
            "y": 37,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "7^-17": {
            "x_id": 7,
            "y_id": -17,
            "x": 8,
            "y": 37,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "9^-17": {
            "x_id": 9,
            "y_id": -17,
            "x": 9,
            "y": 37,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "11^-17": {
            "x_id": 11,
            "y_id": -17,
            "x": 10,
            "y": 37,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^-18": {
            "x_id": -10,
            "y_id": -18,
            "x": 0,
            "y": 38,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-8^-18": {
            "x_id": -8,
            "y_id": -18,
            "x": 1,
            "y": 38,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-6^-18": {
            "x_id": -6,
            "y_id": -18,
            "x": 2,
            "y": 38,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-4^-18": {
            "x_id": -4,
            "y_id": -18,
            "x": 3,
            "y": 38,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-2^-18": {
            "x_id": -2,
            "y_id": -18,
            "x": 4,
            "y": 38,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "0^-18": {
            "x_id": 0,
            "y_id": -18,
            "x": 5,
            "y": 38,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "2^-18": {
            "x_id": 2,
            "y_id": -18,
            "x": 6,
            "y": 38,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "4^-18": {
            "x_id": 4,
            "y_id": -18,
            "x": 7,
            "y": 38,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "6^-18": {
            "x_id": 6,
            "y_id": -18,
            "x": 8,
            "y": 38,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "8^-18": {
            "x_id": 8,
            "y_id": -18,
            "x": 9,
            "y": 38,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "10^-18": {
            "x_id": 10,
            "y_id": -18,
            "x": 10,
            "y": 38,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "-9^-19": {
            "x_id": -9,
            "y_id": -19,
            "x": 0,
            "y": 39,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-7^-19": {
            "x_id": -7,
            "y_id": -19,
            "x": 1,
            "y": 39,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-5^-19": {
            "x_id": -5,
            "y_id": -19,
            "x": 2,
            "y": 39,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-3^-19": {
            "x_id": -3,
            "y_id": -19,
            "x": 3,
            "y": 39,
            "area": 6,
            "area_block": 1,
            "parameter": 4
        },
        "-1^-19": {
            "x_id": -1,
            "y_id": -19,
            "x": 4,
            "y": 39,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "1^-19": {
            "x_id": 1,
            "y_id": -19,
            "x": 5,
            "y": 39,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "3^-19": {
            "x_id": 3,
            "y_id": -19,
            "x": 6,
            "y": 39,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "5^-19": {
            "x_id": 5,
            "y_id": -19,
            "x": 7,
            "y": 39,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "7^-19": {
            "x_id": 7,
            "y_id": -19,
            "x": 8,
            "y": 39,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "9^-19": {
            "x_id": 9,
            "y_id": -19,
            "x": 9,
            "y": 39,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "11^-19": {
            "x_id": 11,
            "y_id": -19,
            "x": 10,
            "y": 39,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-10^-20": {
            "x_id": -10,
            "y_id": -20,
            "x": 0,
            "y": 40,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-8^-20": {
            "x_id": -8,
            "y_id": -20,
            "x": 1,
            "y": 40,
            "area": 6,
            "area_block": 2,
            "parameter": 5
        },
        "-6^-20": {
            "x_id": -6,
            "y_id": -20,
            "x": 2,
            "y": 40,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-4^-20": {
            "x_id": -4,
            "y_id": -20,
            "x": 3,
            "y": 40,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "-2^-20": {
            "x_id": -2,
            "y_id": -20,
            "x": 4,
            "y": 40,
            "area": 1,
            "area_block": 2,
            "parameter": 0
        },
        "0^-20": {
            "x_id": 0,
            "y_id": -20,
            "x": 5,
            "y": 40,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "2^-20": {
            "x_id": 2,
            "y_id": -20,
            "x": 6,
            "y": 40,
            "area": 3,
            "area_block": 2,
            "parameter": 0
        },
        "4^-20": {
            "x_id": 4,
            "y_id": -20,
            "x": 7,
            "y": 40,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "6^-20": {
            "x_id": 6,
            "y_id": -20,
            "x": 8,
            "y": 40,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "8^-20": {
            "x_id": 8,
            "y_id": -20,
            "x": 9,
            "y": 40,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "10^-20": {
            "x_id": 10,
            "y_id": -20,
            "x": 10,
            "y": 40,
            "area": 2,
            "area_block": 2,
            "parameter": 0
        },
        "-9^-21": {
            "x_id": -9,
            "y_id": -21,
            "x": 0,
            "y": 41,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-7^-21": {
            "x_id": -7,
            "y_id": -21,
            "x": 1,
            "y": 41,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-5^-21": {
            "x_id": -5,
            "y_id": -21,
            "x": 2,
            "y": 41,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-3^-21": {
            "x_id": -3,
            "y_id": -21,
            "x": 3,
            "y": 41,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "-1^-21": {
            "x_id": -1,
            "y_id": -21,
            "x": 4,
            "y": 41,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "1^-21": {
            "x_id": 1,
            "y_id": -21,
            "x": 5,
            "y": 41,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "3^-21": {
            "x_id": 3,
            "y_id": -21,
            "x": 6,
            "y": 41,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "5^-21": {
            "x_id": 5,
            "y_id": -21,
            "x": 7,
            "y": 41,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "7^-21": {
            "x_id": 7,
            "y_id": -21,
            "x": 8,
            "y": 41,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "9^-21": {
            "x_id": 9,
            "y_id": -21,
            "x": 9,
            "y": 41,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        },
        "11^-21": {
            "x_id": 11,
            "y_id": -21,
            "x": 10,
            "y": 41,
            "area": 0,
            "area_block": 2,
            "parameter": 5
        }
    }
};

var resourceNumber = 0;
var resourcePosition = {};
for(let blockId in basePoints.mapConfig){
    let blockInfo = basePoints.mapConfig[blockId];
    if(blockInfo.area != 6){
        resourceNumber += 1;
        resourcePosition[Math.ceil(resourceNumber/10)] = blockId;
    }
}
resourceNumber = Math.ceil(resourceNumber/10);

var resourceIndexes = {};
for(var index in resourcePosition){
    resourceIndexes[resourcePosition[index]] = index;
}

/*
capitals + iinit 手工标准
*/ 
var specialBlocks  = {
    capitals: [
        { x: 5, y: 12, x_id: 0, y_id: 8, isHarbor: true },
        { x: 1, y: 21, x_id: -7, y_id: -1, isHarbor: true },
        { x: 2, y: 32, x_id: -6, y_id: -12, isHarbor: true },
        { x: 5, y: 28, x_id: 0, y_id: -8, isHarbor: true },
        { x: 8, y: 24, x_id: 6, y_id: -4, isHarbor: true },
        { x: 9, y: 15, x_id: 9, y_id: 5, isHarbor: true }
    ],
    initCamps: [
        { x: 5, y: 1 },
        { x: 10, y: 8 },
        { x: 0, y: 30 },
        { x: 7, y: 40 }
    ],
    center: { x: 5, y: 20, x_id: 0, y_id: 0 }
};

let rows = 42;
let cols = 11;
let mapConfigLoot = {};
let distanceAll = calDistanceAll();

console.log(resourceIndexes);

for(let blockId in basePoints.mapConfig){
    /*
        "-10^20": {
            "x_id": -10,
            "y_id": 20,
            "x": 0,
            "y": 0,
            "area_block": 2,
            "parameter": 5,
            "area": 6
        },
    */
    let baseBlockConfig = basePoints.mapConfig[blockId];

    //地块归属
    let { x_id, y_id, x, y, area_block, area } = baseBlockConfig;
    
    let distance = distanceAll[x_id + '^' + y_id];
    // console.log('distance:', distance)

    //地块类型
    /*
    地块类型=1时（10% 1=低级树林；5% 2=中级树林；5% 3=高级树林；80% 4=空地块）
    地块类型2时（配置0）
    地块类型=3时配置相应的阵营（1东北,2西北,3西南,4东南）
    地块类型=4时配置相应的等级（1低级,2中级,3高级）
    地块类型=6时配置相应的等级（1低级,2中级,3高级,4 river, 5 ocean
    */
    let type = 1;

    //10个地块出现1个资源地块
    if(resourceIndexes[blockId]){
        type = 4;
    }

    //港口
    basePoints.ports.forEach(function(item, index){
        if(item['x'] == x && item['y'] == y){
            type = 8;
            console.log('port', x, y, item);
        }
    });

    let isCapitalAndHarbor = false;
    specialBlocks.capitals.forEach(function(item){
        if(item['x'] == x && item['y'] == y){
            type = 2;
            // console.log('capitals', x, y, item);
        }
        if(item['x'] == x && item['y'] == y && item['isHarbor']){
            isCapitalAndHarbor = true;
        }
    });
    let unionId = 0;
    specialBlocks.initCamps.forEach(function(item, index){
        if(item['x'] == x && item['y'] == y){
            type = 3;
            unionId = index + 1;
            // console.log('unionId', x, y, unionId);
        }
    });

    if(area === 6){
        type = 6;
    }

    // parameter
    let parameter = 0;
    if(type == 1){
        let randomNumber = Math.round(Math.random()*99999999)%20; //0-19;
        let randomMap = {
            0: 1,
            1: 1,
            2: 2,
            3: 3,
            4: 4
        };
        parameter = randomMap[randomNumber] || 4;
    }
    if(type == 2){
        if(isCapitalAndHarbor){
            parameter = 14;
        }else{
            parameter = Math.round(Math.random()*99999999)%2 + 1;
        }
    }
    if(type == 3){
        parameter = unionId;
    }
    if(type == 4){
        // console.log(4444, { type, distance})
        parameter = 4 - Math.ceil(distance/7);
    }
    if(type == 6){
        //bgIndex = 11 -> 4; 12 -> 5; 
        parameter = baseBlockConfig.parameter;
    }

    // console.log('lootItem', type, distance);
    let lootItem = lootGDS[type + '-' + distance] || {
        "durability": 0,
        "buff_id": 1006,
        "area_block": 2,
        "area": 6,
        "troops": [
            {
                "type": 1,
                "defense": 0,
                "count": 0,
                "attack": 0
            }
        ],
        "silver_total_number": 0,
        "gather_silver_speed": 0
    };
    // console.log('parameter 0', {type, parameter});
    parameter = lootItem['parameter'] || parameter;
    // console.log('parameter 1', {type, parameter});

    mapConfigLoot[x_id + "^" + y_id] = {
        "x": x,
        "y": y,
        "x_id": x_id,
        "y_id": y_id,
        "type": type,
        "distance": distance,
        "parameter": parameter,
        "area_block": area_block,
        "area": area,
        "durability": lootItem['durability'],
        "buff_id": lootItem['buff_id'],
        "troops": lootItem['troops'],
        "silver_total_number": lootItem['silver_total_number'],
        "gather_silver_speed": lootItem['gather_silver_speed'],
        "victory_occupy_reward": [
            {
                "type": 0,
                "name": "0",
                "count": 0
            }
        ]
    }
}

fs.writeFile('../gds/map_config_' + mapId + '.json', JSON.stringify(mapConfigLoot, null, ' \t'), function(err) {
    if (err) {
        return console.error(err);
    }
    console.log("map_config_ " + mapId + " 数据写入成功！");
});

function calDistanceAll(){
    var centerPoint = specialBlocks['center'];
    let centerX = centerPoint['x_id'];
    let centerY = centerPoint['y_id'];
    let centerIds = centerX + '^' + centerY;
    let dMap = {
        [centerIds]: 0
    };
    let distanceMax = 22;
    for(let i =1; i<distanceMax; i++){
        // console.log(i, dMap)
        for(var newCenter in dMap){
            setCirclePoints(newCenter, i);
        }
    }

    function setCirclePoints(newCenter, distance){
        const xOffset = [ 0, 1, 1, 0, -1, -1];
        const yOffset = [ 2, 1, -1, -2, -1, 1];

        let _centerIds = newCenter.split('^');
        let _centerX = _centerIds[0]/1;
        let _centerY = _centerIds[1]/1;

        for(let i = 0; i < 6; i++){
            let newXYindex = (_centerX + xOffset[i]) + '^' + (_centerY + yOffset[i]);
            if(!dMap.hasOwnProperty(newXYindex)){
                dMap[newXYindex] = distance;                
            }
        }
    }
    return dMap;
}

function getIdIndex(x, y) {
    //cols = 11, rows = 21/41 + 1;
    //0,0 -> -10, 10
    return {
        x_id: (x - 5) * 2 + y % 2,
        y_id:  (rows - 2)/2 - y
    }
    // return {
    //     x_id: (x - 5) * 2 + y % 2,
    //     y_id: 10 - y
    // }
}