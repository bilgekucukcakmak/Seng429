import { useEffect, useState } from "react";
import "../styles/layout.css";
import { getDoctorTodayAppointments } from "../services/api";

export default function DoctorPage({ user, onLogout }) {
 
    const [appointments, setAppointments] = useState([
        {
            id: 1,
            time: "10:30",
            patientName: "Örnek Hasta",
            reason: "Baş ağrısı",
            status: "Bekliyor",
        },
    ]);
    const [loading, setLoading] = useState(false);

  
    const [activeSection, setActiveSection] = useState("panel");

   
    const [searchTc, setSearchTc] = useState("");
    const [patientInfo, setPatientInfo] = useState(null);
    const [patientError, setPatientError] = useState("");

  
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [noteText, setNoteText] = useState("");
    const [showModal, setShowModal] = useState(false);

    
    useEffect(() => {
        async function fetchAppointments() {
            try {
                setLoading(true);
                const data = await getDoctorTodayAppointments(
                    user.id || user.username
                );

                if (Array.isArray(data) && data.length > 0) {
                    const withStatus = data.map((a) => ({
                        ...a,
                        status: a.status || "Bekliyor",
                    }));
                    setAppointments(withStatus);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }

        fetchAppointments();
    }, [user]);

    const sectionButtonClass = (section) =>
        "sidebar-button" +
        (activeSection === section ? " sidebar-button-active" : "");

    function handleSearchTc(e) {
        e.preventDefault();
        setPatientError("");
        setPatientInfo(null);

        const trimmed = searchTc.trim();
        if (!trimmed) {
            setPatientError("Lütfen TC Kimlik No girin.");
            return;
        }

        
        const MOCK_PATIENTS = [
            {
                tc: "11111111111",
                fullName: "Örnek Hasta",
                bloodType: "A Rh+",
                gender: "Kadın",
                age: 29,
                height: 165,
                weight: 56,
                allergies: "Penisilin",
                diseases: "Astım",
            },
        ];

        const found = MOCK_PATIENTS.find((p) => p.tc === trimmed);

        if (!found) {
            setPatientError("Bu TC kimlik numarasına ait hasta bulunamadı.");
            return;
        }

        setPatientInfo(found);
    }

   
    function getStatusClass(status) {
        switch (status) {
            case "Muayene Edildi":
                return "status-badge status-muayene";
            case "Gelmedi":
                return "status-badge status-gelmedi";
            default:
                return "status-badge status-bekliyor";
        }
    }

  
    function openDetails(appointment) {
        setSelectedAppointment(appointment);
        setNoteText(appointment.note || "");
        setShowModal(true);
    }

    function closeModal() {
        setShowModal(false);
        setSelectedAppointment(null);
        setNoteText("");
    }


    function handleSaveNote() {
        if (!selectedAppointment) return;

        setAppointments((prev) =>
            prev.map((a) =>
                a.id === selectedAppointment.id
                    ? {
                        ...a,
                        status: selectedAppointment.status,
                        note: noteText,
                    }
                    : a
            )
        );

        alert(
            "Muayene notu ve durumu şu anda sadece frontend tarafında tutuluyor. Backend bağlanınca kalıcı olarak kaydedilecek."
        );

        closeModal();
    }

    return (
        <div className="app-layout">
            {/* SOL: SIDEBAR */}
            <aside className="app-sidebar">
                <div>
                    <h2 className="app-sidebar-title">Cankaya Hospital</h2>
                    <p className="app-sidebar-subtitle">@{user.username} · doctor</p>

                    <div className="sidebar-buttons">
                        {/* HASTA SORGULA */}
                        <button
                            className={sectionButtonClass("search")}
                            onClick={() => setActiveSection("search")}
                        >
                            Hasta Sorgula
                        </button>

                        {activeSection === "search" && (
                            <form className="search-form" onSubmit={handleSearchTc}>
                                <input
                                    type="text"
                                    placeholder="TC Kimlik No"
                                    value={searchTc}
                                    onChange={(e) => setSearchTc(e.target.value)}
                                    className="search-input"
                                />
                                <button type="submit" className="search-button">
                                    Ara
                                </button>
                            </form>
                        )}

                        {/* DOKTOR PANELİ */}
                        <button
                            className={sectionButtonClass("panel")}
                            onClick={() => setActiveSection("panel")}
                            style={{ marginTop: "8px" }}
                        >
                            Doktor Paneli
                        </button>
                    </div>
                </div>

                <button onClick={onLogout} className="logout-button">
                    Çıkış
                </button>
            </aside>

            {/* SAĞ: BODY */}
            <main className="app-main">
                {/* --- HASTA SORGULA: HASTA BİLGİLERİ --- */}
                {activeSection === "search" && (
                    <div className="card">
                        <h2>Hasta Bilgileri</h2>

                        {patientError && (
                            <p style={{ color: "red", marginTop: "8px" }}>{patientError}</p>
                        )}

                        {!patientInfo && !patientError && (
                            <p style={{ fontSize: "14px", color: "#555", marginTop: "8px" }}>
                                Lütfen sol taraftan TC Kimlik No girerek bir hasta arayın.
                            </p>
                        )}

                        {patientInfo && (
                            <div style={{ marginTop: "12px" }}>
                                <table
                                    style={{
                                        borderCollapse: "collapse",
                                        fontSize: "14px",
                                        color: "#555",
                                    }}
                                >
                                    <tbody>
                                        <tr>
                                            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600 }}>
                                                Ad Soyad
                                            </td>
                                            <td style={{ padding: "4px 0" }}>
                                                {patientInfo.fullName}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600 }}>
                                                TC Kimlik No
                                            </td>
                                            <td style={{ padding: "4px 0" }}>{patientInfo.tc}</td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600 }}>
                                                Kan Grubu
                                            </td>
                                            <td style={{ padding: "4px 0" }}>
                                                {patientInfo.bloodType || "Bilinmiyor"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600 }}>
                                                Cinsiyet
                                            </td>
                                            <td style={{ padding: "4px 0" }}>
                                                {patientInfo.gender || "Bilinmiyor"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600 }}>
                                                Yaş
                                            </td>
                                            <td style={{ padding: "4px 0" }}>
                                                {patientInfo.age
                                                    ? `${patientInfo.age} yaş`
                                                    : "Bilinmiyor"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600 }}>
                                                Boy
                                            </td>
                                            <td style={{ padding: "4px 0" }}>
                                                {patientInfo.height
                                                    ? `${patientInfo.height} cm`
                                                    : "Bilinmiyor"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600 }}>
                                                Kilo
                                            </td>
                                            <td style={{ padding: "4px 0" }}>
                                                {patientInfo.weight
                                                    ? `${patientInfo.weight} kg`
                                                    : "Bilinmiyor"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600 }}>
                                                Alerjiler
                                            </td>
                                            <td style={{ padding: "4px 0" }}>
                                                {patientInfo.allergies || "Yok / Bilinmiyor"}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td style={{ padding: "4px 12px 4px 0", fontWeight: 600 }}>
                                                Mevcut Hastalıklar
                                            </td>
                                            <td style={{ padding: "4px 0" }}>
                                                {patientInfo.diseases || "Yok / Bilinmiyor"}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* --- DOKTOR PANELİ: BUGÜNÜN RANDEVULARI --- */}
                {activeSection === "panel" && (
                    <>
                        <h1 style={{ fontSize: "24px", marginBottom: "16px" }}>
                            Bugünün Randevuları
                        </h1>

                        <div className="card">
                            {loading ? (
                                <p>Yükleniyor...</p>
                            ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                                    <thead>
                                        <tr
                                            style={{
                                                textAlign: "left",
                                                fontSize: "14px",
                                                color: "#6b7280",
                                            }}
                                        >
                                            <th>Saat</th>
                                            <th>Hasta Adı</th>
                                            <th>Neden</th>
                                            <th>Durum</th>
                                            <th></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {appointments.map((a) =>
                                            a ? (
                                                <tr key={a.id}>
                                                    <td>{a.time}</td>
                                                    <td>{a.patientName}</td>
                                                    <td>{a.reason}</td>
                                                    <td>
                                                        <span className={getStatusClass(a.status)}>
                                                            {a.status}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button
                                                            type="button"
                                                            className="action-button action-secondary"
                                                            onClick={() => openDetails(a)}
                                                        >
                                                            Detay
                                                        </button>
                                                    </td>
                                                </tr>
                                            ) : null
                                        )}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Randevu Detayı Modalı */}
                        {showModal && selectedAppointment && (
                            <div className="modal-backdrop">
                                <div className="modal-card">
                                    <h3 style={{ marginTop: 0 }}>Randevu Detayı</h3>
                                    <p style={{ fontSize: "14px", color: "#555" }}>
                                        <strong>Hasta:</strong> {selectedAppointment.patientName}
                                        <br />
                                        <strong>Saat:</strong> {selectedAppointment.time}
                                        <br />
                                        <strong>Neden:</strong> {selectedAppointment.reason}
                                    </p>

                                    {/* DURUM SEÇİMİ */}
                                    <label
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            marginTop: "8px",
                                            display: "block",
                                        }}
                                    >
                                        Durum
                                    </label>
                                    <select
                                        value={selectedAppointment.status}
                                        onChange={(e) =>
                                            setSelectedAppointment({
                                                ...selectedAppointment,
                                                status: e.target.value,
                                            })
                                        }
                                        style={{
                                            width: "100%",
                                            padding: "8px",
                                            marginTop: "4px",
                                            borderRadius: "8px",
                                            border: "1px solid #d1d5db",
                                        }}
                                    >
                                        <option value="Bekliyor">Bekliyor</option>
                                        <option value="Muayene Edildi">Muayene Edildi</option>
                                        <option value="Gelmedi">Gelmedi</option>
                                    </select>

                                    {/* NOT ALANI */}
                                    <label
                                        style={{
                                            fontSize: "14px",
                                            fontWeight: 600,
                                            marginTop: "12px",
                                            display: "block",
                                        }}
                                    >
                                        Muayene Notu
                                    </label>
                                    <textarea
                                        value={noteText}
                                        onChange={(e) => setNoteText(e.target.value)}
                                        rows={4}
                                        style={{
                                            width: "100%",
                                            marginTop: "4px",
                                            padding: "8px",
                                            borderRadius: "8px",
                                            border: "1px solid #d1d5db",
                                            resize: "vertical",
                                            fontSize: "14px",
                                        }}
                                        placeholder="Tanı, öneriler, tetkikler vb."
                                    />

                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "flex-end",
                                            gap: "8px",
                                            marginTop: "12px",
                                        }}
                                    >
                                        <button
                                            type="button"
                                            className="modal-button modal-cancel"
                                            onClick={closeModal}
                                        >
                                            Kapat
                                        </button>
                                        <button
                                            type="button"
                                            className="modal-button modal-save"
                                            onClick={handleSaveNote}
                                        >
                                            Kaydet
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
        </div>
    );
}
