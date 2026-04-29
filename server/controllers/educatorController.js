import {clerkClient} from '@clerk/express'
import Course from '../models/Course.js'
import { v2 as cloudinary } from 'cloudinary'
import User from '../models/User.js'
import { Purchase } from '../models/Purchase.js'


export const updateRoleToEducator = async (req, res) => {
    try {
        const { userId } = req.auth()

        

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            })
        }

        await clerkClient.users.updateUserMetadata(userId, {
            publicMetadata: {
                role: 'educator',
            }
        })

        res.json({
            success: true,
            message: 'You can publish a course now'
        })

    } catch (error) {
        
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

// Add New Course

export const addCourse = async (req, res) => {
    try {
       
        const authData = req.auth ? req.auth() : null
        

        const { courseData } = req.body
        const imageFile = req.file
        const { userId } = authData || {}

        if (!userId) {
           
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            })
        }

        if (!imageFile) {
           
            return res.status(400).json({
                success: false,
                message: "Thumbnail not attached"
            })
        }

        if (!courseData) {
            
            return res.status(400).json({
                success: false,
                message: "Course data is required"
            })
        }

        let parsedCourseData
        try {
            parsedCourseData = JSON.parse(courseData)
            
        } catch (parseError) {
            
            return res.status(400).json({
                success: false,
                message: "Invalid JSON in courseData"
            })
        }

        parsedCourseData.educator = userId
    

        const newCourse = await Course.create(parsedCourseData)
        

        const imageUpload = await cloudinary.uploader.upload(imageFile.path)
       
        newCourse.courseThumbnail = imageUpload.secure_url
        await newCourse.save()

        
        res.json({
            success: true,
            message: "Course added successfully",
            course: newCourse
        })

    } catch (error) {
    

        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

//get educator courses

export const getEducatorCourses = async (req, res) => {
    try {
        const { userId } = req.auth()

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            })
        }

        const courses = await Course.find({ educator: userId })

        res.json({
            success: true,
            courses
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const educatorDashboardData = async(req,res) =>{
    try {
        const educator = req.auth.userId

        const courses = await Course.find({educator});
        const totalCourses = courses.length;

        const courseIds = courses.map(course => course._id)
        // calculate total earnings from purchases
        const purchases = await Purchase.find({
            courseId: {$in: courseIds},
            status: 'completed'
        });

        const totalEarnings =purchases.reduce((sum, purchase) => sum + purchase.amount, 0)
        
        // collect unique enrolled students ids with their course title

        const enrolledStudentsData = [];
        for(const course of courses){
            const students = await User.find({
                _id: {$in: course.enrolledStudents}
            }, 'name imageUrl')

            students.forEach(student => {
                enrolledStudentsData.push({
                    courseTitle: course.courseTitle,
                    student
                });
            });
        }
        res.json({success: true, dashboardData: {
            totalEarnings,enrolledStudentsData, totalCourses
        }})
    } catch (error) {
        res.json({success: false, message:error.message})    
    }
}

export const getEnrolledStudentsData = async(req,res) =>{
    try {
        const educator = req.auth.userId;
        const courses = await Course.find({educator})
        const courseIds = courses.map(course => course._id)

        const purchases = await Purchase.find({
            courseId: {$in: courseIds},
            status: 'completed'
        }).populate('userId', 'name imageUrl').populate('courseId', 'courseTitle')

        const enrolledStudents = purchases.map(purchase => ({
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }));

        res.json({success: true, enrolledStudents});

    } catch (error) {
        res.json({success: false, message:error.message})
    }
}



