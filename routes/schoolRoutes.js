const express = require('express');
const router = express.Router();
const pool = require('../config/db');

router.post('/addSchool', async (req, res) => {
    try {
        const { name, address, latitude, longitude } = req.body;

        let errors = [];

        if (!name || typeof name !== 'string' || !name.trim()) {
            errors.push('name is required and must be a non-empty string');
        }
        if (!address || typeof address !== 'string' || !address.trim()) {
            errors.push('address is required and must be a non-empty string');
        }
        if (latitude == null || typeof latitude !== 'number' || isNaN(latitude)) {
            errors.push('latitude must be a valid number');
        } else if (latitude < -90 || latitude > 90) {
            errors.push('latitude must be between -90 and 90');
        }
        if (longitude == null || typeof longitude !== 'number' || isNaN(longitude)) {
            errors.push('longitude must be a valid number');
        } else if (longitude < -180 || longitude > 180) {
            errors.push('longitude must be between -180 and 180');
        }

        if (errors.length > 0) {
            return res.status(400).json({ success: false, message: 'Validation failed', errors });
        }

        const [result] = await pool.query(
            'INSERT INTO schools (name, address, latitude, longitude) VALUES (?, ?, ?, ?)',
            [name.trim(), address.trim(), latitude, longitude]
        );

        res.status(201).json({
            success: true,
            message: 'School added successfully',
            data: { id: result.insertId, name: name.trim(), address: address.trim(), latitude, longitude }
        });

    } catch (err) {
        console.error('Error in /addSchool:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.get('/listSchools', async (req, res) => {
    try {
        const userLat = parseFloat(req.query.latitude);
        const userLon = parseFloat(req.query.longitude);

        if (isNaN(userLat) || isNaN(userLon)) {
            return res.status(400).json({ success: false, message: 'latitude and longitude are required as query params' });
        }
        if (userLat < -90 || userLat > 90) {
            return res.status(400).json({ success: false, message: 'latitude must be between -90 and 90' });
        }
        if (userLon < -180 || userLon > 180) {
            return res.status(400).json({ success: false, message: 'longitude must be between -180 and 180' });
        }

        const [schools] = await pool.query('SELECT * FROM schools');

        const toRad = (deg) => deg * Math.PI / 180;

        function getDistance(lat1, lon1, lat2, lon2) {
            const R = 6371;
            const dLat = toRad(lat2 - lat1);
            const dLon = toRad(lon2 - lon1);

            const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                      Math.sin(dLon / 2) * Math.sin(dLon / 2);

            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
            return R * c;
        }

        const result = schools.map(school => ({
            ...school,
            distance_km: parseFloat(getDistance(userLat, userLon, school.latitude, school.longitude).toFixed(2))
        }));

        result.sort((a, b) => a.distance_km - b.distance_km);

        res.json({
            success: true,
            message: `Found ${result.length} school(s)`,
            data: result
        });

    } catch (err) {
        console.error('Error in /listSchools:', err.message);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;