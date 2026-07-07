# 🎓 Learning Management System (LMS)

A modern full-stack Learning Management System (LMS) that enables students to browse and purchase courses, while instructors can create and manage educational content. The platform provides secure authentication, online payments, video-based learning, and an intuitive dashboard.

---

## 🚀 Features

### 👨‍🎓 Student
- User registration & login with Clerk Authentication
- Browse available courses
- Purchase courses securely using Stripe
- Watch course videos
- Track course progress
- View enrolled courses
- Responsive user interface

### 👨‍🏫 Educator
- Instructor Dashboard
- Create new courses
- Upload course thumbnails
- Add chapters and lectures
- Upload videos
- View enrolled students
- Monitor course performance

### 🔐 Authentication
- Secure authentication using Clerk
- Protected routes
- Role-based access control

### 💳 Payments
- Secure course payments using Stripe
- Enrollment after successful payment

### ☁️ Media Storage
- Image uploads via Cloudinary
- Video support

---

# 🛠 Tech Stack

## Frontend

- React.js
- Vite
- React Router
- Tailwind CSS
- Axios
- React Toastify
- React YouTube
- Quill Editor

## Backend

- Node.js
- Express.js
- MongoDB
- Mongoose
- Clerk Authentication
- Stripe
- Cloudinary
- Multer

---

# 📂 Project Structure

```text
lms/
│
├── client/          # React Frontend
│
├── server/          # Express Backend
│
└── README.mdx
```

---

# ⚙️ Installation

## Clone the Repository

```bash
git clone https://github.com/yourusername/lms.git

cd lms
```

---

## Install Client Dependencies

```bash
cd client
npm install
```

---

## Install Server Dependencies

```bash
cd ../server
npm install
```

---

# 🔑 Environment Variables

## Client (.env)

```env
VITE_CLERK_PUBLISHABLE_KEY=your_key
VITE_BACKEND_URL=http://localhost:5000
```

---

## Server (.env)

```env
PORT=5000

MONGODB_URI=your_mongodb_connection

CLERK_SECRET_KEY=your_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_secret

STRIPE_SECRET_KEY=your_stripe_secret

WEBHOOK_SECRET=your_webhook_secret
```

---

# ▶️ Running the Project

## Start Backend

```bash
cd server

npm run server
```

---

## Start Frontend

```bash
cd client

npm run dev
```

The application will run at:

Frontend

```
http://localhost:5173
```

Backend

```
http://localhost:5000
```

---

# 📸 Screenshots

> Add screenshots of your application here.

Example:

```
screenshots/
├── home.png
├── course-details.png
├── dashboard.png
├── my-learning.png
└── checkout.png
```

---

# 📦 Main Dependencies

### Frontend

- React
- React Router
- Axios
- Tailwind CSS
- Clerk
- React Toastify
- Quill
- React YouTube

### Backend

- Express
- MongoDB
- Mongoose
- Clerk
- Stripe
- Cloudinary
- Multer

---

# ✨ Future Improvements

- Course reviews and ratings
- Certificates upon completion
- Quiz and assignment system
- Admin panel
- Live classes
- Discussion forum
- Notifications
- Email reminders

---

# 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create a feature branch

```bash
git checkout -b feature/new-feature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push to your branch

```bash
git push origin feature/new-feature
```

5. Open a Pull Request

---

# 📄 License

This project is intended for educational purposes.

---

# 👨‍💻 Author

**Ahamedh Farajeen**

Software Engineering Undergraduate

If you found this project useful, consider giving it a ⭐ on GitHub!
