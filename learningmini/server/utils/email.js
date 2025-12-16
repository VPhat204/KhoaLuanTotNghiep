const transporter = require("../config/mailer");

async function sendEmailNotification(to, subject, htmlContent) {
  try {
    await transporter.sendMail({
      from: '"E-Study System" <phettpeo160@gmail.com>',
      to: to,
      subject: subject,
      html: htmlContent
    });
    console.log(`✅ Email notification sent to: ${to}`);
    return true;
  } catch (err) {
    console.error("❌ Error sending email notification:", err);
    return false;
  }
}

async function sendOTP(email, otp) {
  try {
    await transporter.sendMail({
      from: '"E-Study System" <phettpeo160@gmail.com>',
      to: email,
      subject: "Password Recovery OTP",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="color: #1890ff;">E-Learning System</h2>
          <p>You requested password recovery. Your OTP is:</p>
          <h1 style="text-align: center; color: #ff4d4f;">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });
    console.log(`✅ OTP sent to: ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Error sending OTP:", err);
    return false;
  }
}

async function sendCourseNotification(email, courseTitle, notificationType, extraData = {}) {
  try {
    let subject = "";
    let htmlContent = "";

    switch (notificationType) {
      case "course_approved":
        subject = "Course Approved";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="color: #1890ff;">Course Approved</h2>
            <p>Your course "<strong>${courseTitle}</strong>" has been approved by the administrator.</p>
            <p>Students can now enroll in your course.</p>
            ${extraData.message ? `<p>${extraData.message}</p>` : ''}
          </div>
        `;
        break;
      
      case "course_rejected":
        subject = "Course Not Approved";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="color: #ff4d4f;">Course Not Approved</h2>
            <p>Your course "<strong>${courseTitle}</strong>" has not been approved.</p>
            ${extraData.reason ? `<p><strong>Reason:</strong> ${extraData.reason}</p>` : ''}
            <p>Please contact the administrator for more information.</p>
          </div>
        `;
        break;
      
      case "new_assignment":
        subject = "New Assignment";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="color: #1890ff;">New Assignment</h2>
            <p>A new assignment has been added to "<strong>${courseTitle}</strong>".</p>
            ${extraData.assignmentTitle ? `<p><strong>Assignment:</strong> ${extraData.assignmentTitle}</p>` : ''}
            ${extraData.dueDate ? `<p><strong>Due Date:</strong> ${extraData.dueDate}</p>` : ''}
            <p>Please check the course page for details.</p>
          </div>
        `;
        break;
      
      case "assignment_submitted":
        subject = "Assignment Submitted";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="color: #1890ff;">Assignment Submitted</h2>
            <p>A student has submitted an assignment in "<strong>${courseTitle}</strong>".</p>
            ${extraData.studentName ? `<p><strong>Student:</strong> ${extraData.studentName}</p>` : ''}
            ${extraData.assignmentTitle ? `<p><strong>Assignment:</strong> ${extraData.assignmentTitle}</p>` : ''}
            ${extraData.submissionTime ? `<p><strong>Submitted:</strong> ${extraData.submissionTime}</p>` : ''}
            <p>Please login to grade the assignment.</p>
          </div>
        `;
        break;
      
      case "new_video":
        subject = "New Video Available";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="color: #1890ff;">New Video Available</h2>
            <p>A new video has been added to "<strong>${courseTitle}</strong>".</p>
            ${extraData.videoTitle ? `<p><strong>Video:</strong> ${extraData.videoTitle}</p>` : ''}
            ${extraData.duration ? `<p><strong>Duration:</strong> ${extraData.duration} minutes</p>` : ''}
            <p>Check it out now!</p>
          </div>
        `;
        break;
      
      case "grade_released":
        subject = "Grade Released";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="color: #1890ff;">Grade Released</h2>
            <p>Your grade has been released for an assignment in "<strong>${courseTitle}</strong>".</p>
            ${extraData.assignmentTitle ? `<p><strong>Assignment:</strong> ${extraData.assignmentTitle}</p>` : ''}
            ${extraData.score ? `<p><strong>Score:</strong> ${extraData.score}</p>` : ''}
            ${extraData.maxScore ? `<p><strong>Out of:</strong> ${extraData.maxScore}</p>` : ''}
            ${extraData.feedback ? `<p><strong>Feedback:</strong> ${extraData.feedback}</p>` : ''}
          </div>
        `;
        break;
      
      default:
        subject = "Notification from E-Study System";
        htmlContent = `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2 style="color: #1890ff;">System Notification</h2>
            <p>You have a new notification regarding "<strong>${courseTitle}</strong>".</p>
            <p>Please login to the system to view details.</p>
          </div>
        `;
    }

    await transporter.sendMail({
      from: '"E-Study System" <phettpeo160@gmail.com>',
      to: email,
      subject: subject,
      html: htmlContent
    });
    
    console.log(`✅ Course notification sent to: ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Error sending course notification:", err);
    return false;
  }
}

async function sendWelcomeEmail(email, name, role) {
  try {
    let welcomeMessage = "";
    
    if (role === "teacher") {
      welcomeMessage = `
        <p>As a teacher, you can:</p>
        <ul>
          <li>Create and manage courses</li>
          <li>Add assignments and videos</li>
          <li>Grade student submissions</li>
          <li>Communicate with students</li>
        </ul>
        <p>Your account is pending admin approval. You'll be notified once approved.</p>
      `;
    } else if (role === "student") {
      welcomeMessage = `
        <p>As a student, you can:</p>
        <ul>
          <li>Browse and enroll in courses</li>
          <li>Submit assignments</li>
          <li>Watch course videos</li>
          <li>Track your progress and grades</li>
        </ul>
        <p>Start exploring available courses now!</p>
      `;
    }

    await transporter.sendMail({
      from: '"E-Study System" <phettpeo160@gmail.com>',
      to: email,
      subject: "Welcome to E-Study System",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="color: #1890ff;">Welcome to E-Study System!</h2>
          <p>Hello ${name},</p>
          <p>Thank you for registering with E-Study System as a <strong>${role}</strong>.</p>
          ${welcomeMessage}
          <p>If you have any questions, please contact our support team.</p>
          <p>Best regards,<br>The E-Study Team</p>
        </div>
      `,
    });
    
    console.log(`✅ Welcome email sent to: ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Error sending welcome email:", err);
    return false;
  }
}

async function sendEnrollmentConfirmation(email, studentName, courseTitle, teacherName) {
  try {
    await transporter.sendMail({
      from: '"E-Study System" <phettpeo160@gmail.com>',
      to: email,
      subject: "Course Enrollment Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <h2 style="color: #1890ff;">Course Enrollment Confirmed</h2>
          <p>Hello ${studentName},</p>
          <p>You have successfully enrolled in the course:</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0;">${courseTitle}</h3>
            <p><strong>Instructor:</strong> ${teacherName}</p>
          </div>
          <p>The course will appear in your dashboard. You'll be notified when the course starts.</p>
          <p>If you have any questions, please contact your instructor or the system administrator.</p>
          <p>Best regards,<br>The E-Study Team</p>
        </div>
      `,
    });
    
    console.log(`✅ Enrollment confirmation sent to: ${email}`);
    return true;
  } catch (err) {
    console.error("❌ Error sending enrollment confirmation:", err);
    return false;
  }
}

module.exports = { 
  sendEmailNotification, 
  sendOTP, 
  sendCourseNotification,
  sendWelcomeEmail,
  sendEnrollmentConfirmation
};