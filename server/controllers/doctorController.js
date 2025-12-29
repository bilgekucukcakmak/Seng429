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

export const getDoctorLeaveDates = async (req, res) => {
    try {
        // req.user.id üzerinden doğrudan doktorun onaylanmış izinlerini çekiyoruz
        const [rows] = await pool.execute(
            'SELECT leave_dates FROM doctors WHERE user_id = ?',
            [req.user.id]
        );

        // Veritabanında JSON string olarak tutulan veriyi diziye çeviriyoruz
        const leaveDates = rows[0]?.leave_dates
            ? (typeof rows[0].leave_dates === 'string' ? JSON.parse(rows[0].leave_dates) : rows[0].leave_dates)
            : [];

        res.status(200).json({ leaveDates });
    } catch (error) {
        console.error('İzin getirme hatası:', error);
        res.status(500).json({ message: 'İzinli günler getirilemedi.' });
    }
};
// doctorController.js içindeki ilgili fonksiyon
export const updateAppointmentNote = async (req, res) => {
    const { id } = req.params; // Randevu ID
    const { note } = req.body; // Frontend'den gelen 'note'

    // Gelen notun boş olup olmadığını kontrol edin
    if (!note || note.trim() === "") {
        return res.status(400).send("Geçersiz durum veya eksik not.");
    }

    try {
        await pool.execute(
            "UPDATE appointments SET doctor_note = ? WHERE id = ?",
            [note, id]
        );
        res.status(200).send("Not başarıyla kaydedildi.");
    } catch (error) {
        console.error("Not kaydetme hatası:", error);
        res.status(500).send("Sunucu hatası.");
    }
};
// DOKTOR İZİNLİ GÜNLERİ GÜNCELLE
export const updateDoctorLeaveDates = async (req, res) => {
    const { leaveDates } = req.body; // Frontend'den gelen yeni dizi

    try {
        // Doktorun onaylanmış izin listesini (sarı rozetler) günceller
        await pool.execute(
            'UPDATE doctors SET leave_dates = ? WHERE user_id = ?',
            [JSON.stringify(leaveDates), req.user.id]
        );

        res.status(200).json({ message: 'Takvim başarıyla güncellendi.' });
    } catch (error) {
        console.error('İzin güncelleme hatası:', error);
        res.status(500).json({ message: 'İzinler kaydedilemedi.' });
    }
};


export const getDoctorProfile = async (req, res) => {
    try {
        const userId = req.user.id;

        // DİKKAT: Sütun adını veritabanındaki yeni adıyla (academic_background) çağırmalıyız
        const [rows] = await pool.execute(
            `
            SELECT
                d.first_name AS firstName,
                d.last_name AS lastName,
                u.email AS email,
                d.specialization AS specialization,
                d.title AS title,
                d.academic_background AS education  -- BURASI ÇOK ÖNEMLİ
             FROM users u
             JOIN doctors d ON d.user_id = u.id
             WHERE u.id = ?
             `,
            [userId]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: 'Doktor profili bulunamadı.' });
        }

        let doctorData = rows[0];

        // Frontend'in .map() yapabilmesi için verinin formatını kontrol ediyoruz
        // Eğer veritabanında 'dd' gibi bir string varsa, onu bir diziye çevirip gönderiyoruz
        if (doctorData.education) {
            if (typeof doctorData.education === 'string') {
                // Eğer veri "['okul1', 'okul2']" gibi bir JSON string ise parse et
                if (doctorData.education.startsWith('[')) {
                    try {
                        doctorData.education = JSON.parse(doctorData.education);
                    } catch (e) {
                        doctorData.education = [doctorData.education];
                    }
                } else {
                    // Eğer düz metinse (dd gibi), satırlara bölerek dizi yap
                    doctorData.education = doctorData.education.split('\n').filter(l => l.trim() !== "");
                }
            }
        } else {
            doctorData.education = [];
        }

        res.json(doctorData);
    } catch (error) {
        console.error('Doktor profil getirme hatası:', error);
        res.status(500).json({ message: 'Doktor profili alınamadı.' });
    }
};

export const updateDoctorProfile = async (req, res) => {
    // 1. DÜZELTME: academic_background ve diğer alanları body'den al
    const { firstName, lastName, email, password, title, specialization, academic_background } = req.body;
    let conn;

    try {
        conn = await pool.getConnection();
        await conn.beginTransaction();

        // USERS güncellemesi (Aynı kalabilir)
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

        // 2. DÜZELTME: DOCTORS tablosuna eğitim bilgisini ekle
        await conn.execute(
            `
            UPDATE doctors
            SET first_name = ?, last_name = ?, title = ?, specialization = ?, academic_background = ?
            WHERE user_id = ?
            `,
            [firstName, lastName, title, specialization, academic_background, req.user.id]
        );

        await conn.commit();
        conn.release();
        res.status(200).json({ message: 'Profil bilgileri başarıyla güncellendi.' });

    } catch (error) {
        if (conn) { await conn.rollback(); conn.release(); }
        // Hata yönetimi aynı kalabilir...
        res.status(500).json({ message: 'Profil güncellenemedi.' });
    }
};

// server/controllers/doctorController.js
export const createLeaveRequest = async (req, res) => {
    const { startDate, endDate } = req.body;
    const doctorId = req.user.id;

    try {
        const query = `
            INSERT INTO leave_requests (doctor_id, start_date, end_date, status, request_date)
            VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP)`;

        await pool.execute(query, [doctorId, startDate, endDate]);
        res.json({ message: "İzin talebi oluşturuldu." });
    } catch (error) {
        res.status(500).json({ message: "Veritabanı hatası." });
    }
};

export const getDoctorAppointments = async (req, res) => {
    try {
        const doctorUserId = req.user.id;
        // appointments, users ve patients tablolarını birleştirerek randevu listesini çeker
        const [appointments] = await pool.execute(`
            SELECT
                a.*,
                u.first_name AS patient_first_name,
                u.last_name AS patient_last_name,
                p.tc_no
            FROM appointments a
            JOIN users u ON a.patient_id = u.id
            JOIN patients p ON u.id = p.user_id
            WHERE a.doctor_id = ?
            ORDER BY a.appointment_date ASC, a.time ASC
        `, [doctorUserId]);

        res.json(appointments);
    } catch (error) {
        console.error("Randevu çekme hatası:", error);
        res.status(500).json({ message: "Randevular alınamadı." });
    }
};

export const updateAppointmentStatus = async (req, res) => {
    const { id } = req.params;
    const { status, note, prescription } = req.body;

    try {
        // Randevunun durumunu, doktor notunu ve reçetesini günceller
        await pool.execute(
            "UPDATE appointments SET status = ?, doctor_note = ?, prescription = ? WHERE id = ?",
            [status, note, prescription, id]
        );
        res.json({ message: "Randevu başarıyla güncellendi." });
    } catch (error) {
        console.error("Randevu güncelleme hatası:", error);
        res.status(500).json({ message: "Güncelleme başarısız." });
    }
};

export const getMyLeaveRequests = async (req, res) => {
    try {
        const doctorId = req.user.id; // Giriş yapan doktorun ID'si
        const [requests] = await pool.execute(
            'SELECT * FROM leave_requests WHERE doctor_id = ? ORDER BY request_date DESC',
            [doctorId]
        );
        res.json(requests);
    } catch (error) {
        res.status(500).json({ message: "Talepleriniz alınamadı." });
    }
};