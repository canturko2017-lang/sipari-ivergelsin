'use strict';
const $=id=>document.getElementById(id);
const services=[
 {id:'Hemen',logo:'logo-hemen.png',emoji:'🛵',art:'motor',time:'15–20 dk',desc:'Günlük market ihtiyaçların'},
 {id:'Sanal Market',logo:'logo-sanal.png',emoji:'🚚',art:'van',time:'45 dk',desc:'Market alışverişin'},
 {id:'Elektronik',logo:'logo-extra.png',emoji:'🛴',art:'photo',image:'rx4.jpg',time:'Örnek',desc:'Scooter, motor ve teknoloji'},
 {id:'Yemek',logo:'logo-yemek.png',emoji:'🍕',art:'emoji',time:'20–45 dk',desc:'Pizza ve lezzetli menüler'},
 {id:'Macro Online',logo:'logo-macro.png',emoji:'🥗',art:'emoji',time:'45 dk',desc:'Özel lezzetleri keşfet'},
 {id:'Mion',logo:'logo-mion.png',emoji:'🧴',art:'emoji',time:'45 dk',desc:'Bakım ve kişisel ürünler'},
 {id:'Petimo',logo:'logo-petimo.png',emoji:'🐶',art:'emoji',time:'45 dk',desc:'Kedi ve köpek dostların için'},
 {id:'Taze Direkt',logo:'logo-taze.png',emoji:'🥬',art:'emoji',time:'45 dk',desc:'Meyve, sebze ve taze ürünler'}
];
let activeService='Sanal Market',category='Tümü',searchTerm='',cart={},orders=[];
try{orders=JSON.parse(localStorage.getItem('siparis-demo-orders')||'[]');if(!Array.isArray(orders))orders=[]}catch(e){orders=[]}
const money=n=>'₺'+Number(n).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2});
const byId=id=>products.find(p=>p.id===Number(id));
const cartCount=()=>Object.values(cart).reduce((a,b)=>a+b,0);
const normalize=s=>s.toLocaleLowerCase('tr-TR').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i');
function isElectronic(p){return ['Elektronik','Kask'].includes(p.category)||/scooter|schooter|motosiklet|motor kask|bisiklet kask/i.test(p.name+' '+(p.keywords||''))}
function eligible(p,service){
 if(service==='Elektronik')return isElectronic(p);
 if(service==='Yemek')return p.category==='Yemek';
 if(service==='Petimo')return p.category==='Evcil Hayvan';
 if(service==='Mion')return p.category==='Kişisel Bakım';
 if(service==='Taze Direkt')return ['Meyve & Sebze','Süt & Kahvaltılık','Et & Balık'].includes(p.category);
 if(service==='Macro Online')return ['Meyve & Sebze','Süt & Kahvaltılık','Et & Balık','Dondurma','Çikolata & Atıştırmalık','Gıda','İçecek','Atıştırmalık','Fırın'].includes(p.category);
 return !isElectronic(p)&&!['Yemek','Evcil Hayvan','Kask','Spor','Çanta'].includes(p.category);
}
function productCard(p){const pic=p.image?`<img src="assets/${p.image}" alt="${p.name}" loading="eager">`:'<span>Görsel bulunamadı</span>';return `<article class="product"><div class="pic">${pic}</div><h3>${p.name}</h3><span class="unit">${p.unit}</span><div class="price">${money(p.price)}</div></article>`}
function renderServices(){$('serviceGrid').innerHTML=services.map(s=>`<button class="service" data-open="${s.id}" aria-label="${s.id} bölümünü aç">${s.art==='motor'||s.art==='van'?`<span class="service-art ${s.art}"></span>`:(['Elektronik','Yemek','Petimo'].includes(s.id)?`<span class="service-art service-wordmark">${s.id}</span>`:`<span class="service-art service-logo"><img src="assets/${s.logo}" alt=""></span>` )}${s.time!=='Örnek'?`<span class="service-time">${s.time}*</span>`:''}<strong>${s.id}</strong><small>${s.desc}</small></button>`).join('')}
function renderHome(){renderServices();const m=new Date().getMonth()+1;const season=m===12||m<=2?'Kış':m<=5?'İlkbahar':m<=8?'Yaz':'Sonbahar';$('seasonBanner').innerHTML=`<strong>${season} için seçtiklerimiz 🍊</strong><small>Mevsim önerisi: meyve ve sebzeleri Taze Direkt bölümünde keşfet.</small>`;const seasonalIds=season==='Kış'?[13,3,41]:season==='İlkbahar'?[4,405,419]:season==='Yaz'?[4,419,1]:[13,3,41];$('homeProducts').innerHTML=products.filter(p=>[...seasonalIds,12,19,305,5,400,405,7,18,408].includes(p.id)).map(productCard).join('')}
function showPage(name){['home','shop','cart','orders','account','campaign'].forEach(x=>$(x+'View').hidden=x!==name);document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.dataset.page===(name==='shop'?'categories':name)));if(name==='cart')renderCart();if(name==='orders')renderOrders();window.scrollTo({top:0,behavior:'smooth'})}
function openService(name){const s=services.find(x=>x.id===name)||services[1];activeService=s.id;category='Tümü';searchTerm='';$('searchInput').value='';renderShop();showPage('shop')}
function renderShop(){const svc=services.find(x=>x.id===activeService);$('shopTitle').textContent=svc.id;$('shopDesc').textContent=svc.desc;$('shopTime').textContent=svc.time==='Örnek'?'':svc.time;const pool=products.filter(p=>eligible(p,activeService));const available=['Tümü',...new Set(pool.map(p=>p.category))];if(!available.includes(category))category='Tümü';$('categorySelect').innerHTML=available.map(x=>`<option value="${x}" ${x===category?'selected':''}>${x==='Tümü'?'Tüm kategoriler':x}</option>`).join('');const result=pool.filter(p=>(category==='Tümü'||p.category===category)&&normalize(p.name+' '+p.category+' '+(p.keywords||'')).includes(normalize(searchTerm)));$('resultCount').textContent=result.length+' ürün';$('products').innerHTML=result.length?result.map(productCard).join(''):'<div class="empty"><p>Bu bölümde böyle bir ürün bulamadım. Başka bir şey aramayı deneyebilirsin.</p></div>'}
let toastTimer;function toast(text){$('toast').textContent=text;$('toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('show'),2400)}
function add(id){id=Number(id);if(!byId(id))return;if((cart[id]||0)>=8){toast('Bu üründen en fazla 8 adet seçebilirsin.');return}cart[id]=(cart[id]||0)+1;renderCount();toast('Sepete eklendi 🛒')}
function change(id,n){id=Number(id);if(n>0&&(cart[id]||0)>=8){$('cartMessage').textContent='Bu üründen en fazla 8 adet seçebilirsin.';return}cart[id]=(cart[id]||0)+n;if(cart[id]<=0)delete cart[id];$('cartMessage').textContent='';renderCount();renderCart()}
function renderCount(){$('navCount').textContent=cartCount()}
function renderCart(){const items=Object.keys(cart).map(byId).filter(Boolean);$('cartQty').textContent=cartCount()+' ürün';$('basket').innerHTML=items.length?items.map(p=>`<div class="basket-row">${p.image?`<img src="assets/${p.image}" alt="">`:''}<div class="basket-info">${p.name}<b>${money(p.price*cart[p.id])}</b></div><div class="counter"><button data-change="${p.id}" data-delta="-1" aria-label="${p.name} azalt">−</button><span>${cart[p.id]}</span><button data-change="${p.id}" data-delta="1" aria-label="${p.name} artır">+</button></div></div>`).join(''):'<div class="empty"><p>Sepetin henüz boş. Bir bölüm seçerek alışverişe başlayabilirsin.</p></div>';$('total').textContent=money(items.reduce((sum,p)=>sum+p.price*cart[p.id],0))}
function renderOrders(){$('ordersList').innerHTML=orders.length?orders.map(o=>`<div class="order-card"><h3>📦 Sipariş alındı</h3><p>${o.items.map(x=>`${x.quantity} × ${x.name}`).join('<br>')}</p><strong>${money(o.total)}</strong><p>Teslimat süresi: ${o.time}</p></div>`).join(''):'<div class="empty"><p>Henüz siparişin yok.</p></div>'}
function checkout(){location.href='teslimat.html?gorev=yeni&mod=kurye'}
document.addEventListener('click',e=>{const addButton=e.target.closest('[data-add]');if(addButton){add(addButton.dataset.add);return}const changeButton=e.target.closest('[data-change]');if(changeButton){change(changeButton.dataset.change,Number(changeButton.dataset.delta));return}const serviceButton=e.target.closest('[data-open]');if(serviceButton){openService(serviceButton.dataset.open);return}const navButton=e.target.closest('[data-page]');if(navButton){const page=navButton.dataset.page;if(page==='categories'){openService(activeService);$('categorySelect').focus()}else showPage(page)}});
$('homeLogo').addEventListener('click',()=>showPage('home'));$('backHome').addEventListener('click',()=>showPage('home'));$('ordersTop').addEventListener('click',()=>showPage('orders'));$('accountTop').addEventListener('click',()=>showPage('account'));$('viewOrders').addEventListener('click',()=>showPage('orders'));$('checkout').addEventListener('click',checkout);$('categorySelect').addEventListener('change',e=>{category=e.target.value;renderShop()});$('searchForm').addEventListener('submit',e=>{e.preventDefault();searchTerm=$('searchInput').value.trim();category='Tümü';if($('shopView').hidden)activeService='Sanal Market';renderShop();showPage('shop')});renderHome();renderCount();if('serviceWorker' in navigator&&location.protocol!=='file:')window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
