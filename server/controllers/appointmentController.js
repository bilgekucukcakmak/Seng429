// server/controllers/appointmentController.js (NİHAİ VE TAM HALİ - İzin, Çakışma Kontrolü ve Slot Çekme Eklendi)

import pool from '../db.js';

// --- SABİT TANIMLAMALAR (Çalışma saatleri ve slotları) ---
// Sizin sabit saatlerinize göre 30 dakikalık slotlar
const FIXED_SLOTS = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
    "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30",
    "16:00", "16:30"
];

// --- Yardımcı Fonksiyonlar ---
const getPatientId = async (userId) => {
    const [result] = await pool.execute(
        'SELECT id FROM patients WHERE user_id = ?',
        [userId]
    );
    return result[0] ? result[0].id : null;
};

const getDoctorId = async (userId) => {
    const [result] = await pool.execute(
        'SELECT id FROM doctors WHERE user_id = ?',
        [userId]
    );
    return result[0] ? result[0].id : null;
};
// --- Yardımcı Fonksiyonlar Sonu ---


// *******************************************************************
// 1. Randevu Oluşturma (POST /api/appointments)
// Not: Saat bazlı çakışma için, Frontend'in 'time' bilgisini göndermesi GEREKİR.
// *******************************************************************
export const createAppointment = async (req, res) => {
    const patientUserId = req.user.id;
    // req.body içinden tüm gerekli verileri, appointmentType dahil çekiyoruz
    const { doctorId, appointmentDate, time, reason, appointmentType } = req.body;

    const fullDate = new Date(appointmentDate);
    const appointmentDateShort = fullDate.toISOString().split('T')[0];

    try {
        // 1. Hastanın asıl ID'sini bul
        const patientId = await getPatientId(patientUserId);
        if (!patientId) {
            return res.status(404).send('Hasta kaydı bulunamadı.');
        }

        // 2. Geçmiş Tarih/Saat Kontrolü
        const checkDateTime = new Date(`${appointmentDateShort}T${time || '00:00'}:00`);
        if (checkDateTime < new Date()) {
            return res.status(400).send('Randevu tarihi veya saati geçmiş bir zaman olamaz.');
        }

        // 3. KRİTİK ADIM: Doktorun asıl birincil anahtarını (ID) bul
        // Bu adım, Foreign Key hatasını (ER_NO_REFERENCED_ROW_2) önlemek içindir.
        const [doctorSearch] = await pool.execute(
            'SELECT id, leave_dates FROM doctors WHERE id = ? OR user_id = ?',
            [doctorId, doctorId]
        );

        if (doctorSearch.length === 0) {
            return res.status(404).send('Geçerli bir doktor kaydı bulunamadı.');
        }

        const actualDoctorId = doctorSearch[0].id; // Veritabanındaki gerçek 'id'
        const rawLeaveData = doctorSearch[0].leave_dates;

        // 4. İzin Kontrolü
        if (rawLeaveData) {
            try {
                const leaveDates = typeof rawLeaveData === 'string' ? JSON.parse(rawLeaveData) : rawLeaveData;
                // Hem string dizisi hem de obje formatını kontrol eder
                const isOnLeave = Array.isArray(leaveDates) && leaveDates.some(item => {
                    const dateValue = typeof item === 'object' ? item.date : item;
                    return dateValue && dateValue.startsWith(appointmentDateShort);
                });

                if (isOnLeave) {
                    return res.status(409).send('Seçilen doktor bu tarihte izinlidir.');
                }
            } catch (jsonError) {
                console.error("İzin verisi işleme hatası:", jsonError);
            }
        }

        // 5. Randevu Saat Çakışması Kontrolü (Asıl ID ile sorguluyoruz)
        const [existingAppointments] = await pool.execute(
            `SELECT id FROM appointments
             WHERE doctor_id = ?
             AND appointment_date = ?
             AND time = ?
             AND status IN ('scheduled')`,
            [actualDoctorId, appointmentDateShort, time]
        );

        if (existingAppointments.length > 0) {
            return res.status(409).send(`Seçilen saat ${time} için doktorun zaten bir randevusu bulunmaktadır.`);
        }

        // 6. KAYIT İŞLEMİ (Foreign Key hatası almamak için actualDoctorId kullanıyoruz)
        const [result] = await pool.execute(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, time, reason, appointmentType, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [
                patientId,
                actualDoctorId, // foreign key ile eşleşen asıl ID
                appointmentDateShort,
                time,
                reason,
                appointmentType || 'Muayene', // Artık veritabanına doğru tip yazılacak
                'scheduled'
            ]
        );

        res.status(201).json({
            message: 'Randevu başarıyla oluşturuldu.',
            appointmentId: result.insertId
        });

    } catch (error) {
        console.error('Randevu oluşturma hatası (SQL):', error.message);
        res.status(500).send('Sunucu hatası: Randevu oluşturulamadı. ' + error.message);
    }
};
export const getTestResults = async (req, res) => {
    const patientUserId = req.user.id;
    try {
        const patientId = await getPatientId(patientUserId);
        const [results] = await pool.execute(
            `SELECT a.id, a.appointment_date,
                    d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
                    a.test_results -- Tahlil verilerinin tutulduğu sütun
             FROM appointments a
             JOIN doctors d ON a.doctor_id = d.id
             WHERE a.patient_id = ? AND a.test_results IS NOT NULL
             ORDER BY a.appointment_date DESC`,
            [patientId]
        );
        res.status(200).json(results);
    } catch (error) {
        res.status(500).send('Tahlil sonuçları yüklenemedi.');
    }
};
// *******************************************************************
// 5. Randevu Slotlarını Çekme (GET /api/appointments/slots/:doctorId/:date) (YENİ FONKSİYON)
// *******************************************************************
export const getAvailableSlots = async (req, res) => {
    const { doctorId, date } = req.params;
    const appointmentDateShort = date; // Frontend'den gelen YYYY-MM-DD

    try {
        // Sorguyu hem 'id' hem de 'user_id' kontrol edecek şekilde güncelleyin
        const [doctorResult] = await pool.execute(
            'SELECT leave_dates FROM doctors WHERE id = ? OR user_id = ?',
            [doctorId, doctorId]  );

        if (doctorResult.length === 0) {
             return res.status(404).json({ message: "Doktor bulunamadı." });
        }

        // --- GÜVENLİ İZİN KONTROLÜ (DÜZELTİLDİ) ---
        let leaveDates = [];
        const rawLeaveData = doctorResult[0].leave_dates;

        if (rawLeaveData) {
            // Veri string ise parse et, değilse direkt kullan
            leaveDates = typeof rawLeaveData === 'string' ? JSON.parse(rawLeaveData) : rawLeaveData;
        }

        // Hem string dizisi hem de obje dizisi formatını kontrol et
        const isOnLeave = Array.isArray(leaveDates) && leaveDates.some(item => {
            const dateValue = typeof item === 'object' ? item.date : item;
            return dateValue && dateValue.startsWith(appointmentDateShort);
        });

        if (isOnLeave) {
            return res.status(200).json(FIXED_SLOTS.map(time => ({ time, status: 'leave' })));
        }
        // --- İZİN KONTROLÜ SONU ---

        // 2. Dolu Randevuları Çekme
        const [bookedAppointments] = await pool.execute(
            `SELECT time FROM appointments
             WHERE doctor_id = ? AND appointment_date = ? AND status IN ('scheduled')`,
            [doctorId, appointmentDateShort]
        );

        const bookedTimes = new Set(bookedAppointments.map(app => app.time));

        // 3. Slot Durumlarını Belirleme
        const availableSlots = FIXED_SLOTS.map(time => {
            let status = 'available';
            if (bookedTimes.has(time)) status = 'booked';

            const todayShort = new Date().toISOString().split('T')[0];
            if (appointmentDateShort === todayShort) {
                 const slotDateTime = new Date(`${appointmentDateShort}T${time}:00`);
                 if (slotDateTime < new Date()) status = 'past';
            }
            return { time, status };
        });

        res.status(200).json(availableSlots);

    } catch (error) {
        console.error('Randevu slotları çekme hatası (Detay):', error);
        res.status(500).send('Sunucu hatası: ' + error.message);
    }
};

