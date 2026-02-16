const pool = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');

// --- 1. UPLOAD RESOURCE ---
exports.uploadResource = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file selected." });

        const { title, category } = req.body;
        const uploaderId = req.user.id; 
        const filePath = req.file.path;

        // Fetch uploader's department
        const userResult = await pool.query(
            'SELECT department_id FROM users WHERE id = $1', 
            [uploaderId]
        );
        
        const departmentId = userResult.rows[0]?.department_id;

        if (!departmentId) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(400).json({ 
                message: "Upload failed: Your account is not linked to a department." 
            });
        }

        // Hash check (Prevent duplicates)
        const fileBuffer = fs.readFileSync(filePath);
        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        const existingFile = await pool.query('SELECT id FROM resources WHERE file_hash = $1', [fileHash]);

        if (existingFile.rows.length > 0) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(400).json({ message: "Duplicate alert: This file already exists." });
        }

        const newResource = await pool.query(
            `INSERT INTO resources 
            (uploader_id, department_id, title, category, file_url, file_hash, file_type, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
            [uploaderId, departmentId, title, category, filePath, fileHash, req.file.mimetype]
        );

        res.status(201).json(newResource.rows[0]);

    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// --- 2. GET ALL RESOURCES ---
exports.getAllResources = async (req, res) => {
    try {
        const { search, category, departmentId, trending, mine, status } = req.query;
        const cleanDeptId = (departmentId === 'undefined' || !departmentId) ? null : departmentId;
        
        let queryText = `
            SELECT r.*, COALESCE(u.full_name, 'Rootle User') as uploader_name, d.name as department_name
            FROM resources r
            LEFT JOIN users u ON r.uploader_id = u.id
            LEFT JOIN departments d ON r.department_id = d.id
        `;
        let queryParams = [];
        let conditions = [];

        if (mine === 'true') {
            queryParams.push(req.user.id);
            conditions.push(`r.uploader_id = $${queryParams.length}`);
        } else {
            conditions.push(`r.status = '${status === 'pending' ? 'pending' : 'approved'}'`);
        }

        if (search) {
            queryParams.push(`%${search}%`);
            conditions.push(`r.title ILIKE $${queryParams.length}`);
        }

        if (category && category !== 'All') {
            queryParams.push(category);
            conditions.push(`r.category = $${queryParams.length}`);
        }

        if (cleanDeptId) {
            queryParams.push(cleanDeptId);
            conditions.push(`r.department_id = $${queryParams.length}`);
        }

        if (conditions.length > 0) queryText += ` WHERE ` + conditions.join(' AND ');

        queryText += trending === 'true' 
            ? ` ORDER BY r.download_count DESC LIMIT 20` 
            : ` ORDER BY r.created_at DESC`;

        const resources = await pool.query(queryText, queryParams);
        res.json(resources.rows);
    } catch (err) {
        res.status(500).json({ message: "Error fetching library data" });
    }
};

// --- 3. REQUEST HUB LOGIC ---
exports.createRequest = async (req, res) => {
    try {
        const { title, description, departmentId } = req.body;
        const result = await pool.query(
            `INSERT INTO resource_requests (requester_id, department_id, title, description) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [req.user.id, departmentId, title, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Failed to post request" });
    }
};

exports.getRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT rr.*, u.full_name as student_name, d.name as department_name 
            FROM resource_requests rr
            JOIN users u ON rr.requester_id = u.id
            JOIN departments d ON rr.department_id = d.id
            WHERE rr.is_fulfilled = false
            ORDER BY rr.created_at DESC
        `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Error fetching requests" });
    }
};

exports.fulfillRequest = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE resource_requests SET is_fulfilled = true WHERE id = $1', [id]);
        res.json({ message: "Request marked as fulfilled!" });
    } catch (err) {
        res.status(500).json({ message: "Error updating request" });
    }
};

// --- 4. ADMIN & DELETION ---
exports.approveResource = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("UPDATE resources SET status = 'approved' WHERE id = $1", [id]);
        res.json({ message: "Resource approved!" });
    } catch (err) {
        res.status(500).json({ message: "Approval failed" });
    }
};

exports.permanentDelete = async (req, res) => {
    try {
        const { id } = req.params;
        const resource = await pool.query('SELECT file_url FROM resources WHERE id = $1', [id]);
        if (resource.rows.length > 0 && fs.existsSync(resource.rows[0].file_url)) {
            fs.unlinkSync(resource.rows[0].file_url);
        }
        await pool.query("DELETE FROM resources WHERE id = $1", [id]);
        res.json({ message: "Purged successfully." });
    } catch (err) {
        res.status(500).json({ message: "Purge failed" });
    }
};

exports.incrementDownload = async (req, res) => {
    try {
        await pool.query('UPDATE resources SET download_count = download_count + 1 WHERE id = $1', [req.params.id]);
        res.status(200).json({ message: "Success" });
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
};

exports.requestDeletion = async (req, res) => {
    try {
        await pool.query('INSERT INTO deletion_requests (resource_id, user_id) VALUES ($1, $2)', [req.params.id, req.user.id]);
        res.json({ message: "Deletion request sent to Lecturer." });
    } catch (err) {
        res.status(500).json({ message: "Request failed" });
    }
};

exports.getDeletionRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT dr.*, r.title, u.full_name as student_name
            FROM deletion_requests dr
            JOIN resources r ON dr.resource_id = r.id
            JOIN users u ON dr.user_id = u.id
            WHERE r.department_id = $1
        `, [req.user.department_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch requests" });
    }
};