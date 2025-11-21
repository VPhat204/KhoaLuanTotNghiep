import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Button, message, Progress, Modal } from "antd";
import CourseDetail from "./CourseDetail";
import "./Course.css";

export default function Courses({ refreshTrigger }) {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unenrolling, setUnenrolling] = useState({});
  const [progressData, setProgressData] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null); 
  const [openDetail, setOpenDetail] = useState(false); 

  const getInitial = (title) => {
    return title ? title.charAt(0).toUpperCase() : 'C';
  };

  const fetchMyCourses = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      
      const res = await axios.get(
        `http://localhost:5000/users/${user.id}/courses`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      
      setCourses(res.data);
      
      const progressPromises = res.data.map(async (course) => {
        try {
          const progressRes = await axios.get(
            `http://localhost:5000/courses/${course.id}/progress`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: { studentId: user.id }
            }
          );
          return {
            courseId: course.id,
            progress: progressRes.data.progress || 0
          };
        } catch (error) {
          return {
            courseId: course.id,
            progress: 0
          };
        }
      });

      const progressResults = await Promise.all(progressPromises);
      const progressMap = {};
      progressResults.forEach(result => {
        progressMap[result.courseId] = result.progress;
      });
      setProgressData(progressMap);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUnenroll = async (courseId, courseTitle) => {
    try {
      setUnenrolling(prev => ({ ...prev, [courseId]: true }));
      
      const token = localStorage.getItem("token");
      
      await axios.delete(
        `http://localhost:5000/courses/${courseId}/unenroll`,
        { 
          headers: { Authorization: `Bearer ${token}` } 
        }
      );
      
      message.success(`Đã hủy đăng ký khóa học: ${courseTitle}`);
      fetchMyCourses();
      
    } catch (error) {
      console.error("Lỗi khi hủy đăng ký:", error);
      message.error("Có lỗi xảy ra khi hủy đăng ký");
    } finally {
      setUnenrolling(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleViewDetail = (course) => {
    setSelectedCourse(course);
    setOpenDetail(true);
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
    setSelectedCourse(null);
  };

  useEffect(() => {
    fetchMyCourses();
  }, [refreshTrigger, fetchMyCourses]);

  return (
    <div className="courses-container">
      <h1>Khóa học của tôi</h1>
      {loading ? (
        <p>Đang tải khóa học...</p>
      ) : courses.length === 0 ? (
        <div className="no-courses">
          <p>Bạn chưa đăng ký khóa học nào</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => {
            const progress = progressData[course.id] || 0;
            
            return (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <div className="course-avatar">
                    {getInitial(course.title)}
                  </div>
                  <div className="course-title-section">
                    <h3>{course.title}</h3>
                    <span className="course-teacher">Giảng viên: {course.teacher_name}</span>
                  </div>
                </div>
                
                <p className="course-description">{course.description}</p>
                
                <div className="progress-section">
                  <div className="progress-info">
                    <span className="progress-label">Tiến độ: </span>
                    <span className="progress-value">{progress}%</span>
                  </div>
                  <Progress 
                    percent={progress} 
                    size="small"
                    strokeColor={{
                      '0%': '#4096ff',
                      '100%': '#70b6ff',
                    }}
                    showInfo={false}
                    style={{ width: '100%' }}
                  />
                </div>
                
                <div className="course-meta">
                  <span className="enrolled-date">Đăng ký: {new Date(course.enrolled_at).toLocaleDateString()}</span>
                </div>
                
                <div className="course-footer">
                  <Button 
                    danger 
                    onClick={() => handleUnenroll(course.id, course.title)}
                    loading={unenrolling[course.id]}
                    className="unenroll-btn"
                  >
                    Hủy đăng ký
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={() => handleViewDetail(course)}
                    className="view-detail-btn"
                  >
                    Xem chi tiết
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal
        open={openDetail}
        onCancel={handleCloseDetail}
        footer={null}
        width={1000}
        style={{ top: 20 }}
        destroyOnClose
      >
        {selectedCourse && <CourseDetail course={selectedCourse} />}
      </Modal>
    </div>
  );
}