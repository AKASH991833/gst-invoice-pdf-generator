(function(root){
'use strict';
var STATES={'01':'Jammu & Kashmir','02':'Himachal Pradesh','03':'Punjab','04':'Chandigarh','05':'Uttarakhand','06':'Haryana','07':'Delhi','08':'Rajasthan','09':'Uttar Pradesh','10':'Bihar','11':'Sikkim','12':'Arunachal Pradesh','13':'Nagaland','14':'Manipur','15':'Mizoram','16':'Tripura','17':'Meghalaya','18':'Assam','19':'West Bengal','20':'Jharkhand','21':'Odisha','22':'Chhattisgarh','23':'Madhya Pradesh','24':'Gujarat','26':'Dadra & Nagar Haveli and Daman & Diu','27':'Maharashtra','29':'Karnataka','30':'Goa','31':'Lakshadweep','32':'Kerala','33':'Tamil Nadu','34':'Puducherry','35':'Andaman & Nicobar Islands','36':'Telangana','37':'Andhra Pradesh','38':'Ladakh'};
var GSTIN=/^[0-3][0-9][A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;
function r2(n){return Math.round((n+Number.EPSILON)*100)/100}
function num(v){var n=parseFloat(String(v).replace(/,/g,''));return isFinite(n)?n:0}
function compute(inv){
  var inter=inv.sellerState!==inv.buyerState,rows=[],taxable=0,cgst=0,sgst=0,igst=0,disc=0;
  (inv.items||[]).forEach(function(it){
    var q=num(it.qty),rate=num(it.rate),d=Math.min(100,Math.max(0,num(it.disc))),g=num(it.gst);
    var gross=r2(q*rate),dv=r2(gross*d/100),tv=r2(gross-dv),tax=r2(tv*g/100),c=0,s=0,i=0;
    if(inter){i=tax}else{c=r2(tax/2);s=r2(tax-c)}
    rows.push({desc:it.desc,hsn:it.hsn,qty:q,unit:it.unit,rate:rate,disc:d,gst:g,gross:gross,discAmt:dv,taxable:tv,cgst:c,sgst:s,igst:i,total:r2(tv+tax)});
    taxable=r2(taxable+tv);cgst=r2(cgst+c);sgst=r2(sgst+s);igst=r2(igst+i);disc=r2(disc+dv);
  });
  var sum=r2(taxable+cgst+sgst+igst),grand=Math.round(sum),ro=r2(grand-sum);
  return {inter:inter,rows:rows,taxable:taxable,cgst:cgst,sgst:sgst,igst:igst,discount:disc,tax:r2(cgst+sgst+igst),subtotal:sum,roundOff:ro,grand:grand};
}
var ONES=['','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
var TENS=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
function two(n){return n<20?ONES[n]:TENS[Math.floor(n/10)]+(n%10?' '+ONES[n%10]:'')}
function three(n){var h=Math.floor(n/100),r=n%100,s='';if(h)s=ONES[h]+' Hundred';if(r)s+=(s?' ':'')+two(r);return s}
function words(amount){
  var n=Math.floor(Math.abs(amount)),p=Math.round((Math.abs(amount)-n)*100),out=[];
  if(n===0)out.push('Zero');
  var cr=Math.floor(n/10000000);n%=10000000;var lk=Math.floor(n/100000);n%=100000;var th=Math.floor(n/1000);n%=1000;
  if(cr)out.push((cr>=100?three(cr):two(cr))+' Crore');if(lk)out.push(two(lk)+' Lakh');if(th)out.push(two(th)+' Thousand');if(n)out.push(three(n));
  var s='Rupees '+out.join(' ');if(p)s+=' and '+two(p)+' Paise';return s+' Only';
}
function inr(n){var neg=n<0;n=Math.abs(n);var s=n.toFixed(2),a=s.split('.'),i=a[0],l=i.slice(-3),o=i.slice(0,-3);if(o)l=o.replace(/\B(?=(\d{2})+(?!\d))/g,',')+','+l;return (neg?'-':'')+l+'.'+a[1]}
var api={STATES:STATES,GSTIN:GSTIN,compute:compute,words:words,inr:inr,r2:r2,num:num};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.GstCalc=api;
})(typeof self!=='undefined'?self:this);
