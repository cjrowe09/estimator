const factors = require("./rowe_estimating_factors_seed.json");
const app = require("./app.js");

app.state.factors = factors;
app.applySeedDefaults();

const tests = [];

function close(actual, expected, tolerance, label) {
  const pass = Math.abs(actual - expected) <= tolerance;
  tests.push({ label, pass, actual, expected });
}

function equal(actual, expected, label) {
  const pass = actual === expected;
  tests.push({ label, pass, actual, expected });
}

function ok(value, label) {
  tests.push({ label, pass: Boolean(value), actual: value, expected: true });
}

function calc(id, overrides = {}) {
  const source = app.calculatorDefs.find((item) => item.id === id);
  if (!source) throw new Error(`Missing calculator ${id}`);
  return {
    ...source,
    defaults: { ...source.defaults, ...overrides }
  };
}

function result(id, overrides = {}) {
  return app.calculate(calc(id, overrides));
}

close(result("asphalt", { quantity: 1200, depthIn: 3, asphaltLbPerSYIn: 110, wastePct: 0 }).finalQty, 198, 0.001, "Asphalt tons use app calculator");
close(result("asphalt", { quantity: 1000, depthIn: 2, asphaltCostPerTon: 123, wastePct: 0 }).materialCost, 13530, 0.001, "Asphalt material price override is used");
close(result("asphalt", { quantity: 1000, depthIn: 2, asphaltLbPerSYIn: 110, wastePct: 0, truckTonsPerLoad: 22 }).extras.find((row) => row[0] === "Truck loads")[1], 5, 0.001, "Asphalt truck loads use editable tons/load");

const aggregate = result("aggregate", { quantity: 1200, depthIn: 6, densityTonsPerCY: 1.55, wastePct: 7, truckTonsPerLoad: 23 });
close(aggregate.finalQty, 331.7, 0.1, "Aggregate final tons from app calculator");
close(aggregate.extras.find((row) => row[0] === "Truck loads")[1], 14.42, 0.01, "Aggregate truck loads use editable tons/load");

const pipe = result("pipe", { quantity: 430, pipeDiameterIn: 18, avgDepthFt: 6.5, trenchWidthFt: 3.5, beddingDepthIn: 6, wastePct: 7 });
equal(pipe.outputUnit, "LF", "Pipe estimate output unit remains LF");
close(pipe.finalQty, 430, 0.001, "Pipe estimate quantity remains entered LF");
ok(pipe.breakdown.some((row) => row.label === "Trench excavation" && row.unit === "BCY"), "Pipe includes trench excavation BCY");
ok(pipe.breakdown.some((row) => row.label === "Haunch stone"), "Pipe includes haunch quantity");
ok(pipe.breakdown.some((row) => row.label === "Initial backfill"), "Pipe includes initial backfill quantity");
ok(pipe.breakdown.some((row) => row.label === "Spoils haul-off" && row.unit === "LCY"), "Pipe includes loose spoil haul-off");
ok(pipe.breakdown.some((row) => row.label === "Haul-off loads" && row.unit === "LOAD"), "Pipe includes haul-off loads");

const waterline = result("waterline", { quantity: 600, pipeDiameterIn: 8, avgDepthFt: 5.5, trenchWidthFt: 2.67, beddingDepthIn: 6 });
equal(waterline.outputUnit, "LF", "Waterline estimate output unit remains LF");
close(waterline.finalQty, 600, 0.001, "Waterline estimate quantity remains entered LF");
ok(waterline.breakdown.some((row) => row.label === "Warning tape"), "Waterline includes warning tape quantity");
ok(waterline.breakdown.some((row) => row.label === "Tracer wire"), "Waterline includes tracer wire quantity");

const earthExport = result("earthwork", { operation: "Export", quantity: 850, swellFactor: 1.2, shrinkFactor: 0.85, truckCYPerLoad: 14 });
equal(earthExport.outputUnit, "BCY", "Export earthwork stays as BCY pay quantity");
close(earthExport.extras.find((row) => row[0] === "Loose CY")[1], 1020, 0.001, "Export earthwork loose CY uses swell");

const earthImport = result("earthwork", { operation: "Import", quantity: 850, swellFactor: 1.2, shrinkFactor: 0.85, truckCYPerLoad: 14 });
equal(earthImport.outputUnit, "CCY", "Import earthwork uses compacted CY pay quantity");
close(earthImport.extras.find((row) => row[0] === "Bank CY")[1], 1000, 0.001, "Import earthwork back-solves bank borrow from compacted CY");
close(earthImport.extras.find((row) => row[0] === "Loose CY")[1], 1200, 0.001, "Import earthwork calculates loose import truck volume");

equal(app.buildRfiFlags(calc("striping", { layout: "Missing" })).includes("Striping layout missing: confirm stall count, arrows, stop bars, ADA symbols, fire lane, and curb paint."), true, "Striping layout RFI fires");

["sealcoat_sy_coats_to_gal", "milling_sy_depth_to_tons", "waterline_trench_assembly", "drainage_structure_assembly"].forEach((formulaId) => {
  ok(app.formulaRegistry[formulaId], `Formula registry contains ${formulaId}`);
});

app.state.overheadAnnualDirectCost = 5000000;
app.state.targetProfitPct = 10;
const markup = app.markupPercent();
close(markup, 30.6, 0.01, "Markup combines overhead recovery and target profit");
close(app.priceWithMarkup(100), 130.6, 0.01, "Price uses configurable markup");

const truckingLoose = result("trucking", { haulBasis: "Loose CY", quantity: 140, looseCYPerLoad: 14, haulRatePerLoad: 125, truckingCostPerHour: 90, roundTripMinutes: 60, minimumCharge: 0 });
equal(truckingLoose.outputUnit, "LOAD", "Trucking output unit is loads");
close(truckingLoose.finalQty, 10, 0.001, "Trucking can calculate loads from loose CY");

close(app.defaultTrenchWidthFt(18), 3.5, 0.001, "Default trench width uses seed factor where available");

const failed = tests.filter((test) => !test.pass);
for (const test of tests) {
  console.log(`${test.pass ? "PASS" : "FAIL"} ${test.label}: actual=${test.actual} expected=${test.expected}`);
}

if (failed.length) {
  process.exitCode = 1;
}
