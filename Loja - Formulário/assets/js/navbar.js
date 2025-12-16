(function(){
  const btn = document.getElementById("navToggle");
  const menu = document.getElementById("navMenu");

  function toggle(){
    menu.classList.toggle("show");
  }
  btn.addEventListener("click", toggle);
})();