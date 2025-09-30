import express from 'express';
import http from 'http';
import { Server as SocketServer } from 'socket.io';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import sosRouter from './routes/sos.js';
app.use('/sos', sosRouter);

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new SocketServer(server, { cors: { origin: '*' } });


app.use(cors());
app.use(express.json());
app.set('io', io);


// Simple health check
app.get('/health', (req, res) => res.json({ ok: true }));


io.on('connection', socket => {
    console.log('socket connected', socket.id);
    socket.on('join', room => socket.join(room));
});


const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/disaster';
mongoose.connect(MONGO)
    .then(() => {
        console.log('mongo connected');
        const PORT = process.env.PORT || 4000;
        server.listen(PORT, () => console.log('server listening', PORT));
    })
    .catch(err => console.error('mongo connect error', err));