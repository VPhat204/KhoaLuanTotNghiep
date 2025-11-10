import { useEffect, useState } from "react";
import { Row, Col, Card, Spin, message } from "antd";
import api from "../../api";

function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMyCourses = async () => {
      try {
        const res = await api.get("/student/my-courses");
        setCourses(res.data);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải khóa học của bạn!");
      } finally {
        setLoading(false);
      }
    };
    fetchMyCourses();
  }, []);

  if (loading) return <Spin tip="Đang tải..." style={{ display: "block", marginTop: 50 }} />;

  return (
    <div style={{ padding: 24 }}>
      <h2>Khóa học của tôi</h2>
      <Row gutter={[16, 16]}>
        {courses.length === 0 ? (
          <p>Bạn chưa đăng ký khóa học nào.</p>
        ) : (
          courses.map((course) => (
            <Col key={course.id} xs={24} sm={12} md={8} lg={6}>
              <Card
                hoverable
                title={course.title}
              >
                <p>Giảng viên: {course.teacher_name}</p>
                <p>{course.description}</p>
                <p>Số bài học: {course.lessons_count}</p>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </div>
  );
}

export default MyCourses;
