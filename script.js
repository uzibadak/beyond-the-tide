const overlay = document.getElementById("menuOverlay");
const waterTransition = document.getElementById("waterTransition");
let transitionBusy = false;

function wait(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

async function waterSwitch(changeView, destination){
  if(transitionBusy) return;
  transitionBusy = true;
  waterTransition.classList.remove("rising");
  void waterTransition.offsetWidth;
  waterTransition.classList.add("diving");
  await wait(390);

  changeView();
  if(destination){
    destination.classList.remove("water-arrive");
    void destination.offsetWidth;
    destination.classList.add("water-arrive");
  }

  waterTransition.classList.remove("diving");
  waterTransition.classList.add("rising");
  await wait(570);
  waterTransition.classList.remove("rising");
  if(destination) destination.classList.remove("water-arrive");
  transitionBusy = false;
}

function showMenu(){ overlay.classList.add("open"); overlay.setAttribute("aria-hidden","false"); }
function hideMenu(){ overlay.classList.remove("open"); overlay.setAttribute("aria-hidden","true"); }

document.getElementById("windowLink").addEventListener("click", () => waterSwitch(showMenu, overlay));
document.getElementById("backBtn").addEventListener("click", () => waterSwitch(hideMenu, document.querySelector('.main-screen')));

// PROFILE
const profilePage = document.getElementById("profilePage");
const profileButton = document.querySelector('[data-menu="profile"]');
const profileBack = document.getElementById("profileBack");
function openProfile(){ profilePage.classList.add("open"); profilePage.setAttribute("aria-hidden","false"); profilePage.scrollTop=0; }
function closeProfile(){ profilePage.classList.remove("open"); profilePage.setAttribute("aria-hidden","true"); }
profileButton.addEventListener("click", () => waterSwitch(openProfile, profilePage));
profileBack.addEventListener("click", () => waterSwitch(closeProfile, overlay));

// FOR YOU
const contactPage = document.getElementById("contactPage");
const contactButton = document.querySelector('[data-menu="story"]');
const contactBack = document.getElementById("contactBack");
function openContact(){ contactPage.classList.add("open"); contactPage.setAttribute("aria-hidden","false"); contactPage.scrollTop=0; }
function closeContact(){ contactPage.classList.remove("open"); contactPage.setAttribute("aria-hidden","true"); }
contactButton.addEventListener("click", () => waterSwitch(openContact, contactPage));
contactBack.addEventListener("click", () => waterSwitch(closeContact, overlay));

// CAPTURE
const galleryPage = document.getElementById("galleryPage");
const galleryButton = document.querySelector('[data-menu="gallery"]');
const galleryBack = document.getElementById("galleryBack");
const galleryFilters = [...document.querySelectorAll('.gallery-filters button')];
const galleryItems = [...document.querySelectorAll('.gallery-item')];
const galleryLightbox = document.getElementById('galleryLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxText = document.getElementById('lightboxText');
let visibleGalleryItems = galleryItems;
let currentGalleryIndex = 0;
function openGallery(){ galleryPage.classList.add("open"); galleryPage.setAttribute("aria-hidden","false"); galleryPage.scrollTop=0; }
function closeGallery(){ galleryPage.classList.remove("open"); galleryPage.setAttribute("aria-hidden","true"); }
galleryButton.addEventListener("click", () => waterSwitch(openGallery, galleryPage));
galleryBack.addEventListener("click", () => waterSwitch(closeGallery, overlay));

galleryFilters.forEach(btn => btn.addEventListener('click', () => {
  galleryFilters.forEach(b => b.classList.remove('active')); btn.classList.add('active');
  const filter = btn.dataset.filter;
  galleryItems.forEach(item => item.classList.toggle('is-hidden', filter !== 'all' && item.dataset.category !== filter));
  visibleGalleryItems = galleryItems.filter(item => !item.classList.contains('is-hidden'));
}));

function openGalleryItem(item){
  const img = item.querySelector('img');
  if(!img) return;
  visibleGalleryItems = galleryItems.filter(i => !i.classList.contains('is-hidden') && i.querySelector('img'));
  currentGalleryIndex = visibleGalleryItems.indexOf(item);
  lightboxImage.src = img.src; lightboxImage.alt = img.alt || '';
  lightboxText.innerHTML = item.querySelector('figcaption')?.innerHTML || '';
  galleryLightbox.classList.add('open'); galleryLightbox.setAttribute('aria-hidden','false');
}
function stepGallery(dir){ if(!visibleGalleryItems.length) return; currentGalleryIndex=(currentGalleryIndex+dir+visibleGalleryItems.length)%visibleGalleryItems.length; openGalleryItem(visibleGalleryItems[currentGalleryIndex]); }
galleryItems.forEach(item => item.addEventListener('click', () => openGalleryItem(item)));
document.getElementById('lightboxClose').addEventListener('click',()=>{galleryLightbox.classList.remove('open');galleryLightbox.setAttribute('aria-hidden','true')});
document.getElementById('lightboxPrev').addEventListener('click',()=>stepGallery(-1));
document.getElementById('lightboxNext').addEventListener('click',()=>stepGallery(1));
galleryLightbox.addEventListener('click',e=>{if(e.target===galleryLightbox){galleryLightbox.classList.remove('open');galleryLightbox.setAttribute('aria-hidden','true')}});

document.addEventListener("keydown", (e) => {
  if(galleryLightbox.classList.contains('open')){
    if(e.key==='Escape'){galleryLightbox.classList.remove('open');galleryLightbox.setAttribute('aria-hidden','true');}
    if(e.key==='ArrowLeft') stepGallery(-1);
    if(e.key==='ArrowRight') stepGallery(1);
    return;
  }
  if(e.key !== "Escape" || transitionBusy) return;
  if(galleryPage.classList.contains("open")) waterSwitch(closeGallery, overlay);
  else if(contactPage.classList.contains("open")) waterSwitch(closeContact, overlay);
  else if(profilePage.classList.contains("open")) waterSwitch(closeProfile, overlay);
  else if(overlay.classList.contains("open")) waterSwitch(hideMenu, document.querySelector('.main-screen'));
});
