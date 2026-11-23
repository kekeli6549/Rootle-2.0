const Resource = require('../models/Resource');
const ResourceRequest = require('../models/ResourceRequest');
const ResourceRating = require('../models/ResourceRating');
const User = require('../models/User');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { getBucket, deleteFileByUrl, ObjectId } = require('../config/gridfs');
const { isStaff, canManageDepartment, isOwnerOrStaff } = require('../middleware/authMiddleware');

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// New files live in GridFS. Old files may still be on disk from before the
// migration, so both are handled here.
const deleteStoredFile = async (fileUrl) => {
    if (await deleteFileByUrl(fileUrl)) return;

    const filename = path.basename(fileUrl || '');
    if (!filename) return;
    const legacyPath = path.join(__dirname, '..', 'uploads', filename);
    try {
        if (fs.existsSync(legacyPath)) fs.unlinkSync(legacyPath);
    } catch (err) {
        console.error('Legacy file delete error:', err.message);
    }
};

exports.deleteStoredFile = deleteStoredFile;

// --- 1. UPLOAD RESOURCE (GridFS) ---
exports.uploadResource = async (req, res) => {
    let gridFsId = null;
    try {
        if (!req.file || !req.file.buffer) return res.status(400).json({ message: "No file selected." });

        const { title, category, requestId } = req.body;
        const uploaderId = req.user.id;
        const fileBuffer = req.file.buffer;

        const user = await User.findById(uploaderId);
        const departmentId = user?.department_id;

        if (!departmentId) {
            return res.status(400).json({ message: "Account not linked to a department." });
        }

        const fileHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
        const existingFile = await Resource.findOne({ file_hash: fileHash });

        if (existingFile) {
            return res.status(400).json({ message: "Duplicate alert: File already exists." });
        }

        // Write bytes to MongoDB GridFS.
        gridFsId = await new Promise((resolve, reject) => {
            const stream = getBucket().openUploadStream(req.file.originalname, {
                contentType: req.file.mimetype,
                metadata: { uploader_id: uploaderId, category, title }
            });
            stream.on('error', reject);
            stream.on('finish', () => resolve(stream.id));
            stream.end(fileBuffer);
        });

        // Student uploads go to 'pending' (My Library + Lecturer Review Queue);
        // lecturer/admin/superadmin uploads go directly to 'approved'.
        const isStaff = ['lecturer', 'admin', 'superadmin'].includes(user.role);
        const initialStatus = isStaff ? 'approved' : 'pending';

        const newResource = await Resource.create({
            uploader_id: uploaderId,
            department_id: departmentId,
            title,
            category,
            file_url: `/api/resources/file/${gridFsId}`,
            file_hash: fileHash,
            file_type: req.file.mimetype,
            status: initialStatus
        });

        if (requestId && isStaff) {
            await ResourceRequest.findByIdAndUpdate(requestId, {
                is_fulfilled: true,
                fulfilled_by: uploaderId,
                fulfilled_at: Date.now()
            });
        }

        res.status(201).json(newResource);
    } catch (err) {
        console.error("CRITICAL BACKEND ERROR:", err.message);
        // Roll back the GridFS write if anything after it failed.
        if (gridFsId) {
            try { await getBucket().delete(gridFsId); } catch (cleanupErr) { /* ignore */ }
        }
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// --- STREAM A FILE FROM GRIDFS ---
exports.getFile = async (req, res) => {
    try {
        const { id } = req.params;
        if (!ObjectId.isValid(id)) return res.status(400).json({ message: "Invalid file id." });

        const objectId = new ObjectId(id);
        const bucket = getBucket();
        const fileInfo = await bucket.find({ _id: objectId }).next();
        if (!fileInfo) return res.status(404).json({ message: "File not found." });

        const safeName = String(fileInfo.filename || 'download').replace(/[^\w.\-]/g, '_');
        res.set('Content-Type', fileInfo.contentType || 'application/octet-stream');
        res.set('Content-Disposition', `inline; filename="${safeName}"`);
        if (fileInfo.length) res.set('Content-Length', fileInfo.length);

        const stream = bucket.openDownloadStream(objectId);
        stream.on('error', (err) => {
            console.error('GridFS stream error:', err.message);
            if (!res.headersSent) res.status(500).json({ message: "Could not read file." });
            else res.destroy(err);
        });
        stream.pipe(res);
    } catch (err) {
        console.error('GridFS read error:', err.message);
        res.status(500).json({ message: "Could not read file." });
    }
};

// --- 2. GET ALL RESOURCES ---
exports.getAllResources = async (req, res) => {
    try {
        const { search, category, departmentId, status, trending, mine } = req.query;
        let query = {};

        const staff = isStaff(req.user);

        if (mine === 'true') {
            query.uploader_id = req.user.id;
            if (status && status !== 'all' && status !== 'undefined') {
                query.status = status;
            }
        } else if (status === 'pending') {
            // Pending uploads are a staff review queue, not public content.
            if (!staff) return res.status(403).json({ message: "Access denied." });
            query.status = 'pending';
        } else {
            query.status = 'approved';
        }

        if (search && search !== 'undefined') {
            query.title = { $regex: escapeRegex(search), $options: 'i' };
        }

        if (category && category !== 'All' && category !== 'undefined') {
            query.category = category;
        }

        if (departmentId && departmentId !== 'undefined' && departmentId !== 'null') {
            query.department_id = departmentId;
        }

        let sortOption = { created_at: -1 };
        if (trending === 'true') {
            sortOption = { download_count: -1 };
        }

        const resources = await Resource.find(query)
            .populate('uploader_id', 'full_name')
            .populate('department_id', 'name')
            .sort(sortOption);

        // Fetch all ratings in a single query instead of one per resource (N+1 fix).
        const resourceIds = resources.map((r) => r._id);
        const allRatings = await ResourceRating.find({ resource_id: { $in: resourceIds } });
        const ratingsByResource = {};
        allRatings.forEach((rating) => {
            if (!ratingsByResource[rating.resource_id]) {
                ratingsByResource[rating.resource_id] = [];
            }
            ratingsByResource[rating.resource_id].push(rating.rating_value);
        });

        const formattedResources = resources.map((resItem) => {
            const itemRatings = ratingsByResource[resItem._id] || [];
            const avgRating = itemRatings.length > 0
                ? itemRatings.reduce((acc, val) => acc + val, 0) / itemRatings.length
                : 0;

            return {
                ...resItem.toObject(),
                uploader_name: resItem.uploader_id?.full_name,
                department_name: resItem.department_id?.name,
                average_rating: avgRating
            };
        });

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

        if (!isStaff(req.user)) {
            // Students only see their own help requests.
            query.requester_id = req.user.id;
        } else if (departmentId && departmentId !== 'undefined' && departmentId !== 'null') {
            query.department_id = departmentId;
        }

        const requests = await ResourceRequest.find(query)
            .populate('requester_id', 'full_name')
            .populate('department_id', 'name')
            .sort({ created_at: -1 });

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
        if (!title || !String(title).trim()) {
            return res.status(400).json({ message: "A request title is required." });
        }
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
        const request = await ResourceRequest.findById(req.params.id);
        if (!request) return res.status(404).json({ message: "Request not found." });
        if (!isStaff(req.user) || !canManageDepartment(req.user, request.department_id)) {
            return res.status(403).json({ message: "Access denied." });
        }

        request.is_fulfilled = true;
        request.fulfilled_by = req.user.id;
        request.fulfilled_at = Date.now();
        await request.save();
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
        const numericRating = Number(rating);
        if (!Number.isInteger(numericRating) || numericRating < 1 || numericRating > 5) {
            return res.status(400).json({ message: "Rating must be a whole number from 1 to 5." });
        }
        if (!await Resource.exists({ _id: resourceId, status: 'approved' })) {
            return res.status(404).json({ message: "Resource not found." });
        }
        await ResourceRating.findOneAndUpdate(
            { resource_id: resourceId, user_id: req.user.id },
            { rating_value: numericRating },
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
        const normalizedRole = typeof role === 'string' ? role.trim().toLowerCase() : 'all';

        const matchStage = { $match: { status: 'approved', uploader_id: { $ne: null } } };

        const pipeline = [
            matchStage,
            {
                $group: {
                    _id: '$uploader_id',
                    totalUploads: { $sum: 1 }
                }
            },
            { $match: { totalUploads: { $gte: 1 } } },
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

        // 'admin' and 'lecturer' are treated as the same staff tier.
        if (normalizedRole && normalizedRole !== 'all') {
            const roles = normalizedRole === 'lecturer'
                ? ['lecturer', 'admin']
                : [normalizedRole];
            pipeline.push({
                $match: {
                    $expr: {
                        $in: [
                            { $toLower: { $trim: { input: { $ifNull: ['$userInfo.role', ''] } } } },
                            roles
                        ]
                    }
                }
            });
        }

        const rankings = await Resource.aggregate(pipeline);

        const formattedRankings = rankings.map((item, index) => {
            const count = item.totalUploads;
            let level = 0;
            let badgeTitle = 'No Badge';

            if (count >= 1000) {
                level = 5;
                badgeTitle = 'Level 5 Arch-Contributor';
            } else if (count >= 500) {
                level = 4;
                badgeTitle = 'Level 4 Elite Scholar';
            } else if (count >= 250) {
                level = 3;
                badgeTitle = 'Level 3 Master Upload';
            } else if (count >= 100) {
                level = 2;
                badgeTitle = 'Level 2 Senior Provider';
            } else if (count >= 10) {
                level = 1;
                badgeTitle = 'Level 1 Contributor';
            }

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
        const updated = await Resource.findByIdAndUpdate(
            req.params.id,
            { $inc: { download_count: 1 } },
            { new: true }
        );
        if (!updated) return res.status(404).json({ message: "Resource not found." });
        res.json({ message: "Counted." });
    } catch (err) {
        res.status(500).json({ message: "Error" });
    }
};

// --- 10. DELETION & ADMIN WORKFLOW HANDLERS ---

// Request resource deletion (Student)
exports.requestDeletion = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: "Resource not found." });
        if (!isOwnerOrStaff(req.user, resource.uploader_id)) {
            return res.status(403).json({ message: "You can only request removal of your own uploads." });
        }

        resource.status = 'deletion_requested';
        await resource.save();
        res.json({ message: "Deletion request submitted to admin." });
    } catch (err) {
        res.status(500).json({ message: "Error requesting deletion" });
    }
};

// Admin approve pending resource
exports.approveResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: "Resource not found" });
        if (!canManageDepartment(req.user, resource.department_id)) {
            return res.status(403).json({ message: "Access denied." });
        }

        resource.status = 'approved';
        await resource.save();
        res.json({ message: "Resource approved successfully!" });
    } catch (err) {
        res.status(500).json({ message: "Error approving resource" });
    }
};

