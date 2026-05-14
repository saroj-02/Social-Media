# Aura Social Media Platform

A modern, interactive social media application built with Node.js, Express, MongoDB, and Vanilla JavaScript.

## Features

- **User Authentication**: Secure Login and Signup using JWT and Bcrypt.
- **Dynamic Feed**: Real-time interaction with posts, including text and media placeholders.
- **Likes & Comments**: Engage with other users' content through likes and a nested commenting system.
- **Follow System**: Follow other users to build your network.
- **User Profiles**: Dedicated pages for each user showing their bio, stats, and activity.
- **Premium Design**: Dark mode aesthetic with glassmorphism, vibrant gradients, and smooth animations.

## Tech Stack

- **Frontend**: HTML5, CSS3 (Vanilla), JavaScript (Vanilla)
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (via Mongoose)
- **Security**: JWT, BcryptJS

## Getting Started

### Prerequisites

- Node.js installed
- MongoDB installed and running locally (or provide a remote URI in `.env`)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Environment:
   The project comes with a default `.env` file. You can update `MONGO_URI` if your database is hosted elsewhere.

3. Start the server:
   ```bash
   npm run dev
   ```

4. Open the application:
   Open `client/index.html` in your browser (or use a Live Server).

## API Endpoints

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create a new post (Auth required)
- `POST /api/posts/:id/like` - Like/Unlike a post (Auth required)
- `GET /api/users/profile/:id` - Get user profile
- `POST /api/users/follow/:id` - Follow/Unfollow a user (Auth required)
