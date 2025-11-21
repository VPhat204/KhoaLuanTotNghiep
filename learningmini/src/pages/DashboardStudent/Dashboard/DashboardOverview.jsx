import { useState, useEffect, useCallback } from "react";
import { Card, Progress, Button } from "antd";
import { LeftOutlined, RightOutlined, CalendarOutlined } from '@ant-design/icons';
import axios from "axios";
import api from "../../../api";
import "./DashboardOverview.css";

function DashboardOverview({ setSelectedKey }) {
  const [dashboardData, setDashboardData] = useState({});
  const [courses, setCourses] = useState([]);
  const [monthlySchedule, setMonthlySchedule] = useState([]);
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate());
  const token = localStorage.getItem("token");
  const [studentId, setStudentId] = useState(null);
  
  const handleViewAllCourses = () => {
    setSelectedKey("mycourses"); 
  };

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setStudentId(payload.id);
    }
  }, [token]);

  const fetchEnrolledCourses = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const userId = studentId || JSON.parse(localStorage.getItem("user"))?.id;
      if (!userId) return;
      
      const res = await axios.get(
        `http://localhost:5000/users/${userId}/courses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setEnrolledCourses(res.data);
      setCourses(res.data);
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
    }
  }, [studentId]);

  const fetchMonthlySchedule = useCallback(async () => {
    const token = localStorage.getItem("token");  
    
    try {
      setLoading(true);
      
      const weeklyPromises = [];
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      
      const weeks = [];
      let currentDate = new Date(firstDay);
      
      while (currentDate <= lastDay) {
        weeks.push(new Date(currentDate));
        currentDate.setDate(currentDate.getDate() + 7);
      }
      
      if (weeks.length === 0 || weeks[weeks.length - 1] < lastDay) {
        weeks.push(new Date(lastDay));
      }

      for (const weekDate of weeks) {
        const dateString = weekDate.toISOString().split('T')[0];
        weeklyPromises.push(
          axios.get(
            `http://localhost:5000/api/schedule/week?date=${dateString}`,
            { headers: { Authorization: `Bearer ${token}` } }
          )
        );
      }
      
      const responses = await Promise.all(weeklyPromises);

      const enrolledCourseIds = enrolledCourses.map(course => course.id);
      const allSchedules = [];

      responses.forEach((response, weekIndex) => {
        const data = response.data;
        const weekDate = weeks[weekIndex];
        
        ['Sáng', 'Chiều', 'Tối'].forEach(period => {
          if (data[period]) {
            for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
              const daySlots = data[period][dayIndex];
              
              if (Array.isArray(daySlots)) {
                daySlots.forEach((slot, slotIndex) => {
                  if (slot && slot.type !== 'empty' && slot.course_id) {
                    if (enrolledCourseIds.includes(slot.course_id)) {
                      const scheduleDate = new Date(weekDate);
                      const dayOfWeek = weekDate.getDay();
                      const adjustedStart = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                      scheduleDate.setDate(weekDate.getDate() + adjustedStart + dayIndex);
                      
                      if (scheduleDate.getMonth() === currentMonth.getMonth() && 
                          slot.title && slot.title !== 'empty') {
                        allSchedules.push({
                          ...slot,
                          period: period,
                          slotIndex: slotIndex + 1,
                          date: scheduleDate.getDate(),
                          dayName: ["Chủ nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"][scheduleDate.getDay()],
                          dateString: `${scheduleDate.getDate().toString().padStart(2, '0')}/${(scheduleDate.getMonth() + 1).toString().padStart(2, '0')}`,
                          fullDate: scheduleDate,
                          month: scheduleDate.getMonth(),
                          year: scheduleDate.getFullYear()
                        });
                      }
                    }
                  }
                });
              }
            }
          }
        });
      });

      setMonthlySchedule(allSchedules.sort((a, b) => a.fullDate - b.fullDate));
      
    } catch (err) {
      console.log('Error fetching monthly schedule:', err);
      setMonthlySchedule([]);
    } finally {
      setLoading(false);
    }
  }, [currentMonth, enrolledCourses]);

  useEffect(() => {
    if (!studentId) return;
    
    api
      .get(`/dashboard/student/${studentId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setDashboardData(res.data))
      .catch((err) => console.log(err));
      
    fetchEnrolledCourses();
  }, [studentId, token, fetchEnrolledCourses]);

  useEffect(() => { 
    if (enrolledCourses.length > 0) {
      fetchMonthlySchedule(); 
    }
  }, [fetchMonthlySchedule, enrolledCourses]);

  const goToPreviousMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + 1);
      return newDate;
    });
  };

  const goToCurrentMonth = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today.getDate());
  };

  const generateCalendar = () => {
    const currentMonthValue = currentMonth.getMonth();
    const currentYear = currentMonth.getFullYear();
    
    const firstDay = new Date(currentYear, currentMonthValue, 1);
    const lastDay = new Date(currentYear, currentMonthValue + 1, 0);
    
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const calendar = [];
    
    let adjustedStartingDay = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    
    for (let i = 0; i < adjustedStartingDay; i++) {
      calendar.push(null);
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(day);
    }
    
    const totalCells = 42;
    const remainingCells = totalCells - calendar.length;
    for (let i = 0; i < remainingCells; i++) {
      calendar.push(null);
    }
    
    return calendar;
  };

  const getScheduleCountForDate = (day) => {
    if (!day) return 0;
    return monthlySchedule.filter(item => item.date === day).length;
  };

  const getDayColor = (day) => {
    if (!day) return '#9E9E9E';
    
    const daySchedule = monthlySchedule.find(item => item.date === day);
    if (daySchedule) {
      return getScheduleTypeColor(daySchedule.type);
    }
    
    return '#9E9E9E';
  };

  const getSelectedDateSchedule = () => {
    if (!selectedDate) return [];
    
    return monthlySchedule.filter(item => item.date === selectedDate);
  };

  const getScheduleTypeColor = (type) => {
    const colors = {
      theory: '#9E9E9E',    
      practice: '#4CAF50',  
      online: '#2196F3',    
      exam: '#FFEB3B',      
      pause: '#FF9800'      
    };
    return colors[type] || '#9E9E9E';
  };

  const getCourseType = (course) => {
    const title = course.title?.toLowerCase() || '';
    if (title.includes('thực hành') || title.includes('practice')) return 'practice';
    if (title.includes('online') || title.includes('trực tuyến')) return 'online';
    if (title.includes('thi') || title.includes('exam')) return 'exam';
    return 'theory';
  };

  const handleDateClick = (day) => {
    if (day) {
      setSelectedDate(day);
    }
  };

  useEffect(() => {
    const today = new Date();
    const isCurrentMonth = currentMonth.getMonth() === today.getMonth() && 
                          currentMonth.getFullYear() === today.getFullYear();
    
    if (isCurrentMonth && !selectedDate) {
      setSelectedDate(today.getDate());
    }
  }, [currentMonth, selectedDate]);

  const weekDays = ["Th 2", "Th 3", "Th 4", "Th 5", "Th 6", "Th 7", "CN"];
  const selectedDateSchedule = getSelectedDateSchedule();
  const calendarDays = generateCalendar();

  const monthNames = [
    "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
    "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
  ];
  const currentMonthName = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;

  const getSelectedDateDisplay = () => {
    if (!selectedDate) return "";
    return `${selectedDate.toString().padStart(2, '0')}/${(currentMonth.getMonth() + 1).toString().padStart(2, '0')}/${currentMonth.getFullYear()}`;
  };

  return (
    <div className="dashboard-page">
      {loading && (
        <div className="loading-screen">
          <div className="loading-content">Đang tải lịch học...</div>
        </div>
      )}
      
      <div className="dashboard-top-section">
        <div className="left-sidebar">
          <div className="user-welcome-card">
            <h2>Hi {dashboardData.name || "Student"}!</h2>
            <p>
              You have completed <b>{dashboardData.lessons_done || 5}</b> lessons in the last day.
            </p>
            <p className="course-count-info">
              Đang theo học <strong>{enrolledCourses.length}</strong> khóa học
            </p>
          </div>
          <Card className="my-courses-card" title="My Courses" extra={<span onClick={handleViewAllCourses}>Xem thêm</span>}>
            {courses.slice(0, 6).map((course) => {              
              return (
                <div key={course.id} className="course-list-item">
                  <div>
                    <h4>{course.title}</h4>
                    <p>{course.description || 'Unknown'}</p>
                  </div>
                  <div className="course-progress-section">
                    <div>{course.teacher_name || course.teacher || 'Unknown'}</div>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
        <div className="calendar-section">
          <div className="calendar-header-panel">
            <h3>Lịch học tháng {currentMonthName}</h3>
            <div className="month-navigation-panel">
              <div className="current-month-display">
                <span className="month-icon"><CalendarOutlined /></span>
                <span className="month-title">{currentMonthName}</span>
              </div>
              
              <div className="month-control-buttons">
                <Button 
                  icon={<LeftOutlined />} 
                  onClick={goToPreviousMonth}
                  size="small"
                />
                <Button 
                  onClick={goToCurrentMonth}
                  size="small"
                >
                  Hôm nay
                </Button>
                <Button 
                  icon={<RightOutlined />} 
                  onClick={goToNextMonth}
                  size="small"
                />
              </div>
            </div>
          </div>

          <div className="calendar-summary-info">
            <p>Có <strong>{monthlySchedule.length}</strong> lớp học trong tháng này</p>
          </div>

          <div className="calendar-main-panel">
            <div className="calendar-days-header">
              {weekDays.map(day => (
                <div key={day} className="week-day-label">{day}</div>
              ))}
            </div>
            <div className="calendar-days-grid">
              {calendarDays.map((day, index) => {
                const scheduleCount = getScheduleCountForDate(day);
                const hasSchedule = scheduleCount > 0;
                const dayColor = getDayColor(day);
                const isToday = day === new Date().getDate() && 
                              currentMonth.getMonth() === new Date().getMonth() && 
                              currentMonth.getFullYear() === new Date().getFullYear();
                const isSelected = day === selectedDate;
                
                return (
                  <div 
                    key={index} 
                    className={`calendar-date-cell ${day ? 'has-date' : 'empty-cell'} ${hasSchedule ? 'has-class' : ''} ${isToday ? 'current-day' : ''} ${isSelected ? 'selected-day' : ''}`}
                    onClick={() => handleDateClick(day)}
                  >
                    {day && (
                      <>
                        <span className="date-number">{day}</span>
                        {hasSchedule && (
                          <div className="class-indicator">
                            <div 
                              className="class-dot" 
                              style={{ backgroundColor: dayColor }}
                            ></div>
                            {scheduleCount > 1 && (
                              <span className="class-count">{scheduleCount}</span>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="schedule-details-panel">
              <h4>
                {selectedDate 
                  ? `Lịch học ngày ${getSelectedDateDisplay()}` 
                  : "Chọn một ngày để xem lịch học"}
              </h4>
              
              {selectedDate ? (
                selectedDateSchedule.length > 0 ? (
                  <div className="daily-classes-list">
                    {selectedDateSchedule.map((item, index) => (
                      <div key={index} className="class-schedule-item">
                        <div className="class-time-slot">
                          <span className="period-number">Tiết {item.lesson || 'N/A'}</span>
                        </div>
                        <div className="class-details">
                          <span className="class-name">{item.title}</span>
                          <span className="class-teacher">GV: {item.teacher || 'Chưa có'}</span>
                          <span className="class-room">Lớp: {item.url || 'Chưa có'}</span>
                        </div>
                        <span 
                          className="class-type-tag" 
                          style={{ backgroundColor: getScheduleTypeColor(item.type) }}
                        >
                          {item.type === 'theory' && 'LT'}
                          {item.type === 'practice' && 'TH'}
                          {item.type === 'online' && 'Online'}
                          {item.type === 'exam' && 'Thi'}
                          {item.type === 'pause' && 'Tạm ngưng'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-classes-message">
                    Không có lịch học nào vào ngày {getSelectedDateDisplay()}
                  </div>
                )
              ) : (
                <div className="select-date-message">
                  Nhấp vào một ngày có dấu chấm trong lịch để xem lịch học chi tiết
                </div>
              )}
            </div>

            <div className="class-types-legend">
              <div className="legend-types-container">
                <div className="type-legend-item">
                  <div className="type-color-box" style={{ backgroundColor: '#9E9E9E' }}></div>
                  <span className="type-name-label">Lý thuyết</span>
                </div>
                <div className="type-legend-item">
                  <div className="type-color-box" style={{ backgroundColor: '#4CAF50' }}></div>
                  <span className="type-name-label">Thực hành</span>
                </div>
                <div className="type-legend-item">
                  <div className="type-color-box" style={{ backgroundColor: '#2196F3' }}></div>
                  <span className="type-name-label">Trực tuyến</span>
                </div>
                <div className="type-legend-item">
                  <div className="type-color-box" style={{ backgroundColor: '#FFEB3B' }}></div>
                  <span className="type-name-label">Thi</span>
                </div>
                <div className="type-legend-item">
                  <div className="type-color-box" style={{ backgroundColor: '#FF9800' }}></div>
                  <span className="type-name-label">Tạm ngưng</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-middle-section">
        <Card className="activity-card" title="My Activity">
          <div className="activity-graph">📈</div>
        </Card>
      </div>

      <div className="dashboard-bottom-section">
        <Card className="my-courses-card" title="My Courses" extra={<span>All</span>}>
          {courses.slice(0, 3).map((course) => {
            const courseType = getCourseType(course);
            const courseColor = getScheduleTypeColor(courseType);
            
            return (
              <div key={course.id} className="course-list-item">
                <div>
                  <h4>{course.title}</h4>
                  <p>By {course.teacher_name || course.teacher || 'Unknown'}</p>
                  <span 
                    className="course-category-badge"
                    style={{ 
                      backgroundColor: courseColor,
                      color: courseType === 'exam' ? '#000' : '#fff'
                    }}
                  >
                    {courseType === 'theory' && 'Lý thuyết'}
                    {courseType === 'practice' && 'Thực hành'}
                    {courseType === 'online' && 'Trực tuyến'}
                    {courseType === 'exam' && 'Thi'}
                  </span>
                </div>
                <div className="course-progress-section">
                  <Progress 
                    percent={course.progress || 25} 
                    showInfo={false}
                    strokeColor={courseColor}
                  />
                  <span>⭐ {course.rating || 4.3}</span>
                  <Button type="primary" size="small">View</Button>
                </div>
              </div>
            );
          })}
        </Card>

        <Card className="tasks-card" title="Upcoming Task" extra={<span>See all</span>}>
          <div className="task-list-item">
            <h4>Discussion Algorithm</h4>
            <p>08:00 AM - 15:00 PM</p>
          </div>
          <div className="task-list-item">
            <h4>Simple Home Page Design</h4>
            <p>08:00 AM - 15:00 PM</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default DashboardOverview;