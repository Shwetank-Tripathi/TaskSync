import mongoose from "mongoose";

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
    },
    description: {
        type: String,
        trim: true
    },
    assignedUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },
    priority: {
        type: String,
        enum: ["low", "medium", "high"],
        default: "medium",
        trim: true
    },
    status: {
        type: String,
        enum: ["todo", "inProgress", "done"],
        default: "todo",
        trim: true
    },
    version: {
        type: Number,
        default: 1
    }
});

const Task = mongoose.model("Task", TaskSchema);

export default Task;