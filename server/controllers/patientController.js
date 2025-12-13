import pool from '../db.js';

// --- Yardımcı Fonksiyon ---
const getPatientIdFromUser = async (userId) => {
    const [result] = await pool.execute(
        'SELECT id FROM patients WHERE user_id = ?',
        [userId]
    );
    return result[0] ? result[0].id : null;
};


// 1. Hasta Arama (Doktor/Admin) VEYA DETAY ÇEKME
export const searchPatientByTc = async (req, res) => {
    const tcNo = req.query.tc;

    if (!tcNo) {
        return res.status(400).send('TC numarası gerekli.');
    }

    try {
        const [patients] = await pool.execute(
            `SELECT
                p.id,
                p.first_name,
                p.last_name,
                p.tc_no,
                p.date_of_birth,   -- KRİTİK EKLENDİ
                p.gender,          -- KRİTİK EKLENDİ
                p.blood_type,      -- KRİTİK EKLENDİ
                p.height,          -- KRİTİK EKLENDİ
                p.weight,          -- KRİTİK EKLENDİ
                p.allergies,       -- KRİTİK EKLENDİ
                p.diseases,        -- KRİTİK EKLENDİ
                p.phone_number,
                u.email
             FROM patients p
             JOIN users u ON p.user_id = u.id
             WHERE p.tc_no = ?`,
            [tcNo]
        );

        if (patients.length === 0) {
            return res.status(404).send('Bu TC kimlik numarasına ait hasta bulunamadı.');
        }

        const patient = patients[0];

        // Frontend'e tüm detayları ve fullName'i döndür
        res.status(200).json({
            ...patient,
            fullName: `${patient.first_name} ${patient.last_name}`
        });

    } catch (error) {
        console.error('Hasta arama/detay çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};


// 2. Hastanın Kendi Profili
export const getPatientProfile = async (req, res) => {
    const userId = req.user.id;

    try {
        const patientId = await getPatientIdFromUser(userId);

        if (!patientId) {
            return res.status(404).send('Hasta profili bulunamadı.');
        }

        const [profile] = await pool.execute(
            // Kendi profilini çekerken tüm sütunları çekmek mantıklıdır
            'SELECT * FROM patients WHERE id = ?',
            [patientId]
        );

        res.status(200).json(profile[0]);

    } catch (error) {
        console.error('Hasta profili çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};


// 3. Hastanın Kendi Profilini Güncellemesi
export const updatePatientProfile = async (req, res) => {
    const userId = req.user.id;
    const {
        tc_no, date_of_birth, blood_type, gender,
        height, weight, allergies, diseases, phone_number
    } = req.body;

    try {
        const patientId = await getPatientIdFromUser(userId);

        if (!patientId) {
            return res.status(404).send('Hasta profili bulunamadı.');
        }

        const formattedDate = date_of_birth
            ? date_of_birth.split('T')[0]
            : null;

        await pool.execute(
            `UPDATE patients SET
                tc_no = ?, date_of_birth = ?, blood_type = ?, gender = ?,
                height = ?, weight = ?, allergies = ?, diseases = ?, phone_number = ?
             WHERE id = ?`,
            [
                tc_no || null,
                formattedDate,
                blood_type || null,
                gender || null,
                height || null,
                weight || null,
                allergies || null,
                diseases || null,
                phone_number || null,
                patientId
            ]
        );

        res.status(200).send('Profil başarıyla güncellendi.');

    } catch (error) {
        console.error('Hasta profili güncelleme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};


// 4. Doktor için Hasta Detayı (Bu fonksiyon artık kullanılmayacak, searchPatientByTc kullanılacak)
export const getPatientDetailById = async (req, res) => {
    // Bu fonksiyonu koruyabilirsiniz ancak DoctorPage.jsx'te TC'ye göre arama kullandık.
    const patientId = req.params.id;

    try {
        const [rows] = await pool.execute(
            `SELECT
                p.first_name,
                p.last_name,
                p.tc_no,
                p.date_of_birth,
                p.gender,
                p.phone_number,
                u.email
            FROM patients p
            JOIN users u ON p.user_id = u.id
            WHERE p.id = ?`,
            [patientId]
        );

        if (rows.length === 0) {
            return res.status(404).send('Hasta bulunamadı.');
        }

        res.status(200).json(rows[0]);

    } catch (error) {
        console.error('Hasta detay çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};