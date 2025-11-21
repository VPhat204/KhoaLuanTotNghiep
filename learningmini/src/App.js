import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import HomePage from "./pages/HomePage/HomePage";
import CoursesPage from "./pages/CoursesPage/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage/CourseDetailPage";
import Courses from "./pages/DashboardStudent/Course/Courses"
import LoginPage from "./pages/LoginPage/Login";
import RegisterPage from "./pages/RegisterPage/Register";
import DashboardAdmin from "./pages/DashboardAdmin/DashboardAmin";
import DashboardTeacher from "./pages/DashboardTeacher/Dashboard/DashBoardTeacher";
import DashboardStudent from "./pages/DashboardStudent/Dashboard/DashBoardStudent";
import QuizPage from "./pages/QuizzPage/QuizzPage";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/my-courses" element={<Courses />} />
        <Route path="/quizz/:id" element={<QuizPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/admin-dashboard" element={<DashboardAdmin />} />
        <Route path="/teacher-dashboard" element={<DashboardTeacher />} />
        <Route path="/student-dashboard" element={<DashboardStudent />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
