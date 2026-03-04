'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { useEffect, useRef, memo, useState } from 'react';
import { useTheme } from 'next-themes';
import { ScentMemoriesHeroSkeleton } from '@/src/app/components/FragranceSkeleton';
import * as THREE from 'three';

// ─── Three.js 은하수 별 캔버스 ────────────────────────────────────
type MilkyWayCanvasProps = { isLightMode: boolean };

const SCROLL_ZOOM_PX = 320;

const MilkyWayCanvas = memo(({ isLightMode }: MilkyWayCanvasProps) => {
    const mountRef = useRef<HTMLDivElement>(null);
    const sceneDataRef = useRef<{
        milkyBand: THREE.Points;
        sparkles: THREE.Points;
        deepStars: THREE.Points;
    } | null>(null);

    // ── 씬/지오메트리: 마운트 시 한 번만 생성 (테마와 무관)
    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const initialLightMode = isLightMode; // 마운트 시점 테마로 초기화

        let refW = mount.clientWidth;
        let refH = mount.clientHeight;

        // ── 기준 높이: 이 높이 기준으로 FOV 보정 → 작은 뷰포트에서도 은하수가 고정된 크기로 보이도록 (뭉치지 않게)
        const REF_HEIGHT = 700;
        const getBaseFov = (h: number) => Math.min(50, Math.max(28, 50 * (h / REF_HEIGHT)));

        const section = mount.parentElement!;
        let initialSectionTop = section.getBoundingClientRect().top;
        // 보일 때만 애니메이션 루프에서 매 프레임 호출 → 스크롤 올렸을 때 확대가 자연스럽게 되돌아감
        const getScrollProgress = (): number => {
            if (typeof window === 'undefined') return 0;
            const scrollY = window.scrollY ?? document.documentElement.scrollTop ?? document.body.scrollTop ?? 0;
            const currentTop = section.getBoundingClientRect().top;
            const byWindow = Math.max(0, scrollY / SCROLL_ZOOM_PX);
            const bySection = Math.max(0, (initialSectionTop - currentTop) / SCROLL_ZOOM_PX);
            return Math.max(byWindow, bySection);
        };

        // ── 렌더러: 리사이즈 시 크기 갱신 ─────────────────────────────────────────────────────────────
        const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.setSize(refW, refH);
        renderer.setClearColor(0x000000, 0);
        const canvas = renderer.domElement;
        canvas.style.position = 'absolute';
        canvas.style.left = '50%';
        canvas.style.top = '50%';
        canvas.style.transform = 'translate(-50%, -50%)';
        canvas.style.width = `${refW}px`;
        canvas.style.height = `${refH}px`;
        mount.appendChild(canvas);

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(getBaseFov(refH), refW / refH, 0.1, 300);
        camera.position.set(0, 4, 12);
        camera.lookAt(0, 0, 0);

        // ── 리사이즈: 컨테이너 크기에 맞춰 렌더러·캔버스·카메라 갱신 ────────────────────────────────────
        const onResize = () => {
            if (!mount.parentElement) return;
            refW = mount.clientWidth;
            refH = mount.clientHeight;
            initialSectionTop = section.getBoundingClientRect().top;
            renderer.setSize(refW, refH);
            canvas.style.width = `${refW}px`;
            canvas.style.height = `${refH}px`;
            camera.aspect = refW / refH;
            camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(onResize);
        ro.observe(mount);
        window.addEventListener('resize', onResize);

        // 스크롤 스무딩 (애니메이션 루프에서 사용)
        let smoothedProgress = 0;

        // ── 색상 팔레트 (라이트/다크 공통, 버텍스별로 두 테마 색 모두 저장)
        const MILKY = [
            new THREE.Color(0xfff5f8),
            new THREE.Color(0xffe8f0),
            new THREE.Color(0xfff0f5),
            new THREE.Color(0xffffff),
            new THREE.Color(0xe8d8ff),
            new THREE.Color(0xd4c0ff),
            new THREE.Color(0xc8b4ff),
            new THREE.Color(0xddd0ff),
            new THREE.Color(0xfff0cc),
            new THREE.Color(0xffe8b4),
            new THREE.Color(0xfdecd0),
            new THREE.Color(0xf5e8c8),
        ];
        const MILKY_GOLD_LIGHT = [
            new THREE.Color(0xfff2e8),
            new THREE.Color(0xfff5ee),
            new THREE.Color(0xffefe5),
            new THREE.Color(0xfff0e8),
        ];

        const pickColorLight = (): THREE.Color => {
            const r = Math.random();
            if (r < 0.40) return MILKY[Math.floor(Math.random() * 4)];
            if (r < 0.70) return MILKY[4 + Math.floor(Math.random() * 4)];
            return MILKY_GOLD_LIGHT[Math.floor(Math.random() * 4)];
        };
        const pickColorDark = (): THREE.Color => {
            const r = Math.random();
            if (r < 0.40) return MILKY[Math.floor(Math.random() * 4)];
            if (r < 0.70) return MILKY[4 + Math.floor(Math.random() * 4)];
            return MILKY[8 + Math.floor(Math.random() * 4)];
        };

        // ────────────────────────────────────────────────────────
        // Layer 1: 은하수 띠 — 구불거리는 강 형태 (colorLight + colorDark, 테마는 uniform으로)
        // ────────────────────────────────────────────────────────
        const buildMilkyBand = (count: number) => {
            const pos = new Float32Array(count * 3);
            const colLight = new Float32Array(count * 3);
            const colDark = new Float32Array(count * 3);
            const sz = new Float32Array(count);

            for (let i = 0; i < count; i++) {
                const t = Math.random() * 2 - 1;
                const x = t * 16.0 + (Math.random() - 0.5) * 0.5;
                const riverY = Math.sin(t * Math.PI * 0.9) * 1.8
                    + Math.sin(t * Math.PI * 2.1) * 0.55
                    + Math.sin(t * Math.PI * 3.5) * 0.18;
                const gauss = () => {
                    let u = 0, v = 0;
                    while (u === 0) u = Math.random();
                    while (v === 0) v = Math.random();
                    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
                };
                const bandW = gauss() * 0.85;
                const depthW = gauss() * 0.35;

                pos[i * 3] = x;
                pos[i * 3 + 1] = riverY + bandW;
                pos[i * 3 + 2] = depthW;

                const normX = Math.min(Math.abs(t), 1);
                const cL = pickColorLight();
                const brightL = (0.78 + Math.random() * 0.22) * (1 - normX * 0.08);
                colLight[i * 3] = cL.r * brightL;
                colLight[i * 3 + 1] = cL.g * brightL;
                colLight[i * 3 + 2] = cL.b * brightL;
                const cD = pickColorDark();
                const brightD = (0.12 + Math.random() * 0.38) * (1 - normX * 0.35);
                colDark[i * 3] = cD.r * brightD;
                colDark[i * 3 + 1] = cD.g * brightD;
                colDark[i * 3 + 2] = cD.b * brightD;

                sz[i] = Math.random() < 0.05
                    ? Math.random() * 1.0 + 0.75
                    : Math.random() * 0.6 + 0.2;
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('colorLight', new THREE.BufferAttribute(colLight, 3));
            geo.setAttribute('colorDark', new THREE.BufferAttribute(colDark, 3));
            geo.setAttribute('size', new THREE.BufferAttribute(sz, 1));

            const mat = new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                blending: initialLightMode ? THREE.NormalBlending : THREE.AdditiveBlending,
                uniforms: {
                    uTime: { value: 0 },
                    uLightMode: { value: initialLightMode ? 1 : 0 },
                },
                vertexShader: /* glsl */`
                    attribute float size;
                    attribute vec3 colorLight;
                    attribute vec3 colorDark;
                    uniform float uTime;
                    uniform float uLightMode;
                    varying vec3  vColor;
                    varying float vAlpha;

                    void main() {
                        vColor = mix(colorDark, colorLight, uLightMode);
                        float twinkle = 0.5 + 0.5 * sin(
                            uTime * (1.0 + fract(position.x * 13.7 + position.z * 7.3) * 2.0)
                            + position.x * 11.3 + position.z * 7.9
                        );
                        vAlpha = 0.4 + 0.6 * twinkle;
                        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = size * (300.0 / -mvPos.z);
                        gl_Position  = projectionMatrix * mvPos;
                    }
                `,
                fragmentShader: /* glsl */`
                    varying vec3  vColor;
                    varying float vAlpha;
                    uniform float uLightMode;

                    void main() {
                        vec2  uv = gl_PointCoord - 0.5;
                        float d  = length(uv);
                        if (d > 0.5) discard;
                        float alphaScale = mix(0.82, 1.0, uLightMode);
                        float alpha = smoothstep(0.5, 0.1, d) * vAlpha * alphaScale;
                        float highlightAmt = mix(0.3, 0.58, uLightMode);
                        vec3 highlight = vColor + (1.0 - vColor) * smoothstep(0.2, 0.0, d) * highlightAmt;
                        highlight = mix(highlight, vec3(1.0), smoothstep(0.28, 0.0, d) * 0.32 * uLightMode);
                        gl_FragColor = vec4(highlight, alpha);
                    }
                `,
            });
            return new THREE.Points(geo, mat);
        };

        // ────────────────────────────────────────────────────────
        // Layer 2: 전경 반짝이 별 (colorLight + colorDark, 테마는 uniform으로)
        // ────────────────────────────────────────────────────────
        const buildSparkles = (count: number) => {
            const pos = new Float32Array(count * 3);
            const colLight = new Float32Array(count * 3);
            const colDark = new Float32Array(count * 3);
            const sz = new Float32Array(count);
            const speed = new Float32Array(count);
            const phase = new Float32Array(count);

            for (let i = 0; i < count; i++) {
                pos[i * 3] = (Math.random() - 0.5) * 16;
                pos[i * 3 + 1] = (Math.random() - 0.5) * 10;
                pos[i * 3 + 2] = (Math.random() - 0.5) * 5 + 1;

                const cL = pickColorLight();
                const dimL = 0.82 + Math.random() * 0.18;
                colLight[i * 3] = cL.r * dimL;
                colLight[i * 3 + 1] = cL.g * dimL;
                colLight[i * 3 + 2] = cL.b * dimL;
                const cD = pickColorDark();
                const dimD = 0.45 + Math.random() * 0.45;
                colDark[i * 3] = cD.r * dimD;
                colDark[i * 3 + 1] = cD.g * dimD;
                colDark[i * 3 + 2] = cD.b * dimD;

                sz[i] = Math.random() * 1.0 + 0.5;
                speed[i] = 0.3 + Math.random() * 0.7;
                phase[i] = Math.random() * Math.PI * 2;
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('colorLight', new THREE.BufferAttribute(colLight, 3));
            geo.setAttribute('colorDark', new THREE.BufferAttribute(colDark, 3));
            geo.setAttribute('size', new THREE.BufferAttribute(sz, 1));
            geo.setAttribute('speed', new THREE.BufferAttribute(speed, 1));
            geo.setAttribute('phase', new THREE.BufferAttribute(phase, 1));

            const mat = new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                blending: initialLightMode ? THREE.NormalBlending : THREE.AdditiveBlending,
                uniforms: {
                    uTime: { value: 0 },
                    uLightMode: { value: initialLightMode ? 1 : 0 },
                },
                vertexShader: /* glsl */`
                    attribute float size;
                    attribute float speed;
                    attribute float phase;
                    attribute vec3 colorLight;
                    attribute vec3 colorDark;
                    uniform float uTime;
                    uniform float uLightMode;
                    varying vec3  vColor;
                    varying float vAlpha;

                    void main() {
                        vColor = mix(colorDark, colorLight, uLightMode);
                        float tw = 0.2 + 0.8 * pow(
                            0.5 + 0.5 * sin(uTime * speed + phase), 2.5
                        );
                        vAlpha = tw;
                        vec3 p = position;
                        p.y += sin(uTime * speed * 0.3 + phase) * 0.15;
                        p.x += cos(uTime * speed * 0.2 + phase) * 0.10;
                        vec4 mvPos = modelViewMatrix * vec4(p, 1.0);
                        gl_PointSize = size * (280.0 / -mvPos.z) * (0.6 + tw * 0.4);
                        gl_Position  = projectionMatrix * mvPos;
                    }
                `,
                fragmentShader: /* glsl */`
                    varying vec3  vColor;
                    varying float vAlpha;
                    uniform float uLightMode;

                    void main() {
                        vec2  uv = gl_PointCoord - 0.5;
                        float d  = length(uv);
                        if (d > 0.5) discard;
                        float alphaScale = mix(0.95, 1.0, uLightMode);
                        float alpha = smoothstep(0.5, 0.05, d) * vAlpha * alphaScale;
                        vec3 col = vColor;
                        col = mix(col, vec3(1.0), smoothstep(0.25, 0.0, d) * 0.28 * uLightMode);
                        gl_FragColor = vec4(col, alpha);
                    }
                `,
            });
            return new THREE.Points(geo, mat);
        };

        // ────────────────────────────────────────────────────────
        // Layer 3: 먼 배경 고정 별 (colorLight + colorDark, 테마는 uniform으로)
        // ────────────────────────────────────────────────────────
        const buildDeepStars = (count: number) => {
            const pos = new Float32Array(count * 3);
            const colLight = new Float32Array(count * 3);
            const colDark = new Float32Array(count * 3);
            const sz = new Float32Array(count);

            for (let i = 0; i < count; i++) {
                const theta = Math.random() * Math.PI * 2;
                const phi = Math.acos(2 * Math.random() - 1);
                const r = 15 + Math.random() * 10;
                pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
                pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
                pos[i * 3 + 2] = r * Math.cos(phi);

                const t = Math.random();
                if (t < 0.45) {
                    colLight[i * 3] = 0.98 + Math.random() * 0.02;
                    colLight[i * 3 + 1] = 0.94 + Math.random() * 0.04;
                    colLight[i * 3 + 2] = 0.96 + Math.random() * 0.04;
                    colDark[i * 3] = 0.95 + Math.random() * 0.05;
                    colDark[i * 3 + 1] = 0.85 + Math.random() * 0.10;
                    colDark[i * 3 + 2] = 0.90 + Math.random() * 0.10;
                } else if (t < 0.75) {
                    colLight[i * 3] = 0.90 + Math.random() * 0.06;
                    colLight[i * 3 + 1] = 0.86 + Math.random() * 0.10;
                    colLight[i * 3 + 2] = 0.96 + Math.random() * 0.04;
                    colDark[i * 3] = 0.65 + Math.random() * 0.25;
                    colDark[i * 3 + 1] = 0.55 + Math.random() * 0.25;
                    colDark[i * 3 + 2] = 0.90 + Math.random() * 0.10;
                } else {
                    colLight[i * 3] = 0.98 + Math.random() * 0.02;
                    colLight[i * 3 + 1] = 0.94 + Math.random() * 0.04;
                    colLight[i * 3 + 2] = 0.92 + Math.random() * 0.06;
                    colDark[i * 3] = 0.95 + Math.random() * 0.05;
                    colDark[i * 3 + 1] = 0.85 + Math.random() * 0.10;
                    colDark[i * 3 + 2] = 0.60 + Math.random() * 0.20;
                }
                sz[i] = Math.random() * 0.6 + 0.1;
            }

            const geo = new THREE.BufferGeometry();
            geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
            geo.setAttribute('colorLight', new THREE.BufferAttribute(colLight, 3));
            geo.setAttribute('colorDark', new THREE.BufferAttribute(colDark, 3));
            geo.setAttribute('size', new THREE.BufferAttribute(sz, 1));

            const mat = new THREE.ShaderMaterial({
                transparent: true,
                depthWrite: false,
                blending: initialLightMode ? THREE.NormalBlending : THREE.AdditiveBlending,
                uniforms: {
                    uTime: { value: 0 },
                    uLightMode: { value: initialLightMode ? 1 : 0 },
                },
                vertexShader: /* glsl */`
                    attribute float size;
                    attribute vec3 colorLight;
                    attribute vec3 colorDark;
                    uniform float uTime;
                    uniform float uLightMode;
                    varying vec3  vColor;
                    varying float vAlpha;

                    void main() {
                        vColor = mix(colorDark, colorLight, uLightMode);
                        float tw = 0.5 + 0.5 * sin(uTime * 0.9
                            + position.x * 3.7 + position.y * 2.3 + position.z * 1.9);
                        vAlpha = tw;
                        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
                        gl_PointSize = size * (240.0 / -mvPos.z) * tw;
                        gl_Position  = projectionMatrix * mvPos;
                    }
                `,
                fragmentShader: /* glsl */`
                    varying vec3  vColor;
                    varying float vAlpha;
                    uniform float uLightMode;

                    void main() {
                        vec2  uv = gl_PointCoord - 0.5;
                        float d  = length(uv);
                        if (d > 0.5) discard;
                        float alphaScale = mix(0.75, 1.0, uLightMode);
                        float a  = smoothstep(0.5, 0.0, d) * vAlpha * alphaScale;
                        vec3 col = vColor;
                        col = mix(col, vec3(1.0), smoothstep(0.22, 0.0, d) * 0.24 * uLightMode);
                        gl_FragColor = vec4(col, a);
                    }
                `,
            });
            return new THREE.Points(geo, mat);
        };

        // ── 씬 조립 ──────────────────────────────────────────────
        // 이전보다 더 많은 별: 12000 → 18000, 800 → 1200, 4000 → 6000
        const milkyBand = buildMilkyBand(18000);
        const sparkles = buildSparkles(1200);
        const deepStars = buildDeepStars(6000);

        // 강띠: 살짝 기울여 대각+구불 느낌 — 회전 없음 (고정)
        milkyBand.rotation.x = Math.PI * 0.08;
        milkyBand.rotation.z = -Math.PI * 0.08;

        scene.add(deepStars);
        scene.add(milkyBand);
        scene.add(sparkles);

        sceneDataRef.current = { milkyBand, sparkles, deepStars };

        let rafId: number;
        let visible = true;
        const io = new IntersectionObserver(
            (entries) => { visible = entries[0]?.isIntersecting ?? true; },
            { threshold: 0, rootMargin: '50px' }
        );
        io.observe(mount);

        // ── 애니메이션 ──────────────────────────────────────────
        const clock = new THREE.Clock();
        const animate = () => {
            rafId = requestAnimationFrame(animate);
            if (!visible) return;
            const t = clock.getElapsedTime();

            (milkyBand.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
            (sparkles.material as THREE.ShaderMaterial).uniforms.uTime.value = t;
            (deepStars.material as THREE.ShaderMaterial).uniforms.uTime.value = t;

            // ★ 회전 없음 — milkyBand.rotation.y 고정 (코드 없음)
            // 배경 별들만 극도로 느리게 (+시차)
            deepStars.rotation.y = t * 0.003;

            // ★ 스크롤 시 은하수 확대/축소 — 보일 때만 매 프레임 진행도 계산해 스크롤 올려도 자연스럽게 되돌아감
            const rawProgress = visible ? getScrollProgress() : smoothedProgress;
            smoothedProgress += (rawProgress - smoothedProgress) * 0.07;
            const sp = smoothedProgress;
            // Z: 스크롤할수록 전진 (12 → 5), 체감 확대가 잘 되도록
            camera.position.z = Math.max(5, 12 - 7 * sp);
            // Y: 0~1 구간에서만 약간 내려감, 이후 고정
            camera.position.y = 4 - 0.25 * Math.min(sp, 1) + Math.cos(t * 0.05) * Math.max(0, 1 - sp) * 0.2;
            // X: 0~1 구간에서만 미세 흔들림
            camera.position.x = Math.sin(t * 0.07) * Math.max(0, 1 - sp) * 0.2;
            // FOV: 스크롤 시 축소해 줌인 느낌 강화
            const baseFov = getBaseFov(refH);
            camera.fov = Math.max(baseFov * 0.65, baseFov - 12 * sp);
            camera.updateProjectionMatrix();
            camera.lookAt(0, 0, 0);

            renderer.render(scene, camera);
        };
        animate();

        return () => {
            sceneDataRef.current = null;
            io.disconnect();
            ro.disconnect();
            window.removeEventListener('resize', onResize);
            cancelAnimationFrame(rafId);
            renderer.dispose();
            [milkyBand, sparkles, deepStars].forEach(p => {
                p.geometry.dispose();
                (p.material as THREE.ShaderMaterial).dispose();
            });
            if (mount.contains(renderer.domElement)) mount.removeChild(renderer.domElement);
        };
    }, []); // 마운트 시 한 번만 실행 — 지오메트리 재생성 없음

    // ── 테마 변경 시: uniform + 블렌딩만 갱신 (지오메트리 유지)
    useEffect(() => {
        const data = sceneDataRef.current;
        if (!data) return;
        const light = isLightMode ? 1 : 0;
        const blending = isLightMode ? THREE.NormalBlending : THREE.AdditiveBlending;
        [data.milkyBand, data.sparkles, data.deepStars].forEach((points) => {
            const mat = points.material as THREE.ShaderMaterial;
            if (mat.uniforms?.uLightMode) mat.uniforms.uLightMode.value = light;
            mat.blending = blending;
        });
    }, [isLightMode]);

    return (
        <div
            ref={mountRef}
            aria-hidden="true"
            style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                zIndex: 1,
                pointerEvents: 'none',
            }}
        />
    );
});

