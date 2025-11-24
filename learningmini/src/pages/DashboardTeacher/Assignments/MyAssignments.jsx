import { useEffect, useState } from "react";
import { Card, Button, Modal, Form, Input, Select, message, Table, Popconfirm } from "antd";
import api from "../../../api";

export default function MyAssignments() {
  const [courses, setCourses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [visibleAssignmentModal, setVisibleAssignmentModal] = useState(false);
  const [visibleQuestionModal, setVisibleQuestionModal] = useState(false);
  const [currentAssignment, setCurrentAssignment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [grading, setGrading] = useState({});
  const [form] = Form.useForm();
  const [questionForm] = Form.useForm();

  useEffect(() => {
    api.get("/courses").then(res => {
      setCourses(res.data);
      if (res.data.length > 0) setSelectedCourse(res.data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedCourse) return;
    setAssignments([]);
    setSubmissions([]);
    setCurrentAssignment(null);
    setQuestions([]);
    api.get(`/assignments/course/${selectedCourse}`).then(res => setAssignments(res.data));
  }, [selectedCourse]);

  const handleCreateAssignment = (values) => {
    api.post("/assignments", values)
      .then(() => {
        message.success("Tạo bài tập thành công!");
        form.resetFields();
        setVisibleAssignmentModal(false);
        api.get(`/assignments/course/${selectedCourse}`).then(res => setAssignments(res.data));
      })
      .catch(() => message.error("Lỗi tạo bài tập"));
  };

  const handleAddQuestion = (values) => {
    api.post(`/assignments/${currentAssignment}/questions`, values)
      .then(() => {
        message.success("Thêm câu hỏi thành công!");
        questionForm.resetFields();
        loadQuestions(currentAssignment);
      })
      .catch(err => {
        console.error(err);
        message.error(err.response?.data?.message || "Lỗi thêm câu hỏi");
      });
  };

  const loadQuestions = (assignmentId) => {
    api.get(`/assignments/${assignmentId}/questions`).then(res => setQuestions(res.data));
  };

  const handleDeleteQuestion = (questionId) => {
    api.delete(`/assignments/${currentAssignment}/questions/${questionId}`)
      .then(() => {
        message.success("Xóa câu hỏi thành công!");
        loadQuestions(currentAssignment);
      })
      .catch(() => message.error("Lỗi xóa câu hỏi"));
  };

  const viewSubmissions = async (assignmentId) => {
    const res = await api.get(`/assignments/${assignmentId}/submissions`);
    const submissionsWithAnswers = await Promise.all(
      res.data.map(async sub => {
        const answersRes = await api.get(`/assignments/${assignmentId}/answers/student/${sub.student_id}`);
        return { ...sub, answers: answersRes.data };
      })
    );
    setSubmissions(submissionsWithAnswers);
    setCurrentAssignment(assignmentId);
    const newGrading = {};
    submissionsWithAnswers.forEach(sub => {
      newGrading[sub.submission_id] = {};
      sub.answers.forEach(a => newGrading[sub.submission_id][a.question_id] = a.score ?? 0);
    });
    setGrading(newGrading);
  };

const handleChangeScore = (submissionId, questionId, value) => {
  setGrading(prev => ({
    ...prev,
    [submissionId]: { ...prev[submissionId], [questionId]: value !== "" ? Number(value) : undefined },
  }));
};

const confirmGrading = async () => {
  try {
    const payload = [];
    console.log(submissions.map(s => ({ id: s.id, student_id: s.student_id })));
    submissions.forEach(sub => {
      sub.answers.forEach(a => {
        const score = grading[sub.submission_id]?.[a.question_id];
        if (score !== undefined && sub.submission_id != null && a.question_id != null) {
          payload.push({
            submission_id: sub.submission_id,
            question_id: a.question_id,
            score: Number(score)
          });
        } else {
          console.warn("Bỏ qua grade không hợp lệ:", { question_id: a.question_id, score });
        }
      });
    });

    if (payload.length === 0) {
      message.warning("Chưa nhập điểm hợp lệ nào!");
      return;
    }

    if (!currentAssignment) {
      message.error("Không xác định được bài tập.");
      return;
    }

    await api.post(`/assignments/${currentAssignment}/grade-answers-bulk`, { grades: payload });
    message.success("Đã gửi điểm thành công!");

    viewSubmissions(currentAssignment);

  } catch (err) {
    console.error(err);
    message.error("Lỗi khi gửi điểm!");
  }
};


  const handleDeleteAnswer = (studentId, questionId) => {
    api.delete(`/assignments/${currentAssignment}/answers/${studentId}/${questionId}`)
      .then(() => {
        message.success("Đã xóa câu trả lời!");
        viewSubmissions(currentAssignment);
      })
      .catch(() => message.error("Lỗi xóa câu trả lời"));
  };

  const handleDeleteSubmission = (studentId) => {
    api.delete(`/assignments/${currentAssignment}/submissions/${studentId}`)
      .then(() => {
        message.success("Đã xóa toàn bộ bài nộp của học viên!");
        viewSubmissions(currentAssignment);
      })
      .catch(() => message.error("Lỗi xóa bài nộp"));
  };

  const submissionColumns = [
    { title: "Học viên", dataIndex: "student_name" },
    {
      title: "Câu trả lời & Chấm điểm",
      render: (_, record) => (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 5 }}>
          {(record.answers || []).map((a, index) => (
            <div key={a.question_id} style={{ borderBottom: "1px solid #eee", paddingBottom: 5, marginBottom: 8 }}>
              <p><b>Câu {index + 1}:</b> {a.answer_text}</p>
              <Input
                type="number"
                min={0}
                placeholder="Điểm"
                value={grading[record.submission_id]?.[a.question_id] ?? 0}
                onChange={e => handleChangeScore(record.submission_id, a.question_id, e.target.value)}
                style={{ width: 100, marginRight: 10 }}
              />
              <Popconfirm
                title="Xóa câu trả lời này?"
                onConfirm={() => handleDeleteAnswer(record.student_id, a.question_id)}
              >
                <Button danger size="small">Xóa</Button>
              </Popconfirm>
            </div>
          ))}
          <Popconfirm
            title="Xóa toàn bộ bài nộp của học viên?"
            onConfirm={() => handleDeleteSubmission(record.student_id)}
          >
            <Button danger style={{ marginTop: 5 }}>Xóa bài nộp</Button>
          </Popconfirm>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Card title="Bài tập" extra={<Button onClick={() => setVisibleAssignmentModal(true)}>+ Tạo bài tập</Button>}>
        <Select
          style={{ marginBottom: 15, width: 200 }}
          value={selectedCourse}
          onChange={val => setSelectedCourse(val)}
          options={courses.map(c => ({ label: c.title, value: c.id }))}
        />
        {assignments.map(a => (
          <Card key={a.id} style={{ marginBottom: 10 }}>
            <h3>{a.title}</h3>
            <p>Điểm tối đa: {a.total_points}</p>
            <Button onClick={() => { setCurrentAssignment(a.id); setVisibleQuestionModal(true); loadQuestions(a.id); }}>
              + Thêm câu hỏi
            </Button>
            <Button style={{ marginLeft: 10 }} onClick={() => viewSubmissions(a.id)}>
              Xem bài nộp
            </Button>
          </Card>
        ))}
      </Card>

      <Modal
        open={visibleAssignmentModal}
        onCancel={() => setVisibleAssignmentModal(false)}
        onOk={() => form.submit()}
        title="Tạo bài tập mới"
      >
        <Form form={form} layout="vertical" onFinish={handleCreateAssignment}>
          <Form.Item name="course_id" label="Khóa học" initialValue={selectedCourse} rules={[{ required: true }]}>
            <Select options={courses.map(c => ({ label: c.title, value: c.id }))} />
          </Form.Item>
          <Form.Item name="title" label="Tiêu đề" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="total_points" label="Điểm tối đa"><Input type="number" /></Form.Item>
        </Form>
      </Modal>

      <Modal
        open={visibleQuestionModal}
        onCancel={() => setVisibleQuestionModal(false)}
        onOk={() => questionForm.submit()}
        title="Thêm câu hỏi"
      >
        <Form form={questionForm} layout="vertical" onFinish={handleAddQuestion}>
          <Form.Item name="question_text" label="Câu hỏi" rules={[{ required: true }]}><Input.TextArea /></Form.Item>
          <Form.Item name="points" label="Điểm" rules={[{ required: true }]}><Input type="number" /></Form.Item>
        </Form>
        {questions.length > 0 && (
          <div style={{ marginTop: 15 }}>
            <h4>Danh sách câu hỏi:</h4>
            <ul>
              {questions.map(q => (
                <li key={q.id}>
                  {q.question_text} ({q.points} điểm)
                  <Popconfirm title="Xóa câu hỏi này?" onConfirm={() => handleDeleteQuestion(q.id)}>
                    <Button danger size="small" style={{ marginLeft: 10 }}>Xóa</Button>
                  </Popconfirm>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Modal>

      {submissions.length > 0 && (
        <Card title="Danh sách bài nộp"
          extra={
            <>
              <Button type="primary" onClick={confirmGrading}> Xác nhận chấm điểm</Button>
              <Button style={{ marginLeft: 10 }} onClick={() => setSubmissions([])}>Đóng</Button>
            </>
          }
        >
          <Table columns={submissionColumns} dataSource={submissions} rowKey="id" />
        </Card>
      )}
    </div>
  );
}
