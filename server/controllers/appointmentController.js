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
    // Eğer saat bazlı randevu sistemi istiyorsak, 'time' bodysinde olmalı
    // Varsayım: `req.body` artık `{ doctorId, appointmentDate, time, reason }` içeriyor.
    const { doctorId, appointmentDate, time, reason } = req.body;

    // Time'ın doğru geldiğini ve şemanızda 'time' sütununun olduğunu varsayıyoruz.
    const fullDate = new Date(appointmentDate);
    const appointmentDateShort = fullDate.toISOString().split('T')[0]; // YYYY-MM-DD

    try {
        const patientId = await getPatientId(patientUserId);

        if (!patientId) {
            return res.status(404).send('Hasta kaydı bulunamadı.');
        }

        // Geçmiş Tarih/Saat Kontrolü
        const checkDateTime = new Date(`${appointmentDateShort}T${time || '00:00'}:00`);
        if (checkDateTime < new Date()) {
            return res.status(400).send('Randevu tarihi veya saati geçmiş bir zaman olamaz.');
        }

        // --- KONTROL 1: İzin Kontrolü ---
        const [doctorResult] = await pool.execute(
            'SELECT leave_dates FROM doctors WHERE id = ?',
            [doctorId]
        );

        if (doctorResult.length > 0 && doctorResult[0].leave_dates) {
            try {
                const leaveDates = JSON.parse(doctorResult[0].leave_dates);
                if (Array.isArray(leaveDates) && leaveDates.includes(appointmentDateShort)) {
                    return res.status(409).send('Seçilen doktor bu tarihte izinlidir. Lütfen başka bir tarih seçin.');
                }
            } catch (jsonError) {
                console.error("İzin tarihi JSON parse hatası:", jsonError);
            }
        }
        // --- İZİN KONTROL SONU ---


        // --- KONTROL 2: Randevu Saat Çakışması Kontrolü (GÜNCELLENMİŞ) ---
        const [existingAppointments] = await pool.execute(
            `SELECT id FROM appointments
             WHERE doctor_id = ?
             AND appointment_date = ?
             AND time = ?
             AND status IN ('scheduled')`,
            [doctorId, appointmentDateShort, time] // Saat kontrolü eklendi
        );

        if (existingAppointments.length > 0) {
            return res.status(409).send(`Seçilen saat ${time} için bu doktorun zaten planlanmış bir randevusu bulunmaktadır. Lütfen başka bir saat seçin.`);
        }
        // --- ÇAKIŞMA KONTROL SONU ---


        // --- KAYIT İŞLEMİ (Tüm Kontroller Başarılı) ---
        const [result] = await pool.execute(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, time, reason, status) VALUES (?, ?, ?, ?, ?, ?)',
            [patientId, doctorId, appointmentDateShort, time, reason, 'scheduled'] // time eklendi
        );

        res.status(201).json({
            message: 'Randevu başarıyla oluşturuldu.',
            appointmentId: result.insertId
        });

    } catch (error) {
        console.error('Randevu oluşturma hatası:', error);
        res.status(500).send('Sunucu hatası: Randevu oluşturulamadı.');
    }
};


// *******************************************************************
// 5. Randevu Slotlarını Çekme (GET /api/appointments/slots/:doctorId/:date) (YENİ FONKSİYON)
// *******************************************************************
export const getAvailableSlots = async (req, res) => {
    const { doctorId, date } = req.params; // date: YYYY-MM-DD formatında beklenir

    try {
        const appointmentDateShort = date;

        // 1. İzin Kontrolü (Mevcut mantık)
        const [doctorResult] = await pool.execute(
            'SELECT leave_dates FROM doctors WHERE id = ?',
            [doctorId]
        );

        if (doctorResult.length === 0) {
             return res.status(404).json({ message: "Doktor bulunamadı." });
        }

        const leaveDates = doctorResult[0].leave_dates ? JSON.parse(doctorResult[0].leave_dates) : [];
        if (leaveDates.includes(appointmentDateShort)) {
            // İzinliyse, tüm slotlar 'leave' olarak işaretlenip döndürülür.
            return res.status(200).json(FIXED_SLOTS.map(time => ({ time, status: 'leave' })));
        }

        // 2. Dolu Randevuları Çekme
        const [bookedAppointments] = await pool.execute(
            `SELECT time
             FROM appointments
             WHERE doctor_id = ?
             AND appointment_date = ?
             AND status IN ('scheduled')`,
            [doctorId, appointmentDateShort]
        );

        // Dolu saatleri Set yapısına atma (Hızlı kontrol için)
        const bookedTimes = new Set(bookedAppointments.map(app => app.time));

        // 3. Slot Durumlarını Belirleme
        const availableSlots = FIXED_SLOTS.map(time => {
            let status = 'available';

            // Randevu çakışması kontrolü
            if (bookedTimes.has(time)) {
                status = 'booked';
            }

            // Geçmiş saatleri kontrolü (sadece bugünün tarihiyse)
            const todayShort = new Date().toISOString().split('T')[0];
            if (appointmentDateShort === todayShort) {
                 const slotDateTime = new Date(`${appointmentDateShort}T${time}:00`);
                 if (slotDateTime < new Date()) {
                      status = 'past'; // Geçmişte kalan slotlar
                 }
            }

            return { time, status };
        });

        res.status(200).json(availableSlots);

    } catch (error) {
        console.error('Randevu slotları çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};


// *******************************************************************
// 2. Hastanın Randevu Geçmişini Çekme (GET /api/appointments/patient)
// *******************************************************************
export const getPatientAppointments = async (req, res) => {
    const patientUserId = req.user.id;

    try {
        const patientId = await getPatientId(patientUserId);

        if (!patientId) {
            return res.status(200).json([]);
        }

        const [appointments] = await pool.execute(
            `SELECT
                a.id,
                a.appointment_date,
                a.time,  -- TIME SÜTUNU EKLENDİ
                a.reason,
                a.status,
                a.doctor_note,
                d.first_name AS doctor_first_name,
                d.last_name AS doctor_last_name,
                d.specialization
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC, a.time DESC`,
            [patientId]
        );

        res.status(200).json(appointments);

    } catch (error) {
        console.error('Hasta randevu geçmişi çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
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
                a.time,  -- TIME SÜTUNU EKLENDİ
                a.reason,
                a.status,
                a.doctor_note,
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


// *******************************************************************
// 4. Randevu Durumunu / Doktor Notunu Güncelleme (PATCH /api/appointments/:id)
// *******************************************************************
export const updateAppointment = async (req, res) => {
    const appointmentId = req.params.id;
    const { status, note } = req.body;

    try {

        if (status === 'completed' || status === 'canceled') {

            const noteUpdate = (status === 'completed' && note !== undefined) ? ', doctor_note = ?' : '';
            const params = [status, appointmentId];
            if (noteUpdate) {
                params.splice(1, 0, note);
            }

            await pool.execute(
                `UPDATE appointments SET status = ? ${noteUpdate} WHERE id = ?`,
                params
            );
        }
        else {
            return res.status(400).send('Geçersiz durum veya eksik not.');
        }

        res.status(200).send('Randevu başarıyla güncellendi.');

    } catch (error) {
        console.error('Randevu güncelleme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};