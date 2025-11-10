import { Form, Input, Button } from "antd";

export default function CreateCourse({ courseForm, onCreateCourse }) {
  return (
    <div>
      <h3>Tạo khóa học mới</h3>
      <Form
        form={courseForm}
        layout="vertical"
        style={{ maxWidth: 400 }}
        onFinish={onCreateCourse}
      >
        <Form.Item
          name="title"
          label="Tên khóa học"
          rules={[{ required: true, message: "Vui lòng nhập tên khóa học" }]}
        >
          <Input placeholder="Nhập tên khóa học" />
        </Form.Item>
        <Form.Item
          name="description"
          label="Mô tả"
          rules={[{ required: true, message: "Vui lòng nhập mô tả" }]}
        >
          <Input.TextArea placeholder="Mô tả khóa học" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Tạo khóa học
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
