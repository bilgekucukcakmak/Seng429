// server/routes/patientRoutes.js
import express from 'express';
// 1. Kullanacağınız TÜM controller fonksiyonlarını buraya ekleyin
import {
    searchPatientByTc,
    getPatientAppointmentsByTc,
    updatePatientProfile, // Bunu eklemeyi unutmayın
    getPatientProfile     // Eğer profil çekme rotası da buradaysa ekleyin
} from '../controllers/patientController.js';

// 2. Middleware ismini kontrol edin.
// Eğer dosyanızda adı 'ensureAuthenticated' ise aşağıda da onu kullanmalısınız.
import { ensureAuthenticated } from '../middleware/authMiddleware.js';

const router = express.Router();

// 3. HATA DÜZELTME: 'authenticateToken' yerine 'ensureAuthenticated' kullanın
// (ya da middleware dosyanızdaki gerçek isim hangisiyse)
router.put('/profile/update', ensureAuthenticated, updatePatientProfile);

// Diğer rotalar
router.get('/search', ensureAuthenticated, searchPatientByTc);
router.get('/history/:tcNo', ensureAuthenticated, getPatientAppointmentsByTc);
router.get('/profile', ensureAuthenticated, getPatientProfile);
export default router;