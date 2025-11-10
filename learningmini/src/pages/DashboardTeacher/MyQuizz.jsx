import { Table, Form, Input, Button } from "antd";
import UploadQuizButton from "../../components/UploadQuizzButton/UploadQuizzButton";

export default function MyQuizzes({ quizzes, quizForm, onCreateQuiz }) {
  return (
    <div>
      <h3>Quiz của tôi</h3>
      <Table
        rowKey="id"
        dataSource={quizzes}
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "Tên Quiz", dataIndex: "title" },
          { title: "Khóa học", dataIndex: "course_id" },
          {
            title: "Upload File",
            render: (record) => <UploadQuizButton quizId={record.id} />,
          },
        ]}
      />
      <h4 style={{ marginTop: 20 }}>Upload Quiz (File JSON)</h4>
      <Form form={quizForm} layout="inline" onFinish={onCreateQuiz}>
        <Form.Item
          name="course_id"
          rules={[{ required: true, message: "Nhập ID khóa học" }]}
        >
          <Input placeholder="ID khóa học" />
        </Form.Item>
        <Form.Item
          name="title"
          rules={[{ required: true, message: "Nhập tên Quiz" }]}
        >
          <Input placeholder="Tên Quiz" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Upload Quiz
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
