import { useState, useEffect } from "react";
import { Card, Progress, Button } from "antd";
import api from "../../../api";

function DashboardOverview() {
  const [dashboardData, setDashboardData] = useState({});
  const [courses, setCourses] = useState([]);
  const token = localStorage.getItem("token");
  const [studentId, setStudentId] = useState(null);

  useEffect(() => {
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setStudentId(payload.id);
    }
  }, [token]);

  useEffect(() => {
    if (!studentId) return;
    api
      .get(`/dashboard/student/${studentId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setDashboardData(res.data))
      .catch((err) => console.log(err));
    api
      .get(`/enrollments/student/${studentId}`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => setCourses(res.data))
      .catch((err) => console.log(err));
  }, [studentId, token]);

  return (
    <div className="dashboard-container">
      <div className="dashboard-top">
        <div className="welcome-card">
          <h2>Hi {dashboardData.name || "Student"}!</h2>
          <p>
            You have completed <b>{dashboardData.lessons_done || 5}</b> lessons in the last day.
          </p>
        </div>
        <div className="calendar-card">
          <h3>June 28 Monday</h3>
          <div className="calendar-placeholder">📅</div>
        </div>
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
}

export default DashboardOverview;
