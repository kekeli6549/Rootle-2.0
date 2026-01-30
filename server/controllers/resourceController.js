const pool = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');

exports.uploadResource = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a file" });
        }

        const { title, category } = req.body;
        const uploaderId = req.user.id; 
        const filePath = req.file.path;

        const userResult = await pool.query('SELECT department_id FROM users WHERE id = $1', [uploaderId]);
        const departmentId = userResult.rows[0].department_id;

        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('md5');
        hashSum.update(fileBuffer);
        const fileHash = hashSum.digest('hex');

        const existingFile = await pool.query('SELECT * FROM resources WHERE file_hash = $1', [fileHash]);
        if (existingFile.rows.length > 0) {
            fs.unlinkSync(filePath); 
            return res.status(400).json({ message: "This exact resource has already been uploaded." });
        }

        const newResource = await pool.query(
            `INSERT INTO resources 
            (uploader_id, department_id, title, category, file_url, file_hash, file_type) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [uploaderId, departmentId, title, category, filePath, fileHash, req.file.mimetype]
        );

        res.status(201).json({
            message: "Resource uploaded successfully!",
            resource: newResource.rows[0]
        });

    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ message: "Server Error during upload" });
    }
};

exports.getAllResources = async (req, res) => {
    try {
        const { search, category, departmentId, trending, mine } = req.query;
        let queryText = `
            SELECT resources.*, users.full_name as uploader_name 
            FROM resources 
            JOIN users ON resources.uploader_id = users.id
        `;
        let queryParams = [];
        let conditions = [];

        // --- NEW LOGIC: Filter by Personal vs Community ---
        if (mine === 'true') {
            queryParams.push(req.user.id);
            conditions.push(`resources.uploader_id = $${queryParams.length}`);
            conditions.push(`resources.deleted_by_user = false`); 
        } else {
            // Only show approved files in public feeds
            conditions.push(`resources.status = 'approved'`);
        }

        if (search) {
            queryParams.push(`%${search}%`);
            conditions.push(`resources.title ILIKE $${queryParams.length}`);
        }

        if (category && category !== 'All') {
            queryParams.push(category);
            conditions.push(`resources.category = $${queryParams.length}`);
        }

        if (departmentId) {
            queryParams.push(departmentId);
            conditions.push(`resources.department_id = $${queryParams.length}`);
        }

        if (conditions.length > 0) {
            queryText += ` WHERE ` + conditions.join(' AND ');
        }

        if (trending === 'true') {
            queryText += ` ORDER BY resources.download_count DESC, resources.created_at DESC LIMIT 20`;
        } else {
            queryText += ` ORDER BY resources.created_at DESC`;
        }

        const resources = await pool.query(queryText, queryParams);
        res.json(resources.rows);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ message: "Error fetching library data" });
    }
};

// --- NEW: Request Deletion Function ---
exports.requestDeletion = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // 1. Mark as deleted for the user (hides it from 'My Library')
        await pool.query(
            'UPDATE resources SET deleted_by_user = true WHERE id = $1 AND uploader_id = $2',
            [id, userId]
        );

        // 2. Alert the Admin (Record the request)
        await pool.query(
            'INSERT INTO deletion_requests (resource_id, user_id) VALUES ($1, $2)',
            [id, userId]
        );

        res.json({ message: "File removed from library. Admin notified for permanent deletion." });
    } catch (err) {
        console.error("Deletion Request Error:", err);
        res.status(500).json({ message: "Error processing deletion request" });
    }
};

exports.incrementDownload = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE resources SET download_count = download_count + 1 WHERE id = $1', [id]);
        res.status(200).json({ message: "Heat increased!" });
    } catch (err) {
        res.status(500).json({ message: "Error updating stats" });
    }
};