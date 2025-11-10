import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, Radio, Button, message, Spin } from "antd";
import api from "../../api";

function QuizPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuiz = async () => {
      try {
        const res = await api.get(`/student/quiz/${id}`);
        setQuiz(res.data);
      } catch (err) {
        console.error(err);
        message.error("Không thể tải quiz");
      } finally {
        setLoading(false);
      }
    };
    fetchQuiz();
  }, [id]);

  const handleChange = (questionId, optionId) => {
    setAnswers({ ...answers, [questionId]: optionId });
  };

  const handleSubmit = async () => {
    try {
      await api.post(`/student/quiz/${id}/submit`, { answers });
      message.success("Nộp bài thành công!");
      navigate(-1); 
    } catch (err) {
      console.error(err);
      message.error("Nộp bài thất bại");
    }
  };

  if (loading) return <Spin tip="Đang tải..." style={{ display: "block", marginTop: 50 }} />;

  if (!quiz) return <p>Quiz không tồn tại</p>;

  return (
    <div style={{ padding: 24 }}>
      <h2>{quiz.title}</h2>
      <p>{quiz.description}</p>
      {quiz.questions.map((q) => (
        <Card key={q.id} style={{ marginBottom: 16 }}>
          <p>{q.question_text}</p>
          {q.question_type === "mcq" && (
            <Radio.Group onChange={(e) => handleChange(q.id, e.target.value)} value={answers[q.id]}>
              {q.options.map((opt) => (
                <Radio key={opt.id} value={opt.id}>{opt.option_text}</Radio>
              ))}
            </Radio.Group>
          )}
        </Card>
      ))}
      <Button type="primary" onClick={handleSubmit}>Nộp bài</Button>
    </div>
  );
}

export default QuizPage;
