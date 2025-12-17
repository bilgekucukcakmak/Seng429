// server/middleware/authMiddleware.js (Sizin Sağladığınız Doğru İçerik)

import jwt from 'jsonwebtoken';
import 'dotenv/config';

const jwtSecret = process.env.JWT_SECRET;

// =======================================================
// 🔐 KİMLİK DOĞRULAMA (TOKEN KONTROLÜ)
// =======================================================
const ensureAuthenticated = (req, res, next) => {
    if (!jwtSecret) {
        console.error('JWT_SECRET ortam değişkeni yüklü değil!');
        return res.status(500).send('Sunucu yapılandırma hatası.');
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Erişim reddedildi: Token bulunamadı.');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, jwtSecret);

        // Token içeriğini request'e ekle
        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        next();

    } catch (error) {
        console.error('JWT doğrulama hatası:', error);
        return res.status(401).send('Geçersiz veya süresi dolmuş token.');
    }
};


// =======================================================
// 👨‍💼 ADMIN YETKİ KONTROLÜ
// =======================================================
const ensureAdmin = (req, res, next) => {
    ensureAuthenticated(req, res, () => {
        if (req.user.role !== 'admin') {
            return res.status(403).send('Yalnızca Admin bu kaynağa erişebilir.');
        }
        next();
    });
};


// =======================================================
// 👨‍⚕️ DOKTOR YETKİ KONTROLÜ
// =======================================================
const ensureDoctor = (req, res, next) => {
    ensureAuthenticated(req, res, () => {
        if (req.user.role !== 'doctor') {
            return res.status(403).send('Yalnızca Doktor bu kaynağa erişebilir.');
        }
        next();
    });
};


// =======================================================
// 📦 EXPORT
// =======================================================
export {
    ensureAuthenticated, // <-- Rotalarda KULLANILACAK İSİM
    ensureAdmin,
    ensureDoctor
};