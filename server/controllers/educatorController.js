import {clerkClient} from '@clerk/express'
import Course from '../models/Course.js'
import { v2 as cloudinary } from 'cloudinary'
import '../models/User.js'
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
            .sort({ createdAt: -1 })
            .lean()

        const courseIds = courses.map(course => course._id)
        const purchaseStats = await Purchase.aggregate([
            {
                $match: {
                    courseId: { $in: courseIds },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: '$courseId',
                    enrolledStudentsCount: { $sum: 1 },
                    earnings: { $sum: '$amount' }
                }
            }
        ])

        const statsByCourse = new Map(
            purchaseStats.map(stats => [stats._id.toString(), stats])
        )
        const coursesWithStats = courses.map(course => {
            const stats = statsByCourse.get(course._id.toString())

            return {
                ...course,
                enrolledStudentsCount: stats?.enrolledStudentsCount || 0,
                earnings: stats?.earnings || 0
            }
        })

        res.json({
            success: true,
            courses: coursesWithStats
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
}

export const educatorDashboardData = async (req, res) => {
    try {
        const { userId } = req.auth()
        const courses = await Course.find({ educator: userId }).select('_id')
        const courseIds = courses.map(course => course._id)

        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        })
            .sort({ createdAt: -1 })
            .populate('userId', 'name imageUrl')
            .populate('courseId', 'courseTitle')

        const validPurchases = purchases.filter(
            purchase => purchase.userId && purchase.courseId
        )
        const totalEarnings = purchases.reduce(
            (sum, purchase) => sum + Number(purchase.amount),
            0
        )
        const totalStudents = new Set(
            validPurchases.map(purchase => purchase.userId._id.toString())
        ).size
        const enrolledStudentsData = validPurchases.map(purchase => ({
            purchaseId: purchase._id,
            student: purchase.userId,
            courseTitle: purchase.courseId.courseTitle,
            purchaseDate: purchase.createdAt
        }))

        res.json({
            success: true,
            dashboardData: {
                totalEarnings,
                totalCourses: courses.length,
                totalStudents,
                totalEnrollments: purchases.length,
                enrolledStudentsData
            }
        })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}

export const getEnrolledStudentsData = async (req, res) => {
    try {
        const { userId } = req.auth()
        const courses = await Course.find({ educator: userId }).select('_id')
        const courseIds = courses.map(course => course._id)

        const purchases = await Purchase.find({
            courseId: { $in: courseIds },
            status: 'completed'
        })
            .sort({ createdAt: -1 })
            .populate('userId', 'name imageUrl')
            .populate('courseId', 'courseTitle')

        const enrolledStudents = purchases
            .filter(purchase => purchase.userId && purchase.courseId)
            .map(purchase => ({
                purchaseId: purchase._id,
                student: purchase.userId,
                courseTitle: purchase.courseId.courseTitle,
                purchaseDate: purchase.createdAt
            }))

        res.json({ success: true, enrolledStudents })
    } catch (error) {
        res.json({ success: false, message: error.message })
    }
}
