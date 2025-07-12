const Task = require("../models/task");
const Room = require("../models/room");
const Log = require("../models/log");

async function handleGetTasks(req, res) {
    try {
        const tasks = await Task.find().populate("assignedUser");
        return res.status(200).json({ tasks });
    } catch (error) {
        console.error("Error getting tasks:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function handleCreateTask(req, res) {
    try {
        const roomId = req.headers.roomid;
        const socketId = req.headers.socketid;
        const { title, description, assignedUser, priority, status } = req.body;
        
        if (!roomId) {
            return res.status(400).json({ message: "Room ID is required" });
        }
        
        if (!title || !title.trim()) {
            return res.status(400).json({ message: "Task title is required" });
        }
        
        // Sanitize inputs
        const sanitizedTitle = title.trim().replace(/[<>]/g, '');
        const sanitizedDescription = description ? description.trim().replace(/[<>]/g, '') : '';
        
        if (sanitizedTitle.length < 1) {
            return res.status(400).json({ message: "Task title cannot be empty" });
        }
        
        if (sanitizedTitle.length > 100) {
            return res.status(400).json({ message: "Task title is too long (max 100 characters)" });
        }
        
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        
        const task = await Task.create({ 
            title: sanitizedTitle, 
            description: sanitizedDescription, 
            assignedUser, 
            priority, 
            status 
        });
        const populatedTask = await Task.findById(task._id).populate("assignedUser", "name email _id");
        room.tasks.push(task._id);
        const log = Log.create({ user: req.user.name, target: task.title, action: "create", timestamp: new Date().toISOString() });
        room.logs.push(log._id);
        await room.save();
        req.app.get("io").to(roomId).except(socketId).emit("task:created", {task: populatedTask, log}); //emit to all other clients except the one who made the request
        return res.status(201).json({ message: "Task created successfully", task: populatedTask, log }); //send to client who made the request
    } catch (error) {
        console.error("Error creating task:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function handleDeleteTask(req, res) {
    const roomId = req.headers.roomid;
    const socketId = req.headers.socketid;
    const id = req.params.id;
    
    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }
        
        const task = await Task.findById(id);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }
        
        await Task.findByIdAndDelete(id);
        room.tasks.pull(task._id);
        const log = Log.create({ user: req.user.name, target: task.title, action: "delete", timestamp: new Date().toISOString() });
        room.logs.push(log._id);
        await room.save();
        req.app.get("io").to(roomId).except(socketId).emit("task:deleted", {id: task._id, log});
        return res.status(200).json({ message: "Task deleted successfully", id: task._id, log });
    } catch (error) {
        console.error("Error deleting task:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function handleUpdateTask(req, res) {
    const roomId = req.headers.roomid;
    const socketId = req.headers.socketid;
    const id = req.params.id;
    const { title, description, assignedUser, priority, status, version } = req.body;

    try {
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        const task = await Task.findOne({_id: id, version: version});
        if(!task){
            //version mismatch
            //send the current task to the client
            const currentTask = await Task.findById(id);
            if (!currentTask) {
                return res.status(404).json({ message: "Task not found" });
            }
            return res.status(409).json({
                message:"Conflict Detected",
                serverTask: currentTask,
                clientTask: {title: title, description: description, assignedUser: assignedUser, priority: priority, status: status, version: version}
            });
        }
        //version match
        //update the task
        const update = {};

        if(title!==undefined) {
            const sanitizedTitle = title.trim().replace(/[<>]/g, '');
            if (sanitizedTitle.length < 1) {
                return res.status(400).json({ message: "Task title cannot be empty" });
            }
            if (sanitizedTitle.length > 100) {
                return res.status(400).json({ message: "Task title is too long (max 100 characters)" });
            }
            update.title = sanitizedTitle;
        }
        if(description!==undefined) {
            update.description = description ? description.trim().replace(/[<>]/g, '') : '';
        }
        if(assignedUser!==undefined) update.assignedUser=assignedUser;
        if(priority!==undefined) update.priority=priority;
        if(status!==undefined) update.status=status;

        for(const key in update){
            task[key] = update[key];
        }
        task.version+=1;
        await task.save();
        update.version = task.version;

        const populatedTask = await Task.findById(task._id).populate("assignedUser", "name email _id");
        const log = Log.create({ user: req.user.name, target: task.title, action: "update", timestamp: new Date().toISOString() });
        room.logs.push(log._id);
        await room.save();
        req.app.get("io").to(roomId).except(socketId).emit("task:updated", {id: task._id, log});
        return res.status(200).json({ message: "Task updated successfully", id: task._id, log });
    } catch (error) {
        console.error("Error updating task:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function handleConflict(req,res){
    
}

module.exports = {
    handleGetTasks,
    handleCreateTask,
    handleDeleteTask,
    handleUpdateTask
}