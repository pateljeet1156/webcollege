const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS for all routes
app.use(cors());

// Simple test route
app.get('/test', (req, res) => {
    res.json({ 
        message: 'Server is running!',
        timestamp: new Date().toISOString()
    });
});

// API test route
app.get('/api/test', (req, res) => {
    res.json({
        status: 'ok',
        message: 'API endpoint is working',
        details: {
            server: 'running',
            port: 3000,
            timestamp: new Date().toISOString()
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    res.status(500).json({
        status: 'error',
        message: err.message
    });
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.clear(); // Clear console
    console.log('╔════════════════════════════════════════╗');
    console.log('║        Test Server is Running!         ║');
    console.log('╚════════════════════════════════════════╝');
    console.log('\nServer Details:');
    console.log('- URL: http://localhost:' + PORT);
    console.log('- Test endpoints:');
    console.log('  1. http://localhost:' + PORT + '/test');
    console.log('  2. http://localhost:' + PORT + '/api/test');
    console.log('\nPress Ctrl+C to stop the server\n');
}); 