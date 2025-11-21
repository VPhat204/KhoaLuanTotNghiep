import { useState, useEffect } from "react";
import { Layout, Menu, Card } from "antd";
import axios from "axios";
import {
  UserOutlined,
  BookOutlined,
  VideoCameraOutlined,
  DashboardOutlined,
} from "@ant-design/icons";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import UserManagement from "./UserManagement";
import CourseManagement from "./CourseManagement"
import VideoManagement from "./VideoManagement"
import ScheduleManagement from "./ScheduleManagement"

const { Sider, Content } = Layout;

function AdminDashboard() {
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const [users, setUsers] = useState([]);
  const [chartType, setChartType] = useState("bar");

 useEffect(() => {
  const token = localStorage.getItem("token");
  if (!token) return;

  axios
    .get("http://localhost:5000/users", {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((res) => setUsers(res.data))
    .catch((err) => console.error(err));
}, []);


  const parseDate = (dateStr) => {
    if (!dateStr) return new Date();
    return new Date(dateStr.replace(" ", "T"));
  };

  const renderChart = () => {
    const months = [...Array(12)].map((_, i) => {
      const monthIndex = i;
      const monthLabel = `${i + 1 < 10 ? "0" : ""}${i + 1}/${new Date().getFullYear()}`;
      return {
        name: monthLabel,
        student: users.filter(
          (u) =>
            u.roles === "student" &&
            parseDate(u.created_at).getMonth() === monthIndex
        ).length,
        teacher: users.filter(
          (u) =>
            u.roles === "teacher" &&
            parseDate(u.created_at).getMonth() === monthIndex
        ).length,
      };
    });

    if (chartType === "bar") {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={months} margin={{ top: 20, bottom: 20 }}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="student" fill="#34d399" />
            <Bar dataKey="teacher" fill="#60a5fa" />
          </BarChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={months} margin={{ top: 20, bottom: 20 }}>
            <XAxis dataKey="name" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="student" stroke="#34d399" strokeWidth={3} />
            <Line type="monotone" dataKey="teacher" stroke="#60a5fa" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  const renderContent = () => {
    switch (selectedKey) {
      case "dashboard": {
        const totalUsers = users.length;
        const students = users.filter((u) => u.roles === "student").length;
        const teachers = users.filter((u) => u.roles === "teacher").length;
        const admin = users.filter((u) => u.roles === "admin").length;

        return (
          <div className="dashboard-container">
            <div className="dashboard-top">
              <div className="welcome-card">
                <h2>📊 Chào mừng Admin!</h2>
                <p>
                  Hệ thống hiện có <b>{totalUsers}</b> người dùng.
                </p>
                <ul>
                  <li>Students: {students}</li>
                  <li>Teachers: {teachers}</li>
                  <li>Admin: {admin}</li>
                </ul>
              </div>

              <div className="calendar-card">
                <h3>
                  {new Date().toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <div className="calendar-placeholder">📅</div>
              </div>
            </div>

            <div className="dashboard-middle">
              <Card
                className="chart-card"
                title="Số lượng account student & teacher theo tháng"
                extra={
                  <select
                    style={{
                      padding: "8px 14px",
                      borderRadius: "10px",
                      border: "1px solid #ddd",
                      fontSize: "14px",
                      color: "#444",
                      background: "#fff",
                      outline: "none",
                    }}
                    value={chartType}
                    onChange={(e) => setChartType(e.target.value)}
                  >
                    <option value="bar">Bar Chart</option>
                    <option value="line">Line Chart</option>
                  </select>
                }
              >
                {renderChart()}
              </Card>
            </div>
          </div>
        );
      }

      case "users":
        return <UserManagement/>;

      case "courses":
        return <CourseManagement/>;

      case "schedules":
        return <ScheduleManagement/>;

      case "videos":
        return <VideoManagement/>;

      default:
        return <div>Không tìm thấy trang</div>;
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={200} style={{ background: "#fff" }}>
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          style={{ height: "100%", borderRight: 0, paddingTop: "15px" }}
          onClick={(e) => setSelectedKey(e.key)}
        >
          <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
            Tổng quan
          </Menu.Item>
          <Menu.Item key="users" icon={<UserOutlined />}>
            Quản lý tài khoản
          </Menu.Item>
          <Menu.Item key="courses" icon={<BookOutlined />}>
            Quản lý khóa học
          </Menu.Item>
          <Menu.Item key="schedules" icon={<BookOutlined />}>
            Quản lý lịch học
          </Menu.Item>
          <Menu.Item key="videos" icon={<VideoCameraOutlined />}>
            Quản lý video
          </Menu.Item>
        </Menu>
      </Sider>

      <Layout style={{ padding: "20px", background: "#dcdcdc" }}>
        <Content
          style={{
            margin: 0,
            minHeight: 280,
            background: "transparent",
            borderRadius: 8,
          }}
        >
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default AdminDashboard;
