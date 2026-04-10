/**
 * lib/slides.ts
 * Utilitários para geração de apresentações HTML em slides (landscape 1280×720).
 * Usado por AnaliseClientArea e PlanoClientArea.
 */

export type SlideEntry = { dark?: boolean; html: string }

// ── Escape / inline ───────────────────────────────────────────────────────────

export function escHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function boldHtml(s: string): string {
  return escHtml(s).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
}

// ── Tabela markdown → HTML ────────────────────────────────────────────────────

/**
 * Converte linhas de tabela markdown (inclusive linha de separador) em <table>.
 * Aceita linhas já filtradas (sem separador) ou com separador — isSep remove automaticamente.
 */
export function renderTabelaHtml(linhas: string[]): string {
  const cel = (l: string) => l.split('|').slice(1, -1).map((c) => c.trim())
  const isSep = (l: string) => /^[\s|:\-]+$/.test(l)
  const validas = linhas.filter((l) => !isSep(l))
  if (!validas.length) return ''
  const [head, ...body] = validas
  const ths = cel(head)
    .map((c) => '<th>' + boldHtml(c) + '</th>')
    .join('')
  const rows = body
    .map((l, i) => {
      const tds = cel(l)
        .map((c) => '<td>' + boldHtml(c) + '</td>')
        .join('')
      return '<tr class="' + (i % 2 === 1 ? 'alt' : '') + '">' + tds + '</tr>'
    })
    .join('')
  return (
    '<table><thead><tr>' + ths + '</tr></thead><tbody>' + rows + '</tbody></table>'
  )
}

// ── Conteúdo genérico (parágrafos + tabelas) → HTML ──────────────────────────

export function renderConteudoHtml(linhas: string[]): string {
  const parts: string[] = []
  let tbl: string[] = []
  for (const raw of linhas) {
    const t = raw.trim()
    if (!t || t === '---') {
      if (tbl.length) {
        parts.push(renderTabelaHtml(tbl))
        tbl = []
      }
      continue
    }
    if (t.startsWith('|')) {
      tbl.push(t)
    } else {
      if (tbl.length) {
        parts.push(renderTabelaHtml(tbl))
        tbl = []
      }
      parts.push('<p>' + boldHtml(t) + '</p>')
    }
  }
  if (tbl.length) parts.push(renderTabelaHtml(tbl))
  return parts.join('\n')
}

// ── Logo "MENTORIA / PRIMUS" ──────────────────────────────────────────────────

export function logoHtml(): string {
  return [
    '<div class="logo">',
    '<div class="logo-mentoria">MENTORIA</div>',
    '<div class="logo-primus">PRIMUS</div>',
    '<div class="logo-linha"></div>',
    '</div>',
  ].join('\n')
}

// ── HTML completo da apresentação ─────────────────────────────────────────────

