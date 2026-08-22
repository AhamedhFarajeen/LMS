import Course from "../models/Course.js";
import User from "../models/User.js";
import { Purchase } from "../models/Purchase.js";
import { CourseProgress } from "../models/CourseProgress.js";
import Stripe from "stripe";

// Get users data
export const getUserData = async (req, res) => {
  try {
    const { userId } = req.auth();
    const user = await User.findById(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found!" });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// User enrolled course with lecture link

export const userEnrolledCourses = async (req, res) => {
  try {
    const { userId } = req.auth();
    const userData = await User.findById(userId).populate("enrolledCourses");

    if (!userData) {
      return res.json({ success: false, message: "User not found!" });
    }

    res.json({ success: true, enrolledCourses: userData.enrolledCourses });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const purchaseCourse = async (req, res) => {
  try {
    const { courseId } = req.body;
    const { origin } = req.headers;
    const { userId } = req.auth();

    const userData = await User.findById(userId);

    const courseData = await Course.findById(courseId);
    if (!userData || !courseData) {
      return res.json({ success: false, message: "Data Not Found" });
    }

    const isAlreadyEnrolled = userData.enrolledCourses.some(
      (enrolledCourseId) => enrolledCourseId.toString() === courseId,
    );
    if (isAlreadyEnrolled) {
      return res.json({ success: false, message: "Already enrolled" });
    }

    const purchaseData = {
      courseId: courseData._id,
      userId,
      amount: (
        courseData.coursePrice -
        (courseData.discount * courseData.coursePrice) / 100
      ).toFixed(2),
    };

    const newPurchase = await Purchase.create(purchaseData);

    // stripe gateway initialize
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const currency = process.env.CURRENCY.toLowerCase();

    // creating line items to for stripe
    const line_items = [
      {
        price_data: {
          currency,
          product_data: {
            name: courseData.courseTitle,
          },
          unit_amount: Math.round(Number(newPurchase.amount) * 100),
        },
        quantity: 1,
      },
    ];

    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/loading/player?courseId=${courseData._id}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/`,
      line_items: line_items,
      mode: "payment",
      metadata: {
        purchaseId: newPurchase._id.toString(),
        userId,
      },
    });

    res.json({ success: true, session_url: session.url });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const completePurchase = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.json({ success: false, message: "Payment session is missing" });
    }

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.json({ success: false, message: "Payment is not completed" });
    }

    const purchaseData = await Purchase.findById(session.metadata?.purchaseId);
    if (!purchaseData || purchaseData.userId !== userId) {
      return res.json({ success: false, message: "Purchase not found" });
    }

    purchaseData.status = "completed";
    await purchaseData.save();

    await Promise.all([
      User.findByIdAndUpdate(userId, {
        $addToSet: { enrolledCourses: purchaseData.courseId },
      }),
      Course.findByIdAndUpdate(purchaseData.courseId, {
        $addToSet: { enrolledStudents: userId },
      }),
    ]);

    res.json({
      success: true,
      courseId: purchaseData.courseId.toString(),
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const updateUserCourseProgress = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId, lectureId } = req.body;

    const [user, course] = await Promise.all([
      User.findById(userId),
      Course.findById(courseId),
    ]);
    const isEnrolled = user?.enrolledCourses.some(
      (enrolledCourseId) => enrolledCourseId.toString() === courseId,
    );

    if (!isEnrolled || !course) {
      return res.json({ success: false, message: "Course access denied" });
    }

    const lectureIds = course.courseContent.flatMap((chapter) =>
      chapter.chapterContent.map((lecture) =>
        (lecture.lectureid || lecture.lectureId).toString(),
      ),
    );
    if (!lectureIds.includes(lectureId)) {
      return res.json({ success: false, message: "Lecture not found" });
    }

    const progressData = await CourseProgress.findOneAndUpdate(
      { userId, courseId },
      { $addToSet: { lectureCompleted: lectureId } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    progressData.completed = lectureIds.every((id) =>
      progressData.lectureCompleted.includes(id),
    );
    await progressData.save();

    res.json({
      success: true,
      message: "Progress Updated",
      progressData,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

export const getUserCourseProgress = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId } = req.body;
    const progressData = await CourseProgress.findOne({ userId, courseId });
    res.json({ success: true, progressData });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};

// Add User Rating to Course

export const addUserRating = async (req, res) => {
  try {
    const { userId } = req.auth();
    const { courseId, rating } = req.body;

    if (!courseId || !userId || !rating || rating < 1 || rating > 5) {
      return res.json({ success: false, message: "Invalid details" });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.json({ success: false, message: "Course Not found!" });
    }

    const user = await User.findById(userId);

    const isEnrolled = user?.enrolledCourses.some(
      (enrolledCourseId) => enrolledCourseId.toString() === courseId,
    );
    if (!isEnrolled) {
      return res.json({
        success: false,
        message: "User has not purchased this course.",
      });
    }

    const existingRatingIndex = course.courseRatings.findIndex(
      (r) => r.userId === userId,
    );
    if (existingRatingIndex > -1) {
      course.courseRatings[existingRatingIndex].rating = rating;
    } else {
      course.courseRatings.push({ userId, rating });
    }

    // await courseData.save()
    await course.save();
    res.json({ success: true, message: "Rating Added" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};
