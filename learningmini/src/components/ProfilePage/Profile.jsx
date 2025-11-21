import { Modal, Form, Input, Button, Upload, message, DatePicker, Select, Row, Col } from "antd";
import { UploadOutlined, FileAddOutlined, EditOutlined } from "@ant-design/icons";
import { useState, useEffect } from "react";
import axios from "axios";
import moment from "moment";
import "./Profile.css";

const { Option } = Select;
const { TextArea } = Input;

function ProfileModal({ visible, onClose, user, updateUser }) {
  const [form] = Form.useForm();
  const [avatarFileList, setAvatarFileList] = useState([]);
  const [proofFileList, setProofFileList] = useState([]);
  const [editing, setEditing] = useState(false);
  const token = localStorage.getItem("token");
  const BASE_URL = "http://localhost:5000";

  useEffect(() => {
    if (visible && user) {
      // Set các giá trị form
      form.setFieldsValue({
        name: user.name || "",
        email: user.email || "",
        roles: user.roles || "",
        phone: user.phone || "",
        gender: user.gender || "",
        birthdate: user.birthdate ? moment(user.birthdate) : null,
        address: user.address || "",
        proof_info: user.proof_info || "",
      });

      // Xử lý avatar đầy đủ URL
      const avatarUrl = user.avatar ? (user.avatar.startsWith("http") ? user.avatar : `${BASE_URL}${user.avatar}`) : null;
      setAvatarFileList(
        avatarUrl ? [{
          uid: "-1",
          name: "avatar",
          status: "done",
          url: avatarUrl
        }] : []
      );

      // Xử lý proof_file
      if (user.proof_file) {
        const files = Array.isArray(user.proof_file) ? user.proof_file : [user.proof_file];
        setProofFileList(files.map((file, idx) => ({
          uid: idx,
          name: file.split("/").pop(),
          status: "done",
          url: file.startsWith("http") ? file : `${BASE_URL}${file}`
        })));
      } else {
        setProofFileList([]);
      }
    }
  }, [visible, user, form]);

  if (!user) return null;

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const formData = new FormData();

      formData.append("phone", values.phone || "");
      formData.append("gender", values.gender || "");
      formData.append("birthdate", values.birthdate ? values.birthdate.format("YYYY-MM-DD") : "");
      formData.append("address", values.address || "");
      formData.append("proof_info", values.proof_info || "");

      if (avatarFileList[0]?.originFileObj) {
        formData.append("avatar", avatarFileList[0].originFileObj);
      }

      proofFileList.forEach(file => {
        if (file.originFileObj) formData.append("proof_file", file.originFileObj);
      });

      const res = await axios.put(
        `${BASE_URL}/users/${user.id}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // Cập nhật avatar với URL đầy đủ
      const newAvatarUrl = res.data.avatar ? `${BASE_URL}${res.data.avatar}` : avatarFileList[0]?.url || null;
      setAvatarFileList(newAvatarUrl ? [{
        uid: "-1",
        name: "avatar",
        status: "done",
        url: newAvatarUrl
      }] : []);

      const updatedUser = {
        ...user,
        ...values,
        avatar: newAvatarUrl,
        proof_file: res.data.proof_file || user.proof_file,
      };

      updateUser(updatedUser);

      // Cập nhật localStorage để login/logout vẫn giữ avatar
      const storedUser = JSON.parse(localStorage.getItem("user")) || {};
      localStorage.setItem("user", JSON.stringify({
        ...storedUser,
        ...updatedUser
      }));

      message.success("Cập nhật profile thành công!");
      setEditing(false);
    } catch (err) {
      console.error(err);
      message.error("Cập nhật thất bại!");
    }
  };

  const handleRemoveProofFile = (file) => {
    setProofFileList(prev => prev.filter(f => f.uid !== file.uid));
  };

  const avatarUploadProps = {
    beforeUpload: (file) => {
      const url = URL.createObjectURL(file);
      setAvatarFileList([{ uid: file.uid, name: file.name, status: "done", url, originFileObj: file }]);
      return false;
    },
    fileList: [],  
    maxCount: 1,
  };

  const proofUploadProps = {
    beforeUpload: (file) => {
      const url = URL.createObjectURL(file);
      setProofFileList(prev => [...prev, { uid: file.uid, name: file.name, status: "done", url, originFileObj: file }]);
      return false;
    },
    fileList: proofFileList,
    multiple: true,
    accept: ".pdf,.jpg,.jpeg,.png,.doc,.docx"
  };

  return (
    <Modal
      title="Thông tin hồ sơ"
      open={visible}
      onOk={handleSave}
      onCancel={onClose}
      okText="Lưu"
      width={800}
      centered
      footer={[
        !editing && <Button key="edit" icon={<EditOutlined />} onClick={() => setEditing(true)}>Chỉnh sửa</Button>,
        editing && <Button key="save" type="primary" onClick={handleSave}>Lưu</Button>,
        <Button key="cancel" onClick={onClose}>Đóng</Button>
      ]}
    >
      <div className="profile-layout">
        <div className="profile-top-section">
          <div className="avatar-section">
            <div className="avatar-container">
              {avatarFileList[0]?.url && <img key={avatarFileList[0]?.url} src={avatarFileList[0]?.url} alt="avatar" className="profile-avatar-large" />}
            </div>
            {editing && (
              <div className="avatar-upload-actions" style={{ marginTop: 8 }}>
                <Upload {...avatarUploadProps}>
                  <Button type="primary" icon={<UploadOutlined />} size="small">Tải ảnh mới</Button>
                </Upload>
              </div>
            )}
          </div>

          <div className="personal-info-section">
            <Form form={form} layout="vertical">
              <Form.Item name="name" label="Tên">
                <Input disabled />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="birthdate" label="Ngày sinh">
                    <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Chọn ngày sinh" disabled={!editing} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="gender" label="Giới tính">
                    <Select placeholder="Chọn giới tính" disabled={!editing}>
                      <Option value="male">Nam</Option>
                      <Option value="female">Nữ</Option>
                      <Option value="other">Khác</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item name="phone" label="Số điện thoại">
                    <Input placeholder="Nhập số điện thoại" disabled={!editing} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item name="roles" label="Vai trò">
                    <Input disabled />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item name="email" label="Email">
                <Input disabled />
              </Form.Item>

              <Form.Item name="address" label="Địa chỉ">
                <TextArea rows={2} placeholder="Nhập địa chỉ" disabled={!editing} />
              </Form.Item>
            </Form>
          </div>
        </div>

        {user.roles === "teacher" && (
          <div className="proof-section">
            <div className="proof-info-section">
              <h3 className="section-title">Thông tin minh chứng</h3>
              <Form form={form} layout="vertical">
                <Form.Item name="proof_info">
                  <TextArea rows={3} placeholder="Nhập thông tin chứng minh" disabled={!editing} />
                </Form.Item>
              </Form>
            </div>

            <div className="proof-file-section">
              <h3 className="section-title">File minh chứng</h3>
              {editing && (
                <Upload {...proofUploadProps}>
                  <Button icon={<FileAddOutlined />} size="large">
                    Tải lên file chứng minh
                  </Button>
                </Upload>
              )}
              <div className="file-types">(PDF, ảnh, DOC - tối đa 5MB)</div>

              {proofFileList.length > 0 && (
                <div className="uploaded-files">
                  <h4>File đã tải lên:</h4>
                  <ul>
                    {proofFileList.map(file => (
                      <li key={file.uid} style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                        {file.url ? (
                          <a href={file.url} target="_blank" rel="noopener noreferrer" style={{ marginRight: 8 }}>{file.name}</a>
                        ) : (
                          <span style={{ marginRight: 8 }}>{file.name}</span>
                        )}
                        {editing && (
                          <Button 
                            type="link" 
                            danger 
                            size="small" 
                            onClick={() => handleRemoveProofFile(file)}
                            style={{ padding: 0 }}
                          >
                            Xóa
                          </Button>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

export default ProfileModal;
