let products=[], filterCat='Todos', filterQ='', editId=null, delId=null;

const API={
  async req(method,path,body){
    const opts={method,headers:{'Content-Type':'application/json'},credentials:'include'};
    if(body)opts.body=JSON.stringify(body);
    const res=await fetch('/api'+path,opts);
    const data=await res.json();
    if(!data.ok)throw new Error(data.msg||'Error');
    return data;
  },
  get:p=>API.req('GET',p),
  post:(p,b)=>API.req('POST',p,b),
  put:(p,b)=>API.req('PUT',p,b),
  del:p=>API.req('DELETE',p),
};

const Auth={
  get user(){try{return JSON.parse(localStorage.getItem('fp_user'));}catch{return null;}},
  set user(u){u?localStorage.setItem('fp_user',JSON.stringify(u)):localStorage.removeItem('fp_user');},
  logout(){this.user=null;localStorage.removeItem('fp_token');}
};

const Cart={
  get items(){try{return JSON.parse(localStorage.getItem('fp_cart')||'[]');}catch{return[];}},
  save(i){localStorage.setItem('fp_cart',JSON.stringify(i));},
  count(){return this.items.reduce((s,i)=>s+i.qty,0);},
  add(p){const items=this.items;const ex=items.find(i=>i.id===p.id);if(ex){if(ex.qty>=p.stock)return false;ex.qty++;}else{items.push({...p,qty:1});}this.save(items);return true;},
  remove(id){this.save(this.items.filter(i=>i.id!==id));},
  changeQty(id,delta,stock){const items=this.items;const item=items.find(i=>i.id===id);if(!item)return;item.qty+=delta;if(item.qty<=0){this.save(items.filter(i=>i.id!==id));return;}if(item.qty>stock)item.qty=stock;this.save(items);},
  clear(){localStorage.removeItem('fp_cart');}
};

function go(page){
  document.querySelectorAll('.page').forEach(p=>{p.classList.remove('active');p.style.display='none';});
  const target=document.getElementById('page-'+page);
  target.classList.add('active');
  const flexPages=['login','registro','success'];
  target.style.display=flexPages.includes(page)?'flex':'block';
  const navbar=document.getElementById('navbar');
  if(page==='login'||page==='registro'){navbar.style.display='none';const ft=document.getElementById('main-footer');if(ft)ft.style.display='none';}
  else{navbar.style.display='flex';const ft=document.getElementById('main-footer');if(ft)ft.style.display='block';renderNav(page);}
  if(page==='catalogo')loadProducts();
  if(page==='carrito')renderCart();
  if(page==='admin')loadAdmin();
  if(page==='mispedidos')loadMisPedidos();
  if(page==='perfil')loadPerfil();
  if(page==='favoritos')loadFavoritos();
  if(page==='success')document.getElementById('order-n').textContent=Math.floor(Math.random()*90000+10000);
  window.scrollTo(0,0);
}

function renderNav(active){
  const user=Auth.user;const count=Cart.count();
  document.getElementById('nav-links').innerHTML=`
    <li><button onclick="go('catalogo')" class="${active==='catalogo'?'on':''}">Catálogo</button></li>
    <li><button onclick="go('carrito')" class="${active==='carrito'?'on':''}">
      Carrito ${count>0?`<span class="cart-badge">${count}</span>`:''}
    </button></li>
    ${user?`<li><button onclick="go('mispedidos')" class="${active==='mispedidos'?'on':''}">Mis Pedidos</button></li><li><button onclick="go('perfil')" class="${active==='perfil'?'on':''}">Mi Perfil</button></li>`:''}    <li><button onclick="go('favoritos')" class="${active==='favoritos'?'on':''}">♥ Favoritos</button></li>
    ${user&&user.rol==='admin'?`<li><button onclick="go('admin')" class="${active==='admin'?'on':''}">Admin</button></li>`:''}`;
  document.getElementById('nav-end').innerHTML=user
    ?`<div class="nav-user"><div class="nav-avatar">${user.nombre.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase()}</div><span>${user.nombre}</span>${user.rol==='admin'?'<span class="r-badge">Admin</span>':''}</div><button class="btn btn-ghost btn-sm" onclick="doLogout()">Cerrar sesión</button>`
    :`<button class="btn btn-ghost btn-sm" onclick="go('login')">Iniciar sesión</button>`;
}

function togglePwd(){const i=document.getElementById('l-pwd');i.type=i.type==='password'?'text':'password';}
function togglePwdReg(){const i=document.getElementById('r-pwd');i.type=i.type==='password'?'text':'password';}
function fill(e,p){document.getElementById('l-email').value=e;document.getElementById('l-pwd').value=p;}

