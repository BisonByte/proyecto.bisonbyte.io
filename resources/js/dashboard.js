const root = document.getElementById('dashboard-app');

if (root) {
    const parseDataset = (value, fallback = {}) => {
        if (!value) {
            return fallback;
        }

        try {
            return JSON.parse(value);
        } catch (error) {
            console.warn('No se pudo parsear el dataset del dashboard', error);
            return fallback;
        }
    };

    const endpoints = parseDataset(root.dataset.endpoints, {});
    let state = parseDataset(root.dataset.state, {});
    let metricsSeed = parseDataset(root.dataset.metrics, {});
    let telemetry = parseDataset(root.dataset.telemetry, {});
    let measurement = parseDataset(root.dataset.measurement, null);
    let deviceInfo = parseDataset(root.dataset.device, null);
    let eventSource = null;
    let telemetryTimer = null;
    let lastLoggedMeasurementId = null;

    const selectors = {
        statusBadge: root.querySelector('[data-pump-status]'),
        statusText: root.querySelector('[data-pump-status-text]'),
        statusDescription: root.querySelector('[data-pump-description]'),
        toggleButton: root.querySelector('[data-pump-toggle]'),
        toggleLabel: root.querySelector('[data-pump-toggle-label]'),
        lastChanged: root.querySelector('[data-last-changed]'),
        runtime: root.querySelectorAll('[data-runtime]'),
        runtimeMinutes: root.querySelector('[data-runtime-minutes]'),
        runtimeState: root.querySelector('[data-runtime-state]'),
        metricVoltage: root.querySelector('[data-metric-voltage]'),
        metricCurrent: root.querySelector('[data-metric-current]'),
        metricBattery: root.querySelector('[data-metric-battery]'),
        batteryBar: root.querySelector('[data-metric-battery-bar]'),
        activityLog: root.querySelector('[data-activity-log]'),
        fluidPanel: document.querySelector('[data-fluid-panel]'),
        fluidOpenButtons: root.querySelectorAll('[data-fluid-open]'),
        fluidCloseButtons: document.querySelectorAll('[data-fluid-close]'),
        calculatorPanel: document.querySelector('[data-calculator-panel]'),
        calculatorOpenButtons: root.querySelectorAll('[data-calculator-open]'),
        calculatorCloseButtons: document.querySelectorAll('[data-calculator-close]'),
        calculatorForm: document.querySelector('[data-calculator-form]'),
        calculatorTableToggle: document.querySelector('[data-calculator-table-toggle]'),
        calculatorTables: document.querySelector('[data-calculator-tables]'),
        deviceBadge: root.querySelector('[data-device-badge]'),
        fluidCardRegime: root.querySelector('[data-fluid-card="regime"]'),
        fluidCardRegimePrimary: root.querySelector('[data-fluid-card-regime-primary]'),
        fluidCardReynolds: root.querySelector('[data-fluid-card-reynolds]'),
        fluidCardPressure: root.querySelector('[data-fluid-card-pressure]'),
        fluidCardHead: root.querySelector('[data-fluid-card-head]'),
        fluidCardPower: root.querySelector('[data-fluid-card-power]'),
        fluidCardVelocity: root.querySelector('[data-fluid-card-velocity]'),
        fluidCardDensity: root.querySelector('[data-fluid-card-density]'),
        fluidCardViscosity: root.querySelector('[data-fluid-card-viscosity]'),
        designer: {
            panel: document.querySelector('[data-designer-panel]'),
            openButtons: root.querySelectorAll('[data-designer-open]'),
            closeButtons: document.querySelectorAll('[data-designer-close]'),
            svg: document.querySelector('[data-designer-svg]'),
            hint: document.querySelector('[data-designer-hint]'),
            hintOverlay: document.querySelector('[data-designer-hint-overlay]'),
            toolbarButtons: document.querySelectorAll('[data-designer-action]'),
            systemForm: document.querySelector('[data-designer-system-form]'),
            elementPanel: document.querySelector('[data-designer-element-panel]'),
            elementForm: document.querySelector('[data-designer-element-form]'),
            elementFields: document.querySelector('[data-designer-element-fields]'),
            elementEmpty: document.querySelector('[data-designer-selection-empty]'),
            resultsNodes: document.querySelector('[data-designer-results="nodes"]'),
            resultsSegments: document.querySelector('[data-designer-results="segments"]'),
            deleteButton: document.querySelector('[data-designer-action="delete-element"]'),
            visibilitySections: document.querySelectorAll('[data-designer-visibility]'),
            summary: {
                density: document.querySelector('[data-designer-summary="density"]'),
                gamma: document.querySelector('[data-designer-summary="gamma"]'),
                viscosity: document.querySelector('[data-designer-summary="viscosity"]'),
                surfaceHeight: document.querySelector('[data-designer-summary="surface-height"]'),
                surfacePressure: document.querySelector('[data-designer-summary="surface-pressure"]'),
                targetPressure: document.querySelector('[data-designer-summary="target-pressure"]'),
            },
            outputs: {
                fluidHeight: document.querySelector('[data-designer-output="fluid-height"]'),
                fluidNote: document.querySelector('[data-designer-output="fluid-note"]'),
                pumpHeight: document.querySelector('[data-designer-output="pump-height"]'),
                hydroPressure: document.querySelector('[data-designer-output="hydro-pressure"]'),
                tankCondition: document.querySelector('[data-designer-output="tank-condition"]'),
                suctionPressure: document.querySelector('[data-designer-output="suction-pressure"]'),
                pumpNote: document.querySelector('[data-designer-output="pump-note"]'),
            },
            formulas: {
                hydro: document.querySelector('[data-designer-formula="hydro"]'),
                pascal: document.querySelector('[data-designer-formula="pascal"]'),
                suction: document.querySelector('[data-designer-formula="suction"]'),
            },
            validation: {
                card: document.querySelector('[data-designer-validation]'),
                message: document.querySelector('[data-designer-validation-message]'),
                list: document.querySelector('[data-designer-validation-list]'),
            },
        },
    };

    const statusClasses = {
        on: selectors.statusBadge?.dataset.onClass?.split(' ') ?? [],
        off: selectors.statusBadge?.dataset.offClass?.split(' ') ?? [],
    };

    const toggleClasses = {
        on: selectors.toggleButton?.dataset.onClass?.split(' ') ?? [],
        off: selectors.toggleButton?.dataset.offClass?.split(' ') ?? [],
    };

    const DESCRIPTIONS = {
        on: 'La bomba está energizada y el sistema distribuye el caudal programado. Supervisa las métricas para validar operación segura.',
        off: 'La bomba se encuentra apagada. Puedes iniciar el ciclo en cualquier momento y el sistema empezará a transmitir telemetría.',
    };

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
    const ATM_PRESSURE = 101.325;
    const DESIGNER_SCALE = 50;
    const DESIGNER_ZERO_Y = 420;
    const DESIGNER_LOCAL_STORAGE_KEY = 'hydraulic-designer-state-v1';
    let refreshDesigner = () => {};

    let runtimeSeconds = Math.round(state?.totalRuntimeSeconds ?? 0);
    telemetry = {
        voltage: telemetry?.voltage ?? metricsSeed?.voltage ?? 0,
        current: telemetry?.current ?? metricsSeed?.current ?? 0,
        battery: telemetry?.battery ?? metricsSeed?.battery ?? 90,
    };
    measurement = normalizeMeasurement(measurement);

    const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
    const toNumber = (value, fallback = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };
    const formatNumber = (value, digits = 2) => {
        if (value === null || value === undefined || Number.isNaN(value)) {
            return '---';
        }

        return Number(value).toFixed(digits);
    };
    const normalizeMeasurement = (raw) => {
        if (!raw || typeof raw !== 'object') {
            return null;
        }

        const valueOrNull = (value) => {
            if (value === null || value === undefined) {
                return null;
            }

            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        };

        return {
            id: raw.id ?? null,
            recordedAt: raw.recorded_at ?? raw.recordedAt ?? null,
            flow: valueOrNull(raw.flow ?? raw.flow_l_min),
            pressure: valueOrNull(raw.pressure ?? raw.pressure_bar),
            temperature: valueOrNull(raw.temperature ?? raw.temperature_c),
            voltage: valueOrNull(raw.voltage ?? raw.voltage_v),
            current: valueOrNull(raw.current ?? raw.current_a),
            velocity: valueOrNull(raw.velocity ?? raw.velocity_m_s),
            density: valueOrNull(raw.density ?? raw.density_kg_m3),
            viscosity: valueOrNull(raw.viscosity ?? raw.dynamic_viscosity_pa_s),
            reynolds: valueOrNull(raw.reynolds ?? raw.reynolds_number),
            frictionFactor: valueOrNull(raw.frictionFactor ?? raw.friction_factor),
            pressureDrop: valueOrNull(raw.pressureDrop ?? raw.pressure_drop ?? raw.pressure_drop_pa),
            headLoss: valueOrNull(raw.headLoss ?? raw.head_loss ?? raw.head_loss_m),
            hydraulicPower: valueOrNull(raw.hydraulicPower ?? raw.hydraulic_power ?? raw.hydraulic_power_w),
        };
    };
    const toKelvin = (celsius) => celsius + 273.15;
    const UNIVERSAL_GAS_CONSTANT = 8.314462618;

    const FLUID_DATABASE = {
        water: {
            name: 'Agua (líquida)',
            type: 'liquid',
            description: 'Referencia incompresible y Newtoniana para circuitos térmicos.',
            molarMass: 0.01801528,
            newtonian: true,
            specificHeatRatio: 1.01,
            compressibility: 4.6e-10,
            densityData: [
                { temp: 0, value: 999.8 },
                { temp: 5, value: 999.9 },
                { temp: 10, value: 999.7 },
                { temp: 15, value: 999.1 },
                { temp: 20, value: 998.2 },
                { temp: 25, value: 997.0 },
                { temp: 40, value: 992.2 },
                { temp: 60, value: 983.2 },
                { temp: 80, value: 971.8 },
                { temp: 100, value: 958.4 },
            ],
            viscosityData: [
                { temp: 0, value: 1.75e-3 },
                { temp: 10, value: 1.31e-3 },
                { temp: 20, value: 1.0e-3 },
                { temp: 25, value: 8.94e-4 },
                { temp: 40, value: 6.53e-4 },
                { temp: 60, value: 4.66e-4 },
                { temp: 80, value: 3.55e-4 },
                { temp: 100, value: 2.82e-4 },
            ],
            antoine: { A: 8.07131, B: 1730.63, C: 233.426, min: 1, max: 100 },
        },
        air: {
            name: 'Aire (gas)',
            type: 'gas',
            description: 'Aproximación ideal para mezclas de aire seco a presión atmosférica.',
            molarMass: 0.0289647,
            newtonian: true,
            specificHeatRatio: 1.4,
            densityData: [
                { temp: -40, value: 1.514 },
                { temp: -20, value: 1.394 },
                { temp: 0, value: 1.292 },
                { temp: 20, value: 1.204 },
                { temp: 40, value: 1.127 },
                { temp: 60, value: 1.058 },
                { temp: 80, value: 0.995 },
                { temp: 100, value: 0.938 },
                { temp: 120, value: 0.887 },
            ],
            viscosityData: [
                { temp: -40, value: 1.51e-5 },
                { temp: -20, value: 1.61e-5 },
                { temp: 0, value: 1.71e-5 },
                { temp: 20, value: 1.81e-5 },
                { temp: 40, value: 1.92e-5 },
                { temp: 60, value: 2.02e-5 },
                { temp: 80, value: 2.12e-5 },
                { temp: 100, value: 2.22e-5 },
                { temp: 120, value: 2.31e-5 },
            ],
            antoine: null,
        },
        acetone: {
            name: 'Acetona',
            type: 'liquid',
            description: 'Solvente orgánico volátil de baja viscosidad y alta presión de vapor.',
            molarMass: 0.05808,
            newtonian: true,
            specificHeatRatio: 1.03,
            density: 787,
            dynamicViscosity: 3.16e-4,
            compressibility: 6.8e-10,
            antoine: { A: 7.02447, B: 1161, C: 224, min: -20, max: 80 },
        },
        ethanol: {
            name: 'Alcohol etílico',
            type: 'liquid',
            description: 'Líquido orgánico miscible con agua, viscosidad moderada.',
            molarMass: 0.04607,
            newtonian: true,
            specificHeatRatio: 1.1,
            density: 789,
            dynamicViscosity: 1.0e-3,
            compressibility: 1.1e-9,
            antoine: { A: 8.20417, B: 1642.89, C: 230.3, min: 0, max: 78 },
        },
        glycerin: {
            name: 'Glicerina',
            type: 'liquid',
            description: 'Fluido Newtoniano de muy alta viscosidad usado en amortiguamiento.',
            molarMass: 0.09209,
            newtonian: true,
            specificHeatRatio: 1.02,
            density: 1258,
            dynamicViscosity: 1.41e-1,
            compressibility: 5.0e-10,
            antoine: null,
        },
        mercury: {
            name: 'Mercurio',
            type: 'liquid',
            description: 'Metal líquido de altísima densidad y compresibilidad despreciable.',
            molarMass: 0.20059,
            newtonian: true,
            specificHeatRatio: 1.02,
            density: 13540,
            dynamicViscosity: 1.53e-3,
            compressibility: 3.8e-11,
            antoine: null,
        },
        propane: {
            name: 'Propano líquido',
            type: 'liquid',
            description: 'Hidrocarburo licuado con presión moderada y tendencia a evaporar.',
            molarMass: 0.044097,
            newtonian: true,
            specificHeatRatio: 1.13,
            density: 495,
            dynamicViscosity: 1.86e-3,
            compressibility: 1.2e-9,
            antoine: { A: 6.80338, B: 804.0, C: 247.04, min: -40, max: 90 },
        },
    };

    const calculatorOutputs = {
        fluidName: document.querySelector('[data-calculator-output="fluid-name"]'),
        fluidSummary: document.querySelector('[data-calculator-output="fluid-summary"]'),
        fluidType: document.querySelector('[data-calculator-output="fluid-type"]'),
        density: document.querySelector('[data-calculator-output="density"]'),
        specificVolume: document.querySelector('[data-calculator-output="specific-volume"]'),
        specificWeight: document.querySelector('[data-calculator-output="specific-weight"]'),
        dynamicViscosity: document.querySelector('[data-calculator-output="dynamic-viscosity"]'),
        kinematicViscosity: document.querySelector('[data-calculator-output="kinematic-viscosity"]'),
        compressibility: document.querySelector('[data-calculator-output="compressibility"]'),
        compressibilityLabel: document.querySelector('[data-calculator-output="compressibility-label"]'),
        pressureEos: document.querySelector('[data-calculator-output="pressure-eos"]'),
        partialPressure: document.querySelector('[data-calculator-output="partial-pressure"]'),
        vaporPressure: document.querySelector('[data-calculator-output="vapor-pressure"]'),
        saturationPressure: document.querySelector('[data-calculator-output="saturation-pressure"]'),
        classificationViscosity: document.querySelector('[data-calculator-output="classification-viscosity"]'),
        classificationCompressibility: document.querySelector('[data-calculator-output="classification-compressibility"]'),
        classificationRheology: document.querySelector('[data-calculator-output="classification-rheology"]'),
        flowRegime: document.querySelector('[data-calculator-output="flow-regime"]'),
        reynolds: document.querySelector('[data-calculator-output="reynolds"]'),
        flowNote: document.querySelector('[data-calculator-output="flow-note"]'),
        temperatureVariation: document.querySelector('[data-calculator-output="temperature-variation"]'),
        pressureVariation: document.querySelector('[data-calculator-output="pressure-variation"]'),
        propertyVariation: document.querySelector('[data-calculator-output="property-variation"]'),
        processList: document.querySelector('[data-calculator-output="process-list"]'),
    };

    const formatFixed = (value, decimals = 2, minDecimals = 0) => {
        if (!Number.isFinite(value)) {
            return '—';
        }

        return Number(value).toLocaleString('es-MX', {
            minimumFractionDigits: minDecimals,
            maximumFractionDigits: decimals,
        });
    };

    const formatSigned = (value, decimals = 1) => {
        if (!Number.isFinite(value) || value === 0) {
            return '0.0';
        }

        const magnitude = formatFixed(Math.abs(value), decimals, decimals);
        const sign = value > 0 ? '+' : '-';
        return `${sign}${magnitude}`;
    };

    const formatSignedPercent = (value, decimals = 1) => {
        if (!Number.isFinite(value) || value === 0) {
            return '±0.0%';
        }

        const magnitude = formatFixed(Math.abs(value), decimals, decimals);
        const sign = value > 0 ? '+' : value < 0 ? '-' : '±';
        return `${sign}${magnitude}%`;
    };

    const formatScientific = (value, digits = 2) => {
        if (!Number.isFinite(value) || value === 0) {
            return '0';
        }

        const [coefficient, exponent] = value.toExponential(digits).split('e');
        const normalized = Number.parseFloat(coefficient).toString();
        const exponentValue = Number.parseInt(exponent, 10);
        return `${normalized} x 10^${exponentValue}`;
    };

    const parseNumber = (value, fallback = 0) => {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    };

    const ensureChartReady = () => {
        return new Promise((resolve) => {
            if (typeof window.Chart !== 'undefined') {
                resolve(window.Chart);
                return;
            }

            const timer = window.setInterval(() => {
                if (typeof window.Chart !== 'undefined') {
                    window.clearInterval(timer);
                    resolve(window.Chart);
                }
            }, 25);
        });
    };

    const formatDuration = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
        }

        return `${minutes.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    };

    const formatter = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

    const formatRelativeTime = (isoString) => {
        if (!isoString) {
            return 'Sin registro';
        }

        const now = Date.now();
        const target = new Date(isoString).getTime();
        let deltaSeconds = Math.round((target - now) / 1000);

        const divisions = [
            { amount: 60, unit: 'second' },
            { amount: 60, unit: 'minute' },
            { amount: 24, unit: 'hour' },
            { amount: 30, unit: 'day' },
            { amount: 12, unit: 'month' },
            { amount: Infinity, unit: 'year' },
        ];

        for (const division of divisions) {
            if (Math.abs(deltaSeconds) < division.amount) {
                return formatter.format(deltaSeconds, division.unit);
            }

            deltaSeconds = Math.round(deltaSeconds / division.amount);
        }

        return formatter.format(deltaSeconds, 'year');
    };

    const applyStatusStyles = () => {
        if (!selectors.statusBadge || !selectors.toggleButton) {
            return;
        }

        const actualOn = Boolean(state?.isOn);
        const commandOn = Boolean(state?.shouldRun ?? state?.isOn);

        selectors.statusBadge.classList.remove(...statusClasses.on, ...statusClasses.off);
        selectors.statusBadge.classList.add(...(actualOn ? statusClasses.on : statusClasses.off));
        selectors.toggleButton.classList.remove(...toggleClasses.on, ...toggleClasses.off);
        selectors.toggleButton.classList.add(...(commandOn ? toggleClasses.on : toggleClasses.off));

        if (selectors.statusText) {
            selectors.statusText.textContent = state?.statusLabel ?? (actualOn ? 'Bomba activa' : 'Bomba apagada');
        }

        if (selectors.toggleLabel) {
            selectors.toggleLabel.textContent = commandOn ? 'Apagar bomba' : 'Encender bomba';
        }

        if (selectors.statusDescription) {
            selectors.statusDescription.textContent = actualOn ? DESCRIPTIONS.on : DESCRIPTIONS.off;
        }

        if (selectors.runtimeState) {
            selectors.runtimeState.textContent = actualOn ? 'En ejecución' : 'En espera';
        }
    };

    const updateDeviceBadge = (device) => {
        if (!selectors.deviceBadge) {
            return;
        }

        if (!device) {
            selectors.deviceBadge.textContent = 'Esperando registro del ESP32';
            return;
        }

        const relative = formatRelativeTime(device.lastSeenAt ?? device.lastTelemetryAt ?? null);
        selectors.deviceBadge.textContent = `ESP32 #${device.id} • ${relative}`;
    };

    const updateFluidCards = () => {
        const {
            fluidCardRegimePrimary,
            fluidCardReynolds,
            fluidCardPressure,
            fluidCardHead,
            fluidCardPower,
            fluidCardVelocity,
            fluidCardDensity,
            fluidCardViscosity,
        } = selectors;

        if (!fluidCardRegimePrimary || !fluidCardReynolds) {
            return;
        }

        if (!measurement) {
            fluidCardRegimePrimary.textContent = 'Sin datos';
            fluidCardReynolds.textContent = '---';
            if (fluidCardPressure) {
                fluidCardPressure.textContent = '---';
            }
            if (fluidCardHead) {
                fluidCardHead.textContent = '---';
            }
            if (fluidCardPower) {
                fluidCardPower.textContent = '---';
            }
            if (fluidCardVelocity) {
                fluidCardVelocity.textContent = '---';
            }
            if (fluidCardDensity) {
                fluidCardDensity.textContent = '---';
            }
            if (fluidCardViscosity) {
                fluidCardViscosity.textContent = '---';
            }
            return;
        }

        const reynolds = measurement.reynolds;
        let regimeLabel = 'Sin datos';

        if (typeof reynolds === 'number' && !Number.isNaN(reynolds)) {
            if (reynolds < 2300) {
                regimeLabel = 'Flujo laminar';
            } else if (reynolds < 4000) {
                regimeLabel = 'Transición';
            } else {
                regimeLabel = 'Flujo turbulento';
            }
        }

        fluidCardRegimePrimary.textContent = regimeLabel;
        fluidCardReynolds.textContent = formatNumber(reynolds, 0);
        if (fluidCardPressure) {
            fluidCardPressure.textContent = formatNumber(
            measurement.pressureDrop !== null ? measurement.pressureDrop / 1000 : Number.NaN,
            2,
        );
        }
        if (fluidCardHead) {
            fluidCardHead.textContent = formatNumber(measurement.headLoss, 2);
        }
        if (fluidCardPower) {
            fluidCardPower.textContent = formatNumber(measurement.hydraulicPower, 1);
        }
        if (fluidCardVelocity) {
            fluidCardVelocity.textContent = formatNumber(measurement.velocity, 2);
        }
        if (fluidCardDensity) {
            fluidCardDensity.textContent = formatNumber(measurement.density, 0);
        }
        if (fluidCardViscosity) {
            fluidCardViscosity.textContent = formatNumber(
            measurement.viscosity !== null ? measurement.viscosity * 1000 : Number.NaN,
            2,
        );
        }
    };

    const updateRuntimeDisplay = () => {
        const formatted = formatDuration(runtimeSeconds);
        selectors.runtime.forEach((el) => {
            el.textContent = formatted;
        });

        if (selectors.runtimeMinutes) {
            selectors.runtimeMinutes.textContent = (runtimeSeconds / 60).toFixed(1);
        }

        if (selectors.lastChanged) {
            selectors.lastChanged.textContent = formatRelativeTime(state?.lastChangedAt);
        }
    };

    const randomAround = (base, spread) => {
        const delta = (Math.random() - 0.5) * spread * 2;
        return base + delta;
    };

    const updateReadouts = () => {
        const voltage = toNumber(telemetry.voltage, 0);
        const current = toNumber(telemetry.current, 0);
        const battery = clamp(toNumber(telemetry.battery, 0), 0, 100);

        if (selectors.metricVoltage) {
            selectors.metricVoltage.textContent = voltage.toFixed(1);
        }
        if (selectors.metricCurrent) {
            selectors.metricCurrent.textContent = current.toFixed(2);
        }
        if (selectors.metricBattery) {
            selectors.metricBattery.textContent = Math.round(battery).toString();
        }
        if (selectors.batteryBar) {
            selectors.batteryBar.style.width = `${battery}%`;
        }
    };

    const handleMeasurementUpdate = (rawMeasurement, source = 'telemetry') => {
        const normalized = normalizeMeasurement(rawMeasurement);

        if (!normalized) {
            return;
        }

        measurement = normalized;

        if (normalized.voltage !== null) {
            telemetry.voltage = normalized.voltage;
        }

        if (normalized.current !== null) {
            telemetry.current = normalized.current;
        }

        updateReadouts();
        pushChart(charts.voltage, telemetry.voltage);
        pushChart(charts.current, telemetry.current);
        pushTelemetryChart(telemetry.voltage, telemetry.current);
        updateFluidCards();

        if (source === 'stream' && normalized.recordedAt && normalized.id !== lastLoggedMeasurementId) {
            lastLoggedMeasurementId = normalized.id;
            logActivity(
                'Telemetría actualizada',
                `ΔP ≈ ${formatNumber(normalized.pressureDrop !== null ? normalized.pressureDrop / 1000 : Number.NaN, 2)} kPa · Re = ${formatNumber(normalized.reynolds, 0)}`,
                'positive',
            );
        }
    };

    const isPanelOpen = (panel) => Boolean(panel && !panel.classList.contains('hidden'));

    const syncBodyOverflow = () => {
        if (isPanelOpen(selectors.fluidPanel) || isPanelOpen(selectors.calculatorPanel) || isPanelOpen(selectors.designer?.panel)) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
    };

    const toggleFluidPanel = (open) => {
        if (!selectors.fluidPanel) {
            return;
        }

        selectors.fluidPanel.classList.toggle('hidden', !open);
        selectors.fluidPanel.classList.toggle('flex', open);
        selectors.fluidPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
        syncBodyOverflow();
    };

    const toggleCalculatorPanel = (open) => {
        if (!selectors.calculatorPanel) {
            return;
        }

        selectors.calculatorPanel.classList.toggle('hidden', !open);
        selectors.calculatorPanel.classList.toggle('flex', open);
        selectors.calculatorPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
        syncBodyOverflow();
    };

    const toggleDesignerPanel = (open) => {
        const panel = selectors.designer?.panel;
        if (!panel) {
            console.warn('Panel del diseñador no encontrado en el DOM.');
            return;
        }

        panel.classList.toggle('hidden', !open);
        panel.classList.toggle('flex', open);
        panel.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (open) {
            refreshDesigner({ forceForms: true });
        }
        syncBodyOverflow();
    };

    const logActivity = (title, description, tone = 'neutral') => {
        if (!selectors.activityLog) {
            return;
        }

        const toneClasses = {
            positive: 'bg-emerald-500/10 text-emerald-200',
            warning: 'bg-amber-500/10 text-amber-200',
            neutral: 'bg-white/10 text-white/60',
        };

        const wrapper = document.createElement('li');
        wrapper.className = 'flex items-start gap-3';

        const icon = document.createElement('span');
        icon.className = `mt-1 inline-flex h-8 w-8 items-center justify-center rounded-2xl ${toneClasses[tone] ?? toneClasses.neutral}`;
        icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a8 8 0 100 16 8 8 0 000-16zm-.75 4.75a.75.75 0 011.5 0v3.5a.75.75 0 01-1.5 0v-3.5zm.75 8.25a1 1 0 110-2 1 1 0 010 2z" /></svg>';

        const content = document.createElement('div');
        const titleEl = document.createElement('p');
        titleEl.className = 'font-semibold text-white';
        titleEl.textContent = title;

        const descEl = document.createElement('p');
        descEl.className = 'text-xs text-white/50';
        descEl.textContent = description;

        content.append(titleEl, descEl);
        wrapper.append(icon, content);

        selectors.activityLog.prepend(wrapper);
        while (selectors.activityLog.children.length > 5) {
            selectors.activityLog.removeChild(selectors.activityLog.lastChild);
        }
    };

    const getInterpolatedValue = (entries, temperature) => {
        if (!Array.isArray(entries) || entries.length === 0 || !Number.isFinite(temperature)) {
            return null;
        }

        const sorted = [...entries].sort((a, b) => a.temp - b.temp);
        if (temperature <= sorted[0].temp) {
            return sorted[0].value;
        }
        const last = sorted[sorted.length - 1];
        if (temperature >= last.temp) {
            return last.value;
        }

        for (let index = 0; index < sorted.length - 1; index += 1) {
            const lower = sorted[index];
            const upper = sorted[index + 1];
            if (temperature >= lower.temp && temperature <= upper.temp) {
                const ratio = (temperature - lower.temp) / (upper.temp - lower.temp);
                return lower.value + ratio * (upper.value - lower.value);
            }
        }

        return last.value;
    };

    const getDensity = (fluid, temperature, pressure) => {
        const referencePressure = Number.isFinite(pressure) ? Math.max(pressure, 0.1) : 101.325;

        if (fluid.type === 'gas' && Number.isFinite(fluid.molarMass)) {
            const temperatureK = toKelvin(temperature);
            if (temperatureK <= 0) {
                return null;
            }

            const rSpecific = UNIVERSAL_GAS_CONSTANT / fluid.molarMass;
            return (referencePressure * 1000) / (rSpecific * temperatureK);
        }

        if (Array.isArray(fluid.densityData) && fluid.densityData.length > 0) {
            return getInterpolatedValue(fluid.densityData, temperature);
        }

        return Number.isFinite(fluid.density) ? fluid.density : null;
    };

    const getDynamicViscosity = (fluid, temperature) => {
        if (Array.isArray(fluid.viscosityData) && fluid.viscosityData.length > 0) {
            return getInterpolatedValue(fluid.viscosityData, temperature);
        }

        return Number.isFinite(fluid.dynamicViscosity) ? fluid.dynamicViscosity : null;
    };

    const computeSpecificWeight = (density) => {
        if (!Number.isFinite(density)) {
            return null;
        }

        return (density * 9.80665) / 1000;
    };

    const resolveVaporPressure = (fluid, temperature) => {
        const constants = fluid.antoine;
        if (!constants) {
            return { value: null, note: 'Sin datos de Antoine' };
        }

        if (!Number.isFinite(temperature)) {
            return { value: null, note: 'Temperatura no definida' };
        }

        if (temperature < constants.min || temperature > constants.max) {
            return {
                value: null,
                note: `Fuera de rango (${constants.min}°C – ${constants.max}°C)`,
            };
        }

        const pressureMmHg = 10 ** (constants.A - constants.B / (constants.C + temperature));
        return {
            value: pressureMmHg * 0.133322,
            note: null,
        };
    };

    const buildClassification = (fluid, dynamicViscosity) => {
        let viscosityText = 'Sin dato de viscosidad disponible.';

        if (Number.isFinite(dynamicViscosity)) {
            let label = 'Viscosidad media';
            if (dynamicViscosity < 8e-4) {
                label = 'Baja viscosidad';
            } else if (dynamicViscosity >= 3e-3) {
                label = 'Alta viscosidad';
            }

            const formatted = dynamicViscosity >= 0.01
                ? `${formatFixed(dynamicViscosity, 3, 3)} Pa·s`
                : `${formatScientific(dynamicViscosity, 2)} Pa·s`;
            viscosityText = `${label} (μ = ${formatted})`;
        }

        const compressibilityText = fluid.type === 'gas'
            ? 'Fluido compresible: el volumen cambia con la presión.'
            : 'Prácticamente incompresible en las condiciones habituales.';

        const rheologyText = fluid.newtonian
            ? 'Comportamiento Newtoniano (τ proporcional a γ̇).'
            : 'Fluido no Newtoniano, requiere modelo reológico específico.';

        return {
            viscosityText,
            compressibilityText,
            rheologyText,
        };
    };

    const evaluateProcesses = (fluid, payload) => {
        const entries = [];
        const { temperature, temperatureTarget, pressure, pressureTarget } = payload;

        if (Number.isFinite(pressure) && Number.isFinite(pressureTarget) && pressure > 0) {
            const deltaPercent = ((pressureTarget - pressure) / pressure) * 100;
            const magnitude = Math.abs(deltaPercent);
            let tone = 'neutral';
            let detail = `ΔP = ${formatSignedPercent(deltaPercent)}; captura adicional recomendada.`;

            if (magnitude <= 2) {
                tone = 'positive';
                detail = `ΔP = ${formatSignedPercent(deltaPercent)} → comportamiento casi isobárico.`;
            } else if (magnitude <= 7) {
                tone = 'warning';
                detail = `ΔP = ${formatSignedPercent(deltaPercent)}; se aleja de la condición isobárica.`;
            } else {
                tone = 'alert';
                detail = `ΔP = ${formatSignedPercent(deltaPercent)}; no es un proceso isobárico.`;
            }

            entries.push({ title: 'Isobárico', detail, tone });
        } else {
            entries.push({ title: 'Isobárico', detail: 'Proporciona presiones inicial y final para evaluar esta condición.', tone: 'neutral' });
        }

        if (Number.isFinite(temperature) && Number.isFinite(temperatureTarget)) {
            const delta = temperatureTarget - temperature;
            const magnitude = Math.abs(delta);
            let tone = 'neutral';
            let detail = `ΔT = ${formatSigned(delta, 1)} °C; requiere control adicional.`;

            if (magnitude <= 1) {
                tone = 'positive';
                detail = `ΔT = ${formatSigned(delta, 1)} °C → proceso casi isotérmico.`;
            } else if (magnitude <= 5) {
                tone = 'warning';
                detail = `ΔT = ${formatSigned(delta, 1)} °C; vigila el intercambio térmico.`;
            } else {
                tone = 'alert';
                detail = `ΔT = ${formatSigned(delta, 1)} °C; el proceso dista de ser isotérmico.`;
            }

            entries.push({ title: 'Isotérmico', detail, tone });
        } else {
            entries.push({ title: 'Isotérmico', detail: 'Agrega temperaturas inicial y final para estimar esta condición.', tone: 'neutral' });
        }

        if (fluid.type === 'gas' && Number.isFinite(temperature) && Number.isFinite(temperatureTarget) && Number.isFinite(pressure) && pressure > 0) {
            const gamma = fluid.specificHeatRatio ?? 1.4;
            const referencePressure = pressure;
            const targetPressure = Number.isFinite(pressureTarget) ? pressureTarget : pressure;
            const t1 = toKelvin(temperature);
            const t2 = toKelvin(temperatureTarget);

            if (gamma > 1 && t1 > 0 && t2 > 0) {
                const expected = referencePressure * Math.pow(t2 / t1, gamma / (gamma - 1));
                const deviation = ((targetPressure - expected) / expected) * 100;
                const magnitude = Math.abs(deviation);
                let tone = 'neutral';
                let detail = `Desviación respecto al ideal isentrópico: ${formatSignedPercent(deviation)}.`;

                if (magnitude <= 5) {
                    tone = 'positive';
                    detail = `Desviación ${formatSignedPercent(deviation)} → aproximación isentrópica razonable.`;
                } else if (magnitude <= 12) {
                    tone = 'warning';
                    detail = `Desviación ${formatSignedPercent(deviation)}; considera pérdidas irreversibles.`;
                } else {
                    tone = 'alert';
                    detail = `Desviación ${formatSignedPercent(deviation)}; lejos del escenario isentrópico.`;
                }

                entries.push({ title: 'Isentrópico', detail, tone });
            } else {
                entries.push({ title: 'Isentrópico', detail: 'Datos insuficientes para evaluar la condición isentrópica.', tone: 'neutral' });
            }
        } else {
            entries.push({ title: 'Isentrópico', detail: 'Aplica principalmente para gases comprimibles; selecciona un gas para evaluar esta condición.', tone: 'neutral' });
        }

        return entries;
    };

    const computeFluidAnalysis = (input) => {
        const fluid = FLUID_DATABASE[input.fluid] ?? FLUID_DATABASE.water;
        const temperature = Number.isFinite(input.temperature) ? input.temperature : 25;
        const temperatureTarget = Number.isFinite(input.temperatureTarget) ? input.temperatureTarget : temperature;
        const pressure = Number.isFinite(input.pressure) ? Math.max(input.pressure, 0.1) : 101.325;
        const pressureTarget = Number.isFinite(input.pressureTarget) ? Math.max(input.pressureTarget, 0.1) : pressure;
        const velocity = Number.isFinite(input.velocity) ? Math.max(input.velocity, 0) : 0;
        const diameter = Number.isFinite(input.diameter) ? Math.max(input.diameter, 0) : 0;
        const molarFraction = clamp(Number.isFinite(input.molarFraction) ? input.molarFraction : 1, 0, 1);

        const density = getDensity(fluid, temperature, pressure);
        const densityTarget = getDensity(fluid, temperatureTarget, pressureTarget);
        const dynamicViscosity = getDynamicViscosity(fluid, temperature);
        const dynamicViscosityTarget = getDynamicViscosity(fluid, temperatureTarget);
        const specificVolume = Number.isFinite(density) && density !== 0 ? 1 / density : null;
        const specificWeight = computeSpecificWeight(density);
        const kinematicViscosity = Number.isFinite(dynamicViscosity) && Number.isFinite(density) && density !== 0
            ? dynamicViscosity / density
            : null;

        let pressureEoS = pressure;
        let compressibilityValue = null;
        let compressibilityType = fluid.type === 'gas' ? 'factor' : 'coefficient';

        if (fluid.type === 'gas' && Number.isFinite(specificVolume) && Number.isFinite(fluid.molarMass)) {
            const rSpecific = UNIVERSAL_GAS_CONSTANT / fluid.molarMass;
            const temperatureK = toKelvin(temperature);
            if (temperatureK > 0 && rSpecific > 0) {
                pressureEoS = (rSpecific * temperatureK) / specificVolume / 1000;
                const pressurePa = pressure * 1000;
                compressibilityValue = (pressurePa * specificVolume) / (rSpecific * temperatureK);
            }
        } else if (Number.isFinite(fluid.compressibility)) {
            compressibilityValue = fluid.compressibility;
        }

        const vapor = resolveVaporPressure(fluid, temperature);
        const saturation = resolveVaporPressure(fluid, temperatureTarget);

        let reynolds = null;
        let flowRegime = 'Captura datos de flujo';
        let flowNote = 'Indica velocidad y diámetro interno para clasificar el régimen.';

        if (velocity > 0 && diameter > 0 && Number.isFinite(dynamicViscosity) && Number.isFinite(density)) {
            reynolds = (density * velocity * diameter) / dynamicViscosity;
            if (reynolds < 2300) {
                flowRegime = 'Laminar';
                flowNote = 'Re < 2 300: flujo laminar, pérdidas reducidas.';
            } else if (reynolds <= 4000) {
                flowRegime = 'Transicional';
                flowNote = 'Re entre 2 300 y 4 000: vigila vibraciones y cavitación.';
            } else {
                flowRegime = 'Turbulento';
                flowNote = 'Re > 4 000: flujo turbulento, considera pérdidas mayores.';
            }
        }

        const deltaT = temperatureTarget - temperature;
        const deltaP = pressureTarget - pressure;

        const densityChange = Number.isFinite(density) && Number.isFinite(densityTarget) && density !== 0
            ? ((densityTarget - density) / density) * 100
            : null;
        const viscosityChange = Number.isFinite(dynamicViscosity) && Number.isFinite(dynamicViscosityTarget) && dynamicViscosity !== 0
            ? ((dynamicViscosityTarget - dynamicViscosity) / dynamicViscosity) * 100
            : null;

        const classification = buildClassification(fluid, dynamicViscosity);

        const processAssessment = evaluateProcesses(fluid, {
            temperature,
            temperatureTarget,
            pressure,
            pressureTarget,
        });

        return {
            fluid,
            temperature,
            temperatureTarget,
            pressure,
            pressureTarget,
            molarFraction,
            density,
            densityTarget,
            specificVolume,
            specificWeight,
            dynamicViscosity,
            dynamicViscosityTarget,
            kinematicViscosity,
            compressibilityValue,
            compressibilityType,
            pressureEoS,
            partialPressure: pressure * molarFraction,
            vapor,
            saturation,
            reynolds,
            flowRegime,
            flowNote,
            velocity,
            diameter,
            deltaT,
            deltaP,
            densityChange,
            viscosityChange,
            classification,
            processAssessment,
        };
    };

    const renderCalculator = (result) => {
        if (!calculatorOutputs.fluidName) {
            return;
        }

        const formatViscosity = (value) => {
            if (!Number.isFinite(value)) {
                return '—';
            }

            return value >= 0.01 ? `${formatFixed(value, 3, 3)}` : formatScientific(value, 2);
        };

        const formatKinematicViscosity = (value) => {
            if (!Number.isFinite(value)) {
                return '—';
            }

            return value >= 1e-4 ? `${formatFixed(value, 5, 5)}` : formatScientific(value, 2);
        };

        const fluidTypeLabel = result.fluid.type === 'gas' ? 'Gas' : 'Líquido';
        const compressibilityDisplay = (() => {
            if (!Number.isFinite(result.compressibilityValue)) {
                return '—';
            }

            if (result.compressibilityType === 'factor') {
                return formatFixed(result.compressibilityValue, 3, 3);
            }

            return `${formatScientific(result.compressibilityValue, 2)} 1/Pa`;
        })();

        const temperatureSummary = Number.isFinite(result.deltaT)
            ? `ΔT = ${formatSigned(result.deltaT, 1)} °C (de ${formatFixed(result.temperature, 1, 1)} a ${formatFixed(result.temperatureTarget, 1, 1)} °C)`
            : 'Temperatura sin variaciones registradas.';

        const pressureSummary = Number.isFinite(result.deltaP)
            ? `ΔP = ${formatSigned(result.deltaP, 1)} kPa (de ${formatFixed(result.pressure, 1, 1)} a ${formatFixed(result.pressureTarget, 1, 1)} kPa)`
            : 'Presión sin variaciones registradas.';

        const propertySummaryParts = [];
        if (Number.isFinite(result.densityChange)) {
            propertySummaryParts.push(`Densidad ${formatSignedPercent(result.densityChange)}`);
        }
        if (Number.isFinite(result.viscosityChange)) {
            propertySummaryParts.push(`Viscosidad ${formatSignedPercent(result.viscosityChange)}`);
        }
        const propertySummary = propertySummaryParts.length > 0
            ? `${propertySummaryParts.join(' · ')} entre T₁ y T₂.`
            : 'Propiedades sin cambio apreciable en el rango indicado.';

        calculatorOutputs.fluidName.textContent = result.fluid.name;
        calculatorOutputs.fluidSummary.textContent = result.fluid.description ?? '';
        calculatorOutputs.fluidType.textContent = fluidTypeLabel;
        calculatorOutputs.density.textContent = Number.isFinite(result.density) ? formatFixed(result.density, 1, 1) : '—';
        calculatorOutputs.specificVolume.textContent = Number.isFinite(result.specificVolume)
            ? formatScientific(result.specificVolume, 3)
            : '—';
        calculatorOutputs.specificWeight.textContent = Number.isFinite(result.specificWeight)
            ? formatFixed(result.specificWeight, 2, 2)
            : '—';
        calculatorOutputs.dynamicViscosity.textContent = formatViscosity(result.dynamicViscosity);
        calculatorOutputs.kinematicViscosity.textContent = formatKinematicViscosity(result.kinematicViscosity);
        calculatorOutputs.compressibilityLabel.textContent = result.compressibilityType === 'factor'
            ? 'Compresibilidad (factor Z)'
            : 'Compresibilidad (β)';
        calculatorOutputs.compressibility.textContent = compressibilityDisplay;
        calculatorOutputs.pressureEos.textContent = Number.isFinite(result.pressureEoS)
            ? formatFixed(result.pressureEoS, 2, 2)
            : '—';
        calculatorOutputs.partialPressure.textContent = Number.isFinite(result.partialPressure)
            ? formatFixed(result.partialPressure, 2, 2)
            : '—';
        calculatorOutputs.vaporPressure.textContent = Number.isFinite(result.vapor.value)
            ? formatFixed(result.vapor.value, 2, 2)
            : (result.vapor.note ?? 'N/D');
        calculatorOutputs.saturationPressure.textContent = Number.isFinite(result.saturation.value)
            ? formatFixed(result.saturation.value, 2, 2)
            : (result.saturation.note ?? 'N/D');
        calculatorOutputs.classificationViscosity.textContent = result.classification.viscosityText;
        calculatorOutputs.classificationCompressibility.textContent = result.classification.compressibilityText;
        calculatorOutputs.classificationRheology.textContent = result.classification.rheologyText;
        calculatorOutputs.flowRegime.textContent = result.flowRegime;
        calculatorOutputs.reynolds.textContent = Number.isFinite(result.reynolds)
            ? formatFixed(result.reynolds, 0)
            : '—';
        calculatorOutputs.flowNote.textContent = result.flowNote;
        calculatorOutputs.temperatureVariation.textContent = temperatureSummary;
        calculatorOutputs.pressureVariation.textContent = pressureSummary;
        calculatorOutputs.propertyVariation.textContent = propertySummary;

        if (calculatorOutputs.processList) {
            calculatorOutputs.processList.innerHTML = '';
            const badgeClasses = {
                positive: 'border-emerald-400/40 bg-emerald-500/10 text-emerald-100',
                warning: 'border-amber-400/40 bg-amber-500/10 text-amber-100',
                alert: 'border-rose-400/40 bg-rose-500/10 text-rose-100',
                neutral: 'border-slate-600 bg-slate-800 text-slate-200',
            };

            result.processAssessment.forEach((entry) => {
                const item = document.createElement('li');
                item.className = 'rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2';

                const header = document.createElement('div');
                header.className = 'flex items-center justify-between gap-2';

                const title = document.createElement('span');
                title.className = 'text-[10px] uppercase tracking-[0.3em] text-slate-400';
                title.textContent = entry.title;

                const badge = document.createElement('span');
                badge.className = `inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.3em] ${badgeClasses[entry.tone] ?? badgeClasses.neutral}`;
                badge.textContent = entry.tone === 'positive'
                    ? 'Estable'
                    : entry.tone === 'warning'
                        ? 'Atención'
                        : entry.tone === 'alert'
                            ? 'Crítico'
                            : 'Referencia';

                const detail = document.createElement('p');
                detail.className = 'mt-1 text-xs text-slate-200';
                detail.textContent = entry.detail;

                header.append(title, badge);
                item.append(header, detail);
                calculatorOutputs.processList.append(item);
            });
        }
    };

    const handleCalculatorUpdate = () => {
        if (!selectors.calculatorForm) {
            return;
        }

        const data = new FormData(selectors.calculatorForm);
        const temperature = parseNumber(data.get('temperature'), 25);
        const pressure = parseNumber(data.get('pressure'), 101.325);

        const input = {
            fluid: data.get('fluid') ?? 'water',
            temperature,
            temperatureTarget: parseNumber(data.get('temperature_target'), temperature),
            pressure,
            pressureTarget: parseNumber(data.get('pressure_target'), pressure),
            velocity: parseNumber(data.get('velocity'), 0),
            diameter: parseNumber(data.get('diameter'), 0),
            molarFraction: parseNumber(data.get('molar_fraction'), 1),
        };

        const result = computeFluidAnalysis(input);
        renderCalculator(result);
    };

    const charts = {
        voltage: null,
        current: null,
        battery: null,
        telemetry: null,
    };

    const createMiniChart = (canvasId, borderColor, backgroundColor) => {
        const canvas = document.getElementById(canvasId);
        if (!canvas || typeof window.Chart === 'undefined') {
            return null;
        }

        return new window.Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        data: [],
                        borderColor,
                        backgroundColor,
                        tension: 0.4,
                        fill: true,
                        pointRadius: 0,
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                animation: false,
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        display: false,
                    },
                    y: {
                        display: false,
                    },
                },
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        enabled: false,
                    },
                },
            },
        });
    };

    const createTelemetryChart = () => {
        const canvas = document.getElementById('telemetry-chart');
        if (!canvas || typeof window.Chart === 'undefined') {
            return null;
        }

        return new window.Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'Voltaje (V)',
                        data: [],
                        borderColor: 'rgba(56, 189, 248, 1)',
                        backgroundColor: 'rgba(56, 189, 248, 0.15)',
                        tension: 0.35,
                        fill: true,
                        pointRadius: 0,
                        borderWidth: 2,
                    },
                    {
                        label: 'Corriente (A)',
                        data: [],
                        borderColor: 'rgba(52, 211, 153, 1)',
                        backgroundColor: 'rgba(52, 211, 153, 0.15)',
                        tension: 0.35,
                        fill: true,
                        pointRadius: 0,
                        borderWidth: 2,
                    },
                ],
            },
            options: {
                animation: false,
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: '#cbd5f5',
                            font: { size: 11 },
                        },
                    },
                    tooltip: {
                        callbacks: {
                            title: () => 'Telemetría en vivo',
                        },
                    },
                },
                scales: {
                    x: {
                        ticks: {
                            color: 'rgba(226, 232, 240, 0.5)',
                            maxRotation: 0,
                            autoSkip: true,
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                        },
                    },
                    y: {
                        ticks: {
                            color: 'rgba(226, 232, 240, 0.5)',
                        },
                        grid: {
                            color: 'rgba(148, 163, 184, 0.1)',
                        },
                    },
                },
            },
        });
    };

    const seedCharts = () => {
        charts.voltage = createMiniChart('voltage-chart', 'rgba(56, 189, 248, 1)', 'rgba(56, 189, 248, 0.18)');
        charts.current = createMiniChart('current-chart', 'rgba(74, 222, 128, 1)', 'rgba(74, 222, 128, 0.18)');
        charts.battery = createMiniChart('battery-chart', 'rgba(129, 140, 248, 1)', 'rgba(129, 140, 248, 0.18)');
        charts.telemetry = createTelemetryChart();

        const seedPoints = 12;
        const now = Date.now();

        for (let index = seedPoints; index > 0; index -= 1) {
            const timestamp = new Date(now - index * 2000).toLocaleTimeString('es-ES', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            });

            const voltageValue = state?.isOn ? randomAround(metricsSeed?.voltage ?? 225, 3) : randomAround(1, 0.5);
            const currentValue = state?.isOn ? randomAround(metricsSeed?.current ?? 7.8, 0.6) : randomAround(0.2, 0.1);
            const batteryValue = clamp(randomAround(metricsSeed?.battery ?? 90, 2), 60, 100);

            if (charts.voltage) {
                charts.voltage.data.labels.push('');
                charts.voltage.data.datasets[0].data.push(voltageValue);
            }
            if (charts.current) {
                charts.current.data.labels.push('');
                charts.current.data.datasets[0].data.push(currentValue);
            }
            if (charts.battery) {
                charts.battery.data.labels.push('');
                charts.battery.data.datasets[0].data.push(batteryValue);
            }
            if (charts.telemetry) {
                charts.telemetry.data.labels.push(timestamp);
                charts.telemetry.data.datasets[0].data.push(voltageValue);
                charts.telemetry.data.datasets[1].data.push(currentValue);
            }
        }

        Object.values(charts).forEach((chart) => {
            chart?.update('none');
        });
    };

    const pushChart = (chart, value) => {
        if (!chart) {
            return;
        }

        chart.data.labels.push('');
        chart.data.datasets[0].data.push(toNumber(value));

        if (chart.data.labels.length > 24) {
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
        }

        chart.update('none');
    };

    const pushTelemetryChart = (voltageValue, currentValue) => {
        if (!charts.telemetry) {
            return;
        }

        const timestamp = new Date().toLocaleTimeString('es-ES', {
            hour12: false,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });

        charts.telemetry.data.labels.push(timestamp);
        charts.telemetry.data.datasets[0].data.push(toNumber(voltageValue));
        charts.telemetry.data.datasets[1].data.push(toNumber(currentValue));

        if (charts.telemetry.data.labels.length > 24) {
            charts.telemetry.data.labels.shift();
            charts.telemetry.data.datasets.forEach((dataset) => dataset.data.shift());
        }

        charts.telemetry.update('none');
    };

    const simulateTelemetryTick = () => {
        const on = Boolean(state?.isOn);

        if (on) {
            telemetry.voltage = clamp(randomAround(metricsSeed?.voltage ?? telemetry.voltage ?? 225, 2.5), 210, 235);
            telemetry.current = clamp(randomAround(metricsSeed?.current ?? telemetry.current ?? 7.5, 0.7), 0, 12);
            telemetry.battery = clamp((telemetry.battery ?? metricsSeed?.battery ?? 95) - Math.random() * 0.2, 60, 100);
        } else {
            telemetry.voltage = clamp(randomAround(telemetry.voltage ?? 0.8, 0.4), 0, 5);
            telemetry.current = clamp(randomAround(telemetry.current ?? 0.2, 0.1), 0, 1);
            telemetry.battery = clamp((telemetry.battery ?? metricsSeed?.battery ?? 90) + Math.random() * 0.15, 50, 100);
        }

        updateReadouts();
        pushChart(charts.voltage, telemetry.voltage);
        pushChart(charts.current, telemetry.current);
        pushChart(charts.battery, telemetry.battery);
        pushTelemetryChart(telemetry.voltage, telemetry.current);
    };

    const refreshTelemetry = async (useFallback = true) => {
        if (!endpoints.state) {
            if (useFallback) {
                simulateTelemetryTick();
            }
            return;
        }

        try {
            const response = await fetch(endpoints.state, {
                headers: {
                    Accept: 'application/json',
                },
                cache: 'no-store',
            });

            if (!response.ok) {
                throw new Error(`Solicitud de estado falló con código ${response.status}`);
            }

            const payload = await response.json();

            applyState(
                payload.state ?? {},
                payload.metricsSeed ?? null,
                payload.telemetry ?? null,
                payload.device ?? null,
                payload.measurement ?? null,
            );

            if (!payload.measurement) {
                const voltageValue = toNumber(telemetry?.voltage ?? payload.metricsSeed?.voltage, 0);
                const currentValue = toNumber(telemetry?.current ?? payload.metricsSeed?.current, 0);
                const batteryValue = clamp(toNumber(telemetry?.battery ?? payload.metricsSeed?.battery, 0), 0, 100);

                pushChart(charts.voltage, voltageValue);
                pushChart(charts.current, currentValue);
                pushChart(charts.battery, batteryValue);
                pushTelemetryChart(voltageValue, currentValue);
            }
        } catch (error) {
            console.error('No se pudo actualizar la telemetría', error);
            if (useFallback) {
                simulateTelemetryTick();
            }
        }
    };

    const applyState = (nextState, nextSeed = null, nextTelemetry = null, nextDevice = null, nextMeasurement = null) => {
        state = {
            ...state,
            ...nextState,
        };

        if (nextSeed) {
            metricsSeed = {
                ...metricsSeed,
                ...nextSeed,
            };
        }

        if (nextTelemetry) {
            telemetry = {
                ...telemetry,
                ...nextTelemetry,
            };
            metricsSeed = {
                ...metricsSeed,
                voltage: nextTelemetry.voltage ?? metricsSeed.voltage,
                current: nextTelemetry.current ?? metricsSeed.current,
                battery: nextTelemetry.battery ?? metricsSeed.battery,
            };
        } else if (nextSeed) {
            telemetry = {
                ...telemetry,
                voltage: nextSeed.voltage ?? telemetry.voltage,
                current: nextSeed.current ?? telemetry.current,
                battery: nextSeed.battery ?? telemetry.battery,
            };
        }

        if (nextDevice) {
            deviceInfo = {
                ...nextDevice,
            };
        }

        updateDeviceBadge(deviceInfo);

        if (nextMeasurement) {
            handleMeasurementUpdate(nextMeasurement, 'state');
        }

        runtimeSeconds = Math.round(state?.totalRuntimeSeconds ?? runtimeSeconds);
        applyStatusStyles();
        updateRuntimeDisplay();
        updateReadouts();
    };

    const togglePump = async () => {
        if (!selectors.toggleButton) {
            return;
        }

        selectors.toggleButton.disabled = true;
        selectors.toggleButton.classList.add('opacity-80');

        try {
            const response = await fetch(endpoints.toggle ?? '/pump/toggle', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-CSRF-TOKEN': csrfToken,
                },
                body: JSON.stringify({}),
            });

            if (!response.ok) {
                throw new Error(`Toggle request failed with status ${response.status}`);
            }

            const payload = await response.json();
            applyState(
                payload.state ?? {},
                payload.metricsSeed ?? null,
                payload.telemetry ?? null,
                payload.device ?? null,
                payload.measurement ?? null,
            );

            const commandOn = Boolean(state?.shouldRun ?? state?.isOn);
            const actualOn = Boolean(state?.isOn);
            const actionTitle = commandOn ? 'Orden enviada: encender bomba' : 'Orden enviada: apagar bomba';
            const actionDetails = commandOn
                ? actualOn
                    ? 'La bomba ya reporta estado activo.'
                    : 'El ESP32 recibirá la orden en su próximo polling.'
                : actualOn
                    ? 'Esperando confirmación de parada por parte del hardware.'
                    : 'La bomba ya está detenida.';
            logActivity(actionTitle, actionDetails, commandOn ? 'positive' : 'warning');
        } catch (error) {
            console.error('No se pudo alternar la bomba', error);
            logActivity('Error de comunicación', 'No fue posible enviar el comando. Revisa la conexión.', 'warning');
        } finally {
            selectors.toggleButton.disabled = false;
            selectors.toggleButton.classList.remove('opacity-80');
        }
    };

    const startRuntimeTimer = () => {
        window.setInterval(() => {
            if (state?.isOn) {
                runtimeSeconds += 1;
            }
            updateRuntimeDisplay();
        }, 1000);
    };

    const startTelemetryTimer = () => {
        if (telemetryTimer) {
            return;
        }

        telemetryTimer = window.setInterval(() => {
            void refreshTelemetry(false);
        }, 5000);
    };

    const stopTelemetryTimer = () => {
        if (!telemetryTimer) {
            return;
        }

        window.clearInterval(telemetryTimer);
        telemetryTimer = null;
    };

    const DESIGNER_SVG_NS = 'http://www.w3.org/2000/svg';
    const generateDesignerId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`;

    const getDesignerDefaults = () => ({
        fluidKey: 'water',
        temperature: 20,
        tank: {
            type: 'rectangular',
            base: 2,
            depth: 1.5,
            radius: 0.9,
            height: 3,
            volume: 7.2,
            openToAtmosphere: true,
            gasPressure: 220,
        },
        nodes: [
            { id: 'tank-surface', label: 'Superficie del tanque', type: 'tank-surface', x: 180, height: 2.4, fixed: true, lockHeight: true },
            { id: 'tank-bottom', label: 'Base del tanque', type: 'tank-bottom', x: 180, height: 0, fixed: true, lockHeight: true },
            { id: 'pump-suction', label: 'Bomba • Succión', type: 'pump', x: 420, height: -0.6, submerged: true },
            { id: 'junction-a', label: 'Codo intermedio', type: 'junction', x: 590, height: 1.2 },
            { id: 'discharge', label: 'Descarga', type: 'outlet', x: 780, height: 3 },
        ],
        pipes: [
            { id: 'tank-column', label: 'Columna del tanque', start: 'tank-surface', end: 'tank-bottom', length: 2.4, diameter: 0.4, k: 0 },
            { id: 'pipe-succion', label: 'Succión desde tanque', start: 'tank-bottom', end: 'pump-suction', length: 1.6, diameter: 0.1016, k: 0.5 },
            { id: 'pipe-ascenso', label: 'Ascenso intermedio', start: 'pump-suction', end: 'junction-a', length: 2.8, diameter: 0.0762, k: 0.3 },
            { id: 'pipe-descarga', label: 'Descarga final', start: 'junction-a', end: 'discharge', length: 3.1, diameter: 0.0762, k: 0.3 },
        ],
        selectedElement: { type: 'node', id: 'pump-suction' },
        activePreset: null,
    });

    const DESIGNER_PRESETS = {
        'example-x': {
            name: 'Ejemplo X • Tanque abierto',
            description: 'Refleja un tanque rectangular de 2 m × 1.5 m con nivel a 2.4 m, bomba sumergida y descarga por encima de la superficie. Los valores se comparan contra las fórmulas de Pascal y P = γ·h.',
            state: {
                fluidKey: 'water',
                temperature: 20,
                tank: {
                    type: 'rectangular',
                    base: 2,
                    depth: 1.5,
                    radius: 0.9,
                    height: 3,
                    volume: 7.2,
                    openToAtmosphere: true,
                    gasPressure: 220,
                },
                nodes: [
                    { id: 'tank-surface', label: 'Superficie del tanque', type: 'tank-surface', x: 180, height: 2.4, fixed: true, lockHeight: true },
                    { id: 'tank-bottom', label: 'Base del tanque', type: 'tank-bottom', x: 180, height: 0, fixed: true, lockHeight: true },
                    { id: 'pump-suction', label: 'Bomba • Succión', type: 'pump', x: 420, height: -0.6, submerged: true },
                    { id: 'junction-a', label: 'Codo intermedio', type: 'junction', x: 590, height: 1.2 },
                    { id: 'discharge', label: 'Descarga', type: 'outlet', x: 780, height: 3 },
                ],
                pipes: [
                    { id: 'tank-column', label: 'Columna del tanque', start: 'tank-surface', end: 'tank-bottom', length: 2.4, diameter: 0.4, k: 0 },
                    { id: 'pipe-succion', label: 'Succión desde tanque', start: 'tank-bottom', end: 'pump-suction', length: 1.6, diameter: 0.1016, k: 0.5 },
                    { id: 'pipe-ascenso', label: 'Ascenso intermedio', start: 'pump-suction', end: 'junction-a', length: 2.8, diameter: 0.0762, k: 0.3 },
                    { id: 'pipe-descarga', label: 'Descarga final', start: 'junction-a', end: 'discharge', length: 3.1, diameter: 0.0762, k: 0.3 },
                ],
                selectedElement: { type: 'node', id: 'pump-suction' },
                activePreset: 'example-x',
            },
            reference: {
                tolerance: 0.2,
                fluidHeight: 2.4,
                hydroPressure: 29.37,
                suctionPressure: 130.69,
                nodes: {
                    'tank-bottom': { label: 'Base del tanque', abs: 124.82, gauge: 23.49 },
                    'pump-suction': { label: 'Bomba • Succión', abs: 130.69, gauge: 29.37 },
                    'junction-a': { label: 'Codo intermedio', abs: 113.07, gauge: 11.75 },
                    discharge: { label: 'Descarga', abs: 95.45, gauge: -5.87 },
                },
            },
        },
    };

    let designerState = buildDesignerState();
    let designerDrag = { nodeId: null, offsetX: 0, offsetY: 0, pointerId: null };
    let designerPendingPipe = null;
    let designerCustomMessage = null;
    let designerStatusTimer = null;
    let isDesignerApplyingPreset = false;

    const buildDesignerState = (partial = {}) => {
        const defaults = getDesignerDefaults();
        const sourceNodes = Array.isArray(partial.nodes) ? partial.nodes : defaults.nodes;
        const sourcePipes = Array.isArray(partial.pipes) ? partial.pipes : defaults.pipes;

        return {
            ...defaults,
            ...partial,
            tank: {
                ...defaults.tank,
                ...(partial.tank ?? {}),
            },
            nodes: sourceNodes.map((node) => ({ ...node })),
            pipes: sourcePipes.map((pipe) => ({ ...pipe })),
            selectedElement: partial.selectedElement
                ? { ...partial.selectedElement }
                : { ...defaults.selectedElement },
            activePreset: Object.prototype.hasOwnProperty.call(partial, 'activePreset')
                ? partial.activePreset
                : null,
        };
    };

    const getDesignerNode = (id) => designerState.nodes.find((node) => node.id === id);
    const getDesignerPipe = (id) => designerState.pipes.find((pipe) => pipe.id === id);

    const ensureDesignerSelection = () => {
        const selection = designerState.selectedElement;
        if (selection?.type === 'node' && getDesignerNode(selection.id)) {
            return;
        }
        if (selection?.type === 'pipe' && getDesignerPipe(selection.id)) {
            return;
        }

        const pumpNode = designerState.nodes.find((node) => node.type === 'pump');
        if (pumpNode) {
            designerState.selectedElement = { type: 'node', id: pumpNode.id };
            return;
        }

        if (designerState.nodes.length > 0) {
            designerState.selectedElement = { type: 'node', id: designerState.nodes[0].id };
            return;
        }

        if (designerState.pipes.length > 0) {
            designerState.selectedElement = { type: 'pipe', id: designerState.pipes[0].id };
            return;
        }

        designerState.selectedElement = null;
    };

    const heightToY = (height) => {
        const numeric = Number(height);
        if (!Number.isFinite(numeric)) {
            return DESIGNER_ZERO_Y;
        }
        return DESIGNER_ZERO_Y - numeric * DESIGNER_SCALE;
    };

    const yToHeight = (y) => (DESIGNER_ZERO_Y - y) / DESIGNER_SCALE;

    const markDesignerAsCustom = () => {
        if (!isDesignerApplyingPreset) {
            designerState.activePreset = null;
        }
    };

    const getTankBottomHeight = (currentState) => {
        const bottomNode = currentState.nodes.find((node) => node.type === 'tank-bottom');
        return Number.isFinite(bottomNode?.height) ? bottomNode.height : 0;
    };

    const computeFluidHeightFromVolume = (currentState) => {
        const tank = currentState.tank ?? {};
        const volume = Number(tank.volume);
        if (!Number.isFinite(volume) || volume <= 0) {
            return 0;
        }

        const maxHeight = Number(tank.height);
        const capped = Number.isFinite(maxHeight) && maxHeight > 0 ? maxHeight : undefined;

        if (tank.type === 'cylindrical') {
            const radius = Number(tank.radius);
            if (!Number.isFinite(radius) || radius <= 0) {
                return 0;
            }
            const height = volume / (Math.PI * radius * radius);
            return Number.isFinite(capped) ? clamp(height, 0, capped) : Math.max(0, height);
        }

        const base = Number(tank.base);
        const depth = Number(tank.depth);
        if (!Number.isFinite(base) || !Number.isFinite(depth) || base <= 0 || depth <= 0) {
            return 0;
        }
        const height = volume / (base * depth);
        return Number.isFinite(capped) ? clamp(height, 0, capped) : Math.max(0, height);
    };

    const computeFluidProperties = (currentState) => {
        const fluid = FLUID_DATABASE[currentState.fluidKey] ?? FLUID_DATABASE.water;
        const pressureTop = currentState.tank?.openToAtmosphere
            ? ATM_PRESSURE
            : Number.isFinite(currentState.tank?.gasPressure)
                ? currentState.tank.gasPressure
                : ATM_PRESSURE;
        const density = getDensity(fluid, currentState.temperature, pressureTop);
        const dynamicViscosity = getDynamicViscosity(fluid, currentState.temperature);
        const gamma = Number.isFinite(density) ? (density * 9.80665) / 1000 : null;
        return {
            fluid,
            density,
            dynamicViscosity,
            gamma,
            pressureTop,
        };
    };

    const getDesignerStateValue = (path) => {
        return path.split('.').reduce((accumulator, key) => {
            if (accumulator && Object.prototype.hasOwnProperty.call(accumulator, key)) {
                return accumulator[key];
            }
            return undefined;
        }, designerState);
    };

    const setDesignerStateValue = (path, value) => {
        const segments = path.split('.');
        let pointer = designerState;
        segments.forEach((segment, index) => {
            if (index === segments.length - 1) {
                pointer[segment] = value;
                markDesignerAsCustom();
                return;
            }

            if (typeof pointer[segment] !== 'object' || pointer[segment] === null) {
                pointer[segment] = {};
            }
            pointer = pointer[segment];
        });
    };

    const updateDesignerVisibility = () => {
        const tankType = designerState.tank?.type ?? 'rectangular';
        const isOpen = Boolean(designerState.tank?.openToAtmosphere);
        selectors.designer?.visibilitySections?.forEach((section) => {
            const mode = section.dataset.designerVisibility;
            if (mode === 'rectangular') {
                section.classList.toggle('hidden', tankType !== 'rectangular');
            } else if (mode === 'cylindrical') {
                section.classList.toggle('hidden', tankType !== 'cylindrical');
            } else if (mode === 'closed') {
                section.classList.toggle('hidden', isOpen);
            }
        });
    };

    const syncDesignerDerivedNodes = (snapshot) => {
        const surfaceNode = designerState.nodes.find((node) => node.type === 'tank-surface');
        const bottomNode = designerState.nodes.find((node) => node.type === 'tank-bottom');

        if (surfaceNode && Number.isFinite(snapshot.surfaceHeight)) {
            surfaceNode.height = Number(snapshot.surfaceHeight.toFixed(4));
            if (bottomNode) {
                surfaceNode.x = bottomNode.x;
            }
        }

        if (bottomNode && !Number.isFinite(bottomNode.x)) {
            bottomNode.x = 180;
        }
    };

    const computeDesignerPressures = (currentState, context) => {
        const gamma = Number.isFinite(context.fluidProps?.gamma) ? context.fluidProps.gamma : null;
        const surfacePressure = Number.isFinite(context.surfacePressure) ? context.surfacePressure : ATM_PRESSURE;
        const surfaceHeight = Number.isFinite(context.surfaceHeight) ? context.surfaceHeight : 0;
        const nodes = currentState.nodes ?? [];
        const pipes = currentState.pipes ?? [];

        const nodesById = new Map();
        const pressures = {};

        nodes.forEach((node) => {
            nodesById.set(node.id, node);
            const height = Number(node.height ?? 0);
            let pressureAbs = null;
            if (gamma !== null) {
                pressureAbs = surfacePressure + gamma * (surfaceHeight - height);
            } else if (Number.isFinite(surfacePressure)) {
                pressureAbs = surfacePressure;
            }

            pressures[node.id] = pressureAbs;
        });

        const nodesResults = nodes.map((node) => {
            const pressureAbs = pressures[node.id];
            const pressureGauge = Number.isFinite(pressureAbs) ? pressureAbs - ATM_PRESSURE : null;
            return {
                id: node.id,
                label: node.label ?? node.id,
                height: node.height ?? 0,
                pressureAbs,
                pressureGauge,
            };
        });

        const segments = [];
        pipes.forEach((pipe) => {
            const nodeA = nodesById.get(pipe.start);
            const nodeB = nodesById.get(pipe.end);
            if (!nodeA || !nodeB) {
                return;
            }

            const deltaHeight = (nodeB.height ?? 0) - (nodeA.height ?? 0);
            const basePressure = pressures[nodeA.id];
            const term = gamma !== null ? -gamma * deltaHeight : null;
            const resultingPressure = Number.isFinite(basePressure) && Number.isFinite(term)
                ? basePressure + term
                : null;

            segments.push({
                id: pipe.id,
                label: pipe.label ?? pipe.id,
                from: nodeA,
                to: nodeB,
                deltaHeight,
                term,
                resultingPressure,
            });
        });

        return { pressures, segments, nodesResults };
    };

    const buildDesignerSnapshot = () => {
        const fluidHeight = computeFluidHeightFromVolume(designerState);
        const bottomHeight = getTankBottomHeight(designerState);
        const surfaceHeight = bottomHeight + fluidHeight;
        const tankHeight = Number(designerState.tank?.height);
        const tankTopHeight = Number.isFinite(tankHeight) ? bottomHeight + Math.max(tankHeight, 0) : surfaceHeight;
        const fluidProps = computeFluidProperties(designerState);
        const surfacePressure = fluidProps.pressureTop;

        const snapshot = {
            fluidHeight,
            bottomHeight,
            surfaceHeight,
            tankTopHeight,
            fluidProps,
            surfacePressure,
        };

        syncDesignerDerivedNodes(snapshot);

        const pressuresInfo = computeDesignerPressures(designerState, {
            fluidProps,
            surfacePressure,
            surfaceHeight,
        });

        const pumpNode = designerState.nodes.find((node) => node.type === 'pump');
        const pumpHeight = Number.isFinite(pumpNode?.height) ? pumpNode.height : null;
        const gamma = fluidProps.gamma ?? null;
        const hydroPressure = gamma !== null && pumpHeight !== null && Number.isFinite(surfaceHeight)
            ? gamma * (surfaceHeight - pumpHeight)
            : null;
        const suctionBase = designerState.tank?.openToAtmosphere ? ATM_PRESSURE : fluidProps.pressureTop;
        const suctionPressure = hydroPressure !== null ? suctionBase + hydroPressure : null;

        const targetNodeId = (() => {
            if (designerState.selectedElement?.type === 'node' && getDesignerNode(designerState.selectedElement.id)) {
                return designerState.selectedElement.id;
            }
            if (pumpNode) {
                return pumpNode.id;
            }
            if (designerState.nodes.length > 0) {
                return designerState.nodes[designerState.nodes.length - 1].id;
            }
            return null;
        })();

        const targetPressure = targetNodeId ? pressuresInfo.pressures[targetNodeId] ?? null : null;

        return {
            ...snapshot,
            ...pressuresInfo,
            pumpNode,
            pumpHeight,
            hydroPressure,
            suctionPressure,
            suctionBase,
            targetPressure,
        };
    };

    const formatDesignerNumber = (value, digits = 2, fallback = '—') => {
        if (!Number.isFinite(value)) {
            return fallback;
        }
        return Number(value).toFixed(digits);
    };

    const formatDesignerSigned = (value, digits = 2) => {
        if (!Number.isFinite(value)) {
            return '—';
        }
        const prefix = value >= 0 ? '+' : '−';
        return `${prefix}${Math.abs(value).toFixed(digits)}`;
    };

    const renderDesignerCanvas = (snapshot) => {
        const svg = selectors.designer?.svg;
        if (!svg) {
            return;
        }

        while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
        }

        const width = 960;
        const height = 540;

        const background = document.createElementNS(DESIGNER_SVG_NS, 'rect');
        background.setAttribute('x', '0');
        background.setAttribute('y', '0');
        background.setAttribute('width', String(width));
        background.setAttribute('height', String(height));
        background.setAttribute('fill', 'rgba(15,23,42,0.65)');
        svg.appendChild(background);

        for (let y = 0; y <= height; y += DESIGNER_SCALE) {
            const line = document.createElementNS(DESIGNER_SVG_NS, 'line');
            line.setAttribute('x1', '0');
            line.setAttribute('x2', String(width));
            line.setAttribute('y1', String(y));
            line.setAttribute('y2', String(y));
            line.setAttribute('stroke', 'rgba(148,163,184,0.08)');
            line.setAttribute('stroke-width', '1');
            svg.appendChild(line);

            const level = yToHeight(y);
            const label = document.createElementNS(DESIGNER_SVG_NS, 'text');
            label.setAttribute('x', '10');
            label.setAttribute('y', String(y - 4));
            label.setAttribute('fill', 'rgba(226,232,240,0.35)');
            label.setAttribute('font-size', '10');
            label.textContent = `${formatDesignerNumber(level, 1)} m`;
            svg.appendChild(label);
        }

        const bottomNode = designerState.nodes.find((node) => node.type === 'tank-bottom');
        const tankCenterX = clamp(bottomNode?.x ?? 180, 80, width - 80);
        const tankWidth = 180;
        const bottomY = heightToY(snapshot.bottomHeight);
        const topY = heightToY(snapshot.tankTopHeight);
        const fluidY = heightToY(snapshot.surfaceHeight);
        const tankRect = document.createElementNS(DESIGNER_SVG_NS, 'rect');
        tankRect.setAttribute('x', String(tankCenterX - tankWidth / 2));
        tankRect.setAttribute('y', String(Math.min(topY, bottomY)));
        tankRect.setAttribute('width', String(tankWidth));
        tankRect.setAttribute('height', String(Math.max(bottomY - topY, 24)));
        tankRect.setAttribute('fill', 'rgba(56,189,248,0.04)');
        tankRect.setAttribute('stroke', 'rgba(56,189,248,0.35)');
        tankRect.setAttribute('stroke-width', '2');
        svg.appendChild(tankRect);

        const fluidRect = document.createElementNS(DESIGNER_SVG_NS, 'rect');
        fluidRect.setAttribute('x', String(tankCenterX - tankWidth / 2 + 6));
        const fluidHeightPx = Math.max(bottomY - fluidY - 6, 4);
        fluidRect.setAttribute('y', String(Math.min(fluidY + 6, bottomY - 4)));
        fluidRect.setAttribute('width', String(tankWidth - 12));
        fluidRect.setAttribute('height', String(Math.max(fluidHeightPx, 4)));
        fluidRect.setAttribute('fill', 'rgba(14,165,233,0.35)');
        svg.appendChild(fluidRect);

        const surfaceLine = document.createElementNS(DESIGNER_SVG_NS, 'line');
        surfaceLine.setAttribute('x1', String(tankCenterX - tankWidth / 2));
        surfaceLine.setAttribute('x2', String(tankCenterX + tankWidth / 2));
        surfaceLine.setAttribute('y1', String(fluidY));
        surfaceLine.setAttribute('y2', String(fluidY));
        surfaceLine.setAttribute('stroke', 'rgba(56,189,248,0.75)');
        surfaceLine.setAttribute('stroke-dasharray', '6,4');
        svg.appendChild(surfaceLine);

        const nodePositions = new Map();
        designerState.nodes.forEach((node) => {
            if (!Number.isFinite(node.x)) {
                node.x = tankCenterX;
            }
            const position = {
                x: clamp(node.x, 60, width - 60),
                y: clamp(heightToY(node.height ?? 0), 30, height - 30),
            };
            nodePositions.set(node.id, position);
        });

        designerState.pipes.forEach((pipe) => {
            const start = nodePositions.get(pipe.start);
            const end = nodePositions.get(pipe.end);
            if (!start || !end) {
                return;
            }

            const line = document.createElementNS(DESIGNER_SVG_NS, 'line');
            line.setAttribute('x1', String(start.x));
            line.setAttribute('y1', String(start.y));
            line.setAttribute('x2', String(end.x));
            line.setAttribute('y2', String(end.y));
            line.setAttribute('stroke-width', '4');
            const isSelected = designerState.selectedElement?.type === 'pipe' && designerState.selectedElement.id === pipe.id;
            line.setAttribute('stroke', isSelected ? 'rgba(56,189,248,0.9)' : 'rgba(14,165,233,0.6)');
            line.setAttribute('stroke-linecap', 'round');
            line.dataset.designerPipe = pipe.id;
            svg.appendChild(line);

            const label = document.createElementNS(DESIGNER_SVG_NS, 'text');
            label.setAttribute('x', String((start.x + end.x) / 2));
            label.setAttribute('y', String((start.y + end.y) / 2 - 10));
            label.setAttribute('fill', 'rgba(226,232,240,0.8)');
            label.setAttribute('font-size', '11');
            label.setAttribute('text-anchor', 'middle');
            label.textContent = pipe.label ?? pipe.id;
            svg.appendChild(label);
        });

        designerState.nodes.forEach((node) => {
            const position = nodePositions.get(node.id);
            if (!position) {
                return;
            }

            const group = document.createElementNS(DESIGNER_SVG_NS, 'g');
            group.dataset.designerNode = node.id;

            const circle = document.createElementNS(DESIGNER_SVG_NS, 'circle');
            circle.setAttribute('cx', String(position.x));
            circle.setAttribute('cy', String(position.y));
            circle.setAttribute('r', '14');

            const isSelected = designerState.selectedElement?.type === 'node' && designerState.selectedElement.id === node.id;
            const palette = {
                'tank-surface': 'rgba(56,189,248,0.9)',
                'tank-bottom': 'rgba(56,189,248,0.6)',
                pump: 'rgba(45,212,191,0.9)',
                outlet: 'rgba(74,222,128,0.9)',
                junction: 'rgba(251,191,36,0.9)',
            };
            const stroke = isSelected ? 'rgba(250,250,250,0.85)' : 'rgba(226,232,240,0.35)';
            circle.setAttribute('fill', palette[node.type] ?? 'rgba(248,250,252,0.2)');
            circle.setAttribute('stroke', stroke);
            circle.setAttribute('stroke-width', isSelected ? '3' : '2');
            group.appendChild(circle);

            const label = document.createElementNS(DESIGNER_SVG_NS, 'text');
            label.setAttribute('x', String(position.x));
            label.setAttribute('y', String(position.y - 18));
            label.setAttribute('fill', 'rgba(226,232,240,0.85)');
            label.setAttribute('font-size', '11');
            label.setAttribute('text-anchor', 'middle');
            label.textContent = node.label ?? node.id;
            group.appendChild(label);

            const heightLabel = document.createElementNS(DESIGNER_SVG_NS, 'text');
            heightLabel.setAttribute('x', String(position.x));
            heightLabel.setAttribute('y', String(position.y + 28));
            heightLabel.setAttribute('fill', 'rgba(148,163,184,0.85)');
            heightLabel.setAttribute('font-size', '10');
            heightLabel.setAttribute('text-anchor', 'middle');
            heightLabel.textContent = `h = ${formatDesignerNumber(node.height, 2)} m`;
            group.appendChild(heightLabel);

            svg.appendChild(group);
        });
    };

    const updateDesignerSummary = (snapshot) => {
        const summary = selectors.designer?.summary;
        if (!summary) {
            return;
        }

        if (summary.density) {
            summary.density.textContent = `${formatDesignerNumber(snapshot.fluidProps.density, 1)} kg/m³`;
        }
        if (summary.gamma) {
            summary.gamma.textContent = `${formatDesignerNumber(snapshot.fluidProps.gamma, 3)} kN/m³`;
        }
        if (summary.viscosity) {
            summary.viscosity.textContent = `${formatDesignerNumber(snapshot.fluidProps.dynamicViscosity, 4)} Pa·s`;
        }
        if (summary.surfaceHeight) {
            summary.surfaceHeight.textContent = `${formatDesignerNumber(snapshot.surfaceHeight, 2)} m`; 
        }
        if (summary.surfacePressure) {
            summary.surfacePressure.textContent = `${formatDesignerNumber(snapshot.surfacePressure, 2)} kPa`;
        }
        if (summary.targetPressure) {
            summary.targetPressure.textContent = `${formatDesignerNumber(snapshot.targetPressure, 2)} kPa`;
        }

        const outputs = selectors.designer?.outputs;
        if (!outputs) {
            return;
        }

        const tankHeight = Number(designerState.tank?.height);
        const fillPercent = Number.isFinite(tankHeight) && tankHeight > 0
            ? clamp((snapshot.fluidHeight / tankHeight) * 100, 0, 999)
            : null;

        if (outputs.fluidHeight) {
            outputs.fluidHeight.textContent = `${formatDesignerNumber(snapshot.fluidHeight, 2)} m`;
        }
        if (outputs.fluidNote) {
            if (fillPercent !== null) {
                outputs.fluidNote.textContent = `El tanque está ocupado al ${formatDesignerNumber(fillPercent, 1)} % de su altura útil.`;
            } else {
                outputs.fluidNote.textContent = 'Completa las dimensiones del tanque para evaluar el nivel ocupado.';
            }
        }

        if (outputs.pumpHeight) {
            outputs.pumpHeight.textContent = `${formatDesignerNumber(snapshot.pumpHeight, 2)} m`;
        }
        if (outputs.hydroPressure) {
            outputs.hydroPressure.textContent = `${formatDesignerNumber(snapshot.hydroPressure, 2)} kPa`;
        }
        if (outputs.tankCondition) {
            outputs.tankCondition.textContent = designerState.tank?.openToAtmosphere
                ? 'Tanque abierto → presión superior atmosférica'
                : `Tanque cerrado → Pgas = ${formatDesignerNumber(snapshot.surfacePressure, 2)} kPa`;
        }
        if (outputs.suctionPressure) {
            outputs.suctionPressure.textContent = `${formatDesignerNumber(snapshot.suctionPressure, 2)} kPa`;
        }
        if (outputs.pumpNote) {
            if (!Number.isFinite(snapshot.hydroPressure)) {
                outputs.pumpNote.textContent = 'Define el nivel del fluido y la altura de la bomba para evaluar la presión de succión.';
            } else if (snapshot.hydroPressure >= 0) {
                outputs.pumpNote.textContent = 'Hay carga positiva sobre la succión; verifica cavitación si la altura aumenta.';
            } else {
                outputs.pumpNote.textContent = 'La bomba opera sobre el nivel del fluido. Considera cebado y NPSH disponible.';
            }
        }
    };

    const updateDesignerResults = (snapshot) => {
        const nodesBody = selectors.designer?.resultsNodes;
        const segmentsBody = selectors.designer?.resultsSegments;

        if (nodesBody) {
            nodesBody.innerHTML = '';
            [...snapshot.nodesResults]
                .sort((a, b) => (b.height ?? 0) - (a.height ?? 0))
                .forEach((node) => {
                    const row = document.createElement('tr');
                    row.className = 'hover:bg-slate-900/60';
                    if (designerState.selectedElement?.type === 'node' && designerState.selectedElement.id === node.id) {
                        row.classList.add('bg-sky-500/10');
                    }

                    row.innerHTML = `
                        <td class="px-3 py-2 text-sm text-white">${node.label}</td>
                        <td class="px-3 py-2 text-sm text-white/90">${formatDesignerNumber(node.height, 2)}</td>
                        <td class="px-3 py-2 text-sm text-white/90">${formatDesignerNumber(node.pressureAbs, 2)}</td>
                        <td class="px-3 py-2 text-sm text-white/90">${formatDesignerSigned(node.pressureGauge, 2)}</td>
                    `;
                    nodesBody.appendChild(row);
                });
        }

        if (segmentsBody) {
            segmentsBody.innerHTML = '';
            snapshot.segments.forEach((segment) => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-slate-900/60';
                if (designerState.selectedElement?.type === 'pipe' && designerState.selectedElement.id === segment.id) {
                    row.classList.add('bg-cyan-500/10');
                }

                const sign = segment.term >= 0 ? '+' : '−';
                row.innerHTML = `
                    <td class="px-3 py-2 text-sm text-white">${segment.label}</td>
                    <td class="px-3 py-2 text-sm text-white/90">${formatDesignerNumber(segment.deltaHeight, 2)}</td>
                    <td class="px-3 py-2 text-sm text-white/90">${sign}</td>
                    <td class="px-3 py-2 text-sm text-white/90">${formatDesignerSigned(segment.term, 2)}</td>
                    <td class="px-3 py-2 text-sm text-white/90">${formatDesignerNumber(segment.resultingPressure, 2)} kPa</td>
                `;
                segmentsBody.appendChild(row);
            });
        }
    };

    const updateDesignerFormulas = (snapshot) => {
        const formulas = selectors.designer?.formulas;
        if (!formulas) {
            return;
        }

        if (formulas.hydro) {
            if (!Number.isFinite(snapshot.hydroPressure) || !Number.isFinite(snapshot.surfaceHeight) || !Number.isFinite(snapshot.pumpHeight)) {
                formulas.hydro.textContent = 'Completa la altura del fluido y la posición de la bomba para evaluar P = γ·h.';
            } else {
                const delta = snapshot.surfaceHeight - snapshot.pumpHeight;
                formulas.hydro.textContent = `P_hidro = γ · (h_superficie − h_bomba) = ${formatDesignerNumber(snapshot.fluidProps.gamma, 3)} kN/m³ · (${formatDesignerNumber(delta, 2)} m) = ${formatDesignerNumber(snapshot.hydroPressure, 2)} kPa.`;
            }
        }

        if (formulas.pascal) {
            if (!Number.isFinite(snapshot.targetPressure)) {
                formulas.pascal.textContent = 'Selecciona un nodo objetivo para construir la sumatoria de presiones con Pascal.';
            } else {
                const sumTerm = snapshot.targetPressure - snapshot.surfacePressure;
                formulas.pascal.textContent = `P_obj = P_superficie + Σ(±γΔh) = ${formatDesignerNumber(snapshot.surfacePressure, 2)} kPa ${sumTerm >= 0 ? '+' : '−'} ${formatDesignerNumber(Math.abs(sumTerm), 2)} kPa = ${formatDesignerNumber(snapshot.targetPressure, 2)} kPa.`;
            }
        }

        if (formulas.suction) {
            if (!Number.isFinite(snapshot.suctionPressure) || !Number.isFinite(snapshot.hydroPressure)) {
                formulas.suction.textContent = 'Define el tipo de tanque y la altura de la bomba para utilizar la ecuación de succión.';
            } else {
                const topLabel = designerState.tank?.openToAtmosphere ? 'P_atm' : 'P_gas';
                formulas.suction.textContent = `P_suc = ${topLabel} + P_hidro = ${formatDesignerNumber(snapshot.suctionBase, 2)} kPa ${snapshot.hydroPressure >= 0 ? '+' : '−'} ${formatDesignerNumber(Math.abs(snapshot.hydroPressure), 2)} kPa = ${formatDesignerNumber(snapshot.suctionPressure, 2)} kPa.`;
            }
        }
    };

    const updateDesignerValidation = (snapshot) => {
        const validation = selectors.designer?.validation;
        if (!validation?.card || !validation?.message || !validation?.list) {
            return;
        }

        const presetKey = designerState.activePreset;
        const preset = presetKey ? DESIGNER_PRESETS[presetKey] : null;
        const reference = preset?.reference;

        validation.list.innerHTML = '';

        if (!preset || !reference) {
            validation.card.classList.add('hidden');
            validation.message.textContent = 'Activa un ejemplo guardado para comparar con los resultados del manual.';
            return;
        }

        const tolerancePressure = Number.isFinite(reference.tolerance) ? reference.tolerance : 0.2;
        const toleranceHeight = 0.02;
        validation.card.classList.remove('hidden');
        validation.message.textContent = preset.description ?? 'Comparación con valores de referencia.';

        const appendItem = ({ label, expected, actual, unit, tolerance = tolerancePressure }) => {
            const li = document.createElement('li');

            if (!Number.isFinite(expected) || !Number.isFinite(actual)) {
                li.className = 'text-amber-200';
                li.textContent = `⚠️ ${label}: captura datos para evaluar.`;
                validation.list.appendChild(li);
                return;
            }

            const diff = Math.abs(actual - expected);
            const withinTolerance = diff <= tolerance;
            const status = withinTolerance ? '✅' : '⚠️';
            const colorClass = withinTolerance ? 'text-white/80' : 'text-amber-200';
            const actualText = `${formatDesignerNumber(actual, 2)} ${unit}`;
            const expectedText = `${formatDesignerNumber(expected, 2)} ${unit}`;
            const diffText = `${formatDesignerNumber(diff, 2)} ${unit}`;

            li.className = colorClass;
            li.innerHTML = `${status} <span class="font-semibold">${label}</span>: cálculo ${actualText} • manual ${expectedText} (Δ ${diffText})`;
            validation.list.appendChild(li);
        };

        if (Number.isFinite(reference.fluidHeight)) {
            appendItem({
                label: 'Altura del fluido',
                expected: reference.fluidHeight,
                actual: snapshot.fluidHeight,
                unit: 'm',
                tolerance: toleranceHeight,
            });
        }

        if (Number.isFinite(reference.hydroPressure) && Number.isFinite(snapshot.hydroPressure)) {
            appendItem({
                label: 'P_hidro',
                expected: reference.hydroPressure,
                actual: snapshot.hydroPressure,
                unit: 'kPa',
            });
        }

        if (Number.isFinite(reference.suctionPressure) && Number.isFinite(snapshot.suctionPressure)) {
            appendItem({
                label: 'P_succión',
                expected: reference.suctionPressure,
                actual: snapshot.suctionPressure,
                unit: 'kPa',
            });
        }

        if (reference.nodes && snapshot.pressures) {
            Object.entries(reference.nodes).forEach(([nodeId, nodeReference]) => {
                const nodePressureAbs = snapshot.pressures[nodeId];
                const nodePressureGauge = Number.isFinite(nodePressureAbs) ? nodePressureAbs - ATM_PRESSURE : null;

                appendItem({
                    label: `${nodeReference.label ?? nodeId} · Pabs`,
                    expected: nodeReference.abs,
                    actual: nodePressureAbs,
                    unit: 'kPa',
                });

                appendItem({
                    label: `${nodeReference.label ?? nodeId} · Pg`,
                    expected: nodeReference.gauge,
                    actual: nodePressureGauge,
                    unit: 'kPa',
                });
            });
        }
    };

    const parseDesignerInputValue = (element) => {
        if (element.type === 'checkbox') {
            return element.checked;
        }
        if (element.type === 'number') {
            const parsed = Number(element.value);
            return Number.isFinite(parsed) ? parsed : 0;
        }
        return element.value;
    };

    const updateDesignerSystemForm = (force = false) => {
        const form = selectors.designer?.systemForm;
        if (!form) {
            return;
        }

        form.querySelectorAll('[data-designer-bind]').forEach((input) => {
            const value = getDesignerStateValue(input.dataset.designerBind ?? '');
            if (input.type === 'checkbox') {
                if (force || document.activeElement !== input) {
                    input.checked = Boolean(value);
                }
            } else if (force || document.activeElement !== input) {
                input.value = value ?? '';
            }
        });
    };

    const renderElementField = (html) => {
        const wrapper = document.createElement('div');
        wrapper.innerHTML = html.trim();
        return wrapper.firstElementChild;
    };

    const updateDesignerElementForm = (force = false) => {
        const form = selectors.designer?.elementForm;
        const empty = selectors.designer?.elementEmpty;
        const fieldsContainer = selectors.designer?.elementFields;
        const deleteButton = selectors.designer?.deleteButton;

        if (!form || !fieldsContainer) {
            return;
        }

        const selection = designerState.selectedElement;
        if (!selection) {
            form.classList.add('hidden');
            empty?.classList.remove('hidden');
            if (deleteButton) {
                deleteButton.disabled = true;
            }
            return;
        }

        let entity = null;
        if (selection.type === 'node') {
            entity = getDesignerNode(selection.id);
        } else if (selection.type === 'pipe') {
            entity = getDesignerPipe(selection.id);
        }

        if (!entity) {
            form.classList.add('hidden');
            empty?.classList.remove('hidden');
            if (deleteButton) {
                deleteButton.disabled = true;
            }
            return;
        }

        empty?.classList.add('hidden');
        form.classList.remove('hidden');

        const labelInput = form.querySelector('[data-designer-element-bind="label"]');
        if (labelInput && (force || document.activeElement !== labelInput)) {
            labelInput.value = entity.label ?? '';
            labelInput.disabled = Boolean(entity.fixed);
        }

        fieldsContainer.innerHTML = '';

        if (selection.type === 'node') {
            const info = renderElementField(`
                <div>
                    <p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">Tipo de nodo</p>
                    <p class="mt-1 text-sm text-white">${entity.type === 'pump' ? 'Bomba' : entity.type === 'tank-bottom' ? 'Base del tanque' : entity.type === 'tank-surface' ? 'Superficie del tanque' : entity.type === 'outlet' ? 'Descarga' : 'Nodo intermedio'}</p>
                </div>
            `);
            fieldsContainer.appendChild(info);

            const heightField = renderElementField(`
                <div>
                    <label class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Altura (m)</label>
                    <input type="number" step="0.01" data-designer-element-field="height" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" value="${entity.height ?? 0}" ${entity.lockHeight ? 'disabled' : ''} />
                    <p class="mt-1 text-[10px] text-slate-400">Referencia vertical común para toda la instalación.</p>
                </div>
            `);
            fieldsContainer.appendChild(heightField);

            const positionField = renderElementField(`
                <div>
                    <label class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Posición horizontal</label>
                    <input type="number" step="1" data-designer-element-field="x" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" value="${entity.x ?? 0}" />
                    <p class="mt-1 text-[10px] text-slate-400">Arrastra el nodo o ajusta la coordenada para alinear el diagrama.</p>
                </div>
            `);
            fieldsContainer.appendChild(positionField);

            if (entity.type === 'pump') {
                const pumpField = renderElementField(`
                    <div class="flex items-center gap-3">
                        <input id="designer-element-submerged" type="checkbox" data-designer-element-field="submerged" class="h-4 w-4 rounded border border-white/20 bg-slate-900 text-emerald-400 focus:ring-emerald-400/50" ${entity.submerged ? 'checked' : ''} />
                        <label for="designer-element-submerged" class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Bomba sumergida</label>
                    </div>
                `);
                fieldsContainer.appendChild(pumpField);
            }

            if (deleteButton) {
                deleteButton.disabled = Boolean(entity.fixed);
            }
        } else if (selection.type === 'pipe') {
            const nodesSummary = renderElementField(`
                <div class="grid gap-3 sm:grid-cols-2">
                    <div>
                        <p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">Nodo inicial</p>
                        <p class="mt-1 text-sm text-white">${getDesignerNode(entity.start)?.label ?? entity.start}</p>
                    </div>
                    <div>
                        <p class="text-[10px] uppercase tracking-[0.3em] text-slate-400">Nodo final</p>
                        <p class="mt-1 text-sm text-white">${getDesignerNode(entity.end)?.label ?? entity.end}</p>
                    </div>
                </div>
            `);
            fieldsContainer.appendChild(nodesSummary);

            const lengthField = renderElementField(`
                <div>
                    <label class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Longitud (m)</label>
                    <input type="number" step="0.01" data-designer-element-field="length" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" value="${entity.length ?? 0}" />
                </div>
            `);
            fieldsContainer.appendChild(lengthField);

            const diameterField = renderElementField(`
                <div>
                    <label class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Diámetro interno (m)</label>
                    <input type="number" step="0.001" data-designer-element-field="diameter" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" value="${entity.diameter ?? 0}" />
                </div>
            `);
            fieldsContainer.appendChild(diameterField);

            const minorLossField = renderElementField(`
                <div>
                    <label class="text-[11px] font-medium uppercase tracking-[0.25em] text-slate-300">Coeficiente K (pérdidas menores)</label>
                    <input type="number" step="0.01" data-designer-element-field="k" class="mt-1 w-full rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2 text-sm text-white shadow-inner focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40" value="${entity.k ?? 0}" />
                </div>
            `);
            fieldsContainer.appendChild(minorLossField);

            if (deleteButton) {
                deleteButton.disabled = false;
            }
        }
    };

    const updateDesignerHints = () => {
        const hint = selectors.designer?.hint;
        const overlay = selectors.designer?.hintOverlay;

        let overlayText = 'Arrastra los nodos para ajustar alturas y distancias relativas.';
        if (designerPendingPipe?.start) {
            const startNode = getDesignerNode(designerPendingPipe.start);
            overlayText = `Nodo inicial seleccionado: ${startNode?.label ?? 'N/A'}. Haz clic en el nodo destino.`;
        } else if (designerPendingPipe) {
            overlayText = 'Selecciona el nodo inicial del nuevo tramo.';
        }
        if (overlay) {
            overlay.textContent = overlayText;
        }

        if (designerCustomMessage) {
            if (hint) {
                hint.textContent = designerCustomMessage;
            }
            return;
        }

        let message = 'Haz clic en “Nuevo tramo” y selecciona dos nodos para conectar el circuito.';
        if (designerPendingPipe?.start) {
            const startNode = getDesignerNode(designerPendingPipe.start);
            message = `Nodo inicial: ${startNode?.label ?? 'sin nombre'}. Selecciona el nodo final para crear el tramo.`;
        } else if (designerPendingPipe) {
            message = 'Selecciona el nodo inicial del tramo de tubería.';
        }

        if (hint) {
            hint.textContent = message;
        }
    };

    const clearDesignerMessage = () => {
        designerCustomMessage = null;
        updateDesignerHints();
    };

    const flashDesignerMessage = (message, timeout = 4000) => {
        if (!selectors.designer?.hint) {
            return;
        }
        designerCustomMessage = message;
        updateDesignerHints();
        if (designerStatusTimer) {
            window.clearTimeout(designerStatusTimer);
        }
        designerStatusTimer = window.setTimeout(() => {
            designerStatusTimer = null;
            clearDesignerMessage();
        }, timeout);
    };

    const saveDesignerState = () => {
        try {
            window.localStorage.setItem(DESIGNER_LOCAL_STORAGE_KEY, JSON.stringify(designerState));
            flashDesignerMessage('Diseño guardado en este navegador.');
        } catch (error) {
            console.warn('No se pudo guardar el diseño', error);
            flashDesignerMessage('No se pudo guardar el diseño localmente.', 5000);
        }
    };

    const loadDesignerState = () => {
        try {
            const raw = window.localStorage.getItem(DESIGNER_LOCAL_STORAGE_KEY);
            if (!raw) {
                flashDesignerMessage('No hay un diseño guardado previamente.', 4000);
                return;
            }
            const parsed = JSON.parse(raw);
            if (!Array.isArray(parsed?.nodes) || !Array.isArray(parsed?.pipes)) {
                flashDesignerMessage('El diseño almacenado es incompatible.', 5000);
                return;
            }

            isDesignerApplyingPreset = true;
            try {
                designerState = buildDesignerState(parsed);
            } finally {
                isDesignerApplyingPreset = false;
            }
            designerPendingPipe = null;
            ensureDesignerSelection();
            flashDesignerMessage('Diseño restaurado correctamente.');
            refreshDesigner({ forceForms: true });
        } catch (error) {
            console.warn('No se pudo cargar el diseño guardado', error);
            flashDesignerMessage('Error al cargar el diseño almacenado.', 5000);
        }
    };

    const loadDesignerPreset = (key) => {
        if (!key) {
            flashDesignerMessage('Selecciona un ejemplo válido para cargar.', 4000);
            return;
        }

        const preset = DESIGNER_PRESETS[key];
        if (!preset) {
            flashDesignerMessage('No se encontró el ejemplo solicitado.', 5000);
            return;
        }

        isDesignerApplyingPreset = true;
        try {
            designerState = buildDesignerState({
                ...(preset.state ?? {}),
                activePreset: key,
            });
        } finally {
            isDesignerApplyingPreset = false;
        }
        designerPendingPipe = null;
        ensureDesignerSelection();
        flashDesignerMessage(`${preset.name} cargado. ${preset.description}`);
        refreshDesigner({ forceForms: true });
    };

    const handleDesignerPipeSelection = (nodeId) => {
        if (!designerPendingPipe) {
            return;
        }

        if (!designerPendingPipe.start) {
            designerPendingPipe.start = nodeId;
            updateDesignerHints();
            return;
        }

        if (designerPendingPipe.start === nodeId) {
            designerPendingPipe = null;
            flashDesignerMessage('Se canceló la creación del tramo.');
            updateDesignerHints();
            return;
        }

        const existing = designerState.pipes.find((pipe) => {
            return (
                (pipe.start === designerPendingPipe.start && pipe.end === nodeId)
                || (pipe.start === nodeId && pipe.end === designerPendingPipe.start)
            );
        });

        if (existing) {
            designerPendingPipe = null;
            flashDesignerMessage('Los nodos ya están conectados. Ajusta el tramo existente.');
            updateDesignerHints();
            return;
        }

        const newPipe = {
            id: generateDesignerId('pipe'),
            label: `Tramo ${designerState.pipes.length + 1}`,
            start: designerPendingPipe.start,
            end: nodeId,
            length: 1,
            diameter: 0.05,
            k: 0,
        };
        designerState.pipes.push(newPipe);
        designerState.selectedElement = { type: 'pipe', id: newPipe.id };
        designerPendingPipe = null;
        markDesignerAsCustom();
        flashDesignerMessage('Tramo añadido. Ajusta longitud y diámetro en la columna derecha.');
        refreshDesigner({ forceForms: true });
    };

    const handleDesignerAction = (action, payload = {}) => {
        if (!action) {
            return;
        }

        switch (action) {
            case 'reset':
                isDesignerApplyingPreset = true;
                designerState = buildDesignerState();
                designerPendingPipe = null;
                isDesignerApplyingPreset = false;
                flashDesignerMessage('Se restauró el diseño base de referencia.');
                refreshDesigner({ forceForms: true });
                break;
            case 'add-node': {
                const bottom = getTankBottomHeight(designerState);
                const newNode = {
                    id: generateDesignerId('node'),
                    label: `Nodo ${designerState.nodes.length + 1}`,
                    type: 'junction',
                    x: 300 + designerState.nodes.length * 40,
                    height: Number((bottom + 1).toFixed(2)),
                };
                designerState.nodes.push(newNode);
                designerState.selectedElement = { type: 'node', id: newNode.id };
                designerPendingPipe = null;
                markDesignerAsCustom();
                flashDesignerMessage('Nodo agregado. Ajusta su altura y posición.');
                refreshDesigner({ forceForms: true });
                break;
            }
            case 'add-pipe':
                designerPendingPipe = {};
                designerCustomMessage = null;
                updateDesignerHints();
                flashDesignerMessage('Selecciona el nodo inicial del nuevo tramo.');
                break;
            case 'save':
                saveDesignerState();
                break;
            case 'load':
                loadDesignerState();
                break;
            case 'delete-element':
                handleDeleteSelectedElement();
                break;
            case 'load-preset':
                loadDesignerPreset(payload?.preset ?? '');
                break;
            default:
                break;
        }
    };

    const handleDesignerSystemChange = (event) => {
        const target = event.target;
        if (!target || !target.dataset.designerBind) {
            return;
        }
        const value = parseDesignerInputValue(target);
        setDesignerStateValue(target.dataset.designerBind, value);

        if (target.dataset.designerBind === 'tank.type') {
            if (value === 'cylindrical' && !Number.isFinite(designerState.tank.radius)) {
                designerState.tank.radius = getDesignerDefaults().tank.radius;
            }
        }

        ensureDesignerSelection();
        refreshDesigner({ skipForms: true });
    };

    const handleDesignerElementInput = (event) => {
        const target = event.target;
        if (!target) {
            return;
        }

        const selection = designerState.selectedElement;
        if (!selection) {
            return;
        }

        if (target.dataset.designerElementBind === 'label') {
            const value = target.value;
            if (selection.type === 'node') {
                const node = getDesignerNode(selection.id);
                if (node && !node.fixed) {
                    node.label = value;
                }
            } else if (selection.type === 'pipe') {
                const pipe = getDesignerPipe(selection.id);
                if (pipe) {
                    pipe.label = value;
                }
            }
            markDesignerAsCustom();
            refreshDesigner({ skipForms: true });
            return;
        }

        if (!target.dataset.designerElementField) {
            return;
        }

        const value = parseDesignerInputValue(target);

        if (selection.type === 'node') {
            const node = getDesignerNode(selection.id);
            if (!node) {
                return;
            }
            if (target.dataset.designerElementField === 'height' && !node.lockHeight) {
                node.height = Number(value);
            } else if (target.dataset.designerElementField === 'x') {
                node.x = Number(value);
            } else if (target.dataset.designerElementField === 'submerged') {
                node.submerged = Boolean(value);
            }
            markDesignerAsCustom();
        } else if (selection.type === 'pipe') {
            const pipe = getDesignerPipe(selection.id);
            if (!pipe) {
                return;
            }

            if (target.dataset.designerElementField === 'length') {
                pipe.length = Number(value);
            } else if (target.dataset.designerElementField === 'diameter') {
                pipe.diameter = Number(value);
            } else if (target.dataset.designerElementField === 'k') {
                pipe.k = Number(value);
            }
            markDesignerAsCustom();
        }

        refreshDesigner({ skipForms: true });
    };

    const handleDeleteSelectedElement = () => {
        const selection = designerState.selectedElement;
        if (!selection) {
            flashDesignerMessage('Selecciona un nodo o tramo para eliminar.', 4000);
            return;
        }

        if (selection.type === 'node') {
            const node = getDesignerNode(selection.id);
            if (!node || node.fixed) {
                flashDesignerMessage('Este nodo forma parte de la referencia del tanque y no puede eliminarse.', 5000);
                return;
            }
            designerState.nodes = designerState.nodes.filter((item) => item.id !== selection.id);
            designerState.pipes = designerState.pipes.filter((pipe) => pipe.start !== selection.id && pipe.end !== selection.id);
            designerState.selectedElement = null;
            flashDesignerMessage('Nodo eliminado junto con sus conexiones.');
        } else if (selection.type === 'pipe') {
            designerState.pipes = designerState.pipes.filter((pipe) => pipe.id !== selection.id);
            designerState.selectedElement = null;
            flashDesignerMessage('Tramo eliminado.');
        }

        markDesignerAsCustom();
        ensureDesignerSelection();
        refreshDesigner({ forceForms: true });
    };

    const handleDesignerPointerDown = (event) => {
        const svg = selectors.designer?.svg;
        if (!svg) {
            return;
        }

        const nodeElement = event.target.closest('[data-designer-node]');
        const pipeElement = event.target.closest('[data-designer-pipe]');

        if (nodeElement) {
            const nodeId = nodeElement.dataset.designerNode;
            if (designerPendingPipe) {
                handleDesignerPipeSelection(nodeId);
                event.preventDefault();
                return;
            }

            designerState.selectedElement = { type: 'node', id: nodeId };
            ensureDesignerSelection();
            const rect = svg.getBoundingClientRect();
            const pointerX = event.clientX - rect.left;
            const pointerY = event.clientY - rect.top;
            const node = getDesignerNode(nodeId);
            if (node) {
                const pos = {
                    x: clamp(node.x ?? pointerX, 60, 900),
                    y: clamp(heightToY(node.height ?? 0), 30, 510),
                };
                designerDrag = {
                    nodeId,
                    offsetX: pointerX - pos.x,
                    offsetY: pointerY - pos.y,
                    pointerId: event.pointerId,
                };
                svg.setPointerCapture(event.pointerId);
            }
            refreshDesigner({ forceForms: true });
            event.preventDefault();
            return;
        }

        if (pipeElement) {
            const pipeId = pipeElement.dataset.designerPipe;
            designerState.selectedElement = { type: 'pipe', id: pipeId };
            designerPendingPipe = null;
            refreshDesigner({ forceForms: true });
            event.preventDefault();
            return;
        }

        if (designerPendingPipe) {
            designerPendingPipe = null;
            flashDesignerMessage('Se canceló la creación del tramo.');
            updateDesignerHints();
        }
    };

    const handleDesignerPointerMove = (event) => {
        if (!designerDrag?.nodeId) {
            return;
        }

        const svg = selectors.designer?.svg;
        if (!svg) {
            return;
        }

        const node = getDesignerNode(designerDrag.nodeId);
        if (!node) {
            return;
        }

        const rect = svg.getBoundingClientRect();
        const pointerX = event.clientX - rect.left;
        const pointerY = event.clientY - rect.top;
        const newX = clamp(pointerX - designerDrag.offsetX, 60, 900);
        const newY = clamp(pointerY - designerDrag.offsetY, 30, 510);
        node.x = newX;
        if (!node.lockHeight) {
            node.height = Number(yToHeight(newY).toFixed(3));
        }
        markDesignerAsCustom();
        refreshDesigner({ skipForms: true });
    };

    const handleDesignerPointerUp = (event) => {
        if (designerDrag.pointerId !== event.pointerId) {
            return;
        }
        const svg = selectors.designer?.svg;
        if (svg && svg.hasPointerCapture(event.pointerId)) {
            svg.releasePointerCapture(event.pointerId);
        }
        designerDrag = { nodeId: null, offsetX: 0, offsetY: 0, pointerId: null };
        refreshDesigner({ forceForms: true });
    };

    refreshDesigner = (options = {}) => {
        const { forceForms = false, skipForms = false } = options;
        ensureDesignerSelection();
        updateDesignerVisibility();
        const snapshot = buildDesignerSnapshot();
        renderDesignerCanvas(snapshot);
        updateDesignerSummary(snapshot);
        updateDesignerResults(snapshot);
        updateDesignerFormulas(snapshot);
        updateDesignerValidation(snapshot);
        updateDesignerHints();
        if (!skipForms) {
            updateDesignerSystemForm(forceForms);
            updateDesignerElementForm(forceForms);
        } else {
            updateDesignerElementForm(false);
        }
    };

    const initDesigner = () => {
        if (!selectors.designer?.panel) {
            return;
        }

        try {
            const stored = window.localStorage.getItem(DESIGNER_LOCAL_STORAGE_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && Array.isArray(parsed.nodes) && Array.isArray(parsed.pipes)) {
                    designerState = {
                        ...getDesignerDefaults(),
                        ...parsed,
                        tank: {
                            ...getDesignerDefaults().tank,
                            ...(parsed.tank ?? {}),
                        },
                        nodes: parsed.nodes.map((node) => ({ ...node })),
                        pipes: parsed.pipes.map((pipe) => ({ ...pipe })),
                    };
                }
            }
        } catch (error) {
            console.warn('No se pudo inicializar el diseñador con datos previos', error);
        }

        ensureDesignerSelection();
        refreshDesigner({ forceForms: true });

        selectors.designer.openButtons?.forEach((button) => {
            button.addEventListener('click', () => {
                toggleDesignerPanel(true);
            });
        });

        selectors.designer.closeButtons?.forEach((button) => {
            button.addEventListener('click', () => {
                toggleDesignerPanel(false);
            });
        });

        root.addEventListener('click', (event) => {
            const openTrigger = event.target.closest('[data-designer-open]');
            if (openTrigger) {
                event.preventDefault();
                toggleDesignerPanel(true);
                return;
            }

            const closeTrigger = event.target.closest('[data-designer-close], [data-designer-action="close"]');
            if (closeTrigger) {
                event.preventDefault();
                toggleDesignerPanel(false);
            }
        });

        selectors.designer.toolbarButtons?.forEach((button) => {
            const action = button.dataset.designerAction;
            button.addEventListener('click', () => handleDesignerAction(action, {
                preset: button.dataset.designerPreset ?? null,
            }));
        });

        selectors.designer.systemForm?.addEventListener('input', handleDesignerSystemChange);
        selectors.designer.systemForm?.addEventListener('change', handleDesignerSystemChange);

        selectors.designer.elementForm?.addEventListener('input', handleDesignerElementInput);
        selectors.designer.elementForm?.addEventListener('change', handleDesignerElementInput);

        selectors.designer.deleteButton?.addEventListener('click', () => handleDesignerAction('delete-element'));

        if (selectors.designer.svg) {
            selectors.designer.svg.addEventListener('pointerdown', handleDesignerPointerDown);
            selectors.designer.svg.addEventListener('pointermove', handleDesignerPointerMove);
            selectors.designer.svg.addEventListener('pointerup', handleDesignerPointerUp);
            selectors.designer.svg.addEventListener('pointerleave', handleDesignerPointerUp);
        }
    };

    const startTelemetryStream = () => {
        if (!('EventSource' in window) || !endpoints.stream) {
            startTelemetryTimer();
            return;
        }

        try {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }

            const streamUrl = (() => {
                try {
                    const url = new URL(endpoints.stream, window.location.origin);
                    if (deviceInfo?.id) {
                        url.searchParams.set('device_id', deviceInfo.id);
                    }
                    if (measurement?.id) {
                        url.searchParams.set('last_id', measurement.id);
                    }
                    return url.toString();
                } catch (error) {
                    return endpoints.stream;
                }
            })();

            eventSource = new EventSource(streamUrl);

            eventSource.addEventListener('open', () => {
                stopTelemetryTimer();
            });

            eventSource.addEventListener('telemetry.updated', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    handleMeasurementUpdate(data, 'stream');
                } catch (error) {
                    console.warn('No se pudo interpretar la telemetría en streaming', error);
                }
            });

            eventSource.addEventListener('error', () => {
                if (eventSource) {
                    eventSource.close();
                    eventSource = null;
                }

                startTelemetryTimer();

                window.setTimeout(() => {
                    startTelemetryStream();
                }, 5000);
            });
        } catch (error) {
            console.error('No se pudo iniciar el canal SSE', error);
            startTelemetryTimer();
        }
    };

    const bootstrap = async () => {
        await ensureChartReady();
        seedCharts();
        initDesigner();
        applyStatusStyles();
        updateRuntimeDisplay();
        updateReadouts();
        updateFluidCards();
        updateDeviceBadge(deviceInfo);
        startRuntimeTimer();
        await refreshTelemetry();
        startTelemetryStream();

        if (selectors.toggleButton) {
            selectors.toggleButton.addEventListener('click', togglePump);
        }

        selectors.fluidOpenButtons.forEach((button) => {
            button.addEventListener('click', () => toggleFluidPanel(true));
        });

        selectors.fluidCloseButtons.forEach((button) => {
            button.addEventListener('click', () => toggleFluidPanel(false));
        });

        selectors.calculatorOpenButtons.forEach((button) => {
            button.addEventListener('click', () => {
                handleCalculatorUpdate();
                toggleCalculatorPanel(true);
            });
        });

        selectors.calculatorCloseButtons.forEach((button) => {
            button.addEventListener('click', () => toggleCalculatorPanel(false));
        });

        if (selectors.calculatorForm) {
            selectors.calculatorForm.addEventListener('submit', (event) => {
                event.preventDefault();
                handleCalculatorUpdate();
            });

            selectors.calculatorForm.addEventListener('input', () => {
                handleCalculatorUpdate();
            });

            selectors.calculatorForm.addEventListener('change', () => {
                handleCalculatorUpdate();
            });

            handleCalculatorUpdate();
        }

        if (selectors.calculatorTableToggle && selectors.calculatorTables) {
            selectors.calculatorTableToggle.addEventListener('click', () => {
                const isHidden = selectors.calculatorTables.classList.contains('hidden');
                selectors.calculatorTables.classList.toggle('hidden', !isHidden);
                selectors.calculatorTableToggle.classList.toggle('border-cyan-400', isHidden);
                selectors.calculatorTableToggle.classList.toggle('text-cyan-100', isHidden);
                selectors.calculatorTableToggle.classList.toggle('border-slate-700', !isHidden);
                selectors.calculatorTableToggle.classList.toggle('text-slate-200', !isHidden);
                selectors.calculatorTableToggle.setAttribute('aria-expanded', isHidden ? 'true' : 'false');
            });
        }

        document.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') {
                return;
            }

            let handled = false;

            if (selectors.designer?.panel && !selectors.designer.panel.classList.contains('hidden')) {
                toggleDesignerPanel(false);
                handled = true;
            }

            if (selectors.calculatorPanel && !selectors.calculatorPanel.classList.contains('hidden')) {
                toggleCalculatorPanel(false);
                handled = true;
            }

            if (selectors.fluidPanel && !selectors.fluidPanel.classList.contains('hidden')) {
                toggleFluidPanel(false);
                handled = true;
            }

            if (handled) {
                event.preventDefault();
            }
        });

        window.addEventListener('beforeunload', () => {
            if (eventSource) {
                eventSource.close();
                eventSource = null;
            }
            stopTelemetryTimer();
        });
    };

    bootstrap();
}
