import { useEffect, useState, useCallback } from "react";
import {
  Tabs,
  Typography,
  List,
  Divider,
  Card,
  Tag,
  Input,
  Button,
  message,
  Avatar,
} from "antd";
import {
  ClockCircleOutlined,
  PlayCircleOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { useTranslation } from "react-i18next";
import axios from "axios";

const { Title, Paragraph } = Typography;
const { TextArea } = Input;

export default function CourseDetail({ course }) {
  const { t } = useTranslation();
  const [videos, setVideos] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const token = localStorage.getItem("token");
  const [studentCount, setStudentCount] = useState(0);

  const fetchVideos = useCallback(async () => {
    if (!course?.id) return;
    try {
      const res = await axios.get(`http://localhost:5000/videos/${course.id}`);
      setVideos(res.data);
    } catch {
      message.error(t('courseDetail.messages.videosLoadError'));
    }
  }, [course?.id, t]);

  const fetchComments = useCallback(async () => {
    if (!course?.id) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/comments/${course.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComments(res.data);
    } catch {
      message.error(t('courseDetail.messages.commentsLoadError'));
    }
  }, [course?.id, token, t]);

  const fetchStudentCount = useCallback(async () => {
    if (!course?.id) return;
    try {
        const res = await axios.get(`http://localhost:5000/courses/${course.id}/students-count`);
        setStudentCount(res.data.total_students);
    } catch {
        message.error(t('courseDetail.messages.studentCountError'));
    }
  }, [course?.id, t]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return message.warning(t('courseDetail.messages.commentRequired'));
    try {
      await axios.post(
        "http://localhost:5000/comments/add",
        { course_id: course.id, content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success(t('courseDetail.messages.commentSuccess'));
      setNewComment("");
      fetchComments();
    } catch {
      message.error(t('courseDetail.messages.commentError'));
    }
  };

  useEffect(() => {
    fetchVideos();
    fetchComments();
    fetchStudentCount();
  }, [fetchVideos, fetchComments, fetchStudentCount]);

  return (
    <div style={{ padding: 24 }}>
      <Card
        style={{
          background: "linear-gradient(135deg, #e0f7fa, #e3f2fd)",
          borderRadius: 12,
          overflow: "hidden",
        }}
        bodyStyle={{ padding: 0 }}
      >
        <div style={{ position: "relative" }}>
          {videos.length > 0 ? (
            <video
              controls
              style={{ width: "100%", borderRadius: "12px" }}
            >
              <source src={videos[0].url} type="video/mp4" />
            </video>
          ) : (
            <img
              src="https://cdn.dribbble.com/userupload/12056349/file/original-bf68cfef9a9e7edb23b157a4f6e71856.png"
              alt="preview"
              style={{ width: "100%", borderRadius: "12px" }}
            />
          )}
        </div>
      </Card>

      <div style={{ marginTop: 24 }}>
        <Title level={3}>{course.title}</Title>
        <Paragraph type="secondary">
          {t('courseDetail.teacher')}: <b>{course.teacher_name}</b> | {videos.length} {t('courseDetail.videos')} | {studentCount} {t('courseDetail.students')}
        </Paragraph>

        <Tabs
          defaultActiveKey="1"
          items={[
            {
              key: "1",
              label: t('courseDetail.tabs.overview'),
              children: (
                <>
                  <Title level={5}>{t('courseDetail.courseDescription')}</Title>
                  <Paragraph>{course.description || t('courseDetail.noDescription')}</Paragraph>
                </>
              ),
            },
            {
              key: "2",
              label: t('courseDetail.tabs.content'),
              children: (
                <>
                  <Divider orientation="left">{t('courseDetail.lessonList')}</Divider>
                  {videos.length > 0 ? (
                    <List
                      dataSource={videos}
                      renderItem={(video) => (
                        <List.Item>
                          <PlayCircleOutlined style={{ marginRight: 10, color: "#1890ff" }} />
                          <span>{video.title}</span>
                          <Tag
                            icon={<ClockCircleOutlined />}
                            color="blue"
                            style={{ marginLeft: "auto" }}
                          >
                            {video.duration || t('courseDetail.notAvailable')}
                          </Tag>
                        </List.Item>
                      )}
                    />
                  ) : (
                    <Paragraph>{t('courseDetail.noVideos')}</Paragraph>
                  )}
                </>
              ),
            },
            {
              key: "3",
              label: t('courseDetail.tabs.comments'),
              children: (
                <div>
                  <Title level={5}>{t('courseDetail.studentComments')}</Title>

                  <List
                    dataSource={comments}
                    locale={{ emptyText: t('courseDetail.noComments') }}
                    renderItem={(cmt) => (
                      <List.Item>
                        <List.Item.Meta
                          avatar={<Avatar icon={<UserOutlined />} />}
                          title={
                            <div>
                              <b>{cmt.user_name || t('courseDetail.user')}</b>{" "}
                              <span style={{ color: "#999", fontSize: 12 }}>
                                {new Date(cmt.created_at).toLocaleString()}
                              </span>
                            </div>
                          }
                          description={cmt.content}
                        />
                      </List.Item>
                    )}
                  />

                  <Divider />
                  <TextArea
                    rows={3}
                    placeholder={t('courseDetail.placeholder.writeComment')}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                  />
                  <div style={{ marginTop: 8, textAlign: "right" }}>
                    <Button
                      type="primary"
                      icon={<SendOutlined />}
                      onClick={handleAddComment}
                    >
                      {t('courseDetail.send')}
                    </Button>
                  </div>
                </div>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}