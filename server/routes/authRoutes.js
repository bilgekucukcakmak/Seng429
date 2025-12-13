import express from 'express';
// Controller'ı import ediyoruz
import { registerUser, loginUser } from '../controllers/authController.js'; 

const router = express.Router();

// --- KULLANICI KAYIT (Register) ---
router.post('/register', registerUser);

// --- KULLANICI GİRİŞ (Login) ---
router.post('/login', loginUser);

export default router;