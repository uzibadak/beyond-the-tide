import {createClient} from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import {SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY} from './config.js';

const $=id=>document.getElementById(id);
// Show the author sign-in only through the private entry URL (?admin=1).
const authorEntry=new URLSearchParams(window.location.search).get('admin')==='1';
const ready=!SUPABASE_URL.includes('YOUR_PROJECT')&&!SUPABASE_PUBLISHABLE_KEY.includes('YOUR_');
const supabase=ready?createClient(SUPABASE_URL,SUPABASE_PUBLISHABLE_KEY):null;
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Count calendar days in Korea, inclusive of 2026-10-18 (D+1).
function updateDayCount(){
  const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
  const get=t=>Number(parts.find(p=>p.type===t).value);
  const day=Date.UTC(get('year'),get('month')-1,get('day'));
  const start=Date.UTC(2026,9,18);
  $('daycount').textContent='D+'+(Math.floor((day-start)/86400000)+1);
}
updateDayCount();
setInterval(updateDayCount,60*1000);
let user=null,canWrite=false,notes=[],pendingFile=null,openIds=new Set();
function notice(s){$('notice').textContent=s;$('notice').hidden=!s;}
function errMessage(error){console.error(error);notice('잠시 연결할 수 없어요. 다시 시도해 주세요.');}
async function updateAuth(){
  if(!supabase)return;
  const {data:{user:u}}=await supabase.auth.getUser();user=u;
  canWrite=false;
  if(user){
    const {data,error}=await supabase.from('our_days_writers').select('user_id').eq('user_id',user.id).maybeSingle();
    if(error)console.warn(error);canWrite=!!data;
  }
  $('composer').hidden=!canWrite;
  $('logout').hidden=!user;
  $('loginToggle').hidden=!!user || !authorEntry;
  $('loginForm').hidden=true;
  $('authStatus').textContent=canWrite?'월화의 냉장고 · 메모 작성 중':user?'메모 열람과 익명 답장을 이용할 수 있어요.':'누구나 익명 답장을 남길 수 있어요.';
  render();
}
$('loginToggle').onclick=()=>{$('loginForm').hidden=!$('loginForm').hidden;};
$('loginForm').onsubmit=async e=>{
  e.preventDefault();if(!supabase)return;
  const btn=e.target.querySelector('button');btn.disabled=true;
  const {error}=await supabase.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
  btn.disabled=false;$('password').value='';
  if(error){alert('로그인에 실패했어요. 계정을 확인해 주세요.');return;}
  await updateAuth();
};
$('logout').onclick=async()=>{await supabase.auth.signOut();await updateAuth();};
const formatDate=iso=>new Date(iso).toLocaleDateString('ko-KR',{month:'numeric',day:'numeric'}).replace(/\s/g,'').replace(/\.$/,'');
function imageURL(path){if(!path||!supabase)return null;return supabase.storage.from('our-days-images').getPublicUrl(path).data.publicUrl;}
function render(){
  const board=$('board');board.replaceChildren();
  for(const n of notes){
    const card=document.createElement('article');card.className='note';
    const photo=n.image_path?imageURL(n.image_path):null;
    const own=canWrite&&n.author_id===user?.id;
    const replies=n.our_days_replies||[];
    card.innerHTML=`<span class="magnet" aria-hidden="true"></span>
      <div class="notehead"><time>${escape(formatDate(n.created_at))}</time></div>
      ${n.body?`<div class="content">${escape(n.body)}</div>`:''}
      ${photo?`<button class="photo-open" type="button" aria-label="사진 확대"><img class="note-photo" alt="첨부 사진" loading="lazy"></button>`:''}
      <button class="replytoggle" type="button">↳ ${replies.length}개의 답장 · ${openIds.has(n.id)?'접기':'펼치기'}</button>
      ${own?'<button class="note-delete" type="button">메모 삭제</button>':''}
      <div class="replies" ${openIds.has(n.id)?'':'hidden'}></div>`;
    if(photo){card.querySelector('img').src=photo;card.querySelector('.photo-open').onclick=()=>{
      $('largePhoto').src=photo;$('photoDialog').showModal();
    };}
    const box=card.querySelector('.replies');
    for(const r of replies){
      const p=document.createElement('p');p.className='reply';
      const span=document.createElement('span');span.textContent=r.body;p.append(span);const date=document.createElement('small');date.className='reply-date';date.textContent=formatDate(r.created_at);p.append(date);
      if(canWrite){
        const del=document.createElement('button');del.className='reply-delete';del.type='button';del.textContent='삭제';
        del.onclick=()=>deleteReply(r.id);p.append(del);
      }box.append(p);
    }
    {
      const form=document.createElement('form');form.className='replyform';
      const input=document.createElement('input');input.maxLength=160;input.required=true;input.placeholder='짧은 답장을 남겨요...';
      const button=document.createElement('button');button.type='submit';button.textContent='↗';
      form.append(input,button);form.onsubmit=async e=>{
        e.preventDefault();const body=input.value.trim();if(!body)return;
        button.disabled=true;
        const {error}=await supabase.from('our_days_replies').insert({note_id:n.id,body});
        button.disabled=false;
        if(error){alert('답장을 등록하지 못했어요.');return;}
        openIds.add(n.id);await load();
      };box.append(form);
    }
    card.querySelector('.replytoggle').onclick=()=>{
      if(openIds.has(n.id))openIds.delete(n.id);else openIds.add(n.id);render();
    };
    if(own)card.querySelector('.note-delete').onclick=()=>deleteNote(n);
    board.append(card);
  }
}
async function load(){
  if(!supabase)return;
  const {data,error}=await supabase.from('our_days_notes')
    .select('id,author_id,body,image_path,created_at,our_days_replies(id,author_id,body,created_at)')
    .order('created_at',{ascending:false}).limit(100);
  if(error){errMessage(error);return;}
  notes=(data||[]).map(n=>({...n,our_days_replies:(n.our_days_replies||[]).sort((a,b)=>new Date(a.created_at)-new Date(b.created_at))}));
  notice(notes.length?'':'아직 붙여 둔 메모가 없어요.');render();
}
async function deleteNote(n){
  if(!confirm('이 메모와 답장을 삭제할까요?'))return;
  const {error}=await supabase.from('our_days_notes').delete().eq('id',n.id);
  if(error){alert('메모를 삭제하지 못했어요.');return;}
  if(n.image_path)await supabase.storage.from('our-days-images').remove([n.image_path]);
  await load();
}
async function deleteReply(id){
  if(!confirm('답장을 삭제할까요?'))return;
  const {error}=await supabase.from('our_days_replies').delete().eq('id',id);
  if(error){alert('답장을 삭제하지 못했어요.');return;}await load();
}
const photoInput=$('photoInput'),preview=$('photoPreview');
function drawPreview(){
  preview.replaceChildren();preview.hidden=!pendingFile;if(!pendingFile)return;
  const img=document.createElement('img');img.alt='사진 미리보기';
  const url=URL.createObjectURL(pendingFile);img.src=url;img.onload=()=>URL.revokeObjectURL(url);
  const remove=document.createElement('button');remove.type='button';remove.textContent='사진 지우기 ×';
  remove.onclick=()=>{pendingFile=null;photoInput.value='';drawPreview();};
  preview.append(img,remove);
}
photoInput.onchange=()=>{
  const f=photoInput.files?.[0];if(!f)return;
  if(!['image/jpeg','image/png','image/webp','image/gif'].includes(f.type)||f.size>5*1024*1024){
    alert('JPG, PNG, WEBP, GIF 사진만 첨부할 수 있어요. (최대 5MB)');photoInput.value='';return;
  }pendingFile=f;drawPreview();
};
$('composer').onsubmit=async e=>{
  e.preventDefault();if(!canWrite)return;
  const body=$('message').value.trim();if(!body&&!pendingFile){alert('글이나 사진을 남겨 주세요.');return;}
  const btn=$('submitNote');btn.disabled=true;
  let path=null;
  try{
    if(pendingFile){
      const ext=pendingFile.type==='image/jpeg'?'jpg':pendingFile.type.split('/')[1];
      path=`${user.id}/${crypto.randomUUID()}.${ext}`;
      const {error}=await supabase.storage.from('our-days-images').upload(path,pendingFile,{contentType:pendingFile.type,upsert:false});
      if(error)throw error;
    }
    const {error}=await supabase.from('our_days_notes').insert({author_id:user.id,body,image_path:path});
    if(error)throw error;
    $('message').value='';pendingFile=null;photoInput.value='';drawPreview();await load();
  }catch(err){
    console.error(err);if(path)await supabase.storage.from('our-days-images').remove([path]);
    alert('메모를 올리지 못했어요. 연결과 권한을 확인해 주세요.');
  }finally{btn.disabled=false;}
};
if(!ready){notice('설정이 아직 완료되지 않았어요. config.js에 Supabase 연결 정보를 넣어 주세요.');$('authStatus').textContent='설정 대기 중';$('loginToggle').hidden=true;}
else{
  supabase.auth.onAuthStateChange(()=>{setTimeout(updateAuth,0);});
  await updateAuth();await load();
}
