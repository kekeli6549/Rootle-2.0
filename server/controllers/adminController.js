// server/controllers/adminController.js
const pool = require('../config/db');
const fs = require('fs');

exports.getDashboardStats = async (req, res) => {
    try {
        // 1. Get Total Counts (Using multiple queries in parallel for speed)
        const userCount = await pool.query('SELECT COUNT(*) FROM users');
        const resourceCount = await pool.query('SELECT COUNT(*) FROM resources');
        const deptCount = await pool.query('SELECT COUNT(*) FROM departments');

        // 2. Resources per Faculty (For Pie/Bar Chart)
        // We JOIN resources to departments to faculties to get names
        const distribution = await pool.query(`
            SELECT f.name, COUNT(r.id) as total 
            FROM faculties f
            LEFT JOIN departments d ON f.id = d.faculty_id
            LEFT JOIN resources r ON d.id = r.department_id
            GROUP BY f.name
        `);

        // 3. Recent Uploads
        const recentResources = await pool.query(`
            SELECT r.title, u.full_name as uploader, r.created_at 
            FROM resources r
            JOIN users u ON r.uploader_id = u.id
            ORDER BY r.created_at DESC
            LIMIT 5
        `);

        res.json({
            totals: {
                users: parseInt(userCount.rows[0].count),
                resources: parseInt(resourceCount.rows[0].count),
                departments: parseInt(deptCount.rows[0].count)
            },
            chartData: distribution.rows,
            recentActivity: recentResources.rows
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error fetching analytics");
    }
};

// FIX: Added the missing permanentDelete function to resolve the Route crash
exports.permanentDelete = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Get the file path first to delete from storage
        const resource = await pool.query('SELECT file_url FROM resources WHERE id = $1', [id]);
        
        if (resource.rows.length === 0) {
            return res.status(404).json({ message: "Resource not found" });
        }

        const filePath = resource.rows[0].file_url;

        // 2. Delete file from physical storage (The Vault)
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        // 3. Delete from database (deletion_requests and resources tables)
        // Note: If you have ON DELETE CASCADE in your DB, deleting from resources is enough
        await pool.query("DELETE FROM deletion_requests WHERE resource_id = $1", [id]);
        await pool.query("DELETE FROM resources WHERE id = $1", [id]);

        res.json({ message: "File purged successfully from system." });
    } catch (err) {
        console.error("Purge Error:", err.message);
        res.status(500).json({ message: "Failed to permanently delete file" });
    }
};