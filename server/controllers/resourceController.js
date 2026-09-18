const Resource = require('../models/Resource');
const ResourceRequest = require('../models/ResourceRequest');
const ResourceRating = require('../models/ResourceRating');
const User = require('../models/User');
const crypto = require('crypto');
const fs = require('fs');

// --- 1. UPLOAD RESOURCE ---
exports.uploadResource = async (req, res) => {
    let filePath = req.file ? req.file.path : null;
    try {
        if (!req.file) return res.status(400).json({ message: "No file selected." });
        
        const { title, category, requestId } = req.body; 
        const uploaderId = req.user.id; 

        const user = await User.findById(uploaderId);
        const departmentId = user?.department_id;

        if (!departmentId) {
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(400).json({ message: "Account not linked to a department." });
        }

        const fileBuffer = fs.readFileSync(filePath);
        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        const existingFile = await Resource.findOne({ file_hash: fileHash });

        if (existingFile) {
            if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath); 
            return res.status(400).json({ message: "Duplicate alert: File already exists." });
        }

        const newResource = await Resource.create({
            uploader_id: uploaderId,
            department_id: departmentId,
            title,
            category,
            file_url: filePath,
            file_hash: fileHash,
            file_type: req.file.mimetype,
            status: 'approved'
        });

        if (requestId) {
            await ResourceRequest.findByIdAndUpdate(requestId, {
                is_fulfilled: true,
                fulfilled_by: uploaderId,
                fulfilled_at: Date.now()
            });
        }

        res.status(201).json(newResource);
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
        let query = {};

        if (mine === 'true') {
            query.uploader_id = req.user.id;
        } else {
            query.status = status === 'pending' ? 'pending' : 'approved';
        }

        if (search && search !== 'undefined') {
            query.title = { $regex: search, $options: 'i' };
        }
        
        if (category && category !== 'All' && category !== 'undefined') {
            query.category = category;
        }

        if (departmentId && departmentId !== 'undefined' && departmentId !== 'null') {
            query.department_id = departmentId;
        }

        let sortOption = { createdAt: -1 };
        if (trending === 'true') {
            sortOption = { download_count: -1 };
        }

        const resources = await Resource.find(query)
            .populate('uploader_id', 'full_name')
            .populate('department_id', 'name')
            .sort(sortOption);

        const formattedResources = await Promise.all(resources.map(async (resItem) => {
            const ratings = await ResourceRating.find({ resource_id: resItem._id });
            const avgRating = ratings.length > 0 ? ratings.reduce((acc, r) => acc + r.rating_value, 0) / ratings.length : 0;
            
            return {
                ...resItem.toObject(),
                uploader_name: resItem.uploader_id?.full_name,
                department_name: resItem.department_id?.name,
                average_rating: avgRating
            };
        }));

        res.json(formattedResources);
    } catch (err) {
        console.error("Get Resources Error:", err.message);
        res.status(500).json({ message: "Error fetching resources" });
    }
};

// --- 3. GET HUB REQUESTS ---
exports.getRequests = async (req, res) => {
    try {
        const { departmentId } = req.query;
        let query = { is_fulfilled: false };
        if (departmentId && departmentId !== 'undefined' && departmentId !== 'null') {
            query.department_id = departmentId;
        }

        const requests = await ResourceRequest.find(query)
            .populate('requester_id', 'full_name')
            .populate('department_id', 'name')
            .sort({ createdAt: -1 });

        const formatted = requests.map(r => ({
            ...r.toObject(),
            student_name: r.requester_id?.full_name,
            department_name: r.department_id?.name
        }));

        res.json(formatted || []);
    } catch (err) {
        res.status(500).json([]);
    }
};

// --- 4. CREATE REQUEST ---
exports.createRequest = async (req, res) => {
    try {
        const { title, description, departmentId } = req.body;
        const newReq = await ResourceRequest.create({
            requester_id: req.user.id,
            department_id: departmentId || null,
            title,
            description
        });
        res.status(201).json(newReq);
    } catch (err) { 
        res.status(500).json({ message: "Request failure" }); 
    }
};

// --- 5. FULFILL REQUEST ---
exports.fulfillRequest = async (req, res) => {
    try {
        await ResourceRequest.findByIdAndUpdate(req.params.id, {
            is_fulfilled: true,
            fulfilled_by: req.user.id,
            fulfilled_at: Date.now()
        });
        res.json({ message: "Handled! 🤝" });
    } catch (err) { 
        res.status(500).json({ message: "Fulfillment failed" }); 
    }
};

// --- 6. STATS ---
exports.getDepartmentStats = async (req, res) => {
    try {
        let deptId = req.user.department_id;
        if (!deptId) {
            const user = await User.findById(req.user.id);
            deptId = user?.department_id;
        }
        if (!deptId) return res.json({ total_downloads: 0, total_resources: 0, open_requests: 0 });

        const resources = await Resource.find({ department_id: deptId, status: 'approved' });
        const totalResources = resources.length;
        const totalDownloads = resources.reduce((acc, r) => acc + (r.download_count || 0), 0);
        const openRequests = await ResourceRequest.countDocuments({ department_id: deptId, is_fulfilled: false });

        res.json({
            total_downloads: totalDownloads,
            total_resources: totalResources,
            open_requests: openRequests
        });
    } catch (err) { 
        res.status(500).json({ message: "Stats failure" }); 
    }
};

