import mongoose from "mongoose";

const roomSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    members: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: []
    }],
    tasks: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
        default: []
    }],
    logs: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Log",
        default: []
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

const Room = mongoose.model("Room", roomSchema);

export default Room;