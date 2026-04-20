// title position fix (immune to nameScale and leftward tag width)
const TITLE_POS_AFTER   = 'e.position.set(e.width<i.width?t._7847-(i.width-e.width)/2:t._7847,t._9202-s/2-e.height/2)';
const TITLE_POS_REPLACE = 'e.position.set(t._7847,t._9202-t._1904/5-e.height/2)';

// team cell colors
const TEAM_COLOR_AFTER   = 'let u="";(n||a)&&(u=t._2182._1059._8313);';
const TEAM_COLOR_REPLACE = '(function(){try{var _tc=globalThis.__ryuTeamColors;if(!_tc)_tc=globalThis.__ryuTeamColors=JSON.parse(localStorage.getItem("ryuTeamColors")||"{}");var _pn=t&&t._2182&&t._2182._1059?t._2182._1059._6988:"";var _hx=_pn&&_tc?_tc[_pn]:"";if(_hx){var _tv=parseInt(String(_hx).replace("#",""),16);if(!isNaN(_tv))l=_tv===0?65793:_tv;}}catch(_e){}})();let u="";(n||a)&&(u=t._2182._1059._8313);';

// render loop
const RENDER_AFTER   = 'o._5027(),n._4659(),q_._4659(),Be._4659(),z_._4659(),ne._4659(),X_._4659(),fs._4659(),o._4067()';
const RENDER_REPLACE = 'o._5027(),n._4659(),q_._4659(),Be._4659(),z_._4659(),ne._4659(),X_._4659(),(globalThis.__ryuOnFrameDrawn&&globalThis.__ryuOnFrameDrawn()),fs._4659(),o._4067(),(globalThis.__ryuQ_||(globalThis.__ryuQ_=q_,globalThis.__ryuV=V,globalThis.__ryuG_=g_))';
const REPLAY_AFTER   = 'const t=e.result;q_._9311(t),rs._5705(),rs._5705()';
const REPLAY_REPLACE = 'const t=e.result;globalThis.__ryuQ_=q_;globalThis.__ryuV=V;globalThis.__ryuG_=g_;q_._9311(t),rs._5705(),rs._5705()';

// gallery (y_)
const Y_GAL_AFTER   = 'super("gallery"),this._4435=document.getElementById("gl-container")';
const Y_GAL_REPLACE = 'super("gallery"),this._4435=document.getElementById("gl-container");globalThis.__ryuY_=this';

// playback bar (D_)
const D_PB_AFTER   = 'this._6340=!1,this._1526=0,this._3877=!1,this._6307=!1}';
const D_PB_REPLACE = 'this._6340=!1,this._1526=0,this._3877=!1,this._6307=!1;globalThis.__ryuD_=this}';
const RS_AFTER   = '_6374(t){this._7617.set(t._9782,t)}};';
const RS_REPLACE = '_6374(t){this._7617.set(t._9782,t)}};globalThis.__ryuRs=rs;';
const YT_IMEX_AFTER   = '}_2059(){this._1295._1038("display","none")}};';
const YT_IMEX_REPLACE = '}_2059(){this._1295._1038("display","none")}};globalThis.__ryuYt=yt;';

// notification (u)
const U_NOTIFY_AFTER   = 'u._1162("Settings","Import was successful.")';
const U_NOTIFY_REPLACE = '(globalThis.__ryuU=u,u._1162("Settings","Import was successful."))';

// skin + globals expose
const SKIN_AFTER = 'Be._2263(t,_),this._6538()}))';
const SKIN_CODE = `
;globalThis.__is=is;
globalThis.__Be=Be;
globalThis.__Ue=Ue;
globalThis.__Q=Q;

globalThis.__ryuPe=pe;
globalThis.__Tt=Tt;
globalThis.__c=c;
globalThis.__ne=ne;

if (typeof We !== 'undefined') {
    globalThis.__We = We;
}

if (typeof Me !== 'undefined') {
    globalThis.__ryuMe = Me;
}

globalThis.__Pt = Pt;

`;

// name color tint
const NAME_AFTER = 'if(null!==i){const e=t._1904/3/(128*i_)*1;i.scale.set(e,e);';
const NAME_SCALE_INJECT = `(function(){try{var _gt=JSON.parse(localStorage.getItem('ryuTheme')||'{}');if(_gt.nameScaleOn&&_gt.nameScale&&_gt.nameScale!==1){var _ns=Math.min(Math.max(parseFloat(_gt.nameScale),0.5),3);i.scale.set(e*_ns,e*_ns);}}catch(_e){}})();`;
const NAME_CODE  = `(function(){if(globalThis.__ryuNameTint===undefined){var _t=JSON.parse(localStorage.getItem('ryuTheme')||'{}');globalThis.__ryuNameTint=_t.useDefault?0xffffff:(_t.color?parseInt((_t.color||'#ff69b4').replace('#',''),16):0xff69b4);if(globalThis.__ryuNameTint===0)globalThis.__ryuNameTint=0x010101;}i.tint=globalThis.__ryuNameTint;})();`;

// mass tint path 1 (sprite var e)
const TINT_AFTER_1 = 'const e=Ut._4975(t._7906.toFixed(0)),s=t._1904/3/128*.8;e.scale.set(s,s);';
const TINT_CODE_1  = `(function(){var _t=JSON.parse(localStorage.getItem('ryuTheme')||'{}');var _tint=_t.useDefault?0xffffff:parseInt((_t.massColor||'#ff69b4').replace('#',''),16);for(var _i=0;_i<e.children.length;_i++){e.children[_i].tint=_tint===0?0x010101:_tint;}})();(function(){try{var _gt=JSON.parse(localStorage.getItem('ryuTheme')||'{}');if(_gt.massScaleOn&&_gt.massScale&&_gt.massScale!==1){var _ms=Math.min(Math.max(parseFloat(_gt.massScale),0.5),3);e.scale.set(s*_ms,s*_ms);}}catch(_e){}})();`;

