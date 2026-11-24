'use strict';

(() => {
  const THREE = window.THREE;
  if (!THREE) return;

  const TAU = Math.PI * 2;

  function seededRandom(seed) {
    return () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
  }

  function paintedTexture(width, height, paint) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    paint(canvas.getContext('2d'), width, height);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }

  function barkTexture() {
    return paintedTexture(128, 256, (ctx, w, h) => {
      const rnd = seededRandom(671);
      ctx.fillStyle = '#6b5848';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 210; i++) {
        const x = rnd() * w;
        const y = rnd() * h;
        const length = 9 + rnd() * 77;
        ctx.strokeStyle = ['#33291d66', '#a0846355', '#51413988', '#bb9b7555'][i % 4];
        ctx.lineWidth = .4 + rnd() * 2.7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.bezierCurveTo(x + rnd() * 4 - 2, y + length * .25, x - rnd() * 5, y + length * .63, x + rnd() * 2, y + length);
        ctx.stroke();
      }
    });
  }

  function groundTexture() {
    const map = paintedTexture(192, 192, (ctx, w, h) => {
      const rnd = seededRandom(455183);
      ctx.fillStyle = '#72764d';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 3600; i++) {
        ctx.fillStyle = ['#53603e55', '#c7b97f3e', '#342e2360', '#919b5b5c', '#b9bd8055'][i % 5];
        ctx.fillRect(rnd() * w, rnd() * h, .6 + rnd() * 4.5, .5 + rnd() * 2);
      }
    });
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(2, 33);
    return map;
  }

  function leafGeometry() {
    // A tapered, slightly folded leaf, with its stem at the origin.
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute([
      0, 0, 0, -.19, .26, -.039, -.26, .48, -.021, -.17, .75, -.055,
      0, 1, -.11, .17, .75, -.039, .25, .48, -.013, .21, .23, -.06, 0, .48, .09,
    ], 3));
    geometry.setIndex([0, 1, 8, 1, 2, 8, 2, 3, 8, 3, 4, 8, 4, 5, 8, 5, 6, 8, 6, 7, 8, 7, 0, 8]);
    geometry.computeVertexNormals();
    return geometry;
  }

  function addPlant({ random, center, radius, count, leaves, hue }) {
    for (let index = 0; index < count; index++) {
      const angle = random() * TAU;
      const radial = Math.sqrt(random()) * radius;
      const x = center.x + Math.cos(angle) * radial;
      const z = center.z + Math.sin(angle) * radial;
      const y = center.y + (random() - .44) * radius * 1.31;
      const length = .095 + random() * .19;
      leaves.push({ x, y, z, length, yaw: angle, pitch: -.96 + random() * 2.18, roll: random() - .5, hue });
    }
  }

  function growTree({ x, z, height, spread, hue, seed }, wood, leaves) {
    const random = seededRandom(seed);
    const trunkRadius = height * .034;
    const leanX = (random() - .5) * .46;
    const leanZ = (random() - .5) * .56;
    const trunk = [0, .21, .44, .65, .82, .96].map(portion => (
      new THREE.Vector3(x + leanX * portion, portion * height, z + leanZ * portion)
    ));
    for (let index = 0; index < trunk.length - 1; index++) {
      wood.push({ from: trunk[index], to: trunk[index + 1], radius: trunkRadius * .68 ** index });
    }
    for (let root = 0; root < 5; root++) {
      const angle = root * TAU / 5 + random() * .35;
      const reach = trunkRadius * (1.4 + random() * 2.2);
      const from = new THREE.Vector3(x, .16 + random() * .09, z);
      const to = new THREE.Vector3(x + Math.cos(angle) * reach, .025, z + Math.sin(angle) * reach);
      wood.push({ from, to, radius: trunkRadius * .49 });
    }

    const turn = random() * TAU;
    for (let index = 0; index < 10; index++) {
      const fraction = .29 + index * .056;
      const angle = turn + 2.39996 * index + (random() - .5) * .34;
      const reach = spread * Math.sin(Math.PI * fraction) * (0.7 + random() * .29);
      const from = new THREE.Vector3(x + leanX * fraction, fraction * height, z + leanZ * fraction);
      const midpoint = from.clone().add(new THREE.Vector3(Math.cos(angle) * reach * .49, height * (.060 + random() * .02), Math.sin(angle) * reach * .49));
      const tip = from.clone().add(new THREE.Vector3(Math.cos(angle) * reach, height * (.107 + random() * .09), Math.sin(angle) * reach));
      wood.push({ from, to: midpoint, radius: trunkRadius * (.64 - index * .035) });
      wood.push({ from: midpoint, to: tip, radius: trunkRadius * (.39 - index * .023) });

      for (let twig = 0; twig < 5; twig++) {
        const branchStart = midpoint.clone().lerp(tip, .12 + twig * .17);
        const forkAngle = angle + (twig % 2 ? -1 : 1) * (.38 + random() * .72);
        const forkLength = spread * (.18 + random() * .24);
        const end = branchStart.clone().add(new THREE.Vector3(Math.cos(forkAngle) * forkLength, .19 + random() * .45, Math.sin(forkAngle) * forkLength));
        wood.push({ from: branchStart, to: end, radius: .018 + random() * .027 });
        const radius = .30 + random() * .31;
        addPlant({ random, center: end, radius, count: 32, leaves, hue });
        addPlant({ random, center: branchStart.clone().lerp(end, .58), radius: radius * .67, count: 10, leaves, hue });
      }
    }
  }

  function setInstances(group, wood, leaves) {
    const dummy = new THREE.Object3D();
    const axis = new THREE.Vector3(0, 1, 0);
    const delta = new THREE.Vector3();
    const woodMaterial = new THREE.MeshStandardMaterial({ map: barkTexture(), roughness: .95 });
    const branches = new THREE.InstancedMesh(new THREE.CylinderGeometry(.68, 1, 1, 7), woodMaterial, wood.length);
    branches.name = 'Ağaç gövdeleri ve dallar';
    wood.forEach(({ from, to, radius }, index) => {
      delta.subVectors(to, from);
      dummy.position.copy(from).lerp(to, .5);
      dummy.scale.set(radius, delta.length() * 1.04, radius);
      dummy.quaternion.setFromUnitVectors(axis, delta.normalize());
      dummy.updateMatrix();
      branches.setMatrixAt(index, dummy.matrix);
    });

    const leafMaterial = new THREE.MeshStandardMaterial({ roughness: .79, side: THREE.DoubleSide });
    const foliage = new THREE.InstancedMesh(leafGeometry(), leafMaterial, leaves.length);
    foliage.name = 'Yapraklar ve çalılar';
    const color = new THREE.Color();
    const random = seededRandom(472891);
    leaves.forEach(({ x, y, z, length, yaw, pitch, roll, hue }, index) => {
      dummy.position.set(x, y, z);
      dummy.rotation.set(pitch, yaw, roll, 'YXZ');
      dummy.scale.set(length * (.81 + random() * .42), length, length);
      dummy.updateMatrix();
      foliage.setMatrixAt(index, dummy.matrix);
      color.setHSL(hue + random() * .036, .33 + random() * .31, .112 + random() * .17);
      foliage.setColorAt(index, color);
    });
    for (const instance of [branches, foliage]) {
      instance.computeBoundingSphere();
      group.add(instance);
    }
  }

  function build({ scene, glassX, sidewalkX, roadX }) {
    const group = new THREE.Group();
    group.name = 'Market önü peyzajı';
    const vergeLeft = sidewalkX - 1.35;
    const vergeRight = roadX + 4.12;
    const vergeWidth = Math.max(.76, vergeLeft - vergeRight);
    const vergeX = (vergeLeft + vergeRight) / 2;
    const verge = new THREE.Mesh(
      new THREE.PlaneGeometry(vergeWidth, 72),
      new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 1 }),
    );
    verge.position.set(vergeX, .033, 0);
    verge.rotation.x = -Math.PI / 2;
    group.add(verge);

    const dirt = new THREE.MeshStandardMaterial({ color: 0x62513a, roughness: .98 });
    const pitGeometry = new THREE.CircleGeometry(1, 22);
    const shadowMap = paintedTexture(128, 128, (ctx, w, h) => {
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2);
      gradient.addColorStop(0, '#17261475');
      gradient.addColorStop(.55, '#17261438');
      gradient.addColorStop(1, '#17261400');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    });
    const shade = new THREE.MeshBasicMaterial({ map: shadowMap, transparent: true, depthWrite: false });
    const wood = [], leaves = [];
    const sites = [
      [vergeX, -18.4, 6.5, 1.8, .205], [vergeX, -12.15, 6.25, 1.78, .238],
      [vergeX, -5.8, 5.75, 1.67, .204], [vergeX, .52, 6.75, 2.03, .256],
      [vergeX, 7.2, 6.12, 1.85, .219], [roadX - 7.8, -14.25, 7.25, 2.38, .223],
      [roadX - 8.6, -.4, 7.65, 2.51, .255], [roadX - 8.4, 14, 6.8, 2.17, .210],
    ];
    sites.forEach(([x, z, height, spread, hue], index) => {
      growTree({ x, z, height, spread, hue, seed: 17023 + index * 41 }, wood, leaves);
      const pit = new THREE.Mesh(pitGeometry, dirt);
      const near = index < 5;
      pit.scale.set(near ? Math.min(vergeWidth * .48, .73) : .96, near ? 1.0 : 1.3, 1);
      pit.position.set(x, .046, z);
      pit.rotation.x = -Math.PI / 2;
      group.add(pit);
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(spread * 3.05, spread * 2.6), shade);
      shadow.position.set(Math.min(glassX - .7, x + .55), .056, z + .75);
      shadow.rotation.x = -Math.PI / 2;
      group.add(shadow);

      if (!near) return;
      const random = seededRandom(9541 + index * 721);
      for (const offset of [-1.63, 1.74]) {
        for (let shoot = 0; shoot < 4; shoot++) {
          const center = new THREE.Vector3(x + (random() - .5) * vergeWidth * .61, .22 + random() * .22, z + offset + (random() - .5) * .74);
          addPlant({ random, center, radius: .24 + random() * .16, count: 60, leaves, hue: hue - .025 });
        }
      }
    });
    setInstances(group, wood, leaves);
    scene.add(group);
    return group;
  }

  window.SuperMarketLandscape = { build };
})();
