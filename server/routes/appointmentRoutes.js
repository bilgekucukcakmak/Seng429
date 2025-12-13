// server/routes/appointmentRoutes.js (SADECE YÖNLENDİRME)

import express from 'express';
// Controller'ı import et
import {
    createAppointment,
    getPatientAppointments,
    getDoctorAppointments,
    updateAppointment
} from '../controllers/appointmentController.js';

const router = express.Router();

// 1. Randevu Oluşturma (POST /api/appointments)
router.post('/', createAppointment);

// 2. Hastanın Randevularını Çekme (GET /api/appointments/patient)
// JWT kullanıldığı için artık URL'den userId çekmeye gerek yok, token'dan alıyoruz.
router.get('/patient', getPatientAppointments);

// 3. Doktorun Randevularını Çekme (GET /api/appointments/doctor)
// JWT kullanıldığı için artık URL'den userId çekmeye gerek yok, token'dan alıyoruz.
router.get('/doctor', getDoctorAppointments);

// 4. Randevu Durumunu/Notunu Güncelleme (PATCH /api/appointments/:id)
router.patch('/:id', updateAppointment);

export default router;