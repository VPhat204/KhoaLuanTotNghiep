import { Table, Form, Input, Button } from "antd";

function UploadVideo({ videos, videoForm, onUploadVideo }) {
  return (
    <div>
      <h3>Video của tôi</h3>
      <Table
        rowKey="id"
        dataSource={videos}
        columns={[
          { title: "ID", dataIndex: "id" },
          { title: "Tiêu đề", dataIndex: "title" },
          { title: "URL", dataIndex: "url" },
        ]}
      />
      <h3 style={{ marginTop: 20 }}>Upload Video YouTube</h3>
      <Form form={videoForm} layout="inline" onFinish={onUploadVideo}>
        <Form.Item
          name="course_id"
          rules={[{ required: true, message: "Nhập ID khóa học" }]}
        >
          <Input placeholder="ID khóa học" />
        </Form.Item>
        <Form.Item
          name="title"
          rules={[{ required: true, message: "Nhập tiêu đề video" }]}
        >
          <Input placeholder="Tiêu đề video" />
        </Form.Item>
        <Form.Item
          name="url"
          rules={[{ required: true, message: "Nhập URL YouTube" }]}
        >
          <Input placeholder="URL YouTube" />
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit">
            Upload Video
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
export default UploadVideo;
