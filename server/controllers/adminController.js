// server/controllers/adminController.js (NİHAİ VE TAM HALİ - updateDoctor Eklendi)

import pool from '../db.js';

// --- Poliklinik Yönetimi ---
// Log kaydetmek için yardımcı fonksiyon
const createLog = async (adminId, action, details) => {
    try {
         const finalAdminId = adminId || null;

        await pool.execute(
            "INSERT INTO logs (admin_id, action, details) VALUES (?, ?, ?)",
            [finalAdminId, action, details]
        );
        console.log("✅ Log başarıyla kaydedildi:", action); // Terminale bakacağız
    } catch (err) {
        console.error("❌ LOG KAYDEDİLEMEDİ! Hata:", err.message);
    }
};
// 1. Tüm Poliklinikleri Çekme
export const getSpecializations = async (req, res) => {
    try {
        const [specializations] = await pool.execute(
            'SELECT DISTINCT specialization FROM doctors WHERE specialization IS NOT NULL AND specialization != "" ORDER BY specialization'
        );

        res.status(200).json(specializations.map(item => item.specialization));

    } catch (error) {
        console.error('Poliklinik çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};

// 2. Yeni Poliklinik Ekleme (Mock)
export const addSpecialization = async (req, res) => {
    const { name } = req.body;

    try {
        if (req.user.role !== 'admin') {
             return res.status(403).send('Yalnızca Admin yetkilidir.');
        }

        // Mock işlem: Gerçek bir ekleme yapmadan başarılı yanıt dönüyoruz
        res.status(201).json({
            message: `Poliklinik '${name}' başarıyla eklendi (Mock).`,
            newSpecialization: name
        });

    } catch (error) {
        console.error('Poliklinik ekleme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};

// --- Raporlama ---

// 3. Genel Raporları Çekme
export const getGeneralReports = async (req, res) => {
    try {
        const [totalPatients] = await pool.execute('SELECT COUNT(*) AS count FROM patients');
        const [totalDoctors] = await pool.execute('SELECT COUNT(*) AS count FROM doctors');
        const [totalAppointments] = await pool.execute('SELECT COUNT(*) AS count FROM appointments');

        res.status(200).json({
            patients: totalPatients[0].count,
            doctors: totalDoctors[0].count,
            appointments: totalAppointments[0].count,
        });

    } catch (error) {
        console.error('Rapor çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};

// adminController.js
export const getLogs = async (req, res) => {
    try {
        const [logs] = await pool.execute('SELECT * FROM logs ORDER BY created_at DESC');
        res.status(200).json(logs);
    } catch (error) {
        console.error('Log çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};

// --- KULLANICI YÖNETİMİ ---

// 4. TÜM KULLANICILARI ÇEKME (Doktor ve Hasta Detayları ile)
export const getAllUsers = async (req, res) => {
    try {
        const [users] = await pool.execute(
            `SELECT
                u.id,
                u.email,
                u.role,
                p.first_name AS patient_first_name,
                p.last_name AS patient_last_name,
                d.first_name AS doctor_first_name,
                d.last_name AS doctor_last_name,
                d.specialization,
                d.title  -- UNVAN ALANI EKLEDİK
             FROM users u
             LEFT JOIN patients p ON u.id = p.user_id
             LEFT JOIN doctors d ON u.id = d.user_id
             ORDER BY u.id ASC`
        );

        // Kullanıcı verilerini temizle ve birleştir
        const combinedUsers = users.map(user => {
            let firstName = null;
            let lastName = null;
            let specialization = null;
            let title = null; // UNVAN ALANI

            if (user.role === 'patient') {
                // Hasta ismini kullan, NULL ise e-postadan isim al
                firstName = user.patient_first_name || user.email.split('@')[0];
                lastName = user.patient_last_name;
            } else if (user.role === 'doctor') {
                // Doktor ismini kullan, NULL ise e-postadan isim al
                firstName = user.doctor_first_name || user.email.split('@')[0];
                lastName = user.doctor_last_name;
                specialization = user.specialization;
                title = user.title; // UNVAN ALANINI YÜKLÜYORUZ
            } else {
                 // Admin veya diğer roller için sadece e-posta bazlı isim kullan
                 firstName = user.email.split('@')[0];
            }


            return {
                id: user.id,
                email: user.email,
                role: user.role,
                first_name: firstName,
                last_name: lastName || '', // NULL ise boş string döndür
                specialization: specialization,
                title: title, // UNVAN EKLEME
            };
        });


        res.status(200).json(combinedUsers);
    } catch (error) {
        console.error('Kullanıcı listesi çekme hatası:', error);
        res.status(500).send('Sunucu hatası.');
    }
};


// 5. Kullanıcı Silme
// server/controllers/adminController.js

export const deleteUser = async (req, res) => {
    const { id } = req.params;
    const adminId = req.user?.id;

    try {
        // 1. ADIM: Silmeden önce bilgileri çek (Sütun isimlerine dikkat: d_first, p_first vb.)
        const [userRows] = await pool.execute(
            `SELECT u.role, d.first_name as d_first, d.last_name as d_last, d.specialization, d.title,
                    p.first_name as p_first, p.last_name as p_last
             FROM users u
             LEFT JOIN doctors d ON u.id = d.user_id
             LEFT JOIN patients p ON u.id = p.user_id
             WHERE u.id = ?`, [id]
        );

        if (userRows.length === 0) return res.status(404).send('Kullanıcı bulunamadı.');

        const userData = userRows[0];

        // 2. ADIM: JSON Objesini Hazırla
        const detailObj = {
            id: id,
            role: userData.role,
            fullName: userData.role === 'doctor'
                ? `${userData.title || 'Dr.'} ${userData.d_first} ${userData.d_last}`
                : `${userData.p_first} ${userData.p_last}`,
            specialization: userData.specialization || null,
            title: userData.title || null
        };

        // 3. ADIM: Kullanıcıyı Sil
        await pool.execute('DELETE FROM users WHERE id = ?', [id]);

        // 4. ADIM: LOG KAYDI (Sadece createLog kullanın, pool.execute ile manuel eklemeyin)
        // createLog fonksiyonu zaten INSERT işlemini kendi içinde yapıyor.
        await createLog(adminId, 'KULLANICI_SILINDI', JSON.stringify(detailObj));

        res.status(200).send('Kullanıcı başarıyla silindi ve loglandı.');
    } catch (error) {
        console.error("Silme hatası:", error);
        res.status(500).send('Hata oluştu.');
    }
};

export const getAppointmentStats = async (req, res) => {
    try {
        const { period } = req.query;
        let dateFilter = '';

        if (period === 'day') dateFilter = 'AND DATE(a.appointment_date) = CURDATE()';
        else if (period === 'week') dateFilter = 'AND a.appointment_date >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
        else if (period === 'month') dateFilter = 'AND a.appointment_date >= DATE_SUB(NOW(), INTERVAL 30 DAY)';

        // DÜZELTİLMİŞ SORGU
        const query = `
            SELECT
                d.specialization AS department,
                COUNT(a.id) AS count
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id  -- Sadece d.id'ye bağla
            WHERE a.status != 'canceled'
            ${dateFilter}
            GROUP BY d.specialization -- Bu satır 1140 hatasını çözer
        `;

        const [rows] = await pool.execute(query);
        res.status(200).json(rows);
    } catch (error) {
        console.error('Stats Hatası:', error);
        res.status(500).send('Sunucu hatası');
    }
};

export const getAppointmentsBySpecialization = async (req, res) => {
    try {
        const query = `
            SELECT
                d.specialization,
                COUNT(a.id) AS count
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE a.status = 'scheduled'
            GROUP BY d.specialization
            HAVING COUNT(a.id) > 0
            ORDER BY count DESC
        `;

        const [rows] = await pool.execute(query);
        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).send('Sunucu hatası');
    }
};
export const getDoctorsBySpecialization = async (req, res) => {
    const { specialization } = req.params;

    try {
        const query = `
            SELECT
                CONCAT(d.title, ' ', d.first_name, ' ', d.last_name) AS doctor,
                COUNT(a.id) AS count
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            WHERE d.specialization = ?
              AND a.status = 'scheduled'
            GROUP BY d.id
            ORDER BY count DESC
        `;

        const [rows] = await pool.execute(query, [specialization]);
        res.json(rows);

    } catch (error) {
        console.error(error);
        res.status(500).send('Sunucu hatası');
    }
};



// Örnek: Doktor silme fonksiyonunun içine ekle
export const deleteDoctor = async (req, res) => {
    const { id } = req.params;
    try {
        // ... silme işlemleri ...

        // Daha önce konuştuğumuz Log özelliğini de ESM yapısına göre ekleyelim:
        await createLog(req.user.id, 'DOKTOR_SILINDI', `ID: ${id} olan doktor silindi.`);

        res.json({ message: "Doktor başarıyla silindi." });
    } catch (err) {
        res.status(500).json({ error: "Sunucu hatası" });
    }
};



// 6. DOKTOR GÜNCELLEME (YENİ EKLEME)
export const updateDoctor = async (req, res) => {
    // Rota parametresi user_id olarak geçiyor
    const userId = req.params.id;

    // Frontend'den gelen veriler
    const { email, first_name, last_name, specialization, title } = req.body;

    // Şifre burada güncellenmediği için, şifre alanı hariç güncellemeler yapılır.
    if (!email || !first_name || !last_name || !specialization || !title) {
        return res.status(400).send("E-posta, Ad, Soyad, Uzmanlık ve Ünvan alanları zorunludur.");
    }

    // Veritabanı işlemleri (Multi-Update veya Transaction kullanılması önerilir)
    try {
        const [updateDoctorResult] = await pool.execute(
            `UPDATE doctors
             SET
                 first_name = ?,
                 last_name = ?,
                 specialization = ?,
                 title = ?
             WHERE
                 user_id = ?`,
            [first_name, last_name, specialization, title, userId]
        );

        // Email güncellemesi (Opsiyonel ama mantıklı)
        await pool.execute('UPDATE users SET email = ? WHERE id = ?', [email, userId]);


        if (updateDoctorResult.affectedRows === 0) {
            return res.status(404).send('Doktor bulunamadı.');
        }

        res.status(200).json({
            message: 'Doktor bilgileri başarıyla güncellendi.',
            updatedId: userId
        });

    } catch (error) {
        console.error(`Doktor güncelleme hatası (ID: ${userId}):`, error);
        // Eğer tabloda 'title' kolonu yoksa, hata burada fırlatılacaktır.
        res.status(500).json({ message: 'Sunucu hatası. Güncelleme işlemi başarısız oldu.' });
    }
};