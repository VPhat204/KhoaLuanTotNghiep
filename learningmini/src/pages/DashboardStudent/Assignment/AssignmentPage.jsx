import { useEffect, useState } from "react";
import { 
  Button, 
  Input, 
  message, 
  Collapse, 
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
import { useTranslation } from "react-i18next";
import api from "../../../api";
import "./Assignments.css";

const { Panel } = Collapse;
const { TextArea } = Input;

export default function StudentAssignments() {
  const { t } = useTranslation();
  const [assignments, setAssignments] = useState([]);
  const [answers, setAnswers] = useState({});
  const [grades, setGrades] = useState({});
  const [totalScores, setTotalScores] = useState({});
  const [questions, setQuestions] = useState({});
  const [loading, setLoading] = useState(true);
  const [messageApi, contextHolder] = message.useMessage();

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
        console.error(error);
        messageApi.error(t('assignments.messages.loadError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId, messageApi, t]);

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
      return messageApi.warning(t('assignments.messages.answerRequired'));
    }

    try {
      await api.post(`/assignments/${assignmentId}/submit-answers`, {
        answers: assignmentAnswers
      });
      
      messageApi.success(t('assignments.messages.submitSuccess'));
      await loadGrades(assignmentId);
    } catch (err) {
      messageApi.error(t('assignments.messages.submitError'));
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
    
    if (isGraded) return { status: 'graded', text: t('assignments.status.graded') };
    if (hasGrades) return { status: 'submitted', text: t('assignments.status.submitted') };
    return { status: 'pending', text: t('assignments.status.pending') };
  };

  if (loading) {
    return (
      <div className="assignments-loading">
        {contextHolder}
        <Spin size="large" />
        <p>{t('assignments.loading')}</p>
      </div>
    );
  }

  return (
    <div className="student-assignments">
      {contextHolder}
      <div className="assignments-header">
        <div className="header-content">
          <h1>
            <RocketOutlined /> {t('assignments.title')}
          </h1>
          <p>{t('assignments.subtitle')}</p>
        </div>
        <div className="header-stats">
          <div className="stat-card">
            <div className="stat-number">{assignments.length}</div>
            <div className="stat-label">{t('assignments.stats.total')}</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {assignments.filter(a => getAssignmentStatus(a.id).status === 'graded').length}
            </div>
            <div className="stat-label">{t('assignments.stats.graded')}</div>
          </div>
        </div>
      </div>

      {assignments.length === 0 ? (
        <div className="assignments-empty">
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={t('assignments.empty.noAssignments')}
          >
            <Button type="primary">{t('assignments.actions.exploreCourses')}</Button>
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
  const { t } = useTranslation();
  
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
            <span className="meta-label">{t('assignments.maxScore')}:</span>
            <span className="meta-value">{assignment.total_points}</span>
          </div>
          {totalScore != null && (
            <div className="meta-item highlight">
              <span className="meta-label">{t('assignments.yourScore')}:</span>
              <span className="meta-value">{totalScore}</span>
            </div>
          )}
        </div>
      </div>

      <div className="assignment-progress">
        <div className="progress-info">
          <span>{t('assignments.progress.completion')}</span>
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
              <span className="questions-count">
                {Object.values(answers).filter(a => a.trim()).length}/{questions.length} {t('assignments.progress.answered')}
              </span>
            </div>
          } 
          key={assignment.id}
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
          {t('assignments.actions.submit')}
        </Button>
      </div>
    </div>
  );
}

function QuestionList({ assignmentId, questions, answers, grades, onChange }) {
  const { t } = useTranslation();

  if (!questions.length) {
    return (
      <div className="questions-empty">
        <Empty
          description={t('assignments.empty.noQuestions')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </div>
    );
  }

  return (
    <div className="questions-list">
      {questions.map((question, index) => {
        const userAnswer = answers[question.id] || "";
        const score = grades[question.id];

        return (
          <div key={question.id} className="question-item">
            <div className="question-header">
              <span className="question-number">{question.question_text}</span>
              <Tag color="blue" className="points-tag">
                {question.points} {t('assignments.points')}
              </Tag>
            </div>

            <div className="question-content">
              <p className="question-text">{question.text}</p>

              <div className="answer-section">
                <TextArea
                  className="answer-textarea"
                  value={userAnswer}
                  onChange={
                    score == null
                      ? (e) => onChange(assignmentId, question.id, e.target.value)
                      : undefined
                  }
                  placeholder={score == null ? t('assignments.placeholder.enterAnswer') : ""}
                  rows={4}
                  showCount
                  maxLength={1000}
                  disabled={score != null}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}