async function doLogin(){
  const email=document.getElementById('l-email').value.trim();
  const pwd=document.getElementById('l-pwd').value;
  const btn=document.getElementById('login-btn');
  const errEl=document.getElementById('login-err');
  errEl.style.display='none';
  if(!email||!pwd){errEl.textContent='Ingresa correo y contraseña';errEl.style.display='block';return;}
  if(!/^[^@]+@[^@]+\.[^@]+$/.test(email)){errEl.textContent='Ingresa un correo válido';errEl.style.display='block';return;}
  btn.disabled=true;btn.textContent='Ingresando…';
  try{
    const data=await API.post('/auth/login',{email,password:pwd});
    Auth.user=data.user;localStorage.setItem('fp_token',data.token);
    document.getElementById('l-email').value='';document.getElementById('l-pwd').value='';
    go('catalogo');
  }catch(err){errEl.textContent=err.message||'Credenciales incorrectas';errEl.style.display='block';}
  finally{btn.disabled=false;btn.textContent='Ingresar';}
}

async function doLogout(){
  try{await API.post('/auth/logout');}catch{}
  Auth.logout();
  document.getElementById('l-email').value='';
  document.getElementById('l-pwd').value='';
  document.getElementById('login-err').style.display='none';
  go('login');
}

async function doRegister(){
  const nombre=document.getElementById('r-nombre').value.trim();
  const apellido=document.getElementById('r-apellido').value.trim();
  const contacto=document.getElementById('r-contacto').value.trim();
  const pwd=document.getElementById('r-pwd').value;
  const btn=document.getElementById('reg-btn');
  const errEl=document.getElementById('reg-err');
  errEl.style.display='none';
  if(!nombre||!apellido||!contacto||!pwd){errEl.textContent='Todos los campos son requeridos';errEl.style.display='block';return;}
  const esEmailVal=contacto.includes('@');
  if(esEmailVal && !/^[^@]+@[^@]+\.[^@]+$/.test(contacto)){errEl.textContent='Ingresa un correo válido';errEl.style.display='block';return;}
  if(!esEmailVal && !/^\d{7,15}$/.test(contacto)){errEl.textContent='Ingresa un teléfono válido (solo números)';errEl.style.display='block';return;}
  if(pwd.length<6){errEl.textContent='La contraseña debe tener mínimo 6 caracteres';errEl.style.display='block';return;}
  const esEmail=contacto.includes('@');
  const email=esEmail?contacto:contacto+'@telefono.fp';
  const nombreCompleto=nombre+' '+apellido;
  btn.disabled=true;btn.textContent='Creando cuenta…';
  try{
    await API.post('/auth/register',{nombre:nombreCompleto,email,password:pwd});
    const data=await API.post('/auth/login',{email,password:pwd});
    Auth.user=data.user;localStorage.setItem('fp_token',data.token);
    document.getElementById('r-nombre').value='';
    document.getElementById('r-apellido').value='';
    document.getElementById('r-contacto').value='';
    document.getElementById('r-pwd').value='';
    toast('✅ Bienvenida a Fashion Peak');
    go('catalogo');
  }catch(err){errEl.textContent=err.message||'Error al crear cuenta';errEl.style.display='block';}
  finally{btn.disabled=false;btn.textContent='Crear cuenta';}
}

document.addEventListener('keydown',e=>{
  if(e.key==='Enter'){
    if(document.getElementById('page-login').classList.contains('active'))doLogin();
    if(document.getElementById('page-registro').classList.contains('active'))doRegister();
  }
});

async function loadProducts(){
  const grid=document.getElementById('prod-grid');
  grid.innerHTML=Array(8).fill(0).map(()=>'<div class="skel-card"><div class="skel-thumb skeleton"></div><div class="skel-body"><div class="skel-line w80 skeleton"></div><div class="skel-line w50 skeleton"></div><div class="skel-line w100 skeleton"></div></div></div>').join('');
  try{
    const data=await API.get('/productos');
    products=data.data;
    document.getElementById('hs-total').textContent=products.length;
    renderProducts();
  }catch(err){grid.innerHTML=`<div class="empty"><span class="ei">❌</span><h3>Error</h3><p>${err.message}</p></div>`;}
}

function filtered(){
  return products.filter(p=>{
    const mc=filterCat==='Todos'||p.categoria===filterCat;
    const mq=p.nombre.toLowerCase().includes(filterQ.toLowerCase());
    return mc&&mq;
  });
}

