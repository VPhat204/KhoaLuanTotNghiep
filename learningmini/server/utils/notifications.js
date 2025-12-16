const { getDB } = require("../config/database");
const { sendEmailNotification } = require("./email");

async function createNotification(userId, title, link = null) {
  try {
    const db = getDB();
    await db.execute(
      "INSERT INTO notifications (user_id, title, link) VALUES (?, ?, ?)",
      [userId, title, link]
    );
    console.log(`Notification created for user ${userId}: ${title}`);
    return true;
  } catch (err) {
    console.error("Error creating notification:", err);
    return false;
  }
}

async function sendCourseNotification(teacherId, courseId, notificationType, extraData = {}) {
  try {
    const db = getDB();
    const [course] = await db.execute("SELECT title, teacher_id FROM courses WHERE id = ?", [courseId]);
    
    if (course.length === 0) {
      console.error("Course not found");
      return false;
    }

    const courseData = course[0];
    let notificationTitle = "";
    let emailSubject = "";
    let emailContent = "";

    switch (notificationType) {
      case "course_approved":
        notificationTitle = `Course "${courseData.title}" has been approved`;
        emailSubject = "Course Approved";
        emailContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="color: #1890ff;">Course Approved</h2>
            <p>Your course "<strong>${courseData.title}</strong>" has been approved by the administrator.</p>
            <p>Students can now enroll in your course.</p>
          </div>
        `;
        break;
      
      case "assignment_added":
        notificationTitle = `New assignment in "${courseData.title}"`;
        emailSubject = "New Assignment";
        emailContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="color: #1890ff;">New Assignment</h2>
            <p>A new assignment has been added to "<strong>${courseData.title}</strong>".</p>
            <p>Please check the course page for details.</p>
          </div>
        `;
        break;
      
      case "video_added":
        notificationTitle = `New video in "${courseData.title}"`;
        emailSubject = "New Video";
        emailContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="color: #1890ff;">New Video Available</h2>
            <p>A new video has been added to "<strong>${courseData.title}</strong>".</p>
            <p>Check it out now!</p>
          </div>
        `;
        break;
      
      default:
        notificationTitle = `Notification for "${courseData.title}"`;
        emailSubject = "Course Notification";
        emailContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="color: #1890ff;">Course Update</h2>
            <p>There's an update for "<strong>${courseData.title}</strong>".</p>
          </div>
        `;
    }

    await createNotification(teacherId, notificationTitle, `/teacher/courses/${courseId}`);

    const [teacher] = await db.execute("SELECT email FROM users WHERE id = ?", [teacherId]);
    if (teacher.length > 0) {
      await sendEmailNotification(teacher[0].email, emailSubject, emailContent);
    }

    if (["assignment_added", "video_added"].includes(notificationType)) {
      const [students] = await db.execute(
        "SELECT student_id, u.email FROM course_enrollments ce JOIN users u ON ce.student_id = u.id WHERE ce.course_id = ?",
        [courseId]
      );

      for (const student of students) {
        await createNotification(student.student_id, notificationTitle, `/student/courses/${courseId}`);
      }
    }

    return true;
  } catch (err) {
    console.error("Error sending course notification:", err);
    return false;
  }
}

module.exports = { createNotification, sendCourseNotification };