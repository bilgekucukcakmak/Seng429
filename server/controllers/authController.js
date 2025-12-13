import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import 'dotenv/config';

const saltRounds = 10;
const jwtSecret = process.env.JWT_SECRET;

// JWT secret kontrolü
if (!jwtSecret) {
    throw new Error("JWT_SECRET çevre değişkeni tanımlı değil! Lütfen .env dosyasına ekleyin.");
}

// Yardımcı Fonksiyon: Kullanıcının patient/doctor ID'sini almak için
const getRelatedId = async (tableName, userId) => {
    const idColumn = tableName === 'patients' ? 'patient_id' : 'doctor_id';
    const [result] = await pool.execute(
        `SELECT ${idColumn} FROM ${tableName} WHERE user_id = ?`,
        [userId]
    );
    return result[0] ? result[0][idColumn] : null;
};

// --- REGISTER CONTROLLER ---
export const registerUser = async (req, res) => {
    const { email, password, role, first_name, last_name, specialization } = req.body;

    try {
        const password_hash = await bcrypt.hash(password, saltRounds);

        // 1. users tablosuna ekle
        const [userResult] = await pool.execute(
            'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
            [email, password_hash, role]
        );
        const userId = userResult.insertId;

        // 2. Role göre tabloya ekleme
        if (role === 'patient') {
            await pool.execute(
                'INSERT INTO patients (user_id, first_name, last_name) VALUES (?, ?, ?)',
                [userId, first_name, last_name]
            );
        } else if (role === 'doctor') {
            await pool.execute(
                'INSERT INTO doctors (user_id, first_name, last_name, specialization) VALUES (?, ?, ?, ?)',
                [userId, first_name, last_name, specialization || 'Genel']
            );
        }

        res.status(201).json({
            message: 'Kayıt başarılı',
            userId: userId,
            role: role
        });

    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).send('Bu e-posta adresi zaten kayıtlı.');
        }
        console.error('Kayıt hatası:', error);
        res.status(500).send('Sunucu hatası: Kayıt yapılamadı.');
    }
};

// --- LOGIN CONTROLLER ---
export const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const [users] = await pool.execute(
            'SELECT id, password_hash, role FROM users WHERE email = ?',
            [email]
        );
        const user = users[0];

        if (!user) {
            return res.status(401).send('Kullanıcı adı veya şifre yanlış.');
        }

        const storedHash = user.password_hash;

        // Hata ayıklama logları (isteğe bağlı)
        console.log('--- LOGIN DEBUG ---');
        console.log('Girilen Şifre:', password);
        console.log('DB Hash:', storedHash);

        const isMatch = await bcrypt.compare(password, storedHash);

        console.log('Şifre Eşleşmesi:', isMatch);

        if (!isMatch) {
            return res.status(401).send('Kullanıcı adı veya şifre yanlış.');
        }

        // JWT oluştur
        const token = jwt.sign(
            { id: user.id, role: user.role },
            jwtSecret,
            { expiresIn: '1d' }
        );

        return res.status(200).json({
            token: token,
            role: user.role,
            userId: user.id
        });

    } catch (error) {
        console.error('Giriş hatası:', error);
        res.status(500).send('Sunucu hatası: Giriş yapılamadı.');
    }
};
