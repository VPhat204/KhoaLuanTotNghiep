import { useEffect, useState } from "react";
import { List, Avatar, Card, message, Spin, Tag } from "antd";
import { UserOutlined, CalendarOutlined, MailOutlined } from "@ant-design/icons";
import axios from "axios";

export default function StudentList({ courseId }) {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchStudents = async () => {
      if (!courseId || !token) return;

      try {
        const res = await axios.get(`http://localhost:5000/courses/${courseId}/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStudents(res.data);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải danh sách học viên.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudents();
  }, [courseId, token]);

  return (
    <Card
      title={<b>👩‍🎓 Danh sách học viên khóa học #{courseId}</b>}
      style={{
        maxWidth: 800,
        margin: "40px auto",
        borderRadius: 12,
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      }}
    >
      {loading ? (
        <div style={{ textAlign: "center", padding: "40px 0" }}>
          <Spin tip="Đang tải danh sách học viên..." />
        </div>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={students}
          locale={{ emptyText: "⛔ Chưa có học viên nào đăng ký khóa học này." }}
          renderItem={(student) => (
            <List.Item
              style={{
                background: "#fafafa",
                borderRadius: 8,
                padding: "10px 16px",
                marginBottom: 8,
              }}
            >
              <List.Item.Meta
                avatar={<Avatar icon={<UserOutlined />} />}
                title={
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontWeight: "600" }}>{student.name}</span>
                    <Tag color="blue">ID: {student.id}</Tag>
                  </div>
                }
                description={
                  <div style={{ lineHeight: "1.6" }}>
                    <div>
                      <MailOutlined /> <b>Email:</b> {student.email}
                    </div>
                    <div>
                      <CalendarOutlined />{" "}
                      <b>Ngày đăng ký:</b>{" "}
                      {new Date(student.enrolled_at).toLocaleString("vi-VN")}
                    </div>
                  </div>
                }
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
}
