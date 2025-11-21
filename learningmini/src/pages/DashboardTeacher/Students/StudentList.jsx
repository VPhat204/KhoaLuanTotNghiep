import { useEffect, useState } from "react";
import axios from "axios";
import "./StudentList.css";

function StudentList() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/courses/mine", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data);
        if (res.data.length > 0) {
          setSelectedCourse(res.data[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  useEffect(() => {
    const fetchStudents = async () => {
      if (!selectedCourse) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/course-students", {
          headers: { Authorization: `Bearer ${token}` },
          params: { courseId: selectedCourse.id },
        });
        setStudents(res.data.students);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, [selectedCourse]);

  return (
    <div className="my-courses-container">
      <h1>Khóa học của tôi</h1>
      <div className="course-select">
        <label>Chọn khóa học:</label>
        <select
          value={selectedCourse?.id || ""}
          onChange={(e) =>
            setSelectedCourse(courses.find(c => c.id === parseInt(e.target.value)))
          }
        >
          {courses.map(c => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
      </div>
      {selectedCourse && <h2 className="course-title">{selectedCourse.title}</h2>}
      <div>
        {loading ? (
          <p>Đang tải danh sách học viên...</p>
        ) : (
          <table className="students-table">
            <thead>
              <tr>
                <th>STT</th>
                <th>Tên học viên</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Giới tính</th>
                <th>Ngày đăng ký</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s, idx) => (
                <tr key={s.student_id}>
                  <td>{idx + 1}</td>
                  <td>{s.student_name}</td>
                  <td>{s.email}</td>
                  <td>{s.phone || "-"}</td>
                  <td>{s.gender}</td>
                  <td>{new Date(s.enrolled_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default StudentList;
