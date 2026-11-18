import { useEffect, useRef } from 'react';

// The flat logo artwork is tilted in 3D; the image itself is not changed.
// WebGL and Three.js are loaded only for this brief intro. The parent fades
// in the first rendered frame, or shows the ordinary image if WebGL fails.
export default function IntroLogo3D({ src, onReady, onFailure }) {
  const containerRef = useRef(null);
  useEffect(() => {
    let cancelled = false;
    let renderer, texture, artworkGeometry, textGeometry, material, textMaterial, pointsGeometry, pointsMaterial, frame, resizeObserver, canvas, contextLost, resize;
    const cleanup = () => {
      resizeObserver?.disconnect();
      if (resize) window.removeEventListener('resize', resize);
      if (frame) window.cancelAnimationFrame(frame);
      if (canvas && contextLost) canvas.removeEventListener('webglcontextlost', contextLost);
      artworkGeometry?.dispose(); textGeometry?.dispose(); material?.dispose(); textMaterial?.dispose(); texture?.dispose(); pointsGeometry?.dispose(); pointsMaterial?.dispose();
      renderer?.dispose(); canvas?.remove();
    };
    (async () => {
      try {
        const THREE = await import('three');
        if (cancelled || !containerRef.current) return;
        const container = containerRef.current;
        // The logo is a textured plane; multisampling adds cost without improving
        // the texture itself. Let the browser select the most suitable GPU.
        renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setClearColor(0xffffff, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        canvas = renderer.domElement;
        canvas.setAttribute('aria-hidden', 'true');
        canvas.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none';
        container.appendChild(canvas);
        contextLost = event => { event.preventDefault(); if (!cancelled) onFailure(); };
        canvas.addEventListener('webglcontextlost', contextLost);
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
        camera.position.z = 6;
        texture = await new Promise((resolve, reject) => new THREE.TextureLoader().load(src, resolve, undefined, reject));
        if (cancelled) { texture.dispose(); return; }
        texture.colorSpace = THREE.SRGBColorSpace;
        // This logo has a clear transparent gap above its English college line.
        // Split the existing texture at 85% height without changing the artwork.
        const upper = 0.85, lower = 1 - upper, height = 3;
        artworkGeometry = new THREE.PlaneGeometry(4.8, height * upper);
        textGeometry = new THREE.PlaneGeometry(4.8, height * lower);
        const artworkUV = artworkGeometry.attributes.uv;
        const textUV = textGeometry.attributes.uv;
        for (let i = 0; i < artworkUV.count; i++) artworkUV.setY(i, lower + artworkUV.getY(i) * upper);
        for (let i = 0; i < textUV.count; i++) textUV.setY(i, textUV.getY(i) * lower);
        material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false });
        textMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide, depthWrite: false, opacity: 0 });
        const artwork = new THREE.Mesh(artworkGeometry, material);
        const collegeText = new THREE.Mesh(textGeometry, textMaterial);
        artwork.position.y = height * lower / 2;
        collegeText.position.y = -height * upper / 2;
        const logo = new THREE.Group();
        logo.add(artwork, collegeText);
        scene.add(logo);
        // A restrained constellation sits behind the unchanged logo artwork.
        const positions = [], colors = [];
        const tones = [new THREE.Color('#a95820'), new THREE.Color('#e5a72e'), new THREE.Color('#e93a83'), new THREE.Color('#25b6e1'), new THREE.Color('#83c934')];
        for (let i = 0; i < 30; i++) {
          const theta = i * 2.39996;
          const radius = 1.7 + (i % 5) * 0.28;
          positions.push(Math.cos(theta) * radius, Math.sin(theta) * radius * 0.58, -0.35 - (i % 3) * 0.12);
          const color = tones[i % tones.length]; colors.push(color.r, color.g, color.b);
        }
        pointsGeometry = new THREE.BufferGeometry();
        pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        pointsGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        pointsMaterial = new THREE.PointsMaterial({ size: 0.055, transparent: true, opacity: 0.65, vertexColors: true, depthWrite: false });
        const sparkles = new THREE.Points(pointsGeometry, pointsMaterial);
        scene.add(sparkles);
        resize = () => {
          if (!container.clientWidth || !container.clientHeight) return;
          camera.aspect = container.clientWidth / container.clientHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(container.clientWidth, container.clientHeight, false);
        };
        resize();
        if ('ResizeObserver' in window) { resizeObserver = new ResizeObserver(resize); resizeObserver.observe(container); }
        else window.addEventListener('resize', resize);
        // Start the clock on the first rendered frame, not during initialization.
        let start = null;
        let announced = false;
        const animate = time => {
          if (cancelled) return;
          if (start === null) start = time;
          const progress = Math.min((time - start) / 2800, 1);
          const eased = progress * progress * (3 - 2 * progress);
          logo.rotation.y = -0.35 * (1 - eased);
          logo.rotation.x = 0.10 * (1 - eased);
          logo.position.y = -0.08 * (1 - eased);
          // Fade the English line in after the artwork has started moving.
          const fade = Math.max(0, Math.min((time - start - 650) / 1600, 1));
          textMaterial.opacity = fade * fade * (3 - 2 * fade);
          sparkles.rotation.z = progress * 0.18;
          sparkles.scale.setScalar(0.88 + eased * 0.12);
          renderer.render(scene, camera);
          if (!announced) { announced = true; onReady(); }
          frame = window.requestAnimationFrame(animate);
        };
        frame = window.requestAnimationFrame(animate);
      } catch {
        if (!cancelled) onFailure();
      } finally {
        if (cancelled) cleanup();
      }
    })();
    return () => { cancelled = true; cleanup(); };
  }, [src, onReady, onFailure]);
  return <span ref={containerRef} className="pointer-events-none absolute inset-0 block" aria-hidden="true" />;
}
