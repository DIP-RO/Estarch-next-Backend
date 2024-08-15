import Type from '../models/type.js';

// Create Type
export const createType = async (req, res) => {
    try {
        const { name, image } = req.body; // Accept 'image' from the request body
        const newType = new Type({ name, image });
        await newType.save();
        res.status(201).json(newType);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get all Types
export const getTypes = async (req, res) => {
    try {
        const types = await Type.find();
        res.json(types);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update Type
export const updateType = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, image } = req.body; // Accept 'image' from the request body
        const updatedType = await Type.findByIdAndUpdate(id, { name, image }, { new: true });
        res.json(updatedType);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete Type
export const deleteType = async (req, res) => {
    try {
        const { id } = req.params;
        await Type.findByIdAndDelete(id);
        res.json({ message: 'Type deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
