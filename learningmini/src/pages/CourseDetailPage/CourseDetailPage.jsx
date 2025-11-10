import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, Row, Col, Spin, message } from "antd";
import api from "../../api";

function CourseDetail() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/student/course/${id}`);
        setCourse(res.data);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải chi tiết khóa học!");
      } finally {
        setLoading(false);
      }
    };
    fetchCourse();
  }, [id]);

  if (loading) return <Spin tip="Đang tải..." style={{ display: "block", marginTop: 50 }} />;

  if (!course) return <p>Không tìm thấy khóa học</p>;

  return (
    <div style={{ padding: 24 }}>
      <h2>{course.title}</h2>
      <p>{course.description}</p>
      <h3>Danh sách Quiz</h3>
      <Row gutter={[16, 16]}>
        {course.quizzes.length === 0 ? (
          <p>Chưa có quiz nào.</p>
        ) : (
          course.quizzes.map((quiz) => (
            <Col key={quiz.id} xs={24} sm={12} md={8} lg={6}>
              <Card title={quiz.title}>
                <p>{quiz.description}</p>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </div>
  );
}

export default CourseDetail;
