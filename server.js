import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
// import briefRouter from './routes/brief.js';
import './db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARE //

app.use(cors({
    origin: process.env.NODE_ENV === 'prodution' ? 'https://tiagocr.me' : '*'
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// ROUTES //

// app.use('/brief', briefRouter);

// CHECK //

app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 //

app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Error handler //

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong' });
});

// Start //

app.listen(PORT, () => {
    console.log(`Server running on PORT ${PORT}`);
});


