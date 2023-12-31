let subMenu = document.getElementById("subMenu");
let sidebar = document.querySelector('.sidebar');
let classIcon = document.querySelector('.bar-icon');
let buckets = document.querySelector('.buckets');
let formContainer = document.querySelector('.form-container');

function toggleMenu() {
  subMenu.classList.toggle("open-menu");
}

function toggleSidebar() {
  sidebar.classList.toggle('sidebar-hidden');
  classIcon.classList.toggle('sidebar-hidden');
  buckets.classList.toggle('sidebar-hidden');
  formContainer.classList.toggle('sidebar-hidden');
}