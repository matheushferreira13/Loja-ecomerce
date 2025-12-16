// assets/js/products.js
// Modal + fetch + render + add product (suporta upload do computador -> base64) + localStorage

(function(){
  const LS_KEY = "myshop_products_v1";

  // util DOM ready
  function onDOM(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }

  // promisse helper para ler arquivo como dataURL
  function readFileAsDataURL(file){
    return new Promise((resolve, reject) => {
      if(!file) return resolve(null);
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = err => reject(err);
      reader.readAsDataURL(file);
    });
  }

  onDOM(function(){
    // elementos
    const productList = document.getElementById('productList');
    const productModal = document.getElementById('productModal');
    const backdrop = document.getElementById('productModalBackdrop');
    const openBtn = document.getElementById('openProductModal');
    const closeBtn = document.getElementById('closeProductModal');
    const cancelBtn = document.getElementById('cancelProduct');
    const form = document.getElementById('productForm');
    const fileInput = document.getElementById('productImageInput');
    const photoUrlInput = document.getElementById('photoUrl');

    // helpers LS
    function save(list){ try{ localStorage.setItem(LS_KEY, JSON.stringify(list)); } catch(e){ console.warn('LS save fail', e); } }
    function load(){ try{ const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; } catch(e){ return null; } }

    // modal handlers (usa classe 'show' — seu CSS já trata isso)
    function openModal(){
      if(!productModal) return;
      productModal.classList.add('show');
      productModal.setAttribute('aria-hidden','false');
      document.body.style.overflow='hidden';
      const first = productModal.querySelector('input, textarea, button');
      if(first) first.focus();
    }
    function closeModal(){
      if(!productModal) return;
      productModal.classList.remove('show');
      productModal.setAttribute('aria-hidden','true');
      document.body.style.overflow='auto';
    }

    if(openBtn) openBtn.addEventListener('click', openModal);
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    if(cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if(backdrop) backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

    // render (cada item com data-id único)
    function render(list){
      if(!productList) return;
      productList.innerHTML = '';
      if(!list || !list.length){
        productList.innerHTML = '<div style="padding:12px;border-radius:8px;background:var(--card);color:var(--muted)">Nenhum produto encontrado.</div>';
        return;
      }
      list.forEach(item => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = item._id || item.id || item.__id || item.uid || (item.title + '_' + (item.price||'') + '_' + Math.random());
        const imgSrc = item.thumbnail || item.image || item.photo || item.url || 'https://via.placeholder.com/300x180';
        card.innerHTML = `
          <button class="remove-x" data-id="${card.dataset.id}" title="Remover">✖</button>
          <img src="${imgSrc}" alt="${item.title || item.name || ''}">
          <h3>${item.title || item.name || 'Produto'}</h3>
          <div class="meta">${item.brand || ''} • ${item.category || ''}</div>
          <div class="price">R$ ${item.price || ''}</div>
        `;
        productList.appendChild(card);
      });

      // attach remove handlers
      productList.querySelectorAll('.remove-x').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          let arr = load() || [];
          arr = arr.filter(x => {
            const xid = x._id || x.id || x.__id || x.uid || (x.title + '_' + (x.price||'') + '_' + x._rand);
            return String(xid) !== String(id);
          });
          save(arr);
          render(arr);
        });
      });
    }

    // fetch initial (from local or from API)
    async function init(){
      const cached = load();
      if(cached && cached.length){
        render(cached);
        return;
      }
      // try fetch
      try{
        const res = await fetch('https://dummyjson.com/products');
        const data = await res.json();
        const list = data.products || [];
        // add stable uid for removals
        list.forEach(p => { if(!p._id) p._id = (p.id || p.title) + '_' + (p.price||'') + '_' + Math.random().toString(36).slice(2,9); });
        save(list);
        render(list);
      }catch(err){
        console.error('Erro ao buscar produtos', err);
        render([]);
      }
    }

    init();

    // submit add product (supports file input or URL)
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      const title = document.getElementById('title').value.trim();
      const price = document.getElementById('price').value.trim();
      const brand = document.getElementById('brand').value.trim();
      const category = document.getElementById('category').value.trim();
      const desc = document.getElementById('description').value.trim();
      const url = photoUrlInput.value.trim();

      // if file selected, read it
      const file = fileInput.files && fileInput.files[0];
      let fileDataUrl = null;
      if(file){
        try{
          fileDataUrl = await readFileAsDataURL(file); // base64
        }catch(err){
          console.warn('Erro lendo arquivo', err);
        }
      }

      const newP = {
        _id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
        title: title || 'Produto',
        price: price || '0',
        brand,
        category,
        description: desc,
        thumbnail: fileDataUrl || url || 'https://via.placeholder.com/300x180'
      };

      const cur = load() || [];
      cur.unshift(newP);
      save(cur);
      render(cur);
      form.reset();
      closeModal();
    });
  });
})();
