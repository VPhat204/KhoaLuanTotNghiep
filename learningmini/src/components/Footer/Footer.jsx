import { Layout } from "antd";
const { Footer } = Layout;

function AppFooter() {
  return (
    <Footer style={{ textAlign: "center", background: "#001529", color: "#fff"}}>
      <p>E-learning Platform ©2025 | Made with ❤️ by Team</p>
      <p>
        <a href="/about" style={{ color: "#fff" }}>Giới thiệu</a> |{" "}
        <a href="/contact" style={{ color: "#fff" }}>Liên hệ</a> |{" "}
        <a href="/privacy" style={{ color: "#fff" }}>Chính sách bảo mật</a>
      </p>
    </Footer>
  );
}

export default AppFooter;
