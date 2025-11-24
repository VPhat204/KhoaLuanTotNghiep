import { Form, Input, Button } from "antd";
import { useTranslation } from "react-i18next";

export default function CreateCourse({ courseForm, onCreateCourse }) {
  const { t } = useTranslation();

  return (
    <div>
      <h3>{t("createcourses.create_title")}</h3>
      <Form
        form={courseForm}
        layout="vertical"
        style={{ maxWidth: 400 }}
        onFinish={onCreateCourse}
      >
        <Form.Item
          name="title"
          label={t("createcourses.name")}
          rules={[{ required: true, message: t("createcourses.name_required") }]}
        >
          <Input placeholder={t("createcourses.name_placeholder")} />
        </Form.Item>

        <Form.Item
          name="description"
          label={t("createcourses.description")}
          rules={[{ required: true, message: t("createcourses.description_required") }]}
        >
          <Input.TextArea placeholder={t("createcourses.description_placeholder")} />
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit">
            {t("createcourses.btn_create")}
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}
