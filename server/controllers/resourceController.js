const pool = require('../config/db');
const crypto = require('crypto');
const fs = require('fs');

// --- 1. UPLOAD RESOURCE (STABILIZED & PERMANENT FIX) ---
exports.uploadResource = async (req, res) => {
    let filePath = req.file ? req.file.path : null;
    try {
        if (!req.file) return res.status(400).json({ message: "No file selected." });
        
        const { title, category, requestId } = req.body; 
        const uploaderId = req.user.id; 

        // Get uploader's department
        const userResult = await pool.query('SELECT department_id FROM users WHERE id = $1', [uploaderId]);
        const departmentId = userResult.rows[0]?.department_id;

        if (!departmentId) {
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(400).json({ message: "Account not linked to a department." });
        }

        // Duplicate Check via Hash
        const fileBuffer = fs.readFileSync(filePath);
        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        const existingFile = await pool.query('SELECT id FROM resources WHERE file_hash = $1', [fileHash]);

        if (existingFile.rows.length > 0) {
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(400).json({ message: "Duplicate alert: File already exists." });
        }

        // Insert into resources
        const newResource = await pool.query(
            `INSERT INTO resources 
            (uploader_id, department_id, title, category, file_url, file_hash, file_type, status) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'approved') RETURNING *`,
            [uploaderId, departmentId, title, category, filePath, fileHash, req.file.mimetype]
        );

        // --- PERMANENT FULFILLMENT FIX ---
        const parsedRequestId = parseInt(requestId);
        if (requestId && !isNaN(parsedRequestId)) {
            try {
                // Using explicit column names to match the ALTER TABLE command
                await pool.query(
                    `UPDATE resource_requests 
                     SET is_fulfilled = true, 
                         fulfilled_by = $1, 
                         fulfilled_at = CURRENT_TIMESTAMP 
                     WHERE id = $2`, 
                    [uploaderId, parsedRequestId]
                );
                console.log(`✅ Success: Request ${parsedRequestId} fulfilled by ${uploaderId}`);
            } catch (fulfillmentErr) {
                console.error("❌ DB SCHEMA ERROR:", fulfillmentErr.message);
            }
        }

        res.status(201).json(newResource.rows[0]);
    } catch (err) {
        console.error("CRITICAL BACKEND ERROR:", err.message);
        if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
        res.status(500).json({ message: "Internal Server Error", details: err.message });
    }
};

// --- 2. GET ALL RESOURCES ---
exports.getAllResources = async (req, res) => {
    try {
        const { search, category, departmentId, status, trending, mine } = req.query;
        
        let queryText = `
            SELECT r.*, u.full_name as uploader_name, d.name as department_name,
            0 as average_rating
            FROM resources r
            LEFT JOIN users u ON r.uploader_id = u.id
            LEFT JOIN departments d ON r.department_id = d.id
        `;
        
        // Optional: Check if ratings table exists before querying
        try {
            const tableCheck = await pool.query("SELECT to_regclass('public.resource_ratings')");
            if (tableCheck.rows[0].to_regclass) {
                queryText = `
                    SELECT r.*, u.full_name as uploader_name, d.name as department_name,
                    COALESCE((SELECT AVG(rating_value) FROM resource_ratings WHERE resource_id = r.id), 0) as average_rating
                    FROM resources r
                    LEFT JOIN users u ON r.uploader_id = u.id
                    LEFT JOIN departments d ON r.department_id = d.id
                `;
            }
        } catch (e) { console.log("Ratings table skip."); }
        
        let queryParams = [];
        let conditions = [];

        if (mine === 'true') {
            queryParams.push(req.user.id);
            conditions.push(`r.uploader_id = $${queryParams.length}`);
        } else {
            queryParams.push(status === 'pending' ? 'pending' : 'approved');
            conditions.push(`r.status = $${queryParams.length}`);
        }

        if (search && search !== 'undefined') {
            queryParams.push(`%${search}%`);
            conditions.push(`r.title ILIKE $${queryParams.length}`);
        }
        
        if (category && category !== 'All' && category !== 'undefined') {
            queryParams.push(category);
            conditions.push(`r.category = $${queryParams.length}`);
        }

        if (departmentId && departmentId !== 'undefined' && departmentId !== 'null') {
            queryParams.push(departmentId);
            conditions.push(`r.department_id = $${queryParams.length}`);
        }

        if (conditions.length > 0) queryText += ` WHERE ` + conditions.join(' AND ');
        queryText += trending === 'true' ? ` ORDER BY r.download_count DESC` : ` ORDER BY r.created_at DESC`;

        const resources = await pool.query(queryText, queryParams);
        res.json(resources.rows || []);
    } catch (err) {
        res.status(500).json({ message: "Error fetching resources" });
    }
};

// --- 3. GET HUB REQUESTS ---
exports.getRequests = async (req, res) => {
    try {
        const { departmentId } = req.query;
        let query = `
            SELECT rr.*, u.full_name as student_name, d.name as department_name 
            FROM resource_requests rr 
            LEFT JOIN users u ON rr.requester_id = u.id 
            LEFT JOIN departments d ON rr.department_id = d.id
            WHERE rr.is_fulfilled = false`;
        
        let params = [];
        if (departmentId && departmentId !== 'undefined' && departmentId !== 'null') {
            params.push(departmentId);
            query += ` AND rr.department_id = $${params.length}`;
        }
        
        const result = await pool.query(query + ` ORDER BY rr.created_at DESC`, params);
        res.json(result.rows || []);
    } catch (err) {
        console.error("Get Requests Error:", err.message);
        res.status(500).json([]);
    }
};

