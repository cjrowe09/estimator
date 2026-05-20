const tests = [];

function close(actual, expected, tolerance, label) {
  const pass = Math.abs(actual - expected) <= tolerance;
  tests.push({ label, pass, actual, expected });
}

function asphaltTons(sy, depthIn, lbPerSYIn = 110, wastePct = 0) {
  return sy * depthIn * lbPerSYIn / 2000 * (1 + wastePct / 100);
}

function concreteCY(sf, depthIn, wastePct = 0) {
  return sf * depthIn / 324 * (1 + wastePct / 100);
}

function aggregateTons(sy, depthIn, tonsPerCY, wastePct = 0) {
  const cy = sy * 9 * depthIn / 12 / 27;
  return cy * tonsPerCY * (1 + wastePct / 100);
}

function trenchCY(lf, widthFt, depthFt) {
  return lf * widthFt * depthFt / 27;
}

function beddingCY(lf, widthFt, beddingDepthIn) {
  return lf * widthFt * beddingDepthIn / 12 / 27;
}

function curbCY(lf, sectionSF, wastePct = 0) {
  return lf * sectionSF / 27 * (1 + wastePct / 100);
}

function pierCY(count, diameterIn, depthFt, wastePct = 0) {
  return Math.PI * Math.pow(diameterIn / 24, 2) * depthFt / 27 * count * (1 + wastePct / 100);
}

function sealcoatGal(sy, coats, galPerSYPerCoat, wastePct = 0) {
  return sy * coats * galPerSYPerCoat * (1 + wastePct / 100);
}

close(asphaltTons(1200, 3), 198, 0.001, "Simple asphalt parking lot tons");
close(asphaltTons(4200, 2, 110, 5), 485.1, 0.001, "Mill and overlay asphalt tons with waste");
close(aggregateTons(1200, 6, 1.55, 7), 331.7, 0.1, "New stone base tons");
close(concreteCY(4500, 5, 5), 72.917, 0.01, "Concrete sidewalk/flatwork CY");
close(curbCY(900, 1.18, 4), 40.907, 0.01, "Curb and gutter CY");
close(trenchCY(430, 3.5, 6.5), 362.315, 0.01, "Storm pipe trench excavation BCY");
close(beddingCY(430, 3.5, 6), 27.87, 0.01, "HDPE/RCP pipe bedding CY");
close(trenchCY(600, 2.67, 5.5), 326.333, 0.01, "Waterline trench excavation BCY");
close(sealcoatGal(5200, 2, 0.14, 8), 1572.48, 0.01, "Sealcoat gallons with waste");
close(pierCY(14, 24, 8, 5), 13.68, 0.01, "Concrete pier CY");

const failed = tests.filter((test) => !test.pass);
for (const test of tests) {
  console.log(`${test.pass ? "PASS" : "FAIL"} ${test.label}: actual=${test.actual} expected=${test.expected}`);
}

if (failed.length) {
  process.exitCode = 1;
}
