(() => {
  const hero = document.querySelector(".hero");
  const canvas = document.querySelector(".field-canvas");
  if (!hero || !canvas) return;

  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");

  if (!context || reducedMotion.matches || !finePointer.matches) return;

  let width = 0;
  let height = 0;
  let scale = 1;
  let points = [];
  let frame = 0;
  let previousTime = 0;
  const pointer = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

  const resize = () => {
    const bounds = hero.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    scale = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    const count = Math.max(24, Math.min(76, Math.round(width / 17)));
    points = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * .22,
      vy: (Math.random() - .5) * .18
    }));
  };

  const draw = (time) => {
    if (document.hidden) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(draw);
    if (time - previousTime < 32) return;
    const step = Math.min((time - previousTime) / 16, 2);
    previousTime = time;
    pointer.x += (pointer.targetX - pointer.x) * .08;
    pointer.y += (pointer.targetY - pointer.y) * .08;
    context.clearRect(0, 0, width, height);

    points.forEach((point, index) => {
      point.x += point.vx * step;
      point.y += point.vy * step;
      if (point.x < 0 || point.x > width) point.vx *= -1;
      if (point.y < 0 || point.y > height) point.vy *= -1;
      const dx = point.x - pointer.x;
      const dy = point.y - pointer.y;
      const influence = Math.max(0, 1 - Math.hypot(dx, dy) / 190);
      const x = point.x + dx * influence * .1;
      const y = point.y + dy * influence * .1;

      for (let next = index + 1; next < points.length; next++) {
        const other = points[next];
        const distance = Math.hypot(x - other.x, y - other.y);
        if (distance > 132) continue;
        const nearPointer = Math.max(0, 1 - Math.hypot(other.x - pointer.x, other.y - pointer.y) / 190);
        context.strokeStyle = `rgba(200, 237, 120, ${.11 * (1 - distance / 132) + nearPointer * .19})`;
        context.lineWidth = .7;
        context.beginPath();
        context.moveTo(x, y);
        context.lineTo(other.x, other.y);
        context.stroke();
      }

      context.fillStyle = `rgba(227, 242, 195, ${.3 + influence * .65})`;
      context.beginPath();
      context.arc(x, y, 1 + influence * 1.1, 0, Math.PI * 2);
      context.fill();
    });
  };

  hero.addEventListener("pointermove", (event) => {
    const bounds = hero.getBoundingClientRect();
    pointer.targetX = event.clientX - bounds.left;
    pointer.targetY = event.clientY - bounds.top;
  }, { passive: true });
  hero.addEventListener("pointerleave", () => {
    pointer.targetX = -1000;
    pointer.targetY = -1000;
  });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else if (!frame) {
      previousTime = 0;
      frame = requestAnimationFrame(draw);
    }
  });
  window.addEventListener("resize", resize, { passive: true });
  resize();
  frame = requestAnimationFrame(draw);
})();