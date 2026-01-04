const express = require('express');
const mongoose = require('mongoose');

const app = express();
app.use(express.json()); // Allows the API to read JSON data

// 1. Database Connection
mongoose.connect('mongodb://localhost:27017/libraryDB')
    .then(() => console.log('Connected to libraryDB...'))
    .catch(err => console.error('Connection failed:', err));

// 2. Schema & Model
const bookSchema = new mongoose.Schema({
    title: { type: String, required: true },
    author: { type: String, required: true },
    category: { type: String, required: true },
    publishedYear: { type: Number, required: true },
    availableCopies: { 
        type: Number, 
        required: true, 
        min: [0, 'Negative stock prevention: Copies cannot be less than 0'] // Error Handling Requirement
    }
});
const Book = mongoose.model('Book', bookSchema);

// --- API ROUTES ---

// CREATE: Insert a new book
app.post('/books', async (req, res) => {
    try {
        const book = new Book(req.body);
        await book.save();
        res.status(201).send(book);
    } catch (error) {
        res.status(400).send({ error: "Invalid data", details: error.message });
    }
});

// READ: All booksgit remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
app.get('/books', async (req, res) => {
    const books = await Book.find();
    res.send(books);
});

// READ: Books after 2015
app.get('/books/recent', async (req, res) => {
    const books = await Book.find({ publishedYear: { $gt: 2015 } });
    res.send(books);
});

// UPDATE: Increase/Decrease copies
app.patch('/books/:id/copies', async (req, res) => {
    try {
        const book = await Book.findByIdAndUpdate(
            req.params.id, 
            { $inc: { availableCopies: req.body.change } }, 
            { new: true, runValidators: true }
        );
        if (!book) return res.status(404).send({ error: "Book not found" }); // Error Handling
        res.send(book);
    } catch (error) {
        res.status(400).send({ error: error.message }); // Negative stock prevention
    }
});

// DELETE: Remove if copies = 0
app.delete('/books/out-of-stock', async (req, res) => {
    const result = await Book.deleteMany({ availableCopies: 0 });
    res.send({ message: `Removed ${result.deletedCount} books.` });
});

// Start Server
const PORT = 3000;
app.listen(PORT, () => console.log(`Library API running on http://localhost:${PORT}`));