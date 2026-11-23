'use strict';

(() => {
  const facadePlots = [
    { distance: 24, side: -1, variant: 0 }, { distance: 32, side: 1, variant: 2 },
    { distance: 68, side: -1, variant: 1 }, { distance: 83, side: 1, variant: 0 },
    { distance: 407, side: -1, variant: 2 }, { distance: 630, side: -1, variant: 0 },
    { distance: 688, side: -1, variant: 2 }, { distance: 840, side: -1, variant: 1 },
    { distance: 958, side: -1, variant: 0 }, { distance: 1068, side: 1, variant: 1 },
    { distance: 1112, side: -1, variant: 2 }, { distance: 1440, side: 1, variant: 2 },
    { distance: 1514, side: -1, variant: 0 }, { distance: 1602, side: 1, variant: 1 },
    { distance: 1824, side: -1, variant: 1 }, { distance: 2168, side: 1, variant: 2 },
    { distance: 2217, side: -1, variant: 0 }, { distance: 2508, side: 1, variant: 0 },
    { distance: 2650, side: -1, variant: 2 }, { distance: 2768, side: 1, variant: 1 },
  ];

  function seedRandom(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function makeTexture(T, kind) {
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 256;
    const context = canvas.getContext('2d');
    const random = seedRandom(kind === 'soil' ? 562 : 219);
    const base = kind === 'soil' ? [153, 124, 88] : [219, 215, 204];
    const pixels = context.createImageData(256, 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const index = (y * 256 + x) * 4;
        const ripple = Math.sin(x / 8 + Math.cos(y / 13)) * Math.cos(y / 17);
        const variation = (random() - .5) * (kind === 'soil' ? 57 : 24) + ripple * 11;
        for (let channel = 0; channel < 3; channel++) pixels.data[index + channel] = base[channel] + variation;
        pixels.data[index + 3] = 255;
      }
    }
    context.putImageData(pixels, 0, 0);
    if (kind === 'soil') {
      for (let i = 0; i < 330; i++) {
        const width = .35 + random() * 1.9;
        context.fillStyle = ['#665946', '#9d8860', '#c9af87', '#ae926b'][i % 4];
        context.fillRect(random() * 256, random() * 256, width, width * .78);
      }
    }
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.wrapS = texture.wrapT = T.RepeatWrapping;
    return texture;
  }

  function makeLeafGeometry(T) {
    const points = [];
    const steps = 10;
    const strand = t => [t * 2.18, .58 * Math.sin(t * Math.PI) - t * t * .75, 0];
    for (let index = 1; index < steps; index++) {
      const t = index / steps;
      const [x, y] = strand(t);
      const [nextX, nextY] = strand((index + 1) / steps);
      const width = .34 * Math.sin(t * Math.PI) + .045;
      for (const sign of [-1, 1]) {
        points.push(x, y, 0, nextX, nextY, 0, x + .31 * (1 - t), y - .15, sign * width);
      }
    }
    const leaf = new T.BufferGeometry();
    leaf.setAttribute('position', new T.Float32BufferAttribute(points, 3));
    leaf.computeVertexNormals();
    return leaf;
  }

  function init({ scene, roadCenter, roadHeading, roadLength }) {
    const T = window.THREE;
    if (!T || !scene) return null;
    const standard = (color, options = {}) => new T.MeshStandardMaterial({ color, roughness: .83, ...options });
    const plaster = makeTexture(T, 'plaster');
    const soilMap = makeTexture(T, 'soil');
    soilMap.repeat.set(4, 7);
    const materials = {
      facades: [0xfff6de, 0xd8dddb, 0xf3dccb].map(color => standard(color, { map: plaster })),
      trim: standard(0xe2d7bf, { map: plaster }), concrete: standard(0xa8a6a0, { map: plaster }),
      dark: standard(0x313736), rail: standard(0x546565, { roughness: .53, metalness: .29 }),
      shadow: standard(0x4b534c), panel: standard(0x987658, { map: plaster }),
      window: standard(0x436473, { roughness: .22, metalness: .37 }),
      windowLight: standard(0x7296a0, { roughness: .26, metalness: .26 }),
      balcony: standard(0x769ca7, { roughness: .22, metalness: .29 }),
      soil: standard(0xc8b7a0, { map: soilMap }), gravel: standard(0xbab3a3, { map: soilMap }),
      lawn: standard(0x748552, { map: soilMap }), path: standard(0xcac0a9, { map: plaster }),
      bush: standard(0x516447), bushLight: standard(0x727e4d), trunk: standard(0x7c644a, { map: plaster }),
      barkRing: standard(0x5d4e3d), palm: standard(0x456838, { side: T.DoubleSide }),
      palmSun: standard(0x6b8443, { side: T.DoubleSide }), asphalt: standard(0x3e4345),
      line: standard(0xe7e4d5), amber: standard(0xdcab59),
      lamp: standard(0xffe4bb, { emissive: 0xffc66b, emissiveIntensity: .8 }),
      plane: standard(0xeceff0, { roughness: .38, metalness: .1 }), planeStripe: standard(0x365d73),
      planeGlass: standard(0x294453, { roughness: .25 }),
      planeRed: new T.MeshBasicMaterial({ color: 0xff6458 }), planeGreen: new T.MeshBasicMaterial({ color: 0x8bffcc }),
    };
    const geometries = {
      box: new T.BoxGeometry(1, 1, 1), sphere: new T.SphereGeometry(1, 9, 6),
      trunk: new T.CylinderGeometry(.64, 1, 1, 9), circle: new T.CylinderGeometry(1, 1, 1, 9),
      cone: new T.ConeGeometry(1, 1, 12), leaf: makeLeafGeometry(T),
    };
    const markers = [];
    const movingCars = [];
    const sceneRoot = new T.Group();
    sceneRoot.name = 'Yol sahnesi: konutlar, köprüler ve hava trafiği';
    scene.add(sceneRoot);

    function roadGroup(distance, side = 0, offset = 0) {
      const z = -distance;
      const group = new T.Group();
      group.rotation.y = roadHeading(z);
      group.position.set(roadCenter(z) + side * offset, 0, z);
      sceneRoot.add(group);
      markers.push({ distance, group });
      return group;
    }

    function newBatch(group) {
      return { group, materials: new Map(), dummy: new T.Object3D() };
    }

    function shape(batch, geometry, material, size, position, angles = [0, 0, 0]) {
      let meshes = batch.materials.get(material);
      if (!meshes) batch.materials.set(material, meshes = new Map());
      let instances = meshes.get(geometry);
      if (!instances) meshes.set(geometry, instances = []);
      const dummy = batch.dummy;
      dummy.position.set(...position);
      dummy.rotation.set(...angles);
      dummy.scale.set(...size);
      dummy.updateMatrix();
      instances.push(dummy.matrix.clone());
    }

    function box(batch, material, width, height, depth, x, y, z, angle = 0) {
      shape(batch, geometries.box, material, [width, height, depth], [x, y, z], [0, angle, 0]);
    }

    function buildBatch(batch) {
      for (const [material, meshes] of batch.materials) {
        for (const [geometry, matrices] of meshes) {
          const mesh = new T.InstancedMesh(geometry, material, matrices.length);
          matrices.forEach((matrix, index) => mesh.setMatrixAt(index, matrix));
          mesh.instanceMatrix.needsUpdate = true;
          mesh.computeBoundingSphere();
          batch.group.add(mesh);
        }
      }
    }

    function palm(batch, x, z, scale, direction) {
      const stemHeight = 5.6 * scale;
      shape(batch, geometries.trunk, materials.trunk, [.29 * scale, stemHeight, .29 * scale], [x, stemHeight / 2, z], [0, .4, -.025]);
      for (let n = 1; n < 7; n++) {
        const radius = scale * (.31 - n * .012);
        shape(batch, geometries.circle, materials.barkRing, [radius, .045, radius], [x + n * .014, n * stemHeight / 7, z]);
      }
      for (let n = 0; n < 12; n++) {
        const yaw = n * Math.PI / 6 + direction;
        const frond = scale * (n < 8 ? 1 : .72);
        shape(batch, geometries.leaf, n % 3 ? materials.palm : materials.palmSun,
          [frond, scale, frond], [x + .06, stemHeight - (n < 8 ? .1 : -.25), z], [0, yaw, n < 8 ? -.08 : .36]);
      }
    }

    function buildResidence(plot) {
      if (plot.distance > roadLength - 75) return;
      const { distance, side, variant } = plot;
      const isNearFork = distance === 407;
      const group = roadGroup(distance, side, isNearFork ? 56 : 34);
      group.rotation.y += side > 0 ? -Math.PI / 2 : Math.PI / 2;
      const batch = newBatch(group);
      const facade = materials.facades[variant];
      const width = [24, 26.5, 23][variant];
      const depth = [14, 13, 15][variant];
      const floor = 3.2;
      // Original forms inspired by the low, pastel and glazed blocks in the design reference.
      const storeys = variant === 2 ? 4 : 3;
      const base = 1.05;
      const front = depth / 2;
      const roofY = base + floor * storeys;
      const random = seedRandom(distance * 761 + variant);

      box(batch, materials.soil, width + 13, .04, depth + 21, 0, .025, 1.6);
      box(batch, materials.lawn, width + 5, .055, 6.5, 0, .065, front + 4.25);
      box(batch, materials.path, width + 8, .07, 2.05, 0, .086, front + 8.1);
      box(batch, materials.path, 2.2, .07, 7.7, 0, .098, front + 3.4);
      box(batch, materials.gravel, width + 4, .05, 1.25, 0, .09, front + .4);
      box(batch, materials.concrete, width + .55, base, depth + .65, 0, base / 2, 0);
      box(batch, facade, width, floor * storeys, depth, 0, base + floor * storeys / 2, 0);

      for (const x of [-width * .28, width * .28]) {
        box(batch, materials.panel, .93, roofY - 1, .15, x, (roofY + 1) / 2, front + .03);
      }

      const columns = 6;
      const step = (width - 2.3) / columns;
      for (let storey = 0; storey < storeys; storey++) {
        const level = base + floor * storey;
        box(batch, materials.trim, width + .16, .17, depth + .16, 0, level + .04, 0);
        for (let column = 0; column < columns; column++) {
          const x = -width / 2 + 1.15 + (column + .5) * step;
          const door = storey === 0 && column === 3;
          const windowWidth = door ? 1.72 : step * .7;
          const windowHeight = door ? 2.55 : 2.12;
          const y = level + (door ? 1.3 : 1.56);
          box(batch, materials.shadow, windowWidth + .30, windowHeight + .18, .13, x, y, front + .055);
          box(batch, column % 3 ? materials.window : materials.windowLight, windowWidth, windowHeight, .075, x, y, front + .14);
          box(batch, materials.rail, .06, windowHeight, .055, x, y, front + .197);
          box(batch, materials.windowLight, windowWidth * .19, windowHeight * .88, .034, x - windowWidth * .29, y, front + .188);
          if (storey && (column + variant) % 3 !== 2) {
            const slab = windowWidth + .88;
            box(batch, materials.trim, slab, .20, 1.52, x, level + .26, front + .76);
            box(batch, materials.balcony, slab - .20, .68, .047, x, level + .70, front + 1.49);
            box(batch, materials.rail, slab, .068, .079, x, level + 1.06, front + 1.51);
            for (const end of [-1, 1]) {
              box(batch, materials.rail, .059, .75, .079, x + end * (slab / 2 - .12), level + .70, front + 1.5);
              box(batch, materials.balcony, .051, .67, 1.21, x + end * (slab / 2 - .11), level + .7, front + .84);
            }
          }
        }
        for (const x of [-width / 2, width / 2]) {
          for (const z of [-front * .55, front * .32]) {
            box(batch, materials.trim, .13, 2.0, 2.55, x, level + 1.57, z);
            box(batch, materials.window, .135, 1.78, 2.32, x * 1.006, level + 1.57, z);
          }
        }
      }

      box(batch, materials.trim, width + .68, .28, depth + .72, 0, roofY, 0);
      box(batch, facade, width * .58, 1.67, depth * .46, variant - .9, roofY + .81, -depth * .19);
      box(batch, materials.rail, width + .11, .56, .12, 0, roofY + .39, front);
      box(batch, materials.trim, width * .63, .16, depth * .50, variant - .9, roofY + 1.68, -depth * .19);
      box(batch, materials.path, 5.45, .17, 1.88, 0, .6, front + .90);
      box(batch, materials.trim, 5.47, .15, 1.72, 0, 3.83, front + .87);

      for (const side of [-1, 1]) {
        const x = side * (width * .39 + 1.8);
        palm(batch, x, front + 5.0, .76 + random() * .27, random() * 6);
        for (let i = 0; i < 5; i++) {
          const dx = x + (i - 2) * .93;
          const radius = .36 + random() * .28;
          shape(batch, geometries.sphere, i % 2 ? materials.bush : materials.bushLight,
            [radius * 1.55, radius * .78, radius], [dx, radius * .73, front + 6.52]);
        }
      }
      buildBatch(batch);
    }

    function illuminatedSign(parent, heading, detail, direction, size, location) {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 320;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#123d54';
      ctx.fillRect(0, 0, 1024, 320);
      ctx.strokeStyle = '#edf4ee';
      ctx.lineWidth = 12;
      ctx.strokeRect(20, 20, 984, 280);
      ctx.fillStyle = '#f4f7ee';
      ctx.font = 'bold 92px Arial, sans-serif';
      ctx.fillText(heading, 69, 135);
      ctx.font = 'bold 53px Arial, sans-serif';
      ctx.fillText(detail, 72, 235);
      ctx.beginPath();
      ctx.moveTo(877, 231);
      ctx.lineTo(877, 105);
      ctx.lineTo(830, 152);
      ctx.moveTo(877, 105);
      ctx.lineTo(924, 152);
      ctx.stroke();
      const texture = new T.CanvasTexture(canvas);
      texture.colorSpace = T.SRGBColorSpace;
      const mesh = new T.Mesh(new T.PlaneGeometry(...size), new T.MeshBasicMaterial({ map: texture, toneMapped: false }));
      mesh.position.set(...location);
      mesh.rotation.y = direction;
      parent.add(mesh);
    }

    function addStreetDetails(distance, label, description) {
      const group = roadGroup(distance);
      const batch = newBatch(group);
      for (const side of [-1, 1]) {
        box(batch, materials.rail, .16, 6.0, .16, side * 12.6, 3, 0);
        box(batch, materials.rail, 2.8, .09, .15, side * 11.5, 5.91, 0);
        box(batch, materials.dark, .7, .18, .32, side * 10.15, 5.83, .04);
        box(batch, materials.lamp, .57, .045, .23, side * 10.15, 5.72, .04);
      }
      box(batch, materials.rail, .26, 5.65, .26, 8.89, 2.82, 0);
      box(batch, materials.dark, 6.5, 2.04, .22, 8.89, 5.40, .10);
      illuminatedSign(group, label, description, 0, [6.4, 2.0], [8.89, 5.4, .225]);
      buildBatch(batch);
    }

    function smallCar(color) {
      const group = new T.Group();
      const batch = newBatch(group);
      const paint = standard(color, { roughness: .35, metalness: .24 });
      box(batch, paint, 1.78, .49, 4.20, 0, .64, 0);
      box(batch, paint, 1.44, .39, 2.02, 0, 1.05, .2);
      box(batch, materials.window, 1.44, .32, .036, 0, 1.08, -.82);
      box(batch, materials.window, 1.44, .30, .036, 0, 1.08, 1.22);
      for (const side of [-1, 1]) {
        box(batch, materials.window, .034, .27, 1.8, side * .724, 1.08, .2);
        box(batch, materials.lamp, .38, .12, .08, side * .61, .73, -2.11);
        box(batch, materials.planeRed, .33, .12, .08, side * .62, .73, 2.11);
        for (const z of [-1.34, 1.32]) {
          shape(batch, geometries.circle, materials.dark, [.33, .24, .33], [side * .89, .33, z], [0, 0, Math.PI / 2]);
        }
      }
      buildBatch(batch);
      return group;
    }

    const bridgeCars = new Map();
    function bridgeVehicle(which, color) {
      const key = `${which}:${color}`;
      if (bridgeCars.has(key)) return bridgeCars.get(key).clone(true);
      const detailed = window.KuryeAraclari?.createCar(which, color);
      if (!detailed) return smallCar(color);

      // Parts with the same material render together at bridge viewing distances.
      const groups = new Map();
      detailed.updateMatrixWorld(true);
      detailed.traverse(part => {
        if (!part.isMesh) return;
        const geometry = part.geometry.index ? part.geometry.toNonIndexed() : part.geometry.clone();
        geometry.applyMatrix4(part.matrixWorld);
        let parts = groups.get(part.material);
        if (!parts) groups.set(part.material, parts = { positions: [], normals: [] });
        parts.positions.push(...geometry.attributes.position.array);
        parts.normals.push(...geometry.attributes.normal.array);
        geometry.dispose();
      });
      const car = new T.Group();
      car.name = which;
      for (const [material, parts] of groups) {
        const geometry = new T.BufferGeometry();
        geometry.setAttribute('position', new T.Float32BufferAttribute(parts.positions, 3));
        geometry.setAttribute('normal', new T.Float32BufferAttribute(parts.normals, 3));
        geometry.computeBoundingSphere();
        car.add(new T.Mesh(geometry, material));
      }
      bridgeCars.set(key, car);
      return car.clone(true);
    }

    function bridge(distance) {
      const group = roadGroup(distance);
      const batch = newBatch(group);
      const deckY = 6.8;
      const rampLength = 46;
      const rampSlope = Math.atan2(deckY, rampLength);
      box(batch, materials.concrete, 104, .63, 8.7, 0, deckY, 0);
      box(batch, materials.asphalt, 103.8, .11, 7.5, 0, deckY + .35, 0);
      for (const side of [-1, 1]) {
        box(batch, materials.concrete, 104, .48, .30, 0, deckY + .63, side * 4.18);
        box(batch, materials.rail, 104, .12, .14, 0, deckY + 1.12, side * 4.18);
        for (let x = -51; x <= 51; x += 3) box(batch, materials.rail, .09, .49, .12, x, deckY + .88, side * 4.18);
        for (const x of [side * 17.9, side * 39]) {
          box(batch, materials.concrete, 2.7, deckY - .35, 4.7, x, (deckY - .35) / 2, 0);
          box(batch, materials.concrete, 3.6, .62, 6.2, x, deckY - .43, 0);
        }
        box(batch, materials.dark, 23, .06, .41, side * 15.3, deckY - .34, 1.8);
        for (const x of [side * 6.1, side * 12.1]) {
          box(batch, materials.lamp, 1.9, .12, .29, x, deckY - .40, .41);
        }
        const rampAngle = -side * rampSlope;
        const rampX = side * (52 + rampLength / 2 - .20);
        const rampTop = Math.hypot(rampLength, deckY) + .3;
        const layRamp = (material, width, height, depth, y, z) => shape(batch, geometries.box,
          [width, height, depth], [rampX, deckY / 2 + y, z], [0, 0, rampAngle]);
        layRamp(materials.concrete, rampTop, .54, 8.62, 0, 0);
        layRamp(materials.asphalt, rampTop, .09, 7.5, .31, 0);
        for (const railing of [-1, 1]) layRamp(materials.rail, rampTop, .11, .14, .59, railing * 4.18);
        for (let offset = 4; offset < rampLength - 1; offset += 5.5) {
          const height = deckY * (1 - offset / rampLength) + .37;
          shape(batch, geometries.box, materials.line, [2.25, .026, .11],
            [side * (52 + offset), height, 0], [0, 0, rampAngle]);
        }
      }
      for (let x = -49; x < 51; x += 5.5) box(batch, materials.line, 2.25, .025, .11, x, deckY + .42, 0);
      buildBatch(batch);
      const palette = [0x354a68, 0xa4adb2, 0x2f3035, 0x6e3530];
      for (let i = 0; i < 4; i++) {
        const car = bridgeVehicle(i % 2 ? 'm5' : 'm4', palette[i]);
        const direction = i % 2 === 0 ? 1 : -1;
        car.rotation.order = 'ZXY';
        car.rotation.y = direction * -Math.PI / 2;
        car.position.set(-38 + i * 23, deckY + .43, direction * -1.75);
        group.add(car);
        movingCars.push({ distance, mesh: car, phase: i * 53, direction, speed: 8.0 + i * .72, deckY, rampLength, rampSlope });
      }
    }

    function wingGeometry() {
      const points = [
        0, 0, -1.6, 0, 0, 2.7, 7.6, .18, 1.9,
        0, 0, -1.6, 7.6, .18, 1.9, 7.6, .18, .63,
        0, 0, 2.7, 0, 0, -1.6, -7.6, .18, .63,
        0, 0, 2.7, -7.6, .18, .63, -7.6, .18, 1.9,
      ];
      const result = new T.BufferGeometry();
      result.setAttribute('position', new T.Float32BufferAttribute(points, 3));
      result.computeVertexNormals();
      return result;
    }

    function buildAirplane() {
      const plane = new T.Group();
      plane.name = 'Uçuş rotasındaki yolcu uçağı';
      const batch = newBatch(plane);
      const fuselageGeometry = new T.CapsuleGeometry(.87, 10.5, 6, 12);
      shape(batch, fuselageGeometry, materials.plane, [1, 1, 1], [0, 0, 0], [Math.PI / 2, 0, 0]);
      const wingMaterial = standard(0xdde2e3, { roughness: .46, metalness: .14, side: T.DoubleSide });
      shape(batch, wingGeometry(), wingMaterial, [1, 1, 1], [0, -.36, -.4]);
      shape(batch, wingGeometry(), wingMaterial, [.38, .7, .46], [0, .22, 4.1]);
      box(batch, materials.planeStripe, .16, 2.2, 1.32, 0, 1.11, 4.88);
      box(batch, materials.planeGlass, 1.15, .27, .095, 0, .36, -5.48);
      for (const side of [-1, 1]) {
        shape(batch, geometries.circle, materials.plane, [.41, 1.59, .41], [side * 2.27, -.61, -.21], [Math.PI / 2, 0, 0]);
        shape(batch, geometries.circle, materials.dark, [.29, .05, .29], [side * 2.27, -.61, -1.02], [Math.PI / 2, 0, 0]);
        for (let z = -4.23; z < 4.3; z += .55) box(batch, materials.planeGlass, .052, .2, .23, side * .86, .18, z);
        shape(batch, geometries.sphere, side < 0 ? materials.planeRed : materials.planeGreen,
          [.16, .16, .16], [side * 7.6, -.17, .62]);
      }
      buildBatch(batch);
      sceneRoot.add(plane);
      return plane;
    }

    for (const plot of facadePlots) buildResidence(plot);
    for (const distance of [178, 552, 1563, 2370]) {
      if (distance > roadLength - 105) continue;
      const group = roadGroup(distance);
      const batch = newBatch(group);
      for (const side of [-1, 1]) {
        if (distance === 552 && side > 0) continue;
        box(batch, materials.soil, 17, .043, 56, side * 25, .014, 0);
        box(batch, materials.lawn, 12, .04, 53, side * 33, .032, .44);
        box(batch, materials.gravel, 2.1, .041, 48, side * 18, .04, -1.2);
        for (let i = 0; i < 4; i++) palm(batch, side * (20.5 + (i % 2) * 1.7), -21 + i * 13.8, .78 + i * .063, i * 2.39);
      }
      buildBatch(batch);
    }
    for (const distance of [470, 1690, 2420]) if (distance < roadLength - 130) bridge(distance);
    const signs = [
      { distance: 113, title: 'BEYTEPE', label: 'KONUTLAR' },
      { distance: 424, title: 'ÇEVRE YOLU', label: 'ÜST GEÇİT' },
      { distance: 1551, title: 'BEYTEPE', label: 'ŞEHİR MERKEZİ' },
      { distance: roadLength - 440, title: 'HAVALİMANI', label: 'TERMİNAL' },
    ];
    for (const sign of signs) if (sign.distance > 0 && sign.distance < roadLength) addStreetDetails(sign.distance, sign.title, sign.label);
    const airplane = buildAirplane();

    let lastVisiblePosition = Infinity;
    let flightSegment;
    function update(distance, now) {
      if (Math.abs(distance - lastVisiblePosition) > 28) {
        lastVisiblePosition = distance;
        for (const marker of markers) marker.group.visible = Math.abs(marker.distance - distance) < 445;
        flightSegment = Math.floor(distance / 460);
      }
      const seconds = now * .001;
      for (const entry of movingCars) {
        if (Math.abs(entry.distance - distance) > 350) continue;
        const boundary = 52 + entry.rampLength;
        const x = entry.direction * ((seconds * entry.speed + entry.phase) % (boundary * 2) - boundary);
        const rampDistance = Math.max(0, Math.abs(x) - 52);
        entry.mesh.position.x = x;
        entry.mesh.position.y = .43 + entry.deckY * (1 - rampDistance / entry.rampLength);
        entry.mesh.rotation.z = rampDistance ? -Math.sign(x) * entry.rampSlope : 0;
      }
      const flightZ = -Math.min(roadLength + 130, flightSegment * 460 + 218);
      airplane.position.set(roadCenter(flightZ) + (seconds * 9 % 198) - 99, 26 + Math.sin(seconds * .45) * 3.9, flightZ);
      airplane.rotation.set(.034, -Math.PI / 2 + .1, .032 * Math.sin(seconds * .55));
    }

    const ownsPlot = (z, side) => facadePlots.some(plot =>
      plot.side === side && plot.distance !== 407 && plot.distance < roadLength - 75 && Math.abs(plot.distance + z) < 27
    );
    update(0, performance.now());
    return { ownsPlot, update };
  }

  window.TeslimatYolSahnesi = { init };
})();
