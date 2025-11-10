import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Form, Input, Button, message, Select, Upload } from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;

function RegisterPage() {
  const navigate = useNavigate();
  const [fileList, setFileList] = useState([]);

  const onFinish = async (values) => {
    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("roles", values.role);
      if (values.role === "teacher") {
        formData.append("proof_info", values.proof_info);
        if (fileList[0]) formData.append("proof_file", fileList[0].originFileObj);
      }

      await axios.post("http://localhost:5000/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      message.success(
        values.role === "teacher"
          ? "Đăng ký giảng viên thành công. Chờ admin duyệt."
          : "Đăng ký học viên thành công!"
      );
      navigate("/login");
    } catch (err) {
      message.error(err.response?.data?.message || "Đăng ký thất bại!");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f5f5f5" }}>
      <div style={{ background: "#fff", padding: 30, borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", width: 400 }}>
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Đăng ký</h2>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="name" rules={[{ required: true, message: "Nhập tên" }]}>
            <Input placeholder="Họ và tên" />
          </Form.Item>
          <Form.Item name="email" rules={[{ required: true, message: "Nhập email" }]}>
            <Input placeholder="Email" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: "Nhập mật khẩu" }]}>
            <Input.Password placeholder="Mật khẩu" />
          </Form.Item>
          <Form.Item
            name="confirmPassword"
            dependencies={["password"]}
            rules={[
              { required: true, message: "Xác nhận mật khẩu" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) return Promise.resolve();
                  return Promise.reject(new Error("Mật khẩu không khớp!"));
                },
              }),
            ]}
          >
            <Input.Password placeholder="Xác nhận mật khẩu" />
          </Form.Item>
          <Form.Item name="role" rules={[{ required: true, message: "Chọn vai trò" }]}>
            <Select placeholder="Chọn vai trò">
              <Option value="student">Học viên</Option>
              <Option value="teacher">Giảng viên</Option>
            </Select>
          </Form.Item>

          {/* Chỉ hiện khi chọn teacher */}
          <Form.Item noStyle shouldUpdate={(prev, cur) => prev.role !== cur.role}>
            {({ getFieldValue }) =>
              getFieldValue("role") === "teacher" && (
                <>
                  <Form.Item name="proof_info" rules={[{ required: true, message: "Nhập thông tin bằng cấp" }]}>
                    <Input.TextArea placeholder="Bằng cấp, chứng chỉ..." />
                  </Form.Item>
                  <Form.Item name="proof_file" rules={[{ required: true, message: "Chọn file bằng chứng" }]}>
                    <Upload beforeUpload={() => false} fileList={fileList} onChange={({ fileList }) => setFileList(fileList)}>
                      <Button icon={<UploadOutlined />}>Chọn file</Button>
                    </Upload>
                  </Form.Item>
                </>
              )
            }
          </Form.Item>

          <Button type="primary" htmlType="submit" block>
            Đăng ký
          </Button>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <a href="/login">Đã có tài khoản? Đăng nhập</a>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default RegisterPage;
