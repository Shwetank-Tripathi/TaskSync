const Room = require("../models/room");

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
        const rooms = await Room.find({members: req.user._id}).select("_id name");
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
        const room = await Room.findByIdAndDelete(req.params.id);
        if(!room) return res.status(404).json({message: "Room not found"});
        return res.status(200).json({message: "Room deleted successfully"});
    } catch (error) {
        console.error("Error deleting room:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = {handleGetRooms, handleGetUserRooms, handleCreateRoom, handleGetRoom, handleUpdateRoom, handleDeleteRoom};
