import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './configs/mongodb.js'
import { clerkWebhooks } from './controllers/webhooks.js'
import educatorRouter from './routes/educatorRoutes.js'
import { clerkMiddleware } from '@clerk/express'

//Initialize Express
const app = express()

// Connect to DB
await connectDB()

//Middleware
app.use(cors())
app.use(clerkMiddleware())

//Route
app.get('/',(req, res)=> res.send("API Working"))
app.post('/clerk', express.json(), clerkWebhooks)
app.use('/api/educator', express.json(), educatorRouter)

//Port no
const PORT = process.env.PORT || 4000

app.listen(PORT, ()  => {
    console.log(`Server is running on port ${PORT}`)
})