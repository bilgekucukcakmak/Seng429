import express from 'express';
import {
    getAllDoctors, // Tek virgül olmalı
    getDoctorAppointments,
    updateAppointmentStatus,
    getDoctorProfile,
    getDoctorLeaveDates,
    updateDoctorLeaveDates,
    createLeaveRequest
} from '../controllers/doctorController.js';

import { ensureDoctor } from '../middleware/authMiddleware.js';

const router = express.Router();

// MEVCUT ROTALARIN
router.get('/', getAllDoctors);
router.get('/appointments', ensureDoctor, getDoctorAppointments);
router.post('/appointments/:id/status', ensureDoctor, updateAppointmentStatus);
router.get('/profile', ensureDoctor, getDoctorProfile);
router.get('/leave-dates', ensureDoctor, getDoctorLeaveDates);
router.post('/leave-dates', ensureDoctor, updateDoctorLeaveDates);

// YENİ İZİN TALEBİ ROTASI
// DİKKAT: doctorController. önekini sildik, çünkü fonksiyonu direkt import ettik!
router.post('/leave-request', ensureDoctor, createLeaveRequest);

export default router;