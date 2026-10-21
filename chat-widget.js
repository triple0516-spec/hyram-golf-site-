
(function(){
'use strict';
if(document.getElementById('hyram-concierge-root'))return;
var endpoint=typeof window.HYRAM_AI_ENDPOINT==='string'&&/^https:\/\/[a-z0-9.-]+(?:\/|$)/i.test(window.HYRAM_AI_ENDPOINT)?window.HYRAM_AI_ENDPOINT:null;
var root=document.createElement('div');
root.id='hyram-concierge-root';
root.appendChild(document.createRange().createContextualFragment('<button type="button" class="hc-launcher" id="hc-launcher" aria-label="HYRAM 상담 도우미 열기" aria-expanded="false" aria-controls="hc-widget"><span class="hc-spark" aria-hidden="true">✦</span>HYRAM 상담하기</button>'
+'<section id="hc-widget" class="hc-widget" role="region" aria-label="HYRAM 상담 도우미" hidden>'
+'<header class="hc-top"><span class="hc-avatar" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="8" y="12" width="32" height="26" rx="10" fill="#7B78CD"/><rect x="12" y="16" width="24" height="16" rx="7" fill="#F5F4FF"/><circle cx="19" cy="24" r="2.7" fill="#5958B0"/><circle cx="29" cy="24" r="2.7" fill="#5958B0"/><path d="M20 30 Q24 33 28 30" stroke="#5958B0" stroke-width="2" stroke-linecap="round"/><path d="M24 12V7" stroke="#6563A9" stroke-width="3" stroke-linecap="round"/><circle cx="24" cy="6" r="3" fill="#BEADEE"/></svg></span>'
+'<div class="hc-heading"><strong>HYRAM 상담 도우미 <span class="hc-mode" id="hc-mode">지식 안내</span></strong><small><span class="hc-dot"></span><span id="hc-mode-text">상담 도우미 · 간단한 질문에 답변해요</span></small></div>'
+'<button id="hc-close" class="hc-close" type="button" aria-label="상담창 닫기">×</button></header>'
+'<div class="hc-chat-scroll" id="hc-chat-scroll" role="log" aria-live="polite" aria-relevant="additions">'
+'<div class="hc-message hc-bot">안녕하세요! 👋<br>HYRAM GOLF 상담 도우미입니다.<br>레슨비·환불·준비물은 여기서 바로 확인하세요. 실제 피팅은 HYRAM 담당자가 직접 상담합니다.</div>'
+'<div class="hc-quick" id="hc-quick">'
+'<button type="button" data-topic="club">클럽 추천받기</button><button type="button" data-topic="fitting">피팅 상담하기</button><button type="button" data-topic="lesson">레슨 예약하기</button>'
+'<button type="button" data-topic="used">중고클럽 문의</button><button type="button" data-topic="booking">골프장 부킹</button><button type="button" data-topic="member">회원 혜택</button><button type="button" data-topic="faq">자주 묻는 질문</button></div>'
+'<p class="hc-info" id="hc-chat-info">공식 운영정보·FAQ 기반 자동 안내입니다. 실시간 GPT 답변·예약·결제 확정 기능은 연결 준비 중입니다.</p></div>'
+'<form id="hc-form" class="hc-composer"><input id="hc-input" name="question" type="text" maxlength="500" autocomplete="off" aria-label="상담 질문" placeholder="궁금한 내용을 입력해 주세요"><button class="hc-send" id="hc-send" type="submit" aria-label="메시지 보내기">➤</button></form>'
+'<div class="hc-footer">민감한 개인정보를 입력하지 마세요 · 최종 가격·일정은 담당자 확인</div></section>'));
document.body.appendChild(root);
var button=root.querySelector('#hc-launcher');
var panel=root.querySelector('#hc-widget');
var close=root.querySelector('#hc-close');
var scroller=root.querySelector('#hc-chat-scroll');
var form=root.querySelector('#hc-form');
var input=root.querySelector('#hc-input');
var send=root.querySelector('#hc-send');
if(endpoint){root.querySelector('#hc-mode').textContent='AI 연결 설정';root.querySelector('#hc-mode-text').textContent='AI 서버 응답을 확인하며 상담합니다';}
var topics={
 club:{title:'클럽 추천',text:'사용 목적(비거리·방향성), 구력, 원하는 클럽 종류와 예산을 알려주시면 상담 방향을 안내할게요. 실제 재고와 가격은 직원이 확인해 드립니다.',url:'catalog.html',label:'클럽 둘러보기'},
 fitting:{title:'HYRAM 직접 피팅 상담',text:'김준용 마스터 피터가 직접 상담합니다. 지도 경력 7년을 바탕으로 스윙과 장비를 함께 살펴요. 상담은 무료이며 실제 측정·작업 비용은 별도 안내합니다. 사용 클럽, 샤프트, 구질 고민을 준비해 주세요.',url:'index.html?service=fitting#reserve',label:'HYRAM 피팅 직접 문의'},
 lesson:{title:'골프 레슨',text:'박형규 투어프로 월 레슨은 300,000원, 주 2~3회, 회당 60분이며 연습장 이용료는 별도입니다. 월 총횟수·5주차·보강은 결제 전 확정합니다. 일정은 공식 카카오톡에서 상담하세요. 공개 오픈채팅에는 연락처 등 개인정보를 올리지 마세요.',url:'https://open.kakao.com/o/gaQIRfSi',label:'공식 카카오톡 레슨 상담'},
 used:{title:'중고클럽 · 보상판매',text:'브랜드, 모델, 샤프트, 상태를 확인한 뒤 매입·보상판매 가능 여부를 상담해요. 사진과 최종 감정은 담당자 확인이 필요합니다.',url:'catalog.html',label:'TRADE & CARE 보기'},
 booking:{title:'골프장 · 스크린 부킹',text:'희망 지역·인원·날짜를 정한 뒤 공식 외부 부킹 서비스에서 티타임을 확인할 수 있어요. HYRAM 내 실시간 티타임 조회나 예약 확정, 키오스크 자동 접수는 아직 연결되지 않았습니다.',url:'index.html#bookingClubs',label:'부킹 상담 작성'},
 member:{title:'회원 혜택',text:'SILVER 월 9,900원(베타), GOLD 월 29,900원(상담 가능), PREMIUM·VIP 요금 문의입니다. 등급별 클럽 할인·정기 점검·레슨 할인·TRADE-IN 우선 혜택이 다릅니다. 클럽은 일반 판매 20% 할인과 회원 할인(실버 5%/골드 10%/프리미엄 15%) 중 고객에게 더 유리한 한 가지만 적용해요. 중복 할인은 안 되며, 일반 할인 20% 대상 클럽은 세 등급의 최종 구매가격이 같을 수 있어요. VIP는 별도 협의하고, 상품의 기준가·실제 할인 적용 여부는 담당자가 확인합니다. 사이트 유료 가입·자동갱신·즉시결제는 아직 미연동입니다.',url:'index.html#membership',label:'멤버십 사전 신청'},
 faq:{title:'하람골프 자주 묻는 질문',text:'피팅 과정, 레슨비와 환불, 중고클럽, 방문 장소, 결제 및 부킹 안내 등 FAQ 15가지를 모아 두었어요.',url:'faq.html',label:'FAQ 15개 모두 확인'}
};

var knowledge=[];
var knowledgeLoaded=false;
var knowledgePromise=fetch('chat-knowledge.json',{cache:'no-store',credentials:'same-origin'})
  .then(function(res){if(!res.ok)throw new Error('Knowledge not available');return res.json()})
  .then(function(data){
    if(!data||!Array.isArray(data.entries))throw new Error('Knowledge invalid');
    knowledge=data.entries.filter(function(item){return item&&typeof item.title==='string'&&typeof item.answer==='string'&&Array.isArray(item.triggers)&&typeof item.url==='string'&&item.url.length<300});
    knowledgeLoaded=true;
  })
  .catch(function(){knowledgeLoaded=false;});
function normalizeQuestion(value){return String(value||'').toLocaleLowerCase('ko-KR').replace(/\s+/g,' ').replace(/[^\p{L}\p{N}%가-힣 ]/gu,' ').trim()}
function hasTrigger(text,trigger){
  var target=normalizeQuestion(trigger);
  if(!target)return false;
  if(/^[a-z0-9]+$/.test(target)&&target.length<=3) {
    return new RegExp('(^|[^a-z0-9])'+target+'([^a-z0-9]|$)','i').test(text);
  }
  return text.includes(target);
}
function lookupKnowledge(question){
  var normalized=normalizeQuestion(question);
  if(!knowledgeLoaded||!normalized||normalized.length<2)return null;
  var results=[];
  knowledge.forEach(function(item){
    var best=0,hits=0;
    item.triggers.forEach(function(trigger){if(hasTrigger(normalized,trigger)){hits++;best=Math.max(best,normalizeQuestion(trigger).length)}});
    if(!hits)return;
    var score=best*2+Math.min(hits,4)*3;
    if(item.id==='membershipdiscount' && /(할인|20%|회원가|중복)/.test(normalized) && /(멤버|회원|골드|실버|프리미엄|vip|20%)/.test(normalized))score+=15;
    if(item.id==='lessonrefund' && /(환불|취소|해지)/.test(normalized) && /(레슨|수강|회차|위약금|미수강)/.test(normalized))score+=15;
    if(item.id==='lessonprice' && /(가격|금액|비용|얼마|레슨비)/.test(normalized)&&/(레슨|수업|강습)/.test(normalized))score+=8;
    results.push({item:item,score:score});
  });
  results.sort(function(a,b){return b.score-a.score});
  if(!results.length)return null;
  return results[0].item;
}

function append(text,who,link){
 var node=document.createElement('div');node.className='hc-message hc-'+who;node.textContent=text;
 if(link){var wrap=document.createElement('div'),a=document.createElement('a');a.href=link.url;if(/^https:\/\//.test(link.url)){a.target='_blank';a.rel='noopener noreferrer';}a.textContent=link.label+' →';wrap.appendChild(a);node.appendChild(document.createElement('br'));node.appendChild(wrap);}
 scroller.insertBefore(node,root.querySelector('#hc-chat-info'));
 scroller.scrollTop=scroller.scrollHeight;
}
function quick(topic){
 var t=topics[topic];if(!t)return;
 append(t.title,'user');
 append(t.text,'bot',{url:t.url,label:t.label});
}
function chooseTopic(message){
 var m=message.toLowerCase();
 if(/(중고|보상판매|매입|팔고)/.test(m))return 'used';
 if(/(피팅|샤프트|로프트|그립|스핀|캐리|탄도)/.test(m))return 'fitting';
 if(/(레슨|스윙|교육|입문|강습)/.test(m))return 'lesson';
 if(/(부킹|골프장|스크린|예약)/.test(m))return 'booking';
 if(/(회원|혜택|vip|실버|골드|멤버십)/.test(m))return 'member';
 if(/(클럽|드라이버|아이언|우드|가격|견적|재고|추천)/.test(m))return 'club';
 return null;
}
function toggle(force){
 var open=typeof force==='boolean'?force:panel.hidden;
 panel.hidden=!open;button.setAttribute('aria-expanded',String(open));button.setAttribute('aria-label',open?'HYRAM 상담 도우미 닫기':'HYRAM 상담 도우미 열기');
 if(open){input.focus()}else{button.focus()}
}
button.addEventListener('click',function(){toggle()});
close.addEventListener('click',function(){toggle(false)});
document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!panel.hidden){e.preventDefault();toggle(false)}});
document.querySelectorAll('[data-hyram-chat-open]').forEach(function(el){
 el.addEventListener('click',function(e){e.preventDefault();toggle(true);var topic=el.getAttribute('data-hyram-chat-topic');if(topic)quick(topic)});
});
document.querySelectorAll('[data-hyram-chat-product]').forEach(function(el){
 el.addEventListener('click',function(e){
  e.preventDefault();
  toggle(true);
  input.value=el.getAttribute('data-hyram-chat-product')+' 제품의 가격, 재고와 샤프트 구성 상담을 받고 싶어요.';
  input.focus();
 });
});
root.querySelectorAll('[data-topic]').forEach(function(el){el.addEventListener('click',function(){quick(el.getAttribute('data-topic'))})});
form.addEventListener('submit',async function(e){
 e.preventDefault();if(send.disabled)return;
 var message=input.value.trim();if(!message)return;
 input.value='';append(message,'user');
 if(/(운영시간|영업시간|몇시|몇 시|상담시간)/.test(message)){append('상담 접수 안내는 매일 22:00까지입니다. 실제 방문·레슨은 사전 예약제이며 답변 시간은 운영 상황에 따라 달라질 수 있습니다.','bot',{url:'faq.html',label:'방문·운영 안내'});return;}
 if(/(위치|주소|찾아가|어디에|어디야)/.test(message)){append('레슨 안내 장소는 SG GOLF Field 명지스크린, 부산 강서구 명지국제8로10번길 38 플러스시네마 6층 610호입니다. 사업자등록 주소와는 별도이며 방문 전 일정을 확인해 주세요.','bot',{url:'lesson.html#lesson-place',label:'레슨 장소 확인'});return;}
 if(/(결제방법|결제는|계좌이체|온라인결제|카드결제)/.test(message)){append('거래 조건 확정 후 계좌이체·현장 결제 가능 방법을 개별 안내합니다. 사이트 온라인 즉시결제는 현재 준비 중이며, 카드정보를 이 채팅창에 입력하지 마세요.','bot',{url:'faq.html',label:'결제 안내 확인'});return;}
 if(/(자주 묻|faq|질문 목록|전체 안내)/i.test(message)){var ft=topics.faq;append(ft.text,'bot',{url:ft.url,label:ft.label});return;}
 if(/환불|취소|해지/.test(message)){append('박형규 프로 레슨은 실제 결제액에서 계약 회당 레슨비 × 실제 수강 회차를 차감한 잔액을 반환합니다. 회당 금액은 결제액 ÷ 계약 총횟수로 정하며 별도 위약금은 없습니다. 연습장 이용료는 별도 계약 기준입니다. 법정 권리를 우선합니다.','bot',{url:'refund.html#service',label:'환불 기준 확인'});return;}
 if(/준비물|뭘.*가져|무엇.*준비/.test(message)){append('피팅 상담은 사용 클럽·샤프트 정보, 구질 고민과 측정 기록이 있으면 준비해 주세요. 레슨은 구력·목표·희망 일정을 알려주세요. 장비 대여와 시설 이용료는 방문 전에 확인합니다.','bot',{url:'lesson.html',label:'레슨 장소와 안내'});return;}
 if(/연습장.*(이용료|비용|포함)|타석.*(비용|포함)/.test(message)){append('박형규 프로 레슨비 월 300,000원에는 연습장 이용료가 포함되지 않습니다. 시설 이용료는 상담 시 별도로 확인해 주세요.','bot',{url:'lesson.html#lesson-plan',label:'레슨 조건 보기'});return;}
 await knowledgePromise;
 var matched=lookupKnowledge(message);
 if(matched){append(matched.answer,'bot',{url:matched.url,label:matched.label||matched.title});return;}
 var fallback=chooseTopic(message);
 if(!endpoint){
  if(fallback){var t=topics[fallback];append(t.text,'bot',{url:t.url,label:t.label})}
  else append('레슨비, 환불, 준비물, 피팅, 부킹처럼 궁금한 항목을 조금 더 구체적으로 알려주세요. 기본 안내를 먼저 도와드리고 필요한 경우 담당 상담으로 연결합니다.','bot',{url:'https://open.kakao.com/o/gaQIRfSi',label:'카카오 직원 상담'});
  return;
 }
 send.disabled=true;
 var ctrl=new AbortController(),timer=setTimeout(function(){ctrl.abort()},12000);
 try{
  var res=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:message}),signal:ctrl.signal,credentials:'omit'});
  if(!res.ok)throw new Error('AI endpoint unavailable');
  var data=await res.json();
  if(!data||typeof data.answer!=='string'||!data.answer.trim())throw new Error('Empty AI response');
  append(data.answer.slice(0,2400),'bot');
 }catch(err){
  append('현재 실시간 AI 상담에 연결할 수 없어요. 기본 상담 안내로 도와드릴게요.','bot');
  if(fallback){var tt=topics[fallback];append(tt.text,'bot',{url:tt.url,label:tt.label})}
  else append('직원과 상담하시려면 아래 링크를 이용해 주세요.','bot',{url:'https://open.kakao.com/o/gaQIRfSi',label:'카카오 직원 상담'});
 }finally{clearTimeout(timer);send.disabled=false;input.focus()}
});
})();
