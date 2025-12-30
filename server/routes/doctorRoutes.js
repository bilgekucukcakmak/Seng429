import express from 'express';
import {
    getAllDoctors,
    getDoctorAppointments,
    updateAppointmentStatus,
    getDoctorProfile,
    getDoctorLeaveDates,
    updateDoctorLeaveDates,
    createLeaveRequest,
    deleteLeaveRequest
} from '../controllers/doctorController.js';

import { ensureDoctor } from '../middleware/authMiddleware.js';

const router = express.Router();

// Doktor listeleme (Genel)
router.get('/', getAllDoctors);

// Doktor Özel Rotaları (ensureDoctor korumalı)
router.get('/appointments', ensureDoctor, getDoctorAppointments);
router.post('/appointments/:id/status', ensureDoctor, updateAppointmentStatus);
router.get('/profile', ensureDoctor, getDoctorProfile);

// İzin İşlemleri (Hem onaylı hem bekleyen talepler getDoctorLeaveDates içinden döner)
router.get('/leave-dates', ensureDoctor, getDoctorLeaveDates);
router.post('/leave-dates', ensureDoctor, updateDoctorLeaveDates);

// Yeni İzin Talebi Oluşturma
router.post('/leave-request', ensureDoctor, createLeaveRequest);
router.delete('/leave-request/:date', ensureDoctor, deleteLeaveRequest);
export default router;