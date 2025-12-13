// server/middleware/authMiddleware.js (TAM VE EKSİKSİZ)

import jwt from 'jsonwebtoken';
import 'dotenv/config';

const jwtSecret = process.env.JWT_SECRET;

// 1. Kimlik Doğrulama Middleware'i (Giriş kontrolü)
const ensureAuthenticated = (req, res, next) => {
    if (!jwtSecret) {
        console.error("JWT_SECRET ortam değişkeni yüklü değil!");
        return res.status(500).send("Sunucu yapılandırma hatası.");
    }

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Erişim reddedildi: Token bulunamadı.');
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, jwtSecret);

        // Token'dan gelen kullanıcı bilgilerini istek objesine ekler
        req.user = {
            id: decoded.id,
            role: decoded.role
        };

        next();

    } catch (ex) {
        console.error('JWT doğrulama hatası:', ex);
        return res.status(401).send('Geçersiz token.');
    }
};

// 2. Yetkilendirme Middleware'i (Admin rolü kontrolü)
const ensureAdmin = (req, res, next) => {
    // ensureAuthenticated'dan gelen req.user objesini kullanırız
    if (req.user.role !== 'admin') {
        return res.status(403).send('Yalnızca Admin bu kaynağa erişebilir.');
    }
    next();
};

// İki fonksiyonu da dışa aktar
export { ensureAuthenticated, ensureAdmin };