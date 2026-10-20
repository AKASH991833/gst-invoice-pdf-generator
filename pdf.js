(function(root){
'use strict';
function latin(s){return String(s==null?'':s).replace(/[\u2018\u2019]/g,"'").replace(/[\u201c\u201d]/g,'"').replace(/\u20b9/g,'Rs.').replace(/[^\x20-\x7e\n]/g,'?')}
function build(inv,c){
  var J=root.jspdf.jsPDF,doc=new J({unit:'mm',format:'a4',compress:true}),W=210,M=12,y=0;
  var inr=GstCalc.inr,STATES=GstCalc.STATES;
  var BLUE=[11,95,255],INK=[18,20,43],GREY=[93,98,128],LINE=[200,205,225];
  function T(s,x,yy,o){doc.text(latin(s),x,yy,o)}
  function wrap(s,w){return doc.splitTextToSize(latin(s),w)}
  function head(){
    doc.setFillColor.apply(doc,BLUE);doc.rect(0,0,W,16,'F');
    doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(15);T('TAX INVOICE',M,10.5);
    doc.setFontSize(9);doc.setFont('helvetica','normal');T('Original for recipient',W-M,10.5,{align:'right'});
    y=24;
  }
  head();
  doc.setTextColor.apply(doc,INK);
  // seller left, meta right
  doc.setFont('helvetica','bold');doc.setFontSize(13);var sn=wrap(inv.sellerName,105);T(sn.join('\n'),M,y);y+=sn.length*5.5;
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor.apply(doc,GREY);
  var lines=[];if(inv.sellerAddr)lines=lines.concat(wrap(inv.sellerAddr,105));
  if(inv.sellerGst)lines.push('GSTIN: '+inv.sellerGst);if(inv.sellerPhone)lines.push('Phone: '+inv.sellerPhone);
  lines.push('State: '+STATES[inv.sellerState]+' ('+inv.sellerState+')');
  T(lines.join('\n'),M,y);var yl=y+lines.length*4.4;
  // meta box
  var mx=130,my=22;doc.setDrawColor.apply(doc,LINE);doc.roundedRect(mx,my,W-M-mx,24,2,2);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor.apply(doc,GREY);T('Invoice No.',mx+3,my+6);T('Date',mx+3,my+13);T('Place of supply',mx+3,my+20);
  doc.setFont('helvetica','bold');doc.setTextColor.apply(doc,INK);T(inv.number,W-M-3,my+6,{align:'right'});T(inv.dateText,W-M-3,my+13,{align:'right'});T(STATES[inv.buyerState],W-M-3,my+20,{align:'right'});
  y=Math.max(yl,my+24)+5;
  doc.setDrawColor.apply(doc,LINE);doc.line(M,y,W-M,y);y+=6;
  // buyer
  doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor.apply(doc,BLUE);T('BILL TO',M,y);y+=5;
  doc.setTextColor.apply(doc,INK);doc.setFontSize(11.5);var bn=wrap(inv.buyerName,120);T(bn.join('\n'),M,y);y+=bn.length*5;
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor.apply(doc,GREY);
  var bl=[];if(inv.buyerAddr)bl=bl.concat(wrap(inv.buyerAddr,120));if(inv.buyerGst)bl.push('GSTIN: '+inv.buyerGst);if(inv.buyerPhone)bl.push('Phone: '+inv.buyerPhone);bl.push('State: '+STATES[inv.buyerState]+' ('+inv.buyerState+')');
  T(bl.join('\n'),M,y);y+=bl.length*4.4+4;
  // table
  var cols=[{h:'#',w:8,a:'center'},{h:'Description',w:56,a:'left'},{h:'HSN',w:16,a:'center'},{h:'Qty',w:16,a:'right'},{h:'Rate',w:22,a:'right'},{h:'Disc',w:11,a:'right'},{h:'Taxable',w:22,a:'right'},{h:'GST%',w:11,a:'right'},{h:'Amount',w:24,a:'right'}];
  var tw=cols.reduce(function(a,b){return a+b.w},0),sc=(W-2*M)/tw;cols.forEach(function(k){k.w*=sc});
  function thead(){
    doc.setFillColor(238,242,255);doc.rect(M,y,W-2*M,8,'F');doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor.apply(doc,INK);
    var x=M;cols.forEach(function(k){var tx=k.a==='left'?x+2:k.a==='center'?x+k.w/2:x+k.w-2;T(k.h,tx,y+5.4,{align:k.a});x+=k.w});y+=8;
  }
  thead();
  doc.setFont('helvetica','normal');doc.setFontSize(9);
  c.rows.forEach(function(r,i){
    var d=wrap(r.desc||'-',cols[1].w-4),h=Math.max(7,d.length*4.2+3);
    if(y+h>262){doc.addPage();head();y=22;thead();doc.setFont('helvetica','normal');doc.setFontSize(9)}
    doc.setTextColor.apply(doc,INK);var x=M,vals=[String(i+1),null,r.hsn||'-',String(r.qty)+(r.unit?' '+r.unit:''),inr(r.rate),r.disc?r.disc+'%':'-',inr(r.taxable),String(r.gst),inr(r.total)];
    cols.forEach(function(k,j){
      if(j===1)T(d.join('\n'),x+2,y+4.8);else{var tx=k.a==='center'?x+k.w/2:x+k.w-2;T(vals[j],tx,y+4.8,{align:k.a})}
      x+=k.w});
    y+=h;doc.setDrawColor(225,228,240);doc.line(M,y,W-M,y);
  });
  y+=5;
  // totals
  if(y>215){doc.addPage();head();y=22}
  var bx=122,bw=W-M-bx;
  function row(l,v,bold){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(bold?12:9.5);doc.setTextColor.apply(doc,bold?INK:GREY);T(l,bx,y);doc.setTextColor.apply(doc,INK);T(v,W-M,y,{align:'right'});y+=bold?7:5.2}
  var ty=y;
  if(c.discount)row('Discount','- Rs. '+inr(c.discount));
  row('Taxable value','Rs. '+inr(c.taxable));
  if(c.inter)row('IGST','Rs. '+inr(c.igst));else{row('CGST','Rs. '+inr(c.cgst));row('SGST','Rs. '+inr(c.sgst))}
  if(c.roundOff)row('Round off',(c.roundOff<0?'- ':'')+'Rs. '+inr(Math.abs(c.roundOff)));
  doc.setDrawColor.apply(doc,BLUE);doc.line(bx,y-2,W-M,y-2);y+=2;row('GRAND TOTAL','Rs. '+inr(c.grand),true);
  // left: words + pay + note
  var ly=ty;doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor.apply(doc,BLUE);T('AMOUNT IN WORDS',M,ly);ly+=4.5;
  doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor.apply(doc,INK);var wl=wrap(GstCalc.words(c.grand),100);T(wl.join('\n'),M,ly);ly+=wl.length*4.4+4;
  if(inv.pay){doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor.apply(doc,BLUE);T('PAYMENT DETAILS',M,ly);ly+=4.5;doc.setFont('helvetica','normal');doc.setFontSize(9.5);doc.setTextColor.apply(doc,INK);var pl=wrap(inv.pay,100);T(pl.join('\n'),M,ly);ly+=pl.length*4.4+4}
  if(inv.note){doc.setFont('helvetica','bold');doc.setFontSize(8.5);doc.setTextColor.apply(doc,BLUE);T('NOTE',M,ly);ly+=4.5;doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor.apply(doc,GREY);var nl=wrap(inv.note,100);T(nl.join('\n'),M,ly);ly+=nl.length*4+4}
  y=Math.max(y,ly)+10;
  if(y>262){doc.addPage();head();y=30}
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor.apply(doc,GREY);T('For '+inv.sellerName,W-M,y,{align:'right'});T('Authorised signatory',W-M,y+16,{align:'right'});
  // footer on every page
  var n=doc.getNumberOfPages();for(var p=1;p<=n;p++){doc.setPage(p);doc.setFontSize(8);doc.setTextColor.apply(doc,GREY);T('This is a computer generated invoice.',M,290);T('Page '+p+' of '+n,W-M,290,{align:'right'})}
  return doc;
}
root.GstPdf={build:build,latin:latin};
})(typeof self!=='undefined'?self:this);
