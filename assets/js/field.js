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
  let layers = [];
  let frame = 0;
  let previousTime = 0;
  let animationStart = null;
  const layerSizes = [3, 5, 8, 6, 4];
  const pointer = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };

  const resize = () => {
    const bounds = hero.getBoundingClientRect();
    width = bounds.width;
    height = bounds.height;
    scale = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    context.setTransform(scale, 0, 0, scale, 0, 0);
    animationStart = null;
    layers = layerSizes.map((count, layerIndex) => Array.from({ length: count }, (_, neuronIndex) => {
      const anchorX = width * (.08 + layerIndex * .21);
      const anchorY = height * (.14 + (neuronIndex + .5) * .72 / count);
      return {
        layerIndex,
        anchorX,
        anchorY,
        x: anchorX,
        y: anchorY,
        vx: 0,
        vy: 0,
        phase: Math.random() * Math.PI * 2
      };
    }));
  };

  const draw = (time) => {
    if (document.hidden) {
      frame = 0;
      return;
    }
    frame = requestAnimationFrame(draw);
    if (time - previousTime < 32) return;
    const step = previousTime ? Math.min((time - previousTime) / 16, 2) : 1;
    previousTime = time;
    animationStart ??= time;
    const drift = Math.min(1, (time - animationStart) / 6000);
    pointer.x += (pointer.targetX - pointer.x) * .18;
    pointer.y += (pointer.targetY - pointer.y) * .18;
    context.clearRect(0, 0, width, height);

    const positions = layers.map((layer) => layer.map((neuron) => {
      const wander = .005 * drift * step;
      neuron.vx += (neuron.anchorX - neuron.x) * .00002 * step;
      neuron.vy += (neuron.anchorY - neuron.y) * .00002 * step;
      neuron.vx += (Math.random() - .5) * wander;
      neuron.vy += (Math.random() - .5) * wander;

      const dx = neuron.x - pointer.x;
      const dy = neuron.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const proximity = Math.max(0, 1 - distance / 220);

      neuron.vx *= .99;
      neuron.vy *= .99;
      neuron.x += neuron.vx * step;
      neuron.y += neuron.vy * step;

      if (neuron.x < 12 || neuron.x > width - 12) neuron.vx *= -.7;
      if (neuron.y < 12 || neuron.y > height - 12) neuron.vy *= -.7;
      neuron.x = Math.max(12, Math.min(width - 12, neuron.x));
      neuron.y = Math.max(12, Math.min(height - 12, neuron.y));

      const pulse = .5 + .5 * Math.sin(time * .0012 - neuron.layerIndex * .75 + neuron.phase);
      return {
        x: neuron.x + dx * proximity * .055,
        y: neuron.y + dy * proximity * .055,
        activation: Math.min(1, .18 + pulse * .16 + proximity * .66)
      };
    }));

    const drawConnection = (start, end) => {
      const activation = (start.activation + end.activation) / 2;
      context.strokeStyle = `rgba(200, 237, 120, ${.025 + activation * .095})`;
      context.lineWidth = .6 + activation * .55;
      context.beginPath();
      context.moveTo(start.x, start.y);
      context.lineTo(end.x, end.y);
      context.stroke();
    };

    positions.forEach((layer, layerIndex) => {
      if (layerIndex + 1 < positions.length) {
        layer.forEach((neuron) => {
          positions[layerIndex + 1].forEach((nextNeuron) => drawConnection(neuron, nextNeuron));
        });
      }
    });

    positions.forEach((layer) => {
      layer.forEach((neuron) => {
        context.fillStyle = `rgba(227, 242, 195, ${.24 + neuron.activation * .72})`;
        context.shadowColor = `rgba(200, 237, 120, ${neuron.activation * .42})`;
        context.shadowBlur = neuron.activation * 10;
        context.beginPath();
        context.arc(neuron.x, neuron.y, 2 + neuron.activation * 1.5, 0, Math.PI * 2);
        context.fill();
      });
    });
    context.shadowBlur = 0;
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