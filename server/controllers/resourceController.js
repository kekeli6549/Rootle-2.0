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

        const userResult = await pool.query('SELECT department_id FROM users WHERE id = $1', [uploaderId]);
        const departmentId = userResult.rows[0]?.department_id;

        if (!departmentId) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(400).json({ message: "Account not linked to a department." });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        const existingFile = await pool.query('SELECT id FROM resources WHERE file_hash = $1', [fileHash]);

        if (existingFile.rows.length > 0) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(400).json({ message: "Duplicate alert: File already exists." });
        }

        const newResource = await pool.query(
            `INSERT INTO resources 
            (uploader_id, department_id, title, category, file_url, file_hash, file_type, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved') RETURNING *`,
            [uploaderId, departmentId, title, category, filePath, fileHash, req.file.mimetype]
        );

        // --- HUB FULFILLMENT LOGIC ---
        // If an ID is passed from the Hub, mark it fulfilled so it disappears from the list
        if (requestId && requestId !== 'null' && requestId !== 'undefined') {
            await pool.query(
                'UPDATE resource_requests SET is_fulfilled = true, fulfilled_by = $1 WHERE id = $2', 
                [uploaderId, requestId]
            );
        }

        res.status(201).json(newResource.rows[0]);
    } catch (err) {
        console.error("Upload Error:", err);
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
            SELECT r.*, u.full_name as uploader_name, d.name as department_name
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
        // This filter 'rr.is_fulfilled = false' ensures fulfilled requests are hidden
        let query = `
            SELECT rr.*, u.full_name as student_name, d.name as department_name 
            FROM resource_requests rr
            LEFT JOIN users u ON rr.requester_id = u.id
            LEFT JOIN departments d ON rr.department_id = d.id
            WHERE rr.is_fulfilled = false
        `;
        let params = [];
        if (departmentId && departmentId !== 'undefined') {
            params.push(departmentId);
            query += ` AND rr.department_id = $1`;
        }
        query += ` ORDER BY rr.created_at DESC`;
        
        const result = await pool.query(query, params);
        res.json(result.rows || []);
    } catch (err) {
        res.status(500).json([]);
    }
};

exports.fulfillRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const uploaderId = req.user.id;
        await pool.query(
            "UPDATE resource_requests SET is_fulfilled = true, fulfilled_by = $1 WHERE id = $2", 
            [uploaderId, id]
        );
        res.json({ message: "Request fulfilled! 🤝" });
    } catch (err) {
        res.status(500).json({ message: "Fulfillment failed" });
    }
};

// --- 4. MANAGEMENT ---
exports.approveResource = async (req, res) => {
    try {
        await pool.query("UPDATE resources SET status = 'approved' WHERE id = $1", [req.params.id]);
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

exports.rejectDeletion = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query("DELETE FROM deletion_requests WHERE id = $1", [id]);
        res.json({ message: "Deletion request rejected. File preserved." });
    } catch (err) {
        res.status(500).json({ message: "Failed to reject deletion." });
    }
};

exports.requestDeletion = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;
        const check = await pool.query('SELECT uploader_id FROM resources WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ message: "Not found" });
        if (check.rows[0].uploader_id !== userId) return res.status(403).json({ message: "Unauthorized removal attempt blocked." });

        await pool.query('INSERT INTO deletion_requests (resource_id, user_id) VALUES ($1, $2)', [id, userId]);
        res.json({ message: "Deletion request sent to Faculty." });
    } catch (err) {
        res.status(500).json({ message: "Request failed" });
    }
};

exports.getDeletionRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT dr.*, r.title, u.full_name as student_name
            FROM deletion_requests dr
            LEFT JOIN resources r ON dr.resource_id = r.id
            LEFT JOIN users u ON dr.user_id = u.id
            WHERE r.department_id = $1
        `, [req.user.department_id]);
        res.json(result.rows || []);
    } catch (err) {
        res.status(500).json([]);
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