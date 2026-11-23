'use strict';
(() => {
 const assetTasks=[],airportTasks=[];let assetsStarted=false,airportAssetsStarted=false;function assetTask(file,callback){return ()=>{const script=document.createElement('script');script.src=file;script.onload=callback;script.onerror=()=>console.warn('Dosya açılamadı:',file);document.head.appendChild(script)}}function queueAsset(file,callback){const task=assetTask(file,callback),priority={'van-data.js':0,'gercekci-motor-data.js':0,'rider-data.js':1,'sedan-data.js':2,'bmw-m3-data.js':3,'audi-q7-data.js':4};task.priority=priority[file]??10;assetTasks.push(task)}function queueAirportAsset(file,callback){const task=assetTask(file,callback);task.priority=file==='ucak-data.js'?0:file==='guvenlik-data.js'?1:2;airportTasks.push(task)}function loadAssets(){if(assetsStarted)return;assetsStarted=true;assetTasks.sort((a,b)=>a.priority-b.priority).forEach((task,i)=>setTimeout(task,150+i*1400))}function loadAirportAssets(){if(airportAssetsStarted)return;airportAssetsStarted=true;airportTasks.sort((a,b)=>a.priority-b.priority).forEach((task,i)=>setTimeout(task,i*500))}
 const params=new URLSearchParams(location.search);const names=['Hemen','Sanal Market','Elektronik','Yemek','Macro Online','Mion','Petimo','Taze Direkt'];
 const courierMode = params.get('mod') === 'kurye';
 const chosenVehicle = params.get('arac');
 const automatic=params.get('gorev')==='yeni'||!params.get('bolum');
 const service = courierMode ? 'Süper Market' : automatic ? names[Math.floor(Math.random()*names.length)] : names.includes(params.get('bolum')) ? params.get('bolum') : 'Hemen';
 const forcedCar=service==='Sanal Market'||service==='Elektronik';
 const vehicle = courierMode && (chosenVehicle === 'araba' || chosenVehicle === 'motor')
   ? chosenVehicle : forcedCar || (automatic ? Math.random() < .5 : chosenVehicle === 'araba') ? 'araba' : 'motor';
 const challenge = params.get('gorev-turu') === 'akrobasi';
 const picks={'Hemen':[2,19,27],'Sanal Market':[1,5,21],'Elektronik':[11,39,144],'Yemek':[7,23],'Macro Online':[3,5,6],'Mion':[20,9],'Petimo':[122,123],'Taze Direkt':[1,2,3]};const chosen=(picks[service]||[1,2]).map(id=>typeof products!=='undefined'?products.find(p=>p.id===id):null).filter(Boolean);const orderText=chosen.slice(0,2).map(p=>p.name).join(', ');
 const el=id=>document.getElementById(id), roadLength=3000, maxSpeed=vehicle==='motor'?90:80;
 const vehicleModels = courierMode ? window.KuryeAraclari : null;
 const vehicleName = vehicle === 'motor'
   ? (vehicleModels ? 'H2R esintili spor motor' : 'Kurye motoru')
   : (vehicleModels ? 'Chiron esintili spor araba' : 'Teslimat aracı');
 el('service').textContent=service.toLocaleUpperCase('tr-TR');el('title').textContent='Yeni müşteri siparişi';
 el('description').textContent='Müşteri sipariş verdi. Paketi güvenle adresine ulaştır.';
 el('details').textContent=(orderText?'Sipariş: '+orderText+'  ·  ':'')+'Araç: '+vehicleName+'  ·  Mesafe: 3 km';
 if (el('wheelieButton')) el('wheelieButton').hidden = vehicle !== 'motor';
 if(!window.THREE){el('title').textContent='Oyun açılamadı';el('description').textContent='Oyun dosyaları yüklenemedi. Lütfen markete dönüp tekrar dene.';el('start').hidden=true;return}
 let renderer;try{renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'})}catch(e){el('title').textContent='Oyun açılamadı';el('description').textContent='Bu cihaz 3 boyutlu sürüşü açamadı.';el('start').hidden=true;return}
 renderer.setPixelRatio(Math.min(devicePixelRatio,1.1));renderer.setSize(innerWidth,innerHeight);renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;el('scene').appendChild(renderer.domElement);
 const scene=new THREE.Scene();scene.background=new THREE.Color(0xb0c3cb);const sky=new THREE.TextureLoader().load(window.surusTextures['gokyuzu.jpg'],()=>{sky.mapping=THREE.EquirectangularReflectionMapping;sky.colorSpace=THREE.SRGBColorSpace;scene.background=sky;window.skyTextureLoaded=true},undefined,()=>window.skyTextureError=true);scene.fog=new THREE.Fog(0xc5d8df,100,330);
 const camera=new THREE.PerspectiveCamera(53,innerWidth/innerHeight,.1,400);scene.add(new THREE.HemisphereLight(0xe1edf5,0x89907c,2.5));const sun=new THREE.DirectionalLight(0xfff3df,2.7);sun.position.set(-30,60,30);scene.add(sun);
 const mat=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});const asphalt=mat(0x383e40),line=mat(0xe9e6d8),yellow=mat(0xe9c564),grass=mat(0x87927c),curb=mat(0x858987),dark=mat(0x1b2021),glass=mat(0x344d59,.25,.25),tire=mat(0x151718),silver=mat(0xa9b1b2,.35,.5),light=mat(0xc7d0d1,.25),red=mat(0x991d19);
 const boxGeometries=new Map();const cube=(parent,w,h,d,m,x,y,z)=>{const key=w+','+h+','+d;let geometry=boxGeometries.get(key);if(!geometry){geometry=new THREE.BoxGeometry(w,h,d);boxGeometries.set(key,geometry)}const o=new THREE.Mesh(geometry,m);o.position.set(x,y,z);parent.add(o);return o};
 const roadCenter=z=>16*Math.sin(-z/180)+8*Math.sin(-z/75);
 const roadHeading=z=>Math.atan2(roadCenter(z+5)-roadCenter(z-5),10);
 const roadDistrict = window.TeslimatYolSahnesi?.init({ scene, roadCenter, roadHeading, roadLength });
 cube(scene,700,.2,roadLength+1200,grass,0,-.25,-roadLength/2);
 const grassTexture=new THREE.TextureLoader().load(window.surusTextures['cimen.jpg'],()=>{window.grassTextureLoaded=true},undefined,()=>{window.grassTextureError=true});grassTexture.wrapS=grassTexture.wrapT=THREE.RepeatWrapping;grassTexture.repeat.set(175,1050);grassTexture.colorSpace=THREE.SRGBColorSpace;grassTexture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);const grassPlane=new THREE.Mesh(new THREE.PlaneGeometry(700,roadLength+1200),new THREE.MeshStandardMaterial({map:grassTexture,color:0xb4c4a7,roughness:1}));grassPlane.rotation.x=-Math.PI/2;grassPlane.position.set(0,-.145,-roadLength/2);scene.add(grassPlane);
 const roadTexture=new THREE.TextureLoader().load(window.surusTextures['asphalt.jpg'],()=>window.roadTextureLoaded=true,undefined,()=>window.roadTextureError=true);roadTexture.wrapS=roadTexture.wrapT=THREE.RepeatWrapping;roadTexture.repeat.set(3,1);roadTexture.colorSpace=THREE.SRGBColorSpace;roadTexture.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);const roadMaterial=new THREE.MeshStandardMaterial({map:roadTexture,color:0x777777,roughness:1});
 for(let z=250;z>-roadLength-500;z-=10){const part=new THREE.Group();part.position.set(roadCenter(z),0,z);part.rotation.y=roadHeading(z);scene.add(part);cube(part,16,.12,10.5,asphalt,0,-.08,0);const surface=new THREE.Mesh(new THREE.PlaneGeometry(16,10.5),roadMaterial);surface.rotation.x=-Math.PI/2;surface.position.y=-.015;part.add(surface);for(const x of [-8,8]){cube(part,.15,.02,10.5,line,x,0,0);cube(part,2,.12,10.5,curb,x*1.14,-.06,0);cube(part,.1,.45,10.5,silver,x<0?-10.2:10.2,.45,0)}for(const x of [-4,0,4])cube(part,.12,.02,5,line,x,.01,0)}
 function roadCar(color,isVan=false){const group=new THREE.Group(),paint=mat(color,.42,.16);const l=isVan?5.5:4.4,w=isVan?2.1:1.9;cube(group,w,.7,l,paint,0,.77,0);cube(group,w*.91,.83,l*(isVan?.65:.48),paint,0,1.46,isVan?-.1:.05);cube(group,w*.83,.55,.05,glass,0,1.53,-l*(isVan?.34:.25));cube(group,w*.83,.5,.05,glass,0,1.53,l*(isVan?.31:.23));for(const x of [-w/2-.03,w/2+.03]){cube(group,.035,.47,l*(isVan?.55:.4),glass,x,1.53,0);for(const z of [-l*.31,l*.31]){const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.38,.38,.24,16),tire);wheel.rotation.z=Math.PI/2;wheel.position.set(x,.38,z);group.add(wheel)}}for(const x of [-w*.34,w*.34]){cube(group,.35,.14,.04,red,x,.9,l/2+.02);cube(group,.35,.14,.04,light,x,.9,-l/2-.02)}addPlate(group,l/2+.04);return group}
 let plateTexture;function addPlate(parent,z){if(!plateTexture){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle='#f5f5ee';ctx.fillRect(0,0,256,80);ctx.fillStyle='#2253a4';ctx.fillRect(0,0,30,80);ctx.fillStyle='#171d1f';ctx.font='bold 38px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('34 SVG 123',145,41);plateTexture=new THREE.CanvasTexture(canvas);plateTexture.colorSpace=THREE.SRGBColorSpace}const plate=new THREE.Mesh(new THREE.PlaneGeometry(.65,.2),new THREE.MeshBasicMaterial({map:plateTexture,side:THREE.DoubleSide}));plate.position.set(0,.64,z);parent.add(plate)}
 function motor(){const g=new THREE.Group();for(const z of [-.8,.9]){let wheel=new THREE.Mesh(new THREE.CylinderGeometry(.37,.37,.2,20),tire);wheel.rotation.z=Math.PI/2;wheel.position.set(0,.38,z);g.add(wheel);let hub=new THREE.Mesh(new THREE.CylinderGeometry(.2,.2,.22,16),silver);hub.rotation.z=Math.PI/2;hub.position.copy(wheel.position);g.add(hub)}cube(g,.5,.4,1.6,mat(0xe77521,.45),0,.8,0);cube(g,.5,.15,.65,dark,0,1.05,.25);cube(g,.1,.65,.1,silver,0,1.15,-.7);cube(g,.9,.07,.07,dark,0,1.45,-.65);cube(g,.85,.7,.8,mat(0xde7020),0,1.45,.78);const rider=new THREE.Group();cube(rider,.58,.8,.35,mat(0x29353b),0,1.5,.15);cube(rider,.45,.65,.3,mat(0x303332),0,.9,.23);const helmet=new THREE.Mesh(new THREE.SphereGeometry(.27,20,14),mat(0x272d30,.28));helmet.position.set(0,2.1,-.02);rider.add(helmet);cube(rider,.37,.12,.02,glass,0,2.09,-.26);for(const side of [-1,1]){const arm=cube(rider,.16,.58,.17,mat(0x29353b),side*.34,1.46,-.1);arm.rotation.x=-.7;const leg=cube(rider,.18,.6,.2,mat(0x303332),side*.23,.82,.15);leg.rotation.x=.25;cube(rider,.2,.12,.36,dark,side*.23,.52,0)}cube(g,.4,.2,.04,light,0,.88,-.82);cube(g,.42,.17,.04,red,0,.9,1.02);g.add(rider);g.userData.rider=rider;return g}
 function helmetMark(parent){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=96;const ctx=canvas.getContext('2d');ctx.fillStyle='#171b20';ctx.fillRect(0,0,256,96);ctx.fillStyle='white';ctx.font='bold 65px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('LS2',128,49);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const mark=new THREE.Mesh(new THREE.PlaneGeometry(.19,.07),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));mark.position.set(0,.01,.254);parent.add(mark)}
 function makeRealisticHelmet(){const group=new THREE.Group(),shell=mat(0x20272c,.26,.28),trim=mat(0x111519,.4,.15),visor=mat(0x263c49,.12,.45);const dome=new THREE.Mesh(new THREE.SphereGeometry(.23,40,28),shell);dome.scale.set(1,1.08,1.06);group.add(dome);const chin=new THREE.Mesh(new THREE.SphereGeometry(.17,32,20),shell);chin.scale.set(1.2,.65,.8);chin.position.set(0,-.105,-.13);group.add(chin);const shield=new THREE.Mesh(new THREE.SphereGeometry(.22,36,20,0,Math.PI*2,0,Math.PI*2),visor);shield.scale.set(.89,.48,.22);shield.position.set(0,.015,-.213);group.add(shield);for(const side of [-1,1]){const pivot=new THREE.Mesh(new THREE.SphereGeometry(.027,16,10),trim);pivot.position.set(side*.213,.005,-.085);group.add(pivot)}const vent=new THREE.Mesh(new THREE.BoxGeometry(.1,.017,.035),trim);vent.position.set(0,.215,-.075);group.add(vent);helmetMark(group);return group}
 function makeDeliveryLabel(parent,x,y,z,width,height,rotation){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;const ctx=canvas.getContext('2d');ctx.fillStyle='#ec7621';ctx.fillRect(0,0,512,256);ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 55px Arial';ctx.fillText('SİPARİŞİ',256,85);ctx.font='bold 55px Arial';ctx.fillText('VER GELSİN',256,160);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const plane=new THREE.Mesh(new THREE.PlaneGeometry(width,height),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));plane.position.set(x,y,z);plane.rotation.y=rotation;parent.add(plane)}
 let motorTrafficSource=null,riderTrafficSource=null,motorTrafficAdded=false;
 const player = vehicle === 'motor' ? motor() : (vehicleModels?.createCar('chiron', 0x2363a5) || roadCar(0xe87823,true));
 if (vehicle === 'motor' && vehicleModels) vehicleModels.upgradeMotor(player);
 scene.add(player);
 if (!vehicleModels && vehicle === 'araba') {
   makeDeliveryLabel(player,0,1.48,2.77,1.55,.54,0);
   makeDeliveryLabel(player,1.065,.78,0,2.0,.47,Math.PI/2);
   makeDeliveryLabel(player,-1.065,.78,0,2.0,.47,-Math.PI/2);
 } else if (vehicle === 'motor' && !vehicleModels) {
   makeDeliveryLabel(player,0,1.45,1.23,.7,.43,0);
 }
 if(!vehicleModels&&vehicle==='araba')queueAsset('van-data.js',()=>{if(vehicle==='araba'&&window.vanModelBase64&&THREE.GLTFLoader){try{const raw=atob(window.vanModelBase64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',gltf=>{window.vanModelLoaded=true;const model=gltf.scene;model.rotation.y=Math.PI;model.traverse(part=>{if(part.isMesh&&part.material&&part.material.name==='white'){part.material=part.material.clone();part.material.color.set(0xe97523)}});for(const part of [...player.children])player.remove(part);player.add(model);addPlate(player,2.74);makeDeliveryLabel(player,0,1.5,2.73,1.5,.58,0);makeDeliveryLabel(player,1.045,1.35,0,2.2,.6,Math.PI/2);makeDeliveryLabel(player,-1.045,1.35,0,2.2,.6,-Math.PI/2)},error=>window.vanModelError=String(error))}catch(error){window.vanModelError=String(error)}}});
 if (!vehicleModels) queueAsset('gercekci-motor-data.js',()=>{if(window.realMotorBase64&&THREE.GLTFLoader){try{const raw=atob(window.realMotorBase64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',gltf=>{window.scooterModelLoaded=true;const model=gltf.scene;model.rotation.y=Math.PI;model.scale.setScalar(1.1);motorTrafficSource=model;addMotorTraffic();if(!vehicleModels&&vehicle==='motor'){for(const part of [...player.children])if(part!==player.userData.rider&&part!==player.userData.helmet)player.remove(part);player.add(model);cube(player,.75,.48,.65,mat(0xde7020,.4,.12),0,1.05,1.05);cube(player,.78,.045,.68,mat(0x3d4243,.45),0,1.31,1.05);cube(player,.78,.035,.68,mat(0x343939,.45),0,.79,1.05);cube(player,.24,.07,.012,mat(0xb82019,.25),0,.9,1.383);makeDeliveryLabel(player,0,1.05,1.38,.7,.4,0);makeDeliveryLabel(player,.381,1.05,1.05,.58,.36,Math.PI/2);makeDeliveryLabel(player,-.381,1.05,1.05,.58,.36,-Math.PI/2)}},error=>{window.scooterModelError=String(error);console.warn('Motor modeli açılamadı:',error)})}catch(error){console.warn('Motor modeli açılamadı:',error)}}});

 if (!vehicleModels || vehicle === 'motor') queueAsset('rider-data.js',()=>{if(window.riderModelBase64&&THREE.GLTFLoader){try{const raw=atob(window.riderModelBase64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',gltf=>{window.riderModelLoaded=true;const rider=gltf.scene;riderTrafficSource=rider;addMotorTraffic();if(vehicle==='motor'){rider.position.set(0,.38,.07);rider.rotation.y=Math.PI;player.remove(player.userData.rider);player.userData.rider=rider;player.add(rider);const helmet=makeRealisticHelmet();helmet.position.set(0,1.7,.08);player.userData.helmet=helmet;player.add(helmet)}},error=>{window.riderModelError=String(error)})}catch(error){window.riderModelError=String(error)}}});
 const wallTexture=new THREE.TextureLoader().load(window.surusTextures['duvar.jpg'],()=>window.wallTextureLoaded=true,undefined,()=>window.wallTextureError=true);wallTexture.wrapS=wallTexture.wrapT=THREE.RepeatWrapping;wallTexture.repeat.set(3,4);wallTexture.colorSpace=THREE.SRGBColorSpace;const buildingMats=[0xd0c4b0,0xa4ada8,0xc6c0b0,0xc8bca8,0xb3a69a].map(color=>new THREE.MeshStandardMaterial({color,map:wallTexture,roughness:1}));
 let seed=12059;function rand(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
 function makeOfficeSign(group,side,x,y){const canvas=document.createElement('canvas');canvas.width=256;canvas.height=80;const ctx=canvas.getContext('2d');ctx.fillStyle='#284b59';ctx.fillRect(0,0,256,80);ctx.fillStyle='white';ctx.font='bold 48px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('OFİS',128,42);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const sign=new THREE.Mesh(new THREE.PlaneGeometry(3,.65),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));sign.rotation.y=-side*Math.PI/2;sign.position.set(x-side*.13,y,0);group.add(sign)}
 const windowFrame=mat(0xe2dfd5),windowGlass=mat(0x304d57,.25,.18),skin=mat(0xc79b7f),hair=mat(0x39312d),shirtColors=[mat(0x35546a),mat(0x655653),mat(0x72816c)];
 const windowPerson=(group,side,x,y,z,shirt)=>{const faceX=x-side*.12;cube(group,.13,.57,.42,shirt,faceX,y-.37,z);const head=new THREE.Mesh(new THREE.SphereGeometry(.16,12,10),skin);head.position.set(faceX,y+.05,z);group.add(head);const cap=new THREE.Mesh(new THREE.SphereGeometry(.165,12,10,0,Math.PI*2,0,Math.PI*.45),hair);cap.position.set(faceX,y+.07,z);group.add(cap)};
 const apartmentSlots=[],houseSlots=[],buildingGroups=[];let apartmentParts=null,houseParts=null;
 function addDetailedApartment(slot){if(!apartmentParts||slot.updated)return;slot.updated=true;for(const child of [...slot.group.children])slot.group.remove(child);const model=new THREE.Group();model.rotation.y=slot.side>0?Math.PI/2:-Math.PI/2;model.scale.setScalar(.65);for(const part of apartmentParts)model.add(new THREE.Mesh(part.geometry,part.material));slot.group.add(model)}
 function replaceHouse(slot){if(!houseParts||slot.updated)return;slot.updated=true;for(const child of [...slot.group.children])slot.group.remove(child);const model=new THREE.Group();model.rotation.y=slot.side>0?Math.PI/2:-Math.PI/2;model.scale.setScalar(.82);for(const part of houseParts)model.add(new THREE.Mesh(part.geometry,part.material));slot.group.add(model)}
 function mergeBuilding(gltf){const parts={};gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.position)return;const g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);const key=o.material.uuid,item=parts[key]||(parts[key]={material:o.material,p:[],n:[],u:[]});item.p.push(g.attributes.position.array);if(g.attributes.normal)item.n.push(g.attributes.normal.array);item.u.push(g.attributes.uv?g.attributes.uv.array:new Float32Array(g.attributes.position.count*2))});const join=a=>{const out=new Float32Array(a.reduce((n,v)=>n+v.length,0));let i=0;for(const x of a){out.set(x,i);i+=x.length}return out};return Object.values(parts).map(v=>{const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(join(v.p),3));g.setAttribute('uv',new THREE.BufferAttribute(join(v.u),2));if(v.n.length===v.p.length)g.setAttribute('normal',new THREE.BufferAttribute(join(v.n),3));else g.computeVertexNormals();g.computeBoundingSphere();return{geometry:g,material:v.material}})}
 function loadBuilding(encoded,onload,errorKey){if(!encoded||!THREE.GLTFLoader)return;try{const raw=atob(encoded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',g=>onload(mergeBuilding(g)),e=>window[errorKey]=String(e))}catch(e){window[errorKey]=String(e)}}
 function buildBuildingRow(z){for(const side of [-1,1]){if(roadDistrict?.ownsPlot(z,side))continue;if((side===1&&z < -185&&z > -255)||(side===-1&&z < -105&&z > -180)||(z < -2840 && side===1)||(side===1&&z < -520&&z > -1030)||[320,1200,1950].some(start=>-z>start-20&&-z<start+220))continue;const group=new THREE.Group();group.position.set(roadCenter(z)+side*(24+rand()*5),0,z);group.rotation.y=roadHeading(z);scene.add(group);buildingGroups.push(group);const house=rand()<.3,office=!house&&rand()<.25,h=house?6.5:10+rand()*13,w=house?9:10+rand()*6,d=house?12:10+rand()*7;cube(group,w,h,d,buildingMats[Math.floor(rand()*buildingMats.length)],0,h/2,0);const face=-side*(w/2+.03);cube(group,.11,.28,d+.2,windowFrame,face,h-.3,0);if(house){const roof=new THREE.Mesh(new THREE.ConeGeometry(d*.71,2.4,4),mat(0x795951));roof.rotation.y=Math.PI/4;roof.position.set(0,h+1.2,0);group.add(roof);cube(group,6,.12,4,mat(0xe6ddd0),-side*(w/2+4),.02,0);cube(group,5.5,.08,3.5,mat(0x50a9bd,.22,.1),-side*(w/2+4),.11,0)}if(office){cube(group,.1,.55,3.2,mat(0xd2d8d7),face-side*.11,1.8,0);cube(group,.1,2.8,2.5,windowGlass,face-side*.08,1.4,0);makeOfficeSign(group,side,face,3.4)}
 for(let yy=2.2;yy<h-1;yy+=3.2)for(let zz=-d/2+1.4;zz<d/2-1;zz+=3){cube(group,.045,1.85,1.8,windowFrame,face,yy,zz);cube(group,.06,1.6,1.55,windowGlass,face-side*.045,yy,zz);cube(group,.08,.08,1.65,windowFrame,face-side*.085,yy-.05,zz);cube(group,.08,1.72,.07,windowFrame,face-side*.085,yy,zz);if(rand()<.09)windowPerson(group,side,face,yy,zz-.36,shirtColors[Math.floor(rand()*shirtColors.length)])}
 cube(group,.08,2.1,1.25,mat(0x54473e),face-side*.05,1.05,-d/2+1.2);cube(group,.16,.13,1.5,windowFrame,face-side*.1,2.18,-d/2+1.2);if(house&&houseSlots.length<12){const slot={group,side,updated:false};houseSlots.push(slot);replaceHouse(slot)}if(!house&&!office&&Math.abs(Math.round((60-z)/25)+side)%5===0){const slot={group,side,updated:false};apartmentSlots.push(slot);addDetailedApartment(slot)}}}
 let visibilityDistance=-9999;let nextBuildingZ=60;for(let i=0;i<8;i++){buildBuildingRow(nextBuildingZ);nextBuildingZ-=25}
 function growCity(distance){if(Math.abs(distance-visibilityDistance)>40){visibilityDistance=distance;for(const g of buildingGroups)g.visible=Math.abs(g.position.z+distance)<420}let built=0;while(nextBuildingZ>-roadLength-150&&nextBuildingZ>-(distance+360)&&built<2){buildBuildingRow(nextBuildingZ);nextBuildingZ-=25;built++}}
 queueAsset('apartman-data.js',()=>{if(!window.apartmentModelBase64||!THREE.GLTFLoader)return;try{const raw=atob(window.apartmentModelBase64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',gltf=>{const parts={};gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(object=>{if(!object.isMesh||!object.geometry.attributes.position)return;const geo=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geo.applyMatrix4(object.matrixWorld);const name=object.material.uuid,entry=parts[name]||(parts[name]={material:object.material,positions:[],normals:[],uvs:[]});entry.positions.push(geo.attributes.position.array);if(geo.attributes.normal)entry.normals.push(geo.attributes.normal.array);entry.uvs.push(geo.attributes.uv?geo.attributes.uv.array:new Float32Array(geo.attributes.position.count*2))});const join=arrays=>{const out=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let i=0;for(const a of arrays){out.set(a,i);i+=a.length}return out};apartmentParts=Object.values(parts).map(part=>{const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(join(part.positions),3));geometry.setAttribute('uv',new THREE.BufferAttribute(join(part.uvs),2));if(part.normals.length===part.positions.length)geometry.setAttribute('normal',new THREE.BufferAttribute(join(part.normals),3));else geometry.computeVertexNormals();geometry.computeBoundingSphere();return{geometry,material:part.material}});apartmentSlots.forEach(addDetailedApartment);window.apartmentModelLoaded=true},error=>window.apartmentModelError=String(error))}catch(error){window.apartmentModelError=String(error)}});
 queueAsset('gercek-ev-data.js',()=>loadBuilding(window.evBase64,parts=>{houseParts=parts;houseSlots.forEach(replaceHouse);window.houseModelLoaded=true},'houseModelError'));
 const villaGroup=new THREE.Group();villaGroup.position.set(roadCenter(-145)-26,.02,-145);villaGroup.rotation.y=-Math.PI/2;scene.add(villaGroup);queueAsset('villa-data.js',()=>loadBuilding(window.villaBase64,parts=>{for(const part of parts)villaGroup.add(new THREE.Mesh(part.geometry,part.material));window.villaModelLoaded=true},'villaModelError'));
 const hotel=new THREE.Group();hotel.position.set(roadCenter(-220)+30,0,-220);hotel.rotation.y=roadHeading(-220);scene.add(hotel);const hotelWall=mat(0xc9c8c0,.8),hotelGlass=mat(0x587984,.18,.38),hotelFrame=mat(0xd8d9d4,.7),hotelGold=mat(0xddb763,.3,.5);cube(hotel,16,18,22,hotelWall,0,9,0);for(let y=2.8;y<17;y+=3.2)for(let z=-8;z<=8;z+=4){cube(hotel,.08,2.2,3.1,hotelGlass,-8.04,y,z);cube(hotel,.75,.14,3.5,hotelFrame,-8.35,y-1.2,z);cube(hotel,.08,.75,3.5,hotelGlass,-8.72,y-.82,z)}cube(hotel,.1,3,4,glass,-8.08,1.5,0);const hotelSign=new THREE.Group();hotelSign.position.set(-8.2,1.5,0);hotelSign.rotation.y=-Math.PI/2;hotel.add(hotelSign);streetSign(hotelSign,'OTEL ★★★★★');cube(hotel,11,.08,16,mat(0xddd7ca),-15,.04,0);const waterCanvas=document.createElement('canvas');waterCanvas.width=256;waterCanvas.height=256;const wc=waterCanvas.getContext('2d');wc.fillStyle='#4698a5';wc.fillRect(0,0,256,256);wc.lineWidth=2;for(let i=0;i<28;i++){wc.strokeStyle=i%2?'rgba(220,250,246,.18)':'rgba(20,90,110,.16)';wc.beginPath();const y=i*10;for(let x=0;x<=256;x+=8){const yy=y+Math.sin(x*.055+i)*3;if(x===0)wc.moveTo(x,yy);else wc.lineTo(x,yy)}wc.stroke()}const waterTexture=new THREE.CanvasTexture(waterCanvas);waterTexture.wrapS=waterTexture.wrapT=THREE.RepeatWrapping;waterTexture.repeat.set(2,3);waterTexture.colorSpace=THREE.SRGBColorSpace;const hotelWater=new THREE.Mesh(new THREE.PlaneGeometry(7,11),new THREE.MeshStandardMaterial({map:waterTexture,roughness:.19,metalness:.13}));hotelWater.rotation.x=-Math.PI/2;hotelWater.position.set(-15,.13,0);hotel.add(hotelWater);const poolRail=mat(0xbcc6c4,.25,.7);for(const x of [-12.2,-11.7]){const pole=new THREE.Mesh(new THREE.CylinderGeometry(.035,.035,.8,8),poolRail);pole.position.set(x,.52,4.6);hotel.add(pole)}for(let z=-5;z<=5;z+=2.5){cube(hotel,.1,.04,.35,mat(0xe4d7bb),-18.65,.15,z)}for(let i=-2;i<=2;i++){cube(hotel,1.1,.08,1.9,mat(0xe8e4d8),-19,.14,i*2.3)}
 const roadsideTrees=[];for(let z=30;z>-roadLength-100;z-=50){for(const side of [-1,1]){if(z < -2850 && side===1)continue;const tree=new THREE.Group();tree.position.set(roadCenter(z)+side*(12.3+(rand()*1.5)),0,z);scene.add(tree);cube(tree,.32,3.5,.32,mat(0x6c5541),0,1.75,0);for(const offset of [[0,4.8,0],[-.9,4,.4],[.8,4.2,-.4]]){const crown=new THREE.Mesh(new THREE.SphereGeometry(1.45,9,7),mat(0x63805e));crown.position.set(...offset);tree.add(crown)}roadsideTrees.push(tree)}}
 queueAsset('tree-data.js',()=>{if(window.treeModelBase64&&THREE.GLTFLoader){try{const raw=atob(window.treeModelBase64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',gltf=>{const models={};gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(object=>{if(!object.isMesh||!object.geometry.attributes.position)return;const geo=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geo.applyMatrix4(object.matrixWorld);const name=object.material.name||'leaf';(models[name]||(models[name]={material:object.material,positions:[],normals:[]})).positions.push(geo.attributes.position.array);if(geo.attributes.normal)models[name].normals.push(geo.attributes.normal.array)});const combine=arrays=>{const size=arrays.reduce((n,a)=>n+a.length,0),out=new Float32Array(size);let i=0;for(const array of arrays){out.set(array,i);i+=array.length}return out};for(const model of Object.values(models)){const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.BufferAttribute(combine(model.positions),3));if(model.normals.length===model.positions.length)geom.setAttribute('normal',new THREE.BufferAttribute(combine(model.normals),3));else geom.computeVertexNormals();geom.computeBoundingSphere();const dummy=new THREE.Object3D();for(let start=0;start<roadsideTrees.length;start+=12){const batch=roadsideTrees.slice(start,start+12),instances=new THREE.InstancedMesh(geom,model.material,batch.length);batch.forEach((tree,i)=>{dummy.position.copy(tree.position);dummy.rotation.y=((start+i)%7)*.7;const scale=.58+((start+i)%4)*.06;dummy.scale.setScalar(scale);dummy.updateMatrix();instances.setMatrixAt(i,dummy.matrix)});instances.instanceMatrix.needsUpdate=true;instances.computeBoundingSphere();scene.add(instances)}}roadsideTrees.forEach(tree=>scene.remove(tree));window.treeModelLoaded=true},error=>window.treeModelError=String(error))}catch(error){window.treeModelError=String(error)}}});
 // Sahil, palmiye ağaçları, kaldırımlar ve kavşaklarda farklı yollar.
 const seaMat=mat(0x287a94,.25,.12),sandMat=mat(0xc5b895,.95),palmLeaf=mat(0x376b44,.95),palmTrunk=mat(0x80664d,.95),binMat=mat(0x344749,.65),paperMat=mat(0xd4d0c4,.95);
 for(let z=-520;z>-1030;z-=25){const coast=new THREE.Group();coast.position.set(roadCenter(z),0,z);coast.rotation.y=roadHeading(z);scene.add(coast);cube(coast,12,.035,25.2,sandMat,19,.01,0);cube(coast,130,.04,25.2,seaMat,90,.025,0)}
 const palmSlots=[];function palm(x,z){const g=new THREE.Group();g.position.set(x,0,z);scene.add(g);palmSlots.push(g);const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16,.31,5.1,9),palmTrunk);trunk.position.y=2.55;g.add(trunk);for(let i=0;i<8;i++){const leaf=new THREE.Mesh(new THREE.ConeGeometry(.42,3.2,5),palmLeaf);leaf.position.set(Math.sin(i*Math.PI/4)*1.1,5.05,Math.cos(i*Math.PI/4)*1.1);leaf.rotation.set(.85*Math.cos(i*Math.PI/4),0,-.85*Math.sin(i*Math.PI/4));g.add(leaf)}}
 for(let z=-30;z>-roadLength;z-=85){palm(roadCenter(z)+13,z);if(z%170===-30)palm(roadCenter(z)-13,z)}
 queueAsset('palmiye-data.js',()=>loadBuilding(window.palmiyeBase64,parts=>{const dummy=new THREE.Object3D();for(const part of parts)for(let start=0;start<palmSlots.length;start+=12){const batch=palmSlots.slice(start,start+12),instances=new THREE.InstancedMesh(part.geometry,part.material,batch.length);batch.forEach((tree,i)=>{dummy.position.copy(tree.position);dummy.rotation.set(0,(start+i)*.7,0);dummy.scale.setScalar(.68+(i%3)*.05);dummy.updateMatrix();instances.setMatrixAt(i,dummy.matrix)});instances.instanceMatrix.needsUpdate=true;instances.computeBoundingSphere();scene.add(instances)}palmSlots.forEach(tree=>scene.remove(tree));window.palmModelLoaded=true},'palmModelError'));
 const signalRed=new THREE.MeshStandardMaterial({color:0x861916,emissive:0xff1611,emissiveIntensity:0.25}),signalGreen=new THREE.MeshStandardMaterial({color:0x175322,emissive:0x22ff44,emissiveIntensity:1.1}),crossingWhite=mat(0xdfe1d9,.9),signalCase=mat(0x202a2b,.7);
 for(const distance of [265,1145,1895]){const z=-distance,crossing=new THREE.Group();crossing.position.set(roadCenter(z),.03,z);crossing.rotation.y=roadHeading(z);scene.add(crossing);for(let x=-7;x<=7;x+=1.2)cube(crossing,.6,.025,3.4,crossingWhite,x,0,0);for(const side of [-1,1]){cube(crossing,.16,4.4,.16,silver,side*9.5,2.2,0);cube(crossing,.55,1.2,.42,signalCase,side*9.5,4.1,0);const redLamp=new THREE.Mesh(new THREE.SphereGeometry(.15,12,8),signalRed);redLamp.position.set(side*9.5,4.4,.23);crossing.add(redLamp);const greenLamp=new THREE.Mesh(new THREE.SphereGeometry(.15,12,8),signalGreen);greenLamp.position.set(side*9.5,3.85,.23);crossing.add(greenLamp)}}
 const walkers=[];for(let z=-70;z>-roadLength+80;z-=170){const side=(Math.round(-z/170)%2?1:-1),g=new THREE.Group(),body=shirtColors[Math.round(-z/170)%shirtColors.length];g.position.set(roadCenter(z)+side*11.1,0,z);scene.add(g);const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.19,.42,4,8),body);torso.position.y=1.22;g.add(torso);const head=new THREE.Mesh(new THREE.SphereGeometry(.18,12,8),skin);head.position.y=1.8;g.add(head);const legs=[];for(const x of [-.11,.11]){const leg=new THREE.Group();leg.position.set(x,.9,0);cube(leg,.17,.65,.19,dark,0,-.33,0);g.add(leg);legs.push(leg);cube(g,.13,.55,.14,body,x*2,1.19,0)}g.rotation.y=side===1?Math.PI:0;walkers.push({g,legs,base:z,side,phase:Math.abs(z)*.1})}
 const pedestrianMixers=[];queueAsset('yuruyen-data.js',()=>{if(!window.yuruyenBase64||!THREE.GLTFLoader)return;try{const raw=atob(window.yuruyenBase64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',gltf=>{const cloneRig=source=>{const clone=source.clone(true),original=[],copies=[],map=new Map();source.traverse(o=>original.push(o));clone.traverse(o=>copies.push(o));original.forEach((o,i)=>map.set(o,copies[i]));original.forEach(o=>{if(!o.isSkinnedMesh)return;const m=map.get(o),sk=o.skeleton.clone();sk.bones=o.skeleton.bones.map(b=>map.get(b));m.bind(sk,m.bindMatrix)});return clone};installDeliveryPeople(gltf,cloneRig);for(let idx=0;idx<walkers.length;idx++){const w=walkers[idx];if(!w)continue;const model=idx===0?gltf.scene:cloneRig(gltf.scene);for(const child of [...w.g.children])w.g.remove(child);model.traverse(o=>{if(o.isMesh&&o.material&&o.material.name.includes('original top')){o.material=o.material.clone();o.material.color.setHex([0xffffff,0xb5c8dd,0xd5b3a0,0xb1c8a6,0xd8d2c3][idx%5])}});w.g.add(model);if(gltf.animations.length){const mixer=new THREE.AnimationMixer(model);mixer.clipAction(gltf.animations[0]).play();pedestrianMixers.push({mixer,walker:w})}}window.walkingPersonLoaded=true},error=>window.walkingPersonError=String(error))}catch(error){window.walkingPersonError=String(error)}});
 for(let z=-60;z>-roadLength;z-=110){const side=Math.round(-z/110)%2?1:-1,x=roadCenter(z)+side*10.5;cube(scene,.52,.8,.5,binMat,x,.4,z);cube(scene,.58,.09,.56,dark,x,.84,z);for(let n=0;n<3;n++){const paper=cube(scene,.14,.015,.2,paperMat,x+side*(.7+n*.32),.025,z+n*.7);paper.rotation.y=n*.7}}
 const junctions=[320,1200,1950];const forkOffset=(d,start,side)=>{const t=(d-start)/190;return t<=0||t>=1?0:side*25*Math.pow(Math.sin(Math.PI*t),2)};
 for(const start of junctions)for(const side of [-1,1])for(let d=start;d<=start+190;d+=5){const z=-d,x=roadCenter(z)+forkOffset(d,start,side),ahead=roadCenter(z-2)+forkOffset(d+2,start,side),behind=roadCenter(z+2)+forkOffset(d-2,start,side),piece=new THREE.Group();piece.position.set(x,.012,z);piece.rotation.y=Math.atan2(behind-ahead,4);scene.add(piece);cube(piece,7,.03,5.4,roadMaterial,0,0,0);cube(piece,.08,.025,2.5,line,0,.025,0)}
 let chosenFork=null;function routeOffset(d){return chosenFork?forkOffset(d,chosenFork.start,chosenFork.side):0}
 for(let z=50;z>-roadLength-100;z-=32){for(const side of [-1,1]){cube(scene,.13,7,.13,silver,roadCenter(z)+side*10.2,3.5,z);cube(scene,1.8,.12,.18,silver,roadCenter(z)+side*9.3,6.8,z)}}
 function placeAnimals(encoded,key,offset){if(!encoded||!THREE.GLTFLoader)return;try{const raw=atob(encoded),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',gltf=>{for(let z=-35-offset;z>-roadLength;z-=350){for(const side of [-1,1]){const animal=gltf.scene.clone(true);animal.position.set(roadCenter(z)+side*(9.4+offset*.02),.05,z);animal.rotation.y=side*Math.PI/2;scene.add(animal)}}window[key+'Loaded']=true},error=>window[key+'Error']=String(error))}catch(error){window[key+'Error']=String(error)}}
 queueAsset('kedi-data.js',()=>placeAnimals(window.kediModelBase64,'cat',0));queueAsset('kus-data.js',()=>placeAnimals(window.kusModelBase64,'bird',32));
 function streetSign(parent,label){const canvas=document.createElement('canvas');canvas.width=512;canvas.height=128;const ctx=canvas.getContext('2d');ctx.fillStyle='#205992';ctx.fillRect(0,0,512,128);ctx.fillStyle='white';ctx.font='bold 62px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,256,65);const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const plane=new THREE.Mesh(new THREE.PlaneGeometry(5,1.25),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));plane.position.y=4;parent.add(plane)}
 const sign=new THREE.Group();sign.position.set(roadCenter(-190)+10.5,0,-190);sign.rotation.y=roadHeading(-190);scene.add(sign);cube(sign,.14,4,.14,silver,0,2,0);streetSign(sign,'ANKARA');
 const landmark=new THREE.Group();landmark.position.set(roadCenter(-430)-55,0,-430);scene.add(landmark);cube(landmark,2.7,35,2.7,mat(0xb0b2ad),0,17.5,0);const crown=new THREE.Mesh(new THREE.CylinderGeometry(7,6,2.2,32),mat(0xd5d6ce));crown.position.y=35;landmark.add(crown);cube(landmark,8,1,8,glass,0,33.8,0);
 function overheadAirportSign(z){const group=new THREE.Group();group.position.set(roadCenter(z),0,z);group.rotation.y=roadHeading(z);scene.add(group);const metal=mat(0x9ba5a2);for(const x of [-9.5,9.5])cube(group,.22,7.2,.22,metal,x,3.6,0);cube(group,19.2,.24,.22,metal,0,7.1,0);const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');ctx.fillStyle='#17629b';ctx.fillRect(0,0,1024,512);ctx.strokeStyle='white';ctx.lineWidth=14;ctx.strokeRect(12,12,1000,488);ctx.fillStyle='white';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 120px Arial';ctx.fillText('HAVALİMANI',512,176);ctx.font='bold 200px Arial';ctx.fillText('↑',512,355);const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;const plane=new THREE.Mesh(new THREE.PlaneGeometry(9,4.2),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide}));plane.position.set(0,5.05,.2);group.add(plane)}
 for(const z of [-350,-1600,-2650])overheadAirportSign(z);
 function ayranBillboard(z){const group=new THREE.Group();group.position.set(roadCenter(z)+14,0,z);group.rotation.y=roadHeading(z);scene.add(group);cube(group,.2,4,.2,silver,-3,2,0);cube(group,.2,4,.2,silver,3,2,0);const canvas=document.createElement('canvas');canvas.width=1024;canvas.height=512;const ctx=canvas.getContext('2d');const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;const draw=image=>{ctx.fillStyle='#eaf7f6';ctx.fillRect(0,0,1024,512);ctx.fillStyle='#135c9b';ctx.fillRect(0,0,1024,95);ctx.fillStyle='white';ctx.font='bold 66px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('TAZE AYRAN',512,51);if(image)ctx.drawImage(image,55,115,225,302);ctx.fillStyle='#174965';ctx.textAlign='left';ctx.font='bold 58px Arial';ctx.fillText('TAZE AYRAN',320,190);ctx.font='bold 52px Arial';ctx.fillText('Tel: 1920116',320,275);ctx.font='24px Arial';ctx.fillText('Serin ve ferah',320,340);ctx.font='18px Arial';ctx.fillStyle='#4f646a';ctx.fillText('Fotoğraf: Mavigogun · CC BY-SA 3.0',320,470);texture.needsUpdate=true};draw(null);const photo=new Image();photo.onload=()=>{draw(photo);window.ayranPhotoLoaded=true};photo.onerror=()=>window.ayranPhotoError=true;photo.src=window.surusTextures['taze-ayran.jpg'];const face=new THREE.Mesh(new THREE.PlaneGeometry(8,4),new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide}));face.position.set(0,4.8,.15);group.add(face)}
 ayranBillboard(-230);ayranBillboard(-1450);
 const airportZ=-3055,airport=new THREE.Group();airport.position.set(roadCenter(airportZ),0,airportZ);airport.rotation.y=roadHeading(airportZ);scene.add(airport);const airportFallback=new THREE.Group();airport.add(airportFallback);cube(airportFallback,35,8,17,mat(0xc7d1d2),0,4,0);cube(airportFallback,35,.8,19,mat(0xe8ebe7),0,8.4,0);for(let z=-7;z<=7;z+=3)cube(airportFallback,.1,5,2.6,glass,-17.56,3.1,z);const airportSign=new THREE.Group();airportSign.position.set(0,0,22);airportSign.rotation.y=0;airport.add(airportSign);streetSign(airportSign,'HAVALİMANI');
 const securityZ=-2870,security=new THREE.Group();security.position.set(roadCenter(securityZ)+10,0,securityZ);security.rotation.y=roadHeading(securityZ);scene.add(security);cube(security,3,2.7,2.8,mat(0xd6dcd8),0,1.35,0);cube(security,.07,1.5,1.9,glass,-1.52,1.7,0);cube(security,3.25,.18,3.05,mat(0x596971),0,2.8,0);const securitySign=new THREE.Group();securitySign.position.set(0,-.5,1.5);security.add(securitySign);streetSign(securitySign,'GÜVENLİK');cube(security,.15,1.0,.15,mat(0xe7e9e7),-4,.5,1);cube(security,4,.12,.14,mat(0xe5e5dc),-2,1,1);cube(security,.6,.14,.16,mat(0xc83e35),-1,1,1);cube(security,.6,.14,.16,mat(0xc83e35),-3,1,1);const securityHolder=new THREE.Group();securityHolder.position.set(-3,0,-1);security.add(securityHolder);cube(securityHolder,.5,1,.3,mat(0x273b53),0,1.1,0);const securityHead=new THREE.Mesh(new THREE.SphereGeometry(.2,12,10),skin);securityHead.position.set(0,1.8,0);securityHolder.add(securityHead);
 queueAirportAsset('guvenlik-data.js',()=>{if(!window.guvenlikModelBase64||!THREE.GLTFLoader)return;try{const raw=atob(window.guvenlikModelBase64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',gltf=>{for(const part of [...securityHolder.children])securityHolder.remove(part);gltf.scene.rotation.y=Math.PI;securityHolder.add(gltf.scene);window.securityModelLoaded=true},error=>window.securityModelError=String(error))}catch(error){window.securityModelError=String(error)}});
 let flyingPlane=null;
 queueAirportAsset('terminal-data.js',()=>{if(!window.terminalModelBase64||!THREE.GLTFLoader)return;try{const raw=atob(window.terminalModelBase64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',gltf=>{airport.remove(airportFallback);gltf.scene.scale.setScalar(.32);gltf.scene.rotation.y=Math.PI/2;airport.add(gltf.scene);window.airportModelLoaded=true},error=>window.airportModelError=String(error))}catch(error){window.airportModelError=String(error)}});
 queueAirportAsset('ucak-data.js',()=>{if(!window.ucakModelBase64||!THREE.GLTFLoader)return;try{const raw=atob(window.ucakModelBase64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',gltf=>{const plane=gltf.scene;plane.scale.setScalar(.6);plane.position.set(29,1,6);airport.add(plane);const second=plane.clone(true);second.position.set(-31,1,0);second.rotation.y=Math.PI;airport.add(second);flyingPlane=plane.clone(true);flyingPlane.scale.setScalar(.7);flyingPlane.position.set(0,26,70);flyingPlane.rotation.y=Math.PI/2;airport.add(flyingPlane);window.planeModelLoaded=true},error=>window.planeModelError=String(error))}catch(error){window.planeModelError=String(error)}});
 const checkpointZ=-1250,checkpoint=new THREE.Group();checkpoint.position.set(roadCenter(checkpointZ)+10,0,checkpointZ);checkpoint.rotation.y=roadHeading(checkpointZ);scene.add(checkpoint);const policeCar=roadCar(0xe9eceb,false);checkpoint.add(policeCar);cube(policeCar,.9,.2,.32,mat(0x264a9a),0,1.95,0);cube(policeCar,.42,.17,.34,mat(0xbc2837),-.22,2.14,0);cube(policeCar,.42,.17,.34,mat(0x2960b2),.22,2.14,0);const policeSign=new THREE.Group();policeSign.position.set(-3,0,5);checkpoint.add(policeSign);cube(policeSign,.12,3,.12,silver,0,1.5,0);streetSign(policeSign,'POLİS');
 const officerHolder=new THREE.Group();officerHolder.position.set(-3,0,1);checkpoint.add(officerHolder);cube(officerHolder,.55,1.1,.32,mat(0x293e58),0,1.2,0);const officerHead=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),skin);officerHead.position.set(0,1.95,0);officerHolder.add(officerHead);
 queueAsset('polis-data.js',()=>{if(!window.polisModelBase64||!THREE.GLTFLoader)return;try{const raw=atob(window.polisModelBase64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',gltf=>{for(const part of [...officerHolder.children])officerHolder.remove(part);gltf.scene.rotation.y=Math.PI;officerHolder.add(gltf.scene);window.policeModelLoaded=true},error=>window.policeModelError=String(error))}catch(error){window.policeModelError=String(error)}});
 const carBadgeTextures={};function addCarBadge(group,brand){let texture=carBadgeTextures[brand];if(!texture){const c=document.createElement('canvas');c.width=256;c.height=96;const ctx=c.getContext('2d');ctx.clearRect(0,0,256,96);ctx.font='bold 52px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.lineWidth=7;ctx.strokeStyle='#111';ctx.strokeText(brand,128,48);ctx.fillStyle='#f4f4f4';ctx.fillText(brand,128,48);texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;carBadgeTextures[brand]=texture}const badge=new THREE.Mesh(new THREE.PlaneGeometry(.44,.165),new THREE.MeshBasicMaterial({map:texture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));badge.position.set(0,1.12,2.42);group.add(badge)}
 const traffic = [];
 const trafficColors = [0xc4c9c7,0x566b7a,0x8c3029,0xb9b0a2,0x343d42];
 function placeTrafficVehicle(mesh, { startZ, lane, speed, direction = 1, ...kind }) {
   mesh.position.set(roadCenter(startZ) + lane, 0, startZ);
   mesh.rotation.y = roadHeading(startZ) + (direction < 0 ? Math.PI : 0);
   scene.add(mesh);
   const vehicleState = { mesh, startZ, lane, speed, direction, ...kind };
   traffic.push(vehicleState);
   return vehicleState;
 }
 for (let index = 0; index < 26; index++) {
   const color = trafficColors[index % trafficColors.length];
   const lane = [-6,-2,2,6][index % 4];
   const mesh = vehicleModels?.createCar(index % 2 ? 'm5' : 'm4', color) || roadCar(color, index % 9 === 0);
   placeTrafficVehicle(mesh, {
     startZ: -75 - index * 110, lane, speed: 5 + (index % 4) * 1.2,
     direction: courierMode && lane < 0 ? -1 : 1,
     isSUV: index % 4 === 1, brand: index % 8 === 1 ? 'audi' : index % 8 === 2 ? 'bmw' : null,
   });
 }
 const patrolMesh = roadCar(0xdfe8ef);
 const sirenRed = new THREE.MeshStandardMaterial({ color: 0x6b121a, emissive: 0xff2143, emissiveIntensity: 0 });
 const sirenBlue = new THREE.MeshStandardMaterial({ color: 0x144382, emissive: 0x317fff, emissiveIntensity: 0 });
 cube(patrolMesh,.95,.09,.34,mat(0x233145),0,1.94,0);
 cube(patrolMesh,.36,.13,.3,sirenRed,-.24,2.02,0);
 cube(patrolMesh,.36,.13,.3,sirenBlue,.24,2.02,0);
 const patrol = placeTrafficVehicle(patrolMesh, { startZ: -205, lane: 2, speed: 7.2, isPolice: true });
 function addMotorTraffic(){if(!motorTrafficSource||!riderTrafficSource||motorTrafficAdded)return;motorTrafficAdded=true;for(let i=0;i<5;i++){const g=new THREE.Group(),model=motorTrafficSource.clone(true),rider=riderTrafficSource.clone(true);rider.position.set(0,.38,.07);rider.rotation.y=Math.PI;g.add(model,rider);const helmet=makeRealisticHelmet();helmet.position.set(0,1.7,.08);g.add(helmet);const lane=[-6,-2,2,6,2][i],z=-120-i*350;placeTrafficVehicle(g, {startZ:z,lane,speed:6+i,direction:courierMode&&lane<0?-1:1,isMotor:true})}window.motorTrafficLoaded=true}
 if(!vehicleModels)queueAsset('sedan-data.js',()=>{if(!window.sedanModelBase64||!THREE.GLTFLoader)return;try{const raw=atob(window.sedanModelBase64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);new THREE.GLTFLoader().parse(bytes.buffer,'',gltf=>{const parts={};gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(o=>{if(!o.isMesh||!o.geometry.attributes.position)return;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(o.matrixWorld);const key=o.material.name||'body',entry=parts[key]||(parts[key]={material:o.material,positions:[],normals:[],uvs:[]});entry.positions.push(geo.attributes.position.array);if(geo.attributes.normal)entry.normals.push(geo.attributes.normal.array);entry.uvs.push(geo.attributes.uv?geo.attributes.uv.array:new Float32Array(geo.attributes.position.count*2))});const join=arrays=>{const out=new Float32Array(arrays.reduce((n,a)=>n+a.length,0));let i=0;for(const a of arrays){out.set(a,i);i+=a.length}return out};const meshes=Object.entries(parts).map(([name,part])=>{const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(join(part.positions),3));geometry.setAttribute('uv',new THREE.BufferAttribute(join(part.uvs),2));if(part.normals.length===part.positions.length)geometry.setAttribute('normal',new THREE.BufferAttribute(join(part.normals),3));else geometry.computeVertexNormals();geometry.computeBoundingSphere();return {name,geometry,material:part.material}});const colors=[0xc4c9c7,0x566b7a,0x8c3029,0xb9b0a2,0x343d42];traffic.forEach((car,index)=>{if(car.isMotor||car.isSUV||car.brand)return;const model=new THREE.Group();model.rotation.y=Math.PI;meshes.forEach(part=>{let material=part.material;if(part.name==='white'){material=material.clone();material.color.set(colors[index%colors.length])}model.add(new THREE.Mesh(part.geometry,material))});for(const child of [...car.mesh.children])car.mesh.remove(child);car.mesh.add(model);addPlate(car.mesh,2.4)});const policeModel=new THREE.Group();policeModel.rotation.y=Math.PI;meshes.forEach(part=>policeModel.add(new THREE.Mesh(part.geometry,part.material)));for(const child of [...policeCar.children])policeCar.remove(child);policeCar.add(policeModel);addPlate(policeCar,2.4);cube(policeCar,.9,.15,.32,mat(0x244d98),0,1.57,0);cube(policeCar,.42,.14,.34,mat(0xbc2837),-.22,1.71,0);cube(policeCar,.42,.14,.34,mat(0x2960b2),.22,1.71,0);const policeLabel=new THREE.Group();policeLabel.position.set(0,-2,2.42);policeLabel.scale.set(.55,.55,.55);streetSign(policeLabel,'POLİS');policeCar.add(policeLabel);window.trafficModelLoaded=true},error=>window.trafficModelError=String(error))}catch(error){window.trafficModelError=String(error)}});
 if(!vehicleModels)queueAsset('suv-data.js',()=>{if(!window.suvBase64)return;loadBuilding(window.suvBase64,parts=>{traffic.forEach((car,index)=>{if(!car.isSUV||car.brand)return;const model=new THREE.Group();model.rotation.y=-Math.PI/2;for(const part of parts)model.add(new THREE.Mesh(part.geometry,part.material));for(const child of [...car.mesh.children])car.mesh.remove(child);car.mesh.add(model);addPlate(car.mesh,2.28)});window.suvModelLoaded=true},'suvModelError')});
 function addBrandedCars(brand,parts){traffic.forEach(car=>{if(car.brand!==brand)return;const model=new THREE.Group();for(const part of parts)model.add(new THREE.Mesh(part.geometry,part.material));if(brand==='bmw'){model.rotation.y=Math.PI}else{model.scale.setScalar(.731);model.position.set(-.899*.731,0,-2.302*.731)}for(const child of [...car.mesh.children])car.mesh.remove(child);car.mesh.add(model)});window[brand+'ModelLoaded']=true}
 if(!vehicleModels)queueAsset('bmw-m3-data.js',()=>loadBuilding(window.bmwBase64,parts=>addBrandedCars('bmw',parts),'bmwModelError'));
 if(!vehicleModels)queueAsset('audi-q7-data.js',()=>loadBuilding(window.audiBase64,parts=>addBrandedCars('audi',parts),'audiModelError'));
 let cameraMode=0;const cameraNames=['Dış','Sürücü','Kask'];function setCamera(){el('cockpit').classList.toggle('car-interior',vehicle==='araba');const label=vehicle==='araba'&&cameraMode===2?'İç':cameraNames[cameraMode];el('cameraButton').textContent='Kamera: '+label;el('helmetFrame').hidden=!(cameraMode===2&&vehicle==='motor');player.visible=cameraMode===0;el('cockpit').hidden=cameraMode===0;el('carCockpit').style.display=vehicle==='araba'?'block':'none';el('motorCockpit').style.display=vehicle==='motor'?'block':'none'}function changeCamera(){cameraMode=(cameraMode+1)%3;setCamera()}el('cameraButton').addEventListener('click',changeCamera);setCamera();
 const contactTexture=(()=>{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d'),g=x.createRadialGradient(64,64,2,64,64,62);g.addColorStop(0,'rgba(0,0,0,.52)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(0,0,128,128);return new THREE.CanvasTexture(c)})();const playerShadow=new THREE.Mesh(new THREE.PlaneGeometry(3,6),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false}));playerShadow.rotation.x=-Math.PI/2;playerShadow.position.y=.035;scene.add(playerShadow);
 const exhaustFlames=new THREE.Group(),flamePieces=[];exhaustFlames.visible=false;scene.add(exhaustFlames);const flameOuter=new THREE.MeshBasicMaterial({color:0xff5b08,transparent:true,opacity:.86,depthWrite:false,blending:THREE.AdditiveBlending}),flameInner=new THREE.MeshBasicMaterial({color:0xffdf62,transparent:true,opacity:.95,depthWrite:false,blending:THREE.AdditiveBlending});for(const x of (vehicle==='araba'?[-.55,.55]:[0])){const nozzle=new THREE.Group();nozzle.position.set(x,.55,vehicle==='araba'?2.75:1.2);const outer=new THREE.Mesh(new THREE.ConeGeometry(.27,1.35,12),flameOuter);outer.rotation.x=Math.PI/2;outer.position.z=.65;nozzle.add(outer);const inner=new THREE.Mesh(new THREE.ConeGeometry(.14,.78,10),flameInner);inner.rotation.x=Math.PI/2;inner.position.z=.38;nozzle.add(inner);flamePieces.push(nozzle);exhaustFlames.add(nozzle)}
 let jumpHeight = 0, jumpVelocity = 0, airRotation = 0, wheelie = 0;
 let distance = 0, speed = 0, lateral = 0, last = 0, targetSpeed = 55, speedAdjusted = false;
 let phase = 'ready', phoneOpen = false, policeChecked = false, securityChecked = false, airportAnnounced = false;
 let pursuitTime = 0, recoveryTime = 0, jumpCount = 0;
 const clearedCars = new Set();
 const keys = {};
 const controls = { left:false, right:false, accelerate:false, brake:false, boost:false, wheelie:false };
 const status = el('driveObjective'), deliveryAction = el('deliveryAction'), soundButton = el('driveAudio');
 const cameraTarget = new THREE.Vector3();
 const distances = new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

 function updateObjective() {
   if (!status) return;
   let text = '';
   if (phase === 'arrived') text = 'Teslimat noktası · Durup araçtan in.';
   else if (phase === 'handoff') text = 'Müşteri girişte. Paketi elden teslim et.';
   else if (pursuitTime > 0) text = 'Polis takibi başladı';
   else if (challenge) text = jumpCount < 5 ? 'Araçların üzerinden atla · ' + jumpCount + ' / 5' : 'Akrobasi görevi tamamlandı · 5 / 5';
   status.hidden = !text;
   if (status.textContent !== text) status.textContent = text;
 }
 function setPhase(value) {
   phase = value;
   el('scene').dataset.phase = value;
   updateObjective();
 }
 function clearControls() {
   Object.keys(keys).forEach(key => keys[key] = false);
   Object.keys(controls).forEach(key => controls[key] = false);
   document.querySelectorAll('[data-control].pressed').forEach(button => button.classList.remove('pressed'));
 }
 function updateReadouts() {
   const displaySpeed = String(Math.round(speed));
   for (const id of ['speed','touchSpeed','carSpeed','motorSpeed']) {
     if (el(id).textContent !== displaySpeed) el(id).textContent = displaySpeed;
   }
   const remaining = distances.format(Math.max(0, roadLength-distance)/1000) + ' km';
   if (el('remaining').textContent !== remaining) el('remaining').textContent = remaining;
   el('progress').style.width = (distance/roadLength*100) + '%';
 }
 function placePlayer(steer = 0) {
   player.position.set(roadCenter(-distance)+routeOffset(distance)+lateral,jumpHeight+wheelie*.84,-distance);
   player.rotation.set(wheelie, roadHeading(-distance)+Math.atan2(routeOffset(distance-3)-routeOffset(distance+3),6)-steer*.055+airRotation,
     vehicle==='motor'?-steer*.16:0);
 }
 function reset() {
   distance = 0;
   chosenFork = null;
   jumpHeight = jumpVelocity = airRotation = wheelie = 0;
   pursuitTime = recoveryTime = jumpCount = 0;
   clearedCars.clear();
   speed = 35;
   targetSpeed = 55;
   lateral = 2;
   speedAdjusted = phoneOpen = policeChecked = securityChecked = airportAnnounced = false;
   for (const id of ['securityPanel','airportNotice','policePanel','phonePanel']) el(id).hidden = true;
   if (deliveryAction) deliveryAction.hidden = true;
   setPhase('ready');
   el('speedTarget').textContent = '55';
   for (const trafficVehicle of traffic) {
     const { mesh, startZ, lane, direction } = trafficVehicle;
     mesh.position.set(roadCenter(startZ) + lane, 0, startZ);
     mesh.rotation.y = roadHeading(startZ) + (direction < 0 ? Math.PI : 0);
     mesh.visible = true;
     trafficVehicle.retired = false;
   }
   placePlayer();
   updateReadouts();
 }
 function recoveryLane() {
   const z = -distance;
   let bestLane = 6, bestClearance = -1;
   for (const lane of (courierMode ? [2,6] : [2,6,-2,-6])) {
     const x = roadCenter(z) + routeOffset(distance) + lane;
     let clearance = Infinity;
     for (const other of traffic) {
       if (other.retired || Math.abs(other.mesh.position.x-x)>3.2) continue;
       clearance = Math.min(clearance, Math.abs(other.mesh.position.z-z));
     }
     if (clearance > bestClearance) { bestClearance = clearance; bestLane = lane; }
   }
   return bestLane;
 }
 function resumeAfterCrash() {
   // Keep the delivery, optional goal progress and completed checks.
   distance = Math.min(roadLength-1, Math.max(0, distance-4));
   lateral = recoveryLane();
   jumpHeight = jumpVelocity = airRotation = wheelie = 0;
   speed = targetSpeed = 32;
   speedAdjusted = true;
   recoveryTime = 2.5;
   el('speedTarget').textContent = '32';
   clearControls();
   placePlayer();
   setPhase('driving');
   el('overlay').hidden = true;
   last = performance.now();
 }
 function start() {
   if (phase === 'finished') {
     const next = courierMode ? 'teslimat.html?gorev=yeni&mod=kurye&arac='+vehicle+(challenge?'&gorev-turu=akrobasi':'') : 'teslimat.html?gorev=yeni';
     location.href = next;
     return;
   }
   if (phase === 'arrived' || phase === 'handoff') { deliveryStep(); return; }
   startAudio();
   if (phase === 'crash') { resumeAfterCrash(); return; }
   if (phase !== 'ready') return;
   setPhase('driving');
   el('overlay').hidden = true;
   last = performance.now();
   loadAssets();
 }
 el('start').addEventListener('click',start);

 function adjustTarget(delta) {
   if (phase !== 'driving' || phoneOpen) return;
   if (!speedAdjusted) targetSpeed = Math.round(speed/5)*5;
   speedAdjusted = true;
   targetSpeed = THREE.MathUtils.clamp(targetSpeed+delta,0,maxSpeed);
   el('speedTarget').textContent = Math.round(targetSpeed);
 }
 let audio = null, sceneVolume, engine, engineGain, hornAnimationTimer, nextBird = 0, nextPass = 0, nextSiren = 0;
 let soundOn = true;
 function startAudio() {
   if (!soundOn) return;
   const Audio = window.AudioContext || window.webkitAudioContext;
   if (!Audio) return;
   try {
     if (!audio) {
       audio = new Audio();
       sceneVolume = audio.createGain();
       sceneVolume.gain.value = 0.38;
       sceneVolume.connect(audio.destination);
       const filter = audio.createBiquadFilter();
       filter.type = 'lowpass';
       filter.frequency.value = vehicle === 'motor' ? 215 : 140;
       engine = audio.createOscillator();
       engine.type = 'sawtooth';
       engineGain = audio.createGain();
       engineGain.gain.value = 0;
       engine.connect(filter);
       filter.connect(engineGain);
       engineGain.connect(sceneVolume);
       engine.start();
     }
     if (audio.state === 'suspended') audio.resume().catch(() => {});
   } catch (_) { /* Sound is optional on browsers without Web Audio support. */ }
 }
 function soundSweep(low, high, seconds, loudness, type = 'sine', delay = 0) {
   if (!soundOn || audio?.state !== 'running' || !sceneVolume) return;
   const now = audio.currentTime + delay;
   const oscillator = audio.createOscillator(), volume = audio.createGain();
   oscillator.type = type;
   oscillator.frequency.setValueAtTime(low, now);
   oscillator.frequency.exponentialRampToValueAtTime(high, now+seconds);
   volume.gain.setValueAtTime(.0001,now);
   volume.gain.exponentialRampToValueAtTime(loudness,now+Math.min(.05,seconds/3));
   volume.gain.exponentialRampToValueAtTime(.0001,now+seconds);
   oscillator.connect(volume);
   volume.connect(sceneVolume);
   oscillator.onended = () => { oscillator.disconnect(); volume.disconnect(); };
   oscillator.start(now);
   oscillator.stop(now+seconds);
 }
 function updateAudio(now) {
   if (!audio || !engineGain || audio.state !== 'running') return;
   const driving = soundOn && phase === 'driving' && !phoneOpen;
   engine.frequency.setTargetAtTime((vehicle === 'motor' ? 43 : 32)+Math.min(speed,105)*.72,audio.currentTime,.12);
   engineGain.gain.setTargetAtTime(driving ? .035+Math.min(speed,90)*.00065 : 0,audio.currentTime,.12);
   if (driving && now >= nextBird) {
     nextBird = now + 5000 + Math.random()*8000;
     soundSweep(2050,3200,.12,.03);
     soundSweep(2920,1980,.16,.021,'sine',.15);
   }
   if (driving && pursuitTime > 0 && now >= nextSiren) {
     nextSiren = now + 920;
     soundSweep(620,990,.42,.075,'triangle');
     soundSweep(990,620,.42,.075,'triangle',.44);
   }
 }
 soundButton?.addEventListener('click', () => {
   soundOn = !soundOn;
   soundButton.setAttribute('aria-pressed', String(soundOn));
   soundButton.textContent = soundOn ? 'Ses açık' : 'Ses kapalı';
   if (soundOn) startAudio();
   if (sceneVolume) sceneVolume.gain.setTargetAtTime(soundOn ? .38 : 0,audio.currentTime,.025);
 });
 function playHorn() {
   const cockpit = el('cockpit');
   cockpit.classList.remove('horn-pressed');
   void cockpit.offsetWidth;
   cockpit.classList.add('horn-pressed');
   clearTimeout(hornAnimationTimer);
   hornAnimationTimer = setTimeout(()=>cockpit.classList.remove('horn-pressed'),500);
   startAudio();
   for (const frequency of (vehicle==='motor' ? [490,620] : [360,440])) soundSweep(frequency,frequency,.33,.12,'sawtooth');
 }
 function jump() {
   if (phase === 'driving' && !phoneOpen && jumpHeight === 0 && jumpVelocity === 0) jumpVelocity = 8.8;
 }
 el('jumpButton').addEventListener('click',jump);
 for (const id of ['hornButton','carHornSpot','motorHornSpot']) el(id).addEventListener('click',playHorn);
 el('speedDown').addEventListener('click',()=>adjustTarget(-10));
 el('speedUp').addEventListener('click',()=>adjustTarget(10));

 function showOverlay(eyebrow,title,description,details,button) {
   el('eyebrow').textContent = eyebrow;
   el('title').textContent = title;
   el('description').textContent = description;
   el('details').textContent = details;
   el('start').textContent = button;
   el('overlay').hidden = false;
 }
 function crash(other) {
   if (other?.isPolice) {
     pursuitTime = 10;
     patrol.retired = true;
     nextSiren = 0;
     soundSweep(620,990,.42,.065,'triangle');
   }
   setPhase('crash');
   clearControls();
   jumpHeight = jumpVelocity = wheelie = speed = 0;
   player.position.y = 0;
   player.rotation.x = 0;
   if (vehicle === 'motor') player.rotation.z = .95;
   cameraMode = 0;
   setCamera();
   updateReadouts();
   showOverlay('KAZA', vehicle === 'motor' ? 'Motor devrildi' : 'Kaza yaptın',
     'Paket ve yol ilerlemen kaydedildi. Güvenli noktadan devam edebilirsin.',
     'Kalan yol: '+distances.format(Math.max(0,roadLength-distance)/1000)+' km', 'Kaldığın yerden devam et');
 }
 function makeDeliveryPerson(shirtColor) {
   const group = new THREE.Group(), clothes = mat(shirtColor);
   const body = new THREE.Mesh(new THREE.CapsuleGeometry(.20,.4,5,10),clothes);
   body.position.y = 1.28;
   group.add(body);
   const face = new THREE.Mesh(new THREE.SphereGeometry(.14,16,12),skin);
   face.scale.set(.88,1.15,.9);
   face.position.y = 1.83;
   group.add(face);
   for (const side of [-1,1]) {
     const arm = new THREE.Mesh(new THREE.CapsuleGeometry(.068,.42,4,8),clothes);
     arm.position.set(side*.28,1.24,0);
     group.add(arm);
     const leg = new THREE.Mesh(new THREE.CapsuleGeometry(.091,.59,4,8),dark);
     leg.position.set(side*.12,.48,0);
     group.add(leg);
   }
   group.visible = false;
   scene.add(group);
   return group;
 }
 const courier = makeDeliveryPerson(0xc6652a), customer = makeDeliveryPerson(0x426275);
 let onFootMixer = null;
 function installDeliveryPeople(gltf,cloneRig) {
   for (const [person,color] of [[courier,0xf6a15a],[customer,0xb5c8dd]]) {
     const model = cloneRig(gltf.scene);
     model.scale.multiplyScalar(1.04);
     model.traverse(part => {
       if (!part.isMesh || !part.material?.name?.includes('original top')) return;
       part.material = part.material.clone();
       part.material.color.setHex(color);
     });
     person.clear();
     person.add(model);
     if (!gltf.animations.length) continue;
     const mixer = new THREE.AnimationMixer(model);
     mixer.clipAction(gltf.animations[0]).play();
     mixer.setTime(.19);
     if (person === courier) onFootMixer = mixer;
   }
 }
 const deliveryBag = cube(scene,.35,.37,.22,mat(0xcba879),0,0,0);
 deliveryBag.visible = false;
 const doorstep = new THREE.Group();
 const stopZ = -roadLength-3;
 doorstep.position.set(roadCenter(stopZ)+15,0,stopZ);
 scene.add(doorstep);
 cube(doorstep,7,3.5,10,mat(0xc0b5a1),0,1.75,0);
 cube(doorstep,.06,2.45,2.8,glass,-3.53,1.22,0);
 cube(doorstep,1.4,.15,8,mat(0x374b3f),-3.9,3.45,0);
 const doorSign = new THREE.Group();
 doorSign.position.set(-3.62,-.8,0);
 doorSign.rotation.y = -Math.PI/2;
 doorstep.add(doorSign);
 streetSign(doorSign,'SÜPER MARKET');
 let fromVehicleX = 0, handoffElapsed = 0, handoffAt = 0;
 function setDeliveryAction(label,disabled = false) {
   if (!deliveryAction) return;
   deliveryAction.hidden = !label;
   deliveryAction.textContent = label || '';
   deliveryAction.disabled = disabled;
 }
 function arrive() {
   distance = roadLength;
   speed = 0;
   chosenFork = null;
   pursuitTime = jumpHeight = jumpVelocity = wheelie = 0;
   sirenRed.emissiveIntensity = sirenBlue.emissiveIntensity = 0;
   if (patrol.retired) patrol.mesh.visible = false;
   lateral = 6;
   clearControls();
   cameraMode = 0;
   setCamera();
   placePlayer();
   setPhase('arrived');
   customer.position.set(roadCenter(stopZ)+10.8,0,stopZ);
   customer.rotation.y = -Math.PI/2;
   customer.visible = true;
   if (deliveryAction) setDeliveryAction('Araçtan in · E');
   else showOverlay('TESLİMAT NOKTASI','Müşteri seni bekliyor','Araçtan in ve paketi dükkâna götür.','', 'Araçtan in');
 }
 function deliveryStep() {
   if (phase === 'arrived') {
     fromVehicleX = player.position.x+.8;
     courier.position.set(fromVehicleX,0,player.position.z);
     courier.rotation.y = Math.PI/2;
     courier.visible = deliveryBag.visible = true;
     if (player.userData.rider) player.userData.rider.visible = false;
     if (player.userData.helmet) player.userData.helmet.visible = false;
     handoffElapsed = 0;
     setPhase('handoff');
     if (deliveryAction) setDeliveryAction('Paketi elden ver · E',true);
     else showOverlay('TESLİMAT NOKTASI','Müşteri girişte','Paketi müşteriye elden ver.','', 'Paketi elden ver');
   } else if (phase === 'handoff' && handoffElapsed >= .8) {
     handoffAt = last;
     clearControls();
     setPhase('finished');
     setDeliveryAction(null);
   }
 }
 deliveryAction?.addEventListener('click',deliveryStep);
 function updateHandoff(dt,now) {
   if (phase === 'handoff') {
     handoffElapsed = Math.min(.8,handoffElapsed+dt);
     const portion = handoffElapsed/.8;
     if (portion < 1) onFootMixer?.update(dt*1.3);
     courier.position.x = THREE.MathUtils.lerp(fromVehicleX,customer.position.x-.77,portion);
     courier.position.z = THREE.MathUtils.lerp(player.position.z,stopZ,portion);
     courier.position.y = portion < 1 ? Math.abs(Math.sin(portion*15))*.045 : 0;
     deliveryBag.position.set(courier.position.x+.28,.99,courier.position.z);
     if (portion >= 1 && deliveryAction) deliveryAction.disabled = false;
   } else if (phase === 'finished' && handoffAt) {
     const portion = Math.min(1,(now-handoffAt)/550);
     deliveryBag.position.x = THREE.MathUtils.lerp(customer.position.x-.49,customer.position.x-.21,portion);
     if (portion >= 1) {
       handoffAt = 0;
       showOverlay('TESLİMAT TAMAMLANDI','Sipariş elden teslim edildi','Müşteri paketini aldı. Yeni bir sipariş alabilirsin.',
         challenge ? 'Akrobasi görevi: '+jumpCount+' / 5' : 'Tamamlanan mesafe: 3 km','Yeni sipariş al');
     }
   }
 }

 addEventListener('keydown', event => {
   if (phoneOpen || /INPUT|TEXTAREA|SELECT/.test(event.target?.tagName)) return;
   const key = event.key.toLowerCase();
   if (key === 'e' && !event.repeat && (phase === 'arrived' || phase === 'handoff')) {
     event.preventDefault();
     deliveryStep();
   } else if (key === ' ' && !event.repeat && phase === 'driving') {
     event.preventDefault();
     jump();
   } else if (key === 'h' && !event.repeat && phase === 'driving') {
     event.preventDefault();
     playHorn();
   } else if (key === 'c' && !event.repeat && phase === 'driving') {
     event.preventDefault();
     changeCamera();
   } else if (phase === 'driving' && ['arrowleft','arrowright','arrowup','arrowdown','a','d','w','s','shift','v'].includes(key)) {
     keys[key] = true;
     event.preventDefault();
   }
 });
 addEventListener('keyup',event => { keys[event.key.toLowerCase()] = false; });
 addEventListener('blur',clearControls);
 document.querySelectorAll('[data-control]').forEach(button => {
   const key = button.dataset.control;
   const stop = () => { controls[key] = false; button.classList.remove('pressed'); };
   button.addEventListener('pointerdown',event => {
     if (phase !== 'driving' || phoneOpen) return;
     event.preventDefault();
     controls[key] = true;
     button.classList.add('pressed');
     button.setPointerCapture(event.pointerId);
   });
   for (const type of ['pointerup','pointercancel','lostpointercapture']) button.addEventListener(type,stop);
 });
 function closeCheckpoint(id,speedLimit) {
   el(id).hidden = true;
   phoneOpen = false;
   targetSpeed = speedLimit;
   speedAdjusted = true;
   el('speedTarget').textContent = String(speedLimit);
 }
 el('securityContinue').addEventListener('click',()=>closeCheckpoint('securityPanel',30));
 el('policeContinue').addEventListener('click',()=>closeCheckpoint('policePanel',35));
 el('phoneButton').addEventListener('click',()=>{
   if (phoneOpen || !['driving','arrived','handoff'].includes(phase)) return;
   phoneOpen = true;
   clearControls();
   el('phonePanel').hidden = false;
 });
 el('phoneClose').addEventListener('click',()=>{phoneOpen=false;el('phonePanel').hidden=true;});
 function customerReply(text) {
   const m = text.toLocaleLowerCase('tr-TR').replace(/[.!?]+$/,'').trim();
   if (/^(al|al şunu|hadi al|çabuk al|al işte)$/.test(m) || /(?:terbiyesiz|aptal|salak|defol|sus artık)/.test(m)) return 'Bu üslubu kabul etmiyorum. Sizi şikâyet edeceğim.';
   if (/yanlış|eksik|dökül|hasar/.test(m)) return 'Teslim ederken paketi birlikte kontrol edelim.';
   if (/kaza|devril/.test(m)) return 'Önce iyi olduğunuzdan emin olun. Sipariş biraz bekleyebilir.';
   if (/özür|kusura bakma/.test(m)) return 'Sorun değil. Geldiğinizde haber verin.';
   if (/evde mis[ıi]n|evde misiniz|evde mısın/.test(m)) return 'Şu anda marketin girişindeyim.';
   if (/kaçıncı kat|hangi kat|kat kaç/.test(m)) return 'Zemin kattayım. Markete girdiğinizde beni karşıda göreceksiniz.';
   if (/naber|nasılsın|nasılsınız|iyi misin|iyi misiniz/.test(m)) return 'İyiyim, teşekkürler. Yol nasıl, trafik var mı?';
   if (/kapıya bırak|kapıda bırak/.test(m)) return 'Mümkünse marketin girişinde elden alayım.';
   if (/geldim|ulaştım|vardım/.test(m)) return 'Sizi gördüm, paketi marketin girişinde alacağım.';
   if (/nerede|adres|konum|nasıl bul|hangi bina/.test(m)) return 'Teslimat noktasındaki Süper Market’in cam girişinin önündeyim.';
   if (/kaç dakika|ne zaman|ne kadar/.test(m)) return 'Market kapanmadan gelirseniz girişte bekliyor olacağım.';
   if (/gecik|geç kal|trafik/.test(m)) return 'Tamam, ben girişte beklerim. Acele etmeyin.';
   if (/kapı|zil|aşağı|giriş/.test(m)) return 'Tamam, giriş kapısında olacağım.';
   if (/iptal/.test(m)) return 'İptali ancak market onaylayabilir. Marketle görüşebilir misiniz?';
   if (/teşekkür|sağ ol/.test(m)) return 'Rica ederim, iyi çalışmalar.';
   if (/merhaba|selam|iyi günler|günaydın/.test(m)) return 'Merhaba! Teslimat için marketin girişindeyim.';
   if (/kola|poşet|paket|sipariş|yemek/.test(m)) return 'Paketi teslim alırken kontrol edeceğim. Teşekkürler.';
   return null;
 }
 function appendMessage(text,direction) {
   const bubble = document.createElement('p');
   bubble.className = 'bubble '+direction;
   bubble.textContent = text;
   el('conversation').appendChild(bubble);
 }
 el('messageForm').addEventListener('submit',event=>{
   event.preventDefault();
   const text = el('messageInput').value.trim();
   if (!text) return;
   appendMessage(text,'sent');
   const reply = customerReply(text);
   if (reply) {
     appendMessage(reply,'received');
     el('callStatus').textContent = '';
   } else {
     el('callStatus').textContent = 'Müşteri henüz yanıt vermedi.';
   }
   el('messageInput').value = '';
   el('conversation').scrollTop = el('conversation').scrollHeight;
 });
 el('callMarket').addEventListener('click',()=>{el('callStatus').textContent='Market: Sipariş teslimat noktasında elden alınacak.';});
 el('callPolice')?.addEventListener('click',()=>{
   el('callStatus').textContent = pursuitTime > 0
     ? 'Oyun içi polis: Devriye takipte. Bu bir oyun araması.'
     : 'Oyun içi polis: Bildirimin alındı. Bu bir oyun araması.';
 });

 function moveTraffic(dt,now,previousZ,previousX,previousY) {
   let hit = null;
   for (const other of traffic) {
     if (other.retired) continue;
     const { mesh, lane, direction } = other;
     const oldZ = mesh.position.z;
     mesh.position.z -= other.speed*direction*dt;
     if (direction < 0 && mesh.position.z > player.position.z+35) mesh.position.z = player.position.z-420-25*Math.abs(lane);
     const wrapped = Math.abs(oldZ-mesh.position.z) > 60;
     mesh.position.x = roadCenter(mesh.position.z)+lane;
     mesh.rotation.y = roadHeading(mesh.position.z) + (direction < 0 ? Math.PI : 0);
     if (wrapped) continue;
     const oldGap = previousZ-oldZ, gap = player.position.z-mesh.position.z;
     const crossing = oldGap > 0 && gap <= 0;
     const swept = (oldGap > 0 && gap <= 0) || (oldGap < 0 && gap >= 0);
     const interpolation = swept ? oldGap/(oldGap-gap) : 1;
     const dx = Math.abs(THREE.MathUtils.lerp(previousX,player.position.x,interpolation)-mesh.position.x);
     const clearance = THREE.MathUtils.lerp(previousY,jumpHeight,interpolation);
     if (crossing && now >= nextPass && dx < 8) {
       nextPass = now+1100;
       soundSweep(125,53,.5,.073,'triangle');
     }
     if (challenge && jumpCount < 5 && crossing && clearance >= 1.53 && dx < 1.05 && !other.isMotor && !other.isPolice && !clearedCars.has(other)) {
       clearedCars.add(other);
       jumpCount++;
       updateObjective();
     }
     if (!hit && recoveryTime <= 0 && clearance < 1.53 && dx < (vehicle === 'motor' ? 1.18 : 1.6) &&
       (swept || Math.abs(gap) < (vehicle === 'motor' ? 2.5 : 3.75))) hit = other;
   }
   return hit;
 }
 function updatePursuit(dt,now) {
   if (pursuitTime <= 0) return;
   pursuitTime = Math.max(0,pursuitTime-dt);
   const offsetZ = player.position.z+8+pursuitTime*.20;
   const pursuitLane = lateral < 4 ? 6 : 2;
   patrol.mesh.position.set(roadCenter(offsetZ)+pursuitLane,0,offsetZ);
   patrol.mesh.rotation.y = roadHeading(offsetZ);
   const pulse = Math.floor(now/130)%2;
   sirenRed.emissiveIntensity = pursuitTime>0 && pulse ? 4 : 0;
   sirenBlue.emissiveIntensity = pursuitTime>0 && !pulse ? 4 : 0;
   patrol.mesh.visible = pursuitTime > 0;
   if (!pursuitTime) updateObjective();
 }
 function updateDriving(dt,now) {
   growCity(distance);
   recoveryTime = Math.max(0,recoveryTime-dt);
   const left = keys.arrowleft || keys.a || controls.left, right = keys.arrowright || keys.d || controls.right;
   const gas = keys.arrowup || keys.w || controls.accelerate, brake = keys.arrowdown || keys.s || controls.brake;
   if (brake || gas) {
     speed = THREE.MathUtils.clamp(speed+(brake?-45:22)*dt,0,maxSpeed);
     targetSpeed = speed;
     speedAdjusted = false;
     el('speedTarget').textContent = Math.round(targetSpeed);
   } else {
     const change = THREE.MathUtils.clamp(targetSpeed-speed,-14*dt,10*dt);
     speed = THREE.MathUtils.clamp(speed+change,0,maxSpeed);
   }
   if (keys.shift || controls.boost) speed = vehicle==='araba' ? 3000 : maxSpeed;
   const steer = Number(!!right)-Number(!!left);
   if (chosenFork && distance>chosenFork.start+190) chosenFork = null;
   if (!chosenFork && steer) {
     const entry = junctions.find(value => distance>=value && distance<value+24);
     if (entry!==undefined && Math.abs(lateral)>2 && Math.sign(lateral)===steer) {
       chosenFork = {start:entry,side:steer};
       lateral = steer*1.5;
     }
   }
   const raised = vehicle==='motor' && (keys.v || controls.wheelie) && speed>13 && !jumpHeight;
   wheelie = THREE.MathUtils.lerp(wheelie, raised ? .33 : 0, Math.min(1,dt*7));
   el('scene').dataset.wheelie = raised ? 'on' : 'off';
   el('steeringWheel').style.transform = 'rotate('+(steer*45)+'deg)';
   el('motorCockpit').style.transform = 'rotate('+(steer*3)+'deg) translateY('+(wheelie*38)+'%)';
   el('carCockpit').style.transform = 'rotate('+(steer*1.5)+'deg)';
   lateral = THREE.MathUtils.clamp(lateral+steer*(1.8+Math.min(speed,130)/30)*dt,-7.05,7.05);
   const {z:previousZ,x:previousX,y:previousY} = player.position;
   distance = Math.min(roadLength,distance+speed/3.6*dt);
   if (jumpVelocity || jumpHeight) {
     jumpHeight = Math.max(0,jumpHeight+jumpVelocity*dt);
     jumpVelocity -= 15*dt;
     if (!jumpHeight) jumpVelocity = airRotation = 0;
     else airRotation += steer*dt*2.4;
   }
   placePlayer(steer);
   const hit = moveTraffic(dt,now,previousZ,previousX,previousY);
   if (hit) { crash(hit); return; }
   updatePursuit(dt,now);
   if (!policeChecked && distance>=1240 && pursuitTime<=0) {
     policeChecked = true;
     speed = targetSpeed = 0;
     clearControls();
     phoneOpen = true;
     el('policePanel').hidden = false;
   } else if (!securityChecked && distance>=2860) {
     securityChecked = true;
     speed = targetSpeed = 0;
     clearControls();
     phoneOpen = true;
     el('securityPanel').hidden = false;
   } else if (distance>=roadLength) {
     arrive();
   }
   if (distance>=2050) loadAirportAssets();
   if (!airportAnnounced && distance>=2910) {
     airportAnnounced = true;
     el('airportNotice').hidden = false;
     setTimeout(()=>{el('airportNotice').hidden=true;},5000);
   }
   updateReadouts();
 }

 function animate(now) {
   requestAnimationFrame(animate);
   const dt = Math.min((now-(last||now))/1000,.05);
   last = now;
   if (flyingPlane) flyingPlane.position.x = Math.sin(now*.00018)*30;
   for (const w of walkers) {
     const step = now*.002+w.phase;
     w.legs[0].rotation.x = Math.sin(step)*.48;
     w.legs[1].rotation.x = -Math.sin(step)*.48;
     w.g.position.z = w.base+Math.sin(now*.00018+w.phase)*6;
     w.g.position.x = roadCenter(w.g.position.z)+w.side*11.1;
   }
   for (const p of pedestrianMixers) {
     if (Math.abs(p.walker.g.position.z-player.position.z)<120) p.mixer.update(dt);
   }
   signalRed.emissiveIntensity = Math.floor(now/10000)%2 ? 1.1 : .2;
   signalGreen.emissiveIntensity = Math.floor(now/10000)%2 ? .2 : 1.1;
   waterTexture.offset.set((now*.000012)%1,(now*.000018)%1);
   if (phase === 'driving' && !phoneOpen) updateDriving(dt,now);
   if (!phoneOpen) updateHandoff(dt,now);
   roadDistrict?.update(distance,now);
   updateAudio(now);
   playerShadow.position.x = player.position.x;
   playerShadow.position.z = player.position.z;
   playerShadow.rotation.z = -player.rotation.y;
   playerShadow.material.opacity = Math.max(.2,1-jumpHeight*.28);
   const boosting = phase === 'driving' && !phoneOpen && !!(keys.shift || controls.boost);
   exhaustFlames.visible = boosting;
   el('scene').dataset.turbo = boosting ? 'on' : 'off';
   if (boosting) {
     exhaustFlames.position.copy(player.position);
     exhaustFlames.rotation.copy(player.rotation);
     flamePieces.forEach((nozzle,index)=>nozzle.scale.setScalar(.8+Math.abs(Math.sin(now*.02+index))*.35));
   }
   const outside = cameraMode === 0;
   const height = outside ? (vehicle==='motor'?2.8:5.5) : (vehicle==='motor' ? (cameraMode===2?2.12:1.55) : (cameraMode===2?1.7:2.05));
   const offset = outside ? (pursuitTime > 0 ? 17 : vehicle==='motor' ? 5.2 : 12) : (vehicle==='motor' ? (cameraMode===2?-.05:-.9) : -1.4);
   if (phase === 'arrived' || phase === 'handoff' || phase === 'finished') {
     cameraTarget.set(player.position.x-2,3.25,player.position.z+7.5);
     camera.position.lerp(cameraTarget,.10);
     camera.lookAt((player.position.x+customer.position.x)/2,1.2,customer.position.z);
   } else {
     cameraTarget.set(player.position.x,height+jumpHeight*.67,player.position.z+offset);
     camera.position.lerp(cameraTarget,outside?.09:.35);
     camera.lookAt(roadCenter(player.position.z-25)+routeOffset(distance+25)+lateral,outside?1.1:height-.15+wheelie*3,player.position.z-25);
   }
   renderer.render(scene,camera);
 }
 reset();
 requestAnimationFrame(animate);
 addEventListener('resize',()=>{
   camera.aspect=innerWidth/innerHeight;
   camera.updateProjectionMatrix();
   renderer.setSize(innerWidth,innerHeight);
 });
})();
