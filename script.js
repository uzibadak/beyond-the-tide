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

// Keep each in-site screen in browser history so the browser Back button
// returns to the previous screen instead of leaving the website.
history.replaceState({ dreamView: "home" }, "", location.pathname + location.search);

function pushDreamView(view){
  history.pushState({ dreamView: view }, "", "#" + view);
}

function exactView(view){
  closeProfile();
  closeContact();
  closeGallery();

  if(view === "home"){
    hideMenu();
    return document.querySelector(".main-screen");
  }

  showMenu();
  if(view === "profile"){ openProfile(); return profilePage; }
  if(view === "contact"){ openContact(); return contactPage; }
  if(view === "gallery"){ openGallery(); return galleryPage; }
  return overlay;
}

function goBackInsideSite(){
  history.back();
}

document.getElementById("windowLink").addEventListener("click", () => {
  pushDreamView("menu");
  waterSwitch(showMenu, overlay);
});
document.getElementById("backBtn").addEventListener("click", goBackInsideSite);

// PROFILE
const profilePage = document.getElementById("profilePage");
const profileButton = document.querySelector('[data-menu="profile"]');
const profileBack = document.getElementById("profileBack");
function openProfile(){ profilePage.classList.add("open"); profilePage.setAttribute("aria-hidden","false"); profilePage.scrollTop=0; }
function closeProfile(){ profilePage.classList.remove("open"); profilePage.setAttribute("aria-hidden","true"); }
profileButton.addEventListener("click", () => {
  pushDreamView("profile");
  waterSwitch(openProfile, profilePage);
});
profileBack.addEventListener("click", goBackInsideSite);

// FOR YOU
const contactPage = document.getElementById("contactPage");
const contactButton = document.querySelector('[data-menu="story"]');
const contactBack = document.getElementById("contactBack");
function openContact(){ contactPage.classList.add("open"); contactPage.setAttribute("aria-hidden","false"); contactPage.scrollTop=0; }
function closeContact(){ contactPage.classList.remove("open"); contactPage.setAttribute("aria-hidden","true"); }
contactButton.addEventListener("click", () => {
  pushDreamView("contact");
  waterSwitch(openContact, contactPage);
});
contactBack.addEventListener("click", goBackInsideSite);

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
galleryButton.addEventListener("click", () => {
  pushDreamView("gallery");
  waterSwitch(openGallery, galleryPage);
});
galleryBack.addEventListener("click", goBackInsideSite);

window.addEventListener("popstate", (event) => {
  const view = event.state?.dreamView || "home";
  const destination =
    view === "profile" ? profilePage :
    view === "contact" ? contactPage :
    view === "gallery" ? galleryPage :
    view === "menu" ? overlay :
    document.querySelector(".main-screen");

  waterSwitch(() => exactView(view), destination);
});

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
  if(galleryPage.classList.contains("open") ||
     contactPage.classList.contains("open") ||
     profilePage.classList.contains("open") ||
     overlay.classList.contains("open")) goBackInsideSite();
});


// Minimal Ocean BGM controls (YouTube iframe API via postMessage)
const oceanYoutube = document.getElementById("oceanYoutube");
if(oceanPlayer && oceanPlayerToggle && oceanYoutube){
  let oceanPlaying = false;
  oceanPlayerToggle.replaceWith(oceanPlayerToggle.cloneNode(true));
  const bgmButton = document.getElementById("oceanPlayerToggle");
  bgmButton.addEventListener("click", () => {
    oceanPlaying = !oceanPlaying;
    oceanYoutube.contentWindow.postMessage(JSON.stringify({event:"command",func:oceanPlaying?"playVideo":"pauseVideo",args:[]}), "*");
    oceanPlayer.classList.toggle("playing", oceanPlaying);
    bgmButton.textContent = oceanPlaying ? "Ⅱ" : "▶";
    bgmButton.setAttribute("aria-label", oceanPlaying ? "Ocean 일시정지" : "Ocean 재생");
  });
}
