import { Layout, Menu } from "antd";
import { useState } from "react";
import Review from "../Review/Review";
import Contact from "../Contact/Contact";
import { useTranslation } from "react-i18next";
import "./HomePage.css";

const { Sider, Content } = Layout;

function HomePage() {
  const [selectedKey, setSelectedKey] = useState("1");
  const { t } = useTranslation();

  const renderContent = () => {
    switch (selectedKey) {
      case "1":
        return <Review />;
      case "4":
        return <Contact />;
      default:
        return <p>{t("selectMenu")}</p>;
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider width={220} className="site-layout-background">
        <Menu
          mode="inline"
          selectedKeys={[selectedKey]}
          onClick={(e) => setSelectedKey(e.key)}
          className="custom-menu"
          style={{ height: "100%", borderRight: 0, paddingTop: "15px" }}
        >
          <Menu.Item key="1">{t("menu.introduction")}</Menu.Item>
          <Menu.Item key="4">{t("menu.contact")}</Menu.Item>
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
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
}

export default HomePage;