// --- 7. RATINGS ---
exports.rateResource = async (req, res) => {
    try {
        const { resourceId, rating } = req.body;
        await ResourceRating.findOneAndUpdate(
            { resource_id: resourceId, user_id: req.user.id },
            { rating_value: rating },
            { upsert: true, new: true }
        );
        res.json({ message: "Rating recorded" });
    } catch (err) { 
        res.status(500).json({ message: "Rating failure" }); 
    }
};

// --- 8. RANKINGS & BADGES ---
exports.getRankings = async (req, res) => {
    try {
        const { role } = req.query;

        let pipeline = [
            { $match: { status: 'approved' } },
            { $group: { _id: '$uploader_id', totalUploads: { $sum: 1 } } },
            { $sort: { totalUploads: -1 } },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'userInfo'
                }
            },
            { $unwind: '$userInfo' }
        ];

        if (role && role !== 'All') {
            pipeline.push({ $match: { 'userInfo.role': role } });
        }

        const rankings = await Resource.aggregate(pipeline);

        const formattedRankings = rankings.map((item, index) => {
            const count = item.totalUploads;
            let level = 0;
            let badgeTitle = 'No Badge';

            if (count >= 1000) { level = 5; badgeTitle = 'Level 5 Arch-Contributor'; }
            else if (count >= 500) { level = 4; badgeTitle = 'Level 4 Elite Scholar'; }
            else if (count >= 250) { level = 3; badgeTitle = 'Level 3 Master Upload'; }
            else if (count >= 100) { level = 2; badgeTitle = 'Level 2 Senior Provider'; }
            else if (count >= 10) { level = 1; badgeTitle = 'Level 1 Contributor'; }

            return {
                rank: index + 1,
                userId: item._id,
                fullName: item.userInfo.full_name,
                email: item.userInfo.email,
                role: item.userInfo.role,
                totalUploads: count,
                level,
                badgeTitle
            };
        });

        res.json(formattedRankings);
    } catch (err) {
        console.error("Rankings Error:", err.message);
        res.status(500).json({ message: "Failed to fetch leaderboard rankings" });
    }
};

// --- 9. DOWNLOAD INCREMENT ---
exports.incrementDownload = async (req, res) => {
    try {
        await Resource.findByIdAndUpdate(req.params.id, { $inc: { download_count: 1 } });
        res.json({ message: "Counted." });
    } catch (err) { 
        res.status(500).json({ message: "Error" }); 
    }
};

// --- 10. NEW: DELETION & ADMIN WORKFLOW HANDLERS ---

// Request resource deletion (Student)
exports.requestDeletion = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: "Resource not found." });

        // Flag resource status as deletion requested
        resource.status = 'deletion_requested';
        await resource.save();
        res.json({ message: "Deletion request submitted to admin." });
    } catch (err) {
        res.status(500).json({ message: "Error requesting deletion" });
    }
};

// Admin approve resource
exports.approveResource = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndUpdate(
            req.params.id, 
            { status: 'approved' }, 
            { new: true }
        );
        if (!resource) return res.status(404).json({ message: "Resource not found" });
        res.json({ message: "Resource approved successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Error approving resource" });
    }
};

// Get all pending deletion requests (Admin)
exports.getDeletionRequests = async (req, res) => {
    try {
        const requests = await Resource.find({ status: 'deletion_requested' })
            .populate('uploader_id', 'full_name email')
            .populate('department_id', 'name');
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: "Error fetching deletion requests" });
    }
};

// Reject deletion request (Admin - restores status back to approved)
exports.rejectDeletion = async (req, res) => {
    try {
        const resource = await Resource.findByIdAndUpdate(
            req.params.id, 
            { status: 'approved' }, 
            { new: true }
        );
        if (!resource) return res.status(404).json({ message: "Resource not found" });
        res.json({ message: "Deletion request rejected. Resource restored." });
    } catch (err) {
        res.status(500).json({ message: "Error rejecting deletion request" });
    }
};

// Permanent delete resource (Admin)
exports.permanentDelete = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: "Resource not found" });

        // Delete physical file if it exists
        if (resource.file_url && fs.existsSync(resource.file_url)) {
            fs.unlinkSync(resource.file_url);
        }

        await Resource.findByIdAndDelete(req.params.id);
        await ResourceRating.deleteMany({ resource_id: req.params.id });

        res.json({ message: "Resource permanently deleted." });
    } catch (err) {
        console.error("Permanent delete error:", err.message);
        res.status(500).json({ message: "Error performing permanent deletion" });
    }
};