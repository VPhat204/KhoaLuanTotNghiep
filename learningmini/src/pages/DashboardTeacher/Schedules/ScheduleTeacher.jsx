import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ScheduleOutlined, PrinterOutlined } from '@ant-design/icons';
import './ScheduleTeacher.css';

const TeacherSchedule = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [scheduleData, setScheduleData] = useState({
    Sáng: Array(7).fill().map(() => [{ type: 'empty' }, { type: 'empty' }]),
    Chiều: Array(7).fill().map(() => [{ type: 'empty' }, { type: 'empty' }]),
    Tối: Array(7).fill().map(() => [{ type: 'empty' }, { type: 'empty' }])
  });
  const [loading, setLoading] = useState(false);
  const [teacherCourses, setTeacherCourses] = useState([]);

  const getWeekDates = useCallback((date) => {
    const startDate = new Date(date);
    const day = startDate.getDay();
    const diff = startDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate.setDate(diff);
    startDate.setHours(0, 0, 0, 0);

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);
      weekDates.push(currentDate);
    }
    return weekDates;
  }, []);

  const fetchTeacherCourses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/courses/mine",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTeacherCourses(res.data);
    } catch (err) {
      console.error('Error fetching teacher courses:', err);
    }
  }, []);

  const fetchTeacherSchedule = useCallback(async () => {
    const filterScheduleByTeacherCourses = (scheduleData) => {
      const teacherCourseIds = teacherCourses.map(course => course.id);
      const user = JSON.parse(localStorage.getItem("user"));
      const teacherId = user?.id;
      
      const filteredSchedule = {
        Sáng: Array(7).fill().map(() => []),
        Chiều: Array(7).fill().map(() => []),
        Tối: Array(7).fill().map(() => [])
      };

      Object.keys(scheduleData).forEach(period => {
        for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
          const daySlots = scheduleData[period][dayIndex];
          
          if (Array.isArray(daySlots)) {
            daySlots.forEach((slot, slotIndex) => {
              if (slot && slot.type !== 'empty' && slot.course_id) {
                if (teacherCourseIds.includes(slot.course_id) || slot.teacher_id === teacherId) {
                  if (!filteredSchedule[period][dayIndex][slotIndex]) {
                    filteredSchedule[period][dayIndex][slotIndex] = slot;
                  }
                } else {
                  filteredSchedule[period][dayIndex][slotIndex] = { type: 'empty' };
                }
              } else {
                filteredSchedule[period][dayIndex][slotIndex] = slot || { type: 'empty' };
              }
            });
          }
        }
      });

      return filteredSchedule;
    };

    const token = localStorage.getItem("token");  
    const dateString = currentDate.toISOString().split('T')[0];
    
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/schedule/week?date=${dateString}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const filteredSchedule = filterScheduleByTeacherCourses(res.data);
      setScheduleData(filteredSchedule);
      
    } catch (err) {
      console.log('Error fetching schedule:', err);
      setScheduleData({
        Sáng: Array(7).fill().map(() => [{ type: 'empty' }, { type: 'empty' }]),
        Chiều: Array(7).fill().map(() => [{ type: 'empty' }, { type: 'empty' }]),
        Tối: Array(7).fill().map(() => [{ type: 'empty' }, { type: 'empty' }])
      });
    } finally {
      setLoading(false);
    }
  }, [currentDate, teacherCourses]);

  useEffect(() => {
    fetchTeacherCourses();
  }, [fetchTeacherCourses]);

  useEffect(() => { 
    if (teacherCourses.length > 0) {
      fetchTeacherSchedule(); 
    }
  }, [fetchTeacherSchedule, teacherCourses]);

  const goToPreviousWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() - 7);
      return newDate;
    });
  };

  const goToNextWeek = () => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + 7);
      return newDate;
    });
  };

  const goToCurrentWeek = () => {
    setCurrentDate(new Date());
  };

  const DatePicker = () => {
    const [selectedDate, setSelectedDate] = useState(currentDate);
    
    const applyDate = () => {
      setCurrentDate(selectedDate);
      setShowDatePicker(false);
    };

    const cancelDate = () => {
      setShowDatePicker(false);
    };

    return (
      <div className="teacher-date-picker-overlay" onClick={cancelDate}>
        <div className="teacher-date-picker" onClick={(e) => e.stopPropagation()}>
          <h3>Chọn ngày</h3>
          <input 
            type="date" 
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="teacher-date-input"
          />
          <div className="teacher-date-picker-actions">
            <button onClick={cancelDate} className="teacher-cancel-btn">Hủy</button>
            <button onClick={applyDate} className="teacher-apply-btn">Áp dụng</button>
          </div>
        </div>
      </div>
    );
  };

  const weekDates = getWeekDates(currentDate);
  const weekDays = weekDates.map(date => ({
    day: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][date.getDay() - 1] || 'Chủ nhật',
    date: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
  }));

  const legendItems = [
    { type: 'theory', label: 'Lý thuyết', color: '#9E9E9E' },
    { type: 'practice', label: 'Thực hành', color: '#4CAF50' },
    { type: 'online', label: 'Trực tuyến', color: '#2196F3' },
    { type: 'exam', label: 'Lịch thi', color: '#FFEB3B' },
    { type: 'pause', label: 'Tạm ngưng', color: '#FF9800' }
  ];

  const renderCell = (daySlots, period, dayIndex) => {
    if (!Array.isArray(daySlots)) {
      daySlots = [{ type: 'empty' }, { type: 'empty' }];
    }

    return (
      <div className="teacher-slots-container">
        {daySlots.map((slot, slotIndex) => {
          if (!slot) {
            slot = { type: 'empty' };
          }

          if (slot.type === 'empty') {
            return (
              <div
                key={slotIndex}
                className="teacher-empty-slot"
              >
                <div className="teacher-empty-text">Trống</div>
                <span className="teacher-slot-number">Slot {slotIndex + 1}</span>
              </div>
            );
          }

          return (
            <div
              key={`schedule-${slot.schedule_id}-${slotIndex}`}
              className={`teacher-event-item ${slot.type}`}
            >
              <div className="teacher-event-top-bar">
                <div className="teacher-event-title">{slot.title}</div>
              </div>
              
              <div className="teacher-event-details">
                <div><strong>GV:</strong> {slot.teacher || 'Chưa có GV'}</div>
                <div><strong>Lớp:</strong> {slot.url || 'Chưa có lớp'}</div>
                <div><strong>Tiết:</strong> {slot.lesson || 'Chưa có tiết'}</div>
                <div><strong>Loại:</strong> 
                  {slot.type === 'theory' && ' Lý thuyết'}
                  {slot.type === 'practice' && ' Thực hành'}
                  {slot.type === 'online' && ' Trực tuyến'}
                  {slot.type === 'exam' && ' Lịch thi'}
                  {slot.type === 'pause' && ' Tạm ngưng'}
                  {!slot.type && ' Chưa xác định'}
                </div>
                <div><strong>Học viên:</strong> {slot.enrolled_count || 0}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="teacher-schedule-container">
      {loading && (
        <div className="teacher-loading-overlay">
          <div className="teacher-loading-spinner">Đang tải lịch dạy...</div>
        </div>
      )}
      
      <div className="teacher-schedule-section">
        <div className="teacher-schedule-header teacher-header">
          <div className="teacher-header-top">
            <h1>Lịch dạy của tôi</h1>
            <div className="teacher-header-actions">
              <button className="teacher-print-btn" onClick={() => window.print()}>
                <span><PrinterOutlined /></span>
                In lịch
              </button>
            </div>
          </div>
          
          <div className="teacher-header-info">
            <p className="teacher-courses-info">
              Đang hiển thị lịch dạy cho <strong>{teacherCourses.length}</strong> khóa học của bạn
            </p>
          </div>
          
          <div className="teacher-header-controls">
            <div className="teacher-date-controls">
              <div className="teacher-date-display" onClick={() => setShowDatePicker(true)}>
                <span className="teacher-calendar-icon"><ScheduleOutlined /></span>
                <span className="teacher-date-text">
                  {currentDate.getDate().toString().padStart(2, '0')}/{(currentDate.getMonth() + 1).toString().padStart(2, '0')}/{currentDate.getFullYear()}
                </span>
              </div>
              
              <div className="teacher-navigation-buttons">
                <button className="teacher-nav-btn" onClick={goToPreviousWeek}>Trở về</button>
                <button className="teacher-nav-btn teacher-nav-btn-current" onClick={goToCurrentWeek}>Hôm nay</button>
                <button className="teacher-nav-btn" onClick={goToNextWeek}>Tiếp</button>
              </div>
            </div>
          </div>

          {showDatePicker && <DatePicker />}
        </div>

        <div className="teacher-schedule-table-container">
          <table className="teacher-schedule-table">
            <thead>
              <tr>
                <th className="teacher-header-cell teacher-time-header">Ca học</th>
                {weekDays.map((day, index) => (
                  <th key={index} className="teacher-header-cell">
                    <div className="teacher-day">{day.day}</div>
                    <div className="teacher-date">{day.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['Sáng', 'Chiều', 'Tối'].map(period => (
                <tr key={period}>
                  <td className="teacher-time-period">{period}</td>
                  {scheduleData[period].map((daySlots, dayIndex) => (
                    <td 
                      key={dayIndex} 
                      className="teacher-time-slot teacher-multi-slot"
                    >
                      {renderCell(daySlots, period, dayIndex)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="teacher-schedule-legend">
          <h3>Chú thích</h3>
          <div className="teacher-legend-items">
            {legendItems.map((item, index) => (
              <div key={index} className="teacher-legend-item">
                <div className="teacher-legend-color" style={{ backgroundColor: item.color }}></div>
                <span className="teacher-legend-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherSchedule;