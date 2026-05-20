const csvPath = "rowe_estimating_factors_seed.csv";

const formulaRegistry = {
  cy_to_tons: {
    label: "CY to tons",
    expression: "quantity * densityTonsPerCY",
    run: ({ quantity, densityTonsPerCY }) => quantity * densityTonsPerCY
  },
  sf_depth_in_to_cy: {
    label: "SF and depth to CY",
    expression: "sf * depthIn / 12 / 27",
    run: ({ quantity, depthIn }) => quantity * depthIn / 12 / 27
  },
  sy_depth_in_to_cy: {
    label: "SY and depth to CY",
    expression: "sy * 9 * depthIn / 12 / 27",
    run: ({ quantity, depthIn }) => quantity * 9 * depthIn / 12 / 27
  },
  asphalt_sy_depth_to_tons: {
    label: "Asphalt SY to tons",
    expression: "sy * depthIn * asphaltLbPerSYIn / 2000",
    run: ({ quantity, depthIn, asphaltLbPerSYIn }) => quantity * depthIn * asphaltLbPerSYIn / 2000
  },
  tack_gallons: {
    label: "Tack gallons",
    expression: "sy * tackRateGalPerSY",
    run: ({ quantity, tackRateGalPerSY }) => quantity * tackRateGalPerSY
  },
  lf_width_depth_to_cy: {
    label: "LF trench volume",
    expression: "lf * widthFt * depthIn / 12 / 27",
    run: ({ quantity, widthFt, depthIn }) => quantity * widthFt * depthIn / 12 / 27
  },
  curb_cy: {
    label: "Curb/gutter CY",
    expression: "lf * sectionSF / 27",
    run: ({ quantity, sectionSF }) => quantity * sectionSF / 27
  },
  circular_pier_cy: {
    label: "Circular pier CY",
    expression: "pi * radiusFt^2 * depthFt / 27 * count",
    run: ({ diameterIn, depthFt, count }) => Math.PI * Math.pow(diameterIn / 24, 2) * depthFt / 27 * count
  }
};

const asphaltMixes = {
  "A Mix": { lbPerSYIn: 108, defaultOil: "64-22", history: [86, 89, 91, 94] },
  "B Mix": { lbPerSYIn: 110, defaultOil: "64-22", history: [88, 92, 95, 97] },
  "B-Mod": { lbPerSYIn: 112, defaultOil: "76-22", history: [102, 106, 109, 112] },
  BM2: { lbPerSYIn: 111, defaultOil: "64-22", history: [96, 99, 101, 104] },
  "C Mix": { lbPerSYIn: 110, defaultOil: "64-22", history: [91, 93, 96, 99] },
  CW: { lbPerSYIn: 109, defaultOil: "64-22", history: [94, 97, 101, 103] },
  CS: { lbPerSYIn: 109, defaultOil: "76-22", history: [105, 108, 111, 114] },
  D: { lbPerSYIn: 112, defaultOil: "64-22", history: [98, 101, 104, 107] },
  "411 E": { lbPerSYIn: 113, defaultOil: "76-22", history: [114, 118, 121, 125] }
};

const oilAdjustments = {
  "64-22": 0,
  "70-22": 4,
  "76-22": 9,
  "PG 64E-22": 13
};

const yesNo = ["No", "Yes"];
const riskOptions = ["Unclear", "Excluded", "Included"];
const pipeTypes = ["RCP", "HDPE", "CMP", "PVC", "DIP", "Waterline", "Sanitary", "Storm"];
const stripingLayouts = ["Missing", "Sketch", "Civil plan", "Restripe existing"];
const surfaceConditions = ["New asphalt", "Existing asphalt", "Milled surface", "Aged/oxidized", "Aggregate base"];

const scopeRiskLibrary = [
  "No geotechnical report",
  "No pavement section",
  "Pipe material not specified",
  "Trench backfill not specified",
  "Flowable fill required but not included",
  "Rock excavation unclear",
  "Dewatering unclear",
  "Prime coat unclear",
  "Tack coat unclear",
  "Striping layout missing",
  "Electrical wire size not shown",
  "Utility crossings not shown",
  "Testing requirements unclear",
  "Phasing or access restrictions unclear"
];

const resources = {
  labor: [
    { name: "Pave A Foreman", category: "Supervisory", unit: "HR", cost: 35.42 },
    { name: "Pave B Pave/Screed Op", category: "Operators", unit: "HR", cost: 33.05 },
    { name: "Pave C Roller Op", category: "Operators", unit: "HR", cost: 30.69 },
    { name: "Pave D Raker", category: "Skilled Labor", unit: "HR", cost: 28.33 },
    { name: "Labor C Skilled", category: "Skilled Labor", unit: "HR", cost: 29.51 },
    { name: "Labor D Unskilled", category: "Unskilled Labor", unit: "HR", cost: 27.15 },
    { name: "Operator A", category: "Operators", unit: "HR", cost: 35.42 }
  ],
  equipment: [
    { name: "Cart Path Paver", category: "Pavers", unit: "DY", cost: 1340.42 },
    { name: "Distributor Truck", category: "Trucks", unit: "HR", cost: 150 },
    { name: "Dump Truck (Tri-Axle)", category: "Trucks", unit: "HR", cost: 63.7 },
    { name: "Cat 308", category: "Heavy Equipment", unit: "HR", cost: 60.81 },
    { name: "Engcon Tiltrotator", category: "Attachments", unit: "HR", cost: 32 },
    { name: "Concrete Pump Truck", category: "Trucks", unit: "DY", cost: 1640.83 },
    { name: "Concrete Soft Cut Saw", category: "Tools", unit: "DY", cost: 20 }
  ],
  materials: [
    { name: "#57 Stone", category: "Aggregates", unit: "TON", cost: 31.68 },
    { name: "Crusher Run / DGA", category: "Aggregates", unit: "TON", cost: 29.5 },
    { name: "A Mix Asphalt", category: "Asphalt", unit: "TON", cost: 94 },
    { name: "B Mix Asphalt", category: "Asphalt", unit: "TON", cost: 97 },
    { name: "B-Mod Asphalt", category: "Asphalt", unit: "TON", cost: 112 },
    { name: "12 in N-12 HDPE Storm Pipe", category: "Pipe", unit: "LF", cost: 9.69 },
    { name: "Concrete 4000 PSI", category: "Concrete", unit: "CY", cost: 158 },
    { name: "12 in Straw Wattle", category: "Erosion Control", unit: "LF", cost: 2.29 }
  ]
};

const overheadCosts = [
  { name: "Office salaries / admin", category: "General overhead", basis: "Annual", amount: 285000 },
  { name: "Estimator / project manager time", category: "General overhead", basis: "Annual", amount: 185000 },
  { name: "Office rent / utilities", category: "Facilities", basis: "Annual", amount: 54000 },
  { name: "General liability insurance", category: "Insurance", basis: "Annual", amount: 92000 },
  { name: "Auto / umbrella insurance", category: "Insurance", basis: "Annual", amount: 78000 },
  { name: "Accounting, legal, payroll", category: "Professional", basis: "Annual", amount: 42000 },
  { name: "Estimating / accounting software", category: "Software", basis: "Annual", amount: 26000 },
  { name: "Phones, tablets, GPS, internet", category: "Technology", basis: "Annual", amount: 24000 },
  { name: "Safety, training, compliance", category: "Operations", basis: "Annual", amount: 35000 },
  { name: "Shop, yard, small tools", category: "Operations", basis: "Annual", amount: 68000 },
  { name: "Non-billable pickups / fuel", category: "Fleet overhead", basis: "Annual", amount: 96000 },
  { name: "Bonding capacity / bid costs", category: "Bid overhead", basis: "Annual", amount: 45000 }
];

const crewTemplates = [
  {
    name: "GH Reed Asphalt 4 Man Crew",
    workType: "Asphalt",
    production: "850 SY/DY",
    members: ["Pave A Foreman", "Pave B Pave/Screed Op", "Pave C Roller Op", "Pave D Raker", "Cart Path Paver", "Distributor Truck"],
    quantities: {}
  },
  {
    name: "Excavation Pipe Crew",
    workType: "Pipe",
    production: "55 LF/DY",
    members: ["Operator A", "Labor C Skilled", "Labor D Unskilled", "Cat 308", "Engcon Tiltrotator", "Dump Truck (Tri-Axle)"],
    quantities: { "Labor D Unskilled": 2 }
  },
  {
    name: "Concrete Pour Crew",
    workType: "Concrete",
    production: "65 CY/DY",
    members: ["Labor C Skilled", "Labor D Unskilled", "Concrete Pump Truck", "Concrete Soft Cut Saw"],
    quantities: { "Labor D Unskilled": 3 }
  }
];

const calculatorDefs = [
  { id: "asphalt", label: "Asphalt paving", category: "Asphalt", unit: "SY", crew: "GH Reed Asphalt 4 Man Crew", defaults: { quantity: 1200, depthIn: 3, mixType: "B Mix", oilType: "64-22", surfaceCondition: "Existing asphalt", pavementSection: "Unclear", tackClarity: "Included", wastePct: 5, tackRateGalPerSY: 0.08, truckingCostPerTon: 12, productionModifier: 1 } },
  { id: "aggregate", label: "Aggregate base", category: "Aggregate", unit: "SY", crew: "Excavation Pipe Crew", defaults: { quantity: 1200, materialType: "Crusher Run / DGA", depthIn: 6, densityTonsPerCY: 1.55, wastePct: 7, materialCostPerTon: 29.5, truckingCostPerTon: 10 } },
  { id: "earthwork", label: "Earthwork", category: "Earthwork", unit: "BCY", crew: "Excavation Pipe Crew", defaults: { quantity: 850, operation: "Export", geotechReport: "No", swellFactor: 1.2, shrinkFactor: 0.85, costPerBCY: 18, truckCYPerLoad: 14, rockRisk: "Unclear", dewateringRisk: "Unclear", productionModifier: 1 } },
  { id: "pipe", label: "Pipe trenching", category: "Underground", unit: "LF", crew: "Excavation Pipe Crew", defaults: { quantity: 430, pipeType: "RCP", pipeDiameterIn: 18, avgDepthFt: 6.5, trenchWidthFt: 3.5, beddingDepthIn: 6, beddingDensityTonsPerCY: 1.45, trenchBackfillSpec: "Unclear", dewateringRisk: "Unclear", rockRisk: "Unclear", wastePct: 7, pipeMaterialCostLF: 9.69, crewCostPerLF: 36.81 } },
  { id: "flatwork", label: "Concrete flatwork", category: "Concrete", unit: "SF", crew: "Concrete Pour Crew", defaults: { quantity: 4500, depthIn: 5, concreteCostCY: 158, wastePct: 5, finishCostSF: 2.9 } },
  { id: "curb", label: "Curb/gutter", category: "Concrete", unit: "LF", crew: "Concrete Pour Crew", defaults: { quantity: 900, sectionSF: 1.18, concreteCostCY: 172, wastePct: 4, productionLFPerDay: 450 } },
  { id: "piers", label: "Piers", category: "Concrete", unit: "EA", crew: "Concrete Pour Crew", defaults: { quantity: 14, diameterIn: 24, depthFt: 8, concreteCostCY: 190, wastePct: 5 } },
  { id: "lighting", label: "Electrical/site lighting", category: "Electrical", unit: "EA", crew: "Subcontractor", defaults: { quantity: 8, poleBaseEach: 950, fixtureEach: 2800, conduitLF: 600, conduitCostLF: 14 } },
  { id: "demo", label: "Demolition", category: "Demolition", unit: "SY", crew: "Excavation Pipe Crew", defaults: { quantity: 640, depthIn: 6, debrisTonsPerCY: 1.2, disposalCostTon: 22, haulCostTon: 11 } },
  { id: "erosion", label: "Erosion control", category: "Erosion Control", unit: "LF", crew: "Labor Crew", defaults: { quantity: 1200, materialCostLF: 2.29, installCostLF: 1.1, wastePct: 5 } },
  { id: "striping", label: "Striping", category: "Striping", unit: "LF", crew: "Striping Sub", defaults: { quantity: 2600, paintCostLF: 0.18, installCostLF: 0.54, wastePct: 3 } },
  { id: "sealcoat", label: "Sealcoat / crackfill", category: "Sealcoating", unit: "SY", crew: "Sealcoat Sub", defaults: { quantity: 5200, coatCount: 2, galPerSYPerCoat: 0.14, crackLF: 900, crackLbPerLF: 0.18, routeCracks: "No", wastePct: 8, sealcoatCostGal: 5.75, crackfillCostLb: 1.85, stripingReplacement: "Yes" } },
  { id: "milling", label: "Asphalt milling", category: "Asphalt", unit: "SY", crew: "GH Reed Asphalt 4 Man Crew", defaults: { quantity: 4200, depthIn: 2, millingsTonsPerSYIn: 0.055, haulOff: "Yes", truckTonsPerLoad: 20, millingCostSY: 4.75, haulCostTon: 12, sweepCostSY: 0.35 } },
  { id: "waterline", label: "Waterline trench", category: "Underground", unit: "LF", crew: "Excavation Pipe Crew", defaults: { quantity: 600, pipeType: "DIP", pipeDiameterIn: 8, avgDepthFt: 5.5, trenchWidthFt: 2.67, beddingDepthIn: 6, beddingDensityTonsPerCY: 1.45, pipeMaterialCostLF: 42, warningTapeLF: 600, tracerWireLF: 600, testingAllowance: 1800, trenchBackfillSpec: "Unclear", dewateringRisk: "Unclear", rockRisk: "Unclear", wastePct: 7 } },
  { id: "structures", label: "Drainage structures", category: "Underground", unit: "EA", crew: "Excavation Pipe Crew", defaults: { quantity: 4, structureType: "Catch basin", avgDepthFt: 6, structureCostEach: 3200, excavationCYEach: 8, stoneCYEach: 1.5, connectExistingCount: 1, coreExistingCount: 1, testingAllowance: 750 } },
  { id: "trucking", label: "Trucking", category: "Universal", unit: "TON", crew: "Truck Fleet", defaults: { quantity: 360, truckTonsPerLoad: 20, looseCYPerLoad: 14, haulDistanceMiles: 12, haulRatePerLoad: 130, roundTripMinutes: 52, dumpFeePerLoad: 0, minimumCharge: 650 } }
];

const testProjects = [
  { name: "Simple asphalt parking lot", modules: ["asphalt", "trucking", "striping"], expectedChecks: ["Asphalt tons use 110 lb/SY/in default", "Tack coat shown separately", "Striping layout flagged if missing"] },
  { name: "Mill and overlay parking lot", modules: ["milling", "asphalt", "trucking", "striping"], expectedChecks: ["Millings haul-off loads shown", "Overlay tons separate from milling", "Sweep/cleanup included"] },
  { name: "New stone base + asphalt lot", modules: ["aggregate", "asphalt", "trucking"], expectedChecks: ["Aggregate CY and tons separate", "Asphalt binder/surface assumptions visible", "Truck loads calculated"] },
  { name: "Concrete sidewalk and curb job", modules: ["flatwork", "curb", "piers"], expectedChecks: ["Concrete uses SF x inches / 324", "Curb uses LF x section area / 27", "Waste shown separately"] },
  { name: "Storm pipe job with RCP and structures", modules: ["pipe", "structures", "earthwork"], expectedChecks: ["Trench safety flagged over 5 ft", "Backfill spec flagged if unclear", "Structures and connections separated"] },
  { name: "HDPE storm pipe with stone bedding", modules: ["pipe", "aggregate", "trucking"], expectedChecks: ["Bedding CY and stone tons shown", "Spoils/trucking review needed", "Pipe material selectable"] },
  { name: "Waterline trench/testing job", modules: ["waterline", "trucking"], expectedChecks: ["Warning tape and tracer wire shown", "Testing allowance included", "Dewatering/rock risk flagged"] },
  { name: "Earthwork import/export job", modules: ["earthwork", "trucking"], expectedChecks: ["BCY, LCY, CCY kept separate", "Swell/shrink editable", "Loads from loose CY"] },
  { name: "Sealcoat/crackfill/stripe job", modules: ["sealcoat", "striping"], expectedChecks: ["Sealcoat gallons by coat count", "Crackfill pounds by LF", "Restripe flag visible"] },
  { name: "Mixed civil site package", modules: ["earthwork", "aggregate", "pipe", "flatwork", "asphalt", "lighting", "erosion"], expectedChecks: ["RFI flags visible", "Cost mix visible", "No workflow dead-ends"] }
];

const state = {
  view: "estimate",
  selectedCalc: "asphalt",
  resourceTab: "crews",
  editingCrew: "",
  selectedResources: { labor: null, equipment: null, materials: null },
  editingResource: false,
  selectedOverheadIndex: null,
  editingOverhead: false,
  project: { name: "Grundy County SR 50 Pipe Install And Ditch Work", phase: "Base Bid", alternate: "None", estimator: "CJR" },
  selectedTestProject: 0,
  factors: [],
  search: "",
  category: "All",
  overheadAnnualDirectCost: 5000000,
  estimate: [
    { item: "300", name: "Ditchline", workType: "Earthwork", unit: "LF", qty: 430, crew: "Excavation Pipe Crew", material: "#57 Stone", cost: 21001.8, price: 57000.8 },
    { item: "600", name: "RCP 15-24 Trench and Place", workType: "Pipe", unit: "LF", qty: 430, crew: "Excavation Pipe Crew", material: "12 in N-12 HDPE Storm Pipe", cost: 11462.4, price: 29750 },
    { item: "1", name: "Heavy Duty Pavement - 3 in Binder, 3 in Surface", workType: "Asphalt", unit: "SY", qty: 1200, crew: "GH Reed Asphalt 4 Man Crew", material: "B Mix Asphalt", cost: 19380.7, price: 22249.8 }
  ]
};

const viewMeta = {
  estimate: { title: "Estimate Detail", icon: "EST" },
  field: { title: "Field Takeoff", icon: "FLD" },
  resources: { title: "Resources", icon: "RES" },
  assemblies: { title: "Crew Assemblies", icon: "ASM" },
  review: { title: "Bid Review", icon: "REV" }
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];
    if (char === '"' && quoted && next === '"') {
      value += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(value);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }
  if (value || row.length) {
    row.push(value);
    rows.push(row);
  }
  const headers = rows.shift();
  return rows.map((cells) => Object.fromEntries(headers.map((header, index) => [header, cells[index] || ""])));
}

async function loadFactors() {
  const response = await fetch(csvPath);
  const text = await response.text();
  state.factors = parseCsv(text).map((factor) => ({
    ...factor,
    factor: Number(factor.factor || 0),
    defaultWastePct: factor.defaultWastePct === "" ? null : Number(factor.defaultWastePct),
    minRecommended: factor.minRecommended === "" ? null : Number(factor.minRecommended),
    maxRecommended: factor.maxRecommended === "" ? null : Number(factor.maxRecommended),
    tags: factor.tags ? factor.tags.split("|").filter(Boolean) : []
  }));
}

function money(value) {
  return Number(value || 0).toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function num(value, digits = 2) {
  return Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: digits });
}

function activeCalc() {
  return calculatorDefs.find((calc) => calc.id === state.selectedCalc) || calculatorDefs[0];
}

function factorById(id) {
  return state.factors.find((factor) => factor.id === id);
}

function crewCostPerDay(crewName) {
  const crew = crewTemplates.find((template) => template.name === crewName);
  if (!crew) return 0;
  return crew.members.reduce((sum, member) => {
    const labor = resources.labor.find((item) => item.name === member);
    const equipment = resources.equipment.find((item) => item.name === member);
    const resource = labor || equipment;
    if (!resource) return sum;
    return sum + resourceDayCost(resource) * crewMemberQty(crew, member);
  }, 0);
}

function crewMemberQty(crew, member) {
  return Number((crew.quantities || {})[member] || 1);
}

function allCrewResources() {
  return [
    ...resources.labor.map((item) => ({ ...item, resourceType: "Labor" })),
    ...resources.equipment.map((item) => ({ ...item, resourceType: "Equipment" }))
  ];
}

function resourceByName(name) {
  return allCrewResources().find((item) => item.name === name);
}

function resourceDayCost(resource) {
  return resource.unit === "HR" ? resource.cost * 8 : resource.cost;
}

function overheadAnnualTotal() {
  return overheadCosts.reduce((sum, item) => sum + item.amount, 0);
}

function overheadPercent() {
  return state.overheadAnnualDirectCost > 0 ? overheadAnnualTotal() / state.overheadAnnualDirectCost * 100 : 0;
}

function renameResourceReferences(oldName, newName) {
  if (!oldName || oldName === newName) return;
  crewTemplates.forEach((crew) => {
    crew.members = crew.members.map((member) => member === oldName ? newName : member);
    if (crew.quantities && Object.prototype.hasOwnProperty.call(crew.quantities, oldName)) {
      crew.quantities[newName] = crew.quantities[oldName];
      delete crew.quantities[oldName];
    }
  });
  state.estimate.forEach((line) => {
    if (line.material === oldName) line.material = newName;
  });
}

function selectedResourceIndex(type) {
  const index = state.selectedResources[type];
  return Number.isInteger(index) ? index : null;
}

function selectedResource(type) {
  const index = selectedResourceIndex(type);
  return index === null ? null : resources[type][index];
}