// mass tint path 2 (sprite var _)
const TINT_AFTER_2 = 'const _=Ut._4975(t._7906.toFixed(0)),e=t._1904/3/128*.8;_.scale.set(e,e);';
const TINT_CODE_2  = `(function(){var _t=JSON.parse(localStorage.getItem('ryuTheme')||'{}');var _tint=_t.useDefault?0xffffff:parseInt((_t.massColor||'#ff69b4').replace('#',''),16);for(var _i=0;_i<_.children.length;_i++){_.children[_i].tint=_tint===0?0x010101:_tint;}})();(function(){try{var _gt=JSON.parse(localStorage.getItem('ryuTheme')||'{}');if(_gt.massScaleOn&&_gt.massScale&&_gt.massScale!==1){var _ms=Math.min(Math.max(parseFloat(_gt.massScale),0.5),3);_.scale.set(e*_ms,e*_ms);}}catch(_e){}})();`;

// ejected mass pellet texture swap
const PELLET_STYLE_AFTER = 'r.position.set(t._7847,t._9202),r.width=2*t._1904,r.height=2*t._1904,"tint"===Q.ORB_COLORING._5997()?r.tint=t._5682._1026:r.tint=t._6728._1026,r.alpha=s,_.addChild(r)';
const PELLET_STYLE_REPLACE = 'r.position.set(t._7847,t._9202),(function(_spr,_fallback,_cell){try{if(_cell&&_cell._7926===2){var _style=globalThis.__ryuPelletStyle||0;if(_style===2){var _raw=String(globalThis.__ryuPelletImgur||"").trim();var _url="";var _m=_raw.match(/imgur\\.com\\/(?:a\\/|gallery\\/)?([A-Za-z0-9]+)(\\.(?:png|jpg|jpeg|gif|webp))?/i);if(_m){_url="https://i.imgur.com/"+_m[1]+(_m[2]||".png");}else if(/^https:\\/\\/i\\.imgur\\.com\\/[^?#]+\\.(?:png|jpg|jpeg|gif|webp)(?:[?#].*)?$/i.test(_raw)){_url=_raw;}if(_url){if(globalThis.__ryuPelletImgKey!==_url){var _img=new Image();_img.crossOrigin="anonymous";_img.onload=function(){globalThis.__ryuPelletImgReadyKey=_url;};_img.onerror=function(){if(globalThis.__ryuPelletImgKey===_url)globalThis.__ryuPelletImgErrorKey=_url;};globalThis.__ryuPelletImg=_img;globalThis.__ryuPelletImgKey=_url;globalThis.__ryuPelletTexture=null;globalThis.__ryuPelletTextureKey="";_img.src=_url;}var _im=globalThis.__ryuPelletImg;if(_im&&_im.complete&&_im.naturalWidth>0){if(!globalThis.__ryuPelletTexture||globalThis.__ryuPelletTextureKey!==_url){var _cv2=document.createElement("canvas");_cv2.width=128;_cv2.height=128;var _ctx2=_cv2.getContext("2d");_ctx2.clearRect(0,0,128,128);_ctx2.save();_ctx2.beginPath();_ctx2.arc(64,64,62,0,Math.PI*2);_ctx2.closePath();_ctx2.clip();var _iw=_im.naturalWidth||_im.width,_ih=_im.naturalHeight||_im.height,_sc=Math.max(128/_iw,128/_ih),_dw=_iw*_sc,_dh=_ih*_sc;_ctx2.drawImage(_im,(128-_dw)/2,(128-_dh)/2,_dw,_dh);_ctx2.restore();globalThis.__ryuPelletTexture=c.jyi.from(_cv2).texture;globalThis.__ryuPelletTextureKey=_url;}if(_spr.texture!==globalThis.__ryuPelletTexture)_spr.texture=globalThis.__ryuPelletTexture;_spr.tint=16777215;return true;}}}if(_style===1){var _emoji=String(globalThis.__ryuPelletEmoji||"\\uD83D\\uDD25").trim()||"\\uD83D\\uDD25";if(!globalThis.__ryuPelletTexture||globalThis.__ryuPelletTextureKey!==_emoji){var _cv=document.createElement("canvas");_cv.width=128;_cv.height=128;var _ctx=_cv.getContext("2d");_ctx.clearRect(0,0,128,128);_ctx.font="96px \\"Segoe UI Emoji\\",\\"Apple Color Emoji\\",\\"Noto Color Emoji\\",sans-serif";_ctx.textAlign="center";_ctx.textBaseline="middle";_ctx.fillText(_emoji,64,70);globalThis.__ryuPelletTexture=c.jyi.from(_cv).texture;globalThis.__ryuPelletTextureKey=_emoji;}if(_spr.texture!==globalThis.__ryuPelletTexture)_spr.texture=globalThis.__ryuPelletTexture;_spr.tint=16777215;return true;}}if(_spr.texture!==_fallback)_spr.texture=_fallback;}catch(_e){try{if(_spr.texture!==_fallback)_spr.texture=_fallback;}catch(_e2){}}return false;})(r,xt._2571._3327,t)||("tint"===Q.ORB_COLORING._5997()?r.tint=t._5682._1026:r.tint=t._6728._1026),r.width=2*t._1904,r.height=2*t._1904,r.alpha=s,_.addChild(r)';

