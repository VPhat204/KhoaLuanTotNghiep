import { useEffect, useState } from "react";
import { 
  Button, 
  Input, 
  message, 
  Collapse, 
  Table, 
  Tag,
  Progress,
  Empty,
  Spin
} from "antd";
import { 
  RocketOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  StarOutlined
} from "@ant-design/icons";
import api from "../../../api";
import "./Assignments.css";

const { Panel } = Collapse;
const { TextArea } = Input;

export default function StudentAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [answers, setAnswers] = useState({});
  const [grades, setGrades] = useState({});
  const [totalScores, setTotalScores] = useState({});
  const [questions, setQuestions] = useState({});
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const studentId = token ? JSON.parse(atob(token.split(".")[1])).id : null;

  useEffect(() => {
    if (!studentId) return;
    
    const fetchData = async () => {
      setLoading(true);
      try {
        const coursesRes = await api.get(`/users/${studentId}/courses`);
        const courses = coursesRes.data;
        
        if (!courses.length) {
          setLoading(false);
          return;
        }

        const assignmentsPromises = courses.map(c => 
          api.get(`/assignments/course/${c.id}`)
        );
        const assignmentsResults = await Promise.all(assignmentsPromises);
        
        let allAssignments = [];
        assignmentsResults.forEach(r => {
          allAssignments = allAssignments.concat(r.data);
        });
        
        setAssignments(allAssignments);

        const detailPromises = allAssignments.map(async (a) => {
          const [questionsRes, answersRes] = await Promise.all([
            api.get(`/assignments/${a.id}/questions`),
            api.get(`/assignments/${a.id}/answers/student/${studentId}`)
          ]);

          setQuestions(prev => ({ ...prev, [a.id]: questionsRes.data }));

          const initialAnswers = {};
          questionsRes.data.forEach(q => {
            initialAnswers[q.id] = "";
          });
          setAnswers(prev => ({ ...prev, [a.id]: initialAnswers }));

          const gradeMap = {};
          const answerMap = {};
          let total = 0;
          
          answersRes.data.forEach(ans => {
            gradeMap[ans.question_id] = ans.score;
            answerMap[ans.question_id] = ans.answer_text;
            if (ans.score != null) total += ans.score;
          });

          setGrades(prev => ({ ...prev, [a.id]: gradeMap }));
          setAnswers(prev => ({ 
            ...prev, 
            [a.id]: { ...initialAnswers, ...answerMap } 
          }));
          setTotalScores(prev => ({ ...prev, [a.id]: total }));
        });

        await Promise.all(detailPromises);
        
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu:", error);
        message.error("Không thể tải danh sách bài tập");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const handleChange = (assignmentId, questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [assignmentId]: { 
        ...(prev[assignmentId] || {}), 
        [questionId]: value 
      }
    }));
  };

  const handleSubmit = async (assignmentId) => {
    const assignmentAnswers = answers[assignmentId];
    
    if (!assignmentAnswers || Object.values(assignmentAnswers).every(val => !val)) {
      return message.warning("Vui lòng trả lời ít nhất một câu hỏi trước khi nộp bài.");
    }

    try {
      await api.post(`/assignments/${assignmentId}/submit-answers`, {
        answers: assignmentAnswers
      });
      
      message.success("🎉 Nộp bài thành công!");
      await loadGrades(assignmentId);
    } catch (err) {
      message.error("❌ Nộp bài thất bại!");
      console.error(err);
    }
  };

  const loadGrades = async (assignmentId) => {
    try {
      const res = await api.get(`/assignments/${assignmentId}/answers/student/${studentId}`);
      const gradeMap = {};
      let total = 0;
      
      res.data.forEach(ans => {
        gradeMap[ans.question_id] = ans.score;
        if (ans.score != null) total += ans.score;
      });
      
      setGrades(prev => ({ ...prev, [assignmentId]: gradeMap }));
      setTotalScores(prev => ({ ...prev, [assignmentId]: total }));
    } catch (err) {
      console.error(err);
    }
  };

  const getAssignmentStatus = (assignmentId) => {
    const assignmentGrades = grades[assignmentId] || {};
    const hasGrades = Object.keys(assignmentGrades).length > 0;
    const isGraded = Object.values(assignmentGrades).some(score => score != null);
    
    if (isGraded) return { status: 'graded', text: 'Đã chấm điểm' };
    if (hasGrades) return { status: 'submitted', text: 'Đã nộp bài' };
    return { status: 'pending', text: 'Chưa nộp' };
  };

  if (loading) {
    return (
      <div className="assignments-loading">
        <Spin size="large" />
        <p>Đang tải bài tập...</p>
      </div>
    );
  }

  return (
    <div className="student-assignments">
      <div className="assignments-header">
        <div className="header-content">
          <h1>
            <RocketOutlined /> Bài Tập Của Tôi
          </h1>
          <p>Quản lý và hoàn thành tất cả bài tập được giao</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-number">{assignments.length}</div>
            <div className="stat-label">Tổng bài tập</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {assignments.filter(a => getAssignmentStatus(a.id).status === 'graded').length}
            </div>
            <div className="stat-label">Đã chấm điểm</div>
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="assignments-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="Chưa có bài tập nào"
          >
            <Button type="primary">Khám phá khóa học</Button>
          </Empty>
        </div>
      ) : (
        <div className="assignments-grid">
          {assignments.map(assignment => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              questions={questions[assignment.id] || []}
              answers={answers[assignment.id] || {}}
              grades={grades[assignment.id] || {}}
              totalScore={totalScores[assignment.id]}
              onChange={handleChange}
              onSubmit={handleSubmit}
              status={getAssignmentStatus(assignment.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AssignmentCard({ 
  assignment, 
  questions, 
  answers, 
  grades, 
  totalScore, 
  onChange, 
  onSubmit,
  status 
}) {
  const completionRate = questions.length > 0 
    ? (Object.values(answers).filter(a => a.trim()).length / questions.length) * 100 
    : 0;

  return (
    <div className="assignment-card">
      <div className="assignment-card-header">
        <div className="assignment-title-section">
          <h3 className="assignment-title">
            <FileTextOutlined /> {assignment.title}
          </h3>
          <Tag 
            color={
              status.status === 'graded' ? 'green' : 
              status.status === 'submitted' ? 'blue' : 'orange'
            }
            className="status-tag"
          >
            {status.status === 'graded' ? <CheckCircleOutlined /> : 
             status.status === 'submitted' ? <ClockCircleOutlined /> : <StarOutlined />}
            {status.text}
          </Tag>
        </div>
        
        <div className="assignment-meta">
          <div className="meta-item">
            <span className="meta-label">Điểm tối đa:</span>
            <span className="meta-value">{assignment.total_points}</span>
          </div>
          {totalScore != null && (
            <div className="meta-item highlight">
              <span className="meta-label">Điểm của bạn:</span>
              <span className="meta-value">{totalScore}</span>
            </div>
          )}
        </div>
      </div>

      <div className="assignment-progress">
        <div className="progress-info">
          <span>Tiến độ hoàn thành</span>
          <span>{completionRate.toFixed(0)}%</span>
        </div>
        <Progress 
          percent={completionRate} 
          size="small"
          strokeColor={{
            '0%': '#4096ff',
            '100%': '#70b6ff',
          }}
          showInfo={false}
        />
      </div>

      <Collapse 
        className="questions-collapse"
        expandIconPosition="end"
      >
        <Panel 
          header={
            <div className="collapse-header">
              <span>📝 {questions.length} câu hỏi</span>
              <span className="questions-count">
                {Object.values(answers).filter(a => a.trim()).length}/{questions.length} đã trả lời
              </span>
            </div>
          } 
          key="questions"
        >
          <QuestionList 
            assignmentId={assignment.id}
            questions={questions}
            answers={answers}
            grades={grades}
            onChange={onChange}
          />
        </Panel>
      </Collapse>

      <div className="assignment-actions">
        <Button 
          type="primary" 
          onClick={() => onSubmit(assignment.id)}
          className="submit-button"
          icon={<RocketOutlined />}
          disabled={completionRate === 0}
        >
          Nộp Bài Tập
        </Button>
      </div>
    </div>
  );
}

function QuestionList({ assignmentId, questions, answers, grades, onChange }) {
  if (!questions.length) {
    return (
      <div className="questions-empty">
        <Empty
          description="Chưa có câu hỏi nào"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  const isGraded = Object.values(grades).some(score => score != null);

  if (isGraded) {
    return (
      <div className="graded-answers">
        <h4>📊 Kết quả bài làm</h4>
        <Table
          className="answers-table"
          columns={[
            { 
              title: "Câu hỏi", 
              dataIndex: "question_text",
              render: (text, record) => (
                <div>
                  <div className="question-text-table">{text}</div>
                  <div className="question-points-table">{record.points} điểm</div>
                </div>
              )
            },
            { 
              title: "Câu trả lời của bạn", 
              dataIndex: "answer_text",
              render: (text) => (
                <div className="answer-text">
                  {text || <span className="no-answer">Chưa trả lời</span>}
                </div>
              )
            },
            { 
              title: "Điểm", 
              dataIndex: "score", 
              render: (score, record) => (
                <div className="score-display">
                  {score != null ? (
                    <Tag color={score >= record.points * 0.8 ? 'green' : score >= record.points * 0.5 ? 'orange' : 'red'}>
                      {score}/{record.points}
                    </Tag>
                  ) : (
                    <Tag color="default">Chưa chấm</Tag>
                  )}
                </div>
              )
            },
          ]}
          dataSource={questions.map(q => ({
            key: q.id,
            question_text: q.question_text,
            answer_text: answers[q.id] || "",
            score: grades[q.id],
            points: q.points
          }))}
          pagination={false}
        />
      </div>
    );
  }

  return (
    <div className="questions-list">
      {questions.map((question, index) => (
        <div key={question.id} className="question-item">
          <div className="question-header">
            <span className="question-number">Câu {index + 1}</span>
            <Tag color="blue" className="points-tag">
              {question.points} điểm
            </Tag>
          </div>
          
          <div className="question-content">
            <p className="question-text">{question.text}</p>
            
            <div className="answer-section">
              <TextArea
                className="answer-textarea"
                value={answers[question.id] || ""}
                onChange={(e) => onChange(assignmentId, question.id, e.target.value)}
                placeholder="Nhập câu trả lời của bạn..."
                rows={4}
                showCount
                maxLength={1000}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}