function renderProducts(){
  const list=filtered();
  const grid=document.getElementById('prod-grid');
  document.getElementById('cat-count').textContent=list.length+' producto(s)';
  if(!list.length){grid.innerHTML='<div class="empty"><span class="ei">🔍</span><h3>Sin resultados</h3><p>Intenta con otra búsqueda.</p></div>';return;}
  grid.innerHTML=list.map(p=>{
    const dotClass=p.stock<=0?'dot-out':p.stock<=5?'dot-low':'dot-ok';
    const dotTxt=p.stock<=0?'Agotado':p.stock<=5?`Últimas ${p.stock} uds`:`${p.stock} disponibles`;
    const favs=getFavs();
    const isFav=favs.includes(p.id);
    return `<div class="prod-card">
      <span class="card-ribbon ribbon-${p.categoria.toLowerCase()}">${p.categoria}</span>
      <button class="card-wish ${isFav?'fav-on':''}" onclick="toggleFav(${p.id},this)" title="${isFav?'Quitar de favoritos':'Agregar a favoritos'}">${isFav?'♥':'♡'}</button>
      <div class="card-thumb">${p.emoji||'👕'}</div>
      <div class="card-body">
        <p class="card-name">${p.nombre}</p>
        <p class="card-desc">${p.descripcion||''}</p>
        <p class="card-price">$${Number(p.precio).toLocaleString('es-CO')}</p>
        <div class="card-stock-row"><span class="stock-dot ${dotClass}"></span><span class="stock-txt">${dotTxt}</span></div>
        <button class="btn-cart" onclick="addToCart(${p.id})" ${p.stock<=0?'disabled':''}>
          ${p.stock<=0?'Agotado':'🛒 Agregar al carrito'}
        </button>
      </div>
    </div>`;
  }).join('');
}

function setFilter(btn){document.querySelectorAll('.pill').forEach(b=>b.classList.remove('on'));btn.classList.add('on');filterCat=btn.dataset.cat;renderProducts();}
function setQ(v){filterQ=v;renderProducts();}
function addToCart(id){const p=products.find(x=>x.id===id);if(!p)return;if(Cart.add(p)){toast('✅ '+p.nombre+' agregado');renderNav('catalogo');}else{toast('⚠️ Stock máximo','err');}}

