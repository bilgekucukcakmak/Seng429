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

// server/controllers/doctorController.js

export const getAllDoctors = async (req, res) => {
    try {
        const [doctors] = await pool.execute(`
            SELECT
                d.id AS doctor_id,   -- d.id'yi doctor_id olarak gönderiyoruz
                d.user_id AS id,
                d.first_name,
                d.last_name,
                d.specialization,
                d.title,
                u.email
            FROM doctors d
            LEFT JOIN users u ON d.user_id = u.id -- u.id ile d.user_id eşleşmeli
        `);

        console.log("Veritabanından çekilen doktor sayısı:", doctors.length);
        res.status(200).json(doctors);
    } catch (error) {
        console.error('Doktor listesi çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};

// server/controllers/doctorController.js

// server/controllers/doctorController.js
// server/controllers/doctorController.js

// TALEPLERİ LİSTELEME
export const getDoctorLeaveDates = async (req, res) => {
    try {
        const userId = req.user.id; // ensureDoctor sayesinde burası dolu gelir

        const [requests] = await pool.execute(
            'SELECT start_date as date, status FROM leave_requests WHERE doctor_id = ?',
            [userId]
        );

        res.status(200).json({ leaveDates: requests });
    } catch (error) {
        console.error("SQL Hatası:", error);
        res.status(500).json({ message: error.message });
    }
};

// YENİ TALEP OLUŞTURMA (500 Hatasını Çözen Kısım)
// server/controllers/doctorController.js
// server/controllers/doctorController.js

export const deleteLeaveRequest = async (req, res) => {
    const { date } = req.params; // Beklenen: "2026-04-14"
    const userId = req.user.id;

    try {
        const [result] = await pool.execute(
            'DELETE FROM leave_requests WHERE doctor_id = ? AND DATE(start_date) = ? AND status = "pending"',
            [userId, date]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Silinecek kayıt bulunamadı." });
        }
        res.status(200).send("Başarıyla silindi.");
    } catch (error) {
        res.status(500).json({ message: error.message });
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


export const createLeaveRequest = async (req, res) => {
    // Middleware'den (ensureDoctor) gelen userId'yi kullanıyoruz
    const userId = req.user.id;
    const { startDate, endDate } = req.body;

    try {
        // SQL sorgusunda kolon isimlerini (start_date, end_date)
        // veritabanı şemana göre güncelledik.
        await pool.execute(
            'INSERT INTO leave_requests (doctor_id, start_date, end_date, status) VALUES (?, ?, ?, "pending")',
            [userId, startDate, endDate]
        );

        res.status(201).send("Talep başarıyla oluşturuldu.");
    } catch (error) {
        console.error("Kayıt Hatası:", error);
        res.status(500).json({ message: "Veritabanı hatası: " + error.message });
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
    const userId = req.user.id; // Giriş yapan doktorun ID'si
    try {
        const [rows] = await pool.execute(
            `SELECT * FROM leave_requests
             WHERE doctor_id = (SELECT id FROM doctors WHERE user_id = ?)`,
            [userId]
        );
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).send("Talepleriniz yüklenemedi.");
    }
};