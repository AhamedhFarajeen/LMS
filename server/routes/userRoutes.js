import express from "express";

import {
  getUserData,
  userEnrolledCourses,
  purchaseCourse,
  completePurchase,
  updateUserCourseProgress,
  getUserCourseProgress,
  addUserRating,
} from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get('/data', getUserData);
userRouter.get('/enrolled-courses', userEnrolledCourses);
userRouter.post('/purchase', purchaseCourse);
userRouter.post('/complete-purchase', completePurchase);
userRouter.post('/update-course-progress', updateUserCourseProgress);
userRouter.post('/get-course-progress', getUserCourseProgress);
userRouter.post('/add-rating', addUserRating);


export default userRouter;
