import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';

// 데이터 타입 정의
type DashboardData = {
  pendingReservationCount: number;
  activeItemCount: number;
  totalUserCount: number;
  dailyStats: { date: string; count: number }[];
  popularItems: { itemName: string; count: number }[];
};

// 파이 차트 색상
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export function DashboardTab() {
  const user = useAuthStore((state) => state.user);
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const res = await apiClient.get<DashboardData>(`/api/admin/dashboard?adminId=${user.id}`);
        setData(res);
      } catch (err: any) {
        setError(`데이터 로딩 실패: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (isLoading) return <div className="text-center py-10">대시보드 로딩 중...</div>;
  if (error) return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!data) return null;

  return (
    <div className="space-y-8">
      {/* KPI 카드 섹션 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-yellow-400">
          <h3 className="text-gray-500 text-sm font-bold uppercase">승인 대기 예약</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{data.pendingReservationCount}건</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-green-400">
          <h3 className="text-gray-500 text-sm font-bold uppercase">활성 물품 수</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{data.activeItemCount}개</p>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md border-l-4 border-blue-400">
          <h3 className="text-gray-500 text-sm font-bold uppercase">전체 회원 수</h3>
          <p className="text-3xl font-bold text-gray-800 mt-2">{data.totalUserCount}명</p>
        </div>
      </div>

      {/* 차트 섹션 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* 일별 예약 현황 (Bar Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4">📅 지난 7일간 예약 추이</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" name="예약 수" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 인기 물품 (Pie Chart) */}
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-bold text-gray-800 mb-4">🔥 인기 물품 Top 5</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.popularItems}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="itemName"
                >
                  {data.popularItems.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
}