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
  const phone = byId('phone');
  let sales = 0;
  let revenue = 0;
  let subtotal = 0;
  let unscanned = 0;
  let order = null;
  let phase = 'welcome';
  let incident = 'clear';
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
    if (incident === 'open' || incident === 'reported') return;
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
    if (sales === 3 || (sales > 6 && sales % 6 === 0)) {
      incident = 'open';
      byId('next').hidden = true;
      byId('phone-open').dataset.alert = 'true';
      announce('Market güvenliği ürün hırsızlığı bildirdi. Telefonu açıp oyun içi polisi haberdar et.', true);
      playTone(330, 0.22, 0.07);
      byId('phone-open').focus({ preventScroll: true });
      return;
    }
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

  function updatePhone() {
    const statuses = {
      clear: 'Market güvenliğinde açık olay yok.',
      open: 'Güvenlik bildirimi: Bir müşteri ürünle ödeme yapmadan çıktı.',
      reported: 'Oyun içi polis: İhbar alındı. Ekip markete doğru geliyor.',
      resolved: 'Ekip geldi. Güvenlik olayı kapatıldı, kasa yeniden açık.',
    };
    byId('phone-status').textContent = statuses[incident];
    byId('call-police').disabled = incident !== 'open';
  }

  function openPhone() {
    updatePhone();
    if (typeof phone.showModal === 'function') phone.showModal();
    else phone.setAttribute('open', '');
  }

  function closePhone() {
    if (typeof phone.close === 'function') phone.close();
    else phone.removeAttribute('open');
    if (!byId('next').hidden) byId('next').focus({ preventScroll: true });
    else byId('phone-open').focus({ preventScroll: true });
  }

  function reportIncident() {
    if (incident !== 'open') return;
    incident = 'reported';
    updatePhone();
    playTone(465, 0.16, 0.07);
    world?.sendPolice();
    window.setTimeout(() => {
      incident = 'resolved';
      byId('phone-open').dataset.alert = 'false';
      byId('next').hidden = false;
      announce('Olay çözüldü. Sıradaki müşteriyle devam edebilirsin.');
      updatePhone();
    }, 2300);
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
    scene.fog = new THREE.FogExp2(0xc6d8d8, 0.015);
    const camera = new THREE.PerspectiveCamera(53, 1, 0.1, 90);
    scene.add(new THREE.HemisphereLight(0xfffff0, 0x849b96, 2.35));
    const sun = new THREE.DirectionalLight(0xfff1d3, 2.8);
    sun.position.set(-12, 14, 4);
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
    tiles.repeat.set(24, 25);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(18, 22), new THREE.MeshStandardMaterial({ map: tiles, roughness: 0.6 }));
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, -1.8);
    scene.add(floor);
    box(scene, wall, 18, 4.35, 0.28, 0, 2.17, -12.8);
    box(scene, wall, 0.25, 4.35, 22, 9, 2.17, -1.8);
    box(scene, wall, 18, 0.15, 22, 0, 4.35, -1.8);

    const glass = new THREE.MeshPhysicalMaterial({ color: 0xaac8d3, transparent: true, opacity: 0.12, roughness: 0.2, metalness: 0.35, side: THREE.DoubleSide, depthWrite: false });
    box(scene, glass, 0.05, 3.54, 19.8, -8.9, 2.13, -2.25);
    for (let z = -12.15; z <= 7.8; z += 2.49) box(scene, metal, 0.17, 4.2, 0.11, -8.9, 2.1, z);
    for (const y of [0.37, 2.66, 4.0]) box(scene, metal, 0.16, 0.10, 20, -8.9, y, -2.25);
    for (const x of [-6, -2, 2, 6]) {
      for (const z of [-10.6, -5.9, -1.2, 3.5]) {
        box(scene, metal, 0.24, 0.11, 2.75, x, 4.19, z);
        box(scene, light, 0.16, 0.023, 2.62, x, 4.125, z);
      }
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
    const shelf = (x, z, angle, kind, offset) => {
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
          if (slot % 3 === 1) box(rack, tagPaint, 0.22, 0.039, 0.006, atX, y, 0.45);
        }
      }
      const angleX = Math.sin(angle) * 0.45;
      const angleZ = Math.cos(angle) * 0.45;
      sign(kind, 2.6, 0.5, x + angleX, 2.95, z + angleZ, angle);
    };
    shelf(-5.95, -10.85, 0, 'İÇECEKLER', 0);
    shelf(-1.75, -11.9, 0, 'SÜT ÜRÜNLERİ', 1);
    shelf(2.55, -11.9, 0, 'KAHVALTILIK', 6);
    shelf(7.45, -7.15, -Math.PI / 2, 'TEMEL GIDA', 8);
    shelf(7.45, -2.85, -Math.PI / 2, 'ATIŞTIRMALIK', 4);
    shelf(-4.8, -3.75, Math.PI / 2, 'FIRIN', 7);
    shelf(1.8, -5.4, 0, 'MANAV', 2);
    packagePositions.forEach((positions, type) => {
      if (!positions.length) return;
      const stock = new THREE.InstancedMesh(shape, productPaints[type], positions.length);
      positions.forEach((matrix, index) => stock.setMatrixAt(index, matrix));
      scene.add(stock);
    });
    sign('SÜPER MARKET', 4.2, 0.75, -2.8, 3.83, -12.6);

    // Counter, moving street traffic, and daylight through the storefront.
    const counter = new THREE.Group();
    counter.position.set(0.5, 0, 5.2);
    scene.add(counter);
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

    const road = standard(0x656a65);
    box(scene, road, 8, 0.08, 90, -15, -0.08, 0);
    box(scene, standard(0xa9a89c), 2.2, 0.085, 90, -9.9, -0.02, 0);
    box(scene, standard(0x7f9475), 20, 0.10, 90, -27, -0.135, 0);
    for (let z = -42; z < 42; z += 5) box(scene, wall, 0.085, 0.014, 2.4, -15, -0.031, z);
    const bark = standard(0x6b5e48);
    const leaves = standard(0x748b57);
    for (const z of [-19, -11.5, -4, 4, 12, 20]) {
      place(scene, cylinder, bark, 0.16, 3.5, 0.16, -20.1, 1.7, z);
      for (let i = 0; i < 4; i++) place(scene, sphere, leaves, 0.83, 0.95, 0.86, -20.1 + Math.cos(i * 2) * 0.5, 3.2 + i * 0.2, z + Math.sin(i * 2) * 0.66);
      box(scene, standard(0xd7cdba), 4.4, 6.3, 6, -25, 3.0, z);
      for (const y of [1.18, 2.9, 4.6]) for (const windowZ of [-1.8, 0, 1.8]) box(scene, metal, 0.08, 0.82, 0.9, -22.76, y, z + windowZ);
    }

    const tires = standard(0x212724, 0.69);
    const hub = standard(0x9da4a8, 0.34, 0.55);
    const glassCar = standard(0x223d47, 0.25, 0.30);
    const tail = new THREE.MeshBasicMaterial({ color: 0xbc3837 });
    function car(color, emergency = false) {
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
      if (emergency) {
        group.userData.lights = [
          box(group, new THREE.MeshBasicMaterial({ color: 0x148efe }), 0.43, 0.14, 0.27, -0.23, 1.45, 0.05),
          box(group, new THREE.MeshBasicMaterial({ color: 0xff424f }), 0.43, 0.14, 0.27, 0.23, 1.45, 0.05),
        ];
        box(group, standard(0x2c6692), 0.025, 0.27, 2.38, 0.91, 0.64, 0);
      }
      scene.add(group);
      return group;
    }
    const cars = [0x40536e, 0xdadee0, 0x744647].map((color, index) => {
      const model = window.KuryeAraclari?.createCar(index % 2 ? 'm5' : 'm4', color) || car(color);
      scene.add(model);
      model.position.set(index % 2 ? -16.6 : -13.4, 0, -27 + index * 22);
      model.rotation.y = index % 2 ? Math.PI : 0;
      return { model, speed: index % 2 ? 5.1 : -4.7 - index * 0.3 };
    });
    const police = car(0xeeefe8, true);
    police.position.set(-13.4, 0, 35);
    police.visible = false;
    let policeTime = -1;

    const person = new THREE.Group();
    person.visible = false;
    scene.add(person);
    const entry = new THREE.Vector3(-6, 0, -6.4);
    const atCounter = new THREE.Vector3(2.25, 0, 2.35);
    person.position.copy(entry);
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
            const scale = 1.79 / dimensions.y;
            const center = bounds.getCenter(new THREE.Vector3());
            model.scale.multiplyScalar(scale);
            model.position.x -= center.x * scale;
            model.position.y -= bounds.min.y * scale;
            model.position.z -= center.z * scale;
            person.add(model);
            if (gltf.animations.length) {
              mixer = new THREE.AnimationMixer(model);
              action = mixer.clipAction(gltf.animations[0]);
              action.play();
            }
            person.visible = customerActive;
            container.dataset.customerModel = 'ready';
          }, () => {});
        } catch (error) {
          console.info('Müşteri modeli yüklenemedi.', error);
        }
      }));
    }

    function fit() {
      const width = Math.max(1, container.clientWidth);
      const height = Math.max(1, container.clientHeight);
      camera.position.set(width / height < 1 ? 3.5 : 4.6, 2.75, 8.45);
      camera.lookAt(-2.0, 1.44, -4.9);
      camera.fov = width / height < 1 ? 67 : 55;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    const clock = new THREE.Clock();
    function draw() {
      requestAnimationFrame(draw);
      const dt = Math.min(0.05, clock.getDelta());
      if (document.hidden) return;
      for (const { model, speed } of cars) {
        model.position.z += speed * dt;
        if (model.position.z > 38) model.position.z = -38;
        if (model.position.z < -38) model.position.z = 38;
      }
      if (policeTime >= 0) {
        policeTime += dt;
        police.position.z = Math.max(-7.3, 23 - policeTime * 16);
        const flash = Math.floor(policeTime * 7) % 2;
        police.userData.lights.forEach((part, index) => { part.visible = flash === index; });
        if (policeTime > 8) {
          police.visible = false;
          policeTime = -1;
        }
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
    container.append(renderer.domElement);
    fit();
    renderer.render(scene, camera);
    container.querySelector('.scene-fallback').hidden = true;
    if (typeof ResizeObserver === 'function') new ResizeObserver(fit).observe(container);
    else window.addEventListener('resize', fit);
    requestAnimationFrame(draw);
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
      sendPolice() {
        policeTime = 0;
        police.visible = true;
      },
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
  byId('phone-open').addEventListener('click', openPhone);
  byId('phone-close').addEventListener('click', closePhone);
  byId('call-police').addEventListener('click', reportIncident);
  // The register stays playable on devices without WebGL.
  try {
    if (window.THREE) world = createMarketScene(byId('scene'));
  } catch (error) {
    console.info('Market sahnesi cihazda başlatılamadı.', error);
  }
})();
