// src/pages/PatientPage.jsx
import { useState } from "react";
import "../styles/layout.css";

export default function PatientPage({ user, onLogout }) {
    const [activeSection, setActiveSection] = useState("profile");

    // === PROFİL STATE ==========================================================
    const [profile, setProfile] = useState({
        name: "Hasta Adı Soyadı",
        tc: "**************",
        gender: "Kadın",
        age: "28",
        height: "165 cm",
        weight: "58 kg",
        blood: "0 Rh+",
        allergy: "Bilinen alerji yok",
        illness: "Kronik hastalık yok",
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState(profile);

    const handleChange = (e) => {
        setEditData({ ...editData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        setProfile(editData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditData(profile);
        setIsEditing(false);
    };

    // === RANDEVU OLUŞTUR STATE =================================================
    const [appointment, setAppointment] = useState({
        clinic: "",
        date: "",
        time: "",
        reason: "",
    });

    // Backend yokken örnek randevular
    const [myAppointments] = useState([
        {
            id: 1,
            date: "2024-12-01",
            time: "10:30",
            clinic: "Kardiyoloji",
            status: "Tamamlandı",
        },
        {
            id: 2,
            date: "2024-12-10",
            time: "14:00",
            clinic: "Dahiliye",
            status: "Yaklaşan",
        },
    ]);

    // Basit form submit (şimdilik sadece console.log)
    const handleAppointmentSubmit = (e) => {
        e.preventDefault();
        if (!appointment.clinic || !appointment.date || !appointment.time) {
            alert("Lütfen poliklinik, tarih ve saat alanlarını doldurun.");
            return;
        }
        console.log("Yeni randevu isteği:", appointment);
        alert("Randevu isteğiniz örnek olarak kaydedildi (backend bağlanınca API'ye gidecek).");
    };

    return (
        <div className="app-layout">
            {/* =============== SIDEBAR =============== */}
            <aside className="app-sidebar">
                <div>
                    <h2 className="app-sidebar-title">Cankaya Hospital</h2>
                    <p className="app-sidebar-subtitle">
                        @{user?.username || "patient"} · patient
                    </p>

                    <div className="sidebar-buttons">
                        <button
                            className="sidebar-button"
                            style={{
                                background:
                                    activeSection === "profile" ? "#F2C94C" : "#3A3A3A",
                                color: activeSection === "profile" ? "#111" : "#fff",
                            }}
                            onClick={() => setActiveSection("profile")}
                        >
                            Profil
                        </button>

                        <button
                            className="sidebar-button"
                            style={{
                                background:
                                    activeSection === "create" ? "#F2C94C" : "#3A3A3A",
                                color: activeSection === "create" ? "#111" : "#fff",
                            }}
                            onClick={() => setActiveSection("create")}
                        >
                            Randevu Oluştur
                        </button>

                        <button
                            className="sidebar-button"
                            style={{
                                background:
                                    activeSection === "list" ? "#F2C94C" : "#3A3A3A",
                                color: activeSection === "list" ? "#111" : "#fff",
                            }}
                            onClick={() => setActiveSection("list")}
                        >
                            Randevularım
                        </button>

                        <button
                            className="sidebar-button"
                            style={{
                                background:
                                    activeSection === "history" ? "#F2C94C" : "#3A3A3A",
                                color: activeSection === "history" ? "#111" : "#fff",
                            }}
                            onClick={() => setActiveSection("history")}
                        >
                            Geçmişim
                        </button>
                    </div>
                </div>

                <button onClick={onLogout} className="logout-button">
                    Çıkış
                </button>
            </aside>

            {/* =============== ANA İÇERİK =============== */}
            <main className="app-main">
                {/* -------- PROFİL -------- */}
                {activeSection === "profile" && (
                    <div className="card">
                        <div className="profile-header">
                            <div className="profile-main">
                                <div className="profile-avatar">
                                    {profile.name.charAt(0)}
                                </div>
                                <div className="profile-name-block">
                                    <span className="profile-name">{profile.name}</span>
                                    <span className="profile-meta">
                                        TC Kimlik No: {profile.tc}
                                    </span>
                                    <span className="profile-meta">Rol: Hasta</span>
                                </div>
                            </div>

                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="profile-edit-button"
                                >
                                    Düzenle
                                </button>
                            )}
                        </div>

                        {/* Görüntüleme modu */}
                        {!isEditing && (
                            <div className="profile-grid">
                                <div className="profile-label">Kan Grubu</div>
                                <div className="profile-value">{profile.blood}</div>

                                <div className="profile-label">Cinsiyet</div>
                                <div className="profile-value">{profile.gender}</div>

                                <div className="profile-label">Yaş</div>
                                <div className="profile-value">{profile.age}</div>

                                <div className="profile-label">Boy</div>
                                <div className="profile-value">{profile.height}</div>

                                <div className="profile-label">Kilo</div>
                                <div className="profile-value">{profile.weight}</div>

                                <div className="profile-label">Alerjenler</div>
                                <div className="profile-value">{profile.allergy}</div>

                                <div className="profile-label">Hastalıklar</div>
                                <div className="profile-value">{profile.illness}</div>
                            </div>
                        )}

                        {/* Düzenleme modu */}
                        {isEditing && (
                            <div style={{ marginTop: "8px" }}>
                                <div className="form-field">
                                    <label>Ad Soyad</label>
                                    <input
                                        className="form-input"
                                        name="name"
                                        value={editData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Cinsiyet</label>
                                    <select
                                        className="form-input"
                                        name="gender"
                                        value={editData.gender}
                                        onChange={handleChange}
                                    >
                                        <option>Kadın</option>
                                        <option>Erkek</option>
                                        <option>Diğer</option>
                                    </select>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Yaş</label>
                                        <input
                                            className="form-input"
                                            name="age"
                                            value={editData.age}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Kan Grubu</label>
                                        <input
                                            className="form-input"
                                            name="blood"
                                            value={editData.blood}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-row">
                                    <div className="form-field">
                                        <label>Boy</label>
                                        <input
                                            className="form-input"
                                            name="height"
                                            value={editData.height}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label>Kilo</label>
                                        <input
                                            className="form-input"
                                            name="weight"
                                            value={editData.weight}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-field">
                                    <label>Alerjiler</label>
                                    <input
                                        className="form-input"
                                        name="allergy"
                                        value={editData.allergy}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Hastalıklar</label>
                                    <input
                                        className="form-input"
                                        name="illness"
                                        value={editData.illness}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="profile-form-actions">
                                    <button
                                        className="appointment-submit"
                                        style={{ flex: 1 }}
                                        onClick={handleSave}
                                    >
                                        Kaydet
                                    </button>

                                    <button
                                        className="modal-button modal-cancel"
                                        style={{ flex: 1 }}
                                        onClick={handleCancel}
                                    >
                                        İptal
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* -------- RANDEVU OLUŞTUR -------- */}
                {activeSection === "create" && (
                    <div className="card">
                        <h2>Randevu Oluştur</h2>

                        <form className="appointment-form" onSubmit={handleAppointmentSubmit}>
                            <div className="form-field">
                                <label>Poliklinik Seçin</label>
                                <select
                                    className="form-input"
                                    value={appointment.clinic}
                                    onChange={(e) =>
                                        setAppointment({
                                            ...appointment,
                                            clinic: e.target.value,
                                        })
                                    }
                                >
                                    <option value="">— Seç —</option>
                                    <option>Kardiyoloji</option>
                                    <option>Dermatoloji</option>
                                    <option>Dahiliye</option>
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-field">
                                    <label>Tarih</label>
                                    <input
                                        type="date"
                                        className="form-input"
                                        value={appointment.date}
                                        onChange={(e) =>
                                            setAppointment({
                                                ...appointment,
                                                date: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="form-field">
                                    <label>Saat</label>
                                    <input
                                        type="time"
                                        className="form-input"
                                        value={appointment.time}
                                        onChange={(e) =>
                                            setAppointment({
                                                ...appointment,
                                                time: e.target.value,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="form-field">
                                <label>Neden</label>
                                <input
                                    className="form-input"
                                    placeholder="Örn: Baş ağrısı, kontrol, tahlil sonucu vb."
                                    value={appointment.reason}
                                    onChange={(e) =>
                                        setAppointment({
                                            ...appointment,
                                            reason: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <button type="submit" className="appointment-submit">
                                Randevu Oluştur
                            </button>
                        </form>
                    </div>
                )}

                {/* -------- RANDEVULARIM -------- */}
                {activeSection === "list" && (
                    <div className="card">
                        <h2>Randevularım</h2>

                        {myAppointments.length === 0 ? (
                            <p>Henüz randevunuz bulunmamaktadır.</p>
                        ) : (
                            <table
                                className="patient-appointments-table"
                                style={{ marginTop: "10px" }}
                            >
                                <thead>
                                    <tr>
                                        <th>Tarih</th>
                                        <th>Saat</th>
                                        <th>Poliklinik</th>
                                        <th>Durum</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {myAppointments.map((a) => (
                                        <tr key={a.id}>
                                            <td>{a.date}</td>
                                            <td>{a.time}</td>
                                            <td>{a.clinic}</td>
                                            <td>
                                                <span
                                                    className={
                                                        "status-badge " +
                                                        (a.status === "Yaklaşan"
                                                            ? "status-muayene"
                                                            : a.status === "Tamamlandı"
                                                                ? "status-bekliyor"
                                                                : "status-gelmedi")
                                                    }
                                                >
                                                    {a.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* -------- GEÇMİŞ -------- */}
                {activeSection === "history" && (
                    <div className="card">
                        <h2>Geçmişim</h2>
                        <p>Geçmiş randevu ve işlemleriniz burada listelenecektir.</p>
                    </div>
                )}
            </main>
        </div>
    );
}
