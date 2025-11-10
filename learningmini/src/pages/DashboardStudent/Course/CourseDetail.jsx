import { useEffect, useState, useCallback } from "react";
import {
  Tabs,
  Typography,
  List,
  Divider,
  Card,
  Tag,
  Input,
  Button,
  message,
  Avatar,
} from "antd";
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import axios from "axios";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function CourseDetail({ course }) {
  const [videos, setVideos] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const token = localStorage.getItem("token");
  const [studentCount, setStudentCount] = useState(0);

  const fetchVideos = useCallback(async () => {
    if (!course?.id) return;
    try {
      const res = await axios.get(`http://localhost:5000/videos/${course.id}`);
      setVideos(res.data);
    } catch {
      message.error("Không thể tải danh sách video");
    }
  }, [course?.id]);

  const fetchComments = useCallback(async () => {
    if (!course?.id) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/comments/${course.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(res.data);
    } catch {
      message.error("Không thể tải bình luận");
    }
  }, [course?.id, token]);

  const fetchStudentCount = useCallback(async () => {
    if (!course?.id) return;
    try {
        const res = await axios.get(`http://localhost:5000/courses/${course.id}/students-count`);
        setStudentCount(res.data.total_students);
    } catch {
        message.error("Không thể tải số lượng học viên");
    }
    }, [course?.id]);


  const handleAddComment = async () => {
    if (!newComment.trim()) return message.warning("Vui lòng nhập nội dung bình luận");
    try {
      await axios.post(
        "http://localhost:5000/comments/add",
        { course_id: course.id, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Đã gửi bình luận!");
      setNewComment("");
      fetchComments();
    } catch {
      message.error("Gửi bình luận thất bại");
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchComments();
    fetchStudentCount();
  }, [fetchVideos, fetchComments, fetchStudentCount]);

  return (
    <div style={{ padding: 24 }}>
      <Card
        style={{
          background: "linear-gradient(135deg, #e0f7fa, #e3f2fd)",
          borderRadius: 12,
          overflow: "hidden",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ position: "relative" }}>
          {videos.length > 0 ? (
            <video
              controls
              style={{ width: "100%", borderRadius: "12px" }}
            >
              <source src={videos[0].url} type="video/mp4" />
            </video>
          ) : (
            <img
              src="https://cdn.dribbble.com/userupload/12056349/file/original-bf68cfef9a9e7edb23b157a4f6e71856.png"
              alt="preview"
              style={{ width: "100%", borderRadius: "12px" }}
            />
          )}
        </div>
      </Card>

      <div style={{ marginTop: 24 }}>
        <Title level={3}>{course.title}</Title>
        <Paragraph type="secondary">
          Giảng viên: <b>{course.teacher_name}</b> | {videos.length} video | {studentCount} học viên
        </Paragraph>

        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: "Tổng quan",
              children: (
                <>
                  <Title level={5}>Mô tả khóa học</Title>
                  <Paragraph>{course.description || "Chưa có mô tả chi tiết"}</Paragraph>
                </>
              ),
            },
            {
              key: "2",
              label: "Nội dung khóa học",
              children: (
                <>
                  <Divider orientation="left">Danh sách bài học</Divider>
                  {videos.length > 0 ? (
                    <List
                      dataSource={videos}
                      renderItem={(video) => (
                        <List.Item>
                          <PlayCircleOutlined style={{ marginRight: 10, color: "#1890ff" }} />
                          <span>{video.title}</span>
                          <Tag
                            icon={<ClockCircleOutlined />}
                            color="blue"
                            style={{ marginLeft: "auto" }}
                          >
                            {video.duration || "N/A"}
                          </Tag>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Paragraph>Chưa có video nào trong khóa học này.</Paragraph>
                  )}
                </>
              ),
            },
            {
              key: "3",
              label: "Bình luận",
              children: (
                <div>
                  <Title level={5}>Bình luận của học viên</Title>

                  <List
                    dataSource={comments}
                    locale={{ emptyText: "Chưa có bình luận nào." }}
                    renderItem={(cmt) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={
                            <div>
                              <b>{cmt.user_name || "Người dùng"}</b>{" "}
                              <span style={{ color: "#999", fontSize: 12 }}>
                                {new Date(cmt.created_at).toLocaleString()}
                              </span>
                            </div>
                          }
                          description={cmt.content}
                        />
                      </List.Item>
                    )}
                  />

                  <Divider />
                  <TextArea
                    rows={3}
                    placeholder="Viết bình luận..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div style={{ marginTop: 8, textAlign: "right" }}>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleAddComment}
                    >
                      Gửi
                    </Button>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
