const mongoose = require("mongoose");

const deletionHistorySchema = new mongoose.Schema({
  type: { type: String, enum: ["teacher", "student"], required: true },
  deletedAt: { type: Date, default: Date.now },

  // Only one of these will be used based on `type`
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "teacher", default: null },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: "student", default: null },

  // Snapshots
  teacherName: String,
  studentName: String,
  studentUnivNo: String,
  previousTeacherName: String,
  previousTeacherId: { type: mongoose.Schema.Types.ObjectId, ref: "teacher", default: null }
});

const mappingSchema = new mongoose.Schema({
  studentId: [{ type: mongoose.Schema.Types.ObjectId, ref: "student", required: true }],
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "teacher", required: true, unique: true },
  maxStudents: { type: Number},
  createdAt: { type: Date, default: Date.now },


  // ✅ Embedded Deletion History
  isDeleted: { type: Boolean, default: false },

  deletionHistory: [deletionHistorySchema]
});

module.exports = mongoose.model("mapping", mappingSchema);
