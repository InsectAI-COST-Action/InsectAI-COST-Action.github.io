(() => {
  const hero = document.querySelector(".hero");
  const canvas = document.querySelector(".field-canvas");
  if (!hero || !canvas) return;

  const resourceGrid = document.querySelector(".repo-grid");
  const resourceCards = [...document.querySelectorAll(".repo[data-working-groups]")];
  const resourceFilters = [...document.querySelectorAll("[data-working-group-filter]")];
  const resourceCount = document.querySelector(".resource-count");
  resourceFilters.forEach((filter) => {
    filter.addEventListener("click", () => {
      const selectedGroup = filter.dataset.workingGroupFilter;
      resourceFilters.forEach((button) => button.setAttribute("aria-pressed", String(button === filter)));
      resourceCards.forEach((card) => {
        const groups = card.dataset.workingGroups.split(",");
        card.hidden = selectedGroup !== "all" && !groups.includes(selectedGroup);
      });
      const visibleCount = resourceCards.filter((card) => !card.hidden).length;
      resourceGrid.classList.toggle("is-filtered", selectedGroup !== "all");
      resourceCount.textContent = `${visibleCount} resource${visibleCount === 1 ? "" : "s"}`;
    });
  });

  const context = canvas.getContext("2d");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
  const constellationCanvases = [...document.querySelectorAll(".constellation-canvas")];
  const constellationPointers = constellationCanvases.map((network) => {
    const pointer = { x: -1000, y: -1000, targetX: -1000, targetY: -1000 };
    const section = network.parentElement;
    section.addEventListener("pointermove", (event) => {
      const bounds = network.getBoundingClientRect();
      pointer.targetX = event.clientX - bounds.left;
      pointer.targetY = event.clientY - bounds.top;
    }, { passive: true });
    section.addEventListener("pointerleave", () => {
      pointer.targetX = -1000;
      pointer.targetY = -1000;
    });
    return pointer;
  });
  let constellationFrame = 0;
  let frame = 0;
  let constellationFields = [];

  const resizeConstellations = () => {
    constellationFields = constellationCanvases.map((network, networkIndex) => {
      const bounds = network.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      network.width = Math.round(bounds.width * ratio);
      network.height = Math.round(bounds.height * ratio);
      const networkContext = network.getContext("2d");
      networkContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      const clusterCount = Math.max(4, Math.min(18, Math.round(bounds.width * bounds.height / 55000)));
      const clusterScale = Math.max(.8, Math.min(1.2, bounds.width / 700));
      const clusterOrder = Array.from({ length: clusterCount }, (_, index) => index);
      for (let index = clusterOrder.length - 1; index > 0; index--) {
        const otherIndex = Math.floor(Math.random() * (index + 1));
        [clusterOrder[index], clusterOrder[otherIndex]] = [clusterOrder[otherIndex], clusterOrder[index]];
      }
      const triangularClusters = new Set(clusterOrder.slice(0, Math.ceil(clusterCount * .72)));
      const largeClusterCount = Math.min(2, Math.max(1, Math.round(clusterCount * .1)));
      const largeClusters = new Set(clusterOrder.slice(0, largeClusterCount));
      const clusters = Array.from({ length: clusterCount }, (_, clusterIndex) => {
        const isLarge = largeClusters.has(clusterIndex);
        const nodeCount = isLarge ? 6 + Math.floor(Math.random() * 4) : 4 + Math.floor(Math.random() * 4);
        const clusterRadius = (isLarge ? 32 + Math.random() * 12 : 34 + Math.random() * 16) * clusterScale;
        const centerMarginX = Math.min(clusterRadius + 8, bounds.width / 2 - 4);
        const centerMarginY = Math.min(clusterRadius + 8, bounds.height / 2 - 4);
        const centerX = centerMarginX + Math.random() * Math.max(0, bounds.width - centerMarginX * 2);
        const centerY = centerMarginY + Math.random() * Math.max(0, bounds.height - centerMarginY * 2);
        const nodes = Array.from({ length: nodeCount }, () => {
          const angle = Math.random() * Math.PI * 2;
          const radius = Math.sqrt(Math.random()) * clusterRadius * .82;
          return {
            x: centerX + Math.cos(angle) * radius,
            y: centerY + Math.sin(angle) * radius,
            vx: (Math.random() - .5) * .24,
            vy: (Math.random() - .5) * .24,
            interaction: 0
          };
        });
        return { centerX, centerY, radius: clusterRadius, connectionRadius: clusterRadius * 1.25, nodes };
      });
      return { context: networkContext, width: bounds.width, height: bounds.height, clusters, pointer: constellationPointers[networkIndex] };
    });
  };

  const drawConstellations = (time) => {
    if (document.hidden) {
      constellationFrame = 0;
      return;
    }

    constellationFields.forEach(({ context: networkContext, width: networkWidth, height: networkHeight, clusters, pointer }) => {
      pointer.x += (pointer.targetX - pointer.x) * .16;
      pointer.y += (pointer.targetY - pointer.y) * .16;
      networkContext.clearRect(0, 0, networkWidth, networkHeight);
      clusters.forEach((cluster) => {
        const { centerX, centerY, radius, connectionRadius, nodes } = cluster;
        const positions = nodes.map((node) => {
          node.vx += (Math.random() - .5) * .018;
          node.vy += (Math.random() - .5) * .018;
          node.vx *= .992;
          node.vy *= .992;
          node.x += node.vx;
          node.y += node.vy;

          const centerDx = node.x - centerX;
          const centerDy = node.y - centerY;
          const centerDistance = Math.hypot(centerDx, centerDy);
          if (centerDistance > radius) {
            const normalX = centerDx / centerDistance;
            const normalY = centerDy / centerDistance;
            node.x = centerX + normalX * radius;
            node.y = centerY + normalY * radius;
            const normalVelocity = node.vx * normalX + node.vy * normalY;
            if (normalVelocity > 0) {
              node.vx -= normalX * normalVelocity * 1.6;
              node.vy -= normalY * normalVelocity * 1.6;
            }
          }

          const dx = node.x - pointer.x;
          const dy = node.y - pointer.y;
          const proximity = Math.max(0, 1 - Math.hypot(dx, dy) / 150);
          node.interaction += (proximity - node.interaction) * .18;
          return {
            x: node.x + dx * node.interaction * .055,
            y: node.y + dy * node.interaction * .055,
            interaction: node.interaction
          };
        });

        positions.forEach((position, nodeIndex) => {
          for (let nextIndex = nodeIndex + 1; nextIndex < positions.length; nextIndex++) {
            const next = positions[nextIndex];
            const distance = Math.hypot(position.x - next.x, position.y - next.y);
            if (distance >= connectionRadius) continue;
            const fadeStart = connectionRadius * .7;
            const fade = Math.min(1, (connectionRadius - distance) / (connectionRadius - fadeStart));
            const interaction = Math.max(position.interaction, next.interaction);
            networkContext.strokeStyle = `rgba(200, 237, 120, ${( .16 + interaction * .3) * fade})`;
            networkContext.lineWidth = .75 + interaction * .4;
            networkContext.beginPath();
            networkContext.moveTo(position.x, position.y);
            networkContext.lineTo(next.x, next.y);
            networkContext.stroke();
          }
        });
        positions.forEach((position) => {
          networkContext.fillStyle = `rgba(227, 242, 195, ${.4 + position.interaction * .35})`;
          networkContext.shadowColor = `rgba(200, 237, 120, ${position.interaction * .35})`;
          networkContext.shadowBlur = position.interaction * 6;
          networkContext.beginPath();
          networkContext.arc(position.x, position.y, 1.5 + position.interaction * .8, 0, Math.PI * 2);
          networkContext.fill();
        });
        networkContext.shadowBlur = 0;
      });
    });

    if (!reducedMotion.matches) constellationFrame = requestAnimationFrame(drawConstellations);
  };

  resizeConstellations();
  drawConstellations(performance.now());
  window.addEventListener("resize", () => {
    resizeConstellations();
    if (reducedMotion.matches) drawConstellations(performance.now());
  }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(constellationFrame);
      constellationFrame = 0;
      cancelAnimationFrame(frame);
      frame = 0;
    } else {
      if (reducedMotion.matches) drawConstellations(performance.now());
      else if (!constellationFrame) constellationFrame = requestAnimationFrame(drawConstellations);
      if (!reducedMotion.matches && finePointer.matches && !frame) frame = requestAnimationFrame(draw);
    }
  });

  if (!context || reducedMotion.matches || !finePointer.matches) return;

  let width = 0;
  let height = 0;
  let scale = 1;
  let layers = [];
  let previousTime = 0;
  let animationStart = null;
  const layerSizes = [3, 5, 8, 6, 4];
  const layerSpreads = [.48, .84, 1, .84, .48];
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
      const layerSpread = layerSpreads[layerIndex];
      const rowOffset = (neuronIndex + .5) / count - .5;
      const anchorY = height * (.5 + rowOffset * .72 * layerSpread);
      return {
        layerIndex,
        anchorX,
        anchorY,
        x: anchorX,
        y: anchorY,
        vx: 0,
        vy: 0,
        interaction: 0,
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
      neuron.vx += (neuron.anchorX - neuron.x) * .00002 * step;
      neuron.vy += (neuron.anchorY - neuron.y) * .00002 * step;

      const dx = neuron.x - pointer.x;
      const dy = neuron.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const proximity = Math.max(0, 1 - distance / 220);
      neuron.interaction += (proximity - neuron.interaction) * Math.min(.12 * step, 1);
      const wander = .0075 * drift * (1 + 2.5 * neuron.interaction) * step;
      neuron.vx += (Math.random() - .5) * wander;
      neuron.vy += (Math.random() - .5) * wander;

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
  window.addEventListener("resize", resize, { passive: true });
  resize();
  frame = requestAnimationFrame(draw);
})();