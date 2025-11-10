import { useEffect, useState, useCallback } from "react";
import { Progress, Button, message, Modal, Select, Pagination } from "antd";
import axios from "axios";
import { UserOutlined, BookOutlined, ClockCircleOutlined } from "@ant-design/icons";
import CourseDetail from "./CourseDetail";
import "./MyCourse.css";

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [sortOrder, setSortOrder] = useState("az");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const token = localStorage.getItem("token");
  const studentId = token ? JSON.parse(atob(token.split(".")[1])).id : null;

  const fetchCourses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:5000/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const coursesWithStatus = await Promise.all(
        res.data.map(async (c) => {
          try {
            const progressRes = await axios.get(
              `http://localhost:5000/courses/${c.id}/progress`,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            const enrollRes = await axios.get(
              `http://localhost:5000/courses/${c.id}/isEnrolled`,
              {
                headers: { Authorization: `Bearer ${token}` },
                params: { studentId },
              }
            );
            return {
              ...c,
              progress: progressRes.data.progress || 0,
              isEnrolled: enrollRes.data.isEnrolled || false,
            };
          } catch {
            return { ...c, progress: 0, isEnrolled: false };
          }
        })
      );
      setCourses(coursesWithStatus);
    } catch (err) {
      console.error(err);
      message.error("Lấy danh sách khóa học thất bại");
    }
  }, [token, studentId]);

  const handleEnroll = async (courseId) => {
    if (!token) return;
    try {
      await axios.post(
        `http://localhost:5000/courses/${courseId}/enroll`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Đăng ký khóa học thành công!");
      fetchCourses();
    } catch {
      message.error("Đăng ký thất bại");
    }
  };

  const handleUnenroll = async (courseId) => {
    if (!token) return;
    try {
      await axios.delete(
        `http://localhost:5000/courses/${courseId}/unenroll`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.info("Đã hủy đăng ký khóa học.");
      fetchCourses();
    } catch {
      message.error("Hủy đăng ký thất bại");
    }
  };

  const sortedCourses = [...courses].sort((a, b) =>
    sortOrder === "az"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title)
  );

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  return (
    <div className="mycourses-page">
      {!token ? (
        <div>Vui lòng đăng nhập để xem dashboard</div>
      ) : (
        <>
          <div className="mycourses-header">
            <h2>📚 Khóa học của bạn</h2>
            <Select
              value={sortOrder}
              onChange={(value) => setSortOrder(value)}
              options={[
                { value: "az", label: "Sắp xếp A → Z" },
                { value: "za", label: "Sắp xếp Z → A" },
              ]}
            />
          </div>

          <div className="mycourses-grid">
            {sortedCourses.map((course) => (
              <div className="course-card" key={course.id}>
                <h3>{course.title}</h3>
                <div className="course-info">
                  <div><UserOutlined /> {course.teacher_name}</div>
                </div>
                <div className="course-info">
                  <div><BookOutlined /> {course.lessons || 0} bài học
                  <ClockCircleOutlined style={{ marginLeft: 10 }} /> {course.hours || 0} giờ</div>
                </div>
                <Progress percent={course.progress || 0} />
                <div className="course-footer">
                  <div>
                    {course.isEnrolled ? (
                      <Button danger onClick={() => handleUnenroll(course.id)}>
                        Hủy đăng ký
                      </Button>
                    ) : (
                      <Button type="primary" onClick={() => handleEnroll(course.id)}>
                        Đăng ký
                      </Button>
                    )}
                  </div>
                  <div style={{marginLeft: "10px"}}>
                    <Button
                      onClick={() => {
                        setSelectedCourse(course);
                        setOpenDetail(true);
                      }}
                    >
                      Xem chi tiết
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            current={currentPage}
            pageSize={pageSize}
            className="pagination-wrapper"
            total={courses.length}
            onChange={(page) => setCurrentPage(page)}
          />

          <Modal
            open={openDetail}
            onCancel={() => setOpenDetail(false)}
            footer={null}
            width={1000}
            style={{ top: 20 }}
            destroyOnClose
          >
            {selectedCourse && <CourseDetail course={selectedCourse} />}
          </Modal>
        </>
      )}
    </div>
  );
}
