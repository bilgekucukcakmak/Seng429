import express from 'express';
import {
    searchPatientByTc,
    getPatientProfile,
    updatePatientProfile,
    getPatientDetailById
} from '../controllers/patientController.js';

const router = express.Router();

router.get('/search', searchPatientByTc);
router.get('/profile', getPatientProfile);
router.patch('/profile', updatePatientProfile);

// 🔥 Doktor → Hasta Detayı
router.get('/:id', getPatientDetailById);

export default router;
