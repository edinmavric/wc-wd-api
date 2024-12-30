const express = require('express');
const axios = require('axios');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = 3000;
const FILE_PATH = './appointments.json'; // Path to the JSON file

// Enable CORS
app.use(cors());

// Enable JSON body parsing
app.use(express.json());

// Load appointments from file
const loadAppointments = () => {
    if (fs.existsSync(FILE_PATH)) {
        const fileData = fs.readFileSync(FILE_PATH, 'utf-8');
        return JSON.parse(fileData);
    }
    return {};
};

// Save appointments to file
const saveAppointments = appointments => {
    fs.writeFileSync(FILE_PATH, JSON.stringify(appointments, null, 2));
};

// In-memory storage for new appointments, loaded from file
let newAppointments = loadAppointments();

// Helper function to format dates to DD.MM.YYYY
const formatDate = date => {
    if (date.includes('.')) return date; // Already formatted
    const [year, month, day] = date.split('-');
    return `${day}.${month}.${year}`;
};

// Fetch data from the external API and adjust year to 2025
app.get('/api/frizer', async (req, res) => {
    try {
        const response = await axios.get(
            'https://vebdizajn-4.onrender.com/api/vebdizajn/frizer'
        );
        const externalData = response.data;

        // Adjust the year to 2025 and format dates
        const updatedData = {};
        for (const [date, times] of Object.entries(externalData)) {
            const [day, month, year] = date.split('.').map(Number);
            const newDate = `${day.toString().padStart(2, '0')}.${month
                .toString()
                .padStart(2, '0')}.2025`;
            updatedData[newDate] = times;
        }

        // Combine externalData with newAppointments
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
        saveAppointments(newAppointments); // Persist the data
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
