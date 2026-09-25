const Resource = require('../models/Resource');
const User = require('../models/User');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const DeletionRequest = require('../models/DeletionRequest');
const fs = require('fs');
const StaffKey = require('../models/StaffKey');
const crypto = require('crypto');

exports.getDashboardStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const resourceCount = await Resource.countDocuments();
        const deptCount = await Department.countDocuments();

        const faculties = await Faculty.find();
        const distribution = await Promise.all(faculties.map(async (faculty) => {
            const depts = await Department.find({ faculty_id: faculty._id });
            const deptIds = depts.map(d => d._id);
            const totalRes = await Resource.countDocuments({ department_id: { $in: deptIds } });
            return { name: faculty.name, total: totalRes };
        }));

        const recentResources = await Resource.find({ status: 'approved' })
            .populate('uploader_id', 'full_name')
            .sort({ createdAt: -1, created_at: -1 })
            .limit(5);

        const formattedRecent = recentResources.map(r => ({
            title: r.title,
            uploader: r.uploader_id?.full_name || 'Unknown',
            created_at: r.created_at || r.createdAt
        }));

        res.json({
            totals: {
                users: userCount,
                resources: resourceCount,
                departments: deptCount
            },
            chartData: distribution,
            recentActivity: formattedRecent
        });

    } catch (err) {
        console.error("Dashboard Stats Error:", err.message);
        res.status(500).send("Server Error fetching analytics");
    }
};

exports.permanentDelete = async (req, res) => {
    try {
        const resourceId = req.params.id;
        const resource = await Resource.findById(resourceId);

        if (!resource) {
            return res.status(404).json({ message: "Resource not found" });
        }

        const filePath = resource.file_url;
        if (filePath && fs.existsSync(filePath)) {
            // ✅ Wrapped in try/catch to prevent server crashes if the file is locked or missing
            try {
                fs.unlinkSync(filePath);
            } catch (fsErr) {
                console.warn(`⚠️ Warning: Could not delete physical file at ${filePath}:`, fsErr.message);
            }
        }

        await DeletionRequest.deleteMany({ resource_id: resourceId });
        await Resource.findByIdAndDelete(resourceId);

        res.status(200).json({ message: "Resource permanently removed from vault." });
    } catch (err) {
        console.error("Purge Error:", err.message);
        res.status(500).json({ message: "Failed to delete resource" });
    }
};

exports.getDeletionRequests = async (req, res) => {
    try {
        const deptId = req.user?.department_id;
        const isSuperAdmin = req.user?.role === 'superadmin';

        // Superadmins see all deletion requests; Dept Admins see only their department
        const matchQuery = (!isSuperAdmin && deptId) ? { department_id: deptId } : {};

        const requests = await DeletionRequest.find()
            .populate({
                path: 'resource_id',
                match: matchQuery,
                populate: { path: 'department_id' }
            })
            .populate('user_id', 'full_name');

        const validRequests = requests
            .filter(dr => dr.resource_id !== null)
            .map(dr => ({
                request_id: dr._id,
                title: dr.resource_id.title,
                student_name: dr.user_id?.full_name,
                resource_id: dr.resource_id._id,
                file_url: dr.resource_id.file_url,
                category: dr.resource_id.category
            }));

        res.json(validRequests || []);
    } catch (err) {
        console.error("Get Deletion Requests Error:", err.message);
        res.status(500).json([]);
    }
};

exports.rejectDeletion = async (req, res) => {
    try {
        await DeletionRequest.findByIdAndDelete(req.params.id);
        res.json({ message: "Preserved." });
    } catch (err) { 
        console.error("Reject Deletion Error:", err.message);
        res.status(500).json({ message: "Failed to reject deletion request" }); 
    }
};

exports.approveResource = async (req, res) => {
    try {
        await Resource.findByIdAndUpdate(req.params.id, { status: 'approved' });
        res.json({ message: "Approved!" });
    } catch (err) { 
        console.error("Approve Resource Error:", err.message);
        res.status(500).json({ message: "Failed to approve resource" }); 
    }
};

exports.generateStaffKey = async (req, res) => {
    try {
        const { department_id, role } = req.body;

        // Require department_id ONLY if role is not superadmin
        if (role !== 'superadmin' && !department_id) {
            return res.status(400).json({ message: "Department ID is required for staff key generation." });
        }

        const randomBytes = crypto.randomBytes(4).toString('hex').toUpperCase();
        const keyString = `ROOT-STF-${randomBytes}`;

        const expires_at = new Date();
        expires_at.setDate(expires_at.getDate() + 7);

        const newKey = await StaffKey.create({
            key: keyString,
            department_id: role === 'superadmin' ? null : department_id,
            role: role || 'lecturer',
            created_by: req.user.id || req.user._id,
            expires_at
        });

        res.status(201).json({
            success: true,
            message: "Staff key generated successfully",
            staffKey: newKey
        });
    } catch (err) {
        console.error("Staff key generation error:", err.message);
        res.status(500).json({ message: "Server error during key generation" });
    }
};

exports.getStaffKeys = async (req, res) => {
    try {
        const keys = await StaffKey.find()
            .populate('department_id', 'name')
            .populate('created_by', 'full_name')
            .sort({ createdAt: -1, created_at: -1 });
        res.status(200).json(keys);
    } catch (err) {
        console.error("Fetch Staff Keys Error:", err.message);
        res.status(500).json({ message: "Failed to fetch staff keys" });
    }
};