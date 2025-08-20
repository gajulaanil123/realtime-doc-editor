const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const cors = require('cors');

// === App Setup ===
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*", // Allow frontend to connect
    methods: ["GET", "POST"],
  }
});

app.use(cors());
app.use(express.json());

// === MongoDB Connection ===
mongoose.connect(
  "mongodb+srv://agajula4:RAh5geoyljabeT42@cluster0.ulb2rp3.mongodb.net/realtime-doc?retryWrites=true&w=majority&appName=Cluster0",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
).then(() => {
  console.log("✅ Connected to MongoDB Atlas");
}).catch((err) => {
  console.error("❌ MongoDB connection error:", err);
});

// === Mongoose Schema & Model ===
const DocumentSchema = new mongoose.Schema({
  _id: String, // Use socket docId as _id
  content: String,
});

const Document = mongoose.model("Document", DocumentSchema);

// === Socket.IO Logic ===
io.on('connection', (socket) => {
  console.log('📡 New client connected:', socket.id);

  // When client requests a document
  socket.on('get-document', async (documentId) => {
    // Find or create document
    let document = await Document.findById(documentId);
    if (!document) {
      document = await Document.create({ _id: documentId, content: "" });
    }

    // Join the socket room for this document
    socket.join(documentId);

    // Send initial content
    socket.emit('load-document', document.content);

    // Handle changes sent by one client
    socket.on('send-changes', (delta) => {
      socket.to(documentId).emit('receive-changes', delta);
    });

    // Save document on change
    socket.on('save-document', async (data) => {
      await Document.findByIdAndUpdate(documentId, { content: data });
    });
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// === Start Server ===
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
