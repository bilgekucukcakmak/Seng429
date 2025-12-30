// server/server.js (NİHAİ VE TEMİZ HALİ)

import dotenv from "dotenv";
dotenv.config();

import express from 'express';
import cors from 'cors';
import './db.js';
import appointmentRoutes from './routes/appointmentRoutes.js';
import authRoutes from './routes/authRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { ensureAuthenticated } from './middleware/authMiddleware.js';


const app = express();
const PORT = 5001; // Sunucunuzun çalıştığı portu (5001) kullanıyoruz.

// --- 1. KAPSAMLI CORS AYARI (Tüm isteklerden önce gelmeli) ---
app.use(cors({
  origin: ["http://localhost:5173", "http://localhost:5174"], // Frontend adresleri
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// OPTIONS preflight isteklerini kabul et
app.options('*', cors());

// --- 2. BODY PARSER ---
app.use(express.json());

// --- 3. ROTA TANIMLARI (SADECE BİR KERE VE YETKİLENDİRME İLE) ---

// Yetkilendirme gerektirmeyen rotalar (Login/Register)
app.use('/api/auth', authRoutes);

// Korumalı Rotalar (JWT kontrolü gerektirir)
app.use('/api/appointments', ensureAuthenticated, appointmentRoutes);
app.use('/api/patients', ensureAuthenticated, patientRoutes);
app.use('/api/admin', ensureAuthenticated, adminRoutes); 

// Doktor Listesi (Randevu oluşturmak için herkesin görmesi gerekebilir, JWT olmadan)
app.use('/api/doctor', doctorRoutes);


// --- 4. ANA DİZİN VE SUNUCU BAŞLATMA ---
app.get('/', (req, res) => {
  res.send('Seng429 Backend Sunucusu Çalışıyor!');
});

app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde dinleniyor.`);
});