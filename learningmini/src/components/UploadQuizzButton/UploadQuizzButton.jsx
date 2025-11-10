import React, { useState, useEffect } from "react";
import { Upload, Button, message, Popconfirm } from "antd";
import { UploadOutlined, DeleteOutlined } from "@ant-design/icons";
import axios from "axios";

const UploadQuizButton = ({ quizId }) => {
  const [fileList, setFileList] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchUploadedFile = async () => {
      try {
        const { data } = await axios.get(
          `http://localhost:5000/api/quizzes/${quizId}/files`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (data.length > 0) {
          setUploadedFile(data[0]);
        }
      } catch (err) {
        console.error("Lỗi fetch file:", err);
      }
    };
    fetchUploadedFile();
  }, [quizId, token]);

  const handleUpload = async () => {
    if (!fileList.length) {
      message.error("Vui lòng chọn file để upload!");
      return;
    }
    const formData = new FormData();
    formData.append("file", fileList[0]);

    try {
      await axios.post(
        `http://localhost:5000/api/quizzes/${quizId}/upload`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );
      message.success("Upload file thành công!");
      setUploadedFile({ file_name: fileList[0].name, id: null }); 
      setFileList([]);
      const { data } = await axios.get(
        `http://localhost:5000/api/quizzes/${quizId}/files`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (data.length > 0) setUploadedFile(data[0]);
    } catch (error) {
      console.error("❌ Lỗi upload:", error);
      message.error("Upload thất bại!");
    }
  };

  const handleDelete = async (fileId) => {
    try {
      await axios.delete(
        `http://localhost:5000/api/quizzes/files/${fileId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      message.success("Xóa file thành công!");
      setUploadedFile(null);
    } catch (error) {
      console.error("❌ Lỗi xóa file:", error);
      message.error("Xóa thất bại!");
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {uploadedFile ? (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: "green", fontWeight: 500 }}>
            📄 {uploadedFile.file_name}
          </span>
          <Popconfirm
            title="Bạn có chắc muốn xóa file này?"
            onConfirm={() => handleDelete(uploadedFile.id)}
            okText="Có"
            cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} size="small">
              Xóa
            </Button>
          </Popconfirm>
        </div>
      ) : (
        <>
          <Upload
            beforeUpload={(file) => {
              setFileList([file]);
              return false;
            }}
            fileList={fileList}
            onRemove={() => setFileList([])}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Chọn file</Button>
          </Upload>
          <Button
            type="primary"
            onClick={handleUpload}
            disabled={!fileList.length}
          >
            Upload
          </Button>
        </>
      )}
    </div>
  );
};

export default UploadQuizButton;