function renderCart(){
  const items=Cart.items;const body=document.getElementById('cart-body');renderNav('carrito');
  if(!items.length){body.innerHTML=`<div class="empty" style="padding:80px 20px;"><span class="ei">🛒</span><h3>Tu carrito está vacío</h3><p>Explora el catálogo.</p><button class="btn btn-red" style="margin-top:4px;" onclick="go('catalogo')">Ver catálogo</button></div>`;return;}
  const sub=items.reduce((s,i)=>s+Number(i.precio)*i.qty,0);
  const ship=sub>=200000?0:12000;const total=sub+ship;const qty=items.reduce((s,i)=>s+i.qty,0);
  body.innerHTML=`<div class="cart-layout">
    <div class="cart-list">${items.map(item=>`
      <div class="cart-row">
        <div class="c-thumb">${item.emoji||'👕'}</div>
        <div class="c-info"><p class="c-name">${item.nombre}</p><p class="c-cat">${item.categoria}</p><p class="c-unit">$${Number(item.precio).toLocaleString('es-CO')} c/u</p></div>
        <div class="qty-grp"><button class="qty-btn" onclick="cQty(${item.id},-1,${item.stock})">−</button><span class="qty-n">${item.qty}</span><button class="qty-btn" onclick="cQty(${item.id},1,${item.stock})">+</button></div>
        <span class="c-total">$${(Number(item.precio)*item.qty).toLocaleString('es-CO')}</span>
        <button class="btn btn-icon" onclick="removeItem(${item.id})">🗑</button>
      </div>`).join('')}
    </div>
    <div class="summary">
      <p class="sum-title">Resumen del pedido</p>
      <div class="sum-row"><span class="lbl">Subtotal (${qty} art.)</span><span class="val">$${sub.toLocaleString('es-CO')}</span></div>
      <div class="sum-row"><span class="lbl">Descuentos</span><span class="val" style="color:var(--success)">$0</span></div>
      <div class="sum-row"><span class="lbl">Envío</span><span class="val">${ship===0?'<span style="color:var(--success)">Gratis 🎉</span>':'$'+ship.toLocaleString('es-CO')}</span></div>
      ${ship>0?`<div style="background:var(--red-pale);border-radius:7px;padding:8px 11px;margin:6px 0;font-size:11.5px;color:var(--red);border-left:3px solid var(--red);">Agrega $${(200000-sub).toLocaleString('es-CO')} más para envío gratis</div>`:''}
      <div class="sum-total"><span class="lbl">Total</span><span class="val">$${total.toLocaleString('es-CO')}</span></div>
      <div style="margin-top:16px;">
        <p style="font-size:10px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--g500);margin-bottom:10px;">Método de pago</p>
        <div class="pay-methods">
          <button class="pay-method on" onclick="selectPay(this,'visa')">💳 VISA / Mastercard</button>
          <button class="pay-method" onclick="selectPay(this,'nequi')">📱 Nequi</button>
          <button class="pay-method" onclick="selectPay(this,'pse')">🏦 PSE</button>
          <button class="pay-method" onclick="selectPay(this,'paypal')">🅿️ PayPal</button>
        </div>
        <div id="pay-form-visa" class="pay-form">
          <div style="margin-bottom:10px;">
            <label class="form-label">Número de tarjeta</label>
            <input type="text" id="card-num" class="form-input" placeholder="1234 5678 9012 3456" maxlength="19" oninput="fmtCard(this)">
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div><label class="form-label">Vencimiento</label><input type="text" id="card-exp" class="form-input" placeholder="MM/AA" maxlength="5" oninput="fmtExp(this)"></div>
            <div><label class="form-label">CVV</label><input type="text" id="card-cvv" class="form-input" placeholder="123" maxlength="3"></div>
          </div>
          <div><label class="form-label">Nombre en la tarjeta</label><input type="text" id="card-name" class="form-input" placeholder="Como aparece en la tarjeta"></div>
        </div>
        <div id="pay-form-nequi" class="pay-form" style="display:none;">
          <div><label class="form-label">Número de celular Nequi</label><input type="text" id="nequi-tel" class="form-input" placeholder="300 000 0000" maxlength="10"></div>
          <div style="background:rgba(232,41,74,0.06);border-radius:8px;padding:10px 12px;margin-top:8px;font-size:12px;color:var(--g500);">📲 Recibirás una notificación en tu app Nequi para aprobar el pago.</div>
        </div>
        <div id="pay-form-pse" class="pay-form" style="display:none;">
          <div><label class="form-label">Banco</label>
            <select id="pse-banco" class="form-input">
              <option value="">Selecciona tu banco</option>
              <option>Bancolombia</option><option>Davivienda</option><option>BBVA</option>
              <option>Banco de Bogotá</option><option>Colpatria</option><option>Banco Popular</option>
            </select>
          </div>
          <div><label class="form-label">Tipo de persona</label>
            <select id="pse-tipo" class="form-input"><option>Natural</option><option>Jurídica</option></select>
          </div>
        </div>
        <div id="pay-form-paypal" class="pay-form" style="display:none;">
          <div><label class="form-label">Correo PayPal</label><input type="email" id="paypal-email" class="form-input" placeholder="correo@paypal.com"></div>
          <div style="background:rgba(0,48,135,0.06);border-radius:8px;padding:10px 12px;margin-top:8px;font-size:12px;color:var(--g500);">🅿️ Serás redirigido a PayPal para completar el pago de forma segura.</div>
        </div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">
        <button class="btn btn-red btn-lg btn-block" onclick="confirmBuy()">🔒 Pagar ahora</button>
        <button class="btn btn-light btn-block" onclick="clearCart()">🗑️ Vaciar carrito</button>
        <button class="btn btn-light btn-block" onclick="go('catalogo')">← Seguir comprando</button>
      </div>
    </div>
  </div>`;
}

function cQty(id,delta,stock){Cart.changeQty(id,delta,stock);renderCart();}
function removeItem(id){
  const item=Cart.items.find(i=>i.id===id);
  if(!item)return;
  document.getElementById('confirm-msg').textContent='¿Eliminar '+item.nombre+' del carrito?';
  document.getElementById('confirm-overlay').classList.add('open');
  document.getElementById('confirm-ok').onclick=()=>{
    Cart.remove(id);
    document.getElementById('confirm-overlay').classList.remove('open');
    toast('🗑️ Eliminado');
    renderCart();
  };
}
function clearCart(){Cart.clear();toast('🗑️ Carrito vaciado');renderCart();}

