
// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;

const app = express();

// =========================
// 1. Database Connection
// =========================
const connectDB = require('./config/db');
connectDB();

// =========================
// 2. Serve Static Uploads FIRST (no auth needed for images)
// =========================
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// =========================
// 3. CORS Middleware (allow credentials for session)
// =========================
app.use(
  cors({
    origin: 'http://localhost:5173', // your Vite frontend port
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// =========================
// 4. Body Parser
// =========================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =========================
// 5. Session Middleware (after static files & CORS)
// =========================
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'agneya-super-secret-key-2026-change-this',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 7 * 24 * 60 * 60, // 7 days
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      httpOnly: true,
      secure: false, // change to true in production (HTTPS)
      sameSite: 'lax',
    },
  })
);

// =========================
// 6. Routes (protected by session)
// =========================
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/products', require('./routes/productRoutes'));
app.use('/api/orders', require('./routes/orderRoutes'));
app.use('/api/payment', require('./routes/paymentRoutes'));
app.use('/api/user', require('./routes/userRoutes'));

// Optional test route
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'Backend is alive!' });
});

// =========================
// 7. Serve React Build (SPA - catch all other routes)
// =========================
app.use(express.static(path.join(__dirname, '../agneya/dist')));

// Catch-all for React routing (must be last)
app.get('/{*splat}', (req, res) => {
  res.sendFile(path.join(__dirname, '../agneya/dist/index.html'));
});



// =========================
// 8. Start Server
// =========================
const PORT = process.env.PORT || 6060;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('Uploads available at: http://localhost:6060/uploads/');
});





// // server.js
// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// const session = require('express-session');
// // const MongoStore = require('connect-mongo');
// const MongoStore = require('connect-mongo').default;
// require('dotenv').config();

// const app = express();

// // =========================
// // Database Connection
// // =========================
// const connectDB = require('./config/db');
// connectDB();

// // =========================
// // Middleware
// // =========================

// // CORS
// app.use(
//   cors({
//     origin: 'http://localhost:5173',
//     credentials: true,
//   })
// );

// // Body parser
// app.use(express.json());

// // =========================
// // Session Middleware
// // =========================
// app.use(
//   session({
//     secret:
//       process.env.SESSION_SECRET ||
//       'agneya-super-secret-key-2026-change-this',
//     resave: false,
//     saveUninitialized: false,

//     // ✅ FIXED HERE
//     store: MongoStore.create({
//       mongoUrl: process.env.MONGO_URI,
//       collectionName: 'sessions',
//     }),

//     cookie: {
//       maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
//       httpOnly: true,
//       secure: false, // 🔁 change to true in production (HTTPS)
//       sameSite: 'lax',
//     },
//   })
// );
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// // =========================
// // Routes
// // =========================
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/admin', require('./routes/adminRoutes'));
// app.use('/api/products', require('./routes/productRoutes'));


// // app.use('/api/products', require('./routes/productRoutes'));


// // =========================
// // Serve Frontend (React)
// // =========================
// app.use(express.static(path.join(__dirname, '../agneya/dist')));

// app.get('/{*splat}', (req, res) => {
//   res.sendFile(path.join(__dirname, '../agneya/dist/index.html'));
// });



// // =========================
// // Server Start
// // =========================
// const PORT = process.env.PORT || 6060;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });

// // server.js
// const express = require('express');
// const cors = require('cors');
// const path = require('path');
// require('dotenv').config();

// const app = express();

// // Session Middleware 
// app.use(
//   session({
//     secret: process.env.SESSION_SECRET || 'your-secret-key-change-this-123456', // .env-ൽ വെക്കുക
//     resave: false,
//     saveUninitialized: false,
//     store: MongoStore.create({
//       mongoUrl: process.env.MONGO_URI,
//       collectionName: 'sessions',
//     }),
//     cookie: {
//       maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
//       httpOnly: true, // XSS protection
//       secure: false, // development-ൽ false, production-ൽ true (HTTPS)
//       sameSite: 'lax',
//     },
//   })
// );



// // Middleware
// app.use(cors({ origin: 'http://localhost:5173' })); // dev frontend
// app.use(express.json());

// // MongoDB connection
// const connectDB = require('./config/db');
// connectDB();

// // Routes
// app.use('/api/auth', require('./routes/authRoutes'));
// // app.use('/api/products', require('./routes/productRoutes'));
// // app.use('/api/orders', require('./routes/orderRoutes'));
// // app.use('/api/custom-orders', require('./routes/customOrderRoutes'));
// // app.use('/api/admin', require('./routes/adminRoutes'));

// // Serve frontend static files (after npm run build in client folder)
// app.use(express.static(path.join(__dirname, '../agneya/dist')));

// // All other routes → serve React index.html (for client-side routing)
// app.get('/', (req, res) => {
//   res.sendFile(path.join(__dirname, '../agneya/dist/index.html'));
// });

// // Test route (optional)
// app.get('/api/test', (req, res) => {
//   res.json({ message: 'Backend is working!' });
// });

// const PORT = process.env.PORT || 6060;
// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });