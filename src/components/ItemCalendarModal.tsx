import React, { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ko } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import apiClient from '../api/client';
import { Modal } from './Modal';

// 한국어 로컬라이저 설정
const locales = {
  'ko': ko,
};
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type CalendarEvent = {
  id: number;
  title: string;
  start: Date;
  end: Date;
  status: string;
};

// react-big-calendar의 View 타입을 직접 가져오는 대신 로컬에 최소한의 유니언 타입 정의
type CalendarView = 'month' | 'week' | 'day' | 'agenda' | 'work_week';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  itemId: number | null;
  itemName: string;
};

export const ItemCalendarModal = ({ isOpen, onClose, itemId, itemName }: Props) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<CalendarView>('week'); // View 타입 사용
  const [date, setDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // 모달이 열리거나, 아이템/날짜/뷰가 변경될 때 데이터 갱신
  useEffect(() => {
    if (isOpen && itemId) {
      fetchEvents();
    }
  }, [isOpen, itemId, date, view]);

  const fetchEvents = async () => {
    if (!itemId) return;
    setIsLoading(true);
    
    const start = new Date(date);
    start.setDate(start.getDate() - 30);
    const end = new Date(date);
    end.setDate(end.getDate() + 30);

    try {
      const res = await apiClient.get(`/api/reservations/calendar`, {
        params: {
          itemId,
          start: start.toISOString().split('.')[0],
          end: end.toISOString().split('.')[0],
        }
      });

      const data = res as any; // apiClient 인터셉터로 인해 runtime에선 data만 반환되지만 타입은 AxiosResponse로 추론될 수 있어 any로 처리

      const parsedEvents = (data as any[]).map((evt: any) => ({
        ...evt,
        start: new Date(evt.start),
        end: new Date(evt.end),
        title: evt.status === 'PENDING' ? '⏳ 승인 대기' : '✅ 예약 완료',
      }));
      setEvents(parsedEvents);
    } catch (err) {
      console.error("캘린더 로딩 실패", err);
    } finally {
      setIsLoading(false);
    }
  };

  const eventPropGetter = (event: CalendarEvent) => {
    let backgroundColor = '#3b82f6';
    let borderLeft = '4px solid #1d4ed8';

    if (event.status === 'PENDING') {
      backgroundColor = '#f59e0b';
      borderLeft = '4px solid #b45309';
    }
    if (event.status === 'APPROVED') {
      backgroundColor = '#10b981';
      borderLeft = '4px solid #047857';
    }
    
    return { 
      style: { 
        backgroundColor,
        border: 'none',
        borderLeft, 
        borderRadius: '4px',
        color: 'white',
        fontSize: '0.85rem',
        fontWeight: '500',
        opacity: 0.9
      } 
    };
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`📅 ${itemName} 예약 현황`}>
      <div className="flex flex-col h-[550px]">
        
        {/* 범례 */}
        <div className="flex gap-4 mb-4 text-sm bg-gray-50 p-3 rounded-lg border border-gray-100">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
            <span className="text-gray-700 font-medium">예약 완료 (불가능)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-amber-500"></span>
            <span className="text-gray-700 font-medium">승인 대기 (불가능)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-white border border-gray-300"></span>
            <span className="text-gray-500">빈 공간 (예약 가능)</span>
          </div>
        </div>

        {/* 캘린더 */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-60 backdrop-blur-sm rounded-lg">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2"></div>
                <span className="text-sm text-indigo-600 font-semibold">일정을 불러오는 중...</span>
              </div>
            </div>
          )}

          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            style={{ height: '100%' }}
            view={view}
            onView={setView}
            date={date}
            onNavigate={setDate}
            culture="ko"
            messages={{
              next: "다음",
              previous: "이전",
              today: "오늘",
              month: "월간",
              week: "주간",
              day: "일간",
              noEventsInRange: "이 기간에는 예약이 없습니다.",
            }}
            eventPropGetter={eventPropGetter}
            defaultView="week"
            min={new Date(0, 0, 0, 8, 0, 0)}
            max={new Date(0, 0, 0, 22, 0, 0)}
          />
        </div>
      </div>
    </Modal>
  );
};