let selectedPay='visa';
function selectPay(btn, method){
  document.querySelectorAll('.pay-method').forEach(b=>b.classList.remove('on'));
  btn.classList.add('on');
  selectedPay=method;
  ['visa','nequi','pse','paypal'].forEach(m=>{
    const el=document.getElementById('pay-form-'+m);
    if(el)el.style.display=m===method?'block':'none';
  });
}
function fmtCard(el){
  let v=el.value.replace(/\D/g,'').substring(0,16);
  el.value=v.replace(/(\d{4})/g,'$1 ').trim();
}
function fmtExp(el){
  let v=el.value.replace(/\D/g,'');
  if(v.length>=2)v=v.substring(0,2)+'/'+v.substring(2,4);
  el.value=v;
}
function validatePay(){
  if(selectedPay==='visa'){
    const num=document.getElementById('card-num').value.replace(/\s/g,'');
    const exp=document.getElementById('card-exp').value;
    const cvv=document.getElementById('card-cvv').value;
    const name=document.getElementById('card-name').value.trim();
    if(num.length<16){toast('Número de tarjeta inválido','err');return false;}
    if(!/^\d{2}\/\d{2}$/.test(exp)){toast('Fecha de vencimiento inválida','err');return false;}
    if(cvv.length<3){toast('CVV inválido','err');return false;}
    if(!name){toast('Ingresa el nombre de la tarjeta','err');return false;}
  }
  if(selectedPay==='nequi'){
    const tel=document.getElementById('nequi-tel').value.replace(/\s/g,'');
    if(tel.length<10){toast('Número Nequi inválido','err');return false;}
  }
  if(selectedPay==='pse'){
    if(!document.getElementById('pse-banco').value){toast('Selecciona tu banco','err');return false;}
  }
  if(selectedPay==='paypal'){
    const email=document.getElementById('paypal-email').value.trim();
    if(!email||!email.includes('@')){toast('Correo PayPal inválido','err');return false;}
  }
  return true;
}
async function confirmBuy(){
  if(!Auth.user){toast('Inicia sesión para comprar','err');setTimeout(()=>go('login'),1500);return;}
  if(!validatePay())return;
  const btn=document.querySelector('#page-carrito .btn-red');
  if(btn){btn.disabled=true;btn.textContent='Procesando pago...';}
  await new Promise(r=>setTimeout(r,1800));
  const items=Cart.items.map(i=>({producto_id:i.id,cantidad:i.qty,precio_unit:Number(i.precio)}));
  try{
    await API.post('/pedidos',{items});
    Cart.clear();
    go('success');
  }catch(err){
    toast(err.message||'Error al procesar','err');
    if(btn){btn.disabled=false;btn.textContent='🔒 Pagar ahora';}
  }
}

function switchTab(tab, btn){
  document.querySelectorAll('.admin-tab').forEach(b=>b.classList.remove('on'));
  document.querySelectorAll('.admin-section').forEach(s=>s.classList.remove('on'));
  btn.classList.add('on');
  document.getElementById('tab-'+tab).classList.add('on');
  if(tab==='pedidos')loadPedidosAdmin();
}

async function loadMisPedidos(){
  if(!Auth.user){go('login');return;}
  const body=document.getElementById('mispedidos-body');
  body.innerHTML='<div class="loader"><div class="spin"></div> Cargando pedidos…</div>';
  try{
    const data=await API.get('/pedidos/mis-pedidos');
    if(!data.data.length){body.innerHTML='<div class="empty"><span class="ei">📦</span><h3>Sin pedidos aún</h3><p>Cuando hagas una compra aparecerá aquí.</p><button class="btn btn-red" onclick="go(\'catalogo\')">Ir al catálogo</button></div>';return;}
    const estadoEmoji={'pendiente':'⏳','confirmado':'✅','enviado':'🚚','entregado':'🎉','cancelado':'❌'};
    body.innerHTML=data.data.map((p,i)=>`
      <div class="pedido-card" style="animation-delay:${i*0.06}s">
        <div class="pedido-head">
          <div class="pedido-id">Orden <span>#FP-${p.id}</span></div>
          <div class="pedido-meta">
            <span class="chip est-${p.estado}">${estadoEmoji[p.estado]||''} ${p.estado.charAt(0).toUpperCase()+p.estado.slice(1)}</span>
            <span class="pedido-fecha">${new Date(p.created_at).toLocaleDateString('es-CO',{year:'numeric',month:'long',day:'numeric'})}</span>
          </div>
        </div>
        <div class="pedido-items-list">
          ${p.items.map(it=>`<div class="pedido-item"><span class="emoji">${it.emoji||'👕'}</span><div class="info"><div class="name">${it.nombre}</div><div class="qty">x${it.cantidad} — $${Number(it.precio_unit).toLocaleString('es-CO')}</div></div></div>`).join('')}
        </div>
        <div class="pedido-foot">
          <span style="font-size:12px;color:var(--g400)">${p.num_items} artículo(s)</span>
          <span class="pedido-total">$${Number(p.total).toLocaleString('es-CO')}</span>
        </div>
      </div>`).join('');
  }catch(err){body.innerHTML=`<div class="empty"><span class="ei">❌</span><h3>Error</h3><p>${err.message}</p></div>`;}
}

