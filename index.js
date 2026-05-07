const express = require('express');
const cors = require('cors');
require('dotenv').config();

const initializeDatabase = require('./config/initDb');
const schoolRoutes = require('./routes/schoolRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/', schoolRoutes);

app.get('/', (req, res) => {
    res.json({
        message: 'School Management API is running',
        endpoints: {
            addSchool: 'POST /addSchool',
            listSchools: 'GET /listSchools?latitude=<lat>&longitude=<lon>'
        }
    });
});

initializeDatabase()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to initialize database:', err.message);
        process.exit(1);
    });