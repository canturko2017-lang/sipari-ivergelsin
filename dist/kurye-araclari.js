'use strict';

(() => {
  const T = window.THREE;
  if (!T) return;

  const paint = (color, roughness, metalness = 0) => new T.MeshStandardMaterial({ color, roughness, metalness });
  const rubber = paint(0x16181b, 0.92);
  const carbon = paint(0x171f22, 0.39, 0.25);
  const chrome = paint(0xaeb8bb, 0.28, 0.7);
  const windows = paint(0x334654, 0.22, 0.28);
  const rimBlack = paint(0x2a2d32, 0.35, 0.64);
  const lime = paint(0x62b832, 0.34, 0.24);
  const whiteLight = new T.MeshStandardMaterial({ color: 0xf3f8ff, emissive: 0xb0d7ff, emissiveIntensity: 0.9 });
  const redLight = new T.MeshStandardMaterial({ color: 0xf14a37, emissive: 0xe6221b, emissiveIntensity: 0.9 });
  const orange = paint(0xeb851d, 0.34, 0.32);
  const cache = new Map();

  function mesh(parent, geometry, material, x = 0, y = 0, z = 0) {
    const part = new T.Mesh(geometry, material);
    part.position.set(x, y, z);
    parent.add(part);
    return part;
  }

  function box(parent, w, h, d, material, x, y, z) {
    return mesh(parent, new T.BoxGeometry(w, h, d), material, x, y, z);
  }

  function strut(parent, from, to, radius, material) {
    const start = new T.Vector3(...from);
    const finish = new T.Vector3(...to);
    const delta = finish.clone().sub(start);
    const tube = mesh(parent, new T.CylinderGeometry(radius, radius, delta.length(), 8), material);
    tube.position.copy(start).lerp(finish, 0.5);
    tube.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
    return tube;
  }

  const ring = [[-.78, 0], [.78, 0], [.97, .19], [1, .53], [.94, .81], [.70, 1], [-.70, 1], [-.94, .81], [-1, .53], [-.97, .19]];

  // Each section supplies z, half-width, lower edge and shoulder height.
  function bodyShell(parent, sections, material) {
    const vertices = [];
    const faces = [];
    for (const [z, width, bottom, top] of sections) {
      for (const [x, y] of ring) vertices.push(x * width, bottom + y * (top - bottom), z);
    }
    const stride = ring.length;
    for (let index = 0; index < sections.length - 1; index++) {
      for (let side = 0; side < stride; side++) {
        const a = index * stride + side;
        const b = index * stride + (side + 1) % stride;
        faces.push(a, b, a + stride, b, b + stride, a + stride);
      }
    }
    const last = (sections.length - 1) * stride;
    for (let side = 1; side < stride - 1; side++) {
      faces.push(0, side + 1, side, last, last + side, last + side + 1);
    }
    const shape = new T.BufferGeometry();
    shape.setAttribute('position', new T.Float32BufferAttribute(vertices, 3));
    shape.setIndex(faces);
    shape.computeVertexNormals();
    return mesh(parent, shape, material);
  }

  function wheel(parent, x, y, z, radius, width, rim, showSpokes = true) {
    const tire = mesh(parent, new T.CylinderGeometry(radius, radius, width, 20), rubber, x, y, z);
    tire.rotation.z = Math.PI / 2;
    const face = x + (x < 0 ? -1 : 1) * (width / 2 + .006);
    const disc = mesh(parent, new T.CylinderGeometry(radius * .77, radius * .77, .026, 18), rim, face, y, z);
    disc.rotation.z = Math.PI / 2;
    if (!showSpokes) return;
    const outerFace = face + (face < 0 ? -.022 : .022);
    for (let step = 0; step < 5; step++) {
      const angle = step * Math.PI * 2 / 5;
      const spoke = box(parent, .02, radius * .57, radius * .09, chrome, outerFace, y + Math.cos(angle) * radius * .38, z + Math.sin(angle) * radius * .38);
      spoke.rotation.x = angle;
    }
    const hub = mesh(parent, new T.CylinderGeometry(radius * .21, radius * .21, .04, 12), chrome, outerFace, y, z);
    hub.rotation.z = Math.PI / 2;
  }

  function cabin(parent, halfWidth, front, back, shoulder, top, color) {
    bodyShell(parent, [
      [front, halfWidth, shoulder - .03, shoulder],
      [front + .51, halfWidth * .88, shoulder, top],
      [back - .42, halfWidth * .86, shoulder, top + .015],
      [back, halfWidth, shoulder - .03, shoulder],
    ], windows);
    bodyShell(parent, [
      [front + .5, halfWidth * .71, top - .045, top - .01],
      [front + .66, halfWidth * .72, top - .03, top + .03],
      [back - .44, halfWidth * .69, top - .03, top + .025],
    ], color);
    for (const side of [-1, 1]) box(parent, .12, .12, .25, color, side * (halfWidth + .1), shoulder + .16, front + .24);
  }

  const profiles = {
    m4: { half: .94, front: -2.38, rear: 2.35, roof: 1.39, wheelbase: 1.37, cabin: [-1.16, 1.56] },
    m5: { half: .99, front: -2.48, rear: 2.54, roof: 1.50, wheelbase: 1.51, cabin: [-1.25, 1.56] },
    chiron: { half: 1.03, front: -2.43, rear: 2.70, roof: 1.29, wheelbase: 1.51, cabin: [-1.52, 1.18] },
  };

  function carPrototype(which, color) {
    const p = profiles[which];
    const sport = which === 'chiron';
    const tallGrille = which === 'm4';
    const skin = paint(color, .25, .51);
    const car = new T.Group();
    car.name = which;
    const shoulder = sport ? .80 : .91;
    bodyShell(car, [
      [p.front, p.half * .85, .27, .66],
      [p.front + .30, p.half * .97, .24, shoulder - .13],
      [-p.wheelbase, p.half, .24, shoulder],
      [-.48, p.half * .96, .27, shoulder + .005],
      [.54, p.half * .95, .27, shoulder + .035],
      [p.wheelbase, p.half, .24, shoulder + .035],
      [p.rear - .25, p.half * .96, .26, shoulder + .01],
      [p.rear, p.half * .89, .29, shoulder - .12],
    ], skin);
    cabin(car, p.half * .80, ...p.cabin, shoulder, p.roof, skin);
    box(car, p.half * 1.65, .12, .12, carbon, 0, .34, p.front -.035);
    box(car, p.half * 1.77, .19, .13, carbon, 0, .40, p.rear - .015);

    for (const side of [-1, 1]) {
      const frontLight = box(car, sport ? .31 : .44, .073, .055, whiteLight, side * .57, .624, p.front - .035);
      frontLight.rotation.z = side * .11;
      box(car, .37, .059, .042, redLight, side * .61, shoulder - .14, p.rear + .012);
      box(car, .09, .11, 2.14, carbon, side * p.half, .304, .05);
      box(car, .12, .08, .15, chrome, side * .61, .34, p.rear + .075);
      if (!sport) {
        box(car, .25, tallGrille ? .29 : .16, .045, chrome, side * .147, tallGrille ? .51 : .60, p.front -.04);
        box(car, .21, tallGrille ? .255 : .125, .057, carbon, side * .147, tallGrille ? .51 : .60, p.front -.048);
      }
      for (const z of [-p.wheelbase, p.wheelbase]) wheel(car, side * (p.half - .079), .358, z, .36, .26, rimBlack, sport);
      if (sport) {
        const intake = new T.CatmullRomCurve3([
          new T.Vector3(side * .83, 1.10, -.67), new T.Vector3(side * 1.01, .90, -.54),
          new T.Vector3(side * 1.035, .53, -.17), new T.Vector3(side * 1.02, .39, .33),
          new T.Vector3(side * 1.02, .44, .89),
        ]);
        mesh(car, new T.TubeGeometry(intake, 16, .023, 5, false), chrome);
        box(car, .057, .01, .6, orange, side * .048, shoulder + .041, 1.44);
        box(car, .056, .012, .6, orange, side * .048, p.roof + .033, -.16);
        box(car, .056, .012, .44, orange, side * .048, shoulder + .015, -.97);
      }
    }
    if (sport) {
      const grille = new T.Shape();
      grille.moveTo(-.25, -.09);
      grille.quadraticCurveTo(-.27, .21, 0, .24);
      grille.quadraticCurveTo(.27, .21, .25, -.09);
      grille.lineTo(-.25, -.09);
      const fitted = carbon.clone();
      fitted.side = T.DoubleSide;
      mesh(car, new T.ShapeGeometry(grille), fitted, 0, .414, p.front - .043);
      mesh(car, new T.TorusGeometry(.20, .019, 6, 28, Math.PI), chrome, 0, .465, p.front - .047);
      box(car, 1.60, .037, .039, redLight, 0, .70, p.rear + .016);
    }
    box(car, .42, .10, .025, whiteLight, 0, .52, p.rear + .01);
    return car;
  }

  function createCar(which, color) {
    if (!Object.hasOwn(profiles, which)) return null;
    const key = `${which}:${color}`;
    if (!cache.has(key)) cache.set(key, carPrototype(which, color));
    return cache.get(key).clone(true);
  }

  function shapedRider(rider) {
    if (!rider) return;
    rider.clear();
    const fabric = paint(0x262d32, .88);
    const patches = paint(0x434751, .61);
    const pants = paint(0x232734, .91);
    const boot = paint(0x151719, .89);

    function ellipsoid(material, position, scales) {
      const part = mesh(rider, new T.SphereGeometry(1, 14, 10), material, ...position);
      part.scale.set(...scales);
      return part;
    }
    function limb(material, from, to, radius) {
      const a = new T.Vector3(...from);
      const b = new T.Vector3(...to);
      const delta = b.clone().sub(a);
      const part = mesh(rider, new T.CapsuleGeometry(radius, Math.max(.02, delta.length() - radius), 4, 8), material);
      part.position.copy(a).lerp(b, .5);
      part.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), delta.normalize());
      return part;
    }

    const jacket = ellipsoid(fabric, [0, 1.42, .11], [.275, .34, .173]);
    jacket.rotation.x = -.54;
    const shoulder = ellipsoid(patches, [0, 1.57, .047], [.292, .15, .176]);
    shoulder.rotation.x = -.48;
    ellipsoid(pants, [0, 1.20, .23], [.22, .16, .18]);
    ellipsoid(fabric, [0, 1.65, -.085], [.102, .13, .109]);
    const helmet = ellipsoid(carbon, [0, 1.83, -.12], [.177, .218, .188]);
    helmet.rotation.x = -.12;
    ellipsoid(carbon, [0, 1.74, -.238], [.146, .083, .14]);
    const shield = ellipsoid(windows, [0, 1.84, -.264], [.168, .084, .062]);
    shield.rotation.x = -.15;

    for (const side of [-1, 1]) {
      const upperArm = [side * .245, 1.57, .035];
      const elbow = [side * .36, 1.34, -.19];
      const wrist = [side * .37, 1.27, -.55];
      limb(fabric, upperArm, elbow, .083);
      limb(fabric, elbow, wrist, .068);
      ellipsoid(boot, wrist, [.073, .059, .088]);
      const hip = [side * .13, 1.18, .24];
      const knee = [side * .32, .87, -.11];
      const heel = [side * .254, .59, .16];
      limb(pants, hip, knee, .096);
      ellipsoid(patches, knee, [.097, .10, .090]);
      limb(pants, knee, heel, .080);
      ellipsoid(boot, [side * .27, .58, .102], [.085, .072, .144]);
    }
  }

  function upgradeMotor(group) {
    const rider = group.userData.rider;
    for (const child of [...group.children]) if (child !== rider) group.remove(child);
    shapedRider(rider);

    wheel(group, .01, .35, -.89, .355, .15, rimBlack);
    wheel(group, .01, .35, .91, .355, .23, rimBlack);
    const tank = mesh(group, new T.SphereGeometry(1, 18, 12), carbon, 0, 1.00, -.05);
    tank.scale.set(.31, .27, .51);
    bodyShell(group, [
      [-1.02, .18, .83, 1.17], [-.70, .27, .58, 1.26], [-.29, .32, .53, 1.19], [.07, .24, .58, .95],
    ], carbon);
    bodyShell(group, [[.16, .22, .86, 1.14], [.66, .22, .9, 1.10], [1.00, .13, .98, 1.13]], carbon);
    const visor = mesh(group, new T.SphereGeometry(1, 18, 10), windows, 0, 1.26, -.67);
    visor.scale.set(.225, .18, .24);
    visor.rotation.x = -.43;
    for (const side of [-1, 1]) {
      strut(group, [side * .15, .35, -.89], [side * .18, 1.11, -.59], .045, chrome);
      strut(group, [side * .25, .61, -.24], [side * .22, .90, .20], .035, lime);
      strut(group, [side * .24, .90, -.17], [side * .18, .59, .24], .035, lime);
      const wing = box(group, .28, .042, .31, carbon, side * .32, 1.03, -.64);
      wing.rotation.z = -side * .24;
      box(group, .13, .055, .036, whiteLight, side * .08, 1.02, -1.022);
      box(group, .115, .047, .033, redLight, side * .065, 1.055, .995);
      strut(group, [side * .22, .40, .21], [side * .19, .36, .91], .064, carbon);
    }
    strut(group, [.27, .47, .32], [.32, .62, .96], .079, chrome);
    strut(group, [-.38, 1.27, -.56], [.38, 1.27, -.56], .035, carbon);
    box(group, .41, .10, .49, rubber, 0, 1.13, .42);
    box(group, .52, .37, .39, orange, 0, 1.37, .90);
    box(group, .53, .038, .40, carbon, 0, 1.552, .90);
    box(group, .32, .075, .015, whiteLight, 0, 1.35, 1.105);
    return group;
  }

  window.KuryeAraclari = { createCar, upgradeMotor };
})();
