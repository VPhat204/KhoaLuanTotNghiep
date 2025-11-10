import { Layout, Menu } from "antd";
import {
  DashboardOutlined,
  UserOutlined,
  BookOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";

const { Sider } = Layout;

function SideBar({ role }) {
  const menuItems = [
    {
      key: "dashboard",
      icon: <DashboardOutlined />,
      label: <Link to={`/${role}-dashboard`}>Dashboard</Link>,
    },
    ...(role === "admin"
      ? [
          {
            key: "users",
            icon: <UserOutlined />,
            label: <Link to="/admin/users">Quản lý người dùng</Link>,
          },
          {
            key: "courses",
            icon: <BookOutlined />,
            label: <Link to="/admin/courses">Quản lý khóa học</Link>,
          },
        ]
      : []),
    ...(role === "teacher"
      ? [
          {
            key: "mycourses",
            icon: <BookOutlined />,
            label: <Link to="/courses">Khóa học của tôi</Link>,
          },
          {
            key: "students",
            icon: <TeamOutlined />,
            label: <Link to="/students">Học viên</Link>,
          },
        ]
      : []),
    ...(role === "student"
      ? [
          {
            key: "courses",
            icon: <BookOutlined />,
            label: <Link to="/student/my-courses">Khóa học đã đăng ký</Link>,
          },
        ]
      : []),
  ];

  return (
    <Sider width={200} style={{ background: "#fff" }}>
      <Menu
        mode="inline"
        defaultSelectedKeys={["dashboard"]}
        style={{ height: "100%", borderRight: 0 }}
        items={menuItems} 
      />
    </Sider>
  );
}

export default SideBar;
