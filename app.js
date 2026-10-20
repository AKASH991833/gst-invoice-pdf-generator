(function(){
'use strict';
var $=function(i){return document.getElementById(i)},C=GstCalc;
$('themeBtn').addEventListener('click',function(){var n=document.documentElement.dataset.theme==='dark'?'light':'dark';document.documentElement.dataset.theme=n;try{localStorage.setItem('theme',n)}catch(e){}});
var GSTS=[0,0.25,3,5,12,18,28],UNITS=['pcs','kg','g','ltr','mtr','ft','box','set','hr','nos'];
function fillStates(sel,def){sel.innerHTML='';Object.keys(C.STATES).forEach(function(k){var o=document.createElement('option');o.value=k;o.textContent=C.STATES[k]+' ('+k+')';sel.appendChild(o)});sel.value=def}
fillStates($('sState'),'09');fillStates($('bState'),'09');
var items=[];
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.innerHTML=h;return e}
function field(cls,label,input){var f=el('div','f '+cls);var l=el('label');l.textContent=label;f.appendChild(l);f.appendChild(input);return f}
function inp(type,val,ph,mode,max){var i=document.createElement('input');i.type=type;i.value=val;if(ph)i.placeholder=ph;if(mode)i.inputMode=mode;if(max)i.maxLength=max;return i}
function addItem(d){
  d=d||{desc:'',hsn:'',qty:'1',unit:'pcs',rate:'',disc:'0',gst:'18'};
  var box=el('div','item'),o={};
  o.desc=inp('text',d.desc,'Item or service name',null,100);o.hsn=inp('text',d.hsn,'HSN/SAC','numeric',8);o.qty=inp('text',d.qty,'1','decimal',9);
  o.unit=document.createElement('select');UNITS.forEach(function(u){var x=document.createElement('option');x.textContent=u;o.unit.appendChild(x)});o.unit.value=d.unit;
  o.rate=inp('text',d.rate,'0.00','decimal',11);o.disc=inp('text',d.disc,'0','decimal',5);
  o.gst=document.createElement('select');GSTS.forEach(function(g){var x=document.createElement('option');x.value=g;x.textContent=g+'%';o.gst.appendChild(x)});o.gst.value=d.gst;
  var foot=el('div','foot','<span>Line total: <b class="lt">0.00</b></span>');var rm=el('button','rm','Remove');rm.type='button';foot.appendChild(rm);
  box.appendChild(field('d','Item name *',o.desc));box.appendChild(field('c2','HSN / SAC',o.hsn));box.appendChild(field('','Qty *',o.qty));box.appendChild(field('','Unit',o.unit));
  box.appendChild(field('c3','Rate (Rs) *',o.rate));box.appendChild(field('','Disc %',o.disc));box.appendChild(field('','GST',o.gst));box.appendChild(foot);
  var rec={o:o,box:box};items.push(rec);$('items').appendChild(box);
  Object.keys(o).forEach(function(k){o[k].addEventListener('input',recalc);o[k].addEventListener('change',recalc)});
  rm.addEventListener('click',function(){if(items.length===1){Object.keys(o).forEach(function(k){if(k==='unit')o[k].value='pcs';else if(k==='gst')o[k].value='18';else if(k==='qty')o[k].value='1';else if(k==='disc')o[k].value='0';else o[k].value=''});}else{items.splice(items.indexOf(rec),1);box.remove()}recalc()});
}
function gather(){
  return {sellerName:$('sName').value.trim(),sellerAddr:$('sAddr').value.trim(),sellerGst:$('sGst').value.trim().toUpperCase(),sellerPhone:$('sPh').value.trim(),sellerState:$('sState').value,pay:$('sPay').value.trim(),
   buyerName:$('bName').value.trim(),buyerAddr:$('bAddr').value.trim(),buyerGst:$('bGst').value.trim().toUpperCase(),buyerPhone:$('bPh').value.trim(),buyerState:$('bState').value,
   number:$('iNo').value.trim(),date:$('iDate').value,note:$('iNote').value.trim(),
   items:items.map(function(r){var o=r.o;return {desc:o.desc.value.trim(),hsn:o.hsn.value.trim(),qty:o.qty.value,unit:o.unit.value,rate:o.rate.value,disc:o.disc.value,gst:o.gst.value}})};
}
var cur=null;
function recalc(){
  var inv=gather(),c=C.compute(inv);cur={inv:inv,c:c};
  items.forEach(function(r,i){r.box.querySelector('.lt').textContent=C.inr(c.rows[i]?c.rows[i].total:0)});
  var d=[];function R(l,v,g){d.push('<div class="'+(g?'g':'')+'"><dt>'+l+'</dt><dd>'+v+'</dd></div>')}
  if(c.discount)R('Discount','- Rs. '+C.inr(c.discount));
  R('Taxable value','Rs. '+C.inr(c.taxable));
  if(c.inter)R('IGST','Rs. '+C.inr(c.igst));else{R('CGST','Rs. '+C.inr(c.cgst));R('SGST','Rs. '+C.inr(c.sgst))}
  if(c.roundOff)R('Round off',(c.roundOff<0?'- ':'')+'Rs. '+C.inr(Math.abs(c.roundOff)));
  R('Grand total','Rs. '+C.inr(c.grand),true);$('tot').innerHTML=d.join('');
  $('words').textContent=c.grand>0?C.words(c.grand):'';
  $('taxmode').textContent=c.inter?'Different states: IGST will be charged.':'Same state: CGST + SGST (half each) will be charged.';
  var nonlatin=/[^\x00-\x7f\u2018\u2019\u201c\u201d\u20b9]/.test(JSON.stringify(inv));
  $('warn').textContent=nonlatin?'Note: Hindi or special letters cannot be printed in the PDF and will show as "?". Please use English letters.':'';
  save();
}
function validate(){
  var inv=gather(),errs=[],ok=true;
  $('sGstErr').textContent='';$('bGstErr').textContent='';$('itemsErr').textContent='';
  [['sName','Enter your shop name.'],['bName','Enter customer name.'],['iNo','Enter invoice number.'],['iDate','Choose invoice date.']].forEach(function(p){var e=$(p[0]);var bad=!e.value.trim();e.classList.toggle('bad',bad);if(bad)errs.push(p[1])});
  if(inv.sellerGst&&!C.GSTIN.test(inv.sellerGst)){$('sGstErr').textContent='GSTIN looks wrong. It has 15 letters/numbers, e.g. 09ABCDE1234F1Z5.';errs.push('x')}
  if(inv.sellerGst&&C.GSTIN.test(inv.sellerGst)&&inv.sellerGst.slice(0,2)!==inv.sellerState){$('sGstErr').textContent='GSTIN starts with '+inv.sellerGst.slice(0,2)+' ('+(C.STATES[inv.sellerGst.slice(0,2)]||'?')+') but state is different. Please check.';errs.push('x')}
  if(inv.buyerGst&&!C.GSTIN.test(inv.buyerGst)){$('bGstErr').textContent='GSTIN looks wrong. Leave empty if customer has none.';errs.push('x')}
  var good=0;
  items.forEach(function(r){var o=r.o,bad=false,q=C.num(o.qty.value),rt=C.num(o.rate.value);
    [o.desc,o.qty,o.rate,o.disc].forEach(function(i){i.classList.remove('bad')});
    if(!o.desc.value.trim()){o.desc.classList.add('bad');bad=true}
    if(!(q>0)||!/^\d*\.?\d*$/.test(o.qty.value.trim())){o.qty.classList.add('bad');bad=true}
    if(!(rt>0)||!/^\d*\.?\d*$/.test(o.rate.value.trim())){o.rate.classList.add('bad');bad=true}
    var d=C.num(o.disc.value);if(o.disc.value.trim()&&(d<0||d>100||!/^\d*\.?\d*$/.test(o.disc.value.trim()))){o.disc.classList.add('bad');bad=true}
    if(bad)errs.push('item');else good++});
  if(errs.length){if(errs.indexOf('item')>-1)$('itemsErr').textContent='Please fill item name, quantity and rate (numbers only) in every item.';var first=document.querySelector('.bad,.err:not(:empty)');if(first)first.scrollIntoView({block:'center',behavior:'smooth'});return false}
  return true;
}
function dateText(v){var p=v.split('-');return p[2]+'/'+p[1]+'/'+p[0]}
$('pdf').addEventListener('click',function(){
  recalc();if(!validate())return;
  var inv=cur.inv;inv.dateText=dateText(inv.date);
  var doc=GstPdf.build(inv,cur.c);
  var name='invoice-'+inv.number.replace(/[^A-Za-z0-9_-]+/g,'-')+'.pdf';
  doc.save(name);
  try{var n=inv.number.match(/^(.*?)(\d+)$/);if(n){localStorage.setItem('gst_next',n[1]+String(parseInt(n[2],10)+1).padStart(n[2].length,'0'))}}catch(e){}
});
$('add').addEventListener('click',function(){addItem();recalc();var l=items[items.length-1];l.o.desc.focus()});
$('reset').addEventListener('click',function(){
  if(!confirm('Start a new invoice? Customer and items will be cleared. Shop details are kept.'))return;
  ['bName','bAddr','bGst','bPh','iNote'].forEach(function(i){$(i).value=''});$('items').innerHTML='';items=[];addItem();nextNo();$('iDate').value=today();recalc();
});
$('remember').addEventListener('change',save);
['sName','sAddr','sGst','sPh','sState','sPay','bName','bAddr','bGst','bPh','bState','iNo','iDate','iNote'].forEach(function(i){$(i).addEventListener('input',recalc);$(i).addEventListener('change',recalc)});
function today(){var d=new Date(),m=String(d.getMonth()+1).padStart(2,'0'),dd=String(d.getDate()).padStart(2,'0');return d.getFullYear()+'-'+m+'-'+dd}
function nextNo(){var v='INV-001';try{v=localStorage.getItem('gst_next')||v}catch(e){}$('iNo').value=v}
function save(){try{
  localStorage.setItem('gst_rem',$('remember').checked?'1':'');
  if($('remember').checked)localStorage.setItem('gst_shop',JSON.stringify({n:$('sName').value,a:$('sAddr').value,g:$('sGst').value,p:$('sPh').value,s:$('sState').value,pay:$('sPay').value}));else localStorage.removeItem('gst_shop');
}catch(e){}}
function load(){try{
  var r=localStorage.getItem('gst_rem');if(r==='')$('remember').checked=false;
  if(r!==''){var d=JSON.parse(localStorage.getItem('gst_shop')||'null');if(d){$('sName').value=d.n||'';$('sAddr').value=d.a||'';$('sGst').value=d.g||'';$('sPh').value=d.p||'';$('sState').value=d.s||'09';$('bState').value=d.s||'09';$('sPay').value=d.pay||''}}
}catch(e){}}
load();nextNo();$('iDate').value=today();addItem();recalc();
if('serviceWorker' in navigator&&location.protocol.indexOf('http')===0)navigator.serviceWorker.register('sw.js').catch(function(){});
window.__gst={gather:gather};
})();
