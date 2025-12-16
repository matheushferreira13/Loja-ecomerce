// assets/js/users.js
// Modal + fetch + render + add user (suporta upload local -> base64) + localStorage

(function(){
  const LS_KEY = "myshop_users_v1";

  function onDOM(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
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
    const userList = document.getElementById('userList');
    const modal = document.getElementById('userModal');
    const backdrop = document.getElementById('userModalBackdrop');
    const openBtn = document.getElementById('openUserModal');
    const closeBtn = document.getElementById('closeUserModal');
    const cancelBtn = document.getElementById('cancelUser');
    const form = document.getElementById('userForm');
    const fileInput = document.getElementById('userImageInput');
    const photoUrlInput = document.getElementById('photoUrl');

    function save(list){ try{ localStorage.setItem(LS_KEY, JSON.stringify(list)); }catch(e){ console.warn(e); } }
    function load(){ try{ const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null; }catch(e){ return null; } }

    function openModal(){
      if(!modal) return;
      modal.classList.add('show');
      modal.setAttribute('aria-hidden','false');
      document.body.style.overflow='hidden';
      const first = modal.querySelector('input, button');
      if(first) first.focus();
    }
    function closeModal(){
      if(!modal) return;
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden','true');
      document.body.style.overflow='auto';
    }

    if(openBtn) openBtn.addEventListener('click', openModal);
    if(closeBtn) closeBtn.addEventListener('click', closeModal);
    if(cancelBtn) cancelBtn.addEventListener('click', closeModal);
    if(backdrop) backdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', e => { if(e.key === 'Escape') closeModal(); });

    // render
    function render(list){
      if(!userList) return;
      userList.innerHTML = '';
      if(!list || !list.length){
        userList.innerHTML = '<div style="padding:12px;border-radius:8px;background:var(--card);color:var(--muted)">Nenhum usuário encontrado.</div>';
        return;
      }
      list.forEach(u => {
        const id = u._id || ('local_' + Date.now() + '_' + Math.random().toString(36).slice(2,9));
        if(!u._id) u._id = id;
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = id;
        const img = u.image || u.photo || u.avatar || u.photoUrl || 'https://via.placeholder.com/150';
        card.innerHTML = `
          <button class="remove-x" data-id="${id}" title="Remover">✖</button>
          <img src="${img}" alt="${u.firstName || u.fname || ''}">
          <h3>${u.firstName || u.fname || 'Usuário'} ${u.lastName || u.lname || ''}</h3>
          <div class="meta">${u.email || ''}</div>
          <div>${u.age ? u.age + ' anos' : ''}</div>
        `;
        userList.appendChild(card);
      });

      // attach remove handlers
      userList.querySelectorAll('.remove-x').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          let arr = load() || [];
          arr = arr.filter(x => String(x._id) !== String(id));
          save(arr);
          render(arr);
        });
      });
    }

    // init: load local or api
    async function init(){
      const cached = load();
      if(cached && cached.length){ render(cached); return; }
      try{
        const res = await fetch('https://dummyjson.com/users');
        const data = await res.json();
        const list = data.users || [];
        // ensure unique ids
        list.forEach(u => { if(!u._id) u._id = (u.id || u.email || u.firstName) + '_' + Math.random().toString(36).slice(2,8); });
        save(list);
        render(list);
      }catch(err){
        console.error('Erro users fetch', err);
        render([]);
      }
    }

    init();

    // handle add (supports file input and URL)
    form.addEventListener('submit', async function(e){
      e.preventDefault();
      const fname = document.getElementById('fname').value.trim();
      const lname = document.getElementById('lname').value.trim();
      const email = document.getElementById('email').value.trim();
      const age = document.getElementById('age').value.trim();
      const url = photoUrlInput.value.trim();

      // read file if exists
      const file = fileInput.files && fileInput.files[0];
      let dataUrl = null;
      if(file){
        try{ dataUrl = await readFileAsDataURL(file); } catch(err){ console.warn('Erro lendo arquivo', err); }
      }

      const newUser = {
        _id: 'local_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
        firstName: fname,
        lastName: lname,
        email,
        age,
        image: dataUrl || url || 'https://via.placeholder.com/150'
      };

      const arr = load() || [];
      arr.unshift(newUser);
      save(arr);
      render(arr);
      form.reset();
      closeModal();
    });
  });
})();