// map food particle rainbow tint
const FOOD_PARTICLE_VERTEX_SHADER_AFTER = '109:t=>{"use strict";t.exports="uniform vec2 uTranslate;\\nuniform vec2 uScale;\\n\\nattribute vec2 aPosition;\\nattribute float aAlpha;\\nattribute vec2 aUV;\\n\\nvarying vec2 vUV;\\nvarying float vAlpha;\\n\\nvoid main() {\\n  gl_Position = vec4(((aPosition - uTranslate) * uScale), 0.0, 1.0);\\n  vUV = aUV;\\n  vAlpha = aAlpha;\\n}\\n"}';
const FOOD_PARTICLE_VERTEX_SHADER_REPLACE = '109:t=>{"use strict";t.exports="uniform vec2 uTranslate;\\nuniform vec2 uScale;\\n\\nattribute vec2 aPosition;\\nattribute float aAlpha;\\nattribute vec2 aUV;\\nattribute vec4 aColor;\\n\\nvarying vec2 vUV;\\nvarying float vAlpha;\\nvarying vec4 vColor;\\n\\nvoid main() {\\n  gl_Position = vec4(((aPosition - uTranslate) * uScale), 0.0, 1.0);\\n  vUV = aUV;\\n  vAlpha = aAlpha;\\n  vColor = aColor;\\n}\\n"}';
const FOOD_PARTICLE_FRAGMENT_SHADER_AFTER = '578:t=>{"use strict";t.exports="uniform sampler2D uTexture;\\n\\nvarying float vAlpha;\\nvarying vec2 vUV;\\n\\nvoid main() {\\n  gl_FragColor = texture2D(uTexture, vUV) * vAlpha;\\n}\\n"}';
const FOOD_PARTICLE_FRAGMENT_SHADER_REPLACE = '578:t=>{"use strict";t.exports="uniform sampler2D uTexture;\\n\\nvarying float vAlpha;\\nvarying vec2 vUV;\\nvarying vec4 vColor;\\n\\nvoid main() {\\n  gl_FragColor = texture2D(uTexture, vUV) * vAlpha * vColor;\\n}\\n"}';
const FOOD_PARTICLE_SHADER_NAME_AFTER = 'const t=e(109),_=e(578),s=new c.$rD(t,_,"particles-shader")';
const FOOD_PARTICLE_SHADER_NAME_REPLACE = 'const t=e(109),_=e(578),s=new c.$rD(t,_,"particles-rainbow-shader")';
const FOOD_PARTICLE_BUFFER_AFTER = 'n._4262._5138=new Float32Array(163830)';
const FOOD_PARTICLE_BUFFER_REPLACE = 'n._4262._5138=new Float32Array(294894)';
const FOOD_PARTICLE_LAYOUT_AFTER = 'o.addAttribute("aPosition",n._6536._5138,2,!1,c.vK6.FLOAT,20,0),o.addAttribute("aAlpha",n._6536._5138,1,!1,c.vK6.FLOAT,20,16),o.addAttribute("aUV",n._6536._5138,2,!1,c.vK6.FLOAT,20,8),o.addIndex(n._6536._8555)';
const FOOD_PARTICLE_LAYOUT_REPLACE = 'o.addAttribute("aPosition",n._6536._5138,2,!1,c.vK6.FLOAT,36,0),o.addAttribute("aUV",n._6536._5138,2,!1,c.vK6.FLOAT,36,8),o.addAttribute("aAlpha",n._6536._5138,1,!1,c.vK6.FLOAT,36,16),o.addAttribute("aColor",n._6536._5138,4,!1,c.vK6.FLOAT,36,20),o.addIndex(n._6536._8555)';
const FOOD_PARTICLE_UV_AFTER = 'for(let s=0;s<5461;s++){for(let e=0;e<6;e++)_+=2,this._3213._4262._5138[_++]=t[e][0],this._3213._4262._5138[_++]=t[e][1],_+=1;const i=6*s;';
const FOOD_PARTICLE_UV_REPLACE = 'for(let s=0;s<5461;s++){for(let e=0;e<6;e++)_+=2,this._3213._4262._5138[_++]=t[e][0],this._3213._4262._5138[_++]=t[e][1],_+=5;const i=6*s;';
const FOOD_PARTICLE_TEXTURE_AFTER = '_2262(){const t=Q.PARTICLE_COLOR._5997(),_=Q.PARTICLE_GLOW_SIZE._5997(),e=Q.PARTICLE_GLOW_COLOR._5997();if(this._1848._6728===t&&this._1848._2791===_&&this._1848._5246===e)return;this._1848._6728=t,this._1848._2791=_,this._1848._5246=e;';
const FOOD_PARTICLE_TEXTURE_REPLACE = '_2262(){const rnb=globalThis.__ryuRainbowFoodParticles?1:0,t=rnb?16777215:Q.PARTICLE_COLOR._5997(),_=Q.PARTICLE_GLOW_SIZE._5997(),e=rnb?(((((Q.PARTICLE_GLOW_COLOR._5997()>>>24)&255)||100)<<24)|16777215)>>>0:Q.PARTICLE_GLOW_COLOR._5997();if(this._1848._6728===t&&this._1848._2791===_&&this._1848._5246===e&&this._1848._7777===rnb)return;this._1848._6728=t,this._1848._2791=_,this._1848._5246=e,this._1848._7777=rnb;';
const FOOD_PARTICLE_COLORS_AFTER = '_8013(){const t=Math.min(5461,ne._4422.length);let _=0;for(let e=0;e<t;e++){const t=ne._4422[e],s=t._1904/8*(this._8909.canvas.width/2);for(let e=0;e<6;e++){const i=2*Math.PI*(e/6),n=Math.cos(i),o=Math.sin(i);this._3213._4262._5138[_++]=t._7847+n*s,this._3213._4262._5138[_++]=t._9202+o*s,_+=2,this._3213._4262._5138[_++]=t._2427}}this._3213._6536._5138.update(this._3213._4262._5138.subarray(0,30*t)),this._3213._6536._8555.update(this._3213._4262._8555.subarray(0,12*t))}';
const FOOD_PARTICLE_COLORS_REPLACE = '_8013(){const t=Math.min(5461,ne._4422.length),rnb=!!globalThis.__ryuRainbowFoodParticles;let _=0;for(let e=0;e<t;e++){const t=ne._4422[e],s=t._1904/6.5*(this._8909.canvas.width/2),r=t._9782||e,h=((r*0.61803398875)%1)*6.28318530718,a=rnb?127*Math.sin(h)+128:255,l=rnb?127*Math.sin(h+2)+128:255,u=rnb?127*Math.sin(h+4)+128:255,d=a/255,m=l/255,f=u/255;for(let e=0;e<6;e++){const i=2*Math.PI*(e/6),n=Math.cos(i),o=Math.sin(i);this._3213._4262._5138[_++]=t._7847+n*s,this._3213._4262._5138[_++]=t._9202+o*s,_+=2,this._3213._4262._5138[_++]=t._2427,this._3213._4262._5138[_++]=d,this._3213._4262._5138[_++]=m,this._3213._4262._5138[_++]=f,this._3213._4262._5138[_++]=1}}this._3213._6536._5138.update(this._3213._4262._5138.subarray(0,54*t)),this._3213._6536._8555.update(this._3213._4262._8555.subarray(0,12*t))}';

