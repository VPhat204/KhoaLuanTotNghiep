import { Link, useNavigate } from "react-router-dom";
import { Layout, Dropdown, Modal, Form, Input, message } from "antd";
import { SearchOutlined } from "@ant-design/icons";
import { useContext, useState } from "react";
import { UserContext } from "../../context/userContext";
import axios from "axios";
import "./AppHeader.css";

const { Header } = Layout;

function AppHeader() {
  const { user, logout, updateName, loading } = useContext(UserContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangeName = () => {
    form.validateFields().then(async (values) => {
      try {
        await axios.put(`http://localhost:5000/users/${user.id}/name`, {
          name: values.name,
        });
        updateName(values.name);
        message.success("Cập nhật tên thành công!");
        setIsModalVisible(false);
      } catch (err) {
        message.error("Cập nhật tên thất bại!");
      }
    });
  };

  const handleSearch = (e) => {
    e?.preventDefault();
    if (searchValue.trim() !== "") {
      navigate(`/search?query=${encodeURIComponent(searchValue)}`);
      setSearchValue("");
    }
  };

  if (loading) return null;

  return (
    <Header className="app-header">
      <nav className="app-nav">
        <div className="app-logo">
          <Link to="/">E_Study</Link>
        </div>

        <form onSubmit={handleSearch} className="app-search-form">
          <div className="search-container">
            <Input
              placeholder="Tìm kiếm khóa học..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="app-search-input"
            />
            <button
              type="button"
              className="search-btn"
              onClick={handleSearch}
            >
              <SearchOutlined />
            </button>
          </div>
        </form>

        <div className="app-user">
          {user ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "editName",
                    label: "Đổi tên",
                    onClick: () => setIsModalVisible(true),
                  },
                  {
                    key: "logout",
                    label: "Đăng xuất",
                    onClick: handleLogout,
                  },
                ],
              }}
              placement="bottomRight"
            >
              <span className="app-user-name">
                {user?.name || "Tài khoản"}
              </span>
            </Dropdown>
          ) : (
            <div className="app-auth-links">
              <Link to="/login">Đăng nhập</Link> |{" "}
              <Link to="/register">Đăng ký</Link>
            </div>
          )}
        </div>
      </nav>

      <Modal
        title="Đổi tên"
        open={isModalVisible}
        onOk={handleChangeName}
        onCancel={() => setIsModalVisible(false)}
        okText="Cập nhật"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ name: user?.name || "" }}
        >
          <Form.Item
            name="name"
            label="Tên mới"
            rules={[{ required: true, message: "Nhập tên mới" }]}
          >
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </Header>
  );
}

export default AppHeader;
