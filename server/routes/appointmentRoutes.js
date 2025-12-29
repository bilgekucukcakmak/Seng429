// server/routes/appointmentRoutes.js (NİHAİ VE TAM HALİ - İsimler Eşleştirildi)

import express from 'express';
// Controller'ları import et
import {
    createAppointment,
    getDoctorAppointments,
    getPatientAppointments,
    updateAppointment,
    getPatientAppointmentsByTc,
    getAvailableSlots
} from '../controllers/appointmentController.js';

// YENİ EKLENEN: Auth Middleware'ı import et
// Rotada kullanılacak doğru isim: ensureAuthenticated
import { ensureAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- Randevu Slotlarını Çekme Rotası (Hasta Tarafı) ---
// protect -> ensureAuthenticated olarak düzeltildi
router.get('/slots/:doctorId/:date', ensureAuthenticated, getAvailableSlots);


// 1. Randevu Oluşturma (POST /api/appointments)
// protect -> ensureAuthenticated olarak düzeltildi
router.post('/', ensureAuthenticated, createAppointment);

// 3. Doktorun Randevularını Çekme (GET /api/appointments/doctor)
// protect -> ensureAuthenticated olarak düzeltildi
router.get('/doctor', ensureAuthenticated, getDoctorAppointments);

router.get('/patient', ensureAuthenticated, getPatientAppointments);
// 4. Randevu Durumunu/Notunu Güncelleme (PATCH /api/appointments/:id)
// protect -> ensureAuthenticated olarak düzeltildi
router.patch('/:id', ensureAuthenticated, updateAppointment);

router.get('/patient/tc/:tcNo', getPatientAppointmentsByTc);
export default router;