// Agar.io-style white map background
const AGAR_MAP_RENDERER_CLEAR_AFTER = '_4590(){const t=Q.BACKGROUND_COLOR._5997();this._1855.backgroundColor!==t&&(this._1855.backgroundColor=t)}';
const AGAR_MAP_RENDERER_CLEAR_REPLACE = '_4590(){const t=globalThis.__ryuAgarMap?0xf3fafc:Q.BACKGROUND_COLOR._5997();this._1855.backgroundColor!==t&&(this._1855.backgroundColor=t)}';
const AGAR_MAP_BACKGROUND_VIS_AFTER = '_4659(){this._4435.removeChildren(),Q.WORLD_BACKGROUND_IMAGE._5997()&&(this._2262(),this._8013(),this._7325(),this._4435.addChild(this._7333))}';
const AGAR_MAP_BACKGROUND_VIS_REPLACE = '_4659(){this._4435.removeChildren(),(globalThis.__ryuAgarMap||Q.WORLD_BACKGROUND_IMAGE._5997())&&(this._2262(),this._8013(),this._7325(),this._4435.addChild(this._7333))}';
const AGAR_MAP_TEXTURE_AFTER = '_2262(){const t=this._5683.uTexture!==c.xEZ.WHITE.baseTexture?Q.BACKGROUND_IMAGE_COLOR._5997():Q.BACKGROUND_COLOR._5997();this._1848._3564!==t&&(this._1848._3564=t,this._5683.uTint[0]=((16711680&t)>>16)/255,this._5683.uTint[1]=((65280&t)>>8)/255,this._5683.uTint[2]=((255&t)>>0)/255,this._5683.uTint[3]=1);const _=Q.BACKGROUND_IMAGE_URL._5997(),e=Q.BACKGROUND_IMAGE_QUALITY._5997(),s=2**("low"===e?-1:"high"===e?1:0);this._1848._5195===_&&this._1848._4641===s||(this._1848._5195=_,this._1848._4641=s,this._5594(_,s).catch(console.error))}';
const AGAR_MAP_TEXTURE_REPLACE = '_2262(){if(globalThis.__ryuAgarMap){if(!globalThis.__ryuAgarMapTexture){const t=document.createElement("canvas"),_=t.getContext("2d"),e=2048,s=40;t.width=t.height=e,_.fillStyle="#f3fafc",_.fillRect(0,0,e,e),_.strokeStyle="rgba(0,0,0,.24)",_.lineWidth=1,_.beginPath();for(let t=0;t<=e;t+=s){const i=t+.5;_.moveTo(i,0),_.lineTo(i,e),_.moveTo(0,i),_.lineTo(e,i)}_.stroke(),globalThis.__ryuAgarMapTexture=new c.VL4(t,{mipmap:c.WBB.OFF})}this._5683.uTexture!==globalThis.__ryuAgarMapTexture&&(this._5683.uTexture=globalThis.__ryuAgarMapTexture);const t=16777215;if(this._1848._3564!==t||this._1848._8855!==1){this._1848._3564=t,this._1848._8855=1,this._5683.uTint[0]=1,this._5683.uTint[1]=1,this._5683.uTint[2]=1,this._5683.uTint[3]=1}return}this._1848._8855=0,globalThis.__ryuAgarMapTexture&&this._5683.uTexture===globalThis.__ryuAgarMapTexture&&(this._5683.uTexture=c.xEZ.WHITE.baseTexture,this._1848._5195="");const t=this._5683.uTexture!==c.xEZ.WHITE.baseTexture?Q.BACKGROUND_IMAGE_COLOR._5997():Q.BACKGROUND_COLOR._5997();this._1848._3564!==t&&(this._1848._3564=t,this._5683.uTint[0]=((16711680&t)>>16)/255,this._5683.uTint[1]=((65280&t)>>8)/255,this._5683.uTint[2]=((255&t)>>0)/255,this._5683.uTint[3]=1);const _=Q.BACKGROUND_IMAGE_URL._5997(),e=Q.BACKGROUND_IMAGE_QUALITY._5997(),s=2**("low"===e?-1:"high"===e?1:0);this._1848._5195===_&&this._1848._4641===s||(this._1848._5195=_,this._1848._4641=s,this._5594(_,s).catch(console.error))}';

// Yt expose
const YT_AFTER   = 'Yt=new Ft(';
const YT_REPLACE = 'Yt=(globalThis.__Yt=new Ft(';

const YT_CLOSE_AFTER   = '{_8649:h,_7767:c}}))';
const YT_CLOSE_REPLACE = '{_8649:h,_7767:c}})),(globalThis.__ryuRedrawName=function(){var yt=globalThis.__Yt;if(!yt)return;if(yt._8662[0])yt._8662[0]._2984();yt._8662=[];yt._6656=0;},globalThis.__Yt))';

