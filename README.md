# Seng429 - Hastane Randevu Yönetim Sistemi

Bu uygulama; yönetici (Admin), doktor ve hasta rollerine sahip kullanıcıların hastane süreçlerini yönetmesini sağlar.

🛠 **Kullanılan Teknolojiler**
- **Frontend:** React.js, React Router, Recharts (İstatistikler), Axios.
- **Backend:** Node.js, Express.js.
- **Veritabanı:** MySQL & Workbench (Relational Database).
- **Kimlik Doğrulama:** JWT (JSON Web Token).

📌 **Neden MySQL Tercih Edildi?**
Projenin gereksinim dökümanında belirtilen karmaşık veri ilişkilerini (Doktor-Hasta-Randevu) en güvenli şekilde yönetmek ve veri bütünlüğünü (ACID) korumak amacıyla ilişkisel veritabanı (MySQL) tercih edilmiştir. İstatistik sayfasındaki raporlar SQL GROUP BY ve JOIN sorguları ile dinamik olarak üretilmektedir.

✅ **Gereksinim Karşılama**
- **En az 5 Entity:** User, Doctor, Patient, Appointment, Specialization.
- **CRUD İşlemleri:** Randevu alma, iptal etme ve profil yönetimi aktif olarak çalışmaktadır.
- **İstatistik/Aggregation:** SQL tabanlı kümeleme sorguları ile doktor performans verileri çekilmektedir.