function avg(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function asphaltPrice(input) {
  const mix = asphaltMixes[input.mixType];
  return avg(mix.history) + (oilAdjustments[input.oilType] || 0);
}

function wasteFactor(percent) {
  return 1 + Number(percent || 0) / 100;
}

function qtyRow(label, inputQty, formula, baseQty, wastePct, finalQty, unit, notes = "") {
  return { label, inputQty, formula, baseQty, wastePct: wastePct || 0, finalQty, unit, notes };
}

function buildQuantityBreakdown(calc, result) {
  const input = calc.defaults;
  if (calc.id === "asphalt") {
    const mix = asphaltMixes[input.mixType];
    const tons = input.quantity * input.depthIn * mix.lbPerSYIn / 2000;
    return [
      qtyRow("Asphalt tons", `${input.quantity} SY @ ${input.depthIn} in`, "SY x depth x lb/SY/in / 2000", tons, input.wastePct, tons * wasteFactor(input.wastePct), "TON", `${input.mixType}, oil ${input.oilType}`),
      qtyRow("Tack coat", `${input.quantity} SY`, "SY x gal/SY", input.quantity * input.tackRateGalPerSY, 0, input.quantity * input.tackRateGalPerSY, "GAL", input.surfaceCondition),
      qtyRow("Truck loads", `${tons * wasteFactor(input.wastePct)} TON`, "tons / truck tons per load", (tons * wasteFactor(input.wastePct)) / 20, 0, (tons * wasteFactor(input.wastePct)) / 20, "LOAD", "Truck size can be adjusted in trucking module")
    ];
  }
  if (calc.id === "aggregate") {
    const cy = input.quantity * 9 * input.depthIn / 12 / 27;
    const tons = cy * input.densityTonsPerCY;
    return [
      qtyRow("Base volume", `${input.quantity} SY @ ${input.depthIn} in`, "SY x 9 x depth / 12 / 27", cy, 0, cy, "CY", input.materialType),
      qtyRow("Purchased aggregate", `${cy} CY`, "CY x tons/CY", tons, input.wastePct, tons * wasteFactor(input.wastePct), "TON", `Density ${input.densityTonsPerCY} TON/CY`),
      qtyRow("Truck loads", `${tons * wasteFactor(input.wastePct)} TON`, "tons / 20", (tons * wasteFactor(input.wastePct)) / 20, 0, (tons * wasteFactor(input.wastePct)) / 20, "LOAD", "Confirm truck legal payload")
    ];
  }
  if (calc.id === "earthwork") {
    const bankCY = input.quantity;
    const looseCY = bankCY * input.swellFactor;
    const compactedCY = looseCY * input.shrinkFactor;
    return [
      qtyRow("Bank excavation", `${bankCY} BCY`, "entered quantity", bankCY, 0, bankCY, "BCY", "In-place material"),
      qtyRow("Loose haul volume", `${bankCY} BCY`, "BCY x swell", looseCY, 0, looseCY, "LCY", `Swell ${input.swellFactor}`),
      qtyRow("Compacted fill equivalent", `${looseCY} LCY`, "LCY x shrink", compactedCY, 0, compactedCY, "CCY", `Shrink ${input.shrinkFactor}`),
      qtyRow("Truck loads", `${looseCY} LCY`, "LCY / CY per load", looseCY / input.truckCYPerLoad, 0, looseCY / input.truckCYPerLoad, "LOAD", `${input.truckCYPerLoad} LCY/load`)
    ];
  }
  if (calc.id === "pipe" || calc.id === "waterline") {
    const avgDepthFt = input.avgDepthFt || 6;
    const widthFt = input.trenchWidthFt;
    const excavationCY = input.quantity * widthFt * avgDepthFt / 27;
    const beddingCY = input.quantity * widthFt * input.beddingDepthIn / 12 / 27;
    const beddingTons = beddingCY * input.beddingDensityTonsPerCY;
    return [
      qtyRow("Trench excavation", `${input.quantity} LF`, "LF x width x depth / 27", excavationCY, 0, excavationCY, "BCY", `Width ${widthFt} FT, depth ${avgDepthFt} FT`),
      qtyRow("Pipe bedding", `${input.quantity} LF`, "LF x width x bedding depth / 12 / 27", beddingCY, input.wastePct, beddingCY * wasteFactor(input.wastePct), "CY", `${input.beddingDepthIn} in bedding`),
      qtyRow("Bedding stone", `${beddingCY} CY`, "CY x tons/CY", beddingTons, input.wastePct, beddingTons * wasteFactor(input.wastePct), "TON", `Density ${input.beddingDensityTonsPerCY} TON/CY`),
      qtyRow("Warning/tracer", `${input.quantity} LF`, "LF x required runs", input.quantity, 0, input.quantity, "LF", "Confirm warning tape/tracer wire requirements")
    ];
  }
  if (calc.id === "flatwork") {
    const cy = input.quantity * input.depthIn / 324;
    return [qtyRow("Concrete", `${input.quantity} SF @ ${input.depthIn} in`, "SF x inches / 324", cy, input.wastePct, cy * wasteFactor(input.wastePct), "CY", "Flatwork volume")];
  }
  if (calc.id === "curb") {
    const cy = input.quantity * input.sectionSF / 27;
    return [qtyRow("Curb/gutter concrete", `${input.quantity} LF`, "LF x section SF / 27", cy, input.wastePct, cy * wasteFactor(input.wastePct), "CY", `Section ${input.sectionSF} SF/LF`)];
  }
  if (calc.id === "piers") {
    const cy = Math.PI * Math.pow(input.diameterIn / 24, 2) * input.depthFt / 27 * input.quantity;
    return [qtyRow("Pier concrete", `${input.quantity} EA`, "pi x radius^2 x depth / 27 x count", cy, input.wastePct, cy * wasteFactor(input.wastePct), "CY", `${input.diameterIn} in diameter x ${input.depthFt} ft deep`)];
  }
  if (calc.id === "sealcoat") {
    const gal = input.quantity * input.coatCount * input.galPerSYPerCoat;
    const crackLb = input.crackLF * input.crackLbPerLF;
    return [
      qtyRow("Sealcoat", `${input.quantity} SY`, "SY x coats x gal/SY/coat", gal, input.wastePct, gal * wasteFactor(input.wastePct), "GAL", `${input.coatCount} coat(s)`),
      qtyRow("Crackfill", `${input.crackLF} LF`, "LF x lb/LF", crackLb, input.wastePct, crackLb * wasteFactor(input.wastePct), "LB", input.routeCracks === "Yes" ? "Routed cracks" : "Clean and fill")
    ];
  }
  if (calc.id === "milling") {
    const tons = input.quantity * input.depthIn * input.millingsTonsPerSYIn;
    return [
      qtyRow("Millings", `${input.quantity} SY @ ${input.depthIn} in`, "SY x depth x tons/SY/in", tons, 0, tons, "TON", "Haul-off separated"),
      qtyRow("Truck loads", `${tons} TON`, "tons / truck tons per load", tons / input.truckTonsPerLoad, 0, tons / input.truckTonsPerLoad, "LOAD", input.haulOff === "Yes" ? "Haul off included" : "Millings remain onsite")
    ];
  }
  return [qtyRow(calc.label, result.baseQty, result.formulaId, result.baseQty, 0, result.finalQty, result.outputUnit, "Direct quantity")];
}

function buildRfiFlags(calc) {
  const input = calc.defaults;
  const flags = [];
  if (calc.id === "earthwork" && input.geotechReport === "No") flags.push("No geotechnical report: confirm unsuitable soils, rock, groundwater, and proofroll repair.");
  if (["earthwork", "pipe", "waterline"].includes(calc.id) && input.rockRisk === "Unclear") flags.push("Rock excavation unclear: carry allowance or request unit price.");
  if (["earthwork", "pipe", "waterline"].includes(calc.id) && input.dewateringRisk === "Unclear") flags.push("Dewatering unclear: confirm groundwater and stormwater bypass assumptions.");
  if (calc.id === "asphalt" && input.pavementSection === "Unclear") flags.push("Pavement section unclear: confirm base, binder, surface depths, and mix requirements.");
  if (calc.id === "asphalt" && input.tackClarity === "Unclear") flags.push("Tack/prime requirements unclear: confirm surface condition and application rates.");
  if (["pipe", "waterline"].includes(calc.id) && input.trenchBackfillSpec === "Unclear") flags.push("Trench backfill not specified: confirm stone, select backfill, flowable fill, or native backfill.");
  if (["pipe", "waterline"].includes(calc.id) && Number(input.avgDepthFt || 0) > 5) flags.push("Trench safety required over 5 ft: include trench box, sloping, or shielding.");
  if (calc.id === "sealcoat" && input.stripingReplacement === "Yes") flags.push("Striping replacement required after sealcoat: include layout and restripe scope.");
  if (calc.id === "striping" && input.layout === "Missing") flags.push("Striping layout missing: confirm stall count, arrows, stop bars, ADA symbols, fire lane, and curb paint.");
  if (calc.id === "lighting" && input.wireSizeShown !== "Yes") flags.push("Electrical wire size not shown: verify conductor sizes, controls, grounding, and testing.");
  return flags;
}

function calculate(calc) {
  const input = calc.defaults;
  let baseQty = input.quantity;
  let finalQty = input.quantity;
  let outputUnit = calc.unit;
  let formulaId = "direct";
  let materialCost = 0;
  let crewCost = 0;
  let truckingCost = 0;
  const extras = [];

  if (calc.id === "asphalt") {
    const mix = asphaltMixes[input.mixType];
    formulaId = "asphalt_sy_depth_to_tons";
    baseQty = formulaRegistry[formulaId].run({ ...input, asphaltLbPerSYIn: mix.lbPerSYIn });
    finalQty = baseQty * (1 + input.wastePct / 100);
    outputUnit = "TON";
    materialCost = finalQty * asphaltPrice(input);
    truckingCost = finalQty * input.truckingCostPerTon;
    crewCost = crewCostPerDay(calc.crew) * (input.quantity / 850) / input.productionModifier;
    extras.push(["Mix", input.mixType, ""], ["Oil", input.oilType, ""], ["Historical avg", asphaltPrice(input), "per TON"], ["Tack", input.quantity * input.tackRateGalPerSY, "GAL"]);
  } else if (calc.id === "aggregate") {
    formulaId = "sy_depth_in_to_cy";
    const cy = formulaRegistry[formulaId].run(input);
    baseQty = cy * input.densityTonsPerCY;
    finalQty = baseQty * (1 + input.wastePct / 100);
    outputUnit = "TON";
    materialCost = finalQty * input.materialCostPerTon;
    truckingCost = finalQty * input.truckingCostPerTon;
    crewCost = crewCostPerDay(calc.crew) * (input.quantity / 1000);
  } else if (calc.id === "earthwork") {
    const bankCY = input.quantity;
    const looseCY = bankCY * input.swellFactor;
    const compactedCY = looseCY * input.shrinkFactor;
    baseQty = bankCY;
    finalQty = bankCY;
    outputUnit = "BCY";
    crewCost = bankCY * input.costPerBCY / input.productionModifier;
    extras.push(["Bank CY", bankCY, "BCY"], ["Loose CY", looseCY, "LCY"], ["Compacted CY", compactedCY, "CCY"], ["Truck loads", looseCY / input.truckCYPerLoad, "LOAD"]);
  } else if (calc.id === "pipe") {
    formulaId = "lf_width_depth_to_cy";
    const beddingCY = formulaRegistry[formulaId].run({ quantity: input.quantity, widthFt: input.trenchWidthFt, depthIn: input.beddingDepthIn });
    baseQty = beddingCY;
    finalQty = beddingCY * (1 + input.wastePct / 100);
    outputUnit = "CY bedding";
    materialCost = input.quantity * input.pipeMaterialCostLF + finalQty * input.beddingDensityTonsPerCY * 31.68;
    crewCost = input.quantity * input.crewCostPerLF;
    extras.push(["Pipe diameter", input.pipeDiameterIn, "IN"], ["Bedding stone", finalQty * input.beddingDensityTonsPerCY, "TON"]);
  } else if (calc.id === "flatwork") {
    formulaId = "sf_depth_in_to_cy";
    baseQty = formulaRegistry[formulaId].run(input);
    finalQty = baseQty * (1 + input.wastePct / 100);
    outputUnit = "CY";
    materialCost = finalQty * input.concreteCostCY;
    crewCost = input.quantity * input.finishCostSF;
  } else if (calc.id === "curb") {
    formulaId = "curb_cy";
    baseQty = formulaRegistry[formulaId].run(input);
    finalQty = baseQty * (1 + input.wastePct / 100);
    outputUnit = "CY";
    materialCost = finalQty * input.concreteCostCY;
    crewCost = crewCostPerDay(calc.crew) * (input.quantity / input.productionLFPerDay);
  } else if (calc.id === "piers") {
    formulaId = "circular_pier_cy";
    baseQty = formulaRegistry[formulaId].run({ ...input, count: input.quantity });
    finalQty = baseQty * (1 + input.wastePct / 100);
    outputUnit = "CY";
    materialCost = finalQty * input.concreteCostCY;
    crewCost = crewCostPerDay(calc.crew);
  } else if (calc.id === "lighting") {
    baseQty = input.quantity;
    finalQty = input.quantity;
    outputUnit = "EA";
    materialCost = input.quantity * (input.poleBaseEach + input.fixtureEach) + input.conduitLF * input.conduitCostLF;
  } else if (calc.id === "demo") {
    formulaId = "sf_depth_in_to_cy";
    const cy = formulaRegistry[formulaId].run({ quantity: input.quantity * 9, depthIn: input.depthIn });
    baseQty = cy * input.debrisTonsPerCY;
    finalQty = baseQty;
    outputUnit = "TON debris";
    truckingCost = finalQty * input.haulCostTon;
    materialCost = finalQty * input.disposalCostTon;
  } else if (calc.id === "erosion") {
    finalQty = input.quantity * (1 + input.wastePct / 100);
    materialCost = finalQty * input.materialCostLF;
    crewCost = input.quantity * input.installCostLF;
  } else if (calc.id === "striping") {
    finalQty = input.quantity * (1 + input.wastePct / 100);
    materialCost = finalQty * input.paintCostLF;
    crewCost = input.quantity * input.installCostLF;
  } else if (calc.id === "sealcoat") {
    formulaId = "sealcoat_sy_coats_to_gal";
    baseQty = input.quantity * input.coatCount * input.galPerSYPerCoat;
    finalQty = baseQty * (1 + input.wastePct / 100);
    outputUnit = "GAL sealer";
    const crackfillLb = input.crackLF * input.crackLbPerLF * (1 + input.wastePct / 100);
    materialCost = finalQty * input.sealcoatCostGal + crackfillLb * input.crackfillCostLb;
    crewCost = input.quantity * 0.18;
    extras.push(["Crackfill", crackfillLb, "LB"], ["Crack LF", input.crackLF, "LF"], ["Restripe flag", input.stripingReplacement, ""]);
  } else if (calc.id === "milling") {
    formulaId = "milling_sy_depth_to_tons";
    baseQty = input.quantity * input.depthIn * input.millingsTonsPerSYIn;
    finalQty = baseQty;
    outputUnit = "TON millings";
    materialCost = input.quantity * input.millingCostSY + input.quantity * input.sweepCostSY;
    truckingCost = input.haulOff === "Yes" ? finalQty * input.haulCostTon : 0;
    extras.push(["Milling area", input.quantity, "SY"], ["Depth", input.depthIn, "IN"], ["Truck loads", finalQty / input.truckTonsPerLoad, "LOAD"]);
  } else if (calc.id === "waterline") {
    formulaId = "waterline_trench_assembly";
    const excavationCY = input.quantity * input.trenchWidthFt * input.avgDepthFt / 27;
    const beddingCY = formulaRegistry.lf_width_depth_to_cy.run({ quantity: input.quantity, widthFt: input.trenchWidthFt, depthIn: input.beddingDepthIn });
    const beddingTons = beddingCY * input.beddingDensityTonsPerCY * (1 + input.wastePct / 100);
    baseQty = excavationCY;
    finalQty = excavationCY;
    outputUnit = "BCY trench";
    materialCost = input.quantity * input.pipeMaterialCostLF + beddingTons * 31.68 + input.testingAllowance;
    crewCost = input.quantity * 28;
    extras.push(["Bedding", beddingCY, "CY"], ["Bedding stone", beddingTons, "TON"], ["Warning tape", input.warningTapeLF, "LF"], ["Tracer wire", input.tracerWireLF, "LF"], ["Trench safety", input.avgDepthFt > 5 ? "Required" : "Review", ""]);
  } else if (calc.id === "structures") {
    formulaId = "drainage_structure_assembly";
    baseQty = input.quantity;
    finalQty = input.quantity;
    outputUnit = "EA";
    materialCost = input.quantity * input.structureCostEach + input.quantity * input.stoneCYEach * 1.45 * 31.68 + input.testingAllowance;
    crewCost = input.quantity * input.excavationCYEach * 42 + (input.connectExistingCount + input.coreExistingCount) * 450;
    extras.push(["Excavation", input.quantity * input.excavationCYEach, "BCY"], ["Stone", input.quantity * input.stoneCYEach, "CY"], ["Core existing", input.coreExistingCount, "EA"], ["Connect existing", input.connectExistingCount, "EA"]);
  } else if (calc.id === "trucking") {
    baseQty = input.quantity / input.truckTonsPerLoad;
    finalQty = baseQty;
    outputUnit = "LOAD";
    truckingCost = Math.max(finalQty * (input.haulRatePerLoad + input.dumpFeePerLoad), input.minimumCharge);
    extras.push(["Round trip", input.roundTripMinutes, "MIN"], ["Haul distance", input.haulDistanceMiles, "MI"], ["Tons per load", input.truckTonsPerLoad, "TON"], ["Loose CY/load", input.looseCYPerLoad, "LCY"]);
  }

  const cost = materialCost + crewCost + truckingCost;
  return {
    formulaId,
    outputUnit,
    baseQty,
    finalQty,
    materialCost,
    crewCost,
    truckingCost,
    cost,
    price: cost * 1.18,
    breakdown: buildQuantityBreakdown(calc, { formulaId, outputUnit, baseQty, finalQty, materialCost, crewCost, truckingCost, extras }),
    rfiFlags: buildRfiFlags(calc),
    extras
  };
}

function render() {
  document.getElementById("viewTitle").textContent = viewMeta[state.view].title;
  renderNav();
  renderConcepts();
  const renderers = { estimate: renderEstimate, field: renderField, resources: renderResources, assemblies: renderAssemblies, review: renderReview };
  document.getElementById("appContent").innerHTML = renderers[state.view]();
  bindDynamicEvents();
}

function renderPreserveScroll() {
  const windowY = window.scrollY;
  const scrollTarget = document.querySelector(".crew-editor") || document.querySelector(".crew-list") || document.querySelector(".assembly-list");
  const targetScroll = scrollTarget ? scrollTarget.scrollTop : 0;
  render();
  requestAnimationFrame(() => {
    window.scrollTo(0, windowY);
    const newTarget = document.querySelector(".crew-editor") || document.querySelector(".crew-list") || document.querySelector(".assembly-list");
    if (newTarget) newTarget.scrollTop = targetScroll;
  });
}

function renderNav() {
  document.getElementById("viewNav").innerHTML = Object.entries(viewMeta).map(([id, meta]) => `
    <button class="nav-btn ${state.view === id ? "active" : ""}" data-view="${id}" type="button">
      <span>${meta.icon}</span><span>${meta.title}</span>
    </button>
  `).join("");
}

function renderConcepts() {
  const labels = { estimate: "1 Estimate", field: "2 Field", resources: "3 Resources", assemblies: "4 Assemblies", review: "5 Review" };
  document.querySelector(".concept-strip").innerHTML = Object.entries(labels).map(([id, label]) => `
    <button class="concept ${state.view === id ? "active" : ""}" data-view="${id}" type="button">${label}</button>
  `).join("");
}

function renderEstimate() {
  const calc = activeCalc();
  const result = calculate(calc);
  return `
    <section class="panel wide-panel">
      <div class="panel-header">
        <h2>Pay Item Detail</h2>
        <div class="toolbar">
          <button class="primary add-line" type="button">Add calculator as pay item</button>
          <button type="button">Import pay items</button>
          <button class="export-csv-btn" type="button">Export bid CSV</button>
        </div>
      </div>
      <div class="panel-body">
        ${renderProjectBar()}
        <div style="height:14px"></div>
        <div class="estimate-layout">
          <aside class="resource-tree">
            <h3>Pay Items</h3>
            ${state.estimate.map((line) => `<button class="tree-button" type="button"><strong>${line.item} - ${line.name}</strong><span>${line.workType}</span></button>`).join("")}
            <h3>Indirect Items</h3>
            <button class="tree-button" type="button"><strong>Bond</strong><span>Indirect</span></button>
            <button class="tree-button" type="button"><strong>Travel</strong><span>Indirect</span></button>
          </aside>
          <div>
            <div class="detail-header">
              <label><span>Calculator / task template</span><select id="calcSelect">${calculatorDefs.map((item) => `<option value="${item.id}" ${item.id === calc.id ? "selected" : ""}>${item.label}</option>`).join("")}</select></label>
              <label><span>Crew template</span><input readonly value="${calc.crew}"></label>
              <label><span>Work type</span><input readonly value="${calc.category}"></label>
            </div>
            <div style="height:12px"></div>
            <div class="two-col estimator-workbench">
              <div class="panel flat-card input-panel">
                <div class="panel-header compact-header"><h2>Takeoff Inputs</h2><span class="pill">${calc.unit}</span></div>
                <div class="panel-body">${renderCalcInputs(calc)}</div>
              </div>
              <div class="panel flat-card output-panel">
                <div class="panel-header compact-header"><h2>Calculated Quantities</h2><span class="pill">${result.formulaId}</span></div>
                <div class="panel-body">${renderResults(result)}</div>
              </div>
            </div>
            <div style="height:14px"></div>
            ${renderEstimateTable()}
          </div>
        </div>
      </div>
    </section>
  `;
}

function renderProjectBar() {
  return `
    <div class="project-bar">
      <label><span>Project</span><input class="project-input" data-key="name" value="${state.project.name}"></label>
      <label><span>Phase / Area</span><input class="project-input" data-key="phase" value="${state.project.phase}"></label>
      <label><span>Alternate</span><input class="project-input" data-key="alternate" value="${state.project.alternate}"></label>
      <label><span>Estimator</span><input class="project-input" data-key="estimator" value="${state.project.estimator}"></label>
    </div>
  `;
}

function renderField() {
  const calc = activeCalc();
  const result = calculate(calc);
  return `
    <section class="panel">
      <div class="mobile-frame">
        <div class="mobile-top">
          <h2>${calc.label}</h2>
          <span class="small-note">${calc.crew}</span>
        </div>
        <div class="panel">
          <div class="panel-body">
            <label><span>Calculator</span><select id="calcSelect">${calculatorDefs.map((item) => `<option value="${item.id}" ${item.id === calc.id ? "selected" : ""}>${item.label}</option>`).join("")}</select></label>
            <div style="height:12px"></div>
            <div class="input-panel">${renderCalcInputs(calc)}</div>
            <div style="height:12px"></div>
            ${renderResults(result)}
            <div style="height:12px"></div>
            <button class="primary add-line" type="button">Add to estimate</button>
          </div>
        </div>
      </div>
    </section>
    <aside class="panel">
      <div class="panel-header"><h2>Task Templates</h2><span class="pill">${calculatorDefs.length}</span></div>
      <div class="panel-body"><div class="calculator-list">${renderCalculatorButtons()}</div></div>
    </aside>
  `;
}

function renderResources() {
  const tabs = ["crews", "labor", "equipment", "materials", "overhead", "factors", "formulas"];
  return `
    <section class="panel wide-panel">
      <div class="panel-header">
        <h2>Resources</h2>
        <div class="toolbar">
          <div class="segmented">${tabs.map((tab) => `<button class="${state.resourceTab === tab ? "active" : ""}" data-resource-tab="${tab}" type="button">${tab}</button>`).join("")}</div>
          ${state.resourceTab === "crews" ? `<button class="primary new-crew-btn" type="button">New crew</button>` : ""}
        </div>
      </div>
      <div class="panel-body">${renderResourceTab()}</div>
    </section>
  `;
}

function renderResourceTab() {
  if (state.resourceTab === "crews") {
    const editingCrew = crewTemplates.find((crew) => crew.name === state.editingCrew);
    if (editingCrew) return renderCrewEditor(editingCrew);
    return `<div class="crew-list">${crewTemplates.map((crew) => `
      <div class="panel flat-card"><div class="panel-body">
        <div class="assembly-row">
          <div>
            <h3>${crew.name}</h3>
            <p class="small-note">${crew.workType} - ${crew.members.length} resources selected</p>
          </div>
          <span class="pill">${money(crewCostPerDay(crew.name))}/DY</span>
        </div>
        <div class="metric-row compact-metrics">
          <div class="metric"><span>Production</span><strong>${crew.production}</strong></div>
          <div class="metric"><span>Work type</span><strong>${crew.workType}</strong></div>
          <div class="metric"><span>Resources</span><strong>${crew.members.length}</strong></div>
          <div class="metric"><span>Day rate</span><strong>${money(crewCostPerDay(crew.name))}</strong></div>
        </div>
        <div class="crew-list-actions">
          <button class="primary edit-crew-btn" data-crew="${crew.name}" type="button">Edit crew</button>
          <div class="chips">${crew.members.map((member) => `<span class="chip">${member}</span>`).join("") || `<span class="chip">No resources selected</span>`}</div>
        </div>
      </div></div>
    `).join("")}</div>`;
  }
  if (state.resourceTab === "labor" || state.resourceTab === "equipment" || state.resourceTab === "materials") {
    return renderSimpleResourceTable(resources[state.resourceTab]);
  }
  if (state.resourceTab === "overhead") {
    return renderOverheadTab();
  }
  if (state.resourceTab === "factors") {
    return renderFactorDatabase();
  }
  return `<div class="factor-list">${Object.entries(formulaRegistry).map(([id, formula]) => `
    <div class="panel formula-card"><div class="panel-body"><h3>${id}</h3><p class="small-note">${formula.label}</p><code>${formula.expression}</code></div></div>
  `).join("")}</div>`;
}

function renderCrewEditor(crew) {
  return `
    <div class="crew-editor">
      <div class="panel flat-card">
        <div class="panel-body">
          <div class="assembly-row">
            <div>
              <h3>Edit Crew</h3>
              <p class="small-note">Select resources by group. Crew day rate updates from selected labor and equipment.</p>
            </div>
            <div class="toolbar">
              <span class="pill">${money(crewCostPerDay(crew.name))}/DY</span>
              <button class="done-edit-crew-btn" type="button">Done</button>
            </div>
          </div>
          <div class="crew-edit-grid">
            <label><span>Crew name</span><input class="crew-field-input" data-crew="${crew.name}" data-key="name" value="${crew.name}"></label>
            <label><span>Work type</span><input class="crew-field-input" data-crew="${crew.name}" data-key="workType" value="${crew.workType}"></label>
            <label><span>Production</span><input class="crew-field-input" data-crew="${crew.name}" data-key="production" value="${crew.production}"></label>
          </div>
        </div>
      </div>
      ${renderCrewResourceGroup(crew, "Labor", resources.labor)}
      ${renderCrewResourceGroup(crew, "Equipment", resources.equipment)}
    </div>
  `;
}

function renderCrewResourceGroup(crew, title, rows) {
  const resourceType = title.toLowerCase();
  return `
    <div class="panel flat-card">
      <div class="panel-header"><h2>${title}</h2><span class="pill">${rows.filter((row) => crew.members.includes(row.name)).length} selected</span></div>
      <div class="panel-body">
        <div class="table-wrap crew-resource-wrap">
          <table class="crew-resource-table">
            <thead><tr><th>Use</th><th>Resource</th><th>Category</th><th>Unit</th><th>Rate</th><th>Qty</th><th>Day cost</th></tr></thead>
            <tbody>${rows.map((resource) => `
              <tr class="${crew.members.includes(resource.name) ? "selected-row" : ""}">
                <td><input class="crew-member-toggle" data-crew="${crew.name}" data-member="${resource.name}" type="checkbox" ${crew.members.includes(resource.name) ? "checked" : ""}></td>
                <td>${resource.name}</td>
                <td>${resource.category}</td>
                <td><input class="resource-name-field-input table-input" data-resource-type="${resourceType}" data-resource="${resource.name}" data-key="unit" value="${resource.unit}"></td>
                <td><input class="resource-rate-input table-input" data-resource-type="${resourceType}" data-resource="${resource.name}" type="number" step=".01" value="${resource.cost}"></td>
                <td class="qty-cell"><span>x</span><input class="crew-qty-input table-input qty-input" data-crew="${crew.name}" data-member="${resource.name}" type="number" min="0" step=".25" value="${crewMemberQty(crew, resource.name)}"></td>
                <td class="money-cell">${money(resourceDayCost(resource) * crewMemberQty(crew, resource.name))}</td>
              </tr>
            `).join("")}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderSimpleResourceTable(rows) {
  const singular = state.resourceTab === "labor" ? "labor" : state.resourceTab === "equipment" ? "equipment" : "material";
  const selectedIndex = selectedResourceIndex(state.resourceTab);
  const canEdit = selectedIndex !== null && rows[selectedIndex];
  return `
    <div class="toolbar resource-toolbar">
      <button class="primary add-resource-btn" data-resource-type="${state.resourceTab}" type="button">Add ${singular}</button>
      <button class="edit-resource-btn" data-resource-type="${state.resourceTab}" type="button" ${canEdit ? "" : "disabled"}>Edit selected</button>
      <span class="small-note">${canEdit ? `Selected: ${rows[selectedIndex].name}` : "Select an entry to edit it."}</span>
    </div>
    <div class="table-wrap resource-table-wrap"><table class="resource-table">
      <thead><tr><th>Select</th><th>Name</th><th>Category</th><th>Unit</th><th>Unit cost</th></tr></thead>
      <tbody>${rows.map((row, index) => `<tr class="selectable-row ${selectedIndex === index ? "selected-row" : ""}" data-resource-type="${state.resourceTab}" data-resource-index="${index}">
        <td><label class="select-radio"><input class="row-select-radio" name="${state.resourceTab}-resource-select" data-resource-type="${state.resourceTab}" data-resource-index="${index}" type="radio" ${selectedIndex === index ? "checked" : ""}><span>Use</span></label></td>
        <td><button class="row-select-btn" data-resource-type="${state.resourceTab}" data-resource-index="${index}" type="button">${row.name}</button></td>
        <td>${row.category}</td>
        <td>${row.unit}</td>
        <td class="money-cell">${money(row.cost)}</td>
      </tr>`).join("")}</tbody>
    </table></div>
    ${state.editingResource && canEdit ? renderResourceEditor(state.resourceTab, selectedIndex) : ""}`;
}

function renderResourceEditor(type, index) {
  const row = resources[type][index];
  if (!row) return "";
  return `
    <div class="panel flat-card edit-panel">
      <div class="panel-header">
        <h2>Edit ${type === "labor" ? "Labor" : type === "equipment" ? "Equipment" : "Material"}</h2>
        <button class="done-resource-edit-btn" type="button">Done</button>
      </div>
      <div class="panel-body">
        <div class="form-grid">
          <label><span>Name</span><input class="resource-edit-input" data-resource-type="${type}" data-resource-index="${index}" data-key="name" value="${row.name}"></label>
          <label><span>Category</span><input class="resource-edit-input" data-resource-type="${type}" data-resource-index="${index}" data-key="category" value="${row.category}"></label>
          <label><span>Unit</span><input class="resource-edit-input" data-resource-type="${type}" data-resource-index="${index}" data-key="unit" value="${row.unit}"></label>
          <label><span>Unit cost</span><input class="resource-edit-input" data-resource-type="${type}" data-resource-index="${index}" data-key="cost" type="number" step=".01" value="${row.cost}"></label>
        </div>
      </div>
    </div>
  `;
}

function renderOverheadTab() {
  const selectedIndex = Number.isInteger(state.selectedOverheadIndex) ? state.selectedOverheadIndex : null;
  const canEdit = selectedIndex !== null && overheadCosts[selectedIndex];
  return `
    <div class="metric-row">
      <div class="metric"><span>Annual overhead</span><strong>${money(overheadAnnualTotal())}</strong></div>
      <div class="metric"><span>Annual direct cost base</span><strong>${money(state.overheadAnnualDirectCost)}</strong></div>
      <div class="metric"><span>Overhead recovery</span><strong>${num(overheadPercent(), 2)}%</strong></div>
      <div class="metric"><span>Current estimate overhead</span><strong>${money(totalCost() * overheadPercent() / 100)}</strong></div>
    </div>
    <div style="height:14px"></div>
    <div class="form-grid">
      <label><span>Annual direct cost base</span><input id="annualDirectCostInput" type="number" step="1000" value="${state.overheadAnnualDirectCost}"></label>
    </div>
    <div style="height:14px"></div>
    <div class="toolbar resource-toolbar">
      <button class="primary add-overhead-btn" type="button">Add overhead item</button>
      <button class="edit-overhead-btn" type="button" ${canEdit ? "" : "disabled"}>Edit selected</button>
      <span class="small-note">${canEdit ? `Selected: ${overheadCosts[selectedIndex].name}` : "Select an overhead item to edit it."}</span>
    </div>
    <div class="table-wrap resource-table-wrap">
      <table class="resource-table">
        <thead><tr><th>Select</th><th>Overhead item</th><th>Category</th><th>Basis / unit</th><th>Annual amount</th></tr></thead>
        <tbody>${overheadCosts.map((item, index) => `
          <tr class="selectable-row ${selectedIndex === index ? "selected-row" : ""}" data-overhead-index="${index}">
            <td><label class="select-radio"><input class="overhead-select-radio" name="overhead-select" data-overhead-index="${index}" type="radio" ${selectedIndex === index ? "checked" : ""}><span>Use</span></label></td>
            <td><button class="overhead-select-btn" data-overhead-index="${index}" type="button">${item.name}</button></td>
            <td>${item.category}</td>
            <td>${item.basis}</td>
            <td class="money-cell">${money(item.amount)}</td>
          </tr>
        `).join("")}</tbody>
      </table>
    </div>
    ${state.editingOverhead && canEdit ? renderOverheadEditor(selectedIndex) : ""}
  `;
}

function renderOverheadEditor(index) {
  const item = overheadCosts[index];
  if (!item) return "";
  return `
    <div class="panel flat-card edit-panel">
      <div class="panel-header">
        <h2>Edit Overhead Item</h2>
        <button class="done-overhead-edit-btn" type="button">Done</button>
      </div>
      <div class="panel-body">
        <div class="form-grid">
          <label><span>Item name</span><input class="overhead-edit-input" data-overhead-index="${index}" data-key="name" value="${item.name}"></label>
          <label><span>Category</span><input class="overhead-edit-input" data-overhead-index="${index}" data-key="category" value="${item.category}"></label>
          <label><span>Basis / unit</span><input class="overhead-edit-input" data-overhead-index="${index}" data-key="basis" value="${item.basis}"></label>
          <label><span>Annual amount</span><input class="overhead-edit-input" data-overhead-index="${index}" data-key="amount" type="number" step="100" value="${item.amount}"></label>
        </div>
      </div>
    </div>
  `;
}

function renderFactorDatabase() {
  const categories = ["All", ...new Set(state.factors.map((factor) => factor.category))].sort();
  const filtered = state.factors.filter((factor) => {
    const inCategory = state.category === "All" || factor.category === state.category;
    const search = `${factor.id} ${factor.description} ${factor.tags.join(" ")}`.toLowerCase();
    return inCategory && search.includes(state.search.toLowerCase());
  }).slice(0, 120);
  return `
    <div class="form-grid">
      <label><span>Category</span><select id="categoryFilter">${categories.map((cat) => `<option ${cat === state.category ? "selected" : ""}>${cat}</option>`).join("")}</select></label>
      <label><span>Search</span><input id="factorSearch" value="${state.search}" placeholder="asphalt, pipe, bank-cy"></label>
      <label><span>Factor count</span><input readonly value="${filtered.length} shown / ${state.factors.length} total"></label>
    </div>
    <div style="height:14px"></div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ID</th><th>Description</th><th>Category</th><th>Units</th><th>Factor</th><th>Formula</th><th>Waste</th></tr></thead>
        <tbody>${filtered.map((factor) => `<tr>
          <td>${factor.id}</td><td>${factor.description}</td><td>${factor.category}</td>
          <td>${factor.inputUnit} to ${factor.outputUnit}</td><td>${factor.factor}</td><td>${factor.formulaId || "direct factor"}</td><td>${factor.defaultWastePct ?? ""}</td>
        </tr>`).join("")}</tbody>
      </table>
    </div>`;
}

function renderAssemblies() {
  return `
    <section class="panel">
      <div class="panel-header"><h2>Crew Assemblies</h2><button class="primary new-crew-btn" type="button">New crew assembly</button></div>
      <div class="panel-body">
        <div class="assembly-list">${crewTemplates.map((crew) => `
          <div class="panel flat-card"><div class="panel-body">
            <div class="assembly-row"><div><h3>${crew.name}</h3><p class="small-note">${crew.workType} - ${crew.production}</p></div><span class="pill">${money(crewCostPerDay(crew.name))}/day</span></div>
            <div class="table-wrap"><table><thead><tr><th>Resource</th><th>Type</th><th>Unit cost</th></tr></thead>
            <tbody>${crew.members.map((member) => {
              const item = resourceByName(member) || { category: "Other", unit: "", cost: 0, resourceType: "Other" };
              return `<tr><td>${member}</td><td>${item.resourceType} - ${item.category}</td><td>${money(item.cost)} / ${item.unit}</td></tr>`;
            }).join("")}</tbody></table></div>
          </div></div>
        `).join("")}</div>
      </div>
    </section>
    <aside class="panel">
      <div class="panel-header"><h2>Pay Item Assemblies</h2></div>
      <div class="panel-body">
        ${state.estimate.map((line) => `<div class="result"><span>${line.item} - ${line.name}</span><strong>${line.crew}</strong><p class="small-note">${line.material} - ${money(line.price)}</p></div>`).join("")}
      </div>
    </aside>
  `;
}

function renderReview() {
  const categoryTotals = {};
  state.estimate.forEach((line) => {
    categoryTotals[line.workType] = (categoryTotals[line.workType] || 0) + line.cost;
  });
  const overhead = totalCost() * overheadPercent() / 100;
  const targetProfit = (totalCost() + overhead) * .1;
  const recommendedBid = totalCost() + overhead + targetProfit;
  const activeTest = testProjects[state.selectedTestProject] || testProjects[0];
  return `
    <section class="panel">
      <div class="panel-header"><h2>Bid Review</h2><div class="toolbar"><button type="button">Audit trail</button><button class="export-csv-btn" type="button">Export bid CSV</button></div></div>
      <div class="panel-body">
        <div class="metric-row">
          <div class="metric"><span>Direct cost</span><strong>${money(totalCost())}</strong></div>
          <div class="metric"><span>Overhead recovery</span><strong>${money(overhead)}</strong></div>
          <div class="metric"><span>Target profit</span><strong>${money(targetProfit)}</strong></div>
          <div class="metric"><span>Recommended bid</span><strong>${money(recommendedBid)}</strong></div>
        </div>
        <div style="height:16px"></div>
        ${renderEstimateTable()}
        <div style="height:16px"></div>
        ${renderTestProjectReview(activeTest)}
      </div>
    </section>
    <aside class="panel">
      <div class="panel-header"><h2>Cost Mix</h2></div>
      <div class="panel-body">
        ${Object.entries(categoryTotals).map(([category, total]) => `
          <div class="result"><span>${category}</span><strong>${money(total)}</strong></div>
        `).join("")}
        <div class="result"><span>Overhead rate</span><strong>${num(overheadPercent(), 2)}%</strong></div>
        <div class="result"><span>Current bid price</span><strong>${money(totalPrice())}</strong></div>
      </div>
    </aside>
  `;
}

function renderTestProjectReview(activeTest) {
  return `
    <div class="panel flat-card">
      <div class="panel-header">
        <h2>Estimator QC Test Case</h2>
        <label><span>Scenario</span><select id="testProjectSelect">${testProjects.map((test, index) => `<option value="${index}" ${index === state.selectedTestProject ? "selected" : ""}>${test.name}</option>`).join("")}</select></label>
      </div>
      <div class="panel-body">
        <div class="two-col">
          <div>
            <h3>Required modules</h3>
            <div class="chips">${activeTest.modules.map((module) => `<span class="chip">${calculatorDefs.find((calc) => calc.id === module)?.label || module}</span>`).join("")}</div>
          </div>
          <div>
            <h3>Checks</h3>
            ${activeTest.expectedChecks.map((check) => `<div class="rfi-item">${check}</div>`).join("")}
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderCalculatorButtons() {
  return calculatorDefs.map((calc) => {
    const count = state.factors.filter((factor) => factor.category === calc.category).length;
    return `<button class="calc-btn ${calc.id === state.selectedCalc ? "active" : ""}" data-calc="${calc.id}" type="button">
      <span><strong>${calc.label}</strong><span class="small-note">${calc.crew}</span></span><span class="pill">${count}</span>
    </button>`;
  }).join("");
}

function field(label, key, value, attrs = "") {
  return `<label><span>${label}</span><input class="calc-input" data-key="${key}" value="${value ?? ""}" ${attrs}></label>`;
}

function selectField(label, key, value, options) {
  return `<label><span>${label}</span><select class="calc-input" data-key="${key}">${options.map((option) => `<option value="${option}" ${option === value ? "selected" : ""}>${option}</option>`).join("")}</select></label>`;
}

function renderCalcInputs(calc) {
  const d = calc.defaults;
  const commonQty = field(`Quantity (${calc.unit})`, "quantity", d.quantity, 'type="number" step=".01"');
  const forms = {
    asphalt: [
      commonQty,
      field("Depth inches", "depthIn", d.depthIn, 'type="number" step=".25"'),
      selectField("Asphalt mix", "mixType", d.mixType, Object.keys(asphaltMixes)),
      selectField("Oil type", "oilType", d.oilType, Object.keys(oilAdjustments)),
      selectField("Surface condition", "surfaceCondition", d.surfaceCondition, surfaceConditions),
      selectField("Pavement section", "pavementSection", d.pavementSection, riskOptions),
      selectField("Tack/prime clarity", "tackClarity", d.tackClarity, riskOptions),
      field("Waste percent", "wastePct", d.wastePct, 'type="number" step=".5"'),
      field("Tack gal/SY", "tackRateGalPerSY", d.tackRateGalPerSY, 'type="number" step=".01"'),
      field("Trucking $/ton", "truckingCostPerTon", d.truckingCostPerTon, 'type="number" step=".01"'),
      field("Production modifier", "productionModifier", d.productionModifier, 'type="number" step=".05"')
    ],
    aggregate: [commonQty, selectField("Material", "materialType", d.materialType, ["Crusher Run / DGA", "#57 Stone", "Clean stone", "Screenings", "Sand", "Riprap"]), field("Depth inches", "depthIn", d.depthIn, 'type="number" step=".25"'), field("Density tons/CY", "densityTonsPerCY", d.densityTonsPerCY, 'type="number" step=".01"'), field("Waste percent", "wastePct", d.wastePct, 'type="number" step=".5"'), field("Material $/ton", "materialCostPerTon", d.materialCostPerTon, 'type="number" step=".01"'), field("Trucking $/ton", "truckingCostPerTon", d.truckingCostPerTon, 'type="number" step=".01"')],
    earthwork: [commonQty, selectField("Operation", "operation", d.operation, ["Stripping", "Cut/fill", "Export", "Import", "Undercut", "Rock excavation", "Fine grading"]), selectField("Geotech report", "geotechReport", d.geotechReport, yesNo), selectField("Rock risk", "rockRisk", d.rockRisk, riskOptions), selectField("Dewatering risk", "dewateringRisk", d.dewateringRisk, riskOptions), field("Swell factor BCY to LCY", "swellFactor", d.swellFactor, 'type="number" step=".01"'), field("Shrink factor LCY to CCY", "shrinkFactor", d.shrinkFactor, 'type="number" step=".01"'), field("Cost $/BCY", "costPerBCY", d.costPerBCY, 'type="number" step=".01"'), field("Truck CY/load", "truckCYPerLoad", d.truckCYPerLoad, 'type="number" step=".5"'), field("Production modifier", "productionModifier", d.productionModifier, 'type="number" step=".05"')],
    pipe: [commonQty, selectField("Pipe type", "pipeType", d.pipeType, pipeTypes), field("Pipe diameter inches", "pipeDiameterIn", d.pipeDiameterIn, 'type="number"'), field("Average trench depth ft", "avgDepthFt", d.avgDepthFt, 'type="number" step=".1"'), field("Trench width ft", "trenchWidthFt", d.trenchWidthFt, 'type="number" step=".1"'), field("Bedding depth inches", "beddingDepthIn", d.beddingDepthIn, 'type="number" step=".5"'), field("Bedding tons/CY", "beddingDensityTonsPerCY", d.beddingDensityTonsPerCY, 'type="number" step=".01"'), selectField("Backfill spec", "trenchBackfillSpec", d.trenchBackfillSpec, riskOptions), selectField("Rock risk", "rockRisk", d.rockRisk, riskOptions), selectField("Dewatering risk", "dewateringRisk", d.dewateringRisk, riskOptions), field("Pipe material $/LF", "pipeMaterialCostLF", d.pipeMaterialCostLF, 'type="number" step=".01"'), field("Crew $/LF", "crewCostPerLF", d.crewCostPerLF, 'type="number" step=".01"'), field("Waste percent", "wastePct", d.wastePct, 'type="number" step=".5"')],
    flatwork: [commonQty, field("Depth inches", "depthIn", d.depthIn, 'type="number" step=".25"'), field("Concrete $/CY", "concreteCostCY", d.concreteCostCY, 'type="number" step=".01"'), field("Waste percent", "wastePct", d.wastePct, 'type="number" step=".5"'), field("Finish cost $/SF", "finishCostSF", d.finishCostSF, 'type="number" step=".01"')],
    curb: [commonQty, field("Section SF/LF", "sectionSF", d.sectionSF, 'type="number" step=".01"'), field("Concrete $/CY", "concreteCostCY", d.concreteCostCY, 'type="number" step=".01"'), field("Waste percent", "wastePct", d.wastePct, 'type="number" step=".5"'), field("Production LF/day", "productionLFPerDay", d.productionLFPerDay, 'type="number"')],
    piers: [commonQty, field("Diameter inches", "diameterIn", d.diameterIn, 'type="number"'), field("Depth ft", "depthFt", d.depthFt, 'type="number" step=".5"'), field("Concrete $/CY", "concreteCostCY", d.concreteCostCY, 'type="number" step=".01"'), field("Waste percent", "wastePct", d.wastePct, 'type="number" step=".5"')],
    lighting: [commonQty, field("Pole base each", "poleBaseEach", d.poleBaseEach, 'type="number" step=".01"'), field("Fixture each", "fixtureEach", d.fixtureEach, 'type="number" step=".01"'), field("Conduit LF", "conduitLF", d.conduitLF, 'type="number"'), field("Conduit $/LF", "conduitCostLF", d.conduitCostLF, 'type="number" step=".01"'), selectField("Wire size shown", "wireSizeShown", d.wireSizeShown || "No", yesNo)],
    demo: [commonQty, field("Depth inches", "depthIn", d.depthIn, 'type="number" step=".5"'), field("Debris tons/CY", "debrisTonsPerCY", d.debrisTonsPerCY, 'type="number" step=".01"'), field("Disposal $/ton", "disposalCostTon", d.disposalCostTon, 'type="number" step=".01"'), field("Haul $/ton", "haulCostTon", d.haulCostTon, 'type="number" step=".01"')],
    erosion: [commonQty, field("Material $/LF", "materialCostLF", d.materialCostLF, 'type="number" step=".01"'), field("Install $/LF", "installCostLF", d.installCostLF, 'type="number" step=".01"'), field("Waste percent", "wastePct", d.wastePct, 'type="number" step=".5"')],
    striping: [commonQty, selectField("Layout", "layout", d.layout || "Missing", stripingLayouts), field("Paint $/LF", "paintCostLF", d.paintCostLF, 'type="number" step=".01"'), field("Install $/LF", "installCostLF", d.installCostLF, 'type="number" step=".01"'), field("Waste percent", "wastePct", d.wastePct, 'type="number" step=".5"')],
    sealcoat: [commonQty, field("Coat count", "coatCount", d.coatCount, 'type="number" step="1"'), field("Gal/SY/coat", "galPerSYPerCoat", d.galPerSYPerCoat, 'type="number" step=".01"'), field("Crack LF", "crackLF", d.crackLF, 'type="number"'), field("Crack lb/LF", "crackLbPerLF", d.crackLbPerLF, 'type="number" step=".01"'), selectField("Route cracks", "routeCracks", d.routeCracks, yesNo), selectField("Restripe after sealcoat", "stripingReplacement", d.stripingReplacement, yesNo), field("Waste percent", "wastePct", d.wastePct, 'type="number" step=".5"'), field("Sealer $/GAL", "sealcoatCostGal", d.sealcoatCostGal, 'type="number" step=".01"'), field("Crackfill $/LB", "crackfillCostLb", d.crackfillCostLb, 'type="number" step=".01"')],
    milling: [commonQty, field("Depth inches", "depthIn", d.depthIn, 'type="number" step=".25"'), field("Tons/SY/in", "millingsTonsPerSYIn", d.millingsTonsPerSYIn, 'type="number" step=".001"'), selectField("Haul off millings", "haulOff", d.haulOff, yesNo), field("Truck tons/load", "truckTonsPerLoad", d.truckTonsPerLoad, 'type="number" step=".5"'), field("Milling $/SY", "millingCostSY", d.millingCostSY, 'type="number" step=".01"'), field("Haul $/ton", "haulCostTon", d.haulCostTon, 'type="number" step=".01"'), field("Sweep $/SY", "sweepCostSY", d.sweepCostSY, 'type="number" step=".01"')],
    waterline: [commonQty, selectField("Pipe type", "pipeType", d.pipeType, pipeTypes), field("Pipe diameter inches", "pipeDiameterIn", d.pipeDiameterIn, 'type="number"'), field("Average trench depth ft", "avgDepthFt", d.avgDepthFt, 'type="number" step=".1"'), field("Trench width ft", "trenchWidthFt", d.trenchWidthFt, 'type="number" step=".1"'), field("Bedding depth inches", "beddingDepthIn", d.beddingDepthIn, 'type="number" step=".5"'), selectField("Backfill spec", "trenchBackfillSpec", d.trenchBackfillSpec, riskOptions), selectField("Rock risk", "rockRisk", d.rockRisk, riskOptions), selectField("Dewatering risk", "dewateringRisk", d.dewateringRisk, riskOptions), field("Warning tape LF", "warningTapeLF", d.warningTapeLF, 'type="number"'), field("Tracer wire LF", "tracerWireLF", d.tracerWireLF, 'type="number"'), field("Testing allowance", "testingAllowance", d.testingAllowance, 'type="number" step=".01"')],
    structures: [commonQty, selectField("Structure type", "structureType", d.structureType, ["Inlet", "Catch basin", "Manhole", "Headwall", "Endwall", "FES"]), field("Average depth ft", "avgDepthFt", d.avgDepthFt, 'type="number" step=".1"'), field("Structure $/EA", "structureCostEach", d.structureCostEach, 'type="number" step=".01"'), field("Excavation CY/EA", "excavationCYEach", d.excavationCYEach, 'type="number" step=".1"'), field("Stone CY/EA", "stoneCYEach", d.stoneCYEach, 'type="number" step=".1"'), field("Core existing EA", "coreExistingCount", d.coreExistingCount, 'type="number"'), field("Connect existing EA", "connectExistingCount", d.connectExistingCount, 'type="number"'), field("Testing allowance", "testingAllowance", d.testingAllowance, 'type="number" step=".01"')],
    trucking: [commonQty, field("Truck tons/load", "truckTonsPerLoad", d.truckTonsPerLoad, 'type="number" step=".5"'), field("Loose CY/load", "looseCYPerLoad", d.looseCYPerLoad, 'type="number" step=".5"'), field("Haul distance miles", "haulDistanceMiles", d.haulDistanceMiles, 'type="number" step=".1"'), field("Haul rate/load", "haulRatePerLoad", d.haulRatePerLoad, 'type="number" step=".01"'), field("Round trip minutes", "roundTripMinutes", d.roundTripMinutes, 'type="number"'), field("Dump fee/load", "dumpFeePerLoad", d.dumpFeePerLoad, 'type="number" step=".01"'), field("Minimum charge", "minimumCharge", d.minimumCharge, 'type="number" step=".01"')]
  };
  return `<div class="form-grid">${(forms[calc.id] || [commonQty]).join("")}</div>`;
}

function renderResults(result) {
  const extras = result.extras.map(([label, value, unit]) => `<div class="result"><span>${label}</span><strong>${typeof value === "number" ? num(value, 2) : value} ${unit}</strong></div>`).join("");
  return `<div class="results-grid">
    <div class="result"><span>Formula</span><strong>${result.formulaId}</strong></div>
    <div class="result"><span>Quantity</span><strong>${num(result.finalQty)} ${result.outputUnit}</strong></div>
    <div class="result"><span>Materials</span><strong>${money(result.materialCost)}</strong></div>
    <div class="result"><span>Crew</span><strong>${money(result.crewCost)}</strong></div>
    <div class="result"><span>Trucking</span><strong>${money(result.truckingCost)}</strong></div>
    <div class="result"><span>Bid price</span><strong>${money(result.price)}</strong></div>
    ${extras}
  </div>
  ${renderQuantityBreakdown(result)}
  ${renderRfiFlags(result)}`;
}

function renderQuantityBreakdown(result) {
  if (!result.breakdown || !result.breakdown.length) return "";
  return `
    <div class="breakdown-block">
      <h3>Quantity Breakdown</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Line</th><th>Input</th><th>Formula</th><th>Base calc</th><th>Waste/adj</th><th>Final bid qty</th><th>Unit</th><th>Notes</th></tr></thead>
          <tbody>${result.breakdown.map((row) => `
            <tr>
              <td>${row.label}</td>
              <td>${row.inputQty}</td>
              <td><code>${row.formula}</code></td>
              <td>${typeof row.baseQty === "number" ? num(row.baseQty, 2) : row.baseQty}</td>
              <td>${num(row.wastePct, 2)}%</td>
              <td>${typeof row.finalQty === "number" ? num(row.finalQty, 2) : row.finalQty}</td>
              <td>${row.unit}</td>
              <td>${row.notes}</td>
            </tr>
          `).join("")}</tbody>
        </table>
      </div>
    </div>
  `;
}

function renderRfiFlags(result) {
  if (!result.rfiFlags || !result.rfiFlags.length) return "";
  return `
    <div class="rfi-block">
      <h3>RFI / Risk Flags</h3>
      ${result.rfiFlags.map((flag) => `<div class="rfi-item">${flag}</div>`).join("")}
    </div>
  `;
}

function renderEstimateTable() {
  return `<div class="table-wrap"><table>
    <thead><tr><th>Item</th><th>Description</th><th>Work type</th><th>Crew</th><th>Material</th><th>Qty</th><th>UM</th><th>Total cost</th><th>Bid price</th><th>RFI</th></tr></thead>
    <tbody>${state.estimate.map((line) => `<tr><td>${line.item}</td><td>${line.name}</td><td>${line.workType}</td><td>${line.crew}</td><td>${line.material}</td><td>${num(line.qty)}</td><td>${line.unit}</td><td>${money(line.cost)}</td><td>${money(line.price)}</td><td>${line.rfiCount ? `<span class="pill">${line.rfiCount}</span>` : ""}</td></tr>`).join("")}</tbody>
  </table></div>`;
}

function totalCost() {
  return state.estimate.reduce((sum, line) => sum + line.cost, 0);
}

function totalPrice() {
  return state.estimate.reduce((sum, line) => sum + line.price, 0);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function exportEstimateCsv() {
  const headers = ["Project", "Phase", "Alternate", "Item", "Description", "Work Type", "Crew", "Material", "Quantity", "Unit", "Cost", "Price", "RFI Count", "Notes"];
  const rows = state.estimate.map((line) => [
    state.project.name,
    state.project.phase,
    state.project.alternate,
    line.item,
    line.name,
    line.workType,
    line.crew,
    line.material,
    num(line.qty, 2),
    line.unit,
    line.cost,
    line.price,
    line.rfiCount || 0,
    line.notes || ""
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${state.project.name.replace(/[^a-z0-9]+/gi, "_").replace(/^_|_$/g, "") || "estimate"}_bid_summary.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function bindDynamicEvents() {
  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state.view = button.dataset.view;
      render();
    });
  });
  document.querySelectorAll("[data-calc]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedCalc = button.dataset.calc;
      render();
    });
  });
  document.querySelectorAll("[data-resource-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      state.resourceTab = button.dataset.resourceTab;
      state.editingCrew = "";
      state.editingResource = false;
      state.editingOverhead = false;
      render();
    });
  });
  const calcSelect = document.getElementById("calcSelect");
  if (calcSelect) calcSelect.addEventListener("change", () => {
    state.selectedCalc = calcSelect.value;
    render();
  });
  const testProjectSelect = document.getElementById("testProjectSelect");
  if (testProjectSelect) testProjectSelect.addEventListener("change", () => {
    state.selectedTestProject = Number(testProjectSelect.value || 0);
    renderPreserveScroll();
  });
  document.querySelectorAll(".project-input").forEach((input) => {
    input.addEventListener("change", () => {
      state.project[input.dataset.key] = input.value;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".calc-input").forEach((input) => {
    input.addEventListener("change", () => {
      const calc = activeCalc();
      const raw = input.value;
      calc.defaults[input.dataset.key] = input.tagName === "SELECT" ? raw : Number(raw || 0);
      if (calc.id === "asphalt" && input.dataset.key === "mixType") {
        calc.defaults.oilType = asphaltMixes[raw].defaultOil;
      }
      render();
    });
  });
  document.querySelectorAll(".add-line").forEach((button) => {
    button.addEventListener("click", () => {
      const calc = activeCalc();
      const result = calculate(calc);
      const next = String(state.estimate.length + 1).padStart(3, "0");
      state.estimate.push({
        item: next,
        name: calc.label,
        workType: calc.category,
        unit: result.outputUnit,
        qty: result.finalQty,
        crew: calc.crew,
        material: calc.id === "asphalt" ? `${calc.defaults.mixType} Asphalt` : calc.category,
        cost: result.cost,
        price: result.price,
        formulaId: result.formulaId,
        rfiCount: result.rfiFlags.length,
        notes: result.rfiFlags.join(" | ")
      });
      render();
    });
  });
  document.querySelectorAll(".export-csv-btn").forEach((button) => {
    button.addEventListener("click", exportEstimateCsv);
  });
  const categoryFilter = document.getElementById("categoryFilter");
  if (categoryFilter) categoryFilter.addEventListener("change", () => {
    state.category = categoryFilter.value;
    render();
  });
  const factorSearch = document.getElementById("factorSearch");
  if (factorSearch) factorSearch.addEventListener("input", () => {
    state.search = factorSearch.value;
    render();
  });
  document.querySelectorAll(".crew-member-toggle").forEach((input) => {
    input.addEventListener("change", () => {
      const crew = crewTemplates.find((item) => item.name === input.dataset.crew);
      if (!crew) return;
      crew.quantities = crew.quantities || {};
      if (input.checked && !crew.members.includes(input.dataset.member)) {
        crew.members.push(input.dataset.member);
        crew.quantities[input.dataset.member] = crew.quantities[input.dataset.member] || 1;
      }
      if (!input.checked) {
        crew.members = crew.members.filter((member) => member !== input.dataset.member);
      }
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".edit-crew-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.editingCrew = button.dataset.crew;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".done-edit-crew-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.editingCrew = "";
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".crew-field-input").forEach((input) => {
    input.addEventListener("change", () => {
      const crew = crewTemplates.find((item) => item.name === input.dataset.crew);
      if (!crew) return;
      const oldName = crew.name;
      crew[input.dataset.key] = input.value;
      if (input.dataset.key === "name") {
        calculatorDefs.forEach((calc) => {
          if (calc.crew === oldName) calc.crew = input.value;
        });
        state.estimate.forEach((line) => {
          if (line.crew === oldName) line.crew = input.value;
        });
        state.editingCrew = input.value;
      }
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".crew-qty-input").forEach((input) => {
    input.addEventListener("change", () => {
      const crew = crewTemplates.find((item) => item.name === input.dataset.crew);
      if (!crew) return;
      crew.quantities = crew.quantities || {};
      crew.quantities[input.dataset.member] = Number(input.value || 0);
      if (Number(input.value || 0) > 0 && !crew.members.includes(input.dataset.member)) {
        crew.members.push(input.dataset.member);
      }
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".new-crew-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const nextNumber = crewTemplates.length + 1;
      const crewName = `New Crew ${nextNumber}`;
      crewTemplates.push({ name: crewName, workType: "General", production: "0 UNIT/DY", members: [], quantities: {} });
      state.view = "resources";
      state.resourceTab = "crews";
      state.editingCrew = crewName;
      render();
    });
  });
  document.querySelectorAll(".resource-rate-input").forEach((input) => {
    input.addEventListener("change", () => {
      const resourceType = input.dataset.resourceType;
      const bucket = resourceType === "labor" ? resources.labor : resourceType === "equipment" ? resources.equipment : resources.materials;
      const resource = bucket.find((item) => item.name === input.dataset.resource);
      if (resource) resource.cost = Number(input.value || 0);
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".row-select-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedResources[button.dataset.resourceType] = Number(button.dataset.resourceIndex);
      state.editingResource = false;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".row-select-radio").forEach((input) => {
    input.addEventListener("change", () => {
      state.selectedResources[input.dataset.resourceType] = Number(input.dataset.resourceIndex);
      state.editingResource = false;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".selectable-row[data-resource-type]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("button") || event.target.closest("input")) return;
      state.selectedResources[row.dataset.resourceType] = Number(row.dataset.resourceIndex);
      state.editingResource = false;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".edit-resource-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedResources[button.dataset.resourceType] = selectedResourceIndex(button.dataset.resourceType);
      state.editingResource = true;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".done-resource-edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.editingResource = false;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".resource-edit-input").forEach((input) => {
    input.addEventListener("change", () => {
      const bucket = resources[input.dataset.resourceType];
      if (!bucket) return;
      const row = bucket[Number(input.dataset.resourceIndex)];
      if (!row) return;
      const oldName = row.name;
      row[input.dataset.key] = input.dataset.key === "cost" ? Number(input.value || 0) : input.value;
      if (input.dataset.key === "name") renameResourceReferences(oldName, row.name);
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".resource-field-input").forEach((input) => {
    input.addEventListener("change", () => {
      const bucket = resources[input.dataset.resourceType];
      if (!bucket) return;
      const row = bucket[Number(input.dataset.resourceIndex)];
      if (!row) return;
      const oldName = row.name;
      row[input.dataset.key] = input.dataset.key === "cost" ? Number(input.value || 0) : input.value;
      if (input.dataset.key === "name") renameResourceReferences(oldName, row.name);
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".resource-name-field-input").forEach((input) => {
    input.addEventListener("change", () => {
      const bucket = resources[input.dataset.resourceType];
      if (!bucket) return;
      const row = bucket.find((item) => item.name === input.dataset.resource);
      if (!row) return;
      row[input.dataset.key] = input.value;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".add-resource-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const type = button.dataset.resourceType;
      const bucket = resources[type];
      if (!bucket) return;
      const label = type === "labor" ? "Labor" : type === "equipment" ? "Equipment" : "Material";
      bucket.push({ name: `New ${label} ${bucket.length + 1}`, category: "General", unit: type === "materials" ? "EA" : "HR", cost: 0 });
      state.selectedResources[type] = bucket.length - 1;
      state.editingResource = true;
      renderPreserveScroll();
    });
  });
  const annualDirectCostInput = document.getElementById("annualDirectCostInput");
  if (annualDirectCostInput) annualDirectCostInput.addEventListener("change", () => {
    state.overheadAnnualDirectCost = Number(annualDirectCostInput.value || 0);
    renderPreserveScroll();
  });
  document.querySelectorAll(".overhead-select-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedOverheadIndex = Number(button.dataset.overheadIndex);
      state.editingOverhead = false;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".overhead-select-radio").forEach((input) => {
    input.addEventListener("change", () => {
      state.selectedOverheadIndex = Number(input.dataset.overheadIndex);
      state.editingOverhead = false;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".selectable-row[data-overhead-index]").forEach((row) => {
    row.addEventListener("click", (event) => {
      if (event.target.closest("button") || event.target.closest("input")) return;
      state.selectedOverheadIndex = Number(row.dataset.overheadIndex);
      state.editingOverhead = false;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".edit-overhead-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.editingOverhead = true;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".done-overhead-edit-btn").forEach((button) => {
    button.addEventListener("click", () => {
      state.editingOverhead = false;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".overhead-edit-input").forEach((input) => {
    input.addEventListener("change", () => {
      const item = overheadCosts[Number(input.dataset.overheadIndex)];
      if (!item) return;
      item[input.dataset.key] = input.dataset.key === "amount" ? Number(input.value || 0) : input.value;
      renderPreserveScroll();
    });
  });
  document.querySelectorAll(".add-overhead-btn").forEach((button) => {
    button.addEventListener("click", () => {
      overheadCosts.push({ name: `New overhead item ${overheadCosts.length + 1}`, category: "General overhead", basis: "Annual", amount: 0 });
      state.selectedOverheadIndex = overheadCosts.length - 1;
      state.editingOverhead = true;
      renderPreserveScroll();
    });
  });
}

document.getElementById("saveBtn").addEventListener("click", () => {
  localStorage.setItem("rowe-estimator-demo", JSON.stringify({
    estimate: state.estimate,
    calculatorDefs,
    resources,
    crewTemplates,
    overheadCosts,
    overheadAnnualDirectCost: state.overheadAnnualDirectCost,
    project: state.project,
    selectedTestProject: state.selectedTestProject
  }));
});

document.getElementById("resetBtn").addEventListener("click", () => {
  localStorage.removeItem("rowe-estimator-demo");
  location.reload();
});

loadFactors().then(() => {
  const saved = localStorage.getItem("rowe-estimator-demo");
  if (saved) {
    const parsed = JSON.parse(saved);
    state.estimate = parsed.estimate || state.estimate;
    state.overheadAnnualDirectCost = parsed.overheadAnnualDirectCost || state.overheadAnnualDirectCost;
    state.project = parsed.project || state.project;
    state.selectedTestProject = Number.isInteger(parsed.selectedTestProject) ? parsed.selectedTestProject : state.selectedTestProject;
    if (parsed.resources) {
      resources.labor = parsed.resources.labor || resources.labor;
      resources.equipment = parsed.resources.equipment || resources.equipment;
      resources.materials = parsed.resources.materials || resources.materials;
    }
    if (parsed.crewTemplates) {
      crewTemplates.splice(0, crewTemplates.length, ...parsed.crewTemplates);
    }
    if (parsed.overheadCosts) {
      overheadCosts.splice(0, overheadCosts.length, ...parsed.overheadCosts);
    }
  }
  render();
}).catch((error) => {
  document.getElementById("appContent").innerHTML = `<section class="panel"><div class="panel-body"><h2>Could not load CSV</h2><p>${error.message}</p></div></section>`;
});