// Admin reject pending resource
exports.rejectResource = async (req, res) => {
    try {
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: "Resource not found" });
        if (!canManageDepartment(req.user, resource.department_id)) {
            return res.status(403).json({ message: "Access denied." });
        }

        await deleteStoredFile(resource.file_url);

        await Resource.findByIdAndDelete(req.params.id);
        await ResourceRating.deleteMany({ resource_id: req.params.id });
        res.json({ message: "Pending resource rejected and removed." });
    } catch (err) {
        res.status(500).json({ message: "Error rejecting resource" });
    }
};

// Get all pending deletion requests (Admin)
exports.getDeletionRequests = async (req, res) => {
    try {
        const query = { status: 'deletion_requested' };
        if (req.user?.role !== 'superadmin' && req.user?.department_id) {
            query.department_id = req.user.department_id;
        }
        const requests = await Resource.find(query)
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
        const resource = await Resource.findById(req.params.id);
        if (!resource) return res.status(404).json({ message: "Resource not found" });
        if (!canManageDepartment(req.user, resource.department_id)) {
            return res.status(403).json({ message: "Access denied." });
        }

        resource.status = 'approved';
        await resource.save();
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
        if (!canManageDepartment(req.user, resource.department_id)) {
            return res.status(403).json({ message: "Access denied." });
        }

        await deleteStoredFile(resource.file_url);

        await Resource.findByIdAndDelete(req.params.id);
        await ResourceRating.deleteMany({ resource_id: req.params.id });

        res.json({ message: "Resource permanently deleted." });
    } catch (err) {
        console.error("Permanent delete error:", err.message);
        res.status(500).json({ message: "Error performing permanent deletion" });
    }
};