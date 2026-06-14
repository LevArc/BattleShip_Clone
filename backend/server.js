import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';


import { setupSockets } from './src/sockets/index.js'; 

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json()); 

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000","http://localhost:5500"],
    methods: ["GET", "POST"]
  }
});

setupSockets(io);

app.get('/', (req, res) => {
  res.send('Server is running');
});

const PORT = process.env.PORT;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});