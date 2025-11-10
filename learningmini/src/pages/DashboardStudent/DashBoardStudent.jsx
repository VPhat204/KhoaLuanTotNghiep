import { useState } from "react";
import { Layout, Menu } from "antd";
import { DashboardOutlined, BookOutlined, TeamOutlined } from "@ant-design/icons";
import DashboardOverview from "./Dashboard/DashboardOverview";
import MyCourses from "./Course/MyCourse";
import MyQuizzes from "./Quizz/MyQuizz";
import "./DashboardStudent.css";

const { Sider, Content } = Layout;

function DashboardStudent() {
  const [selectedKey, setSelectedKey] = useState("dashboard");

  const renderContent = () => {
    switch (selectedKey) {
      case "dashboard":
        return <DashboardOverview />;
      case "mycourses":
        return <MyCourses />;
      case "myquizzes":
        return <MyQuizzes />;
      default:
        return null;
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
          <Menu.Item key="dashboard" icon={<DashboardOutlined />}>Tổng quan</Menu.Item>
          <Menu.Item key="mycourses" icon={<BookOutlined />}>Khóa học của tôi</Menu.Item>
          <Menu.Item key="myquizzes" icon={<TeamOutlined />}>Quiz của tôi</Menu.Item>
        </Menu>
      </Sider>
      <Layout style={{ padding: "20px", background: "#dcdcdc" }}>
        <Content>{renderContent()}</Content>
      </Layout>
    </Layout>
  );
}

export default DashboardStudent;