// server/controllers/appointmentController.js

// server/controllers/appointmentController.js


// =======================================================
// 📜 HASTA TC NO İLE TÜM GEÇMİŞİ GETİR
// =======================================================
// server/controllers/appointmentController.js

// server/controllers/appointmentController.js

// server/controllers/appointmentController.js
// server/controllers/appointmentController.js
// server/controllers/appointmentController.js

// server/controllers/appointmentController.js
export const getPatientAppointmentsByTc = async (req, res) => {
    const { tcNo } = req.params;
    try {
        const query = `
            SELECT
                a.id, a.appointment_date, a.doctor_note, a.status,
                a.prescription, a.appointmentType,
                a.test_results AS lab_report_url, -- EKLENDİ
                'https://pacs-sistem-linki.com/view' AS radiology_url, -- ÖRNEK TEST VERİSİ
                d.first_name AS doctor_first_name,
                d.last_name AS doctor_last_name,
                d.title AS doctor_title,
                d.specialization AS doctor_branch
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
            WHERE p.tc_no = ?
            ORDER BY a.appointment_date DESC
        `;
        const [rows] = await pool.execute(query, [tcNo]);
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).send('Hata oluştu.');
    }
};
// *******************************************************************
// 3. Doktorun Güncel Randevularını Çekme (GET /api/appointments/doctor)
// *******************************************************************
export const getDoctorAppointments = async (req, res) => {
    const doctorUserId = req.user.id;

    try {
        const doctorId = await getDoctorId(doctorUserId);

        if (!doctorId) {
            return res.status(200).json([]);
        }

        const [appointments] = await pool.execute(
                `SELECT
                    a.id,
                    a.appointment_date,
                    a.time,
                    a.reason,
                    a.status,
                    a.doctor_note,
                    a.appointmentType, -- BU SATIRI EKLEMEN ŞART!
                    p.first_name AS patient_first_name,
                    p.last_name AS patient_last_name,
                    p.tc_no,
                    p.id AS patient_id
                FROM appointments a
                JOIN patients p ON a.patient_id = p.id
                WHERE a.doctor_id = ?
                ORDER BY a.appointment_date ASC, a.time ASC`,
                [doctorId]
            );

        res.status(200).json(appointments);

    } catch (error) {
        console.error('Doktor randevu listesi çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};


export const updateAppointment = async (req, res) => {
    const appointmentId = req.params.id;
    const { status, note, prescription } = req.body;

    try {
        if (status === 'completed' || status === 'canceled') {
            // TABLO İSMİNE DİKKAT: appointments (çoğul olmalı)
            const query = `
                UPDATE appointments
                SET status = ?,
                    doctor_note = ?,
                    prescription = ?
                WHERE id = ?
            `;

            // Sıralama: status (1), note (2), prescription (3), id (4)
            const [result] = await pool.execute(query, [
                status,
                note || '',
                prescription || '',
                appointmentId
            ]);

            if (result.affectedRows === 0) {
                return res.status(404).send('Randevu bulunamadı.');
            }
        } else {
            return res.status(400).send('Geçersiz durum.');
        }

        res.status(200).send('Başarıyla güncellendi.');

    } catch (error) {
        console.error('Randevu güncelleme hatası (SQL):', error);
        res.status(500).send('Sunucu hatası: ' + error.message);
    }
};


export const getPatientByTc = async (req, res) => {
    const { tc } = req.query; // Query parametresinden TC'yi alıyoruz

    try {
        const [rows] = await pool.execute(
            'SELECT id, first_name, last_name, tc_no, date_of_birth, gender, phone_number, email FROM patients WHERE tc_no = ?',
            [tc]
        );

        if (rows.length === 0) {
            return res.status(404).json({ message: "Bu TC numarasına kayıtlı hasta bulunamadı." });
        }

        res.status(200).json(rows[0]);
    } catch (error) {
        console.error('Hasta arama hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};

export const getPatientAppointments = async (req, res) => {
    try {
        // req.user.id zaten giriş yapan kişinin Users tablosundaki ID'sidir.
        const userId = req.user.id;

        const [appointments] = await pool.execute(
            `
            SELECT
                a.id, a.appointment_date, a.time, a.status, a.doctor_note,
                a.prescription, a.test_results,
                p.first_name AS patient_first_name, p.last_name AS patient_last_name,
                p.tc_no AS patient_tc,
                d.first_name AS doctor_first_name, d.last_name AS doctor_last_name,
                d.title AS doctor_title, d.specialization
            FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            JOIN doctors d ON a.doctor_id = d.id
             WHERE p.user_id = ?
            ORDER BY a.appointment_date DESC, a.time DESC
            `,
            [userId]
        );

        res.status(200).json(appointments);

    } catch (error) {
        console.error("❌ getPatientAppointments:", error);
        res.status(500).json({ message: "Sunucu hatası" });
    }
};