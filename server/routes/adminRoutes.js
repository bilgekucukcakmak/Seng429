import express from 'express';
import {
    getSpecializations,
    getGeneralReports, // Bu fonksiyonu içeri aldığından emin ol
    addSpecialization,
    getAllUsers,
    deleteUser,
    updateDoctor,
    getAppointmentStats,
    getAppointmentsBySpecialization,
    getDoctorsBySpecialization,
    getLogs
} from '../controllers/adminController.js';
import { ensureAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// GENEL RAPORLAR (Eksik olan ve 404 hatası veren rota buydu)
router.get('/reports', ensureAdmin, getGeneralReports);

// LOGLAR
router.get('/logs', ensureAdmin, getLogs);

// DİĞER İSTATİSTİKLER
router.get('/reports/appointment-stats', ensureAdmin, getAppointmentStats);
router.get('/reports/appointments-by-specialization', ensureAdmin, getAppointmentsBySpecialization);
router.get('/reports/doctors-by-specialization/:specialization', ensureAdmin, getDoctorsBySpecialization);

// KULLANICI VE POLİKLİNİK İŞLEMLERİ
router.get('/specializations', ensureAdmin, getSpecializations);
router.get('/users', ensureAdmin, getAllUsers);
router.delete('/users/:id', ensureAdmin, deleteUser);
router.put('/doctor/:id', ensureAdmin, updateDoctor);

export default router;