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
import { useTranslation } from "react-i18next";

import UserManagement from "../Users/UserManagement";
import CourseManagement from "../Courses/CourseManagement";
import VideoManagement from "../Videos/VideoManagement";
import ScheduleManagement from "../Schedules/ScheduleManagement";

const { Sider, Content } = Layout;

function AdminDashboard() {
  const { t } = useTranslation();
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
            <Bar dataKey="student" fill="#34d399" name={t("student")} />
            <Bar dataKey="teacher" fill="#60a5fa" name={t("teacher")} />
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
            <Line type="monotone" dataKey="student" stroke="#34d399" strokeWidth={3} name={t("student")} />
            <Line type="monotone" dataKey="teacher" stroke="#60a5fa" strokeWidth={3} name={t("teacher")} />
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
                <h2>📊 {t("welcomeAdmin")}</h2>
                <p>
                  {t("totalUsers")}: <b>{totalUsers}</b>
                </p>
                <ul>
                  <li>{t("students")}: {students}</li>
                  <li>{t("teachers")}: {teachers}</li>
                  <li>{t("admins")}: {admin}</li>
                </ul>
              </div>

              <div className="calendar-card">
                <h3>
                  {new Date().toLocaleDateString(localStorage.getItem("lang") || "vi-VN", {
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
                title={t("monthlyAccounts")}
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
                    <option value="bar">{t("barChart")}</option>
                    <option value="line">{t("lineChart")}</option>
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
        return <UserManagement />;

      case "courses":
        return <CourseManagement />;

      case "schedules":
        return <ScheduleManagement />;

      case "videos":
        return <VideoManagement />;

      default:
        return <div>{t("pageNotFound")}</div>;
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
            {t("dashboard")}
          </Menu.Item>
          <Menu.Item key="users" icon={<UserOutlined />}>
            {t("userManagement")}
          </Menu.Item>
          <Menu.Item key="courses" icon={<BookOutlined />}>
            {t("courseManagement")}
          </Menu.Item>
          <Menu.Item key="schedules" icon={<BookOutlined />}>
            {t("scheduleManagement")}
          </Menu.Item>
          <Menu.Item key="videos" icon={<VideoCameraOutlined />}>
            {t("videoManagement")}
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
