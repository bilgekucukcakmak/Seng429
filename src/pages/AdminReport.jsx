import React, { useState, useEffect } from 'react';
// Recharts bileşenlerini import ediyoruz
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { getAppointmentStats } from '../services/api'; // api.js'ye bu fonksiyonu ekleyeceğiz

const AdminReports = () => {
    const [data, setData] = useState([]);
    const [period, setPeriod] = useState('month'); // 'day', 'week', 'month'

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // Seçilen periyoda göre veriyi çekiyoruz
                const response = await getAppointmentStats(period);
                setData(response.data);
            } catch (error) {
                console.error("İstatistikler çekilemedi:", error);
            }
        };
        fetchStats();
    }, [period]);

    return (
        <div style={{ padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h3>Bölüm Bazlı Randevu Dağılımı</h3>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    style={{ padding: '5px', borderRadius: '4px' }}
                >
                    <option value="day">Bugün</option>
                    <option value="week">Bu Hafta</option>
                    <option value="month">Bu Ay</option>
                </select>
            </div>

            {/* Grafiğin Duyarlı Olması İçin ResponsiveContainer Kullanıyoruz */}
            <div style={{ width: '100%', height: 400 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="departmentName" /> {/* Backend'den gelen bölüm adı */}
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" name="Randevu Sayısı" fill="#f1c40f" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

