'use strict';

(() => {
  const profiles = {
    M3: { front: -2.38, rear: 2.40, beam: .968, roof: 1.43, axle: 1.43, shoulder: .86, windshield: -.61, backlight: .95, flatBack: 1.37, tallGrille: .39, fourDoors: true },
    M4: { front: -2.40, rear: 2.36, beam: .977, roof: 1.37, axle: 1.43, shoulder: .84, windshield: -.51, backlight: .82, flatBack: 1.60, tallGrille: .49, fourDoors: false },
    M5: { front: -2.48, rear: 2.52, beam: 1.014, roof: 1.49, axle: 1.50, shoulder: .91, windshield: -.64, backlight: 1.03, flatBack: 1.42, tallGrille: .28, fourDoors: true },
  };

  const cabinet = new WeakMap();
  const glyphs = {
    '0': ['111', '101', '101', '101', '111'],
    '3': ['111', '001', '111', '001', '111'],
    '4': ['101', '101', '111', '001', '001'],
    '5': ['111', '100', '111', '001', '111'],
    '6': ['111', '100', '111', '101', '111'],
    'İ': ['010', '000', '111', '010', '111'],
    L: ['100', '100', '100', '100', '111'],
    M: ['10001', '11011', '10101', '10001', '10001'],
    O: ['111', '101', '101', '101', '111'],
    P: ['110', '101', '110', '100', '100'],
    S: ['111', '100', '111', '001', '111'],
  };

  function cacheOf(THREE) {
    if (cabinet.has(THREE)) return cabinet.get(THREE);
    const standard = (color, roughness, metalness = 0, extra = {}) =>
      new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
    const presetMaterials = {
      tire: standard(0x191a1c, .93),
      grill: standard(0x171c22, .74, .1, { side: THREE.DoubleSide }),
      anodized: standard(0x252b31, .48, .43), alloy: standard(0xc8cbd0, .31, .69),
      glass: standard(0x29424f, .20, .37),
      headlamp: standard(0xc1dce6, .23, .15, { emissive: 0x95b6d0, emissiveIntensity: .24 }),
      whiteLed: standard(0xfcf5e3, .23, .1, { emissive: 0xfff3cb, emissiveIntensity: .7 }),
      redLens: standard(0x951c30, .25, .16, { emissive: 0x8b1322, emissiveIntensity: .22 }),
      redLed: standard(0xff5951, .26, .1, { emissive: 0xff483a, emissiveIntensity: .65 }),
      blue: standard(0x145995, .38, .19), white: standard(0xf1f1e7, .42, .08),
      policeBlue: standard(0x14385f, .46, .15, { side: THREE.DoubleSide }),
      policeWhite: standard(0xf2f4f2, .32, .45),
    };
    const cache = { presetMaterials, bodyPaints: new Map(), models: new Map(), standard };
    cabinet.set(THREE, cache);
    return cache;
  }

  function meshBuilder(THREE) {
    const cube = new THREE.BoxGeometry(1, 1, 1);
    const cylinder = new THREE.CylinderGeometry(1, 1, 1, 16);
    const strut = new THREE.CylinderGeometry(1, 1, 1, 7);
    const up = new THREE.Vector3(0, 1, 0);
    const planes = new Map();

    function part(role, geometry, at = [0, 0, 0], size = [1, 1, 1], rotation = null) {
      const batch = planes.get(role) || { positions: [], normals: [], indices: [] };
      if (!planes.has(role)) planes.set(role, batch);
      const transform = new THREE.Matrix4().compose(new THREE.Vector3(...at), rotation || new THREE.Quaternion(), new THREE.Vector3(...size));
      const baked = geometry.clone();
      baked.applyMatrix4(transform);
      const offset = batch.positions.length / 3;
      for (const value of baked.getAttribute('position').array) batch.positions.push(value);
      for (const value of baked.getAttribute('normal').array) batch.normals.push(value);
      if (baked.index) {
        for (const index of baked.index.array) batch.indices.push(offset + index);
      } else {
        for (let i = 0; i < baked.getAttribute('position').count; i++) batch.indices.push(offset + i);
      }
      baked.dispose();
      if (geometry !== cube && geometry !== cylinder && geometry !== strut) geometry.dispose();
    }

    function box(role, x, y, z, width, height, depth, turn = 0) {
      const rotation = turn ? new THREE.Quaternion().setFromAxisAngle(up, turn) : null;
      part(role, cube, [x, y, z], [width, height, depth], rotation);
    }

    function rod(role, start, end, radius) {
      const from = new THREE.Vector3(...start);
      const to = new THREE.Vector3(...end);
      const delta = to.clone().sub(from);
      const angle = new THREE.Quaternion().setFromUnitVectors(up, delta.clone().normalize());
      part(role, strut, from.lerp(to, .5).toArray(), [radius, delta.length(), radius], angle);
    }

    function circle(role, center, diameter, height, normal) {
      const orientation = new THREE.Quaternion().setFromUnitVectors(up, new THREE.Vector3(...normal));
      part(role, cylinder, center, [diameter / 2, height, diameter / 2], orientation);
    }

    function surface(role, vertices, faces, smooth = false) {
      let geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 3));
      geometry.setIndex(faces);
      if (!smooth) {
        const flat = geometry.toNonIndexed();
        geometry.dispose();
        geometry = flat;
      }
      geometry.computeVertexNormals();
      part(role, geometry);
    }

    function build() {
      cube.dispose();
      cylinder.dispose();
      strut.dispose();
      return Array.from(planes, ([role, batch]) => {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(batch.positions, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(batch.normals, 3));
        geometry.setIndex(batch.indices);
        geometry.computeBoundingSphere();
        return { role, geometry };
      });
    }

    return { box, rod, circle, part, surface, build };
  }

  function interpolate(stations, coordinate) {
    for (let index = 1; index < stations.length; index++) {
      const next = stations[index];
      if (next[0] < coordinate) continue;
      const prev = stations[index - 1];
      const fraction = (coordinate - prev[0]) / (next[0] - prev[0]);
      return prev.slice(1).map((value, part) => value + (next[part + 1] - value) * fraction);
    }
    return stations.at(-1).slice(1);
  }

  function shell(b, p) {
    const rearDeck = p.shoulder + (p.fourDoors ? .068 : .031);
    const sections = [
      [p.front, .776, .589, .614], [p.front + .15, .92, .678, .706],
      [p.front + .38, .974, .743, .776], [-p.axle, 1, p.shoulder - .016, p.shoulder + .024],
      [-.85, .991, p.shoulder, p.shoulder + .033], [-.40, .976, p.shoulder, p.shoulder + .025],
      [.28, .966, p.shoulder, p.shoulder + .019], [.85, .987, p.shoulder + .006, p.shoulder + .039],
      [p.axle, 1.012, p.shoulder + .023, rearDeck], [p.rear - .22, .991, p.shoulder - .01, rearDeck - .012],
      [p.rear, .881, p.shoulder - .14, rearDeck - .087],
    ];
    const zValues = [...sections.map(section => section[0])];
    for (let z = p.front + .055; z < p.rear; z += .061) zValues.push(z);
    for (const sign of [-1, 1]) {
      for (let step = 0; step <= 12; step++) zValues.push(sign * p.axle + .432 * Math.cos(step * Math.PI / 12));
    }
    const vertices = [];
    const indices = [];
    const filtered = zValues.sort((a, bValue) => a - bValue).filter((z, i, all) => i === 0 || z - all[i - 1] > .001);
    const sectionWidth = 11;
    for (const z of filtered) {
      const [fraction, shoulder, top] = interpolate(sections, z);
      const width = fraction * p.beam;
      const nearAxle = Math.abs(Math.abs(z) - p.axle);
      const arch = nearAxle < .432 ? .357 + Math.sqrt(.432 ** 2 - nearAxle ** 2) : .21;
      const sill = Math.min(shoulder - .025, Math.max(.21, arch));
      const waist = sill + .38 * (shoulder - sill);
      const points = [
        [-.937, sill], [-.995, waist], [-.987, shoulder], [-.75, top - .023], [-.38, top - .007],
        [0, top], [.38, top - .007], [.75, top - .023], [.987, shoulder], [.995, waist], [.937, sill],
      ];
      for (const [factor, y] of points) vertices.push([factor * width, y, z]);
    }
    for (let row = 0; row < filtered.length - 1; row++) {
      for (let column = 0; column < sectionWidth - 1; column++) {
        const start = row * sectionWidth + column;
        const end = start + sectionWidth;
        indices.push(start, end, start + 1, start + 1, end, end + 1);
      }
    }
    b.surface('body', vertices, indices, true);
    for (const end of [0, filtered.length - 1]) {
      const offset = end * sectionWidth;
      const points = vertices.slice(offset, offset + sectionWidth);
      points.unshift([0, .46, filtered[end]]);
      const faces = [];
      for (let index = 1; index < sectionWidth; index++) faces.push(...(end ? [0, index + 1, index] : [0, index, index + 1]));
      faces.push(...(end ? [0, 1, sectionWidth] : [0, sectionWidth, 1]));
      b.surface('body', points, faces);
    }
  }

  function cabin(b, p, police) {
    const glassBase = p.shoulder + .008;
    const ring = [
      [-1.19, .72, glassBase, glassBase + .038, .96],
      [p.windshield, .773, glassBase, p.roof - .068, .79],
      [p.windshield + .17, .785, glassBase, p.roof - .031, .815],
      [p.backlight - .20, .781, glassBase, p.roof - .039, .815],
      [p.backlight + .015, .77, glassBase, p.roof - .061, .82],
      [p.flatBack, .735, glassBase, glassBase + .04, .95],
    ];
    const vertices = [];
    for (const [z, beam, bottom, top, taper] of ring) {
      const half = beam * p.beam;
      vertices.push([-half, bottom, z], [half, bottom, z], [taper * half, top, z], [-taper * half, top, z]);
    }
    const sides = [0, 2, 1, 0, 3, 2];
    for (let i = 0; i < ring.length - 1; i++) {
      for (const side of [1, 2, 3]) {
        const a = i * 4 + side;
        const b = i * 4 + (side + 1) % 4;
        sides.push(a, b, a + 4, b, b + 4, a + 4);
      }
    }
    const last = (ring.length - 1) * 4;
    sides.push(last, last + 1, last + 2, last, last + 2, last + 3);
    b.surface('glass', vertices, sides);

    const roof = [];
    const roofFaces = [];
    const roofStations = [
      [p.windshield + .035, p.roof - .054, .59], [p.windshield + .21, p.roof - .009, .653],
      [p.backlight - .23, p.roof, .654], [p.backlight + .022, p.roof - .052, .587],
    ];
    for (const [z, y, width] of roofStations) {
      roof.push([-width * p.beam, y - .044, z], [-width * .88 * p.beam, y - .009, z],
        [0, y + .006, z], [width * .88 * p.beam, y - .009, z], [width * p.beam, y - .044, z]);
    }
    for (let row = 0; row < roofStations.length - 1; row++) {
      for (let column = 0; column < 4; column++) {
        const a = row * 5 + column;
        roofFaces.push(a, a + 5, a + 1, a + 5, a + 6, a + 1);
      }
    }
    b.surface(police ? 'body' : 'anodized', roof, roofFaces, true);

    for (const side of [-1, 1]) {
      const x = side * p.beam;
      const pillarBottom = glassBase + .017;
      b.rod('body', [x * .742, pillarBottom, -1.165], [x * .611, p.roof - .047, p.windshield + .06], .032);
      b.rod('anodized', [x * .792, pillarBottom, p.fourDoors ? .31 : .51], [x * .644, p.roof - .042, p.fourDoors ? .30 : .51], .029);
      b.rod('body', [x * .755, pillarBottom, p.flatBack - .02], [x * .628, p.roof - .052, p.backlight - .12], .033);
      b.rod('anodized', [x * .754, glassBase + .009, -1.11], [x * .747, glassBase + .009, p.flatBack - .02], .027);
      b.box('body', x * .888, glassBase + .096, -.94, .245, .116, .187, side * .22);
      b.box('glass', x * .90, glassBase + .09, -.843, .218, .073, .028, side * .22);
      for (const z of p.fourDoors ? [.08, .81] : [.38]) b.box('anodized', x * .999, glassBase - .098, z, .023, .028, .15);
      const doors = p.fourDoors ? [-.52, .27, 1.04] : [-.51, .84];
      for (const z of doors) b.rod('anodized', [x * .978, .265, z - .045], [x * .992, p.shoulder - .033, z], .0045);
    }
  }

  function tireAndRim(THREE, b, side, p, z) {
    const tireWidth = .270;
    const radius = .358;
    const centerX = side * (p.beam - .099);
    const axis = [side, 0, 0];
    const rimPlane = centerX + side * (tireWidth / 2 + .009);
    b.circle('tire', [centerX, radius, z], radius * 2, tireWidth, axis);
    b.circle('tire', [rimPlane - side * .014, radius, z], radius * 1.77, .029, axis);
    b.circle('anodized', [rimPlane, radius, z], radius * 1.405, .021, axis);
    b.circle('anodized', [rimPlane + side * .014, radius, z], radius * 1.229, .021, axis);
    const hoop = new THREE.TorusGeometry(radius * .715, .015, 5, 22);
    const rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), side * Math.PI / 2);
    b.part('alloy', hoop, [rimPlane + side * .021, radius, z], [1, 1, 1], rotation);
    for (let i = 0; i < 5; i++) {
      const angle = i * Math.PI * 2 / 5;
      const polar = (theta, distance) => [rimPlane + side * .032, radius + Math.cos(theta) * distance, z + Math.sin(theta) * distance];
      const branch = polar(angle, .148);
      b.rod('alloy', polar(angle, .066), branch, .014);
      b.rod('alloy', branch, polar(angle + .15, .244), .011);
      b.rod('alloy', branch, polar(angle - .13, .244), .011);
    }
    b.circle('alloy', [rimPlane + side * .033, radius, z], .104, .021, axis);
    b.circle('blue', [rimPlane + side * .045, radius, z], .045, .010, axis);
    b.box('redLens', rimPlane + side * .020, radius + .105, z - .168, .014, .092, .084);
  }

  function lettering(b, text, width, center, toPoint, role) {
    const units = Array.from(text, letter => glyphs[letter]?.[0].length || 2);
    const total = units.reduce((sum, value) => sum + value + 1, -1);
    const dot = width / total;
    let offset = -width / 2;
    for (let i = 0; i < text.length; i++) {
      const glyph = glyphs[text[i]];
      if (glyph) {
        for (let row = 0; row < glyph.length; row++) {
          for (let col = 0; col < glyph[row].length; col++) {
            if (glyph[row][col] !== '1') continue;
            const [at, dimensions] = toPoint(center, offset + dot * (col + .5), (2 - row) * dot, dot);
            b.box(role, ...at, ...dimensions);
          }
        }
      }
      offset += (units[i] + 1) * dot;
    }
  }

  function plate(b, z, y, side, police, model) {
    const backing = [0, y, z];
    b.box('anodized', ...backing, .44, .135, .026);
    b.box('white', 0, y, z + side * .016, .415, .115, .010);
    b.box('blue', side * -.174, y, z + side * .023, .056, .115, .006);
    const code = police ? '06 POL 05' : `06 M${model.slice(1)} 06`;
    const point = (center, x, rise, size) => [[side * (center[0] + x + .024), center[1] + rise, center[2]], [size * .83, size * .89, .008]];
    lettering(b, code, .309, [0, y, z + side * .025], point, 'grill');
  }

  function roundel(THREE, b, center, vertical) {
    const normal = vertical ? [0, 0, 1] : [0, 1, 0];
    b.circle('alloy', center, .136, .013, normal);
    const move = rise => [center[0], center[1] + normal[1] * rise, center[2] + normal[2] * rise];
    b.circle('anodized', move(.008), .122, .010, normal);
    b.circle('white', move(.015), .086, .008, normal);
    const tilt = vertical ? null : new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
    for (const angle of [0, Math.PI]) b.part('blue', new THREE.CircleGeometry(.043, 10, angle, Math.PI / 2), move(.021), [1, 1, 1], tilt);
  }

  function front(THREE, b, p) {
    const zBumper = p.front - .018;
    const zGrille = p.front - .028;
    const grilleMid = .525;
    const grilleWidth = p.tallGrille > .35 ? .235 : .280;
    const halfHeight = p.tallGrille / 2;
    for (const mirror of [-1, 1]) {
      const xGrille = mirror * (grilleWidth / 2 + .026);
      const shape = [
        [-.46, .83], [-.31, 1], [.30, .97], [.52, .75], [.49, -.68], [.23, -1],
        [-.28, -.91], [-.52, -.60],
      ].map(([x, y]) => [xGrille + mirror * x * grilleWidth, grilleMid + y * halfHeight, zGrille]);
      const border = shape.map(([x, y, z]) => new THREE.Vector3(x, y, z - .007));
      const outline = new THREE.CatmullRomCurve3(border, true, 'centripetal');
      b.part('alloy', new THREE.TubeGeometry(outline, 36, .013, 5, true));
      const fan = [];
      for (let i = 1; i < shape.length - 1; i++) fan.push(0, i, i + 1);
      b.surface('grill', shape, fan);
      for (const x of [-.32, -.14, .03, .21, .35]) b.rod('anodized',
        [xGrille + x * grilleWidth, grilleMid - halfHeight * .71, zGrille - .010],
        [xGrille + x * grilleWidth, grilleMid + halfHeight * .81, zGrille - .010], .007);

      const lamp = [
        [mirror * .388, .595, zBumper - .006], [mirror * .702, .612, zBumper + .011],
        [mirror * .854, .662, zBumper + .109], [mirror * .843, .717, zBumper + .120],
        [mirror * .676, .702, zBumper + .040], [mirror * .392, .677, zBumper - .009],
      ];
      const lampTriangles = mirror > 0 ? [0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 5, 4] : [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5];
      b.surface('headlamp', lamp, lampTriangles);
      b.rod('whiteLed', [mirror * .411, .631, zBumper - .019], [mirror * .648, .645, zBumper - .002], .012);
      b.rod('whiteLed', [mirror * .648, .645, zBumper - .002], [mirror * .826, .687, zBumper + .099], .012);
      b.box('grill', mirror * .635, .379, zBumper + .028, .322, .115, .029, mirror * .13);
      b.box('anodized', mirror * .66, .278, zBumper + .006, .371, .043, .108, mirror * .16);
    }
    b.box('grill', 0, .284, zBumper + .010, .49, .075, .024);
    b.box('anodized', 0, .225, zBumper + .029, 1.35, .045, .102);
    roundel(THREE, b, [0, .729, p.front + .206], false);
  }

  function rear(THREE, b, p) {
    const z = p.rear + .021;
    b.box('anodized', 0, .299, z - .024, p.beam * 1.53, .153, .101);
    for (const mirror of [-1, 1]) {
      const tail = [[mirror * .39, .645, z + .003], [mirror * .75, .653, z + .004],
        [mirror * .864, .695, z - .102], [mirror * .857, .763, z - .121],
        [mirror * .71, .752, z - .013], [mirror * .392, .727, z + .002]];
      const faces = mirror > 0 ? [0, 1, 2, 0, 2, 3, 0, 3, 4, 0, 4, 5] : [0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 5, 4];
      b.surface('redLens', tail, faces);
      b.rod('redLed', [mirror * .408, .683, z + .017], [mirror * .741, .689, z + .013], .013);
      b.rod('redLed', [mirror * .741, .689, z + .013], [mirror * .846, .732, z - .089], .013);
      for (const offset of [-.056, .056]) {
        const x = mirror * (.632 + offset);
        b.circle('alloy', [x, .294, z + .045], .086, .084, [0, 0, 1]);
        b.circle('grill', [x, .294, z + .091], .061, .016, [0, 0, 1]);
      }
    }
    roundel(THREE, b, [0, .707, z + .013], true);
  }

  function policeTrim(b, p) {
    for (const mirror of [-1, 1]) {
      const strokes = [[-.69, .70], [.45, .70], [1.01, .539], [-.69, .487]];
      const swatch = strokes.map(([z, y]) => [mirror * (p.beam - .002), y, z]);
      b.surface('policeBlue', swatch, [0, 1, 2, 0, 2, 3]);
      const point = (center, x, rise, size) => [[center[0], center[1] + rise, center[2] + mirror * x], [.012, size * .89, size * .85]];
      lettering(b, 'POLİS', .66, [mirror * (p.beam + .012), .603, .08], point, 'white');
    }
    b.box('anodized', 0, p.roof + .041, .163, .851, .068, .284);
    b.box('alloy', 0, p.roof + .062, .163, .070, .033, .280);
    b.box('sirenRed', -.219, p.roof + .107, .163, .402, .074, .265);
    b.box('sirenBlue', .219, p.roof + .107, .163, .402, .074, .265);
  }

  function prepare(THREE, model, police) {
    const b = meshBuilder(THREE);
    const p = profiles[model];
    shell(b, p);
    cabin(b, p, police);
    front(THREE, b, p);
    rear(THREE, b, p);
    for (const side of [-1, 1]) {
      for (const z of [-p.axle, p.axle]) tireAndRim(THREE, b, side, p, z);
      b.box('anodized', side * (p.beam - .050), .220, -.005, .097, .071, 1.848);
    }
    plate(b, p.front - .054, .348, -1, police, model);
    plate(b, p.rear + .049, .513, 1, police, model);
    if (police) policeTrim(b, p);
    return b.build();
  }

  function create(THREE, { color = 0x356189, model = 'M3', police = false } = {}) {
    const cache = cacheOf(THREE);
    const type = Object.hasOwn(profiles, model) ? model : 'M3';
    const variant = `${type}:${Boolean(police)}`;
    if (!cache.models.has(variant)) cache.models.set(variant, prepare(THREE, type, police));
    const paint = new THREE.Color(color);
    const key = paint.getHex();
    if (!police && !cache.bodyPaints.has(key)) cache.bodyPaints.set(key, cache.standard(paint, .32, .37));

    const car = new THREE.Group();
    car.name = police ? `BMW ${type} Polis` : `BMW ${type}`;
    car.userData.model = type;
    car.userData.police = Boolean(police);
    car.userData.metrics = { width: profiles[type].beam * 2, length: profiles[type].rear - profiles[type].front, roof: profiles[type].roof };
    const materials = {
      ...cache.presetMaterials,
      body: police ? cache.presetMaterials.policeWhite : cache.bodyPaints.get(key),
    };
    if (police) {
      materials.sirenRed = cache.standard(0xe83342, .24, .13, { emissive: 0xf9333d, emissiveIntensity: .12 });
      materials.sirenBlue = cache.standard(0x3278ff, .24, .13, { emissive: 0x357aff, emissiveIntensity: .12 });
      car.userData.sirenRed = materials.sirenRed;
      car.userData.sirenBlue = materials.sirenBlue;
    }
    for (const { role, geometry } of cache.models.get(variant)) car.add(new THREE.Mesh(geometry, materials[role]));
    return car;
  }

  window.BMWAraclari = { create };
})();
