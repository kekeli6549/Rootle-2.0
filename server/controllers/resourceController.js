const pool = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');

// --- 1. UPLOAD RESOURCE ---
exports.uploadResource = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ message: "No file selected." });

        const { title, category, requestId } = req.body; 
        const uploaderId = req.user.id; 
        const filePath = req.file.path;

        // Get Lecturer's department
        const userResult = await pool.query('SELECT department_id FROM users WHERE id = $1', [uploaderId]);
        const departmentId = userResult.rows[0]?.department_id;

        if (!departmentId) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(400).json({ message: "Account not linked to a department." });
        }

        // Check for duplicates
        const fileBuffer = fs.readFileSync(filePath);
        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        const existingFile = await pool.query('SELECT id FROM resources WHERE file_hash = $1', [fileHash]);

        if (existingFile.rows.length > 0) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(400).json({ message: "Duplicate alert: File already exists." });
        }

        // Insert resource (Staff uploads are auto-approved)
        const newResource = await pool.query(
            `INSERT INTO resources 
            (uploader_id, department_id, title, category, file_url, file_hash, file_type, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved') RETURNING *`,
            [uploaderId, departmentId, title, category, filePath, fileHash, req.file.mimetype]
        );

        // Handle Hub Fulfillment
        const parsedRequestId = parseInt(requestId);
        if (requestId && !isNaN(parsedRequestId)) {
            await pool.query(
                'UPDATE resource_requests SET is_fulfilled = true, fulfilled_by = $1, fulfilled_at = NOW() WHERE id = $2', 
                [uploaderId, parsedRequestId]
            );
        }

        res.status(201).json(newResource.rows[0]);
    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// --- 2. GET ALL RESOURCES ---
exports.getAllResources = async (req, res) => {
    try {
        const { search, category, departmentId, status } = req.query;
        let queryText = `
            SELECT r.*, u.full_name as uploader_name, d.name as department_name
            FROM resources r
            LEFT JOIN users u ON r.uploader_id = u.id
            LEFT JOIN departments d ON r.department_id = d.id
        `;
        let queryParams = [];
        let conditions = [];

        const currentStatus = status === 'pending' ? 'pending' : 'approved';
        queryParams.push(currentStatus);
        conditions.push(`r.status = $${queryParams.length}`);

        if (search) {
            queryParams.push(`%${search}%`);
            conditions.push(`r.title ILIKE $${queryParams.length}`);
        }
        if (category && category !== 'All') {
            queryParams.push(category);
            conditions.push(`r.category = $${queryParams.length}`);
        }
        if (departmentId && departmentId !== 'undefined') {
            queryParams.push(departmentId);
            conditions.push(`r.department_id = $${queryParams.length}`);
        }

        if (conditions.length > 0) queryText += ` WHERE ` + conditions.join(' AND ');
        queryText += ` ORDER BY r.created_at DESC`;

        const resources = await pool.query(queryText, queryParams);
        res.json(resources.rows || []);
    } catch (err) {
        res.status(500).json([]);
    }
};

// --- 3. REQUEST HUB LOGIC ---
exports.createRequest = async (req, res) => {
    try {
        const { title, description, departmentId } = req.body;
        const result = await pool.query(
            `INSERT INTO resource_requests (requester_id, department_id, title, description) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [req.user.id, departmentId || null, title, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ message: "Failed to post request" });
    }
};

exports.getRequests = async (req, res) => {
    try {
        const { departmentId } = req.query;
        let query = `
            SELECT rr.*, u.full_name as student_name FROM resource_requests rr
            LEFT JOIN users u ON rr.requester_id = u.id
            WHERE rr.is_fulfilled = false
        `;
        let params = [];
        if (departmentId && departmentId !== 'undefined') {
            params.push(departmentId);
            query += ` AND rr.department_id = $1`;
        }
        const result = await pool.query(query + ` ORDER BY rr.created_at DESC`, params);
        res.json(result.rows || []);
    } catch (err) {
        res.status(500).json([]);
    }
};

exports.fulfillRequest = async (req, res) => {
    try {
        await pool.query(
            "UPDATE resource_requests SET is_fulfilled = true, fulfilled_by = $1, fulfilled_at = NOW() WHERE id = $2", 
            [req.user.id, req.params.id]
        );
        res.json({ message: "Handled! 🤝" });
    } catch (err) {
        res.status(500).json({ message: "Fulfillment failed" });
    }
};

// --- 4. MANAGEMENT & DELETION ---
exports.requestDeletion = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        await pool.query('INSERT INTO deletion_requests (resource_id, user_id) VALUES ($1, $2)', [id, userId]);
        res.json({ message: "Sent to Faculty for review." });
    } catch (err) {
        res.status(500).json({ message: "Request failed" });
    }
};

exports.rejectDeletion = async (req, res) => {
    try {
        await pool.query("DELETE FROM deletion_requests WHERE id = $1", [req.params.id]);
        res.json({ message: "Preserved." });
    } catch (err) {
        res.status(500).json({ message: "Failed" });
    }
};

exports.permanentDelete = async (req, res) => {
    try {
        const resource = await pool.query('SELECT file_url FROM resources WHERE id = $1', [req.params.id]);
        if (resource.rows.length > 0 && fs.existsSync(resource.rows[0].file_url)) {
            fs.unlinkSync(resource.rows[0].file_url);
        }
        await pool.query("DELETE FROM deletion_requests WHERE resource_id = $1", [req.params.id]);
        await pool.query("DELETE FROM resources WHERE id = $1", [req.params.id]);
        res.json({ message: "Purged." });
    } catch (err) {
        res.status(500).json({ message: "Purge failed" });
    }
};

exports.getDeletionRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT dr.id, r.title, u.full_name as student_name, r.id as resource_id
            FROM deletion_requests dr
            JOIN resources r ON dr.resource_id = r.id
            JOIN users u ON dr.user_id = u.id
            WHERE r.department_id = $1
        `, [req.user.department_id]);
        res.json(result.rows || []);
    } catch (err) {
        res.status(500).json([]);
    }
};

exports.approveResource = async (req, res) => {
    try {
        await pool.query("UPDATE resources SET status = 'approved' WHERE id = $1", [req.params.id]);
        res.json({ message: "Approved!" });
    } catch (err) {
        res.status(500).json({ message: "Failed" });
    }
};

exports.incrementDownload = async (req, res) => {
    try {
        await pool.query('UPDATE resources SET download_count = download_count + 1 WHERE id = $1', [req.params.id]);
        res.json({ message: "Counted." });
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
};