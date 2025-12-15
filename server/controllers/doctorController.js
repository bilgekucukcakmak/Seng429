import pool from '../db.js';
import bcrypt from 'bcryptjs';

// --- Yardımcı Fonksiyon ---
const getDoctorId = async (userId) => {
    const [result] = await pool.execute(
        'SELECT id FROM doctors WHERE user_id = ?',
        [userId]
    );
    return result[0] ? result[0].id : null;
};
// --- Yardımcı Fonksiyon Sonu ---


// =======================================================
// 👨‍⚕️ TÜM DOKTORLARI LİSTELE
// =======================================================
export const getAllDoctors = async (req, res) => {
    try {
        const [doctors] = await pool.execute(
            `
            SELECT 
                d.id AS doctor_id,
                d.first_name,
                d.last_name,
                d.specialization,
                u.email
            FROM doctors d
            JOIN users u ON d.user_id = u.id
            `
        );

        res.status(200).json(doctors);

    } catch (error) {
        console.error('Doktor listesi çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};


// =======================================================
// 🏖️ DOKTOR İZİNLİ GÜNLERİ GÜNCELLE
// =======================================================
export const updateDoctorLeave = async (req, res) => {
    const doctorUserId = req.user.id;
    const { leaveDates } = req.body;
    const leaveDatesJson = JSON.stringify(leaveDates || []);

    try {
        const doctorId = await getDoctorId(doctorUserId);

        if (!doctorId) {
            return res.status(404).send('Doktor kaydı bulunamadı.');
        }

        const [result] = await pool.execute(
            'UPDATE doctors SET leave_dates = ? WHERE id = ?',
            [leaveDatesJson, doctorId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).send('Güncellenecek doktor bulunamadı.');
        }

        res.status(200).send('İzinli günler başarıyla güncellendi.');

    } catch (error) {
        console.error('Doktor izin güncelleme hatası:', error);
        res.status(500).send('Sunucu hatası: İzinler kaydedilemedi.');
    }
};


// =======================================================
// 👤 DOKTOR PROFİLİNİ GÖRÜNTÜLE
// =======================================================
export const getDoctorProfile = async (req, res) => {
    const { id: userId, role } = req.user;

    if (role !== 'doctor') {
        return res.status(403).send('Yetkisiz erişim.');
    }

    try {
        const [rows] = await pool.execute(
            `
            SELECT
                u.first_name,
                u.last_name,
                u.email,
                d.specialization,
                'Dr.' AS title
            FROM users u
            JOIN doctors d ON d.user_id = u.id
            WHERE u.id = ?
            `,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).send('Doktor profili bulunamadı.');
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Doktor profil getirme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};


// =======================================================
// ✍️ DOKTOR PROFİLİNİ GÜNCELLE
// =======================================================
export const updateDoctorProfile = async (req, res) => {
    const { id: userId, role } = req.user;
    const { firstName, lastName, email, password } = req.body;

    if (role !== 'doctor') {
        return res.status(403).send('Yasak: Bu işleme sadece doktorlar erişebilir.');
    }

    let conn;

    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // users tablosu
        let userQuery = 'UPDATE users SET first_name = ?, last_name = ?, email = ?';
        const userParams = [firstName, lastName, email];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            userQuery += ', password = ?';
            userParams.push(hashedPassword);
        }

        userQuery += ' WHERE id = ?';
        userParams.push(userId);

        await conn.execute(userQuery, userParams);

        // doctors tablosu
        await conn.execute(
            'UPDATE doctors SET first_name = ?, last_name = ? WHERE user_id = ?',
            [firstName, lastName, userId]
        );

        await conn.commit();
        conn.release();

        res.status(200).send('Profil bilgileri başarıyla güncellendi.');

    } catch (error) {
        if (conn) {
            await conn.rollback();
            conn.release();
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).send('Bu e-posta adresi zaten kullanılıyor.');
        }

        console.error('Doktor profil güncelleme hatası:', error);
        res.status(500).send('Sunucu hatası: Profil güncellenemedi.');
    }
};
