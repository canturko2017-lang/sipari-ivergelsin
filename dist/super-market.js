(() => {
  'use strict';

  const byId = id => document.getElementById(id);
  const money = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' });
  const formatMoney = kurus => money.format(kurus / 100);
  const price = product => Math.round(product.price * 100);
  const catalog = new Map(products.map(product => [product.id, product]));
  const orderPatterns = [
    { name: 'Deniz', ids: [120, 21], method: 'card', greeting: 'Merhaba, kolayı ve ekmeği kartla alabilir miyim?' },
    { name: 'Ece', ids: [5, 3, 27], method: 'cash', greeting: 'Bu ürünleri nakit ödeyeceğim.' },
    { name: 'Onur', ids: [1, 18, 17], method: 'card', greeting: 'Selam, kartla ödeyebilir miyim?' },
    { name: 'Derya', ids: [19, 28, 118], method: 'cash', greeting: 'Merhaba, yanımda nakit var.' },
    { name: 'Arda', ids: [9, 20, 21], method: 'card', greeting: 'Temassız ödeme yapacağım.' },
    { name: 'Selin', ids: [2, 30, 122], method: 'cash', greeting: 'Bunları nakit alabilir miyim?' },
    { name: 'Mert', ids: [43, 125, 10], method: 'card', greeting: 'Kartla ödemek istiyorum.' },
    { name: 'Seda', ids: [114, 108, 44], method: 'cash', greeting: 'İyi günler, nakit vereceğim.' },
  ];
  const grocerySections = new Set([
    'Dondurma', 'Et & Balık', 'Fırın', 'Gıda', 'Meyve & Sebze',
    'Süt & Kahvaltılık', 'Temizlik', 'Çikolata & Atıştırmalık', 'İçecek',
  ]);
  const groceryIds = products.filter(product => grocerySections.has(product.category)).map(product => product.id);

  const basket = byId('basket');
  const register = byId('register');
  const helper = byId('helper');
  const helperIsOpen = () => helper.hasAttribute('open');
  let sales = 0;
  let revenue = 0;
  let subtotal = 0;
  let unscanned = 0;
  let order = null;
  let phase = 'welcome';
  let soundEnabled = false;
  let audio = null;
  let ambienceTimer = null;
  let world = null;

  function announce(text, alert = false) {
    const message = byId('message');
    message.textContent = text;
    message.dataset.alert = alert;
  }

  function createProductRow(product) {
    const row = document.createElement('li');
    const button = document.createElement('button');
    button.className = 'product';
    button.type = 'button';
    const image = document.createElement('img');
    image.className = 'product-image';
    image.src = `assets/${product.image}`;
    image.alt = '';
    const info = document.createElement('span');
    const name = document.createElement('span');
    name.className = 'product-name';
    name.textContent = product.id === 120 ? 'Kola' : product.name;
    const size = document.createElement('span');
    size.className = 'product-unit';
    size.textContent = product.unit;
    info.append(name, size);
    const tag = document.createElement('span');
    tag.className = 'product-price';
    tag.textContent = formatMoney(price(product));
    const action = document.createElement('span');
    action.className = 'product-verb';
    action.textContent = 'Okut';
    tag.append(action);
    button.append(image, info, tag);
    row.append(button);
    button.addEventListener('click', () => {
      if (phase !== 'scan' || button.disabled) return;
      const moveFocus = button === document.activeElement;
      button.disabled = true;
      action.textContent = 'Okutuldu';
      subtotal += price(product);
      byId('total').textContent = formatMoney(subtotal);
      unscanned--;
      playTone(1120, 0.08, 0.08);
      if (unscanned) {
        if (moveFocus) basket.querySelector('button:enabled')?.focus({ preventScroll: true });
        return;
      }
      phase = 'payment';
      byId('payment').hidden = false;
      byId('scan-help').textContent = 'Tüm ürünler okutuldu.';
      announce(`${order.name}, ${order.method === 'card' ? 'kartla' : 'nakit'} ödemek istiyor.`);
      if (moveFocus) byId(order.method).focus({ preventScroll: true });
    });
    return row;
  }

  function nextCustomer() {
    const starter = orderPatterns[sales % orderPatterns.length];
    const pending = [...groceryIds];
    const pattern = sales < orderPatterns.length ? starter : {
      ...starter,
      ids: Array.from({ length: Math.min(3, pending.length) }, () => pending.splice(Math.floor(Math.random() * pending.length), 1)[0]),
      greeting: starter.method === 'card' ? 'Merhaba, kartla ödemek istiyorum.' : 'Merhaba, nakit ödeyeceğim.',
    };
    order = pattern;
    subtotal = 0;
    unscanned = pattern.ids.length;
    phase = 'scan';
    byId('checkout').hidden = false;
    byId('customer-banner').hidden = false;
    byId('payment').hidden = true;
    byId('change').hidden = true;
    byId('next').hidden = true;
    byId('total').textContent = formatMoney(0);
    byId('scan-help').textContent = 'Okutmak için bir ürüne dokun.';
    byId('customer-name').textContent = pattern.name;
    byId('customer-line').textContent = pattern.greeting;
    basket.replaceChildren(...pattern.ids.map(id => createProductRow(catalog.get(id))));
    announce(`${pattern.name} kasaya geldi.`);
    world?.arrive();
  }

  function finishSale() {
    if (phase !== 'payment' && phase !== 'change') return;
    phase = 'done';
    sales++;
    revenue += subtotal;
    byId('sold').textContent = String(sales);
    byId('revenue').textContent = formatMoney(revenue);
    byId('payment').hidden = true;
    byId('change').hidden = true;
    byId('next').hidden = false;
    byId('customer-line').textContent = 'Teşekkür ederim, iyi günler!';
    announce('Ödeme tamamlandı. Fiş hazır.');
    playTone(660, 0.12, 0.055);
    world?.leave();
    byId('next').focus({ preventScroll: true });
  }

  function takePayment(method) {
    if (phase !== 'payment') return;
    if (method !== order.method) {
      announce(`${order.name}, ${order.method === 'card' ? 'kartla' : 'nakit'} ödemek istedi. Diğer yöntemi seç.`, true);
      return;
    }
    if (method === 'card') {
      finishSale();
      return;
    }
    phase = 'change';
    byId('payment').hidden = true;
    const paid = Math.ceil((subtotal + 1) / 10000) * 10000;
    const changeDue = paid - subtotal;
    byId('cash-received').textContent = `Alınan ${formatMoney(paid)} · Toplam ${formatMoney(subtotal)}`;
    const wrongLess = Math.max(0, changeDue - 500);
    const amounts = [wrongLess, changeDue, changeDue + 1000];
    const rotation = Math.floor(Math.random() * amounts.length);
    const choices = amounts.slice(rotation).concat(amounts.slice(0, rotation)).map(amount => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = formatMoney(amount);
      button.addEventListener('click', () => {
        if (phase !== 'change') return;
        if (amount === changeDue) finishSale();
        else announce('Para üstünü yeniden hesapla. Alınan paradan toplamı çıkar.', true);
      });
      return button;
    });
    byId('change-options').replaceChildren(...choices);
    byId('change').hidden = false;
    announce('Kasadan doğru para üstünü ver.');
    choices[0].focus({ preventScroll: true });
  }

  function showRegister(open, goToCounter = false) {
    if (goToCounter) world?.goToCounter();
    world?.stopWalking();
    register.hidden = !open;
    byId('register-toggle').setAttribute('aria-expanded', String(open));
    const focusId = open ? 'register-close' : 'register-toggle';
    byId(focusId).focus({ preventScroll: true });
  }

  function openHelper() {
    if (helperIsOpen()) return;
    world?.stopWalking();
    if (typeof helper.showModal === 'function') helper.showModal();
    else helper.setAttribute('open', '');
  }

  function closeHelper(restoreFocus = true) {
    if (typeof helper.close === 'function') helper.close();
    else helper.removeAttribute('open');
    if (restoreFocus) byId('helper-open').focus({ preventScroll: true });
  }

  let fittedFullscreen = false;
  const fullscreenButton = byId('fullscreen');
  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;

  function syncFullscreen() {
    const active = Boolean(fullscreenElement() || fittedFullscreen);
    document.body.classList.toggle('market-fullscreen', active);
    fullscreenButton?.setAttribute('aria-pressed', String(active));
    if (fullscreenButton) {
      const label = active ? 'Tam ekrandan çık' : 'Tam ekran';
      fullscreenButton.setAttribute('aria-label', label);
      fullscreenButton.title = label;
      fullscreenButton.textContent = active ? 'Ekranı küçült' : label;
    }
  }

  async function toggleFullscreen() {
    const page = byId('market');
    if (fullscreenElement()) {
      const exit = document.exitFullscreen || document.webkitExitFullscreen;
      try { await exit?.call(document); } catch { /* Browser already exited. */ }
    } else if (fittedFullscreen) {
      fittedFullscreen = false;
    } else {
      const enter = page.requestFullscreen || page.webkitRequestFullscreen;
      if (enter) {
        try { await enter.call(page); } catch { fittedFullscreen = true; }
      } else {
        fittedFullscreen = true;
      }
    }
    syncFullscreen();
  }

  function playTone(frequency, duration, volume, delay = 0, end = frequency) {
    if (!soundEnabled || audio?.state !== 'running' || document.hidden) return;
    const time = audio.currentTime + delay;
    const tone = audio.createOscillator();
    const gain = audio.createGain();
    tone.type = frequency < 120 ? 'triangle' : 'sine';
    tone.frequency.setValueAtTime(frequency, time);
    tone.frequency.exponentialRampToValueAtTime(end, time + duration);
    gain.gain.setValueAtTime(0.001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + Math.min(0.04, duration / 3));
    gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
    tone.connect(gain).connect(audio.destination);
    tone.start(time);
    tone.stop(time + duration + 0.015);
  }

  function passingCar() {
    playTone(106, 0.75, 0.026, 0, 55);
    playTone(72, 0.82, 0.018, 0.09, 36);
  }

  function chirp() {
    playTone(1560, 0.15, 0.025, 0, 2150);
    playTone(1950, 0.11, 0.027, 0.18, 1420);
    playTone(1650, 0.12, 0.025, 0.38, 2250);
  }

  function setSound(enabled) {
    const Context = window.AudioContext || window.webkitAudioContext;
    soundEnabled = enabled && Boolean(Context);
    byId('sound').textContent = soundEnabled ? 'Ses açık' : 'Ses kapalı';
    byId('sound').setAttribute('aria-pressed', String(soundEnabled));
    clearInterval(ambienceTimer);
    if (!soundEnabled) return;
    try {
      if (!audio) audio = new Context();
      audio.resume().then(chirp).catch(() => setSound(false));
      ambienceTimer = setInterval(() => {
        if (Math.random() < 0.6) chirp();
        else passingCar();
      }, 4700);
    } catch {
      setSound(false);
    }
  }

  function createMarketScene(container) {
    const THREE = window.THREE;
    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.4));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xafcfdf);
    scene.fog = new THREE.FogExp2(0xc6d8d8, 0.009);
    const camera = new THREE.PerspectiveCamera(57, 1, 0.08, 92);
    camera.rotation.order = 'YXZ';
    scene.add(new THREE.HemisphereLight(0xf6fbff, 0x95a39b, 2.12));
    const sun = new THREE.DirectionalLight(0xffedca, 2.62);
    sun.position.set(-18, 17, -3);
    scene.add(sun);

    const standard = (color, roughness = 0.73, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
    const shape = new THREE.BoxGeometry(1, 1, 1);
    const cylinder = new THREE.CylinderGeometry(1, 1, 1, 20);
    const sphere = new THREE.SphereGeometry(1, 16, 12);
    const place = (parent, geometry, material, width, height, depth, x, y, z) => {
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(width, height, depth);
      mesh.position.set(x, y, z);
      parent.add(mesh);
      return mesh;
    };
    const box = (parent, material, width, height, depth, x, y, z) => place(parent, shape, material, width, height, depth, x, y, z);
    const wall = standard(0xe3e2d6);
    const metal = standard(0x495a52, 0.44, 0.32);
    const trim = standard(0x203d36);
    const light = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const oak = standard(0xb59466);
    const room = { halfWidth: 14, back: -20, front: 10.5, ceiling: 4.7 };
    const length = room.front - room.back;
    const middle = (room.front + room.back) / 2;
    const glassX = -13.9;
    const walkwayX = -15.15;
    const roadX = -21.3;
    const obstacles = [];
    function block(x, z, halfWidth, halfDepth, angle = 0) {
      const sin = Math.abs(Math.sin(angle)), cos = Math.abs(Math.cos(angle));
      obstacles.push({ x, z, w: halfWidth * cos + halfDepth * sin, d: halfWidth * sin + halfDepth * cos });
    }

    function canvasMaterial(draw, width = 512, height = 256) {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      draw(canvas.getContext('2d'), width, height);
      const map = new THREE.CanvasTexture(canvas);
      map.colorSpace = THREE.SRGBColorSpace;
      map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
      return map;
    }

    const tiles = canvasMaterial((ctx, size) => {
      ctx.fillStyle = '#cdcbbf';
      ctx.fillRect(0, 0, size, size);
      let seed = 104729;
      const random = () => (seed = seed * 16807 % 2147483647) / 2147483647;
      for (let i = 0; i < 1600; i++) {
        ctx.fillStyle = i % 3 === 0 ? '#a8aaa616' : '#f8f7e82a';
        ctx.fillRect(random() * size, random() * size, random() * 13 + 1, random() * 2 + 1);
      }
      ctx.strokeStyle = '#a8a99c';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, size, size);
    }, 256, 256);
    tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping;
    tiles.repeat.set(35, 38);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(28, length), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.47 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, middle);
    scene.add(floor);
    for (const z of [room.back, room.front]) {
      box(scene, wall, 28, room.ceiling, 0.26, 0, room.ceiling / 2, z);
      box(scene, trim, 27.65, .18, .24, 0, .09, z + (z === room.back ? .14 : -.14));
    }
    box(scene, wall, .25, room.ceiling, length, room.halfWidth, room.ceiling / 2, middle);
    box(scene, trim, .24, .18, length, room.halfWidth - .14, .09, middle);
    box(scene, wall, 28, .16, length, 0, room.ceiling, middle);
    const mullion = standard(0x253c38, .37, .52);
    const glass = new THREE.MeshPhysicalMaterial({ color: 0xc9dee1, transparent: true, opacity: .073, roughness: .17, metalness: .25, side: THREE.DoubleSide, depthWrite: false });
    box(scene, glass, .035, 4.2, length, glassX, 2.28, middle);
    for (let z = room.back; z <= room.front + .01; z += length / 12) box(scene, mullion, .18, 4.62, .12, glassX, 2.31, z);
    for (const y of [.24, 2.90, 4.45]) box(scene, mullion, .18, .095, length, glassX, y, middle);
    const tileSeam = standard(0xc3c8bf, .88);
    for (const x of [-11.5, -7.5, -3.5, .5, 4.5, 8.5, 12.5]) {
      box(scene, tileSeam, .035, .025, length, x, room.ceiling-.085, middle);
      for (const z of [-17.3, -12.3, -7.3, -2.3, 2.7, 7.7]) {
        box(scene, metal, .21, .11, 3.35, x, room.ceiling-.2, z);
        box(scene, light, .14, .024, 3.17, x, room.ceiling-.265, z);
      }
    }
    for (const z of [-17.7, -13.7, -9.7, -5.7, -1.7, 2.3, 6.3]) box(scene, tileSeam, 27.7, .025, .035, 0, room.ceiling-.085, z);

    const shadeImage = canvasMaterial((ctx, size) => {
      const fade = ctx.createRadialGradient(size/2, size/2, size*.16, size/2, size/2, size*.5);
      fade.addColorStop(0, '#19282178');
      fade.addColorStop(1, '#19282100');
      ctx.fillStyle = fade;
      ctx.fillRect(0, 0, size, size);
    }, 128, 128);
    const shadeMaterial = new THREE.MeshBasicMaterial({ map: shadeImage, transparent: true, depthWrite: false });
    function shade(x,z,w,d,rotation = 0) {
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(w, d), shadeMaterial);
      patch.rotation.set(-Math.PI/2, 0, rotation);
      patch.position.set(x, .006, z);
      scene.add(patch);
    }

    function sign(text, width, height, x, y, z, angle = 0) {
      const map = canvasMaterial((ctx, w, h) => {
        ctx.fillStyle = '#24473c';
        ctx.fillRect(0, 0, w, h);
        ctx.fillStyle = '#f4f2da';
        ctx.font = '750 48px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w / 2, h / 2, w - 20);
      }, 384, 80);
      const board = new THREE.Mesh(new THREE.PlaneGeometry(width, height), new THREE.MeshBasicMaterial({ map }));
      board.position.set(x, y, z);
      board.rotation.y = angle;
      scene.add(board);
      return board;
    }

    const packaged = [
      ['KOLA', '#b33335'], ['SÜT', '#397f9f'], ['AYRAN', '#35654e'], ['KAKAO', '#643e35'],
      ['KAHVE', '#524939'], ['TON', '#cb7a39'], ['BEZELYE', '#61864b'], ['ÇİKOLATA', '#8f4d36'],
      ['TEMİZLİK', '#a85531'], ['KETÇAP', '#c03733'], ['SU', '#498eaa'], ['SODA', '#4a794f'],
    ];
    const productPaints = packaged.map(([name, color]) => {
      const plain = standard(color, 0.42);
      const map = canvasMaterial((ctx, width, height) => {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ffefcb';
        ctx.fillRect(0, 17, width, 4);
        ctx.fillRect(0, 100, width, 7);
        ctx.textAlign = 'center';
        ctx.font = 'bold 22px sans-serif';
        ctx.fillText(name, width / 2, 60, width - 7);
        ctx.font = '13px sans-serif';
        ctx.fillText('SÜPER MARKET', width / 2, 81, width - 7);
      }, 128, 128);
      const front = new THREE.MeshStandardMaterial({ map, roughness: 0.52 });
      return [plain, plain, plain, plain, front, plain];
    });
    const packagePositions = productPaints.map(() => []);
    const labelPaint = standard(0xd9c08a);
    const barcodes = canvasMaterial((ctx, width, height) => {
      ctx.fillStyle = '#ece9de';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#393e32';
      for (let x = 5; x < width - 5; x += 5) ctx.fillRect(x, 3, x % 4 + 1, height - 6);
    }, 128, 28);
    const tagPaint = new THREE.MeshBasicMaterial({ map: barcodes });
    const tags = [];
    const shelf = (x, z, angle, kind, offset) => {
      block(x, z, 1.85, .5, angle);
      shade(x, z, 4.8, 1.9, angle);
      const rack = new THREE.Group();
      rack.position.set(x, 0, z);
      rack.rotation.y = angle;
      scene.add(rack);
      rack.updateMatrixWorld();
      box(rack, metal, 3.5, 2.62, 0.12, 0, 1.31, -0.23);
      for (const edge of [-1.78, 1.78]) box(rack, metal, 0.12, 2.7, 0.75, edge, 1.35, 0);
      for (let row = 0; row < 4; row++) {
        const y = 0.37 + row * 0.58;
        box(rack, oak, 3.56, 0.075, 0.77, 0, y, 0.03);
        box(rack, labelPaint, 3.56, 0.05, 0.025, 0, y, 0.43);
        for (let slot = 0; slot < 9; slot++) {
          const atX = -1.56 + slot * 0.39;
          const type = (offset + row * 3 + Math.floor(slot / 3)) % productPaints.length;
          const height = 0.2 + (type % 4) * 0.075;
          const transform = new THREE.Matrix4().makeScale(0.28, height, 0.22);
          transform.setPosition(atX, y + height / 2 + 0.04, 0.21);
          packagePositions[type].push(transform.premultiply(rack.matrixWorld));
          if (slot % 3 === 1) {
            const tag = new THREE.Matrix4().makeScale(.22, .039, .006);
            tag.setPosition(atX, y, .45);
            tags.push(tag.premultiply(rack.matrixWorld));
          }
        }
      }
      const angleX = Math.sin(angle) * 0.45;
      const angleZ = Math.cos(angle) * 0.45;
      sign(kind, 2.6, 0.5, x + angleX, 2.95, z + angleZ, angle);
    };
    shelf(-10.5, -19, 0, 'İÇECEKLER', 0);
    shelf(-6, -19, 0, 'SÜT ÜRÜNLERİ', 1);
    shelf(-1.5, -19, 0, 'KAHVALTILIK', 6);
    shelf(3, -19, 0, 'MAKARNA', 9);
    shelf(7.5, -19, 0, 'EV BAKIM', 8);
    shelf(12.7, -14.5, -Math.PI / 2, 'TEMEL GIDA', 8);
    shelf(12.7, -9.6, -Math.PI / 2, 'KAHVE VE ÇAY', 4);
    shelf(12.7, -4.7, -Math.PI / 2, 'ATIŞTIRMALIK', 9);
    for (const [x, z, text, offset] of [
      [-7, -13, 'İÇECEK', 0], [-7, -8.1, 'FIRIN', 7], [-7, -3.2, 'GÜNLÜK ÜRÜNLER', 1],
      [-.5, -13, 'BAKLİYAT', 6], [-.5, -8.1, 'KONSERVE', 5], [-.5, -3.2, 'KAHVALTI', 3],
      [6, -13, 'TEMİZLİK', 8], [6, -8.1, 'ÇİKOLATA', 7], [6, -3.2, 'ATIŞTIRMALIK', 9],
    ]) shelf(x, z, Math.PI/2, text, offset);
    packagePositions.forEach((positions, type) => {
      if (!positions.length) return;
      const stock = new THREE.InstancedMesh(shape, productPaints[type], positions.length);
      positions.forEach((matrix, index) => stock.setMatrixAt(index, matrix));
      scene.add(stock);
    });
    const shelfTags = new THREE.InstancedMesh(shape, tagPaint, tags.length);
    tags.forEach((matrix, index) => shelfTags.setMatrixAt(index, matrix));
    scene.add(shelfTags);
    sign('SÜPER MARKET', 5.4, .76, -2, 3.94, -19.8);

    // Counter, moving street traffic, and daylight through the storefront.
    const counter = new THREE.Group();
    counter.position.set(6.4, 0, 6.45);
    scene.add(counter);
    block(6.4, 6.45, 2.85, .79);
    shade(6.4, 6.45, 6.5, 2.4);
    box(counter, trim, 5.45, 1, 1.42, 0, 0.5, 0);
    box(counter, oak, 5.62, 0.11, 1.54, 0, 1.05, 0);
    box(counter, metal, 2.28, 0.075, 0.84, -0.85, 1.14, 0.06);
    const belt = standard(0x222725, 0.68);
    box(counter, belt, 2.1, 0.033, 0.72, -0.85, 1.186, 0.06);
    box(counter, metal, 0.52, 0.06, 0.48, 0.62, 1.14, 0.04);
    box(counter, new THREE.MeshBasicMaterial({ color: 0xcf7058 }), 0.42, 0.015, 0.035, 0.62, 1.18, 0.04);
    box(counter, belt, 0.06, 0.4, 0.18, 1.82, 1.32, -0.18);
    box(counter, trim, 0.89, 0.53, 0.095, 1.82, 1.62, -0.18);
    const screen = new THREE.MeshBasicMaterial({ color: 0xc6e5d8 });
    box(counter, screen, 0.76, 0.4, 0.008, 1.82, 1.62, -0.127);
    for (let y = 1.5; y <= 1.72; y += 0.09) box(counter, trim, 0.37, 0.025, 0.01, 1.7, y, -0.119);
    sign('KASA 01', 2.5, .46, 6.4, 3.15, 6.4);

    const crate = standard(0x334a3e);
    const greens = [standard(0xb34738, .49), standard(0x7c9341, .65), standard(0xf1ae4c, .59)];
    const fruit = new THREE.SphereGeometry(1, 12, 8);
    for (const [x,z,kind] of [[-10.55,-8.1,0], [-10.55,-3.1,1], [-10.55,1.45,2]]) {
      block(x,z,1.03,1.03);
      shade(x,z,2.8,2.8);
      box(scene, oak, 2.04, .63, 2.14, x, .32, z);
      box(scene, crate, 2.15, .21, 2.23, x, .70, z);
      const produce = new THREE.InstancedMesh(fruit, greens[kind], 30);
      for (let i=0; i<30; i++) {
        const u = (i%6-2.5)*.29, v = (Math.floor(i/6)-2)*.34;
        const ripple = Math.sin(i*.61)*.026;
        const transform = new THREE.Matrix4().makeScale(.14+ripple*.5, .13+ripple*.4, .14+ripple*.6);
        transform.setPosition(x+u+Math.sin(i)*.032, .86+ripple, z+v);
        produce.setMatrixAt(i, transform);
        produce.setColorAt(i, new THREE.Color().setScalar(.82+(i%7)*.027));
      }
      scene.add(produce);
    }
    sign('MANAV', 2.5, .50, -10.6, 2.8, -4.4);

    const road = standard(0x565d58, .95);
    const sidewalk = standard(0xb7b3a7, .82);
    const distantWall = standard(0xcfc9b7, .8);
    box(scene, road, 8, .08, 90, roadX, -.08, 0);
    box(scene, sidewalk, 2.4, .12, 90, walkwayX, -.055, 0);
    box(scene, sidewalk, 1.5, .10, 90, roadX-4.7, -.047, 0);
    box(scene, standard(0x849272, .95), 37, .10, 90, roadX-10.5, -.145, 0);
    for (let z = -42; z < 42; z += 4.25) {
      box(scene, wall, .085, .014, 1.9, roadX, -.031, z);
      box(scene, metal, 2.25, .014, .018, walkwayX, .011, z);
    }
    for (const z of [-32, -20, -8, 4, 16, 28]) {
      box(scene, distantWall, 5.6, 7.2, 9.1, -34.4, 3.52, z);
      box(scene, trim, 5.8, .18, 9.3, -34.4, 7.12, z);
      for (const y of [1.29, 3.36, 5.51]) for (const offset of [-2.8, 0, 2.8]) {
        box(scene, metal, .088, 1.03, 1.27, -31.55, y, z + offset);
      }
    }
    window.SuperMarketLandscape?.build({ scene, glassX, sidewalkX: walkwayX, roadX });

    const tires = standard(0x212724, 0.69);
    const hub = standard(0x9da4a8, 0.34, 0.55);
    const glassCar = standard(0x223d47, 0.25, 0.30);
    const tail = new THREE.MeshBasicMaterial({ color: 0xbc3837 });
    function car(color) {
      const group = new THREE.Group();
      const paint = standard(color, 0.32, 0.43);
      box(group, paint, 1.8, 0.48, 3.95, 0, 0.65, 0);
      box(group, paint, 1.58, 0.18, 1.77, 0, 1.31, 0.05);
      const cabin = place(group, new THREE.CylinderGeometry(0.76, 1, 1, 4), glassCar, 1.08, 0.53, 1.67, 0, 1.02, 0.05);
      cabin.rotation.y = Math.PI / 4;
      for (const x of [-0.87, 0.87]) for (const z of [-1.24, 1.24]) {
        const wheel = place(group, cylinder, tires, 0.35, 0.19, 0.35, x, 0.34, z);
        wheel.rotation.z = Math.PI / 2;
        const rim = place(group, cylinder, hub, 0.19, 0.19, 0.19, x * 1.05, 0.34, z);
        rim.rotation.z = Math.PI / 2;
      }
      for (const x of [-0.59, 0.59]) {
        box(group, light, 0.34, 0.11, 0.03, x, 0.72, -1.99);
        box(group, tail, 0.33, 0.115, 0.03, x, 0.71, 1.99);
      }
      return group;
    }
    const cars = [0x40536e, 0xdadee0, 0x744647].map((color, index) => {
      const model = window.KuryeAraclari?.createCar(index % 2 ? 'm5' : 'm4', color) || car(color);
      scene.add(model);
      model.position.set(roadX + (index % 2 ? -1.6 : 1.6), 0, -27 + index * 22);
      model.rotation.y = index % 2 ? Math.PI : 0;
      return { model, speed: index % 2 ? 5.1 : -4.7 - index * 0.3 };
    });
    const person = new THREE.Group();
    person.visible = false;
    scene.add(person);
    const entry = new THREE.Vector3(-8.7, 0, 2.1);
    const atCounter = new THREE.Vector3(6.55, 0, 4.7);
    person.position.copy(entry);
    const employee = new THREE.Group();
    employee.position.set(-6.45, 0, 2.85);
    employee.rotation.y = .75;
    scene.add(employee);
    const employeeSign = sign('YARDIMCI', 1.45, .31, employee.position.x, 2.22, employee.position.z, .75);
    shade(employee.position.x, employee.position.z, 1.2, 1.2);
    block(employee.position.x, employee.position.z, .28, .28);
    const skin = standard(0xc88e75, .66);
    const uniform = standard(0x285d4d, .84);
    const trousers = standard(0x343c43, .91);
    const shoes = standard(0x28292a, .78);
    const hair = standard(0x34302a, .92);
    const torso = new THREE.CapsuleGeometry(.205, .36, 5, 12);
    const limbs = new THREE.CapsuleGeometry(.078, .43, 4, 10);
    for (const group of [person, employee]) {
      const shirt = group === employee ? uniform : standard(0x7c6662, .83);
      place(group, torso, shirt, 1, 1, .77, 0, 1.27, 0);
      place(group, sphere, skin, .121, .153, .125, 0, 1.73, 0);
      place(group, sphere, hair, .124, .108, .129, 0, 1.81, -.007);
      for (const side of [-1,1]) {
        const arm = place(group, limbs, shirt, 1, 1, .9, side*.23, 1.22, 0);
        arm.rotation.z = side*.13;
        place(group, sphere, skin, .067, .092, .055, side*.27, .93, .023);
        place(group, limbs, trousers, 1.22, 1.38, 1.08, side*.103, .59, 0);
        const shoe = place(group, sphere, shoes, .087, .065, .154, side*.107, .125, .058);
        shoe.rotation.y = side*.09;
      }
      if (group === employee) box(group, light, .092, .047, .015, .10, 1.42, .14);
    }
    let customerActive = false;
    let customerTarget = entry;
    let mixer = null;
    let action = null;
    let modelRequested = false;
    function appendScript(src, onload) {
      const script = document.createElement('script');
      script.src = src;
      script.onload = onload;
      document.head.append(script);
    }
    function loadCustomerModel() {
      if (modelRequested) return;
      modelRequested = true;
      appendScript('gltf-loader.js', () => appendScript('yuruyen-data.js', () => {
        if (!window.yuruyenBase64 || !THREE.GLTFLoader) return;
        try {
          const encoded = atob(window.yuruyenBase64);
          const bytes = new Uint8Array(encoded.length);
          for (let i = 0; i < encoded.length; i++) bytes[i] = encoded.charCodeAt(i);
          new THREE.GLTFLoader().parse(bytes.buffer, '', gltf => {
            const model = gltf.scene;
            const bounds = new THREE.Box3().setFromObject(model);
            const dimensions = bounds.getSize(new THREE.Vector3());
            if (!(dimensions.y > 0)) return;
            const center = bounds.getCenter(new THREE.Vector3());
            const coworker = model.clone(true);
            const sourceNodes = [], copies = [];
            model.traverse(node => sourceNodes.push(node));
            coworker.traverse(node => copies.push(node));
            const nodeCopies = new Map(sourceNodes.map((node, index) => [node, copies[index]]));
            for (const source of sourceNodes) {
              if (!source.isSkinnedMesh) continue;
              const mesh = nodeCopies.get(source);
              const skeleton = source.skeleton.clone();
              skeleton.bones = source.skeleton.bones.map(bone => nodeCopies.get(bone) || bone);
              mesh.bind(skeleton, source.bindMatrix);
            }
            function placeActor(actor, group, height) {
              const scale = height / dimensions.y;
              actor.scale.multiplyScalar(scale);
              actor.position.x -= center.x * scale;
              actor.position.y -= bounds.min.y * scale;
              actor.position.z -= center.z * scale;
              group.clear();
              group.add(actor);
            }
            placeActor(model, person, 1.79);
            placeActor(coworker, employee, 1.84);
            coworker.traverse(node => {
              if (!node.isMesh || !node.material?.name?.includes('original top')) return;
              node.material = node.material.clone();
              node.material.color.set(0x3b9878);
            });
            if (gltf.animations.length) {
              mixer = new THREE.AnimationMixer(model);
              action = mixer.clipAction(gltf.animations[0]);
              action.play();
              const pose = new THREE.AnimationMixer(coworker);
              pose.clipAction(gltf.animations[0]).play();
              pose.setTime(.19);
            }
            person.visible = customerActive;
            container.dataset.customerModel = 'ready';
          }, () => {});
        } catch (error) {
          console.info('Müşteri modeli yüklenemedi.', error);
        }
      }));
    }

    const directions = new Map([
      ['w', 'forward'], ['arrowup', 'forward'], ['a', 'left'], ['arrowleft', 'left'],
      ['s', 'back'], ['arrowdown', 'back'], ['d', 'right'], ['arrowright', 'right'],
    ]);
    const heldKeys = new Set();
    const heldPointers = new Map();
    const status = byId('walk-status');
    const canvas = renderer.domElement;
    let yaw = .5, pitch = .04, drag = null;
    camera.position.set(-1.8, 1.64, 8.1);
    camera.rotation.set(pitch, yaw, 0);

    const near = (x, z) => Math.hypot(camera.position.x-x, camera.position.z-z) < 2.3;
    const canWalk = () => register.hidden && !helperIsOpen();
    function stopWalking() {
      heldKeys.clear();
      for (const { button } of heldPointers.values()) button.classList.remove('pressed');
      heldPointers.clear();
      drag = null;
    }
    function locationName() {
      const { x, z } = camera.position;
      if (near(employee.position.x, employee.position.z)) return 'Yardımcı · E ile konuş';
      if (near(counter.position.x, 8.35) || near(counter.position.x, 4.8)) return 'Kasa 01 · E ile aç';
      if (x < -12.1) return 'Vitrin';
      if (x < -8.7 && z < 3) return 'Manav';
      if (z > 4.3) return 'Market girişi';
      return z < -15 ? 'Arka reyonlar' : 'Market koridoru';
    }
    function showLocation() {
      const label = locationName();
      if (status.textContent !== label) status.textContent = label;
    }
    function freeSpace(x, z) {
      const radius = .32;
      if (Math.abs(x) > room.halfWidth-.5 || z < room.back+.5 || z > room.front-.5) return false;
      return !obstacles.some(rect => Math.abs(x-rect.x) < rect.w+radius && Math.abs(z-rect.z) < rect.d+radius);
    }
    function walk(dt) {
      if (!canWalk()) return;
      const active = new Set(Array.from(heldKeys, key => directions.get(key)));
      for (const { direction } of heldPointers.values()) active.add(direction);
      const fore = Number(active.has('forward')) - Number(active.has('back'));
      const side = Number(active.has('right')) - Number(active.has('left'));
      if (!fore && !side) return;
      const distance = dt * 4.2 / Math.hypot(fore, side);
      const nextX = camera.position.x + (-Math.sin(yaw)*fore + Math.cos(yaw)*side) * distance;
      const nextZ = camera.position.z + (-Math.cos(yaw)*fore - Math.sin(yaw)*side) * distance;
      if (freeSpace(nextX, camera.position.z)) camera.position.x = nextX;
      if (freeSpace(camera.position.x, nextZ)) camera.position.z = nextZ;
      showLocation();
    }
    function goToCounter() {
      camera.position.set(6.15, 1.64, 8.35);
      yaw = -.07;
      pitch = -.08;
      camera.rotation.set(pitch, yaw, 0);
      showLocation();
    }

    window.addEventListener('keydown', event => {
      if (!canWalk() || event.altKey || event.ctrlKey || event.metaKey) return;
      const key = event.key.toLowerCase();
      if (directions.has(key)) {
        heldKeys.add(key);
        event.preventDefault();
      } else if (key === 'e' && !event.repeat) {
        if (near(employee.position.x, employee.position.z)) openHelper();
        else if (near(counter.position.x, 8.35) || near(counter.position.x, 4.8)) showRegister(true, true);
      }
    });
    window.addEventListener('keyup', event => heldKeys.delete(event.key.toLowerCase()));
    window.addEventListener('blur', stopWalking);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopWalking(); });
    for (const button of document.querySelectorAll('[data-walk]')) {
      button.addEventListener('pointerdown', event => {
        if (!canWalk()) return;
        event.preventDefault();
        heldPointers.set(event.pointerId, { direction: button.dataset.walk, button });
        button.classList.add('pressed');
        try { button.setPointerCapture(event.pointerId); } catch { /* Pointer already lifted. */ }
      });
      for (const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type, event => {
        heldPointers.delete(event.pointerId);
        button.classList.remove('pressed');
      });
    }
    canvas.addEventListener('pointerdown', event => {
      if (!canWalk() || drag || event.button !== 0) return;
      drag = { id:event.pointerId, x:event.clientX, y:event.clientY };
      try { canvas.setPointerCapture(event.pointerId); } catch { /* Pointer already lifted. */ }
    });
    canvas.addEventListener('pointermove', event => {
      if (drag?.id !== event.pointerId || !canWalk()) return;
      yaw -= (event.clientX-drag.x) * .005;
      pitch = THREE.MathUtils.clamp(pitch - (event.clientY-drag.y)*.0038, -.92, .92);
      drag.x = event.clientX;
      drag.y = event.clientY;
      camera.rotation.set(pitch, yaw, 0);
    });
    for (const type of ['pointerup','pointercancel','lostpointercapture']) canvas.addEventListener(type, event => {
      if (drag?.id === event.pointerId) drag = null;
    });

    function fit() {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.fov = width / height < 1 ? 72 : 57;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    const clock = new THREE.Clock();
    function draw() {
      requestAnimationFrame(draw);
      const dt = Math.min(0.05, clock.getDelta());
      if (document.hidden) return;
      walk(dt);
      employeeSign.rotation.y = Math.atan2(camera.position.x-employee.position.x, camera.position.z-employee.position.z);
      for (const { model, speed } of cars) {
        model.position.z += speed * dt;
        if (model.position.z > 38) model.position.z = -38;
        if (model.position.z < -38) model.position.z = 38;
      }
      const travel = customerTarget.clone().sub(person.position);
      const distance = travel.length();
      if (distance > 0.015) {
        person.position.addScaledVector(travel.normalize(), Math.min(distance, dt * 2.4));
        person.rotation.y = Math.atan2(travel.x, travel.z);
      } else if (customerActive) {
        person.rotation.y = 0;
      } else {
        person.visible = false;
      }
      if (action) action.paused = distance < 0.06;
      mixer?.update(dt);
      renderer.render(scene, camera);
    }
    container.append(canvas);
    fit();
    showLocation();
    renderer.render(scene, camera);
    container.querySelector('.scene-fallback').hidden = true;
    if (typeof ResizeObserver === 'function') new ResizeObserver(fit).observe(container);
    else window.addEventListener('resize', fit);
    requestAnimationFrame(draw);
    if (window.requestIdleCallback) window.requestIdleCallback(loadCustomerModel, { timeout: 1800 });
    else window.setTimeout(loadCustomerModel, 700);
    return {
      arrive() {
        person.position.copy(entry);
        customerTarget = atCounter;
        customerActive = true;
        person.visible = person.children.length > 0;
      },
      leave() {
        customerActive = false;
        customerTarget = entry;
      },
      goToCounter,
      stopWalking,
      loadCustomerModel,
    };
  }

  byId('start').addEventListener('click', () => {
    if (phase !== 'welcome') return;
    byId('welcome').hidden = true;
    setSound(true);
    world?.loadCustomerModel();
    nextCustomer();
    basket.querySelector('button')?.focus({ preventScroll: true });
  });
  byId('card').addEventListener('click', () => takePayment('card'));
  byId('cash').addEventListener('click', () => takePayment('cash'));
  byId('next').addEventListener('click', () => {
    nextCustomer();
    basket.querySelector('button')?.focus({ preventScroll: true });
  });
  byId('sound').addEventListener('click', () => setSound(!soundEnabled));
  byId('register-toggle').addEventListener('click', () => showRegister(register.hidden, register.hidden));
  byId('register-close').addEventListener('click', () => showRegister(false));
  byId('helper-open').addEventListener('click', openHelper);
  byId('helper-close').addEventListener('click', () => closeHelper());
  byId('helper-cashier').addEventListener('click', () => {
    closeHelper(false);
    showRegister(true, true);
  });
  fullscreenButton?.addEventListener('click', toggleFullscreen);
  document.addEventListener('fullscreenchange', syncFullscreen);
  document.addEventListener('webkitfullscreenchange', syncFullscreen);
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    if (helperIsOpen() && typeof helper.close !== 'function') closeHelper();
    else if (!register.hidden && !helperIsOpen()) showRegister(false);
    else if (fittedFullscreen && !helperIsOpen()) { fittedFullscreen = false; syncFullscreen(); }
  });
  // The register stays playable on devices without WebGL.
  try {
    if (window.THREE) world = createMarketScene(byId('scene'));
  } catch (error) {
    console.info('Market sahnesi cihazda başlatılamadı.', error);
  }
  if (!world) {
    byId('walk-controls').hidden = true;
    byId('walk-status').textContent = 'Kasa açık';
  }
})();