async function loadPedidosAdmin(){
  const tbody=document.getElementById('pedidos-tbody');
  tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:30px"><div class="loader" style="padding:10px;justify-content:center"><div class="spin"></div></div></td></tr>';
  try{
    const data=await API.get('/pedidos');
    document.getElementById('s-pedidos').textContent=data.data.length;
    if(!data.data.length){tbody.innerHTML='<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--g400)">No hay pedidos aún.</td></tr>';return;}
    const estadoOpts=['pendiente','confirmado','enviado','entregado','cancelado'];
    tbody.innerHTML=data.data.map(p=>`
      <tr>
        <td><span style="font-family:\'Cormorant Garamond\',serif;font-size:15px;font-weight:700;color:var(--red)">#FP-${p.id}</span></td>
        <td><div style="font-size:13px;font-weight:600">${p.cliente||'Invitado'}</div><div style="font-size:11px;color:var(--g400)">${p.email||''}</div></td>
        <td style="font-weight:600">${p.num_items}</td>
        <td class="price-cell">$${Number(p.total).toLocaleString('es-CO')}</td>
        <td>
          <select class="form-input" style="padding:5px 8px;font-size:11px;width:130px" onchange="cambiarEstado(${p.id},this.value)">
            ${estadoOpts.map(e=>`<option value="${e}" ${e===p.estado?'selected':''}>${e.charAt(0).toUpperCase()+e.slice(1)}</option>`).join('')}
          </select>
        </td>
        <td style="font-size:12px;color:var(--g400)">${new Date(p.created_at).toLocaleDateString('es-CO')}</td>
        <td><span class="chip est-${p.estado}">${p.estado}</span></td>
      </tr>`).join('');
  }catch(err){tbody.innerHTML=`<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--red)">${err.message}</td></tr>`;}
}

async function cambiarEstado(id,estado){
  try{await API.put('/pedidos/'+id+'/estado',{estado});toast('✅ Estado actualizado');}
  catch(err){toast(err.message,'err');}
}

function toggleF(id){const i=document.getElementById(id);i.type=i.type==='password'?'text':'password';}

function loadPerfil(){
  if(!Auth.user){go('login');return;}
  const u=Auth.user;
  const partes=u.nombre.split(' ');
  const nombre=partes[0]||'';
  const apellido=partes.slice(1).join(' ')||'';
  document.getElementById('p-nombre').value=nombre;
  document.getElementById('p-apellido').value=apellido;
  document.getElementById('p-email').value=u.email;
  document.getElementById('perfil-avatar').textContent=u.nombre.split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
  document.getElementById('perfil-nombre').textContent=u.nombre;
  document.getElementById('perfil-email').textContent=u.email;
  const rolEl=document.getElementById('perfil-rol');
  rolEl.textContent=u.rol==='admin'?'⚙️ Administrador':'🛍️ Cliente';
  rolEl.className='chip '+(u.rol==='admin'?'ch-h':'ch-ok');
  document.getElementById('perfil-err').style.display='none';
  document.getElementById('pwd-err').style.display='none';
  ['p-pwd-actual','p-pwd-nueva','p-pwd-conf'].forEach(id=>document.getElementById(id).value='');
}

async function guardarPerfil(){
  const nombre=document.getElementById('p-nombre').value.trim();
  const apellido=document.getElementById('p-apellido').value.trim();
  const email=document.getElementById('p-email').value.trim();
  const errEl=document.getElementById('perfil-err');
  const btn=document.getElementById('perfil-btn');
  errEl.style.display='none';
  if(!nombre||!email){errEl.textContent='Nombre y correo son requeridos';errEl.style.display='block';return;}
  if(!/^[^@]+@[^@]+\.[^@]+$/.test(email)){errEl.textContent='Ingresa un correo válido';errEl.style.display='block';return;}
  btn.disabled=true;btn.textContent='Guardando…';
  try{
    const nombreCompleto=apellido?nombre+' '+apellido:nombre;
    const data=await API.put('/auth/perfil',{nombre:nombreCompleto,email});
    Auth.user={...Auth.user,nombre:nombreCompleto,email};
    loadPerfil();
    renderNav('perfil');
    toast('✅ Perfil actualizado');
  }catch(err){errEl.textContent=err.message||'Error al guardar';errEl.style.display='block';}
  finally{btn.disabled=false;btn.textContent='Guardar cambios';}
}

