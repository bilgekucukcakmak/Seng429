import express from 'express';
import { ensureDoctor } from '../middleware/authMiddleware.js';

import {
    getAllDoctors,
    updateDoctorLeave,
    getDoctorProfile,
    updateDoctorProfile
} from '../controllers/doctorController.js';

const router = express.Router();

// =======================================================
// 👤 DOKTOR PROFİLİ
// =======================================================

// Doktor kendi profilini görüntüler
router.get('/profile', ensureDoctor, getDoctorProfile);

// Doktor kendi profilini günceller
router.patch('/profile', ensureDoctor, updateDoctorProfile);


// =======================================================
// 🏖️ DOKTOR İZİNLERİ
// =======================================================

// Doktor izin günlerini günceller
router.patch('/leave', ensureDoctor, updateDoctorLeave);


// =======================================================
// 👨‍⚕️ TÜM DOKTORLAR (PUBLIC)
// =======================================================

// Tüm doktorları listele
router.get('/', getAllDoctors);

export default router;
