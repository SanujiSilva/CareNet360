// Sample script to seed initial medicines into the database
// This can be run from the scripts folder

const sampleMedicines = [
  {
    name: "Amoxicillin",
    genericName: "Amoxicillin",
    manufacturer: "PharmaCorp",
    category: "Antibiotic",
    price: 12.99,
    stock: 150,
    description: "Broad-spectrum antibiotic used to treat bacterial infections",
    sideEffects: ["Nausea", "Diarrhea", "Rash"],
  },
  {
    name: "Ibuprofen",
    genericName: "Ibuprofen",
    manufacturer: "MediHealth",
    category: "Painkiller",
    price: 8.99,
    stock: 200,
    description: "Nonsteroidal anti-inflammatory drug for pain relief",
    sideEffects: ["Stomach upset", "Dizziness", "Headache"],
  },
  {
    name: "Vitamin D3",
    genericName: "Cholecalciferol",
    manufacturer: "VitaLife",
    category: "Vitamin",
    price: 15.99,
    stock: 100,
    description: "Essential vitamin for bone health and immune function",
    sideEffects: ["Rare: Nausea", "Constipation"],
  },
  {
    name: "Omeprazole",
    genericName: "Omeprazole",
    manufacturer: "GastroMed",
    category: "Antacid",
    price: 18.99,
    stock: 80,
    description: "Proton pump inhibitor for acid reflux and heartburn",
    sideEffects: ["Headache", "Stomach pain", "Diarrhea"],
  },
  {
    name: "Cetirizine",
    genericName: "Cetirizine HCl",
    manufacturer: "AllergyFree",
    category: "Antihistamine",
    price: 10.99,
    stock: 120,
    description: "Antihistamine for allergy relief",
    sideEffects: ["Drowsiness", "Dry mouth", "Fatigue"],
  },
]

console.log("Sample medicines data:")
console.log(JSON.stringify(sampleMedicines, null, 2))
console.log("\nUse this data to seed your MongoDB database through the pharmacy interface or MongoDB Atlas.")