// glow + outline injection
const GLOW_AFTER   = 't.strokeStyle="rgba(0, 0, 0, 0.5)",';
const GLOW_REPLACE = '(function(){var _gt=JSON.parse(localStorage.getItem(\'ryuTheme\')||\'{}\');if(!_gt.useDefault&&_gt.glowOn&&_gt.shadowBlur>0){t.shadowBlur=_gt.shadowBlur;t.shadowColor=_gt.shadowColor||\'#000000\';}else{t.shadowBlur=0;t.shadowColor=\'transparent\';}if(!_gt.useDefault&&_gt.strokeOn){t.strokeStyle=_gt.strokeColor||\'#000000\';}})(),t.strokeStyle="rgba(0, 0, 0, 0.5)",';

// bold name
const BOLD_AFTER  = 't.textBaseline="middle",t.strokeText(';
const BOLD_REPLACE = '(function(){try{var _gt=JSON.parse(localStorage.getItem(\'ryuTheme\')||\'{}\');if(_gt.boldName){t.font=t.font.replace(\'600 \',\'900 \');}}catch(e){}})(),t.textBaseline="middle",t.strokeText(';

// commander init
const CMD_INIT_AFTER   = '_2794(){this._4435=new c.W20;const t=Pt._1516("TEXTURE/H3D/COMMANDER"),_=new c.VL4(t),e=new c.xEZ(_);this._6466=e}';
const CMD_INIT_REPLACE = '_2794(){this._4435=new c.W20;const t=Pt._1516("TEXTURE/H3D/COMMANDER"),_=new c.VL4(t),e=new c.xEZ(_);this._6466=e;var _self=this;globalThis.__ryuRenderCmdText=function(rx,ry,rtxt){try{var W=900,H=225;var cv=document.createElement("canvas");cv.width=W;cv.height=H;var ctx=cv.getContext("2d");ctx.clearRect(0,0,W,H);ctx.font="bold 150px \\"Titillium Web\\",sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.lineWidth=7;ctx.strokeStyle="#000000";ctx.strokeText(rtxt,W/2,H/2);ctx.fillStyle="#ffffff";ctx.fillText(rtxt,W/2,H/2);var spr=c.jyi.from(cv);spr.anchor.set(0.5,1);spr.position.set(rx,ry-10);spr.alpha=1;if(!globalThis.__ryuCmdContainer||!globalThis.__ryuCmdContainer.parent){var cont=new c.W20;var par=_self._4435?_self._4435.parent:null;if(par)par.addChild(cont);globalThis.__ryuCmdContainer=cont;}globalThis.__ryuCmdContainer.addChild(spr);var start=Date.now();(function fade(){var p=Math.min((Date.now()-start)/1200,1);spr.alpha=1-p;spr.y=ry-10-(70*p);if(p<1){requestAnimationFrame(fade);}else{spr.parent&&spr.parent.removeChild(spr);spr.destroy(true);}})();}catch(err){};};}';

// local ping flag
const PING_AFTER   = '_1760(t){const _=t._1241(),e=(ne._9932(_),t._1241()),s=t._1241();F_._7703(e,s,16777215)}';
const PING_REPLACE = '_1760(t){const _=t._1241(),e=(ne._9932(_),t._1241()),s=t._1241();var _pp=ne._9932(_);globalThis.__ryuIsLocalPing=!!(_pp&&_pp._6988===Be._6988);F_._7703(e,s,16777215);globalThis.__ryuIsLocalPing=false;}';

// commander text
const CMD_AFTER   = '_7703(t,_,e){const s={_7847:t,_9202:_,_6728:e,_4788:n._4541};this._5570.add(s)}';
const CMD_REPLACE = '_7703(t,_,e){const s={_7847:t,_9202:_,_6728:e,_4788:n._4541};this._5570.add(s);(function(_self,x,y){try{if(!globalThis.__ryuIsLocalPing)return;var msg=globalThis.__ryuCommanderText;if(!msg||!msg.trim())return;if(globalThis.__ryuRenderCmdText)globalThis.__ryuRenderCmdText(x,y,msg);if(globalThis.__ryuRelaySend)globalThis.__ryuRelaySend(x,y,msg);}catch(err){};})(this,t,_)}';



// mute manager (M_)
const M_AFTER   = 'this._5846="chatbox-mute-list"';
const M_REPLACE = 'this._5846="chatbox-mute-list";globalThis.__ryuM_=this';

// chatbox channel manager (B_)
const B_AFTER   = 'this._6306("GLOBAL",!0),this._6306("TEAM",!0),this._1366("GLOBAL")';
const B_REPLACE = 'this._6306("GLOBAL",!0),this._6306("TEAM",!0),this._1366("GLOBAL");globalThis.__ryuB_=this';

// camera (z_)
const CAMERA_AFTER   = 'this._8184=new g(32767.5,32767.5)}';
const CAMERA_REPLACE = 'this._8184=new g(32767.5,32767.5);globalThis.__z_=this;}';

// screen (X_)
const SCREEN_AFTER   = 'super(),this._4894=null,this._1855=null,this._9313=null,this._4103=1,this._2902=1}';
const SCREEN_REPLACE = 'super(),this._4894=null,this._1855=null,this._9313=null,this._4103=1,this._2902=1;globalThis.__X_=this;}';

// local freecam camera hook
const FREECAM_CAMERA_AFTER   = '_4659(){this._1976(),this._6398(),this._2534(),this._9695()}';
const FREECAM_CAMERA_REPLACE = '_4659(){this._1976(),this._6398(),globalThis.__ryuApplyFreecam&&globalThis.__ryuApplyFreecam(this),this._2534(),this._9695()}';

// eject expose
const EJECT_AFTER   = '_4727(){Be._6881&&Me._4727(Be._1393)}';
const EJECT_REPLACE = '_4727(){globalThis.__ryuMe=Me;globalThis.__ryuBe=Be;Be._6881&&Me._4727(Be._1393);}';

