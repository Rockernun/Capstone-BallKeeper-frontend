import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export const useNotification = () => {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!user) return;

    // SSE 연결 시작
    const eventSource = new EventSource(`http://localhost:8080/api/notifications/subscribe?userId=${user.id}`);

    // 연결 성공
    eventSource.onopen = () => {
      console.log("SSE Connected");
    };

    // 알림 수신 ('notification' 이벤트 이름은 백엔드와 일치해야 함)
    eventSource.addEventListener('notification', (event) => {
      const message = event.data;
      // 토스트 알림 띄우기
      toast(message, {
        duration: 5000,
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      });
    });

    // 에러 처리
    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      eventSource.close();
    };

    // 컴포넌트 언마운트 시 연결 종료 (Clean-up)
    return () => {
      eventSource.close();
    };
  }, [user]);
};

export default useNotification;