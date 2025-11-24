import { Link, useNavigate } from "react-router-dom";
import { Layout, Dropdown, Modal, Form, Input, message, Switch, Badge, List, Menu } from "antd";
import { BellOutlined, GlobalOutlined, MoonOutlined, SearchOutlined, SunOutlined } from "@ant-design/icons";
import { useContext, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { UserContext } from "../../context/userContext";
import axios from "axios";
import "./AppHeader.css";
import ProfileModal from "../ProfilePage/Profile";

const { Header } = Layout;
const BASE_URL = "http://localhost:5000";

function AppHeader() {
  const { t, i18n } = useTranslation();
  const { user, logout, updateName, updateUser, loading } = useContext(UserContext);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [isProfileVisible, setIsProfileVisible] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem("theme") === "dark");
  const [notifications, setNotifications] = useState([]);
  const [isNotifVisible, setIsNotifVisible] = useState(false);

  useEffect(() => {
    if (user?.language) {
      i18n.changeLanguage(user.language);
    }
  }, [user?.language, i18n]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangeName = () => {
    form.validateFields().then(async (values) => {
      try {
        await axios.put(`${BASE_URL}/users/${user.id}/name`, { name: values.name });
        updateName(values.name);
        message.success(t("updateNameSuccess"));
        setIsModalVisible(false);
      } catch (err) {
        message.error(t("updateNameFail"));
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
      return;
    }
    const fetchNotifications = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/notifications/${user.id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        setNotifications(res.data);
      } catch (error) {
        console.error(error);
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
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: 1 } : n)));
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangeLang = async (lang) => {
    i18n.changeLanguage(lang);
    try {
      if (user?.id) {
        await axios.put(`${BASE_URL}/users/${user.id}/language`, { language: lang }, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        updateUser({ ...user, language: lang });
      }
    } catch (err) {
      console.error(err);
      message.error("Failed to change language");
    }
  };

  const langMenu = (
    <Menu>
      <Menu.Item key="vi" onClick={() => handleChangeLang("vi")}>{t("lang.vi")}</Menu.Item>
      <Menu.Item key="en" onClick={() => handleChangeLang("en")}>{t("lang.en")}</Menu.Item>
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
              placeholder={t("searchPlaceholder")}
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
                  { key: "editProfile", label: t("profileInfo"), onClick: () => setIsProfileVisible(true) },
                  { key: "editName", label: t("changeName"), onClick: () => setIsModalVisible(true) },
                  { key: "logout", label: t("logout"), onClick: handleLogout },
                ],
              }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="header-user-info">
                <img src={avatarUrl} alt="avatar" className="header-avatar" />
                <span className="app-user-name">{user?.name || t("account")}</span>
              </div>
            </Dropdown>
          ) : (
            <div className="app-auth-links">
              <Link to="/login">{t("login")}</Link> | <Link to="/register">{t("register")}</Link>
            </div>
          )}
        </div>
      </nav>

      <Modal
        title={t("notifications")}
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
        title={t("changeName")}
        open={isModalVisible}
        onOk={handleChangeName}
        onCancel={() => setIsModalVisible(false)}
        okText={t("update")}
      >
        <Form form={form} layout="vertical" initialValues={{ name: user?.name || "" }}>
          <Form.Item name="name" label={t("newName")} rules={[{ required: true, message: t("enterNewName") }]}>
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
