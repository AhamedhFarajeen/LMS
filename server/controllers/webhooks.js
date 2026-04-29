import { Webhook } from "svix";
import User from "../models/User.js";
import Stripe from "stripe";
import { Purchase } from "../models/Purchase.js";
import Course from "../models/Course.js";

const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

//Api controller function to manage clerk user with databse
export const clerkWebhooks = async(req, res)=> {
    try{
        const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET)

        await whook.verify(JSON.stringify(req.body), {
            "svix-id": req.headers["svix-id"],
            "svix-timestamp": req.headers["svix-timestamp"],
            "svix-signature": req.headers["svix-signature"]
        })

        const {data, type} = req.body

        switch (type) {

            case 'user.created':{
                const userData = {
                    _id: data.id,
                    email: data.email_addresses[0].email_address,
                    name: data.first_name + " " + data.last_name,
                    imageUrl: data.image_url,
                }
                await User.create(userData)
                res.json({})
                break
            }
                
            case 'user.updated': {
                const userData = {
                    email: data.email_addresses[0].email_address,
                    name: data.first_name + " " + data.last_name,
                    imageUrl: data.image_url,
                }
                await User.findByIdAndUpdate(data.id, userData)
                res.json({})
                break
            }

            case 'user.deleted': {
                await User.findByIdAndDelete(data.id)
                res.json({})
                break
            }
        
            default:
                break;
        }

    }catch(error){
        res.json({success: false, message: error.message})
    }
}

export const stripeWebhooks = async (request, response) => {
    const sig = request.headers['stripe-signature'];
    let event;

    try {
        event = stripeInstance.webhooks.constructEvent(
            request.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const { purchaseId } = session.metadata;

            const purchaseData = await Purchase.findById(purchaseId);
            if (!purchaseData) {
                return response.status(404).json({
                    success: false,
                    message: 'Purchase not found'
                });
            }

            const userData = await User.findById(purchaseData.userId);
            const courseData = await Course.findById(purchaseData.courseId.toString());

            if (!userData || !courseData) {
                return response.status(404).json({
                    success: false,
                    message: 'User or course not found'
                });
            }

            if (!courseData.enrolledStudents.includes(userData._id)) {
                courseData.enrolledStudents.push(userData._id);
                await courseData.save();
            }

            if (!userData.enrolledCourses.includes(courseData._id)) {
                userData.enrolledCourses.push(courseData._id);
                await userData.save();
            }

            purchaseData.status = 'completed';
            await purchaseData.save();

            break;
        }

        case 'checkout.session.expired': {
            const session = event.data.object;
            const { purchaseId } = session.metadata;

            const purchaseData = await Purchase.findById(purchaseId);
            if (purchaseData) {
                purchaseData.status = 'failed';
                await purchaseData.save();
            }

            break;
        }

        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    response.json({ received: true });
};