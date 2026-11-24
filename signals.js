/* ================================================================
   COCKPIT — Tableau des signaux
   Une ligne par indicateur : nom, valeur, lecture, force (3 crans).
   Survol = la ligne ressort, les autres s'effacent, la lecture complète s'affiche.
   Clic = épingler. Aucune note globale.
   ================================================================ */
(function(){
"use strict";
var CK=window.CK,S=CK.S,u=CK.u,esc=u.esc;
var FAM=[{nm:"Métaux",ks:["XAU","CHOP","XAG"]},{nm:"Dollar et taux",ks:["DXY","US10Y","EURUSD"]},{nm:"Risque et inflation",ks:["VIX","USOIL"]}];
var list,detail,hoverK=null,pinK=null,first=true;
function byK(){var m={};(S.factors||[]).forEach(function(f){m[f.k]=f;});return m;}
function famOf(k){for(var i=0;i<FAM.length;i++)if(FAM[i].ks.indexOf(k)>=0)return FAM[i].nm;return "";}
function glyph(f){return !f||f.na?"…":f.impact>0?"▲":f.impact<0?"▼":"●";}
/* L'état décrit l'indicateur (« dollar en hausse ») ; le verdict dit ce que ça implique pour le BTC.
   Les deux sont séparés pour ne jamais se contredire visuellement (flèche rouge + « hausse »). */
function verdict(f){return !f||f.na?"":f.impact>0?"Favorable":f.impact<0?"Défavorable":"Neutre";}
function render(){
  if(!list)return;var F=byK(),i=0;
  list.innerHTML=FAM.map(function(fm){
    return '<div class="sg-fam">'+fm.nm+'</div>'+fm.ks.map(function(k){var f=F[k]||{k:k,nm:k,na:true,val:"—",label:"Chargement"},st=CK.stClass(f),d=(i++)*45;
      return '<button type="button" class="sg '+st+(pinK===k?" pin":"")+'" data-k="'+k+'">'+
        '<span class="sg-nm"><span class="rv"><span style="animation-delay:'+(first?d:0)+'ms">'+esc(f.sh||f.nm)+'</span></span></span>'+
        '<span class="sg-v">'+esc(f.val||"—")+'</span>'+
        '<span class="sg-l">'+(f.na?"":'<em class="sg-e">'+verdict(f)+'</em>')+esc(f.na?"Chargement":f.label)+'</span>'+
        '<span class="sg-b">'+[1,2,3].map(function(n){return '<i class="'+(f.impact&&n<=f.str?"on":"")+'"></i>';}).join("")+'</span></button>';}).join("");
  }).join("");
  first=false;showDetail(hoverK||pinK||defaultK());
}
function defaultK(){var F=S.factors||[];var d=F.filter(function(f){return !f.na&&f.impact<0&&f.str>=2;})[0]||F.filter(function(f){return !f.na;})[0];return d?d.k:"XAU";}
/* Contexte : ce que c'est, pourquoi ça compte pour l'or, quoi surveiller */
var CTX={
  XAU:["L'once d'or cotée en dollars (XAUUSD).","C'est le marché que tu trades : sa structure (moyennes 20, 50 et 200 jours) dit dans quel sens les probabilités penchent.","Le prix par rapport aux moyennes 50 et 200 jours : au-dessus, on privilégie les achats sur repli."],
  CHOP:["Le Choppiness Index (14) de l'or, en 1 h et en daily.","Il dit si le marché avance (tendance) ou tourne en rond (range). Une stratégie de cassure marche en tendance et se fait piéger en range.","Sous 38,2 : tendance, on suit. Au-dessus de 61,8 : range, on joue les bornes. Un Chop qui retombe depuis le haut annonce souvent une cassure."],
  XAG:["L'once d'argent (XAGUSD), le « petit frère » de l'or, plus nerveux.","Quand l'or et l'argent montent ensemble, le mouvement est large et solide. Quand l'or monte seul, la hausse est plus fragile.","Le ratio Or/Argent (barre du haut) : en baisse pendant une hausse de l'or, le marché des métaux est sain."],
  DXY:["L'indice du dollar américain face à 6 grandes devises (euro, yen, livre…).","L'or est coté en dollars : quand le dollar monte, l'or coûte plus cher au reste du monde et la demande baisse. Or et DXY évoluent le plus souvent en sens inverse.","DXY en baisse : vent favorable à l'or. Dollar qui s'envole : prudence sur les achats."],
  US10Y:["Le taux des obligations d'État américaines à 10 ans.","L'or ne rapporte aucun intérêt : quand les taux montent, détenir de l'or coûte plus cher en manque à gagner. Les taux réels (taux moins inflation) sont son grand adversaire.","Taux en baisse : soutien pour l'or. Hausse rapide (souvent après le CPI ou la Fed) : vent contraire."],
  EURUSD:["La paire euro / dollar, la plus échangée au monde.","Elle représente 58 % de l'indice dollar : un EURUSD en hausse, c'est un dollar qui faiblit, ce qui aide l'or.","EURUSD et or dans le même sens : le dollar mène le jeu. Directions opposées : l'or bouge pour une autre raison (géopolitique, banques centrales)."],
  VIX:["L'indice de la peur de Wall Street : la volatilité attendue du S&P 500 sur 30 jours.","Quand la peur monte, les investisseurs vendent le risque et cherchent un refuge : l'or en profite souvent (sauf en cas de panique où tout est vendu pour lever du cash).","VIX qui grimpe au-dessus de 20 : demande de refuge. Pic brutal au-dessus de 30 : l'or peut baisser quelques jours avant de repartir."],
  USOIL:["Le pétrole brut américain (WTI).","Un pétrole cher fait monter l'inflation, et l'or sert de protection contre l'inflation. Les tensions au Moyen-Orient font souvent monter les deux en même temps.","Pétrole et or qui montent ensemble : thème inflation ou géopolitique. Pétrole qui chute : moins de soutien pour l'or."]
};
var REL={XAU:["CHOP","DXY"],CHOP:["XAU","XAG"],XAG:["XAU","DXY"],DXY:["EURUSD","US10Y"],US10Y:["DXY","XAU"],EURUSD:["DXY","XAU"],VIX:["XAU","US10Y"],USOIL:["US10Y","VIX"]};
var CORK={DXY:"USD",EURUSD:"EURUSD",XAG:"XAG"};
function ctxHTML(k){var c=CTX[k];if(!c)return "";var F=byK();
  var rel=(REL[k]||[]).map(function(r){var g=F[r];if(!g)return "";return '<button type="button" class="md-rel '+CK.stClass(g)+'" data-rel="'+r+'">'+esc(g.sh||g.nm)+' <em>'+esc(g.na?"—":g.label)+'</em></button>';}).join("");
  return '<div class="md-ctx"><div><span>C\'est quoi</span><p>'+esc(c[0])+'</p></div><div><span>Pourquoi ça compte</span><p>'+esc(c[1])+'</p></div><div><span>À surveiller</span><p>'+esc(c[2])+'</p></div>'+
    (rel?'<div class="md-rels"><span>À croiser avec</span><div>'+rel+'</div></div>':'')+
    (CORK[k]&&CK.corrText&&CK.corrText(CORK[k])?'<div class="md-rels"><span>Lien mesuré avec l\'or</span><p>'+esc(CK.corrText(CORK[k]))+'</p></div>':'')+'</div>';}
function showDetail(k){
  if(!detail)return;var f=(S.factors||[]).filter(function(x){return x.k===k;})[0];
  if(!f){detail.innerHTML='<div class="empty">Analyse des marchés en cours…</div>';return;}
  var proof=(f.proof||[]).map(function(p){return '<span>'+esc(p[0])+'</span><b>'+esc(p[1])+'</b>';}).join("");
  detail.innerHTML='<div class="md-in"><div class="md-k">'+esc(famOf(k))+(f.sub?" · "+esc(f.sub):"")+(pinK===k?" · épinglé":"")+'</div>'+
    '<div class="md-h"><h3>'+esc(f.nm)+'</h3><span class="st '+CK.stClass(f)+'">'+CK.stLabel(f)+'</span></div>'+
    '<div class="md-v">'+esc(f.val)+(f.ch!=null?' <span class="'+u.cls(f.ch)+'">'+u.pct(f.ch)+'</span>':'')+'</div>'+
    '<span class="md-sec">Lecture actuelle</span><p class="md-t">'+f.text+'</p>'+ctxHTML(k)+(proof?'<span class="md-sec">Les chiffres</span><div class="proof">'+proof+'</div>':'')+
    '<div class="md-foot">'+(f.chart?'<button type="button" class="md-a" data-chart="'+f.chart+'" data-title="'+esc(f.nm)+'">Vérifier sur le graphique</button>':'')+
    (f.rule?'<details class="md-rule"><summary>Voir la règle</summary><p>'+esc(f.rule)+'</p></details>':'')+'</div></div>';
}
function wire(){
  if(detail)detail.addEventListener("click",function(e){var r=e.target.closest("[data-rel]");if(!r)return;var k=r.getAttribute("data-rel");pinK=k;
    [].forEach.call(list.querySelectorAll(".sg"),function(x){x.classList.toggle("pin",x.getAttribute("data-k")===pinK);});showDetail(k);});
  list.addEventListener("pointerover",function(e){var r=e.target.closest(".sg");if(!r)return;var k=r.getAttribute("data-k");if(k!==hoverK){hoverK=k;showDetail(k);}});
  list.addEventListener("pointerleave",function(){hoverK=null;showDetail(pinK||defaultK());});
  list.addEventListener("focusin",function(e){var r=e.target.closest(".sg");if(r)showDetail(r.getAttribute("data-k"));});
  list.addEventListener("click",function(e){var r=e.target.closest(".sg");if(!r)return;var k=r.getAttribute("data-k");pinK=pinK===k?null:k;
    [].forEach.call(list.querySelectorAll(".sg"),function(x){x.classList.toggle("pin",x.getAttribute("data-k")===pinK);});showDetail(k);});
}
/* Story : le tableau dessiné sur canvas */
function drawCanvas(x,ox,oy,width,P){
  var F=byK(),y=oy,rowH=62,famH=44;x.save();x.textBaseline="middle";
  x.fillStyle=P.faint||P.muted;x.font="600 20px Barlow, sans-serif";x.textAlign="right";try{x.letterSpacing="2px";}catch(e){}x.fillText("EFFET SUR L'OR",ox+width,y+famH/2);try{x.letterSpacing="0px";}catch(e){}x.textAlign="left";
  FAM.forEach(function(fm){
    x.fillStyle=P.muted;x.font="600 22px Barlow, sans-serif";try{x.letterSpacing="3px";}catch(e){}x.fillText(fm.nm.toUpperCase(),ox,y+famH/2);try{x.letterSpacing="0px";}catch(e){}y+=famH;
    fm.ks.forEach(function(k){var f=F[k];if(!f)return;var c=f.na?P.muted:f.impact>0?P.up:f.impact<0?P.down:P.muted;
      x.strokeStyle=P.rule;x.lineWidth=1;x.beginPath();x.moveTo(ox,y);x.lineTo(ox+width,y);x.stroke();
      x.fillStyle=P.text;x.font="600 40px 'Barlow Condensed', sans-serif";x.fillText(String(f.sh||f.nm).toUpperCase(),ox,y+rowH/2);
      x.fillStyle=P.muted;x.font="500 24px Barlow, sans-serif";x.fillText(f.na?"—":f.label,ox+300,y+rowH/2,width-300-3*34-200);
      if(!f.na){x.fillStyle=c;x.font="700 22px Barlow, sans-serif";x.textAlign="right";try{x.letterSpacing="1.5px";}catch(e){}x.fillText(verdict(f).toUpperCase(),ox+width-3*34-18,y+rowH/2);try{x.letterSpacing="0px";}catch(e){}x.textAlign="left";}
      for(var n=1;n<=3;n++){x.fillStyle=f.impact&&n<=f.str?c:P.rule;x.fillRect(ox+width-3*34+(n-1)*34,y+rowH/2-5,28,10);}
      y+=rowH;});
    y+=10;});
  x.restore();return y-oy;
}
CK.map={
  boot:function(){list=document.getElementById("sigList");detail=document.getElementById("mapDetail");if(!list)return;render();wire();},
  update:function(changed){render();(changed||[]).forEach(function(c){var el=list&&list.querySelector('.sg[data-k="'+c.f.k+'"]');if(el&&el.animate&&!CK.reduce)el.animate([{backgroundColor:"rgba(255,138,61,.25)"},{backgroundColor:"transparent"}],{duration:1600});});},
  theme:function(){},
  drawCanvas:drawCanvas
};
})();
