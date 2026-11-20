/**
 * 3D Quantum Bloch-Sphere & Relativistic Hologram Portrait Engine
 * Zero external dependencies — dual HTML5 Canvas + CSS 3D depth rig.
 */
(function () {
    'use strict';

    const stage = document.getElementById('quantumStage');
    const canvasBack = document.getElementById('quantumCanvasBack');
    const canvasFront = document.getElementById('quantumCanvasFront');
    const rig = document.getElementById('quantumRig');
    const flipper = document.getElementById('quantumFlipper');
    const flipBtn = document.getElementById('quantumFlipBtn');
    const stateLabel = document.getElementById('quantumStateLabel');

    if (!stage || !canvasBack || !canvasFront || !rig || !flipper) {
        return;
    }

    const ctxBack = canvasBack.getContext('2d');
    const ctxFront = canvasFront.getContext('2d');
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let width = 400;
    let height = 440;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    // Pointer-tracked 3D gimbal tilt state
    let targetTiltX = 0;
    let targetTiltY = 0;
    let tiltX = 0;
    let tiltY = 0;
    let sheenX = 50;
    let sheenY = 35;

    let isFlipped = false;
    let isVisible = true;
    let rafId = null;
    let lastTime = performance.now();
    let simTime = 0;

    // Expanding quantum wave pulses triggered on click / X-Gate flip
    const pulses = [];

    // Live CSS custom property palette
    let palette = {
        accentRgb: '139, 0, 255',
        accent2Rgb: '168, 85, 247',
        cyanRgb: '56, 189, 248',
        isLight: false
    };

    function readPalette() {
        const styles = getComputedStyle(document.documentElement);
        const accentRgb = styles.getPropertyValue('--accent-rgb').trim() || '139, 0, 255';
        const accent2Rgb = styles.getPropertyValue('--accent-2-rgb').trim() || '168, 85, 247';
        const isLight = document.documentElement.getAttribute('data-theme') === 'light';
        palette = {
            accentRgb,
            accent2Rgb,
            cyanRgb: isLight ? '2, 132, 199' : '56, 189, 248',
            isLight
        };
    }

    // 3D rotation & perspective projection
    function rotate3D(x, y, z, rx, ry, rz) {
        // Rotate X
        const cx = Math.cos(rx), sx = Math.sin(rx);
        const y1 = y * cx - z * sx;
        const z1 = y * sx + z * cx;
        // Rotate Y
        const cy = Math.cos(ry), sy = Math.sin(ry);
        const x2 = x * cy + z1 * sy;
        const z2 = -x * sy + z1 * cy;
        // Rotate Z
        const cz = Math.cos(rz), sz = Math.sin(rz);
        return {
            x: x2 * cz - y1 * sz,
            y: x2 * sz + y1 * cz,
            z: z2
        };
    }

    function project(p, fov, centerX, centerY) {
        const scale = fov / (fov - p.z);
        return {
            sx: centerX + p.x * scale,
            sy: centerY + p.y * scale,
            scale,
            z: p.z
        };
    }

    // Orbital plane definitions (tilted Bohr + Bloch shells)
    const orbitals = [
        { rx: 1.05, ry: 0.25, rz: 0.35, radius: 158, speed: 0.85, colorKey: 'accentRgb', phase: 0.2 },
        { rx: -0.95, ry: 0.42, rz: -0.78, radius: 168, speed: -0.72, colorKey: 'cyanRgb', phase: 2.3 },
        { rx: 0.38, ry: -0.88, rz: 1.15, radius: 146, speed: 1.05, colorKey: 'accent2Rgb', phase: 4.1 }
    ];

    // Ambient quantum field particles
    const fieldParticles = [];
    for (let i = 0; i < 36; i++) {
        const theta = (i / 36) * Math.PI * 2 * 3.7;
        const phi = Math.acos(1 - 2 * ((i + 0.5) / 36));
        const r = 132 + (i % 5) * 14;
        fieldParticles.push({
            theta,
            phi,
            r,
            speed: (0.22 + (i % 4) * 0.08) * (i % 2 === 0 ? 1 : -1),
            size: 1.6 + (i % 3) * 0.65,
            useCyan: i % 3 === 0
        });
    }

    function resizeCanvases() {
        const rect = stage.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        width = rect.width;
        height = rect.height;
        dpr = Math.min(window.devicePixelRatio || 1, 2);

        [canvasBack, canvasFront].forEach((canvas) => {
            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);
        });
    }

    function drawSplitRing(radius, tiltRx, tiltRy, tiltRz, colorRgb, alphaBase, lineWidth, segments, globalRy, globalRx) {
        const cx = width * 0.5;
        const cy = height * 0.49;
        const fov = 560;
        const scaleFactor = Math.min(width, height) / 420;
        const scaledR = radius * scaleFactor;

        let prev = null;
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const localX = Math.cos(angle) * scaledR;
            const localY = Math.sin(angle) * scaledR;

            const tilted = rotate3D(localX, localY, 0, tiltRx, tiltRy, tiltRz);
            const world = rotate3D(tilted.x, tilted.y, tilted.z, globalRx, globalRy, 0);
            const proj = project(world, fov, cx, cy);

            if (prev) {
                const avgZ = (prev.z + proj.z) * 0.5;
                const isFront = avgZ >= 0;
                const ctx = isFront ? ctxFront : ctxBack;
                const depthNorm = Math.max(0, Math.min(1, (avgZ + scaledR) / (2 * scaledR)));
                const alpha = alphaBase * (isFront ? (0.45 + 0.55 * depthNorm) : (0.14 + 0.25 * depthNorm));

                ctx.beginPath();
                ctx.moveTo(prev.sx, prev.sy);
                ctx.lineTo(proj.sx, proj.sy);
                ctx.strokeStyle = `rgba(${colorRgb}, ${alpha.toFixed(3)})`;
                ctx.lineWidth = lineWidth * (isFront ? 1.15 : 0.85);
                ctx.stroke();
            }
            prev = proj;
        }
    }

    function drawElectronNode(orb, time, globalRx, globalRy) {
        const cx = width * 0.5;
        const cy = height * 0.49;
        const fov = 560;
        const scaleFactor = Math.min(width, height) / 420;
        const scaledR = orb.radius * scaleFactor;
        const colorRgb = palette[orb.colorKey];

        // Draw short fading trail + bright core particle
        const trailSteps = 10;
        for (let s = trailSteps; s >= 0; s--) {
            const angle = orb.phase + time * orb.speed - s * 0.075;
            const localX = Math.cos(angle) * scaledR;
            const localY = Math.sin(angle) * scaledR;

            const tilted = rotate3D(localX, localY, 0, orb.rx, orb.ry, orb.rz);
            const world = rotate3D(tilted.x, tilted.y, tilted.z, globalRx, globalRy, 0);
            const proj = project(world, fov, cx, cy);

            const ctx = world.z >= 0 ? ctxFront : ctxBack;
            const fade = (1 - s / (trailSteps + 1));
            const radius = (s === 0 ? 4.4 : 2.8) * proj.scale * fade;

            if (s === 0) {
                const grad = ctx.createRadialGradient(proj.sx, proj.sy, 0, proj.sx, proj.sy, radius * 3.8);
                grad.addColorStop(0, `rgba(255, 255, 255, 0.95)`);
                grad.addColorStop(0.35, `rgba(${colorRgb}, 0.85)`);
                grad.addColorStop(1, `rgba(${colorRgb}, 0)`);
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(proj.sx, proj.sy, radius * 3.8, 0, Math.PI * 2);
                ctx.fill();
            } else {
                ctx.fillStyle = `rgba(${colorRgb}, ${(0.45 * fade * fade).toFixed(3)})`;
                ctx.beginPath();
                ctx.arc(proj.sx, proj.sy, Math.max(0.9, radius), 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }

    function renderFrame(time) {
        ctxBack.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctxFront.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctxBack.clearRect(0, 0, width, height);
        ctxFront.clearRect(0, 0, width, height);

        const globalRx = -tiltX * 0.018 + Math.sin(time * 0.55) * 0.08;
        const globalRy = tiltY * 0.018 + time * 0.14;

        // Subtle Bloch Sphere meridians (rear & front split)
        const blochAlpha = palette.isLight ? 0.34 : 0.28;
        drawSplitRing(136, Math.PI * 0.5, 0, 0, palette.accent2Rgb, blochAlpha, 1.0, 56, globalRy, globalRx);
        drawSplitRing(136, 0, Math.PI * 0.25, 0, palette.cyanRgb, blochAlpha * 0.8, 0.9, 56, globalRy, globalRx);
        drawSplitRing(136, 0, -Math.PI * 0.25, 0, palette.accentRgb, blochAlpha * 0.8, 0.9, 56, globalRy, globalRx);

        // 3 inclined quantum orbital paths
        orbitals.forEach((orb) => {
            const colorRgb = palette[orb.colorKey];
            drawSplitRing(orb.radius, orb.rx, orb.ry, orb.rz, colorRgb, palette.isLight ? 0.62 : 0.52, 1.6, 72, globalRy * 0.35, globalRx * 0.35);
            drawElectronNode(orb, time, globalRx * 0.35, globalRy * 0.35);
        });

        // 3D floating quantum field particles
        const cx = width * 0.5;
        const cy = height * 0.49;
        const fov = 560;
        const scaleFactor = Math.min(width, height) / 420;

        fieldParticles.forEach((pt) => {
            const t = pt.theta + time * pt.speed;
            const r = pt.r * scaleFactor;
            const x = r * Math.sin(pt.phi) * Math.cos(t);
            const y = r * Math.cos(pt.phi) * 0.88;
            const z = r * Math.sin(pt.phi) * Math.sin(t);

            const world = rotate3D(x, y, z, globalRx * 0.5, globalRy * 0.5, 0);
            const proj = project(world, fov, cx, cy);
            const ctx = world.z >= 0 ? ctxFront : ctxBack;
            const rgb = pt.useCyan ? palette.cyanRgb : palette.accent2Rgb;
            const alpha = world.z >= 0 ? (palette.isLight ? 0.72 : 0.82) : (palette.isLight ? 0.24 : 0.32);

            ctx.fillStyle = `rgba(${rgb}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(proj.sx, proj.sy, Math.max(0.8, pt.size * proj.scale), 0, Math.PI * 2);
            ctx.fill();
        });

        // Expanding X-Gate quantum pulse rings
        for (let i = pulses.length - 1; i >= 0; i--) {
            const pulse = pulses[i];
            pulse.progress += 0.028;
            if (pulse.progress >= 1) {
                pulses.splice(i, 1);
                continue;
            }
            const r = (45 + pulse.progress * 155) * scaleFactor;
            const alpha = (1 - pulse.progress) * 0.75;
            ctxFront.beginPath();
            ctxFront.arc(cx, cy, r, 0, Math.PI * 2);
            ctxFront.strokeStyle = `rgba(${palette.cyanRgb}, ${alpha.toFixed(3)})`;
            ctxFront.lineWidth = 2.4 * (1 - pulse.progress * 0.6);
            ctxFront.stroke();
        }
    }

    function updateRigTransform() {
        // Spring-smooth pointer tracking + gentle idle floating motion
        tiltX += (targetTiltX - tiltX) * 0.09;
        tiltY += (targetTiltY - tiltY) * 0.09;

        const floatY = prefersReducedMotion ? 0 : Math.sin(simTime * 1.4) * 6;
        const idleRx = prefersReducedMotion ? 0 : Math.cos(simTime * 0.9) * 2.2;
        const idleRy = prefersReducedMotion ? 0 : Math.sin(simTime * 0.7) * 3.0;

        rig.style.transform = `translateY(${floatY.toFixed(2)}px) rotateX(${(tiltX + idleRx).toFixed(2)}deg) rotateY(${(tiltY + idleRy).toFixed(2)}deg)`;
        rig.style.setProperty('--sheen-x', `${sheenX.toFixed(1)}%`);
        rig.style.setProperty('--sheen-y', `${sheenY.toFixed(1)}%`);
    }

    function tick(now) {
        if (!isVisible || document.hidden) {
            rafId = null;
            return;
        }
        const dt = Math.min(0.05, (now - lastTime) / 1000);
        lastTime = now;
        simTime += dt;

        updateRigTransform();
        renderFrame(simTime);

        if (!prefersReducedMotion || pulses.length > 0) {
            rafId = requestAnimationFrame(tick);
        } else {
            rafId = null;
        }
    }

    function startLoop() {
        if (rafId !== null) return;
        lastTime = performance.now();
        if (prefersReducedMotion && pulses.length === 0) {
            updateRigTransform();
            renderFrame(0.6);
            return;
        }
        rafId = requestAnimationFrame(tick);
    }

    function toggleQuantumState() {
        isFlipped = !isFlipped;
        flipper.classList.toggle('is-flipped', isFlipped);
        if (flipBtn) {
            flipBtn.setAttribute('aria-pressed', String(isFlipped));
        }
        if (stateLabel) {
            stateLabel.textContent = isFlipped ? '|1⟩' : '|0⟩';
        }
        pulses.push({ progress: 0 });
        if (prefersReducedMotion) {
            // Brief pulse feedback even under reduced motion
            renderFrame(0.6);
        } else {
            startLoop();
        }
    }

    // Pointer tracking for 3D parallax
    function handlePointerMove(e) {
        const rect = stage.getBoundingClientRect();
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        targetTiltY = Math.max(-1, Math.min(1, nx)) * 13;
        targetTiltX = Math.max(-1, Math.min(1, -ny)) * 11;
        sheenX = 50 + nx * 28;
        sheenY = 38 + ny * 26;
    }

    function resetPointer() {
        targetTiltX = 0;
        targetTiltY = 0;
        sheenX = 50;
        sheenY = 35;
    }

    stage.addEventListener('pointermove', handlePointerMove, { passive: true });
    stage.addEventListener('pointerleave', resetPointer, { passive: true });
    stage.addEventListener('click', toggleQuantumState);

    if (flipBtn) {
        flipBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleQuantumState();
        });
    }

    stage.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleQuantumState();
        }
    });

    window.addEventListener('themechange', () => {
        readPalette();
        if (prefersReducedMotion) {
            renderFrame(0.6);
        }
    });

    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(() => {
            resizeCanvases();
            if (prefersReducedMotion) renderFrame(0.6);
        });
        ro.observe(stage);
    } else {
        window.addEventListener('resize', resizeCanvases, { passive: true });
    }

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                isVisible = entry.isIntersecting;
                if (isVisible) {
                    startLoop();
                } else if (rafId !== null) {
                    cancelAnimationFrame(rafId);
                    rafId = null;
                }
            });
        }, { threshold: 0.05 });
        io.observe(stage);
    }

    document.addEventListener('visibilitychange', () => {
        if (!document.hidden && isVisible) {
            startLoop();
        }
    });

    // Initialize
    readPalette();
    resizeCanvases();
    startLoop();
})();
