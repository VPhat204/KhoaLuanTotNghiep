import { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { Button, message, Progress } from "antd";
import { useTranslation } from "react-i18next";
import CourseDetail from "./CourseDetail";
import "./Course.css";

export default function Courses({ refreshTrigger }) {
  const { t } = useTranslation();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unenrolling, setUnenrolling] = useState({});
  const [progressData, setProgressData] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);

  const getInitial = (title) => title ? title.charAt(0).toUpperCase() : 'C';

  const fetchMyCourses = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user"));
      const res = await axios.get(
        `http://localhost:5000/users/${user.id}/courses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourses(res.data);
      const progressPromises = res.data.map(async (course) => {
        try {
          const progressRes = await axios.get(
            `http://localhost:5000/courses/${course.id}/progress`,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: { studentId: user.id }
            }
          );
          return { courseId: course.id, progress: progressRes.data.progress || 0 };
        } catch {
          return { courseId: course.id, progress: 0 };
        }
      });
      const progressResults = await Promise.all(progressPromises);
      const progressMap = {};
      progressResults.forEach(result => { progressMap[result.courseId] = result.progress; });
      setProgressData(progressMap);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUnenroll = async (courseId, courseTitle) => {
    try {
      setUnenrolling(prev => ({ ...prev, [courseId]: true }));
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/courses/${courseId}/unenroll`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success(t('mycourses.messages.unenrollSuccess', { courseTitle }));
      fetchMyCourses();
    } catch {
      message.error(t('mycourses.messages.unenrollError'));
    } finally {
      setUnenrolling(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleViewDetail = (course) => setSelectedCourse(course);
  const handleBack = () => setSelectedCourse(null);

  useEffect(() => { fetchMyCourses(); }, [refreshTrigger, fetchMyCourses]);

  return (
    <div className="courses-container">
      <h1>{t('mycourses.title')}</h1>
      {selectedCourse ? (
        <div>
          <Button onClick={handleBack} style={{ marginBottom: 16 }}>
            &lt; {t('mycourses.actions.back')}
          </Button>
          <CourseDetail course={selectedCourse} />
        </div>
      ) : loading ? (
        <p>{t('mycourses.loading')}</p>
      ) : courses.length === 0 ? (
        <div className="no-courses">
          <p>{t('mycourses.noCourses')}</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => {
            const progress = progressData[course.id] || 0;
            return (
              <div key={course.id} className="course-card">
                <div className="course-header">
                  <div className="course-avatar">{getInitial(course.title)}</div>
                  <div className="course-title-section">
                    <h3>{course.title}</h3>
                    <span className="course-teacher">{t('mycourses.teacher')}: {course.teacher_name}</span>
                  </div>
                </div>
                <p className="course-description">{course.description}</p>
                <div className="progress-section">
                  <div className="progress-info">
                    <span className="progress-label">{t('mycourses.progress')}: </span>
                    <span className="progress-value">{progress}%</span>
                  </div>
                  <Progress 
                    percent={progress} 
                    size="small"
                    strokeColor={{ '0%': '#4096ff', '100%': '#70b6ff' }}
                    showInfo={false}
                    style={{ width: '100%' }}
                  />
                </div>
                <div className="course-meta">
                  <span className="enrolled-date">{t('mycourses.enrolledDate')}: {new Date(course.enrolled_at).toLocaleDateString()}</span>
                </div>
                <div className="course-footer">
                  <Button 
                    danger 
                    onClick={() => handleUnenroll(course.id, course.title)}
                    loading={unenrolling[course.id]}
                    className="unenroll-btn"
                  >
                    {t('mycourses.actions.unenroll')}
                  </Button>
                  <Button 
                    type="primary" 
                    onClick={() => handleViewDetail(course)}
                    className="view-detail-btn"
                  >
                    {t('mycourses.actions.viewDetail')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}