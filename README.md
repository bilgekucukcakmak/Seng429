Cankaya Hospital Management System (MERN Stack)
SENG 429 - Enterprise Application Fundamentals dersi kapsamında geliştirilmiş, hastane randevu ve yönetim süreçlerini dijitalleştiren tam kapsamlı bir kurumsal web uygulamasıdır.

 Proje Hakkında
Bu uygulama; yönetici (Admin), doktor ve hasta rollerine sahip kullanıcıların hastane süreçlerini yönetmesini sağlar. Admin kullanıcılar sistemdeki tüm veri trafiğini (doktor/hasta ekleme, raporlama) yönetirken, doktorlar randevularını takip edebilir, hastalar ise online randevu alabilir.

🛠️ Kullanılan Teknolojiler
Frontend: React.js, React Router, Recharts (İstatistikler), Axios.

Backend: Node.js, Express.js.

Veritabanı: MongoDB & Mongoose.

Kimlik Doğrulama: JWT (JSON Web Token).

Stil: Custom CSS3 (Responsive Design).

Gereksinim Karşılama 

En az 5 Entity		User, Doctor, Patient, Appointment, Specialization.
Composite Relationship	Appointment nesnesi hem Doctor hem de Patient referanslarını içerir.
CRUD İşlemleri		Doktor, Hasta ve Randevu yönetimi için tam CRUD desteği.
Aggregation & Filter	Branş bazlı randevu sayıları ve periyodik (Günlük/Haftalık/Aylık) istatistik raporları.
RESTful API		/api/admin, /api/auth, /api/appointments gibi modüler rotalar.
Role-Based Auth		Admin, Doktor ve Hasta rolleri için farklılaştırılmış yetkilendirme.


Proje Mimarisi
Plaintext
/Seng429
├── /server             # Node.js & Express Backend
│   ├── /controllers    # İş mantığı (Admin, Doctor, Appointment)
│   ├── /middleware     # Auth & Error Handling
│   ├── /models         # Mongoose Şemaları (User, Appointment, vb.)
│   └── /routes         # API Endpoint tanımları
├── /src                # React Frontend
│   ├── /pages          # AdminPage, LoginPage, DoctorPage, PatientPage
│   ├── /services       # API (Axios) bağlantıları
│   └── /styles         # Layout ve Bileşen stilleri
└── package.json        # Bağımlılıklar ve Scriptler

Kurulum ve Çalıştırma
1. Depoyu Klonlayın

Bash
git clone <https://github.com/bilgekucukcakmak/Seng429>
cd Seng429


2. Backend Kurulumu
cd server

Bash
npm install
.env dosyanızı oluşturun:

Kod snippet'i
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sifrem
DB_NAME=SENG429_db

Bash
npm start


3. Frontend Kurulumu
Ana klasöre dönün ve bağımlılıkları yükleyin:

Bash
npm install
React uygulamasını başlatın:

Bash
npm run dev

 Özellikler
Dinamik Raporlama: Recharts kütüphanesi ile branş ve doktor bazlı randevu analizi.

Poliklinik Yönetimi: Sarı buton detay modalı ile branşlardaki aktif doktorları görüntüleme.

Randevu Takvimi: Haftalık/Aylık periyotlarda randevu yoğunluk takibi.

Kullanıcı Yönetimi: Admin panelinden rol bazlı kullanıcı ekleme, silme ve güncelleme.

Notlar

Uygulama varsayılan olarak http://localhost:5173 (Vite) adresinde çalışır.

API istekleri http://localhost:5001/api adresine yönlendirilir.

"MySQL kullanılmıştır, lütfen ekteki SQL dosyasını import edin"