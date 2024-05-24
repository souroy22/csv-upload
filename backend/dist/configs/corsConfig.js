"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.corsOptions = void 0;
const whitelist = [
    "http://127.0.0.1:5500",
    "https://ninjas-csv-upload.netlify.app",
];
// Configure CORS options
exports.corsOptions = {
    origin: function (origin, callback) {
        // Check if the origin is in the whitelist or if it's a local request
        if (whitelist.includes(origin) || !origin) {
            callback(null, true);
        }
        else {
            callback(new Error(`Not allowed by CORS`));
        }
    },
};
//# sourceMappingURL=corsConfig.js.map