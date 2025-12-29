import { useEffect, useState } from "react";
import { getDoctorPerformance } from "../../services/api";
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend
} from "recharts";

const COLORS = ["#00C49F", "#FF4D4F", "#FFBB28"]; // Tamamlanan, İptal, Diğer

export default function DoctorPerformancePage() {
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);

  useEffect(() => {
    getDoctorPerformance()
      .then(res => {
        setDoctors(res.data);
        setFilteredDoctors(res.data);
      })
      .catch(err => console.error("Veri hatası:", err))
      .finally(() => setLoading(false));
  }, []);

  // 🔍 Arama Fonksiyonu
  useEffect(() => {
    const results = doctors.filter(doc =>
      doc.doctor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDoctors(results);
  }, [searchTerm, doctors]);

  if (loading) return <p style={{ padding: "20px" }}>Analiz ediliyor...</p>;

  return (
    <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
      <h2>📊 Stratejik Doktor Performans Paneli</h2>

      {/* 🔍 Arama Çubuğu */}
      <div style={{ marginBottom: "10px" }}>
        <input
          type="text"
          placeholder="Doktor adı veya poliklinik ara..."
          style={{ padding: "10px", width: "100%", maxWidth: "400px", borderRadius: "8px", border: "1px solid #ccc" }}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>

        {/* 📋 Tablo Alanı */}
        <div style={{ flex: 2, minWidth: "600px" }}>
          <table border="1" cellPadding="10" width="100%" style={{ borderCollapse: "collapse", backgroundColor: "white" }}>
            <thead style={{ backgroundColor: "#f8f9fa" }}>
              <tr>
                <th>Doktor</th>
                <th>Poliklinik</th>
                <th>Skor (0-100)</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredDoctors.map(d => (
                <tr key={d.id}
                    onClick={() => setSelectedDoc(d)}
                    style={{ cursor: "pointer", backgroundColor: selectedDoc?.id === d.id ? "#e3f2fd" : "transparent" }}>
                  <td>{d.doctor}</td>
                  <td>{d.specialization}</td>
                  <td style={{ textAlign: "center", fontWeight: "bold", color: d.score > 70 ? "green" : "red" }}>
                    {d.score}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    {d.status === "high" ? "🟢 Yüksek" : d.status === "risk" ? "🔴 Riskli" : "🟡 Normal"}
                  </td>
                  <td><button onClick={() => setSelectedDoc(d)}>Grafik Gör</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 🧠 Detay ve PieChart Alanı */}
        <div style={{ flex: 1, minWidth: "300px", border: "1px solid #ddd", padding: "20px", borderRadius: "10px", backgroundColor: "#fff" }}>
          {selectedDoc ? (
            <div style={{ textAlign: "center" }}>
              <h3>{selectedDoc.doctor}</h3>
              <p>{selectedDoc.specialization}</p>

              <div style={{ height: "250px", width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Tamamlanan", value: selectedDoc.completionRate },
                        { name: "İptal", value: selectedDoc.cancelRate },
                        { name: "Boş/Diğer", value: 100 - (selectedDoc.completionRate + selectedDoc.cancelRate) }
                      ]}
                      cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value"
                    >
                      {COLORS.map((color, index) => <Cell key={`cell-${index}`} fill={color} />)}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ marginTop: "10px" }}>
                <p><strong>Genel Skor:</strong> {selectedDoc.score} / 100</p>
                {selectedDoc.score >= 80 && <p style={{ color: "green" }}>⭐ <b>Öneri:</b> Performans mükemmel. Ek slot açılabilir.</p>}
                {selectedDoc.score < 50 && <p style={{ color: "red" }}>⚠️ <b>Öneri:</b> İptal oranı yüksek. Verimlilik takibi başlatılmalı.</p>}
              </div>
            </div>
          ) : (
            <p style={{ color: "#666", textAlign: "center", marginTop: "50px" }}>Detayları görmek için tablodan bir doktor seçin.</p>
          )}
        </div>
      </div>
    </div>
  );
}