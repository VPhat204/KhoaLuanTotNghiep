import { useState, useEffect } from "react";
import { Layout, Menu, Card, Form, message, Progress, Button } from "antd";
import {
  DashboardOutlined,
  BookOutlined,
  TeamOutlined,
  VideoCameraOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import api from "../../api";
import "./DashboardTeacher.css"; 
import MyCourses from "./MyCourse";
import StudentsList from "./StudentList";
import CreateCourse from "./CreateCourse";
import MyQuizzes from "./MyQuizz";
import UploadVideo from "./UploadVideo";

const { Sider, Content } = Layout;

function DashboardTeacher() {
  const [selectedKey, setSelectedKey] = useState("dashboard");
  const [teacherId, setTeacherId] = useState(null);
  const [dashboardData, setDashboardData] = useState({});
  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [videos, setVideos] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [setFileList] = useState([]);
  const [courseForm] = Form.useForm();
  const [quizForm] = Form.useForm();
  const [videoForm] = Form.useForm();

  const token = localStorage.getItem("token");

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setTeacherId(payload.id);
    }
  }, [token]);

  useEffect(() => {
    if (!teacherId) return;
    const endpoints = {
      dashboard: `/dashboard/teacher/${teacherId}`,
      mycourses: `/courses/mine`,
      myquizzes: `/quizzes/mine`,
      myvideos: `/videos/mine`,
    };
    const fetchData = async () => {
      try {
        const res = await api.get(endpoints[selectedKey]);
        if (selectedKey === "dashboard") setDashboardData(res.data);
        if (selectedKey === "mycourses") setCourses(res.data);
        if (selectedKey === "myquizzes") setQuizzes(res.data);
        if (selectedKey === "myvideos") setVideos(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    if (endpoints[selectedKey]) fetchData();
  }, [selectedKey, teacherId]);

  const fetchStudents = (courseId) => {
    api
      .get(`/courses/${courseId}/students`)
      .then((res) => setStudents(res.data))
      .catch((err) => console.error(err));
  };

  const handleCreateCourse = (values) => {
    api
      .post("/courses", values)
      .then((res) => {
        message.success("Tạo khóa học thành công!");
        setCourses((prev) => [...prev, { id: res.data.courseId, ...values }]);
        setSelectedKey("mycourses");
      })
      .catch(() => message.error("Tạo khóa học thất bại"));
  };

  const handleCreateQuiz = (values) => {
    api
      .post("/quizzes", values)
      .then((res) => {
        message.success("Tạo quiz thành công!");
        setQuizzes((prev) => [...prev, { id: res.data.quizId, ...values }]);
        quizForm.resetFields();
        setFileList([]);
      })
      .catch(() => message.error("Tạo quiz thất bại"));
  };

  const handleUploadVideo = (values) => {
    api
      .post("/videos", values)
      .then((res) => {
        message.success("Upload video thành công!");
        setVideos((prev) => [
          ...prev,
          { id: res.data.videoId, ...values, teacher_id: teacherId },
        ]);
      })
      .catch(() => message.error("Upload video thất bại"));
  };

  const renderContent = () => {
    switch (selectedKey) {
      case "dashboard":
        return (
          <div className="dashboard-container">
            <div className="dashboard-top">
              <Card className="welcome-card-container">
                <h2>📊 Chào mừng giáo viên!</h2>
                <p>Thống kê các hoạt động của bạn:</p>
                <ul>
                  <li>Khóa học: {dashboardData.my_courses ?? 0}</li>
                  <li>Học viên: {dashboardData.my_students ?? 0}</li>
                  <li>Quiz: {dashboardData.my_quizzes ?? 0}</li>
                  <li>Video: {dashboardData.my_videos ?? 0}</li>
                </ul>
              </Card>
              <Card className="calendar-card">
                <h3>
                  {new Date().toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <div className="calendar-placeholder">📅</div>
              </Card>
            </div>
            <div className="dashboard-middle">
              <Card className="chart-card" title="Learning Time">
                <div className="chart-circle">
                  <Progress type="circle" percent={65} format={() => "2h 35m"} />
                </div>
                <div className="chart-legend">
                  <span className="dot reading"></span> Reading
                  <span className="dot video"></span> Video
                  <span className="dot writing"></span> Writing
                </div>
              </Card>

              <Card className="chart-card" title="My Activity">
                <div className="activity-chart">📈</div>
              </Card>
            </div>

            <div className="dashboard-bottom">
              <Card className="courses-card" title="My Courses" extra={<span>All</span>}>
                {courses.slice(0, 3).map((c) => (
                  <div key={c.id} className="course-item">
                    <div>
                      <h4>{c.title}</h4>
                      <p>By {c.teacher_name}</p>
                    </div>
                    <div className="course-progress">
                      <Progress percent={25} showInfo={false} />
                      <span>⭐ 4.3</span>
                      <Button type="primary" size="small">View</Button>
                    </div>
                  </div>
                ))}
              </Card>

              <Card className="task-card" title="Upcoming Task" extra={<span>See all</span>}>
                <div className="task-item">
                  <h4>Discussion Algorithm</h4>
                  <p>08:00 AM - 15:00 PM</p>
                </div>
                <div className="task-item">
                  <h4>Simple Home Page Design</h4>
                  <p>08:00 AM - 15:00 PM</p>
                </div>
              </Card>
            </div>
          </div>
        );

     case "mycourses":
      return <MyCourses courses={courses} onViewStudents={(id) => {
        setSelectedCourse(id);
        fetchStudents(id);
        setSelectedKey("students");
      }} />;
      case "students":
        return <StudentsList students={students} courseId={selectedCourse} />;
      case "createcourse":
        return <CreateCourse courseForm={courseForm} onCreateCourse={handleCreateCourse} />;
      case "myquizzes":
        return <MyQuizzes quizzes={quizzes} quizForm={quizForm} onCreateQuiz={handleCreateQuiz} />;
      case "uploadvideo":
        return <UploadVideo videos={videos} videoForm={videoForm} onUploadVideo={handleUploadVideo} />;
      default:
        return <h2>Dashboard</h2>;
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
          <Menu.Item key="mycourses" icon={<BookOutlined />}>
            Khóa học của tôi
          </Menu.Item>
          <Menu.Item key="students" icon={<TeamOutlined />}>
            Học viên
          </Menu.Item>
          <Menu.Item key="createcourse" icon={<PlusOutlined />}>
            Tạo khóa học
          </Menu.Item>
          <Menu.Item key="myquizzes" icon={<BookOutlined />}>
            Quiz của tôi
          </Menu.Item>
          <Menu.Item key="uploadvideo" icon={<VideoCameraOutlined />}>
            Upload Video
          </Menu.Item>
        </Menu>
      </Sider>
      <Layout style={{ padding: "20px", background: "#f0f4f8" }}>
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

export default DashboardTeacher;
