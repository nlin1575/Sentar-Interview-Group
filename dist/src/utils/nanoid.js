"use strict";
// Simple ID generation utility
// Using a basic implementation instead of external nanoid dependency
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.generateTimestampId = generateTimestampId;
const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
function generateId(length = 21) {
    let id = '';
    for (let i = 0; i < length; i++) {
        id += alphabet[Math.floor(Math.random() * alphabet.length)];
    }
    return id;
}
// Generate a timestamp-based ID for better sorting
function generateTimestampId() {
    const timestamp = Date.now().toString(36);
    const random = generateId(8);
    return `${timestamp}-${random}`;
}
//# sourceMappingURL=nanoid.js.map