# Gather Town Clone

A virtual office space application inspired by Gather Town, built with React, Phaser, WebRTC, and Socket.IO.

## 🚀 Features

- **Virtual Office Space**: 2D top-down view with Phaser game engine
- **Real-time Video/Audio Calls**: WebRTC-based video conferencing
- **Text Chat**: Multiple chat channels (Global, Nearby, DM, Group)
- **Voice Channels**: Discord-like voice channels
- **Calendar & Events**: Schedule and manage events
- **Interactive Objects**: Place and interact with objects (whiteboards, videos, etc.)
- **User Presence**: See who's online and where they are
- **Reactions**: Send emoji reactions in real-time
- **Multi-tab Support**: Camera management across browser tabs

## 🛠️ Tech Stack

### Frontend
- React 19 + TypeScript
- Vite
- Phaser 3 (Game Engine)
- Tailwind CSS
- Socket.IO Client
- Simple Peer (WebRTC)

### Backend
- Node.js + Express
- TypeScript
- Socket.IO
- MongoDB + Mongoose
- JWT Authentication
- WebRTC Signaling

## 📦 Installation

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- npm or yarn

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Gather
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

4. **Configure environment variables**
   ```bash
   # Backend
   cp backend/env.example.txt backend/.env
   # Edit backend/.env with your configuration
   
   # Frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Start MongoDB** (if using local)
   ```bash
   # Install MongoDB locally or use MongoDB Atlas (cloud)
   ```

6. **Start backend**
   ```bash
   cd backend
   npm run dev
   ```

7. **Start frontend** (in another terminal)
   ```bash
   npm run dev
   ```

8. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5001

## 📚 Documentation

- [DOCS.md](./docs/DOCS.md) - Complete documentation

## 🔒 Security Features

- Password strength validation
- Input sanitization (XSS protection)
- Rate limiting
- Account lockout (brute force protection)
- Refresh tokens & session management
- RBAC (Role-Based Access Control)
- JWT authentication

## ⚡ Performance Optimizations

- Code splitting & lazy loading
- Database indexes
- Query optimization
- Movement throttling
- Batch position updates
- Network traffic reduction (~80%)

## 🏗️ Project Structure

```
Gather/
├── src/                    # Frontend source
│   ├── components/         # React components
│   ├── contexts/           # React contexts
│   ├── hooks/              # Custom hooks
│   ├── pages/              # Page components
│   └── utils/              # Utility functions
├── backend/                # Backend source
│   ├── controllers/        # Route controllers
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   ├── middleware/         # Express middleware
│   └── utils/              # Utility functions
```

## 🚢 CI/CD

GitHub Actions workflows (if configured):
- **CI Pipeline**: Runs on push/PR

See `.github/workflows/` for details.

## 📝 Environment Variables

### Frontend
- `VITE_SERVER_URL`: Backend API URL

### Backend
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT secret key
- `JWT_REFRESH_SECRET`: Refresh token secret
- `CLIENT_URL`: Frontend URL
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth secret
- See `backend/env.example.txt` for full list

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

ISC

## 🙏 Acknowledgments

- Inspired by Gather Town
- Built with modern web technologies
- Open source community

## 📞 Support

For issues or questions:
- Review GitHub Issues
- Contact the development team

---

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Last Updated**: January 2026
