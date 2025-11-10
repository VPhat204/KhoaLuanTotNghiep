import logo from './logo.svg';
import './App.css';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.js</code> and save to reload.
        </p>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

export default App;
/*import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header/Header";
import Footer from "./components/Footer/Footer";
import HomePage from "./pages/HomePage/HomePage";
import CoursesPage from "./pages/CoursesPage/CoursesPage";
import CourseDetailPage from "./pages/CourseDetailPage/CourseDetailPage";
import LoginPage from "./pages/LoginPage/Login";
import RegisterPage from "./pages/RegisterPage/Register";
import ProfilePage from "./pages/ProfilePage/Profile";
import DashboardAdmin from "./pages/DashboardAdmin/DashboardAmin";
import DashboardTeacher from "./pages/DashboardTeacher/DashBoardTeacher";
import DashboardStudent from "./pages/DashboardStudent/DashBoardStudent";
import QuizPage from "./pages/QuizzPage/QuizzPage";

function App() {
  return (
    <Router>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/courses/:id" element={<CourseDetailPage />} />
        <Route path="/quizz/:id" element={<QuizPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/admin-dashboard" element={<DashboardAdmin />} />
        <Route path="/teacher-dashboard" element={<DashboardTeacher />} />
        <Route path="/student-dashboard" element={<DashboardStudent />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
 */