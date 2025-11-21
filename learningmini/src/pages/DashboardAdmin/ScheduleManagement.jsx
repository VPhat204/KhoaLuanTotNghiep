import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { PrinterOutlined, ScheduleOutlined, EditOutlined, SaveOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import './Schedule.css';

const ScheduleWithCourses = () => {
  const [activeFilter, setActiveFilter] = useState('Tất cả');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [courses, setCourses] = useState([]);
  const [scheduleData, setScheduleData] = useState({
    Sáng: Array(7).fill().map(() => [{ type: 'empty' }, { type: 'empty' }]),
    Chiều: Array(7).fill().map(() => [{ type: 'empty' }, { type: 'empty' }]),
    Tối: Array(7).fill().map(() => [{ type: 'empty' }, { type: 'empty' }])
  });
  const [loading, setLoading] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [editForm, setEditForm] = useState({
    url: '',
    lesson: '',
    type: 'theory'
  });
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState({ period: '', dayIndex: -1, slotIndex: -1 });

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

  const fetchSchedule = useCallback(async () => {
    const token = localStorage.getItem("token");  
    const dateString = currentDate.toISOString().split('T')[0];
    
    try {
      setLoading(true);
      const res = await axios.get(
        `http://localhost:5000/api/schedule/week?date=${dateString}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setScheduleData(res.data);
      
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
  }, [currentDate]);

  const fetchCourses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setCourses(res.data);
      
    } catch (err) { 
      console.error('Error fetching courses:', err); 
    }
  }, []);

  useEffect(() => { 
    fetchSchedule(); 
  }, [fetchSchedule]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleEditCourse = async (slot, period, dayIndex, slotIndex) => {
    if (!slot.schedule_id) return;
    
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `http://localhost:5000/api/schedules/${slot.schedule_id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const latestSchedule = response.data;
      
      setEditingCourse(slot.schedule_id);
      setEditForm({
        url: latestSchedule.url || '',
        lesson: latestSchedule.lesson || '',
        type: latestSchedule.type || 'theory'
      });
    } catch (err) {
      console.error('Error fetching schedule details:', err);
      setEditingCourse(slot.schedule_id);
      setEditForm({
        url: slot.url || '',
        lesson: slot.lesson || '',
        type: slot.type || 'theory'
      });
    }
  };

  const handleSaveEdit = async (scheduleId) => {
    if (!editForm.url.trim()) {
      alert('Vui lòng nhập lớp học');
      return;
    }

    if (!editForm.lesson.trim()) {
      alert('Vui lòng nhập tiết học');
      return;
    }

    try {
      const token = localStorage.getItem("token");
      setLoading(true);

      await axios.put(
        `http://localhost:5000/api/schedules/${scheduleId}`,
        {
          url: editForm.url,
          lesson: editForm.lesson,
          type: editForm.type
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          } 
        }
      );

      await fetchSchedule();

      setEditingCourse(null);
      alert('Cập nhật thành công!');

    } catch (err) {
      console.error('Error updating schedule:', err);
      alert('Lỗi khi cập nhật: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCourse(null);
    setEditForm({
      url: '',
      lesson: '',
      type: 'theory'
    });
  };

  const handleRemoveSchedule = async (scheduleId, period, dayIndex, slotIndex) => {
    if (!scheduleId || !window.confirm('Bạn có chắc muốn xóa lịch học này?')) return;

    try {
      const token = localStorage.getItem("token");
      setLoading(true);

      await axios.delete(
        `http://localhost:5000/api/schedules/${scheduleId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchSchedule();

    } catch (err) {
      console.error('Error removing schedule:', err);
      alert('Lỗi khi xóa lịch học');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCourseClick = (period, dayIndex, slotIndex) => {
    setSelectedSlot({ period, dayIndex, slotIndex });
    setShowCourseModal(true);
  };

  const handleSelectCourse = async (course) => {
    if (!selectedSlot.period || selectedSlot.dayIndex === -1 || selectedSlot.slotIndex === -1) return;

    const { period, dayIndex, slotIndex } = selectedSlot;
    const weekDates = getWeekDates(currentDate);
    const date = weekDates[parseInt(dayIndex)];
    
    const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
    const dateString = localDate.toISOString().split('T')[0];
    
    try {
      const token = localStorage.getItem("token");
      setLoading(true);

      await axios.post(
        "http://localhost:5000/api/schedule/assign",
        {
          course_id: course.id,
          date: dateString,
          period: period,
          lesson: course.lesson || `Tiết ${course.lessons || 1}`,
          type: course.type || 'theory',
          order_index: slotIndex
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchSchedule();

      setShowCourseModal(false);
      setSelectedSlot({ period: '', dayIndex: -1, slotIndex: -1 });
      alert('Đã thêm khóa học vào lịch thành công!');

    } catch (err) {
      console.error('Error assigning course to schedule:', err);
      alert('Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

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

  const weekDates = getWeekDates(currentDate);
  const weekDays = weekDates.map(date => ({
    day: ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][date.getDay() - 1] || 'Chủ nhật',
    date: `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`
  }));

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
      <div className="date-picker-overlay" onClick={cancelDate}>
        <div className="date-picker" onClick={(e) => e.stopPropagation()}>
          <h3>Chọn ngày</h3>
          <input 
            type="date" 
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="date-input"
          />
          <div className="date-picker-actions">
            <button onClick={cancelDate} className="cancel-btn">Hủy</button>
            <button onClick={applyDate} className="apply-btn">Áp dụng</button>
          </div>
        </div>
      </div>
    );
  };

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
      <div className="slots-container">
        {daySlots.map((slot, slotIndex) => {
          if (!slot) {
            slot = { type: 'empty' };
          }

          const isEditing = editingCourse === slot.schedule_id;

          if (slot.type === 'empty') {
            return (
              <div
                key={slotIndex}
                className="empty-slot"
                onClick={() => handleAddCourseClick(period, dayIndex, slotIndex)}
              >
                <div className="empty-icon"><PlusOutlined /></div>
                <span>Click để thêm khóa học</span>
                <span className="slot-number">Slot {slotIndex + 1}</span>
              </div>
            );
          }

          return (
            <div
              key={`schedule-${slot.schedule_id}-${slotIndex}`}
              className={`event-item ${slot.type} ${isEditing ? 'editing' : ''}`}
            >
              <div className="event-top-bar">
                <div className="event-title">{slot.title}</div>
                <div className="event-actions">
                  {!isEditing ? (
                    <button 
                      className="edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCourse(slot, period, dayIndex, slotIndex);
                      }}
                      title="Chỉnh sửa"
                    >
                      <EditOutlined />
                    </button>
                  ) : (
                    <>
                      <button 
                        className="save-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSaveEdit(slot.schedule_id);
                        }}
                        title="Lưu"
                      >
                        <SaveOutlined />
                      </button>
                      <button 
                        className="cancel-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCancelEdit();
                        }}
                        title="Hủy"
                      >
                        <CloseOutlined />
                      </button>
                    </>
                  )}
                  <button 
                    className="remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveSchedule(slot.schedule_id, period, dayIndex, slotIndex);
                    }}
                    title="Xóa lịch học"
                  >
                    ×
                  </button>
                </div>
              </div>
              
              {isEditing ? (
                <div className="edit-form">
                  <div className="form-group">
                    <label>Lớp học:</label>
                    <input 
                      type="text" 
                      value={editForm.url}
                      onChange={(e) => setEditForm(prev => ({...prev, url: e.target.value}))}
                      placeholder="Nhập lớp học"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tiết học:</label>
                    <input 
                      type="text" 
                      value={editForm.lesson}
                      onChange={(e) => setEditForm(prev => ({...prev, lesson: e.target.value}))}
                      placeholder="Nhập tiết học"
                    />
                  </div>
                  <div className="form-group">
                    <label>Loại lớp:</label>
                    <select 
                      value={editForm.type}
                      onChange={(e) => setEditForm(prev => ({...prev, type: e.target.value}))}
                    >
                      <option value="theory">Lý thuyết</option>
                      <option value="practice">Thực hành</option>
                      <option value="online">Trực tuyến</option>
                      <option value="exam">Thi</option>
                      <option value="pause">Tạm ngưng</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="event-details">
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
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const CourseSelectionModal = () => {
    if (!showCourseModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowCourseModal(false)}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>Chọn khóa học</h3>
            <button className="close-btn" onClick={() => setShowCourseModal(false)}>×</button>
          </div>
          <div className="modal-body">
            <div className="courses-list">
              {courses.map(course => (
                <div 
                  key={course.id} 
                  className="course-selection-item"
                  onClick={() => handleSelectCourse(course)}
                >
                  <div className="course-selection-header">
                    <h4>{course.title}</h4>
                    <span className="course-type">{course.type}</span>
                  </div>
                  <div className="course-selection-info">
                    <p><strong>Giáo viên:</strong> {course.teacher_name || `Giáo viên ${course.teacher_id}`}</p>
                    <p><strong>Tiết học:</strong> {course.lesson || 'Chưa có tiết'}</p>
                    <p><strong>Lớp học:</strong> {course.url || 'Chưa có lớp'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button className="cancel-btn" onClick={() => setShowCourseModal(false)}>Hủy</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="schedule-with-courses">
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner">Đang xử lý...</div>
        </div>
      )}
      
      <CourseSelectionModal />
      
      <div className="schedule-section">
        <div className="schedule-header">
          <div className="header-top">
            <h1>Lịch học – Lịch thi theo tuần</h1>
            <div className="header-actions">
              <button className="print-btn" onClick={() => window.print()}>
                <span><PrinterOutlined /></span>
                In lịch
              </button>
            </div>
          </div>
          
          <div className="header-controls">
            <div className="filter-buttons">
              {['Tất cả', 'Lịch học', 'Lịch thi'].map(filter => (
                <button 
                  key={filter}
                  className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
                  onClick={() => setActiveFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            
            <div className="date-controls">
              <div className="date-display" onClick={() => setShowDatePicker(true)}>
                <span className="calendar-icon"><ScheduleOutlined /></span>
                <span className="date-text">
                  {currentDate.getDate().toString().padStart(2, '0')}/{(currentDate.getMonth() + 1).toString().padStart(2, '0')}/{currentDate.getFullYear()}
                </span>
              </div>
              
              <div className="navigation-buttons">
                <button className="nav-btn" onClick={goToPreviousWeek}>Trở về</button>
                <button className="nav-btn current" onClick={goToCurrentWeek}>Hôm nay</button>
                <button className="nav-btn" onClick={goToNextWeek}>Tiếp</button>
              </div>
            </div>
          </div>

          {showDatePicker && <DatePicker />}
        </div>

        <div className="schedule-table-container">
          <table className="schedule-table">
            <thead>
              <tr>
                <th className="header-cell time-header">Ca học</th>
                {weekDays.map((day, index) => (
                  <th key={index} className="header-cell">
                    <div className="day">{day.day}</div>
                    <div className="date">{day.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {['Sáng', 'Chiều', 'Tối'].map(period => (
                <tr key={period}>
                  <td className="time-period">{period}</td>
                  {scheduleData[period].map((daySlots, dayIndex) => (
                    <td 
                      key={dayIndex} 
                      className="time-slot multi-slot"
                    >
                      {renderCell(daySlots, period, dayIndex)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="schedule-legend">
          <h3>Chú thích</h3>
          <div className="legend-items">
            {legendItems.map((item, index) => (
              <div key={index} className="legend-item">
                <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                <span className="legend-label">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleWithCourses;