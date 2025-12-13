// server/routes/adminRoutes.js (NİHAİ VE TAM HALİ)

import express from 'express';
import {
    getSpecializations,
    getGeneralReports,
    addSpecialization,
    getAllUsers,
    deleteUser,
    // YENİ CONTROLLER IMPORT EDİLDİ
    updateDoctor
} from '../controllers/adminController.js';
import { ensureAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Poliklinikler Rotası
router.get('/specializations', ensureAdmin, getSpecializations);
router.post('/specializations', ensureAdmin, addSpecialization);

// Raporlar Rotası
router.get('/reports', ensureAdmin, getGeneralReports);


// KULLANICI YÖNETİMİ ROTASI
// Tüm kullanıcıları çekme rotası
router.get('/users', ensureAdmin, getAllUsers);

// Kullanıcı silme rotası
router.delete('/users/:id', ensureAdmin, deleteUser);

// DOKTOR GÜNCELLEME ROTASI (YENİ EKLENDİ)
// Front-end'den gelen PUT /api/admin/doctor/:userId isteğini karşılar
router.put('/doctor/:id', ensureAdmin, updateDoctor);


export default router;