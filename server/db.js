import mysql from 'mysql2/promise';

// MySQL Workbench/Sunucu Bilgilerinizle Değiştirin
const dbConfig = {
    host: 'localhost', // MySQL Workbench genellikle yerel çalışır
    user: 'root',      // Varsayılan kullanıcı adı
    password: 'euzghe_77', // MySQL Workbench kurulumunda belirlediğiniz şifre
    database: 'seng429_db', // Henüz yoksa bile bu isimle bir veritabanı oluşturacağız
};

const pool = mysql.createPool(dbConfig);

// Bağlantıyı test etme fonksiyonu
async function testConnection() {
    try {
        await pool.getConnection();
        console.log('✅ MySQL Veritabanına Başarıyla Bağlanıldı!');
        // Eğer veritabanı (seng429_db) yoksa, bu aşamada oluşturabilirsiniz.

    } catch (error) {
        console.error('❌ MySQL Bağlantı Hatası:', error.message);
        // Hata durumunda Node.js uygulamasının sonlanması genellikle tercih edilir
        process.exit(1);
    }
}

testConnection();

export default pool;