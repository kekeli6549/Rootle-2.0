// server/controllers/resourceController.js
const pool = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');

exports.uploadResource = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a file" });
        }

        const { title, description, departmentId } = req.body;
        const uploaderId = req.user.id; // Taken from our JWT Bouncer (Middleware)
        const filePath = req.file.path;

        // --- THE INNOVATIVE PART: FILE HASHING ---
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('md5');
        hashSum.update(fileBuffer);
        const fileHash = hashSum.digest('hex');

        // Check if hash already exists in DB
        const existingFile = await pool.query('SELECT * FROM resources WHERE file_hash = $1', [fileHash]);
        if (existingFile.rows.length > 0) {
            // Delete the file we just uploaded because it's a duplicate!
            fs.unlinkSync(filePath); 
            return res.status(400).json({ message: "This exact resource has already been uploaded by someone else." });
        }

        // Save to Database
        const newResource = await pool.query(
            'INSERT INTO resources (uploader_id, department_id, title, description, file_url, file_hash, file_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [uploaderId, departmentId, title, description, filePath, fileHash, req.file.mimetype]
        );

        res.status(201).json({
            message: "Resource uploaded successfully!",
            resource: newResource.rows[0]
        });

    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error during upload");
    }
};