import { useState } from "react";
import { Layout, Menu } from "antd";
import { DashboardOutlined, BookOutlined, TeamOutlined, ReadOutlined, ScheduleOutlined } from "@ant-design/icons";
import DashboardOverview from "./DashboardOverview";
import ScheduleStudent from "../Schedules/ScheduleStudent";
import Courses from "../Course/Courses";
import TeacherList from "../Teachers/TeacherList";
import StudentAssignments from "../Assignment/AssignmentPage"

const { Sider, Content } = Layout;

function DashboardStudent() {
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const [refreshCourses, setRefreshCourses] = useState(false);

  const handleCourseEnrolled = () => {
    setRefreshCourses(prev => !prev);
  };

  const renderContent = () => {
    switch (selectedKey) {
      case "dashboard":
        return <DashboardOverview setSelectedKey={setSelectedKey}/>;
      case "mycourses":
        return <Courses refreshTrigger={refreshCourses} />;
      case "assignments":
        return <StudentAssignments />;
      case "schedules":
        return <ScheduleStudent />;
      case "teachers":
        return <TeacherList onCourseEnrolled={handleCourseEnrolled} />;
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
          <Menu.Item key="dashboard" icon={<DashboardOutlined />}>
            Tổng quan
          </Menu.Item>
          <Menu.Item key="teachers" icon={<TeamOutlined />}>
            Giảng viên
          </Menu.Item>
          <Menu.Item key="mycourses" icon={<BookOutlined />}>
            Khóa học của tôi
          </Menu.Item>
          <Menu.Item key="assignments" icon={<ReadOutlined />}>
            Bài tập
          </Menu.Item>
          <Menu.Item key="schedules" icon={<ScheduleOutlined />}>
            Lịch học
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout style={{ padding: "20px", background: "#dcdcdc" }}>
        <Content>{renderContent()}</Content>
      </Layout>
    </Layout>
  );
}

export default DashboardStudent;