// --- 4. CREATE REQUEST ---
exports.createRequest = async (req, res) => {
    try {
        const { title, description, departmentId } = req.body;
        const result = await pool.query(
            `INSERT INTO resource_requests (requester_id, department_id, title, description) 
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [req.user.id, departmentId || null, title, description]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: "Request failure" }); }
};

// --- 5. FULFILL REQUEST (MANUAL OVERRIDE) ---
exports.fulfillRequest = async (req, res) => {
    try {
        await pool.query(
            `UPDATE resource_requests 
             SET is_fulfilled = true, 
                 fulfilled_by = $1, 
                 fulfilled_at = CURRENT_TIMESTAMP 
             WHERE id = $2`, 
            [req.user.id, req.params.id]
        );
        res.json({ message: "Handled! 🤝" });
    } catch (err) { 
        console.error("Manual Fulfillment Error:", err.message);
        res.status(500).json({ message: "Fulfillment failed" }); 
    }
};

// --- 6. STATS ---
exports.getDepartmentStats = async (req, res) => {
    try {
        let deptId = req.user.department_id;
        if (!deptId) {
            const user = await pool.query('SELECT department_id FROM users WHERE id = $1', [req.user.id]);
            deptId = user.rows[0]?.department_id;
        }
        if (!deptId) return res.json({ total_downloads: 0, total_resources: 0, open_requests: 0 });

        const result = await pool.query(`
            SELECT 
                COALESCE(SUM(download_count), 0) as total_downloads,
                COUNT(id) as total_resources,
                (SELECT COUNT(*) FROM resource_requests WHERE department_id = $1 AND is_fulfilled = false) as open_requests
            FROM resources 
            WHERE department_id = $1 AND status = 'approved'
        `, [deptId]);
        res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: "Stats failure" }); }
};

// --- 7. RATINGS ---
exports.rateResource = async (req, res) => {
    try {
        const { resourceId, rating } = req.body;
        await pool.query(`
            INSERT INTO resource_ratings (resource_id, user_id, rating_value)
            VALUES ($1, $2, $3)
            ON CONFLICT (resource_id, user_id) DO UPDATE SET rating_value = EXCLUDED.rating_value
        `, [resourceId, req.user.id, rating]);
        res.json({ message: "Rating recorded" });
    } catch (err) { res.status(500).json({ message: "Rating failure" }); }
};

// --- 8. DELETION LOGIC (UPDATED) ---
exports.requestDeletion = async (req, res) => {
    try {
        await pool.query('INSERT INTO deletion_requests (resource_id, user_id) VALUES ($1, $2)', [req.params.id, req.user.id]);
        res.json({ message: "Review pending." });
    } catch (err) { res.status(500).json({ message: "Request failed" }); }
};

exports.getDeletionRequests = async (req, res) => {
    try {
        // IMPORTANT: Returning both ID of the request (request_id) and ID of the resource (resource_id)
        const result = await pool.query(`
            SELECT dr.id as request_id, r.title, u.full_name as student_name, r.id as resource_id, r.file_url, r.category 
            FROM deletion_requests dr 
            JOIN resources r ON dr.resource_id = r.id 
            JOIN users u ON dr.user_id = u.id 
            WHERE r.department_id = $1`, 
            [req.user.department_id]
        );
        res.json(result.rows || []);
    } catch (err) { res.status(500).json([]); }
};

exports.rejectDeletion = async (req, res) => {
    try {
        // Expects the Deletion Request ID
        await pool.query("DELETE FROM deletion_requests WHERE id = $1", [req.params.id]);
        res.json({ message: "Preserved." });
    } catch (err) { res.status(500).json({ message: "Failed" }); }
};

exports.permanentDelete = async (req, res) => {
    try {
        // Expects the Resource ID
        const resource = await pool.query('SELECT file_url FROM resources WHERE id = $1', [req.params.id]);
        
        if (resource.rows.length > 0 && fs.existsSync(resource.rows[0].file_url)) {
            fs.unlinkSync(resource.rows[0].file_url);
        }

        // Clean up both tables to avoid foreign key constraints
        await pool.query("DELETE FROM deletion_requests WHERE resource_id = $1", [req.params.id]);
        await pool.query("DELETE FROM resources WHERE id = $1", [req.params.id]);
        
        res.json({ message: "Purged." });
    } catch (err) { res.status(500).json({ message: "Purge failed" }); }
};

// --- 9. APPROVAL & DOWNLOADS ---
exports.approveResource = async (req, res) => {
    try {
        await pool.query("UPDATE resources SET status = 'approved' WHERE id = $1", [req.params.id]);
        res.json({ message: "Approved!" });
    } catch (err) { res.status(500).json({ message: "Failed" }); }
};

exports.incrementDownload = async (req, res) => {
    try {
        await pool.query('UPDATE resources SET download_count = download_count + 1 WHERE id = $1', [req.params.id]);
        res.json({ message: "Counted." });
    } catch (err) { res.status(500).json({ message: "Error" }); }
};