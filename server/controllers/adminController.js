const Resource = require('../models/Resource');
const User = require('../models/User');
const Department = require('../models/Department');
const Faculty = require('../models/Faculty');
const DeletionRequest = require('../models/DeletionRequest');
const fs = require('fs');

exports.getDashboardStats = async (req, res) => {
    try {
        const userCount = await User.countDocuments();
        const resourceCount = await Resource.countDocuments();
        const deptCount = await Department.countDocuments();

        // Resources distribution grouped by Faculty
        const faculties = await Faculty.find();
        const distribution = await Promise.all(faculties.map(async (faculty) => {
            const depts = await Department.find({ faculty_id: faculty._id });
            const deptIds = depts.map(d => d._id);
            const totalRes = await Resource.countDocuments({ department_id: { $in: deptIds } });
            return { name: faculty.name, total: totalRes };
        }));

        // Recent Uploads
        const recentResources = await Resource.find({ status: 'approved' })
            .populate('uploader_id', 'full_name')
            .sort({ created_at: -1 })
            .limit(5);

        const formattedRecent = recentResources.map(r => ({
            title: r.title,
            uploader: r.uploader_id?.full_name || 'Unknown',
            created_at: r.created_at
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
        const { id } = req.params;
        const resource = await Resource.findById(id);
        
        if (!resource) {
            return res.status(404).json({ message: "Resource not found" });
        }

        const filePath = resource.file_url;
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await DeletionRequest.deleteMany({ resource_id: id });
        await Resource.findByIdAndDelete(id);

        res.json({ message: "File purged successfully from system." });
    } catch (err) {
        console.error("Purge Error:", err.message);
        res.status(500).json({ message: "Failed to permanently delete file" });
    }
};

exports.getDeletionRequests = async (req, res) => {
    try {
        const deptId = req.user.department_id;
        const requests = await DeletionRequest.find()
            .populate({
                path: 'resource_id',
                match: { department_id: deptId },
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
        res.status(500).json([]);
    }
};

exports.rejectDeletion = async (req, res) => {
    try {
        await DeletionRequest.findByIdAndDelete(req.params.id);
        res.json({ message: "Preserved." });
    } catch (err) { 
        res.status(500).json({ message: "Failed" }); 
    }
};

exports.approveResource = async (req, res) => {
    try {
        await Resource.findByIdAndUpdate(req.params.id, { status: 'approved' });
        res.json({ message: "Approved!" });
    } catch (err) { 
        res.status(500).json({ message: "Failed" }); 
    }
};