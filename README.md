# Rowe Civil Estimator

Civil construction estimating prototype built around configurable factors, formulas, crew assemblies, resources, overhead, takeoff calculators, quantity breakdowns, and RFI/risk flags.

## Run Locally

```powershell
npm start
```

Then open:

```text
http://127.0.0.1:5177/index.html
```

## Checks

```powershell
npm run check
npm test
```

## Current Scope

- Labor, equipment, material, overhead, crew, factor, and formula resource tabs
- Editable crew assemblies with selectable labor/equipment and resource quantity multipliers
- Civil calculators for asphalt, aggregate, earthwork, pipe trenching, concrete, curb/gutter, piers, electrical/site lighting, demolition, erosion control, striping, sealcoat/crackfill, milling, waterline, structures, and trucking
- Separate formula registry and estimating factor seed exports
- Quantity breakdowns showing inputs, formula, base quantity, waste/adjustment, final bid quantity, units, and notes
- RFI/risk flags for missing or unclear civil scope items
