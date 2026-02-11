const pool = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');

// --- 1. UPLOAD RESOURCE (Sync with Departmental Logic) ---
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
            return res.status(400).json({ message: "Duplicate alert: This file already exists in our vault." });
        }

        // Insert as 'pending'
        const newResource = await pool.query(
            `INSERT INTO resources 
            (uploader_id, department_id, title, category, file_url, file_hash, file_type, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending') RETURNING *`,
            [uploaderId, departmentId, title, category, filePath, fileHash, req.file.mimetype]
        );

        res.status(201).json(newResource.rows[0]);

    } catch (err) {
        if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        console.error("🔥 UPLOAD ERROR:", err);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// --- 2. GET ALL RESOURCES (Filtered by Jurisdiction) ---
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
            conditions.push(`r.deleted_by_user = false`); 
        } else if (status === 'pending') {
            conditions.push(`r.status = 'pending'`);
        } else {
            conditions.push(`r.status = 'approved'`);
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
            ? ` ORDER BY r.download_count DESC, r.created_at DESC LIMIT 20` 
            : ` ORDER BY r.created_at DESC`;

        const resources = await pool.query(queryText, queryParams);
        res.json(resources.rows);
    } catch (err) {
        console.error("Fetch Error:", err);
        res.status(500).json({ message: "Error fetching library data" });
    }
};

// --- 3. STUDENT: REQUEST DELETION ---
exports.requestDeletion = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        await pool.query(
            'UPDATE resources SET deleted_by_user = true WHERE id = $1 AND uploader_id = $2',
            [id, userId]
        );

        await pool.query(
            'INSERT INTO deletion_requests (resource_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [id, userId]
        );

        res.json({ message: "File removed. Lecturer notified for permanent purge." });
    } catch (err) {
        res.status(500).json({ message: "Error processing deletion request" });
    }
};

// --- 4. STAFF: APPROVE RESOURCE ---
exports.approveResource = async (req, res) => {
    try {
        const { id } = req.params;
        const lecturerDept = req.user.department_id;

        const check = await pool.query('SELECT department_id FROM resources WHERE id = $1', [id]);
        if (check.rows.length === 0) return res.status(404).json({ message: "Resource not found." });
        
        if (check.rows[0].department_id !== lecturerDept) {
            return res.status(403).json({ message: "Outside your jurisdiction." });
        }

        await pool.query("UPDATE resources SET status = 'approved' WHERE id = $1", [id]);
        res.json({ message: "Resource approved!" });
    } catch (err) {
        res.status(500).json({ message: "Approval failed" });
    }
};

// --- 5. STAFF: PERMANENT PURGE (Works for Rejections & Student Deletions) ---
exports.permanentDelete = async (req, res) => {
    try {
        const { id } = req.params;
        const lecturerDept = req.user.department_id;
        
        const resource = await pool.query('SELECT file_url, department_id FROM resources WHERE id = $1', [id]);
        
        if (resource.rows.length === 0) return res.status(404).json({ message: "Resource not found." });

        if (resource.rows[0].department_id !== lecturerDept) {
            return res.status(403).json({ message: "Jurisdiction error: Denied." });
        }

        // Delete physical file from 'uploads/' folder
        if (fs.existsSync(resource.rows[0].file_url)) {
            fs.unlinkSync(resource.rows[0].file_url);
        }

        // Wipe record (Deletion request table will cascade delete if foreign key is set to CASCADE)
        await pool.query("DELETE FROM resources WHERE id = $1", [id]);
        res.json({ message: "File purged from disk and database." });
    } catch (err) {
        console.error("Purge Error:", err);
        res.status(500).json({ message: "Purge failed" });
    }
};

// --- 6. STAFF: GET DELETION INBOX ---
exports.getDeletionRequests = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT dr.*, r.title, r.category, u.full_name as student_name, r.id as resource_id
            FROM deletion_requests dr
            JOIN resources r ON dr.resource_id = r.id
            JOIN users u ON dr.user_id = u.id
            WHERE r.department_id = $1
        `, [req.user.department_id]);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch inbox" });
    }
};

exports.incrementDownload = async (req, res) => {
    try {
        await pool.query('UPDATE resources SET download_count = download_count + 1 WHERE id = $1', [req.params.id]);
        res.status(200).json({ message: "Heat increased!" });
    } catch (err) {
        res.status(500).json({ message: "Error updating stats" });
    }
};