async function cambiarPassword(){
  const actual=document.getElementById('p-pwd-actual').value;
  const nueva=document.getElementById('p-pwd-nueva').value;
  const conf=document.getElementById('p-pwd-conf').value;
  const errEl=document.getElementById('pwd-err');
  const btn=document.getElementById('pwd-btn');
  errEl.style.display='none';
  if(!actual||!nueva||!conf){errEl.textContent='Todos los campos son requeridos';errEl.style.display='block';return;}
  if(nueva.length<6){errEl.textContent='La nueva contraseña debe tener mínimo 6 caracteres';errEl.style.display='block';return;}
  if(nueva!==conf){errEl.textContent='Las contraseñas no coinciden';errEl.style.display='block';return;}
  btn.disabled=true;btn.textContent='Cambiando…';
  try{
    await API.put('/auth/password',{passwordActual:actual,passwordNueva:nueva});
    toast('✅ Contraseña actualizada');
    ['p-pwd-actual','p-pwd-nueva','p-pwd-conf'].forEach(id=>document.getElementById(id).value='');
  }catch(err){errEl.textContent=err.message||'Error al cambiar contraseña';errEl.style.display='block';}
  finally{btn.disabled=false;btn.textContent='Cambiar contraseña';}
}

async function loadAdmin(){
  if(!Auth.user||Auth.user.rol!=='admin'){go('login');return;}
  document.getElementById('admin-tbody').innerHTML='<tr><td colspan="6" style="text-align:center;padding:40px"><div class="loader" style="padding:20px;justify-content:center"><div class="spin"></div></div></td></tr>';
  try{
    const data=await API.get('/productos');products=data.data;
    document.getElementById('s-total').textContent=products.length;
    document.getElementById('s-mujer').textContent=products.filter(p=>p.categoria==='MUJER').length;
    document.getElementById('s-hombre').textContent=products.filter(p=>p.categoria==='HOMBRE').length;
    // s-stock removed
    renderAdminTable();
  }catch(err){toast(err.message,'err');}
}

function renderAdminTable(){
  if(!products.length){document.getElementById('admin-tbody').innerHTML='<tr><td colspan="6" style="text-align:center;padding:40px;color:var(--g400)">No hay productos.</td></tr>';return;}
  document.getElementById('admin-tbody').innerHTML=products.map(p=>`
    <tr>
      <td><div class="prod-cell"><span class="ico">${p.emoji||'👕'}</span><div><div class="nm">${p.nombre}</div>${p.descripcion?`<div class="ds">${p.descripcion.substring(0,36)}…</div>`:''}</div></div></td>
      <td><span class="chip ${p.categoria==='MUJER'?'ch-m':'ch-h'}">${p.categoria}</span></td>
      <td class="price-cell">$${Number(p.precio).toLocaleString('es-CO')}</td>
      <td style="font-weight:700;color:${p.stock<=0?'var(--red)':p.stock<=5?'var(--warning)':'var(--success)'}">${p.stock} uds</td>
      <td><span class="chip ${p.stock<=0?'ch-out':p.stock<=5?'ch-warn':'ch-ok'}">${p.stock<=0?'Agotado':p.stock<=5?'Bajo stock':'Disponible'}</span></td>
      <td><div class="act-row"><button class="btn btn-navy btn-sm" onclick="openEdit(${p.id})">✏️ Editar</button><button class="btn btn-icon" onclick="openDel(${p.id},'${p.nombre.replace(/'/g,"\\'")}')">🗑</button></div></td>
    </tr>`).join('');
}

function openAdd(){editId=null;document.getElementById('modal-ttl').textContent='Agregar producto';document.getElementById('save-btn').textContent='Guardar';['f-nom','f-des','f-pre','f-sto'].forEach(id=>document.getElementById(id).value='');document.getElementById('f-cat').value='MUJER';document.getElementById('f-emo').value='👕';document.getElementById('modal-err').style.display='none';document.getElementById('prod-modal').classList.add('open');}
function openEdit(id){const p=products.find(x=>x.id===id);if(!p)return;editId=id;document.getElementById('modal-ttl').textContent='Editar producto';document.getElementById('save-btn').textContent='Actualizar';document.getElementById('f-nom').value=p.nombre;document.getElementById('f-des').value=p.descripcion||'';document.getElementById('f-cat').value=p.categoria;document.getElementById('f-pre').value=p.precio;document.getElementById('f-sto').value=p.stock;document.getElementById('f-emo').value=p.emoji||'👕';document.getElementById('modal-err').style.display='none';document.getElementById('prod-modal').classList.add('open');}
function closeModal(){document.getElementById('prod-modal').classList.remove('open');}

