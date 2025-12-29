import express from 'express';
import {
  getSpecializations,
  getGeneralReports,
  addSpecialization,
  getAllUsers,
  deleteUser,
  updateDoctor,
  getAppointmentStats,
  getAppointmentsBySpecialization,
  getDoctorsBySpecialization,
  getLogs,
  getDoctorPerformance,
  getLeaveRequests,
  approveLeave,
  rejectLeave
} from '../controllers/adminController.js';

import { ensureAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// 📊 Doktor Performansları
router.get("/doctor-performance", ensureAdmin, getDoctorPerformance);

// 📈 Raporlar
router.get('/reports', ensureAdmin, getGeneralReports);
router.get('/reports/appointment-stats', ensureAdmin, getAppointmentStats);
router.get('/reports/appointments-by-specialization', ensureAdmin, getAppointmentsBySpecialization);
router.get('/reports/doctors-by-specialization/:specialization', ensureAdmin, getDoctorsBySpecialization);

// 📜 Loglar
router.get('/logs', ensureAdmin, getLogs);

// 👥 Kullanıcı & Klinik
router.get('/specializations', getSpecializations);router.get('/users', ensureAdmin, getAllUsers);
router.delete('/users/:id', ensureAdmin, deleteUser);
router.put('/doctor/:id', ensureAdmin, updateDoctor);

// 📅 İzin Yönetimi Rotaları
// Not: 'adminController.' önekini kaldırdık çünkü fonksiyonları yukarıda direkt import ettik.
router.get('/leave-requests', ensureAdmin, getLeaveRequests);
router.post('/approve-leave', ensureAdmin, approveLeave);
router.post('/reject-leave', ensureAdmin, rejectLeave);



export default router;