// packet handler (Ne)
const NE_AFTER   = 'if(this._1316)Ne._1114(_);';
const NE_REPLACE = 'if(this._1316){globalThis.__ryuNe=Ne;Ne._1114(_);}';

// ping cooldown bypass
const ME_PING_AFTER   = 'Me._4886=function(t,_){';
const ME_PING_REPLACE = 'Me._4886=function(t,_){globalThis.__ryuSendPing=Me._4886.bind(Me);';

// ill orb custom image
const ILL_ORB_AFTER   = '_4485(){const t=this._8909,_=256,e=Math.log2(_),s=(_-2*e)/2,i=this._5824._1098._1415,n=this._5824._1098._2961,o=this._5824._1098._5246,r=s*(this._5824._1098._2791/100);';
const ILL_ORB_REPLACE = `_4485(){globalThis.__ryuOrbRenderer=this;var _t=JSON.parse(localStorage.getItem('ryuTheme')||'{}');if(_t.customVirus){(function(_self){var t=_self._8909,e=8,s=120,r=54;t.save();t.clearRect(512,512,256,256);t.translate(512+e,512+e);t.beginPath();t.arc(s,s,r,0,2*Math.PI);t.closePath();t.clip();if(globalThis.__ryuIllOrbImg&&globalThis.__ryuIllOrbImg.complete){t.drawImage(globalThis.__ryuIllOrbImg,s-r,s-r,r*2,r*2);}else{t.fillStyle='rgba(60,180,60,0.8)';t.fill();if(!globalThis.__ryuIllOrbImg){var img=new Image();img.crossOrigin='anonymous';img.onload=function(){globalThis.__ryuIllOrbImg=img;_self._8191();};img.src='https://i.imgur.com/qCpPCOk.png';globalThis.__ryuIllOrbImg=img;}}t.restore();})(this);return;}const t=this._8909,_=256,e=Math.log2(_),s=(_-2*e)/2,i=this._5824._1098._1415,n=this._5824._1098._2961,o=this._5824._1098._5246,r=s*(this._5824._1098._2791/100);`;

// ill orb filled variant (clears white dot)
const ILL_ORB2_AFTER   = '_5649(){const t=this._8909,_=256,e=Math.log2(_),s=(_-2*e)/2,i=this._5824._1098._1415,n=this._5824._1098._2961,o=this._5824._1098._5246,r=s*(this._5824._1098._2791/100);';
const ILL_ORB2_REPLACE = `_5649(){var _t=JSON.parse(localStorage.getItem('ryuTheme')||'{}');if(_t.customVirus){(function(_self){var t=_self._8909,e=8,s=120,r=54;t.save();t.clearRect(768,512,256,256);t.translate(768+e,512+e);t.beginPath();t.arc(s,s,r,0,2*Math.PI);t.closePath();t.clip();if(globalThis.__ryuIllOrbImg&&globalThis.__ryuIllOrbImg.complete){t.drawImage(globalThis.__ryuIllOrbImg,s-r,s-r,r*2,r*2);}else{t.fillStyle='rgba(60,180,60,0.8)';t.fill();}t.restore();})(this);return;}const t=this._8909,_=256,e=Math.log2(_),s=(_-2*e)/2,i=this._5824._1098._1415,n=this._5824._1098._2961,o=this._5824._1098._5246,r=s*(this._5824._1098._2791/100);`;


const ATLAS_AFTER   = 'const t=Pt._1516("titillium-web-font-atlas");this._8909.drawImage(t,0,0,512,512);const _=[[0,65,95,105],[346,290,72,105],[176,290,86,105],[89,290,87,105],[190,65,93,105],[0,290,89,105],[283,65,93,105],[262,290,84,105],[95,65,95,105],[376,65,93,105]];for(let t=0;t<10;t++){const e=t.toString(),s=_[t];this._2571._1960.set(e,new c.xEZ(this._9354,new c.AeJ(s[0],s[1],s[2],s[3])))}this._9765=!0';
const ATLAS_REPLACE = `(function(_self) {
  var _coords = [[0,65,95,105],[346,290,72,105],[176,290,86,105],[89,290,87,105],[190,65,93,105],[0,290,89,105],[283,65,93,105],[262,290,84,105],[95,65,95,105],[376,65,93,105]];
  var _fonts = [
    {v:'Titillium Web',s:'normal'},{v:'Orbitron',s:'normal'},{v:'Audiowide',s:'normal'},
    {v:'Oxanium',s:'normal'},{v:'Exo 2',s:'italic'},{v:'Quantico',s:'italic'},
    {v:'Nova Square',s:'normal'},{v:'Bebas Neue',s:'normal'},{v:'Oswald',s:'italic'},
    {v:'Russo One',s:'normal'},{v:'Black Ops One',s:'normal'},{v:'Teko',s:'normal'},
    {v:'Barlow Condensed',s:'italic'},{v:'Boogaloo',s:'normal'},{v:'Fredoka One',s:'normal'},
    {v:'Permanent Marker',s:'normal'},{v:'Bangers',s:'normal'},{v:'Righteous',s:'normal'},
    {v:'Lilita One',s:'normal'},{v:'Press Start 2P',s:'normal'},{v:'Creepster',s:'normal'},
    {v:'Abril Fatface',s:'normal'},{v:'Pacifico',s:'normal'},{v:'Lobster',s:'normal'},
    {v:'Monoton',s:'normal'},{v:'Faster One',s:'normal'},{v:'Gugi',s:'normal'},
    {v:'Silkscreen',s:'normal'},{v:'VT323',s:'normal'}
  ];
  function _drawDigits(font) {
    var fontName = font ? font.v : null;
    var fontStyle = font ? font.s : 'normal';
    var t = Pt._1516("titillium-web-font-atlas");
    _self._8909.clearRect(0, 0, 512, 512);
    _self._8909.drawImage(t, 0, 0, 512, 512);
    if (fontName && fontName !== 'Titillium Web') {
      var ctx = _self._8909;
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      for (var i = 0; i < 10; i++) {
        var co = _coords[i];
        ctx.clearRect(co[0], co[1], co[2], co[3]);
        ctx.font = fontStyle + ' bold ' + Math.floor(co[3] * 0.85) + 'px "' + fontName + '", sans-serif';
        ctx.fillText(i.toString(), co[0] + co[2]/2, co[1] + co[3]/2);
      }
      ctx.restore();
    }
    for (var t2 = 0; t2 < 10; t2++) {
      var e = t2.toString(), s = _coords[t2];
      _self._2571._1960.set(e, new c.xEZ(_self._9354, new c.AeJ(s[0],s[1],s[2],s[3])));
    }
    _self._9765 = true;
    _self._9354.update();
  }
  try {
    var _theme = JSON.parse(localStorage.getItem('ryuTheme') || '{}');
    if (_theme.useDefault) {
      _drawDigits(null);
    } else {
      var _font = _fonts[_theme.massFont !== undefined ? _theme.massFont : _theme.fontIndex] || null;
      if (_font && _font.v !== 'Titillium Web') {
        document.fonts.load('bold 80px "' + _font.v + '"').then(function() { _drawDigits(_font); });
      } else {
        _drawDigits(null);
      }
    }
  } catch(err) { _drawDigits(null); }
  window.__ryuRedrawFont = function(fontIdx) {
    var font = _fonts[fontIdx] || null;
    if (!font || font.v === 'Titillium Web') {
      _drawDigits(null);
    } else {
      document.fonts.load('bold 80px "' + font.v + '"').then(function() { _drawDigits(font); });
    }
  };
})(this)`;

