import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';
import { Modal } from '../components/Modal';

// 타입 정의
type User = {
  id: number;
  name: string;
  email: string;
  admin: boolean;
};

type Reservation = {
  id: number;
  itemName: string;
  startTime: string;
  endTime: string;
  status: string;
};

const formatDateTime = (dateTimeString: string) => {
    try {
        return new Date(dateTimeString).toLocaleString('ko-KR', {
            month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
        });
    } catch { return dateTimeString; }
};

export function UserManagementTab() {
  const currentUser = useAuthStore((state) => state.user);
  
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // 모달 상태
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userReservations, setUserReservations] = useState<Reservation[]>([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);

  // 사용자 목록 불러오기
  const fetchUsers = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const data = await apiClient.get<User[]>(`/api/admin/users?adminId=${currentUser.id}`);
      setUsers(data);
    } catch (err: any) {
      alert(`사용자 목록 로딩 실패: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // 관리자 권한 토글
  const handleToggleAdmin = async (targetUser: User) => {
    if (!currentUser) return;
    if (!window.confirm(`${targetUser.name}님의 권한을 변경하시겠습니까?`)) return;

    try {
      await apiClient.patch(`/api/admin/users/${targetUser.id}/role?adminId=${currentUser.id}`);
      // 목록 새로고침 없이 로컬 상태 업데이트 (빠른 반응성)
      setUsers(users.map(u => u.id === targetUser.id ? { ...u, admin: !u.admin } : u));
    } catch (err: any) {
      alert(`권한 변경 실패: ${err.message}`);
    }
  };

  // 사용자 예약 내역 보기 (모달 열기)
  const handleViewHistory = async (targetUser: User) => {
    if (!currentUser) return;
    setSelectedUser(targetUser);
    setIsHistoryLoading(true);
    setUserReservations([]);

    try {
      const data = await apiClient.get<Reservation[]>(`/api/admin/users/${targetUser.id}/reservations?adminId=${currentUser.id}`);
      setUserReservations(data);
    } catch (err: any) {
      alert(`예약 내역 로딩 실패: ${err.message}`);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  return (
    <>
      {/* 사용자 목록 테이블 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-gray-300 text-gray-600">
              <th className="py-3 px-2">ID</th>
              <th className="py-3 px-2">이름</th>
              <th className="py-3 px-2">이메일</th>
              <th className="py-3 px-2 text-center">권한</th>
              <th className="py-3 px-2 text-right">관리</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 text-gray-500">#{user.id}</td>
                <td className="py-3 px-2 font-medium">{user.name}</td>
                <td className="py-3 px-2 text-gray-600 text-sm">{user.email}</td>
                <td className="py-3 px-2 text-center">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${user.admin ? 'bg-purple-100 text-purple-700' : 'bg-gray-200 text-gray-600'}`}>
                    {user.admin ? 'ADMIN' : 'USER'}
                  </span>
                </td>
                <td className="py-3 px-2 text-right space-x-2">
                  <button 
                    onClick={() => handleViewHistory(user)}
                    className="text-sm text-indigo-600 hover:underline"
                  >
                    내역 보기
                  </button>
                  {user.id !== currentUser?.id && (
                    <button 
                      onClick={() => handleToggleAdmin(user)}
                      className="text-sm text-red-500 hover:underline"
                    >
                      {user.admin ? '권한 해제' : '관리자 지정'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {isLoading && <p className="text-center text-gray-500 mt-4">로딩 중...</p>}
      </div>

      {/* 예약 내역 모달 */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`${selectedUser?.name}님의 예약 내역`}
      >
        <div className="max-h-96 overflow-y-auto pr-2">
            {isHistoryLoading ? (
                <p className="text-center text-gray-500">내역을 불러오는 중...</p>
            ) : userReservations.length === 0 ? (
                <p className="text-center text-gray-500">예약 내역이 없습니다.</p>
            ) : (
                <div className="space-y-3">
                    {userReservations.map(res => (
                        <div key={res.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">
                            <div className="flex justify-between mb-1">
                                <span className="font-bold text-gray-800">{res.itemName}</span>
                                <span className={`text-xs font-bold ${res.status === 'APPROVED' ? 'text-green-600' : res.status === 'CANCELLED' ? 'text-gray-400' : 'text-yellow-600'}`}>
                                    {res.status}
                                </span>
                            </div>
                            <div className="text-gray-600">
                                {formatDateTime(res.startTime)} ~ {formatDateTime(res.endTime)}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
      </Modal>
    </>
  );
}

// 기본(default) 내보내기: AdminPage에서 기본 import를 사용하므로 추가합니다.
export default UserManagementTab;