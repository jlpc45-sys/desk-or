/* ================================================================
   ESPACE « OR » — XAUUSD (et XAGUSD)
   - Choppiness Index 14 en 1 h et en daily : tendance ou range ?
   - Niveaux de l'or : veille, pivots, ATR, plus haut / bas 20 jours
   - Graphique TradingView XAUUSD 1 h avec le Choppiness Index
   Bougies : Binance Futures (XAUUSDT / XAGUSDT, sans clé, CORS ouvert).
   Si l'or n'y répond pas : PAXG (Binance spot), qui suit l'once d'or.
   ================================================================ */
(function(){
"use strict";
var CK=window.CK,u=CK.u,esc=u.esc,nf=u.nf;
var FAPI="https://fapi.binance.com/fapi/v1/klines",SPOT="https://api.binance.com/api/v3/klines";
var N=14,LO=38.2,HI=61.8;
/* Actifs suivis : sources dans l'ordre d'essai */
var A=[
  {k:"XAU",n:"Or",sym:"XAUUSD",tv:"OANDA:XAUUSD",d:2,src:[[FAPI,"XAUUSDT","Binance Futures XAUUSDT"],[SPOT,"PAXGUSDT","PAXG (Binance), suit l'once d'or"]]},
  {k:"XAG",n:"Argent",sym:"XAGUSD",tv:"OANDA:XAGUSD",d:3,src:[[FAPI,"XAGUSDT","Binance Futures XAGUSDT"]]}
];
var G={};               /* G[k] = {h1:[bougies], d1:[bougies], src:"…", ts} */
var tvDone=false;

function kl(base,sym,iv,lim){return u.fetchJSON(base+"?symbol="+sym+"&interval="+iv+"&limit="+lim).then(function(a){
  if(!Array.isArray(a)||a.length<N+2)throw new Error("Pas assez de bougies");
  return a.map(function(c){return {ts:+c[0],o:+c[1],h:+c[2],l:+c[3],c:+c[4]};});});}
function loadOne(a){
  var i=0;
  function tryNext(){if(i>=a.src.length)return Promise.reject(new Error("Aucune source"));var s=a.src[i++];
    return Promise.all([kl(s[0],s[1],"1h",200),kl(s[0],s[1],"1d",200)]).then(function(r){G[a.k]={h1:r[0],d1:r[1],src:s[2],ts:Date.now()};},tryNext);}
  return tryNext().catch(function(){G[a.k]={err:true,ts:Date.now()};});
}
function load(){return Promise.all(A.map(loadOne)).then(function(){render();if(CK.computeFactors)CK.computeFactors();});}

/* ---------- Calculs ---------- */
function tr(c,p){return p?Math.max(c.h-c.l,Math.abs(c.h-p.c),Math.abs(c.l-p.c)):c.h-c.l;}
/* Choppiness Index : 100 · log10( Σ TR(n) / (plus haut(n) − plus bas(n)) ) / log10(n) */
function chopSeries(c){var out=[];for(var i=N;i<c.length;i++){var s=0,hh=-Infinity,ll=Infinity;
  for(var j=i-N+1;j<=i;j++){s+=tr(c[j],c[j-1]);if(c[j].h>hh)hh=c[j].h;if(c[j].l<ll)ll=c[j].l;}
  out.push(hh>ll?100*Math.log10(s/(hh-ll))/Math.log10(N):null);}return out.filter(function(x){return x!=null&&isFinite(x);});}
function atr(c,n){if(c.length<n+1)return null;var s=0;for(var i=c.length-n;i<c.length;i++)s+=tr(c[i],c[i-1]);return s/n;}
function zone(v){return v>=HI?{k:"range",t:"Range / chop",d:"Marché sans direction : les cassures échouent souvent, on joue plutôt les bornes.",c:"warn"}:
  v<=LO?{k:"trend",t:"Tendance",d:"Le marché avance dans un sens : on suit le mouvement plutôt que de le contrer.",c:"up"}:
  {k:"mid",t:"Neutre",d:"Ni vraie tendance ni vrai range : on attend que le Chop sorte de la zone.",c:""};}
CK.goldChop=function(k,tf){var g=G[k||"XAU"];if(!g||g.err)return null;var s=chopSeries(tf==="d1"?g.d1:g.h1);return s.length?s[s.length-1]:null;};

/* ---------- Affichage : Choppiness ---------- */
function spark(s){var v=s.slice(-48),W=220,H=44;if(v.length<2)return "";
  var y=function(x){return (H-(Math.max(0,Math.min(100,x))/100)*H).toFixed(1);},st=W/(v.length-1);
  var d=v.map(function(x,i){return (i?"L":"M")+(i*st).toFixed(1)+" "+y(x);}).join(" ");
  return '<svg class="gd-spark" viewBox="0 0 '+W+' '+H+'" preserveAspectRatio="none" aria-hidden="true">'+
    '<rect class="gd-zr" x="0" y="0" width="'+W+'" height="'+y(HI)+'"/><rect class="gd-zt" x="0" y="'+y(LO)+'" width="'+W+'" height="'+(H-y(LO))+'"/>'+
    '<line class="gd-ln" x1="0" x2="'+W+'" y1="'+y(HI)+'" y2="'+y(HI)+'"/><line class="gd-ln" x1="0" x2="'+W+'" y1="'+y(LO)+'" y2="'+y(LO)+'"/>'+
    '<path class="gd-pt" d="'+d+'"/></svg>';}
function gauge(label,s,sub){
  if(!s||!s.length)return '<div class="gd-g"><div class="gd-gh"><b>'+label+'</b></div><div class="empty">Données indisponibles</div></div>';
  var v=s[s.length-1],p=s.length>3?s[s.length-4]:v,z=zone(v),dv=v-p;
  var tend=Math.abs(dv)<1.5?"stable":dv>0?"monte : le marché se comprime":"baisse : un mouvement se libère";
  return '<div class="gd-g gd-'+z.k+'"><div class="gd-gh"><b>'+label+'</b><em>'+sub+'</em></div>'+
    '<div class="gd-gv"><span class="gd-num">'+nf(v,1)+'</span><span class="gd-tag '+z.c+'">'+z.t+'</span></div>'+
    '<div class="gd-bar"><i style="left:'+Math.max(0,Math.min(100,v)).toFixed(1)+'%"></i><span style="left:'+LO+'%"></span><span style="left:'+HI+'%"></span></div>'+
    '<div class="gd-sc"><span>Tendance</span><span>38,2</span><span>61,8</span><span>Range</span></div>'+
    spark(s)+'<p class="gd-tx">'+z.d+' Sur les 3 dernières bougies, le Chop <b>'+tend+'</b>.</p></div>';}
function renderChop(){
  var el=u.$("gold");if(!el)return;
  el.innerHTML=A.map(function(a){var g=G[a.k],m=CK.S.mk[a.k];
    var head='<div class="gd-ah"><button type="button" class="gd-sym" data-chart="'+a.tv+'" data-title="'+a.sym+'">'+a.sym+'</button><span class="gd-px">'+(m&&m.c!=null?nf(m.c,a.d):"—")+'</span>'+
      (m&&m.ch!=null?'<span class="'+u.cls(m.ch)+'">'+u.pct(m.ch)+'</span>':"")+'<span class="gd-n">'+a.n+'</span></div>';
    if(!g)return '<div class="gd-a">'+head+'<div class="empty">Chargement des bougies…</div></div>';
    if(g.err)return '<div class="gd-a">'+head+'<div class="empty">Bougies indisponibles pour le moment (Binance ne répond pas). Nouvel essai dans 5 min.</div></div>';
    return '<div class="gd-a">'+head+'<div class="gd-gs">'+gauge("Chop 1 h",chopSeries(g.h1),"14 bougies 1 h")+gauge("Chop daily",chopSeries(g.d1),"14 jours")+'</div>'+
      '<div class="gd-src">Source des bougies : '+esc(g.src)+' · mis à jour '+u.parisTime(g.ts)+'</div></div>';}).join("")+
    '<div class="gd-leg">Choppiness Index (14) : sous 38,2 le marché est en tendance, au-dessus de 61,8 il est en range. Combine les deux unités : un daily en tendance avec un 1 h qui sort du range donne souvent les meilleurs départs.</div>';
}

/* ---------- Affichage : niveaux de l'or ---------- */
function renderLevels(){
  var el=u.$("goldlv");if(!el)return;var g=G.XAU;
  if(!g||g.err||!g.d1||g.d1.length<22){el.innerHTML='<div class="empty">'+(g&&g.err?"Bougies de l'or indisponibles pour le moment.":"Chargement des niveaux…")+'</div>';return;}
  var d=g.d1,t=d[d.length-1],y=d[d.length-2],m=CK.S.mk.XAU,px=m&&m.c!=null?m.c:t.c;
  var P=(y.h+y.l+y.c)/3,R1=2*P-y.l,S1=2*P-y.h,R2=P+(y.h-y.l),S2=P-(y.h-y.l),A14=atr(d.slice(0,-1),14);
  var last20=d.slice(-21,-1),H20=Math.max.apply(null,last20.map(function(c){return c.h;})),L20=Math.min.apply(null,last20.map(function(c){return c.l;}));
  var L=[["R2","Résistance 2",R2],["H20","Plus haut 20 jours",H20],["R1","Résistance 1",R1],["PDH","Plus haut d'hier",y.h],["HJ","Plus haut du jour",t.h],["P","Pivot du jour",P],
    ["LJ","Plus bas du jour",t.l],["PDL","Plus bas d'hier",y.l],["S1","Support 1",S1],["L20","Plus bas 20 jours",L20],["S2","Support 2",S2]];
  L.sort(function(a,b){return b[2]-a[2];});
  var rows="",placed=false;
  L.forEach(function(x){if(!placed&&px>=x[2]){rows+='<div class="gd-lr gd-now"><span class="lv-tag">PRIX</span><span>Prix actuel</span><b>'+nf(px,2)+'</b><span></span></div>';placed=true;}
    var dist=(x[2]/px-1)*100;rows+='<div class="gd-lr"><span class="lv-tag">'+x[0]+'</span><span>'+x[1]+'</span><b>'+nf(x[2],2)+'</b><span class="'+(dist>=0?"up":"down")+'">'+(dist>=0?"+":"")+nf(dist,2)+' %</span></div>';});
  if(!placed)rows+='<div class="gd-lr gd-now"><span class="lv-tag">PRIX</span><span>Prix actuel</span><b>'+nf(px,2)+'</b><span></span></div>';
  var used=A14?(t.h-t.l)/A14*100:null,tr2=trendTxt(m);
  el.innerHTML='<div class="gd-kp">'+
      '<div><em>ATR 14 jours</em><b>'+(A14?nf(A14,2)+" $":"—")+'</b></div>'+
      '<div><em>Range du jour</em><b>'+nf(t.h-t.l,2)+' $</b><span class="'+(used>100?"warn":"")+'">'+(used!=null?nf(used,0)+" % de l'ATR":"")+'</span></div>'+
      '<div><em>Tendance daily</em><b class="'+tr2.c+'">'+tr2.t+'</b><span>'+tr2.s+'</span></div></div>'+
    '<div class="gd-lv">'+rows+'</div>'+
    '<div class="gd-src">Bougies daily '+esc(g.src)+' (clôture 01:00 heure de Paris). Pivots classiques calculés sur la veille.</div>';
}
function trendTxt(m){
  if(!m||m.s20==null||m.s50==null||m.s200==null)return {t:"—",s:"moyennes en chargement",c:""};
  var up=m.c>m.s50&&m.s50>m.s200,dn=m.c<m.s50&&m.s50<m.s200;
  var adx=m.adx!=null?"ADX "+nf(m.adx,0)+(m.adx>=25?" · tendance forte":" · tendance faible"):"";
  return up?{t:"Haussière",s:"prix > MM50 > MM200 · "+adx,c:"up"}:dn?{t:"Baissière",s:"prix < MM50 < MM200 · "+adx,c:"down"}:{t:"Sans direction",s:"moyennes mélangées · "+adx,c:""};
}

/* ---------- Graphique TradingView avec le Choppiness Index ---------- */
function renderTV(){
  var box=u.$("goldtv");if(!box||tvDone||!CK.loadTV)return;
  var sec=box.closest(".mod");if(sec&&(sec.hidden||!sec.offsetParent))return;   /* chargé seulement quand l'espace est ouvert */
  tvDone=true;box.innerHTML='<div class="empty">Chargement du graphique…</div>';
  CK.loadTV().then(function(){box.innerHTML='<div id="goldtvc" style="height:100%"></div>';
    var th=document.documentElement.getAttribute("data-theme")==="light"?"light":"dark";
    new window.TradingView.widget({container_id:"goldtvc",symbol:"OANDA:XAUUSD",interval:"60",theme:th,autosize:true,locale:"fr",timezone:"Europe/Paris",style:"1",
      hide_side_toolbar:false,allow_symbol_change:true,studies:["ChoppinessIndex@tv-basicstudies"]});
  }).catch(function(){setTimeout(function(){tvDone=false;},60000);box.innerHTML='<div class="empty">Le graphique TradingView n\'a pas pu se charger.</div>';});
}

function render(){renderChop();renderLevels();renderTV();}
CK.gold={boot:function(){
  render();load();
  setInterval(load,300000);                                  /* bougies : toutes les 5 min */
  setInterval(renderTV,1500);                                /* graphique : dès que l'espace s'ouvre */
},paint:function(){if(!document.hidden){renderChop();renderLevels();if(CK.corrRender)CK.corrRender();}},state:function(){return G;},zone:zone};
})();
