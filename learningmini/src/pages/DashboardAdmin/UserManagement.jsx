import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  Upload,
  message,
  Popconfirm,
  Tag,
  Space,
} from "antd";
import { UploadOutlined } from "@ant-design/icons";

const { Option } = Select;

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form] = Form.useForm();
  const [file, setFile] = useState([]);
  const [passwordModal, setPasswordModal] = useState(false);
  const [resetUserId, setResetUserId] = useState(null);
  const [resetForm] = Form.useForm();
  const [viewUser, setViewUser] = useState(null); 
  const token = localStorage.getItem("token");

  const fetchUsers = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(res.data);
    } catch (err) {
      message.error("Không thể tải danh sách người dùng");
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleAddOrEdit = async (values) => {
    try {
      if (editingUser) {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("email", values.email);
        formData.append("roles", values.roles);
        if (values.proofInfo !== undefined) formData.append("proof_info", values.proofInfo);
        file.forEach(f => formData.append("proof_file", f));

        await axios.put(`http://localhost:5000/users/${editingUser.id}`, formData, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        });
        message.success("Cập nhật thành công!");
      } else {
        if (values.roles === "teacher") {
          const formData = new FormData();
          formData.append("name", values.name);
          formData.append("email", values.email);
          formData.append("password", values.password);
          formData.append("roles", "teacher");
          formData.append("proof_info", values.proofInfo || "");
          file.forEach(f => formData.append("proof_file", f));

          await axios.post("http://localhost:5000/register", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          message.success("Đăng ký giảng viên, chờ admin duyệt!");
        } else {
          await axios.post(
            "http://localhost:5000/users",
            {
              name: values.name,
              email: values.email,
              password: values.password,
              roles: values.roles,
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          message.success("Thêm người dùng thành công!");
        }
      }
      setIsModalOpen(false);
      form.resetFields();
      setFile([]);
      setEditingUser(null);
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi khi lưu người dùng");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      message.success("Đã xóa người dùng");
      fetchUsers();
    } catch {
      message.error("Không thể xóa người dùng");
    }
  };

  const handleApprove = async (id, approved) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/users/${id}/approve-teacher`,
        { approve: !approved },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success(res.data.message);
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi khi phê duyệt");
    }
  };

  const handleLock = async (id, locked) => {
    try {
      const res = await axios.put(
        `http://localhost:5000/users/${id}/lock`,
        { lock: !Number(locked) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success(res.data.message);
      fetchUsers();
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi khi khóa/mở tài khoản");
    }
  };

  const handleResetPassword = async (values) => {
    try {
      await axios.put(
        `http://localhost:5000/users/${resetUserId}/reset-password`,
        { newPassword: values.newPassword },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Đặt lại mật khẩu thành công!");
      setPasswordModal(false);
      setResetUserId(null);
      resetForm.resetFields();
    } catch (err) {
      message.error(err.response?.data?.message || "Lỗi khi reset mật khẩu");
    }
  };

  const openModal = (record = null) => {
    setEditingUser(record);
    form.resetFields();
    setFile([]);
    if (record) {
      form.setFieldsValue({
        ...record,
        proofInfo: record.proof_info,
      });
    }
    setIsModalOpen(true);
  };

  const openPasswordModal = (userId) => {
    setResetUserId(userId);
    resetForm.resetFields();
    setPasswordModal(true);
  };

  const columns = [
    { title: "ID", dataIndex: "id", key: "id", width: 60 },
    { title: "Tên", dataIndex: "name", key: "name" },
    { title: "Email", dataIndex: "email", key: "email" },
    {
      title: "Vai trò",
      dataIndex: "roles",
      key: "roles",
      render: (role) => {
        const color = role === "admin" ? "volcano" : role === "teacher" ? "geekblue" : "green";
        return <Tag color={color}>{role.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Duyệt",
      dataIndex: "is_approved",
      key: "is_approved",
      render: (_, record) => {
        if (record.roles === "teacher") {
          const approved = Number(record.is_approved) === 1;
          return (
            <Button
              size="small"
              type={approved ? "default" : "primary"}
              onClick={() => handleApprove(record.id, approved)}
            >
              {approved ? "Đã duyệt (Hủy)" : "Chưa duyệt"}
            </Button>
          );
        }
        return <Tag color="default">Không cần</Tag>;
      },
    },
    {
      title: "Trạng thái",
      dataIndex: "is_locked",
      key: "is_locked",
      render: (_, record) => {
        const locked = Number(record.is_locked) === 1;
        return (
          <Button size="small" type={locked ? "default" : "primary"} onClick={() => handleLock(record.id, locked)}>
            {locked ? "Đã khóa (Mở)" : "Hoạt động (Khóa)"}
          </Button>
        );
      },
    },
    {
      title: "Thông tin xác minh",
      dataIndex: "proof_info",
      key: "proof_info",
      render: (_, record) =>
        record.roles === "teacher" ? (
          <Button type="link" onClick={() => setViewUser(record)}>Xem</Button>
        ) : (
          <Tag>Không có</Tag>
        ),
    },
    {
      title: "Hành động",
      key: "actions",
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => openModal(record)}>Sửa</Button>
          <Button type="link" onClick={() => openPasswordModal(record.id)}>Reset mật khẩu</Button>
          <Popconfirm title="Xóa người dùng này?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>Xóa</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: "24px", background: "#fff", borderRadius: "12px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
      <h2 style={{ marginBottom: 16 }}>Quản lý người dùng</h2>

      <Button type="primary" style={{ marginBottom: 16 }} onClick={() => openModal()}>
        + Thêm người dùng
      </Button>

      <Table columns={columns} dataSource={users} rowKey="id" bordered pagination={{ pageSize: 6 }} />

      <Modal
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        title={editingUser ? "Cập nhật người dùng" : "Thêm người dùng"}
        okText={editingUser ? "Lưu" : "Thêm"}
        onOk={() => form.submit()}
        width={600}
      >
        <Form form={form} layout="vertical" onFinish={handleAddOrEdit}>
          <Form.Item name="name" label="Tên" rules={[{ required: true, message: "Nhập tên" }]}>
            <Input placeholder="Nhập tên người dùng" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, message: "Nhập email" }]}>
            <Input placeholder="Nhập email" />
          </Form.Item>
          {!editingUser && (
            <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: "Nhập mật khẩu" }]}>
              <Input.Password placeholder="Mật khẩu" />
            </Form.Item>
          )}
          <Form.Item name="roles" label="Vai trò" rules={[{ required: true, message: "Chọn vai trò" }]}>
            <Select placeholder="Chọn vai trò" onChange={() => form.resetFields(["proofInfo"])}>
              <Option value="admin">Admin</Option>
              <Option value="teacher">Giảng viên</Option>
              <Option value="student">Học viên</Option>
            </Select>
          </Form.Item>
          {form.getFieldValue("roles") === "teacher" && (
            <>
              <Form.Item name="proofInfo" label="Thông tin xác minh" rules={[{ required: true }]}>
                <Input.TextArea placeholder="Nhập thông tin chứng minh giảng viên..." />
              </Form.Item>
              <Form.Item label="Tập tin minh chứng">
                <Upload
                  beforeUpload={(file) => {
                    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(file.name);
                    if (!isImage) {
                      message.error("Chỉ cho phép file ảnh (jpg, jpeg, png, gif)!");
                      return Upload.LIST_IGNORE;  
                    }
                    setFile((prev) => [...prev, file]);
                    return false;  
                  }}
                  multiple
                  accept="image/*"
                  listType="picture"
                >
                  <Button icon={<UploadOutlined />}>Chọn ảnh</Button>
                </Upload>
                {file.length > 0 && (
                  <ul>
                    {file.map((f, idx) => (
                      <li key={idx}>{f.name}</li>
                    ))}
                  </ul>
                )}
                {editingUser?.proof_file && (
                  <ul>
                    {Array.isArray(editingUser.proof_file)
                      ? editingUser.proof_file.map((f, idx) => (
                          <li key={idx}>
                            <a
                              href={`http://localhost:5000/uploads/${f}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {f} (Tải về)
                            </a>
                          </li>
                        ))
                      : (
                          <li>
                            <a
                              href={`http://localhost:5000/uploads/${editingUser.proof_file}`}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {editingUser.proof_file} (Tải về)
                            </a>
                          </li>
                        )}
                  </ul>
                )}
              </Form.Item>

            </>
          )}
        </Form>
      </Modal>

      <Modal
        open={passwordModal}
        onCancel={() => setPasswordModal(false)}
        title="Reset mật khẩu"
        okText="Đặt lại"
        onOk={() => resetForm.submit()}
      >
        <Form form={resetForm} layout="vertical" onFinish={handleResetPassword}>
          <Form.Item name="newPassword" label="Mật khẩu mới" rules={[{ required: true, message: "Nhập mật khẩu mới" }]}>
            <Input.Password placeholder="Nhập mật khẩu mới" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="Thông tin chứng minh giảng viên"
        open={!!viewUser}
        onCancel={() => setViewUser(null)}
        footer={<Button onClick={() => setViewUser(null)}>Đóng</Button>}
        width={700}
      >
        {viewUser && (
          <div>
            <p><strong>Thông tin:</strong> {viewUser.proof_info}</p>
            {viewUser.proof_file && (
              <>
                {/\.(jpg|jpeg|png|gif)$/i.test(viewUser.proof_file) && (
                  <img
                    src={`http://localhost:5000/uploads/${viewUser.proof_file}`}
                    alt="proof"
                    style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: 8 }}
                  />
                )}
                {viewUser.proof_file.toLowerCase().endsWith(".pdf") && (
                  <iframe
                    src={`http://localhost:5000/uploads/${viewUser.proof_file}`}
                    title="proof-pdf"
                    width="100%"
                    height="400px"
                  />
                )}
                <p>
                  <a href={`http://localhost:5000/uploads/${viewUser.proof_file}`} target="_blank" rel="noreferrer">
                    Tải file về
                  </a>
                </p>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

export default UserManagement;
