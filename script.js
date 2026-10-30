const overlay = document.getElementById("menuOverlay");
const waterTransition = document.getElementById("waterTransition");
let transitionBusy = false;

function wait(ms){ return new Promise(resolve => setTimeout(resolve, ms)); }

async function waterSwitch(changeView, destination){
  if(transitionBusy) return;
  transitionBusy = true;
  waterTransition.classList.toggle("pink-water",!!(changeView && changeView.toString().includes("leaveWithWater")));
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
const initialDreamView = new URLSearchParams(location.search).get("return") === "menu" ? "menu" : (["menu", "profile", "contact", "gallery"].includes(location.hash.slice(1)) ? location.hash.slice(1) : "home");
history.replaceState({ dreamView: initialDreamView }, "", location.pathname + (initialDreamView === "home" ? location.search : "#" + initialDreamView));

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
if (contactButton) {
  contactButton.addEventListener("click", () => {
    pushDreamView("contact");
    waterSwitch(openContact, contactPage);
  });
}
contactBack.addEventListener("click", goBackInsideSite);

// CAPTURE
const galleryPage = document.getElementById("galleryPage");
const galleryButton = document.querySelector('[data-menu="gallery"]');
const galleryBack = document.getElementById("galleryBack");
const galleryFilters = [...document.querySelectorAll('.gallery-filters button')];
// New entries are appended to the gallery HTML; show the newest first.
const galleryGrid = document.getElementById('galleryGrid');
const galleryItems = [...document.querySelectorAll('.gallery-item')].reverse();
if (galleryGrid) galleryItems.forEach(item => galleryGrid.appendChild(item));
const galleryLightbox = document.getElementById('galleryLightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxVideo = document.getElementById('lightboxVideo');
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

const galleryPageSize = 10;
let galleryCurrentPage = 1;
const galleryPagination = document.createElement('nav');
galleryPagination.className = 'gallery-pagination';
galleryPagination.setAttribute('aria-label', '갤러리 페이지');
galleryGrid?.insertAdjacentElement('afterend', galleryPagination);
const galleryPageStyle = document.createElement('style');
galleryPageStyle.textContent = `
.gallery-pagination{display:flex;justify-content:center;align-items:center;flex-wrap:wrap;gap:13px;margin:36px auto 24px}
.gallery-pagination button{border:0;border-radius:50%;background:transparent;color:rgba(83,112,132,.65);padding:7px 9px;min-width:32px;cursor:pointer;font:inherit;font-size:13px;font-weight:400;letter-spacing:.035em;transition:background .25s,color .25s,opacity .25s}
.gallery-pagination button:hover:not(:disabled){background:rgba(218,234,239,.38);color:#496f86}
.gallery-pagination button.active{background:radial-gradient(circle,rgba(226,240,242,.85),rgba(233,239,243,.38) 65%,transparent 76%);color:#426b83;font-weight:600}
.gallery-pagination button:disabled{opacity:.24;cursor:default}
.gallery-pagination button:focus-visible{outline:1px solid rgba(105,149,168,.65);outline-offset:3px}
``;
document.head.appendChild(galleryPageStyle);
function renderGalleryPage(scrollToTop = false){
  const filter = galleryFilters.find(b => b.classList.contains('active'))?.dataset.filter || 'all';
  const filtered = galleryItems.filter(item => filter === 'all' || item.dataset.category === filter);
  const totalPages = Math.max(1, Math.ceil(filtered.length / galleryPageSize));
  galleryCurrentPage = Math.min(Math.max(1, galleryCurrentPage), totalPages);
  galleryItems.forEach(item => item.classList.add('is-hidden'));
  filtered.slice((galleryCurrentPage - 1) * galleryPageSize, galleryCurrentPage * galleryPageSize)
    .forEach(item => item.classList.remove('is-hidden'));
  visibleGalleryItems = filtered.slice((galleryCurrentPage - 1) * galleryPageSize, galleryCurrentPage * galleryPageSize);
  galleryPagination.replaceChildren();
  if(totalPages > 1){
    const addButton = (label, page, disabled, active = false) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = label;
      button.disabled = disabled;
      button.classList.toggle('active', active);
      if(active) button.setAttribute('aria-current', 'page');
      button.addEventListener('click', () => {
        galleryCurrentPage = page;
        renderGalleryPage(true);
      });
      galleryPagination.appendChild(button);
    };
    addButton('‹ 이전', galleryCurrentPage - 1, galleryCurrentPage === 1);
    for(let page = 1; page <= totalPages; page++)
      addButton(String(page), page, false, page === galleryCurrentPage);
    addButton('다음 ›', galleryCurrentPage + 1, galleryCurrentPage === totalPages);
  }
  if(scrollToTop) galleryPage.scrollTo({top: 0, behavior: 'smooth'});
}
galleryFilters.forEach(btn => btn.addEventListener('click', () => {
  galleryFilters.forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  galleryCurrentPage = 1;
  renderGalleryPage();
}));
renderGalleryPage();

function closeGalleryLightbox(){
  lightboxVideo.pause();
  lightboxVideo.removeAttribute('src');
  lightboxVideo.load();
  galleryLightbox.classList.remove('open');
  galleryLightbox.setAttribute('aria-hidden','true');
}
function openGalleryItem(item){
  const img = item.querySelector('img');
  const previewVideo = item.querySelector('video');
  const videoSrc = item.dataset.video || previewVideo?.getAttribute('src') || previewVideo?.querySelector('source')?.getAttribute('src');
  if(!img && !videoSrc) return;
  visibleGalleryItems = galleryItems.filter(i => !i.classList.contains('is-hidden') && (i.querySelector('img') || i.dataset.video || i.querySelector('video')));
  currentGalleryIndex = visibleGalleryItems.indexOf(item);
  lightboxVideo.pause();
  lightboxVideo.removeAttribute('src');
  lightboxImage.style.display = videoSrc ? 'none' : 'block';
  lightboxVideo.style.display = videoSrc ? 'block' : 'none';
  if(videoSrc){
    lightboxVideo.src = videoSrc;
    lightboxVideo.load();
  }else{
    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt || '';
  }
  lightboxText.innerHTML = item.querySelector('figcaption')?.innerHTML || '';
  galleryLightbox.classList.add('open');
  galleryLightbox.setAttribute('aria-hidden','false');
}
function stepGallery(dir){ if(!visibleGalleryItems.length) return; currentGalleryIndex=(currentGalleryIndex+dir+visibleGalleryItems.length)%visibleGalleryItems.length; openGalleryItem(visibleGalleryItems[currentGalleryIndex]); }
galleryItems.forEach(item => item.addEventListener('click', () => openGalleryItem(item)));
document.getElementById('lightboxClose').addEventListener('click',closeGalleryLightbox);
document.getElementById('lightboxPrev').addEventListener('click',()=>stepGallery(-1));
document.getElementById('lightboxNext').addEventListener('click',()=>stepGallery(1));
galleryLightbox.addEventListener('click',e=>{if(e.target===galleryLightbox)closeGalleryLightbox()});

document.addEventListener("keydown", (e) => {
  if(galleryLightbox.classList.contains('open')){
    if(e.key==='Escape')closeGalleryLightbox();
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


// ABOUT ME checklist image zoom
const checklistZoomImage=document.getElementById("checklistZoomImage");
const checklistLightbox=document.getElementById("checklistLightbox");
const checklistLightboxClose=document.getElementById("checklistLightboxClose");
function openChecklistZoom(){if(!checklistLightbox)return;checklistLightbox.classList.add("open");checklistLightbox.setAttribute("aria-hidden","false");}
function closeChecklistZoom(){if(!checklistLightbox)return;checklistLightbox.classList.remove("open");checklistLightbox.setAttribute("aria-hidden","true");}
if(checklistZoomImage){checklistZoomImage.addEventListener("click",openChecklistZoom);checklistZoomImage.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();openChecklistZoom();}})}
if(checklistLightboxClose)checklistLightboxClose.addEventListener("click",closeChecklistZoom);
if(checklistLightbox)checklistLightbox.addEventListener("click",e=>{if(e.target===checklistLightbox||e.target.tagName==="IMG")closeChecklistZoom();});
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&checklistLightbox?.classList.contains("open"))closeChecklistZoom();});

// Open the requested section immediately when arriving through a shared deep link.
if(initialDreamView !== "home") exactView(initialDreamView);

/* Continue the existing waterSwitch transition across document navigation. */
function leaveWithWater(url){
  sessionStorage.setItem('btt-water-arrival','1');
  window.location.assign(url);
}
(function resumeWaterArrival(){
  if(sessionStorage.getItem('btt-water-arrival')!=='1')return;
  sessionStorage.removeItem('btt-water-arrival');
  const start=()=>{
    if(!waterTransition)return;
    if(initialDreamView !== 'home') exactView(initialDreamView);
    waterTransition.classList.add('pink-water');
    waterTransition.classList.remove('diving');
    requestAnimationFrame(()=>requestAnimationFrame(()=>{
      waterTransition.classList.add('rising');
      document.documentElement.classList.remove('water-arrival');
      setTimeout(()=>waterTransition.classList.remove('rising'),580);
    }));
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
