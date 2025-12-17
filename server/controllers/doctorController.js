import pool from '../db.js';
import bcrypt from 'bcryptjs';

// =======================================================
// 🔧 YARDIMCI FONKSİYON
// =======================================================
const getDoctorId = async (userId) => {
    const [rows] = await pool.execute(
        'SELECT id FROM doctors WHERE user_id = ?',
        [userId]
    );
    return rows.length > 0 ? rows[0].id : null;
};

// =======================================================
// 👨‍⚕️ TÜM DOKTORLARI LİSTELE (PUBLIC)
// =======================================================
export const getAllDoctors = async (req, res) => {
    try {
        const [doctors] = await pool.execute(`
            SELECT
                d.id AS doctor_id,
                d.first_name,
                d.last_name,
                d.specialization,
                u.email
            FROM doctors d
            JOIN users u ON d.user_id = u.id
        `);

        res.status(200).json(doctors);
    } catch (error) {
        console.error('Doktor listesi çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};

// =======================================================
// 🏖️ DOKTOR İZİNLİ GÜNLERİ GETİR
// GET /api/doctors/leave
// =======================================================
export const getDoctorLeaveDates = async (req, res) => {
    const doctorUserId = req.user.id;

    try {
        const doctorId = await getDoctorId(doctorUserId);

        if (!doctorId) {
            return res.status(404).send('Doktor bulunamadı.');
        }

        const [rows] = await pool.execute(
            'SELECT leave_dates FROM doctors WHERE id = ?',
            [doctorId]
        );

        const leaveDates = rows[0]?.leave_dates
            ? JSON.parse(rows[0].leave_dates)
            : [];

        res.status(200).json(leaveDates);

    } catch (error) {
        console.error('İzinli günler getirme hatası:', error);
        res.status(500).send('İzinli günler getirilemedi.');
    }
};

// =======================================================
// 🏖️ DOKTOR İZİNLİ GÜNLERİ GÜNCELLE
// PATCH /api/doctors/leave
// =======================================================
export const updateDoctorLeave = async (req, res) => {
    const { leaveDates } = req.body;

    if (!Array.isArray(leaveDates)) {
        return res.status(400).send('İzinler array (dizi) formatında olmalıdır.');
    }

    try {
        const doctorId = await getDoctorId(req.user.id);

        if (!doctorId) {
            return res.status(404).send('Doktor kaydı bulunamadı.');
        }

        const leaveDatesJson = JSON.stringify(leaveDates);

        await pool.execute(
            'UPDATE doctors SET leave_dates = ? WHERE id = ?',
            [leaveDatesJson, doctorId]
        );

        res.status(200).json({
            message: 'İzinli günler başarıyla güncellendi.',
            leaveDates
        });
    } catch (error) {
        console.error('Doktor izin güncelleme hatası:', error);
        res.status(500).send('Sunucu hatası: İzinler kaydedilemedi.');
    }
};

// =======================================================
// 👤 DOKTOR PROFİLİNİ GÖRÜNTÜLE
// GET /api/doctors/profile
// =======================================================
export const getDoctorProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        const [rows] = await pool.execute(
            `
            SELECT
                d.first_name AS firstName,
                d.last_name AS lastName,
                u.email AS email,
                d.specialization AS specialization,
                d.title AS title
            FROM users u
            JOIN doctors d ON d.user_id = u.id
            WHERE u.id = ?
            `,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Doktor profili bulunamadı.' });
        }

        res.json(rows[0]);
    } catch (error) {
        console.error('Doktor profil getirme hatası:', error);
        res.status(500).json({ message: 'Doktor profili alınamadı.' });
    }
};



// =======================================================
// ✍️ DOKTOR PROFİLİNİ GÜNCELLE
// PATCH /api/doctors/profile
// =======================================================
export const updateDoctorProfile = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;
    let conn;

    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // =========================
        // USERS → SADECE EMAIL + PASSWORD
        // =========================
        let userQuery = `UPDATE users SET email = ?`;
        const userParams = [email];

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            userQuery += `, password_hash = ?`;
            userParams.push(hashedPassword);
        }

        userQuery += ` WHERE id = ?`;
        userParams.push(req.user.id);

        await conn.execute(userQuery, userParams);

        // =========================
        // DOCTORS → İSİMLER
        // =========================
        await conn.execute(
            `
            UPDATE doctors
            SET first_name = ?, last_name = ?
            WHERE user_id = ?
            `,
            [firstName, lastName, req.user.id]
        );

        await conn.commit();
        conn.release();

        res.status(200).json({ message: 'Profil bilgileri başarıyla güncellendi.' });

    } catch (error) {
        if (conn) {
            await conn.rollback();
            conn.release();
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ message: 'Bu e-posta adresi zaten kullanılıyor.' });
        }

        console.error('Doktor profil güncelleme hatası:', error);
        res.status(500).json({ message: 'Profil güncellenemedi.' });
    }
};
