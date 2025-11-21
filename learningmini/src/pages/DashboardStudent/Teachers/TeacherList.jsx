import { useEffect, useState } from "react";
import axios from "axios";
import { message } from "antd";
import "./TeacherList.css";

export default function TeacherList({ onCourseEnrolled }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [enrolling, setEnrolling] = useState({});
  const [expandedTeacher, setExpandedTeacher] = useState(null);
  const [enrolledCourses, setEnrolledCourses] = useState(new Set());

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    const fetchTeachers = async () => {
      setLoading(true);
      try {
        const res = await axios.get("http://localhost:5000/teachers-courses", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeachers(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, [token]);

  useEffect(() => {
    const fetchEnrolledCourses = async () => {
      if (user && user.roles === "student") {
        try {
          const enrolledRes = await axios.get(
            `http://localhost:5000/users/${user.id}/courses`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const enrolledIds = new Set(enrolledRes.data.map(course => course.id));
          setEnrolledCourses(enrolledIds);
        } catch (err) {
          console.error("Lỗi khi lấy khóa học đã đăng ký:", err);
        }
      }
    };
    fetchEnrolledCourses();
  }, [token, user]);

  const isCourseEnrolled = (courseId) => {
    return enrolledCourses.has(courseId);
  };

  const toggleCourses = (teacherId) => {
    setExpandedTeacher(expandedTeacher === teacherId ? null : teacherId);
  };

  const handleEnroll = async (courseId, courseTitle) => {
    try {
      setEnrolling(prev => ({ ...prev, [courseId]: true }));
      
      if (user.roles !== "student") {
        message.error("Chỉ sinh viên mới có thể đăng ký khóa học");
        return;
      }

      if (isCourseEnrolled(courseId)) {
        message.warning("Bạn đã đăng ký khóa học này rồi");
        return;
      }

      await axios.post(
        `http://localhost:5000/courses/${courseId}/enroll`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEnrolledCourses(prev => new Set([...prev, courseId]));
      
      message.success(`Đã đăng ký thành công khóa học: ${courseTitle}`);
      
      if (onCourseEnrolled) {
        onCourseEnrolled();
      }
      
    } catch (error) {
      console.error("Lỗi khi đăng ký:", error);
      if (error.response?.status === 403) {
        message.error("Bạn không có quyền đăng ký khóa học");
      } else if (error.response?.status === 409) {
        message.warning("Bạn đã đăng ký khóa học này rồi");
        setEnrolledCourses(prev => new Set([...prev, courseId]));
      } else {
        message.error("Có lỗi xảy ra khi đăng ký khóa học");
      }
    } finally {
      setEnrolling(prev => ({ ...prev, [courseId]: false }));
    }
  };

  return (
    <div className="teacher-list-container">
      <h1>Danh sách giảng viên</h1>
      {loading ? (
        <p>Đang tải danh sách giảng viên...</p>
      ) : (
        <div className="teachers">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="teacher-card">
              <div className="teacher-main-info">
                <div className="teacher-avatar">
                  <img 
                    src={`http://localhost:5000${teacher.avatar}`} 
                    alt=""
                    onError={(e) => e.target.src = "/default-avatar.png"}
                  />
                </div>
                <div className="teacher-details">
                  <div className="detail-row">
                    <span className="teacher-name">{teacher.name}</span>
                    <span className="teacher-gender">{teacher.gender || "-"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="teacher-date">
                      {teacher.birthdate ? new Date(teacher.birthdate).toLocaleDateString() : "Chưa cập nhật"}
                    </span>
                    <span className="teacher-phone">{teacher.phone || "Chưa cập nhật"}</span>
                  </div>
                  <div className="detail-row">
                    <span className="teacher-email">{teacher.email}</span>
                  </div>
                </div>
              </div>
              
              <div className="teacher-actions">
                <button 
                  className="view-courses-btn"
                  onClick={() => toggleCourses(teacher.id)}
                >
                  {expandedTeacher === teacher.id ? "Ẩn khóa học" : "Xem tất cả khóa học"}
                </button>
              </div>

              {expandedTeacher === teacher.id && (
                <div className="courses-section">
                  <h3>Khóa học giảng dạy</h3>
                  {teacher.courses.length === 0 ? (
                    <p className="no-courses">Chưa có khóa học</p>
                  ) : (
                    <div className="teacher-courses-list">
                      {teacher.courses.map((course) => {
                        const isEnrolled = isCourseEnrolled(course.id);
                        return (
                          <div key={course.id} className={`course-item ${isEnrolled ? 'enrolled' : ''}`}>
                            <div className="course-info">
                              <h4>{course.title}</h4>
                              <p>{course.description}</p>
                            </div>
                            <div className="course-actions">
                              <button 
                                className={`enroll-btn ${isEnrolled ? 'enrolled' : ''} ${enrolling[course.id] ? 'enrolling' : ''}`}
                                onClick={() => handleEnroll(course.id, course.title)}
                                disabled={isEnrolled || enrolling[course.id]}
                              >
                                {enrolling[course.id] ? "Đang đăng ký..." : isEnrolled ? "Đã đăng ký" : "Đăng ký học"}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}