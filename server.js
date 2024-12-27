const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// In-memory storage for new appointments
const newAppointments = {};

// Helper function to format dates to DD.MM.YYYY
const formatDate = date => {
    // If the date is already in DD.MM.YYYY format, return it
    if (date.includes('.')) return date;

    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year}`;
};

// Fetch data from the external API and adjust year to 2025
app.get('/api/frizer', async (req, res) => {
    try {
        const response = await axios.get(
            'https://vebdizajn-4.onrender.com/api/vebdizajn/frizer'
        );
        const data = response.data;

        // Adjust the year to 2025 and format dates
        const updatedData = {};
        for (const [date, times] of Object.entries(data)) {
            const [day, month, year] = date.split('.').map(Number);
            const newDate = `${day.toString().padStart(2, '0')}.${month
                .toString()
                .padStart(2, '0')}.2025`;
            updatedData[newDate] = times;
        }

        // Combine updatedData with newAppointments
        const combinedData = { ...updatedData };
        for (const [date, times] of Object.entries(newAppointments)) {
            if (!combinedData[date]) {
                combinedData[date] = [];
            }
            combinedData[date] = [
                ...new Set([...combinedData[date], ...times]),
            ];
        }

        res.json(combinedData);
    } catch (error) {
        console.error('Error fetching data from external API:', error.message);
        res.status(500).json({
            error: 'Failed to fetch data from the external API.',
        });
    }
});

// Handle new appointment submissions
app.post('/api/frizer', (req, res) => {
    const { date, time } = req.body;

    if (!date || !time) {
        return res.status(400).json({ error: 'Date and time are required.' });
    }

    const formattedDate = formatDate(date);

    if (!newAppointments[formattedDate]) {
        newAppointments[formattedDate] = [];
    }

    if (!newAppointments[formattedDate].includes(time)) {
        newAppointments[formattedDate].push(time);
    }

    console.log(
        `Received appointment: Date = ${formattedDate}, Time = ${time}`
    );
    res.status(200).json({ message: 'Appointment submitted successfully.' });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});
