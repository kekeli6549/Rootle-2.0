// server/controllers/adminController.js
const pool = require('../config/db');

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