(function() {
  'use strict';

  var RYUTEN_SOURCE_URL = 'https://ryuten.io/play/ryuten.js?ryu_original=1';

  var SANITIZE_RULES = [
    {
      label: 'legacy worker native tag suppress',
      after: 'Q.SHOW_TEAM_NAME._5997()&&e.length>0&&"ITS-BOT-TEAM"!==e&&!globalThis.__ryuHideNativeTag',
      replace: 'Q.SHOW_TEAM_NAME._5997()&&e.length>0&&"ITS-BOT-TEAM"!==e'
    },
    {
      label: 'legacy worker name tag prepend',
      after: 'i=Yt._4975((function(){var _tg=t._2182._1059._9067;return(_tg&&_tg!=="ITS-BOT-TEAM"&&globalThis.__ryuHideNativeTag)?" ["+_tg+"] "+s+" ":s;})(),void 0)',
      replace: 'i=Yt._4975(s,void 0)'
    },
    {
      label: 'legacy worker name tag prepend safe',
      after: 'i=Yt._4975((function(){var _tg=t._2182&&t._2182._1059?t._2182._1059._9067:"";return(_tg&&_tg!=="ITS-BOT-TEAM"&&globalThis.__ryuHideNativeTag)?" ["+_tg+"] "+s+" ":s;})(),void 0)',
      replace: 'i=Yt._4975(s,void 0)'
    }
  ];

  var REPLACEMENTS = [
    { label: 'Yt expose', after: YT_AFTER, replace: YT_REPLACE },
    { label: 'Yt redraw close', after: YT_CLOSE_AFTER, replace: YT_CLOSE_REPLACE },
    { label: 'glow outline', after: GLOW_AFTER, replace: GLOW_REPLACE },
    { label: 'bold name', after: BOLD_AFTER, replace: BOLD_REPLACE },
    { label: 'commander init', after: CMD_INIT_AFTER, replace: CMD_INIT_REPLACE },
    { label: 'local ping flag', after: PING_AFTER, replace: PING_REPLACE },
    { label: 'commander text', after: CMD_AFTER, replace: CMD_REPLACE },
    { label: 'mute manager expose', after: M_AFTER, replace: M_REPLACE },
    { label: 'chat manager expose', after: B_AFTER, replace: B_REPLACE },
    { label: 'render loop expose', after: RENDER_AFTER, replace: RENDER_REPLACE },
    { label: 'replay globals expose', after: REPLAY_AFTER, replace: REPLAY_REPLACE },
    { label: 'title position native', after: TITLE_POS_AFTER, replace: 'e.position.set(t._7847-t._1904/4,t._9202-t._1904/4-e.height/2)' },
    { label: 'title position worker-patched', after: 'e.position.set(t._7847,t._9202-t._1904/5-e.height/2)', replace: 'e.position.set(t._7847-t._1904/4,t._9202-t._1904/4-e.height/2)' },
    { label: 'team cell colors', after: TEAM_COLOR_AFTER, replace: TEAM_COLOR_REPLACE },
    { label: 'gallery expose', after: Y_GAL_AFTER, replace: Y_GAL_REPLACE },
    { label: 'playback bar expose', after: D_PB_AFTER, replace: D_PB_REPLACE },
    { label: 'replay system expose', after: RS_AFTER, replace: RS_REPLACE },
    { label: 'import/export expose', after: YT_IMEX_AFTER, replace: YT_IMEX_REPLACE },
    { label: 'notification expose', after: U_NOTIFY_AFTER, replace: U_NOTIFY_REPLACE },
    { label: 'camera expose', after: CAMERA_AFTER, replace: CAMERA_REPLACE },
    { label: 'screen expose', after: SCREEN_AFTER, replace: SCREEN_REPLACE },
    { label: 'freecam camera hook', after: FREECAM_CAMERA_AFTER, replace: FREECAM_CAMERA_REPLACE },
    { label: 'eject expose', after: EJECT_AFTER, replace: EJECT_REPLACE },
    { label: 'packet handler expose', after: NE_AFTER, replace: NE_REPLACE },
    { label: 'ping cooldown expose', after: ME_PING_AFTER, replace: ME_PING_REPLACE },
    { label: 'skin globals expose', after: SKIN_AFTER, replace: SKIN_AFTER + SKIN_CODE },
    { label: 'name tint/scale', after: NAME_AFTER, replace: NAME_AFTER + NAME_CODE + NAME_SCALE_INJECT },
    { label: 'mass tint path 1', after: TINT_AFTER_1, replace: TINT_AFTER_1 + TINT_CODE_1 },
    { label: 'mass tint path 2', after: TINT_AFTER_2, replace: TINT_AFTER_2 + TINT_CODE_2 },
    { label: 'pellet texture swap', after: PELLET_STYLE_AFTER, replace: PELLET_STYLE_REPLACE },
    { label: 'food particle vertex shader tint', after: FOOD_PARTICLE_VERTEX_SHADER_AFTER, replace: FOOD_PARTICLE_VERTEX_SHADER_REPLACE },
    { label: 'food particle fragment shader tint', after: FOOD_PARTICLE_FRAGMENT_SHADER_AFTER, replace: FOOD_PARTICLE_FRAGMENT_SHADER_REPLACE },
    { label: 'food particle shader name', after: FOOD_PARTICLE_SHADER_NAME_AFTER, replace: FOOD_PARTICLE_SHADER_NAME_REPLACE },
    { label: 'food particle buffer size', after: FOOD_PARTICLE_BUFFER_AFTER, replace: FOOD_PARTICLE_BUFFER_REPLACE },
    { label: 'food particle vertex layout', after: FOOD_PARTICLE_LAYOUT_AFTER, replace: FOOD_PARTICLE_LAYOUT_REPLACE },
    { label: 'food particle static uv stride', after: FOOD_PARTICLE_UV_AFTER, replace: FOOD_PARTICLE_UV_REPLACE },
    { label: 'food particle white texture toggle', after: FOOD_PARTICLE_TEXTURE_AFTER, replace: FOOD_PARTICLE_TEXTURE_REPLACE },
    { label: 'food particle rainbow colors', after: FOOD_PARTICLE_COLORS_AFTER, replace: FOOD_PARTICLE_COLORS_REPLACE },
    { label: 'agar map renderer clear', after: AGAR_MAP_RENDERER_CLEAR_AFTER, replace: AGAR_MAP_RENDERER_CLEAR_REPLACE },
    { label: 'agar map background visibility', after: AGAR_MAP_BACKGROUND_VIS_AFTER, replace: AGAR_MAP_BACKGROUND_VIS_REPLACE },
    { label: 'agar map grid texture', after: AGAR_MAP_TEXTURE_AFTER, replace: AGAR_MAP_TEXTURE_REPLACE.replace('e=2048,s=40', 'e=2048,s=20') },
    { label: 'custom virus atlas 1', after: ILL_ORB_AFTER, replace: ILL_ORB_REPLACE },
    { label: 'custom virus atlas 2', after: ILL_ORB2_AFTER, replace: ILL_ORB2_REPLACE },
    { label: 'mass digit atlas', after: ATLAS_AFTER, replace: ATLAS_REPLACE },
    { label: 'native tag suppress', after: 'Q.SHOW_TEAM_NAME._5997()&&e.length>0&&"ITS-BOT-TEAM"!==e', replace: 'Q.SHOW_TEAM_NAME._5997()&&e.length>0&&"ITS-BOT-TEAM"!==e&&!globalThis.__ryuHideNativeTag' },
    { label: 'leftward name tag prepend', after: 'i=Yt._4975(s,void 0)', replace: 'i=Yt._4975((function(){var _tg=t._2182&&t._2182._1059?t._2182._1059._9067:"";return(_tg&&_tg!=="ITS-BOT-TEAM"&&globalThis.__ryuHideNativeTag)?" ["+_tg+"] "+s+" ":s;})(),void 0)' }
  ];

  function fetchSourceSync(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    if (xhr.status < 200 || xhr.status >= 400) throw new Error('HTTP ' + xhr.status);
    return xhr.responseText;
  }

  function sanitizeLegacyLeftward(src) {
    for (var i = 0; i < SANITIZE_RULES.length; i++) {
      var rule = SANITIZE_RULES[i];
      if (src.indexOf(rule.after) !== -1) src = src.replace(rule.after, rule.replace);
    }
    return src;
  }

  function applyReplacements(src) {
    src = sanitizeLegacyLeftward(src);
    var misses = [];
    for (var i = 0; i < REPLACEMENTS.length; i++) {
      var rule = REPLACEMENTS[i];
      if (src.indexOf(rule.after) === -1) {
        if (!rule.present || src.indexOf(rule.present) === -1) misses.push(rule.label);
        continue;
      }
      src = src.replace(rule.after, rule.replace);
    }
    if (misses.length) console.warn('[RyuTheme] Local ryuten patch missed:', misses.join(', '));
    return src;
  }

  function executeSource(src, isPatched, sourceName) {
    var wrapped = 'globalThis.__ryuLocalLeftwardSourcePatch=' + (isPatched ? 'true' : 'false') + ';\n' + src + '\n//# sourceURL=' + (sourceName || 'ryuten-local.js');
    try {
      (0, eval)(wrapped);
      return;
    } catch (evalErr) {
      try {
        var blob = new Blob([wrapped], { type: 'text/javascript' });
        var blobUrl = URL.createObjectURL(blob);
        var script = document.createElement('script');
        script.async = false;
        script.src = blobUrl;
        script.onload = function() { URL.revokeObjectURL(blobUrl); };
        script.onerror = function() { URL.revokeObjectURL(blobUrl); };
        (document.head || document.documentElement).appendChild(script);
      } catch (blobErr) {
        console.error('[RyuTheme] Local loader execution failed', evalErr, blobErr);
        throw blobErr;
      }
    }
  }

  globalThis.__ryuApplyReplacements = applyReplacements;
})();