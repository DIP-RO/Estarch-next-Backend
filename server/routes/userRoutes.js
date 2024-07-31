import express from 'express';
import { registerUser } from '../controllers/userController.js';

const router = express.Router();

// Route to register a user
router.post('/register', registerUser);

export default router;
