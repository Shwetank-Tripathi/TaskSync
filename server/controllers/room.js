const Room = require("../models/room");
const Task = require("../models/task");
const Log = require("../models/log");

async function handleGetRooms(req, res){
    try {
        const rooms = await Room.find().populate('members tasks logs');
        return res.status(200).json({rooms});
    } catch (error) {
        console.error("Error getting rooms:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function handleGetUserRooms(req, res){
    try {
        const rooms = await Room.find({members: req.user._id}).select("_id name createdBy members tasks").populate("members", "name email _id").populate("tasks", "title description assignedUser priority status").populate("logs", "user target action timestamp");
        return res.status(200).json({rooms});
    } catch (error) {
        console.error("Error getting user rooms:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function handleCreateRoom(req, res){
    try {
        const {name} = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Room name is required" });
        }
        
        // Sanitize room name
        const sanitizedName = name.trim().replace(/[<>]/g, '');
        if (sanitizedName.length < 1) {
            return res.status(400).json({ message: "Room name cannot be empty" });
        }
        if (sanitizedName.length > 50) {
            return res.status(400).json({ message: "Room name is too long (max 50 characters)" });
        }
        
        const room = await Room.create({name: sanitizedName, members: [req.user._id], createdBy: req.user._id});
        return res.status(201).json({room});
    } catch (error) {
        console.error("Error creating room:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function handleGetRoom(req, res){
    try {
        const room = await Room.findById(req.params.id)
            .populate("members", "name email _id")
            .populate("tasks")
            .populate("logs");
        if(!room) return res.status(404).json({message: "Room not found"});

        const userId = req.user._id;
        if (!room.members.some(member => member._id.toString() === userId.toString())) {
            room.members.push(userId);
            await room.save();
        }
        
        return res.status(200).json({room});
    } catch (error) {
        console.error("Error getting room:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function handleUpdateRoom(req, res){
    try {
        const {name, members} = req.body;
        
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Room name is required" });
        }
        
        // Sanitize room name
        const sanitizedName = name.trim().replace(/[<>]/g, '');
        if (sanitizedName.length < 1) {
            return res.status(400).json({ message: "Room name cannot be empty" });
        }
        if (sanitizedName.length > 50) {
            return res.status(400).json({ message: "Room name is too long (max 50 characters)" });
        }
        
        const room = await Room.findById(req.params.id);
        if(!room) return res.status(404).json({message: "Room not found"});
        
        room.name = sanitizedName;
        if (members && Array.isArray(members)) {
            room.members = members;
        }
        await room.save();
        return res.status(200).json({room});
    } catch (error) {
        console.error("Error updating room:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

async function handleDeleteRoom(req, res){
    try {
        const roomId = req.params.id;
        const userId = req.user._id;
        
        // Find the room first
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Check if user is the creator/owner of the room
        if (room.createdBy.toString() !== userId.toString()) {
            return res.status(403).json({ 
                message: "Only the room creator can delete this room. Use 'Leave Room' to exit as a member." 
            });
        }

        // Delete all tasks associated with this room
        await Task.deleteMany({ _id: { $in: room.tasks } });
        
        // Delete all logs associated with this room  
        await Log.deleteMany({ _id: { $in: room.logs } });
        
        // Delete the room itself
        await Room.findByIdAndDelete(roomId);
        
        console.log(`🗑️ Room ${room.name} and all associated data deleted by creator ${userId}`);
        
        return res.status(200).json({ 
            message: "Room and all associated data deleted successfully"
        });
        
    } catch (error) {
        console.error("Error deleting room:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// NEW: Handle leaving a room (for non-creators)
async function handleLeaveRoom(req, res) {
    try {
        const roomId = req.params.id;
        const userId = req.user._id;
        
        // Find the room first
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ message: "Room not found" });
        }

        // Check if user is the creator
        if (room.createdBy.toString() === userId.toString()) {
            return res.status(400).json({ 
                message: "Room creators cannot leave their own room. Use 'Delete Room' to delete it entirely." 
            });
        }

        // Check if user is actually a member
        if (!room.members.includes(userId)) {
            return res.status(400).json({ message: "You are not a member of this room" });
        }

        // Remove user from members array
        await Room.findByIdAndUpdate(
            roomId,
            { $pull: { members: userId } },
            { new: true }
        );

        // Optionally: Unassign user from all tasks in this room
        await Task.updateMany(
            { _id: { $in: room.tasks }, assignedUser: userId },
            { $unset: { assignedUser: "" } }
        );

        console.log(`👋 User ${userId} left room ${room.name}`);
        
        return res.status(200).json({ 
            message: `Successfully left room "${room.name}"`
        });
        
    } catch (error) {
        console.error("Error leaving room:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {
    handleCreateRoom,
    handleGetUserRooms,
    handleGetRoom,
    handleGetRooms,
    handleUpdateRoom,
    handleDeleteRoom,
    handleLeaveRoom
};
