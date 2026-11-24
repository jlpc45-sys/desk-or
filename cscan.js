/* ================================================================
   SCREENER MATIÈRES PREMIÈRES & FOREX
   Métaux, énergie, agricoles et paires de devises, lus en direct sur le
   scanner public de TradingView (sans clé). Une ligne = un marché :
   prix, variations, RSI, ADX, position face aux moyennes, ATR, et des
   étiquettes qui disent ce que le marché prépare.
   ================================================================ */
(function(){
"use strict";
var CK=window.CK,u=CK.u,esc=u.esc,nf=u.nf;
var SCAN="https://scanner.tradingview.com/global/scan";
var COLS=["close","change","Perf.W","Perf.1M","RSI","ADX","SMA20","SMA50","SMA200","ATR"];
var GR=[["all","Tous"],["met","Métaux"],["nrj","Énergie"],["agri","Agricoles"],["fx","Forex"]];
var L=[
  ["met","OANDA:XAUUSD|TVC:GOLD","XAUUSD","Or",2],["met","OANDA:XAGUSD|TVC:SILVER|FX_IDC:XAGUSD","XAGUSD","Argent",3],["met","OANDA:XPTUSD|TVC:PLATINUM","XPTUSD","Platine",2],["met","OANDA:XPDUSD|TVC:PALLADIUM","XPDUSD","Palladium",2],["met","OANDA:XCUUSD|COMEX:HG1!|CAPITALCOM:COPPER","XCUUSD","Cuivre",4],
  ["nrj","FX:USOIL|TVC:USOIL|NYMEX:CL1!","WTI","Pétrole WTI",2],["nrj","FX:UKOIL|TVC:UKOIL|ICEEUR:BRN1!","BRENT","Pétrole Brent",2],["nrj","OANDA:NATGASUSD|NYMEX:NG1!|CAPITALCOM:NATURALGAS","NATGAS","Gaz naturel",3],
  ["agri","OANDA:WHEATUSD|CBOT:ZW1!|CAPITALCOM:WHEAT","WHEAT","Blé",3],["agri","OANDA:CORNUSD|CBOT:ZC1!|CAPITALCOM:CORN","CORN","Maïs",3],["agri","OANDA:SOYBNUSD|CBOT:ZS1!|CAPITALCOM:SOYBEAN","SOYBN","Soja",3],["agri","OANDA:SUGARUSD|ICEUS:SB1!|CAPITALCOM:SUGAR","SUGAR","Sucre",4],
  ["fx","TVC:DXY","DXY","Indice dollar",3],["fx","FX:EURUSD","EURUSD","Euro / dollar",5],["fx","FX:GBPUSD","GBPUSD","Livre / dollar",5],["fx","FX:USDJPY","USDJPY","Dollar / yen",3],
  ["fx","FX:AUDUSD","AUDUSD","Dollar australien",5],["fx","FX:USDCAD","USDCAD","Dollar / canadien",5],["fx","FX:USDCHF","USDCHF","Dollar / franc suisse",5],["fx","FX:EURJPY","EURJPY","Euro / yen",3]
].map(function(x){var c=x[1].split("|");return {g:x[0],tv:c[0],alt:c,s:x[2],n:x[3],d:x[4]};});
var PR=[["","Tout"],["trend","Tendances fortes"],["range","Ranges"],["ext","RSI extrêmes"],["ma200","Sur la MM200"]];
var st={g:CK.ls("csG")||"all",p:CK.ls("csP")||"",sort:CK.ls("csS")||"adx",dir:-1,ts:0,err:false};
var D={};

/* Une requête par famille ; si une famille échoue (symbole refusé), on réessaie marché par marché,
   pour qu'un seul symbole refusé ne vide pas tout le tableau. */
/* Chaque marché a un symbole principal et des équivalents : le premier qui répond devient son symbole */
function ask(list){var tk=[];list.forEach(function(x){x.alt.forEach(function(t){if(tk.indexOf(t)<0)tk.push(t);});});
  return u.fetchJSON(SCAN,{method:"POST",headers:{"Content-Type":"text/plain;charset=UTF-8"},body:JSON.stringify({symbols:{tickers:tk},columns:COLS})})
  .then(function(j){var by={},n=0;(j.data||[]).forEach(function(o){if(o.d&&o.d[0]!=null)by[o.s]=o.d;});
    list.forEach(function(x){for(var i=0;i<x.alt.length;i++){var d=by[x.alt[i]];if(d){x.tv=x.alt[i];n++;D[x.tv]={c:d[0],ch:d[1],pw:d[2],pm:d[3],rsi:d[4],adx:d[5],s20:d[6],s50:d[7],s200:d[8],atr:d[9]};break;}}});return n;});}
function load(){
  var fams=GR.slice(1).map(function(g){return L.filter(function(x){return x.g===g[0];});});
  return Promise.all(fams.map(function(f){return ask(f).catch(function(e){st.why=String(e&&e.message||e);
      return Promise.all(f.map(function(x){return ask([x]).catch(function(e2){st.why=String(e2&&e2.message||e2);if(window.console)console.warn("[Desk] scanner TradingView refuse",x.tv,e2);return 0;});}));});}))
    .then(function(){var ok=L.filter(function(x){return D[x.tv];}).length;st.ok=ok;if(ok){st.ts=Date.now();st.err=false;}else st.err=true;render();});
}

/* Ce que le marché prépare : étiquettes simples, chacune avec sa règle */
function tags(m){
  var T=[];if(!m||m.c==null)return T;
  var up=m.s20!=null&&m.s50!=null&&m.s200!=null&&m.c>m.s20&&m.s20>m.s50&&m.s50>m.s200,dn=m.s20!=null&&m.s50!=null&&m.s200!=null&&m.c<m.s20&&m.s20<m.s50&&m.s50<m.s200;
  if(m.adx>=25&&up)T.push(["trend","Tendance haussière forte","up","Prix > MM20 > MM50 > MM200 et ADX ≥ 25."]);
  else if(m.adx>=25&&dn)T.push(["trend","Tendance baissière forte","down","Prix < MM20 < MM50 < MM200 et ADX ≥ 25."]);
  if(m.adx!=null&&m.adx<18)T.push(["range","Range / compression","warn","ADX sous 18 : pas de tendance, l'énergie s'accumule avant une cassure."]);
  if(m.rsi>=70)T.push(["ext","Surachat","down","RSI 14 daily ≥ 70 : le mouvement est tendu, risque de repli."]);
  if(m.rsi!=null&&m.rsi<=30)T.push(["ext","Survente","up","RSI 14 daily ≤ 30 : le mouvement est tendu, risque de rebond."]);
  if(m.s200&&m.atr&&Math.abs(m.c-m.s200)<=m.atr)T.push(["ma200","Au contact de la MM200","","Le prix est à moins d'un ATR de sa moyenne 200 jours : niveau de décision."]);
  return T;
}
function val(x,k){var m=D[x.tv]||{};if(k==="name")return x.s;if(k==="atrp")return m.atr&&m.c?m.atr/m.c*100:null;if(k==="ma")return m.s200?(m.c/m.s200-1)*100:null;return m[k];}
function fmtPx(v,d){return v==null?"—":nf(v,d);}
function sg(v,d){return v==null?"—":(v>0?"+":"")+nf(v,d==null?2:d)+" %";}

function render(){
  var host=u.$("cscan");if(!host)return;
  var rows=L.filter(function(x){return st.g==="all"||x.g===st.g;}).map(function(x){return {x:x,m:D[x.tv],t:tags(D[x.tv])};})
    .filter(function(r){return !st.p||r.t.some(function(t){return t[0]===st.p;});});
  rows.sort(function(a,b){var va=val(a.x,st.sort),vb=val(b.x,st.sort);if(va==null)return 1;if(vb==null)return -1;if(typeof va==="string")return va<vb?-st.dir:va>vb?st.dir:0;return (va-vb)*st.dir;});
  var H=[["name","Marché"],["c","Prix"],["ch","Jour"],["pw","Semaine"],["pm","Mois"],["rsi","RSI"],["adx","ADX"],["ma","vs MM200"],["atrp","ATR"],["","Ce que prépare le marché"]];
  var head='<tr>'+H.map(function(h){return '<th'+(h[0]?' data-cs-sort="'+h[0]+'" class="cs-s'+(st.sort===h[0]?" on":"")+'"':"")+'>'+h[1]+(st.sort===h[0]?(st.dir<0?" ↓":" ↑"):"")+'</th>';}).join("")+'</tr>';
  var body=rows.map(function(r){var m=r.m||{},x=r.x;
    return '<tr data-chart="'+x.tv+'" data-title="'+x.n+'"><td><b>'+x.s+'</b><em>'+x.n+'</em></td><td class="mono">'+fmtPx(m.c,x.d)+'</td>'+
      '<td class="mono '+u.cls(m.ch)+'">'+sg(m.ch)+'</td><td class="mono '+u.cls(m.pw)+'">'+sg(m.pw,1)+'</td><td class="mono '+u.cls(m.pm)+'">'+sg(m.pm,1)+'</td>'+
      '<td class="mono'+(m.rsi>=70?" down":m.rsi!=null&&m.rsi<=30?" up":"")+'">'+(m.rsi!=null?nf(m.rsi,0):"—")+'</td>'+
      '<td class="mono'+(m.adx>=25?" cs-hi":"")+'">'+(m.adx!=null?nf(m.adx,0):"—")+'</td>'+
      '<td class="mono '+u.cls(val(x,"ma"))+'">'+sg(val(x,"ma"),1)+'</td><td class="mono">'+(val(x,"atrp")!=null?nf(val(x,"atrp"),2)+" %":"—")+'</td>'+
      '<td class="cs-tags">'+(r.t.length?r.t.map(function(t){return '<span class="cs-tag '+t[2]+'" title="'+esc(t[3])+'">'+t[1]+'</span>';}).join(""):'<span class="cs-none">Rien de marquant</span>')+'</td></tr>';}).join("");
  var bar='<div class="cs-bar"><div class="cs-seg">'+GR.map(function(g){return '<button type="button" data-cs-g="'+g[0]+'" aria-pressed="'+(st.g===g[0])+'">'+g[1]+'</button>';}).join("")+'</div>'+
    '<div class="cs-seg">'+PR.map(function(p){return '<button type="button" data-cs-p="'+p[0]+'" aria-pressed="'+(st.p===p[0])+'">'+p[1]+'</button>';}).join("")+'</div></div>';
  var meta='<p class="cs-meta">'+(st.err&&!st.ts?'<b class="cs-err">Le scanner TradingView n\'a renvoyé aucune donnée'+(st.why?" (raison : "+esc(st.why)+")":"")+'. Nouvel essai dans 1 min.</b>':
    rows.length+" marché"+(rows.length>1?"s":"")+" · données daily TradingView"+(st.ts?" · mis à jour "+u.parisTime(st.ts):"")+" · clic sur une ligne : graphique · clic sur un titre : tri")+'</p>';
  host.innerHTML=bar+'<div class="cs-wrap"><table class="cs-t"><thead>'+head+'</thead><tbody>'+(body||'<tr><td colspan="10" class="cs-none">Aucun marché ne correspond à ce filtre en ce moment.</td></tr>')+'</tbody></table></div>'+meta;
}

/* Pour l'accueil : les marchés les plus en tendance */
CK.cscan={top:function(n){return L.map(function(x){return {x:x,m:D[x.tv],t:tags(D[x.tv])};}).filter(function(r){return r.m&&r.m.adx!=null;})
    .sort(function(a,b){return b.m.adx-a.m.adx;}).slice(0,n||3);},
  count:function(){return L.filter(function(x){return tags(D[x.tv]).length;}).length;},state:function(){return st;},
  boot:function(){
    var host=u.$("cscan");if(!host)return;
    host.addEventListener("click",function(e){
      var g=e.target.closest("[data-cs-g]"),p=e.target.closest("[data-cs-p]"),s=e.target.closest("[data-cs-sort]");
      if(g){st.g=g.getAttribute("data-cs-g");CK.ls("csG",st.g);render();}
      else if(p){st.p=p.getAttribute("data-cs-p");CK.ls("csP",st.p);render();}
      else if(s){var k=s.getAttribute("data-cs-sort");if(st.sort===k)st.dir=-st.dir;else{st.sort=k;st.dir=k==="name"?1:-1;}CK.ls("csS",st.sort);render();}
    });
    render();load();setInterval(function(){if(!document.hidden)load();},60000);
  }};
})();
