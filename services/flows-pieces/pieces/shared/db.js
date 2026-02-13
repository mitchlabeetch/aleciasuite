"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPool = getPool;
const pg_1 = require("pg");
const pools = new Map();
function getPool(connectionString) {
    if (!pools.has(connectionString)) {
        pools.set(connectionString, new pg_1.Pool({ connectionString, max: 3 }));
    }
    return pools.get(connectionString);
}
