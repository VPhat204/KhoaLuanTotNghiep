import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Button,
  Form,
  Input,
  message,
  List,
  Pagination,
  Avatar,
  Progress,
  Modal,
} from "antd";
import axios from "axios";
import "./MyCourse.css";
import { Link } from "react-router-dom";
import { PlusOutlined, PlayCircleOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";

export default function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [form] = Form.useForm();
  const [videoForm] = Form.useForm();
  const token = localStorage.getItem("token");
  const [currentPage, setCurrentPage] = useState(1);
  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [videosByCourse, setVideosByCourse] = useState({});
  const [editingVideo, setEditingVideo] = useState(null);
  const pageSize = 3;

  const fetchCourses = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get("http://localhost:5000/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourses(res.data);
    } catch {
      message.error("Lấy danh sách khóa học thất bại");
    }
  }, [token]);

  const handleAddCourse = async (values) => {
    try {
      await axios.post(
        "http://localhost:5000/courses",
        { ...values },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Thêm khóa học thành công!");
      form.resetFields();
      setIsCourseModalOpen(false);
      fetchCourses();
    } catch {
      message.error("Thêm khóa học thất bại");
    }
  };

  const fetchVideos = async (courseId) => {
    try {
      const res = await axios.get(`http://localhost:5000/videos/${courseId}`);
      setVideosByCourse((prev) => ({ ...prev, [courseId]: res.data }));
    } catch {
      message.error("Lỗi khi lấy video");
    }
  };

  const handleAddVideo = async (values) => {
    try {
      if (editingVideo) {
        await axios.put(
          `http://localhost:5000/videos/${editingVideo.id}`,
          { ...values },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success("Cập nhật video thành công!");
      } else {
        await axios.post(
          "http://localhost:5000/videos/add",
          { course_id: selectedCourse.id, ...values },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        message.success("Thêm video thành công!");
      }
      videoForm.resetFields();
      setEditingVideo(null);
      fetchVideos(selectedCourse.id);
    } catch {
      message.error("Lỗi khi lưu video");
    }
  };

  const handleDeleteVideo = async (videoId) => {
    try {
      await axios.delete(`http://localhost:5000/videos/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Xóa video thành công!");
      fetchVideos(selectedCourse.id);
    } catch {
      message.error("Xóa video thất bại");
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const paginatedCourses = courses.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <div className="course-container">
      <h2>👨‍🏫 Giảng viên - Quản lý khóa học</h2>

      <div style={{ textAlign: "right", marginBottom: 20 }}>
        <Button type="primary" onClick={() => setIsCourseModalOpen(true)}>
          + Thêm khóa học
        </Button>
      </div>

      <Modal
        title="Thêm khóa học mới"
        open={isCourseModalOpen}
        onCancel={() => setIsCourseModalOpen(false)}
        footer={null}
      >
        <Form form={form} layout="vertical" onFinish={handleAddCourse}>
          <Form.Item
            name="title"
            label="Tên khóa học"
            rules={[{ required: true, message: "Vui lòng nhập tên khóa học" }]}
          >
            <Input placeholder="Nhập tên khóa học..." />
          </Form.Item>
          <Form.Item name="description" label="Mô tả">
            <Input.TextArea placeholder="Mô tả ngắn gọn về khóa học..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Xác nhận thêm
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      <h3>Danh sách khóa học của bạn</h3>
      <List
        grid={{ gutter: 16, column: 1 }}
        dataSource={paginatedCourses}
        className="mycourses-grid list-view"
        renderItem={(course) => (
          <List.Item key={course.id} className="course-card">
            <Card
              hoverable
              style={{ width: "100%", padding: "10px 0" }}
              title={
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <Avatar className="course-icon orange">
                    {course.title ? course.title[0].toUpperCase() : "K"}
                  </Avatar>
                  <span className="course-info">{course.title}</span>
                </div>
              }
              extra={
                <div style={{ display: "flex", gap: "10px" }}>
                  <Button
                    type={
                      videosByCourse[course.id]?.length > 0
                        ? "default"
                        : "dashed"
                    }
                    icon={<PlusOutlined />}
                    onClick={() => {
                      setSelectedCourse(course);
                      fetchVideos(course.id);
                      setIsVideoModalOpen(true);
                    }}
                  >
                    {videosByCourse[course.id]?.length > 0
                      ? "Video đã thêm"
                      : "Thêm video"}
                  </Button>
                  <Link className="detail-btn" to={`/course/${course.id}`}>
                    Xem chi tiết
                  </Link>
                </div>
              }
            >
              <div className="course-meta">
                <span>{course.teacher_name}</span>
                <span>{new Date(course.created_at).toLocaleDateString()}</span>
              </div>
              <div className="course-progress">
                <Progress percent={course.progress || 0} showInfo={false} />
                <span>{course.progress || 0}%</span>
              </div>
            </Card>
          </List.Item>
        )}
      />

      <Pagination
        current={currentPage}
        pageSize={pageSize}
        className="pagination-wrapper"
        total={courses.length}
        onChange={(page) => setCurrentPage(page)}
      />

      <Modal
        title={`Quản lý video - ${selectedCourse?.title || ""}`}
        open={isVideoModalOpen}
        onCancel={() => {
          setIsVideoModalOpen(false);
          setEditingVideo(null);
          videoForm.resetFields();
        }}
        footer={null}
      >
        <Form
          form={videoForm}
          layout="vertical"
          onFinish={handleAddVideo}
          initialValues={editingVideo || {}}
        >
          <Form.Item
            name="title"
            label="Tên video"
            rules={[{ required: true, message: "Nhập tên video" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="url"
            label="Đường dẫn video"
            rules={[{ required: true, message: "Nhập URL video" }]}
          >
            <Input placeholder="Ví dụ: https://youtu.be/..." />
          </Form.Item>
          <Form.Item name="duration" label="Thời lượng (vd: 15 min)">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            {editingVideo ? "Cập nhật video" : "Lưu video"}
          </Button>
        </Form>

        <List
          header="Danh sách video hiện có"
          dataSource={videosByCourse[selectedCourse?.id] || []}
          renderItem={(v) => (
            <List.Item
              actions={[
                <Button
                  icon={<EditOutlined />}
                  onClick={() => {
                    setEditingVideo(v);
                    videoForm.setFieldsValue(v);
                  }}
                />,
                <Button
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteVideo(v.id)}
                />,
              ]}
            >
              <PlayCircleOutlined
                style={{ color: "#1677ff", marginRight: 8 }}
              />
              {v.title} ({v.duration})
            </List.Item>
          )}
        />
      </Modal>
    </div>
  );
}
