# BookNest - Online Bookstore

BookNest is a full-stack web application for browsing, reviewing, and purchasing books. It features a modern frontend powered by Vite and a backend built with Express.js, providing user authentication and scalable API support.

---

## 🚀 Technologies Used

* **Frontend**: Vite, React (assumed), JavaScript, HTML, CSS
* **Backend**: Node.js, Express.js
* **Database**: MongoDB (assumed from `User.js` model structure)

---

## 📁 Project Structure

```
Booknest - Online bookstore/
├── client/        # Frontend (Vite)
├── server/        # Backend (Express.js)
└── README.md
```

---

## ✅ Prerequisites

* Node.js (v16 or higher)
* npm
* MongoDB (running locally or cloud URI)

---

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
https://github.com/yourusername/booknest.git
cd booknest
```

### 2. Install Dependencies

#### Client

```bash
cd client
npm install
```

#### Server

```bash
cd ../server
npm install
```

### 3. Environment Variables

Create a `.env` file in the `server/` folder with the following:

```env
MONGODB_URI=your_mongo_uri
PORT=5000
JWT_SECRET=your_secret
```

### 4. Run the Application

#### Backend:

```bash
cd server
npm start
```

#### Frontend:

```bash
cd ../client
npm run dev
```

---

## 📌 System Architecture Diagram

```
[ Client (React + Vite) ]
       ↓ REST API
[ Express.js Backend ]
       ↓ Mongoose ODM
[ MongoDB Database ]
```

---

## 📂 API Documentation

### Auth Routes - `/api/auth`

#### POST `/register`

* Registers a new user
* Body: `{ name, email, password }`

#### POST `/login`

* Authenticates user
* Body: `{ email, password }`
* Returns: JWT Token

---

## 🗃️ Database Schema

### User Model

```js
{
  name: String,
  email: String,
  password: String
}
```

---

## 🚀 Deployment Guide

1. Ensure all environment variables are correctly set in `.env`.
2. Use `npm run build` inside `/client` to generate static frontend files.
3. Host frontend on platforms like **Vercel**, **Netlify**, or **GitHub Pages**.
4. Host backend on **Render**, **Heroku**, or **Railway**.
5. Connect both frontend and backend with the correct API URLs.

---

## 📄 License

This project is licensed under the MIT License.

---

For contributions, bug reports, or feature requests, please open an issue or pull request on the [GitHub repository](https://github.com/yourusername/booknest).
