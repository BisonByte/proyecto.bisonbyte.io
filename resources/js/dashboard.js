const initializeDashboard = () => {
    const root = document.getElementById('dashboard-app');
    if (!root) {
        return false;
    }

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
    const hydraulicDesignerUrl = root.dataset.hydraulicUrl ?? '';
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
        hydraulicAnchorButtons: root.querySelectorAll('[data-hydraulic-anchor]'),
        hydraulicRoot: root.querySelector('#hydraulic-designer-root'),
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

    let runtimeSeconds = Math.round(state?.totalRuntimeSeconds ?? 0);
    telemetry = {
        voltage: telemetry?.voltage ?? metricsSeed?.voltage ?? 0,
        current: telemetry?.current ?? metricsSeed?.current ?? 0,
        battery: telemetry?.battery ?? metricsSeed?.battery ?? 90,
    };

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
    measurement = normalizeMeasurement(measurement);
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
        compressibilityUnit: document.querySelector('[data-calculator-output="compressibility-unit"]'),
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

    const toSuperscript = (value) => {
        const map = {
            '-': '⁻',
            0: '⁰',
            1: '¹',
            2: '²',
            3: '³',
            4: '⁴',
            5: '⁵',
            6: '⁶',
            7: '⁷',
            8: '⁸',
            9: '⁹',
        };

        return String(value)
            .split('')
            .map((char) => map[char] ?? char)
            .join('');
    };

    const formatScientific = (value, digits = 2) => {
        if (!Number.isFinite(value) || value === 0) {
            return '0';
        }

        const [coefficient, exponent] = value.toExponential(digits).split('e');
        const normalized = Number.parseFloat(coefficient).toLocaleString('es-MX', {
            minimumFractionDigits: Math.max(0, digits),
            maximumFractionDigits: Math.max(0, digits),
        });
        const exponentValue = Number.parseInt(exponent, 10);
        return `${normalized} × 10${toSuperscript(exponentValue)}`;
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

            const timeout = window.setTimeout(() => {
                window.clearInterval(timer);
                resolve(null);
            }, 3000);

            const timer = window.setInterval(() => {
                if (typeof window.Chart !== 'undefined') {
                    window.clearInterval(timer);
                    window.clearTimeout(timeout);
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
        if (isPanelOpen(selectors.fluidPanel) || isPanelOpen(selectors.calculatorPanel)) {
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
        selectors.fluidOpenButtons.forEach((button) => {
            button.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        if (open) {
            window.requestAnimationFrame(() => {
                selectors.fluidPanel?.focus();
            });
        }

        syncBodyOverflow();
    };

    const toggleCalculatorPanel = (open) => {
        if (!selectors.calculatorPanel) {
            return;
        }

        selectors.calculatorPanel.classList.toggle('hidden', !open);
        selectors.calculatorPanel.classList.toggle('flex', open);
        selectors.calculatorPanel.setAttribute('aria-hidden', open ? 'false' : 'true');
        selectors.calculatorOpenButtons.forEach((button) => {
            button.setAttribute('aria-expanded', open ? 'true' : 'false');
        });

        if (open) {
            window.requestAnimationFrame(() => {
                selectors.calculatorPanel?.focus();
            });
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

            return value >= 0.01 ? formatFixed(value, 3, 3) : formatScientific(value, 2);
        };

        const formatKinematicViscosity = (value) => {
            if (!Number.isFinite(value)) {
                return '—';
            }

            return value >= 1e-4 ? formatFixed(value, 5, 5) : formatScientific(value, 2);
        };

        const fluidTypeLabel = result.fluid.type === 'gas' ? 'Gas' : 'Líquido';
        const compressibilityDisplay = (() => {
            if (!Number.isFinite(result.compressibilityValue)) {
                return { value: '—', unit: '—' };
            }

            if (result.compressibilityType === 'factor') {
                return { value: formatFixed(result.compressibilityValue, 3, 3), unit: 'adim.' };
            }

            return { value: formatScientific(result.compressibilityValue, 2), unit: 'Pa⁻¹' };
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
        calculatorOutputs.compressibility.textContent = compressibilityDisplay.value;
        if (calculatorOutputs.compressibilityUnit) {
            calculatorOutputs.compressibilityUnit.textContent = compressibilityDisplay.unit;
        }
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
        const chartReadyPromise = ensureChartReady();

        applyStatusStyles();
        updateRuntimeDisplay();
        updateReadouts();
        updateFluidCards();
        updateDeviceBadge(deviceInfo);
        startRuntimeTimer();

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

        selectors.hydraulicAnchorButtons.forEach((anchor) => {
            anchor.addEventListener('click', (event) => {
                if (event.defaultPrevented) {
                    return;
                }

                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
                    return;
                }

                const targetSelector = anchor.dataset.hydraulicTarget ?? '#hydraulic-designer-root';
                const hydraulicRoot = root.querySelector(targetSelector) ?? selectors.hydraulicRoot;
                const designerReady = hydraulicRoot && hydraulicRoot.childElementCount > 0;

                if (!designerReady) {
                    if (hydraulicDesignerUrl && anchor.getAttribute('href') !== hydraulicDesignerUrl) {
                        anchor.setAttribute('href', hydraulicDesignerUrl);
                    }
                    return;
                }

                event.preventDefault();
                hydraulicRoot.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                });

                if (typeof hydraulicRoot.focus === 'function') {
                    hydraulicRoot.focus({ preventScroll: true });
                }

                hydraulicRoot.classList.add('hydraulic-highlight');

                if (window?.history?.replaceState) {
                    window.history.replaceState(null, '', '#hydraulic-designer-root');
                } else {
                    window.location.hash = 'hydraulic-designer-root';
                }

                window.setTimeout(() => {
                    hydraulicRoot?.classList.remove('hydraulic-highlight');
                }, 1200);
            });
        });

        selectors.fluidOpenButtons.forEach((button) => {
            button.setAttribute('aria-expanded', 'false');
        });

        selectors.calculatorOpenButtons.forEach((button) => {
            button.setAttribute('aria-expanded', 'false');
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

        await chartReadyPromise;
        seedCharts();
        await refreshTelemetry();
        startTelemetryStream();
    };

    bootstrap();
    return true;
};

if (!initializeDashboard()) {
    window.addEventListener('DOMContentLoaded', () => {
        initializeDashboard();
    });
}
