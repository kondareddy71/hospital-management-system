
const express = require("express");
const bodyParser = require("body-parser");
const { v4: uuidv4 } = require("uuid");
const PDFDocument = require("pdfkit");

// Import ABHA module
const abhaRoutes = require("./abha/abha-routes");

const app = express();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));

// Use ABHA routes
app.use("/abha", abhaRoutes);

let users = [];
let patients = [];
let abhaRecords = [];
let consentLogs = [];
let revenue = 0;

// Generate ABHA ID format: XX-XXXX-XXXX-XXXX (14 digits)
const generateABHAId = () => {
  const part1 = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  const part2 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const part3 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  const part4 = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${part1}-${part2}-${part3}-${part4}`;
};

const doctors = [
  { name: "Dr. Sharma", specialization: "Cardiologist" },
  { name: "Dr. Reddy", specialization: "Diabetologist" },
  { name: "Dr. Kumar", specialization: "General Physician" }
];

const diseaseMedicine = {
  Fever: ["Paracetamol"],
  Diabetes: ["Metformin", "Insulin"],
  Cold: ["Cetirizine"],
  Headache: ["Aspirin"]
};

const prices = {
  Paracetamol: 30,
  Metformin: 50,
  Insulin: 120,
  Cetirizine: 25,
  Aspirin: 35
};

app.get("/", (req, res) => res.render("welcome"));

app.get("/register", (req, res) => res.render("register"));
app.post("/register", (req, res) => {
  users.push({ username: req.body.username, password: req.body.password });
  res.redirect("/login");
});

app.get("/login", (req, res) => res.render("login"));
app.post("/login", (req, res) => {
  const user = users.find(u => u.username === req.body.username && u.password === req.body.password);
  if(user){
    res.redirect("/dashboard");
  } else {
    res.send("Invalid Credentials");
  }
});

app.get("/appointment", (req, res) => res.render("appointment", { doctors }));

app.post("/appointment", (req, res) => {
  const id = "PAT-" + uuidv4().slice(0,6);
  const abhaId = generateABHAId();
  const meds = diseaseMedicine[req.body.disease];
  let total = 500;
  meds.forEach(m => total += prices[m]);
  revenue += total;

  const patient = {
    id,
    abhaId,
    name: req.body.name,
    doctor: req.body.doctor,
    disease: req.body.disease,
    total,
    medicines: meds,
    appointmentDate: new Date().toLocaleDateString(),
    consents: {
      hospitalSharing: false,
      pharmacySharing: false,
      emergencyAccess: true
    }
  };

  patients.push(patient);
  
  // Create ABHA health record
  const abhaRecord = {
    abhaId,
    patientName: patient.name,
    patientId: patient.id,
    medicalHistory: [{
      date: new Date().toLocaleDateString(),
      doctor: patient.doctor,
      disease: patient.disease,
      medicines: patient.medicines,
      bill: patient.total
    }],
    allergies: [],
    bloodType: "Not specified",
    createdAt: new Date().toISOString()
  };
  
  abhaRecords.push(abhaRecord);
  
  res.redirect("/dashboard");
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard", { patients, revenue });
});

app.get("/history", (req, res) => {
  res.render("history", { patients });
});

app.get("/doctors", (req, res) => {
  res.render("doctors", { doctors });
});

app.get("/bill/:id", (req, res) => {
  const patient = patients.find(p => p.id === req.params.id);
  if (!patient) {
    return res.status(404).send("Patient not found");
  }
  
  const doc = new PDFDocument();
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", "attachment; filename=bill.pdf");
  doc.pipe(res);
  doc.text("Pharmacist Hospital", { align: "center" });
  doc.moveDown();
  doc.text("Patient ID: " + patient.id);
  doc.text("Name: " + patient.name);
  doc.text("Doctor: " + patient.doctor);
  doc.text("Disease: " + patient.disease);
  doc.moveDown();
  doc.text("Total Bill: ₹" + patient.total);
  doc.end();
});

app.get("/abha-home", (req, res) => {
  res.render("abha-home");
});

// ========== Legacy ABHA Routes (deprecated - use /abha/* routes instead) ==========
// API endpoints for accessing ABHA data through main server

// Get ABHA stats endpoint
app.get("/abha-stats", (req, res) => {
  const abhaStore = require("./abha/abha-store");
  const stats = abhaStore.getStatistics();
  
  res.json({
    success: true,
    statistics: stats
  });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));