MilkyWayCanvas.displayName = 'MilkyWayCanvas';

// ─── 히어로 섹션 ────────────────────────────────────────────────
const ScentMemoriesHero = memo(function ScentMemoriesHero() {
    const { resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const isLightMode = resolvedTheme !== 'dark';

    if (!mounted) return <ScentMemoriesHeroSkeleton />;

    return (
        <section className="scent-hero">
            <div className="scent-hero-bg" />
            <MilkyWayCanvas isLightMode={isLightMode} />

            <div className="scent-hero-content">
                <motion.div
                    className="scent-bottle-wrap"
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1.6, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="scent-bottle-glow" />
                    <motion.div
                        animate={{ y: [0, -16, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Image
                            src="/image/fragrance/chanel/CHANCE_EAU_SPLENDIDE.png"
                            alt="Scent Memories Fragrance"
                            width={320}
                            height={320}
                            priority
                            className="scent-bottle-img"
                        />
                    </motion.div>
                </motion.div>

                <motion.div
                    className="scent-brand-bottom"
                    initial={{ opacity: 0, y: 28 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                    <div className="scent-deco-line" />
                    <h1 className="scent-brand-title">Scent Memories</h1>
                    <p className="scent-brand-desc">향기를 수집하고 기록하는 공간</p>
                    <div className="scent-deco-line" />
                </motion.div>
            </div>
        </section>
    );
});

export default ScentMemoriesHero;