export function buildSlidesHtml(slides: SlideEntry[], tituloDoc: string): string {
  const N = slides.length
  const slidesHtml = slides
    .map((s, i) => {
      const cls = ['slide', s.dark ? 'slide-dark' : '', i === 0 ? 'active' : '']
        .filter(Boolean)
        .join(' ')
      return '<div class="' + cls + '">\n' + s.html + '\n</div>'
    })
    .join('\n')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<title>${escHtml(tituloDoc)}</title>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Poppins:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#111;min-height:100vh;font-family:'Poppins',sans-serif;display:flex;flex-direction:column;align-items:center;padding:52px 20px 68px}
/* toolbar */
#toolbar{position:fixed;top:0;right:0;z-index:200;display:flex;align-items:center;gap:10px;padding:8px 16px;background:rgba(0,0,0,.65);border-bottom-left-radius:10px}
#toolbar span{color:rgba(255,255,255,.5);font-size:13px}
#toolbar button{background:#f7e4ca;color:#05343d;border:none;padding:7px 14px;border-radius:7px;font-size:13px;font-family:'Poppins',sans-serif;font-weight:600;cursor:pointer}
#toolbar button:hover{background:#eed5a8}
/* wrapper */
.slides-wrapper{width:1280px;height:720px;position:relative;border-radius:10px;overflow:hidden;box-shadow:0 20px 80px rgba(0,0,0,.7)}
/* slide base */
.slide{position:absolute;inset:0;width:1280px;height:720px;padding:60px 64px;background:#f5f5f5;display:none;flex-direction:column;overflow:hidden}
.slide.active{display:flex}
/* slide escuro */
.slide-dark{background:#05343d;justify-content:center;align-items:center;text-align:center}
/* logo */
.logo{display:flex;flex-direction:column;align-items:center;gap:2px;margin-bottom:20px}
.logo-mentoria{font-family:'Playfair Display',serif;font-size:13px;letter-spacing:.4em;color:#f7e4ca;opacity:.7;text-transform:uppercase}
.logo-primus{font-family:'Playfair Display',serif;font-size:40px;font-weight:700;color:#f7e4ca;line-height:1}
.logo-linha{border-bottom:1px solid rgba(247,228,202,.3);width:180px;margin-top:8px}
/* capa */
.capa{display:flex;flex-direction:column;align-items:center;position:relative;width:100%}
.capa-subtitulo-label{font-size:13px;letter-spacing:.3em;color:#f7e4ca;opacity:.7;text-transform:uppercase;margin-top:16px}
.capa-nome{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;color:#f7e4ca;margin-top:8px;line-height:1.25}
.capa-meta{font-size:13px;color:rgba(247,228,202,.6);margin-top:12px}
.capa-rodape{position:absolute;bottom:-20px;font-size:12px;color:rgba(247,228,202,.3);letter-spacing:1px}
/* títulos de slide */
.slide-titulo{font-family:'Playfair Display',serif;font-size:26px;font-weight:600;color:#05343d;margin-bottom:20px;padding-bottom:14px;border-bottom:2px solid rgba(5,52,61,.12);flex-shrink:0;line-height:1.25}
.fase-supertitulo{font-size:11px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:rgba(5,52,61,.38);margin-bottom:6px;flex-shrink:0}
.fase-titulo{font-size:22px;margin-bottom:18px;padding-bottom:14px;border-bottom:2px solid rgba(5,52,61,.12)}
.slide-nota{font-size:12px;color:rgba(5,52,61,.4);font-style:italic;margin-top:auto;padding-top:8px;flex-shrink:0}
/* corpo */
.slide-corpo{flex:1;overflow:hidden;display:flex;flex-direction:column;gap:10px}
.slide-corpo p{font-size:15px;color:#333;line-height:1.65}
.slide-corpo.small p{font-size:13px}
.slide-corpo.small table{font-size:12px}
/* tabela */
table{width:100%;border-collapse:collapse;font-size:13.5px;flex-shrink:0}
thead tr{background:#05343d}
thead th{padding:10px 14px;text-align:left;font-weight:600;color:#f7e4ca}
tbody td{padding:8px 14px;color:#333;border-top:1px solid #e0e0e0;vertical-align:top}
tbody tr.alt td{background:#f5f5f5}
tbody tr:not(.alt) td{background:#fff}
/* lista de direcionamentos */
.dir-list{list-style:none;display:flex;flex-direction:column;gap:14px;padding:0;counter-reset:item}
.dir-list li{counter-increment:item;display:flex;align-items:flex-start;gap:18px;font-size:16px;color:#333;line-height:1.45}
.dir-list li::before{content:counter(item,decimal-leading-zero);font-family:'Playfair Display',serif;font-size:22px;font-weight:700;color:#05343d;opacity:.32;min-width:40px;flex-shrink:0;line-height:1;padding-top:1px}
/* encerramento */
.encerramento{display:flex;flex-direction:column;align-items:center}
.enc-sub{font-size:18px;color:rgba(247,228,202,.5);letter-spacing:3px;text-transform:uppercase;margin-top:8px}
.enc-ano{font-size:13px;color:rgba(247,228,202,.28);margin-top:16px;letter-spacing:1px}
/* nav */
#nav{position:fixed;bottom:0;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:20px;padding:12px 20px;background:rgba(0,0,0,.55);backdrop-filter:blur(6px);z-index:100}
#nav button{background:rgba(247,228,202,.1);color:#f7e4ca;border:1px solid rgba(247,228,202,.2);padding:8px 20px;border-radius:7px;font-size:14px;font-family:'Poppins',sans-serif;font-weight:500;cursor:pointer}
#nav button:hover:not([disabled]){background:rgba(247,228,202,.2)}
#nav button[disabled]{opacity:.3;cursor:default}
#nav span{color:rgba(255,255,255,.5);font-size:13px;min-width:70px;text-align:center}
/* print */
@media print{
  @page{size:1280px 720px landscape;margin:0}
  body{background:#fff!important;padding:0!important;min-height:0}
  #toolbar,#nav{display:none!important}
  .slides-wrapper{box-shadow:none!important;border-radius:0!important;width:100vw!important;height:100vh!important}
  .slide{display:none!important;width:100vw!important;height:100vh!important}
  .slide.active{display:flex!important;position:absolute!important;inset:0!important}
}
</style>
</head>
<body>
<div id="toolbar">
  <span id="lbl">Slide 1 de ${N}</span>
  <button onclick="window.print()">&#128424;&#65039; Imprimir / Salvar PDF</button>
</div>
<div class="slides-wrapper">
${slidesHtml}
</div>
<div id="nav">
  <button id="p" onclick="go(-1)" disabled>&larr; Anterior</button>
  <span id="c">1 / ${N}</span>
  <button id="n" onclick="go(1)">Pr&oacute;ximo &rarr;</button>
</div>
<script>
var cur=0,tot=${N},sl=document.querySelectorAll('.slide');
function go(d){sl[cur].classList.remove('active');cur=Math.max(0,Math.min(tot-1,cur+d));sl[cur].classList.add('active');document.getElementById('c').textContent=(cur+1)+' / '+tot;document.getElementById('lbl').textContent='Slide '+(cur+1)+' de '+tot;document.getElementById('p').disabled=cur===0;document.getElementById('n').disabled=cur===tot-1;}
document.addEventListener('keydown',function(e){if(e.key==='ArrowRight'||e.key==='ArrowDown')go(1);if(e.key==='ArrowLeft'||e.key==='ArrowUp')go(-1);});
</script>
</body>
</html>`
}