async function saveProd(){
  const nombre=document.getElementById('f-nom').value.trim();
  const desc=document.getElementById('f-des').value.trim();
  const cat=document.getElementById('f-cat').value;
  const precio=Number(document.getElementById('f-pre').value);
  const stock=Number(document.getElementById('f-sto').value);
  const emoji=document.getElementById('f-emo').value;
  const errEl=document.getElementById('modal-err');const btn=document.getElementById('save-btn');
  if(!nombre){errEl.textContent='El nombre es requerido.';errEl.style.display='block';return;}
  if(!precio||precio<=0){errEl.textContent='El precio debe ser mayor a 0.';errEl.style.display='block';return;}
  if(isNaN(stock)||stock<0){errEl.textContent='El stock no puede ser negativo.';errEl.style.display='block';return;}
  btn.disabled=true;btn.textContent='Guardando…';
  try{
    if(editId){await API.put('/productos/'+editId,{nombre,descripcion:desc,categoria:cat,precio,stock,emoji});toast('✅ Producto actualizado');}
    else{await API.post('/productos',{nombre,descripcion:desc,categoria:cat,precio,stock,emoji});toast('✅ Producto creado');}
    closeModal();loadAdmin();
  }catch(err){errEl.textContent=err.message;errEl.style.display='block';}
  finally{btn.disabled=false;btn.textContent=editId?'Actualizar':'Guardar';}
}

function openDel(id,name){delId=id;document.getElementById('del-nm').textContent=name;document.getElementById('del-modal').classList.add('open');}
function closeDel(){document.getElementById('del-modal').classList.remove('open');}
async function confirmDel(){try{await API.del('/productos/'+delId);closeDel();toast('🗑️ Eliminado');loadAdmin();}catch(err){toast(err.message,'err');}}

function toast(msg,type='ok'){const el=document.getElementById('toast');el.textContent=msg;el.className='toast t-'+type+' show';clearTimeout(el._t);el._t=setTimeout(()=>el.classList.remove('show'),3000);}


// ── FAVORITOS ──
function getFavs(){try{return JSON.parse(localStorage.getItem('fp_favs')||'[]');}catch{return[];}}
function saveFavs(f){localStorage.setItem('fp_favs',JSON.stringify(f));}
function toggleFav(id, btn){
  const favs=getFavs();
  const idx=favs.indexOf(id);
  if(idx>=0){
    favs.splice(idx,1);
    btn.textContent='♡';
    btn.classList.remove('fav-on');
    toast('Eliminado de favoritos');
  } else {
    favs.push(id);
    btn.textContent='♥';
    btn.classList.add('fav-on');
    toast('♥ Agregado a favoritos');
  }
  saveFavs(favs);
}
function loadFavoritos(){
  const favs=getFavs();
  const grid=document.getElementById('favs-grid');
  if(!products.length){
    API.get('/productos').then(data=>{products=data.data;loadFavoritos();}).catch(()=>{});
    return;
  }
  const list=products.filter(p=>favs.includes(p.id));
  if(!list.length){
    grid.innerHTML='<div class="empty" style="grid-column:1/-1"><span class="ei">&#9825;</span><h3>Sin favoritos aun</h3><p>Toca el corazon en cualquier producto.</p></div>';
    return;
  }
  grid.innerHTML=list.map(p=>{
    const dotClass=p.stock<=0?'dot-out':p.stock<=5?'dot-low':'dot-ok';
    const dotTxt=p.stock<=0?'Agotado':p.stock<=5?`Últimas ${p.stock} uds`:`${p.stock} disponibles`;
    return `<div class="prod-card">
      <span class="card-ribbon ribbon-${p.categoria.toLowerCase()}">${p.categoria}</span>
      <button class="card-wish fav-on" onclick="toggleFav(${p.id},this);loadFavoritos();" title="Quitar de favoritos">♥</button>
      <div class="card-thumb">${p.emoji||'👕'}</div>
      <div class="card-body">
        <p class="card-name">${p.nombre}</p>
        <p class="card-desc">${p.descripcion||''}</p>
        <p class="card-price">$${Number(p.precio).toLocaleString('es-CO')}</p>
        <div class="card-stock-row"><span class="stock-dot ${dotClass}"></span><span class="stock-txt">${dotTxt}</span></div>
        <button class="btn-cart" onclick="addToCart(${p.id})" ${p.stock<=0?'disabled':''}>
          ${p.stock<=0?'Agotado':'🛒 Agregar al carrito'}
        </button>
      </div>
    </div>`;
  }).join('');
}

// INIT
const savedUser=Auth.user;
if(savedUser){go('catalogo');}else{go('login');}