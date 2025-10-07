require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS configuration
const corsOptions = {
    origin: '*',  // Allow all origins
    methods: ['GET', 'POST'],  // Specify allowed methods
    allowedHeaders: ['Content-Type'],  // Specify allowed headers
};
app.use(cors(corsOptions));

// Middleware for parsing JSON requests and serving static files
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes

// Serve the main HTML page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Get tips from the db.json file
app.get('/api/tips', (req, res) => {
    // Read the db.json file
    fs.readFile(path.join(__dirname, 'db.json'), 'utf-8', (err, data) => {
        if (err) {
            console.error("Error reading db.json:", err);
            return res.status(500).json({ error: 'Failed to load tips' });
        }

        // Parse the data and send it as JSON
        try {
            const tips = JSON.parse(data).tips;
            res.json(tips);
        } catch (error) {
            console.error("Error parsing db.json:", error);
            res.status(500).json({ error: 'Failed to parse tips data' });
        }
    });
});

// Neue Route für einzelne Tips
app.get('/api/tips/:id', (req, res) => {
    fs.readFile(path.join(__dirname, 'db.json'), 'utf-8', (err, data) => {
        if (err) {
            console.error("Error reading db.json:", err);
            return res.status(500).json({ error: 'Failed to load tip' });
        }

        try {
            const tips = JSON.parse(data).tips;
            const tip = tips.find(t => t.id === parseInt(req.params.id));
            
            if (!tip) {
                return res.status(404).json({ error: 'Tip not found' });
            }
            
            res.json(tip);
        } catch (error) {
            console.error("Error parsing db.json:", error);
            res.status(500).json({ error: 'Failed to parse tip data' });
        }
    });
});

// 404 Handling for undefined routes
app.use((req, res) => {
    res.status(404).json({ error: "Endpoint not found" });
});

// Error Handling Middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: "Something went wrong!" });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
