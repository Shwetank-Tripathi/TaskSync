const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    user: {
        type: String,
        required: true
    },
    target: {
        type: String,
        required: true
    },
    action: {
        type: String,
        required: true
    },
    changes: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model("Log", logSchema);