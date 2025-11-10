import { Layout, Menu } from "antd";

const { Sider, Content } = Layout;

function HomePage() {
  return (
    <Layout style={{ minHeight: "100vh"}}>
      <Sider width={200} className="site-layout-background">
        <Menu
          mode="inline"
          defaultSelectedKeys={["1"]}
          style={{ height: "100%", borderRight: 0 }}
        >
          <Menu.Item key="1">Giới thiệu</Menu.Item>
          <Menu.Item key="2">Danh sách khóa học</Menu.Item>
          <Menu.Item key="3">Giảng viên</Menu.Item>
          <Menu.Item key="4">Liên hệ</Menu.Item>
        </Menu>
      </Sider>
      <Layout style={{ padding: "15px" }}>
        <Content
          style={{
            background: "#fff",
            padding: 20,
            margin: 0,
            minHeight: 280,
          }}
        >
          <h1>Chào mừng đến E-learning Platform</h1>
          <p>
            Đây là hệ thống học trực tuyến mini. Bạn có thể đăng ký tài khoản, 
            chọn khóa học và bắt đầu học ngay hôm nay.
          </p>
        </Content>
      </Layout>
    </Layout>
  );
}

export default HomePage;
