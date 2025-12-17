import express from 'express';
import { ensureDoctor } from '../middleware/authMiddleware.js';

import {
    getAllDoctors,
    getDoctorLeaveDates,
    updateDoctorLeave,
    getDoctorProfile,
    updateDoctorProfile
} from '../controllers/doctorController.js';

const router = express.Router();

// =======================================================
// 👤 DOKTOR PROFİLİ
// URL: /api/doctors/profile
// =======================================================
router.get('/profile', ensureDoctor, getDoctorProfile);
router.patch('/profile', ensureDoctor, updateDoctorProfile);

// =======================================================
// 🏖️ DOKTOR İZİNLERİ
// URL: /api/doctors/leave
// =======================================================
router.get('/leave', ensureDoctor, getDoctorLeaveDates);
router.patch('/leave', ensureDoctor, updateDoctorLeave);

// =======================================================
// 👨‍⚕️ TÜM DOKTORLAR (PUBLIC)
// URL: /api/doctors
// =======================================================
router.get('/', getAllDoctors);

export default router;
