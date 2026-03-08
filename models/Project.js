import mongoose from "mongoose";

const ChecklistItemSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true },
  checked: { type: Boolean, default: false },
});

const TaskSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  status: {
    type: String,
    enum: ["not-started", "in-progress", "completed", "blocked", "on-hold"],
    default: "not-started",
  },
  startDay: { type: Number, default: 1 },
  endDay: { type: Number, default: 1 },
  assignee: { type: String, trim: true, default: "" },
  notes: { type: String, trim: true, default: "" },
  dueDate: { type: Date },
  checklist: [ChecklistItemSchema],
});

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  tasks: [TaskSchema],
});

const ProjectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    status: {
      type: String,
      enum: ["planning", "active", "completed", "on-hold"],
      default: "active",
    },
    startDate: { type: Date },
    totalDays: { type: Number, default: 7 },
    categories: [CategorySchema],
    assignedTo: { type: String, trim: true, default: "" },
    createdBy: { type: String, trim: true },
  },
  { timestamps: true }
);

export default mongoose.models.Project || mongoose.model("Project", ProjectSchema);
