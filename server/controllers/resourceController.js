const pool = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');

// --- UPLOAD RESOURCE ---
exports.uploadResource = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Please upload a file" });
        }

        const { title, category } = req.body;
        const uploaderId = req.user.id; 
        const filePath = req.file.path;

        // Fetch uploader's department to auto-tag the resource
        const userResult = await pool.query('SELECT department_id FROM users WHERE id = $1', [uploaderId]);
        const departmentId = userResult.rows[0].department_id;

        // Generate MD5 Hash to prevent duplicate file content
        const fileBuffer = fs.readFileSync(filePath);
        const hashSum = crypto.createHash('md5');
        hashSum.update(fileBuffer);
        const fileHash = hashSum.digest('hex');

        // Check for exact duplicates
        const existingFile = await pool.query('SELECT * FROM resources WHERE file_hash = $1', [fileHash]);
        if (existingFile.rows.length > 0) {
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(400).json({ message: "This exact resource has already been uploaded." });
        }

        const newResource = await pool.query(
            `INSERT INTO resources 
            (uploader_id, department_id, title, category, file_url, file_hash, file_type) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [uploaderId, departmentId, title, category, filePath, fileHash, req.file.mimetype]
        );

        res.status(201).json({
            message: "Resource uploaded successfully! Pending review.",
            resource: newResource.rows[0]
        });

    } catch (err) {
        console.error("Upload Error:", err);
        res.status(500).json({ message: "Server Error during upload" });
    }
};

// --- GET ALL RESOURCES (World View & Dept Logic) ---
exports.getAllResources = async (req, res) => {
    try {
        const { search, category, departmentId, trending, mine, status } = req.query;
        
        let queryText = `
            SELECT resources.*, COALESCE(users.full_name, 'Rootle User') as uploader_name 
            FROM resources 
            LEFT JOIN users ON resources.uploader_id = users.id
        `;
        let queryParams = [];
        let conditions = [];

        // 1. Logic for Library vs Feed vs Admin Queue
        if (mine === 'true') {
            queryParams.push(req.user.id);
            conditions.push(`resources.uploader_id = $${queryParams.length}`);
            conditions.push(`resources.deleted_by_user = false`); 
        } else if (status === 'pending') {
            conditions.push(`resources.status = 'pending'`);
        } else {
            // Default: Public/World View sees approved files
            conditions.push(`resources.status = 'approved'`);
        }

        // 2. Search Filter
        if (search) {
            queryParams.push(`%${search}%`);
            conditions.push(`resources.title ILIKE $${queryParams.length}`);
        }

        // 3. Category Filter
        if (category && category !== 'All') {
            queryParams.push(category);
            conditions.push(`resources.category = $${queryParams.length}`);
        }

        // 4. Department Filter (Crucial for the "Vault" vs "World" logic)
        if (departmentId) {
            queryParams.push(departmentId);
            conditions.push(`resources.department_id = $${queryParams.length}`);
        }

        if (conditions.length > 0) {
            queryText += ` WHERE ` + conditions.join(' AND ');
        }

        // Sorting Logic
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

// --- REQUEST DELETION (Student Action) ---
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
        console.error("Deletion Request Error:", err);
        res.status(500).json({ message: "Error processing deletion request" });
    }
};

// --- STAFF: APPROVE RESOURCE ---
exports.approveResource = async (req, res) => {
    try {
        const { id } = req.params;
        const lecturerDept = req.user.department_id;

        // Jurisdiction Check: Can only approve files in your department
        const check = await pool.query('SELECT department_id FROM resources WHERE id = $1', [id]);
        if (check.rows.length > 0 && check.rows[0].department_id !== lecturerDept) {
            return res.status(403).json({ message: "This file is outside your department jurisdiction." });
        }

        await pool.query("UPDATE resources SET status = 'approved' WHERE id = $1", [id]);
        res.json({ message: "Resource approved and live!" });
    } catch (err) {
        res.status(500).json({ message: "Approval failed" });
    }
};

// --- STAFF: REJECT/DECLINE RESOURCE (DURING REVIEW) ---
exports.rejectResource = async (req, res) => {
    try {
        const { id } = req.params;
        const lecturerDept = req.user.department_id;

        const resource = await pool.query('SELECT file_url, department_id FROM resources WHERE id = $1', [id]);
        
        if (resource.rows.length > 0) {
            if (resource.rows[0].department_id !== lecturerDept) {
                return res.status(403).json({ message: "Cannot reject files from other departments." });
            }
            const filePath = resource.rows[0].file_url;
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await pool.query("DELETE FROM resources WHERE id = $1", [id]);
        res.json({ message: "Resource rejected and wiped." });
    } catch (err) {
        res.status(500).json({ message: "Failed to reject resource" });
    }
};

// --- STAFF: GET DELETION REQUESTS (Specific to Lecturer's Dept) ---
exports.getDeletionRequests = async (req, res) => {
    try {
        const lecturerDept = req.user.department_id;

        // Only fetch requests for files that belong to the lecturer's department
        const result = await pool.query(`
            SELECT dr.*, r.title, r.category, u.full_name as student_name 
            FROM deletion_requests dr
            JOIN resources r ON dr.resource_id = r.id
            JOIN users u ON dr.user_id = u.id
            WHERE dr.status = 'pending' AND r.department_id = $1
        `, [lecturerDept]);

        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Deletion Inbox Error:", err);
        res.status(500).json({ message: "Failed to fetch deletion inbox" });
    }
};

// --- STAFF: PERMANENT DELETE (From Vault or Purge List) ---
exports.permanentDelete = async (req, res) => {
    try {
        const { id } = req.params;
        const lecturerDept = req.user.department_id;

        const resource = await pool.query('SELECT file_url, department_id FROM resources WHERE id = $1', [id]);
        
        if (resource.rows.length > 0) {
            // Senior Security check
            if (resource.rows[0].department_id !== lecturerDept) {
                return res.status(403).json({ message: "Action Denied: This file belongs to another department." });
            }

            const filePath = resource.rows[0].file_url;
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await pool.query("DELETE FROM resources WHERE id = $1", [id]);
        res.json({ message: "File purged from system permanently." });
    } catch (err) {
        res.status(500).json({ message: "Purge failed" });
    }
};

// --- INCREMENT DOWNLOAD ---
exports.incrementDownload = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE resources SET download_count = download_count + 1 WHERE id = $1', [id]);
        res.status(200).json({ message: "Heat increased!" });
    } catch (err) {
        res.status(500).json({ message: "Error updating stats" });
    }
};