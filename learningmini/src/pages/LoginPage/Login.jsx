import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Form, Input, Button, message } from "antd";
import { useContext } from "react";
import { UserContext } from "../../context/userContext";

function LoginPage() {
  const navigate = useNavigate();
  const { login } = useContext(UserContext);

  const onFinish = async (values) => {
  try {
    const res = await axios.post("http://localhost:5000/login", values, {
      headers: { "Content-Type": "application/json" },
    });
    console.log(res.data);
    if (res.data.token && res.data.roles) {
      localStorage.setItem("token", res.data.token);
      login({
        id: res.data.id,
        name: res.data.name,
        email: res.data.email,
        roles: res.data.roles,
        proof_info: res.data.proof_info,
        proof_file: res.data.proof_file,
        avatar: res.data.avatar,
        phone: res.data.phone,
        address: res.data.address,
        birthdate: res.data.birthdate,
        gender: res.data.gender,
        token: res.data.token,
      });

      message.success("Đăng nhập thành công!");

      if (res.data.roles === "admin") navigate("/admin-dashboard");
      else if (res.data.roles === "teacher") navigate("/teacher-dashboard");
      else navigate("/student-dashboard");
    } else {
      message.error("Server không trả dữ liệu hợp lệ.");
    }
  } catch (err) {
    if (err.response) {
      const status = err.response.status;
      const data = err.response.data;

      if (status === 401) {
        message.error("Sai email hoặc mật khẩu!");
      }
      else if (status === 403) {
        message.warning(data?.message || "Bạn không có quyền truy cập!");
      }
      else {
        message.error(data?.message || "Lỗi server!");
      }
    } else {
      message.error("Không thể kết nối server.");
    }
  }
};


  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "#f5f5f5",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: 30,
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          width: 350,
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>Đăng nhập</h2>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item
            name="email"
            rules={[{ required: true, message: "Nhập email" }]}
          >
            <Input placeholder="Email" autoComplete="email" />
          </Form.Item>
          <Form.Item
            name="password"
            rules={[{ required: true, message: "Nhập mật khẩu" }]}
          >
            <Input.Password
              placeholder="Mật khẩu"
              autoComplete="current-password"
            />
          </Form.Item>
          <Button type="primary" htmlType="submit" block>
            Đăng nhập
          </Button>
          <div style={{ textAlign: "center", marginTop: 12 }}>
            <a href="/register">Chưa có tài khoản? Đăng ký</a>
          </div>
        </Form>
      </div>
    </div>
  );
}

export default LoginPage;
