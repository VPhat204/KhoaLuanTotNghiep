import { Link, useNavigate } from "react-router-dom";
import { Layout, Dropdown, Modal, Form, Input, message, Switch, Badge, List, Menu } from "antd";
import { BellOutlined, GlobalOutlined, MoonOutlined, SearchOutlined, SunOutlined } from "@ant-design/icons";
import { useContext, useEffect, useState } from "react";
import { UserContext } from "../../context/userContext";
import axios from "axios";
import "./AppHeader.css";
import ProfileModal from "../ProfilePage/Profile";

const { Header } = Layout;
const BASE_URL = "http://localhost:5000";

function AppHeader() {
  const { user, logout, updateName, updateUser, loading } = useContext(UserContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [notifications, setNotifications] = useState([]);
  const [isNotifVisible, setIsNotifVisible] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangeName = () => {
    form.validateFields().then(async (values) => {
      try {
        await axios.put(`${BASE_URL}/users/${user.id}/name`, { name: values.name });
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

  useEffect(() => {
    if (!user) {
      setNotifications([]);  
    }

    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/notifications/${user.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setNotifications(res.data);
      } catch (error) {
        console.error("Lỗi fetch notifications:", error);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);

    return () => clearInterval(interval);
  }, [user]);

  useEffect(() => {
    document.body.setAttribute("data-theme", darkMode ? "dark" : "light");
    localStorage.setItem("theme", darkMode ? "dark" : "light");
  }, [darkMode]);

  const markAsRead = async (id) => {
    try {
      await axios.put(`${BASE_URL}/notifications/${id}/read`, {}, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeLang = (lang) => {
    localStorage.setItem("lang", lang);
    window.location.reload(); 
  };

  const langMenu = (
    <Menu>
      <Menu.Item key="vi" onClick={() => handleChangeLang("vi")}>Tiếng Việt</Menu.Item>
      <Menu.Item key="en" onClick={() => handleChangeLang("en")}>English</Menu.Item>
    </Menu>
  );

  if (loading) return null;

  const avatarUrl = user?.avatar ? (user.avatar.startsWith("http") ? user.avatar : `${BASE_URL}${user.avatar}`) : "/default-avatar.png";

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
            <button type="button" className="search-btn" onClick={handleSearch}>
              <SearchOutlined />
            </button>
          </div>
        </form>

        <div className="app-user">
          <div className="app-actions">
            <Dropdown overlay={langMenu} placement="bottomRight" trigger={['click']}>
              <GlobalOutlined style={{ fontSize: 20, cursor: "pointer" }} />
            </Dropdown>

            <Badge count={notifications.filter(n => !n.is_read).length} size="small">
              <BellOutlined
                className="icon-btn"
                onClick={() => setIsNotifVisible(true)}
                style={{ fontSize: 20, marginRight: 5 }}
              />
            </Badge>

            <Switch
              checkedChildren={<SunOutlined />}
              unCheckedChildren={<MoonOutlined />}
              checked={darkMode}
              onChange={(checked) => setDarkMode(checked)}
              style={{ marginRight: 15 }}
            />
          </div>

          {user ? (
            <Dropdown
              menu={{
                items: [
                  { key: "editProfile", label: "Thông tin hồ sơ", onClick: () => setIsProfileVisible(true) },
                  { key: "editName", label: "Đổi tên", onClick: () => setIsModalVisible(true) },
                  { key: "logout", label: "Đăng xuất", onClick: handleLogout },
                ],
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="header-user-info">
                <img src={avatarUrl} alt="avatar" className="header-avatar" />
                <span className="app-user-name">{user?.name || "Tài khoản"}</span>
              </div>
            </Dropdown>
          ) : (
            <div className="app-auth-links">
              <Link to="/login">Đăng nhập</Link> | <Link to="/register">Đăng ký</Link>
            </div>
          )}
        </div>
      </nav>

      <Modal
        title="Thông báo"
        open={isNotifVisible}
        onCancel={() => setIsNotifVisible(false)}
        footer={null}
      >
        <List
          dataSource={notifications}
          renderItem={(item) => (
            <List.Item
              style={{ fontWeight: item.is_read ? "normal" : "bold" }}
            >
              <Link to={item.link || "#"} onClick={() => markAsRead(item.id)}>
                {item.title}
              </Link>
            </List.Item>
          )}
        />
      </Modal>

      <Modal
        title="Đổi tên"
        open={isModalVisible}
        onOk={handleChangeName}
        onCancel={() => setIsModalVisible(false)}
        okText="Cập nhật"
      >
        <Form form={form} layout="vertical" initialValues={{ name: user?.name || "" }}>
          <Form.Item name="name" label="Tên mới" rules={[{ required: true, message: "Nhập tên mới" }]}>
            <Input />
          </Form.Item>
        </Form>
      </Modal>

      <ProfileModal 
        visible={isProfileVisible} 
        onClose={() => setIsProfileVisible(false)} 
        user={user} 
        updateUser={updateUser} />
    </Header>
  );
}

export default AppHeader;
