// server/routes/doctorRoutes.js (SADECE YÖNLENDİRME)

import express from 'express';
// Controller'ı import et
import { getAllDoctors } from '../controllers/doctorController.js';

const router = express.Router();

// 1. Tüm Doktorları Listeleme (GET /api/doctors)
router.get('/', getAllDoctors);

export default router;