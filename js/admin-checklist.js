/* ==========================================================
   ABA "CHECKLIST PORTFÓLIO"
   O conteúdo vem inteiro de js/biblioteca.js (window.Biblioteca),
   sem resumir nem reescrever. O que você marca fica na tabela "marcados".
   ========================================================== */
(function () {
  "use strict";
  var A = window.Admin, $ = A.$, $$ = A.$$, esc = A.esc, ico = A.ico;

  var subAtual = "checklist";
  var estiloAtual = "Todos";
  var aberto = {};       /* seções abertas (só na tela) */
  var revisaoMarcada = {}; /* itens conferidos na revisão (só na tela) */

  function guardarRascunho(t) { try { localStorage.setItem("rascunhoRoteiro", t); } catch (e) {} }
  function lerRascunho() { try { return localStorage.getItem("rascunhoRoteiro") || ""; } catch (e) { return ""; } }

  A.aba("checklist", "Checklist", "checklist", "minha rotina", function (el) {
    var B = window.Biblioteca;
    if (!B) {
      el.innerHTML = '<div class="aviso erro">' + ico("alerta") + "<div>Não achei o arquivo js/biblioteca.js. Confira se ele foi publicado na pasta js. O resto do painel continua funcionando.</div></div>";
      return;
    }
    return A.ler("marcados").then(function (linhas) {
      var marcados = {};
      linhas.forEach(function (m) { if (m.feito) marcados[m.chave] = true; });

      var SUBS = [["checklist", "Checklist do portfólio"], ["refs", "Referências de vídeo"], ["roteiros", "Roteiros"], ["nichos", "Ideias por nicho"], ["revisar", "Revisar meu roteiro"]];

      function chaveItem(secao, i) { return "checklist:" + secao.id + ":" + i; }
      function contar(secao) {
        var feitos = 0; secao.itens.forEach(function (_, i) { if (marcados[chaveItem(secao, i)]) feitos++; });
        return { feitos: feitos, total: secao.itens.length };
      }

      /* ---- 1. checklist ---- */
      function vistaChecklist(alvo) {
        var totalGeral = 0, feitosGeral = 0;
        B.CHECKLIST.forEach(function (s) { var c = contar(s); totalGeral += c.total; feitosGeral += c.feitos; });
        var pcGeral = totalGeral ? Math.round((feitosGeral / totalGeral) * 100) : 0;
        alvo.innerHTML =
          '<div class="cartao"><div class="barra" style="margin:0"><b>Progresso geral</b><span class="espaco"></span><b>' + feitosGeral + " de " + totalGeral + " (" + pcGeral + '%)</b></div><div class="prog"><i style="width:' + pcGeral + '%"></i></div></div>' +
          B.CHECKLIST.map(function (s) {
            var c = contar(s), pc = c.total ? Math.round((c.feitos / c.total) * 100) : 0;
            return '<div class="acordeao' + (aberto[s.id] ? " aberto" : "") + '" data-sec="' + esc(s.id) + '">' +
              '<button class="cab" data-abrir><span class="em">' + esc(s.emoji || "") + '</span><span class="meio"><b>' + esc(s.nome) + "</b><small>" + esc(s.resumo || "") + '</small><div class="prog"><i style="width:' + pc + '%"></i></div></span><span class="nota">' + c.feitos + "/" + c.total + '</span><span class="seta-a">' + ico("chevron") + "</span></button>" +
              '<div class="corpo"><div class="porque"><b>Por que importa:</b> ' + esc(s.porque || "") + "</div>" +
              s.itens.map(function (it, i) {
                var k = chaveItem(s, i);
                return '<label class="check' + (marcados[k] ? " feito" : "") + '"><input type="checkbox" data-k="' + esc(k) + '"' + (marcados[k] ? " checked" : "") + '><span style="color:inherit"><b>' + esc(it.t) + "</b><span>" + esc(it.d || "") + "</span></span></label>";
              }).join("") + "</div></div>";
          }).join("");
        alvo.onclick = function (e) {
          var ab = e.target.closest("[data-abrir]");
          if (ab) { var sec = ab.closest(".acordeao"); sec.classList.toggle("aberto"); aberto[sec.dataset.sec] = sec.classList.contains("aberto"); }
        };
        alvo.onchange = function (e) {
          var cx = e.target.closest("input[data-k]"); if (!cx) return;
          var k = cx.dataset.k, marcou = cx.checked;
          var op = marcou
            ? A.gravar("marcados", function (t) { return t.upsert({ chave: k, feito: true, atualizado_em: new Date().toISOString() }, { onConflict: "chave" }); })
            : A.gravar("marcados", function (t) { return t.delete().eq("chave", k); });
          op.then(function (r) {
            if (r.erro) { cx.checked = !marcou; return; }
            if (marcou) marcados[k] = true; else delete marcados[k];
            vistaChecklist(alvo);
          });
        };
      }

      /* ---- 2. referências ---- */
      function vistaRefs(alvo) {
        var estilos = ["Todos"].concat(B.ESTILOS || []);
        var lista = B.REFERENCIAS.filter(function (r) { return estiloAtual === "Todos" || r.estilo === estiloAtual; });
        alvo.innerHTML =
          '<div class="chips" id="estChips" style="margin-bottom:14px">' + estilos.map(function (s) { return '<button class="chip' + (estiloAtual === s ? " on" : "") + '" data-e="' + esc(s) + '">' + esc(s) + "</button>"; }).join("") + "</div>" +
          '<div class="grade-ref">' + lista.map(function (r) {
            return '<button class="ref" data-ref="' + esc(r.id) + '"><div class="capa cor-' + esc(r.cor || "areia") + '">' + esc(r.emoji || "") + '</div><div class="inf"><b>' + esc(r.titulo) + "</b><small>" + esc(r.estilo || "") + " · " + esc(r.duracao || "") + "</small><small>" + esc(r.marca || "") + "</small></div></button>";
          }).join("") + "</div>";
        alvo.onclick = function (e) {
          var ch = e.target.closest("[data-e]");
          if (ch) { estiloAtual = ch.dataset.e; vistaRefs(alvo); return; }
          var b = e.target.closest("[data-ref]"); if (!b) return;
          var r = B.REFERENCIAS.filter(function (x) { return x.id === b.dataset.ref; })[0]; if (!r) return;
          A.abrirJanela('<div class="jan-topo"><h3>' + esc(r.emoji || "") + " " + esc(r.titulo) + '</h3><button class="ic-bt" data-x aria-label="Fechar">' + ico("x") + '</button></div><div class="ficha">' +
            '<span class="pill">' + esc(r.estilo || "") + '</span> <span class="pill">' + esc(r.audiencia || "") + '</span> <span class="pill">' + esc(r.duracao || "") + '</span> <span class="pill p-lead">' + esc(r.marca || "") + "</span>" +
            "<h4>O gancho</h4><p>" + esc(r.gancho || "") + "</p><h4>Por que funciona</h4><p>" + esc(r.porque || "") + "</p><h4>O diferencial</h4><p>" + esc(r.diferencial || "") + "</p><h4>O erro comum</h4><p>" + esc(r.erro || "") + "</p><h4>Roteiro</h4>" +
            (r.roteiro || []).map(function (b) { return '<div class="bloco-t"><b>' + esc(b.t) + "</b><div>" + (b.o || "") + "</div></div>"; }).join("") + "</div>" +
            (r.youtube ? '<div class="jan-pe"><span></span><a class="bt bt-p" href="' + esc(r.youtube) + '" target="_blank" rel="noopener">' + ico("play") + "Assistir</a></div>" : ""), 620);
        };
      }

      /* ---- 3. roteiros ---- */
      function vistaRoteiros(alvo) {
        alvo.innerHTML = B.TIPOS.map(function (t) {
          return '<div class="acordeao' + (aberto["t" + t.id] ? " aberto" : "") + '" data-sec="t' + esc(t.id) + '"><button class="cab" data-abrir><span class="em">' + esc(t.emoji || "") + '</span><span class="meio"><b>' + esc(t.nome) + "</b><small>" + esc(t.duracao || "") + '</small></span><span class="seta-a">' + ico("chevron") + "</span></button>" +
            '<div class="corpo"><div class="porque"><b>Quando usar:</b> ' + esc(t.porque || "") + "</div>" +
            (t.beats || []).map(function (b) { return '<div class="bloco-t"><b>' + esc(b.t) + "</b><div>" + (b.o || "") + "</div></div>"; }).join("") +
            ((t.erros || []).length ? '<div class="ficha"><h4>Erros comuns</h4>' + t.erros.map(function (x) { return "<p>• " + esc(x) + "</p>"; }).join("") + "</div>" : "") + "</div></div>";
        }).join("");
        alvo.onclick = function (e) { var ab = e.target.closest("[data-abrir]"); if (ab) { var s = ab.closest(".acordeao"); s.classList.toggle("aberto"); aberto[s.dataset.sec] = s.classList.contains("aberto"); } };
      }

      /* ---- 4. ideias por nicho ---- */
      function vistaNichos(alvo) {
        alvo.innerHTML =
          ((B.COMO_USAR || []).length ? '<div class="acordeao' + (aberto.usar ? " aberto" : "") + '" data-sec="usar"><button class="cab" data-abrir><span class="meio"><b>Como usar os ganchos</b></span><span class="seta-a">' + ico("chevron") + '</span></button><div class="corpo">' + B.COMO_USAR.map(function (x) { return '<div class="ideia">' + esc(x) + "</div>"; }).join("") + "</div></div>" : "") +
          B.NICHOS.map(function (n) {
            return '<div class="acordeao' + (aberto["n" + n.id] ? " aberto" : "") + '" data-sec="n' + esc(n.id) + '"><button class="cab" data-abrir><span class="em">' + esc(n.emoji || "") + '</span><span class="meio"><b>' + esc(n.nome) + "</b><small>" + (n.ideias || []).length + ' ideias</small></span><span class="seta-a">' + ico("chevron") + "</span></button>" +
              '<div class="corpo">' + (n.ideias || []).map(function (i) { return '<div class="ideia"><b>' + esc(i.t) + "</b><span>" + esc(i.gancho || "") + "</span></div>"; }).join("") + "</div></div>";
          }).join("");
        alvo.onclick = function (e) { var ab = e.target.closest("[data-abrir]"); if (ab) { var s = ab.closest(".acordeao"); s.classList.toggle("aberto"); aberto[s.dataset.sec] = s.classList.contains("aberto"); } };
      }

      /* ---- 5. revisar meu roteiro ---- */
      function vistaRevisar(alvo) {
        var total = 0, feitos = 0;
        B.REVISAO.forEach(function (b, bi) { b.itens.forEach(function (_, i) { total++; if (revisaoMarcada[bi + ":" + i]) feitos++; }); });
        alvo.innerHTML =
          '<div class="cartao"><h2>Cole o seu roteiro aqui</h2><textarea class="roteiro" id="roteiroTxt" placeholder="Cole ou escreva o seu roteiro para conferir item por item...">' + esc(lerRascunho()) + '</textarea><p class="nota" style="margin-top:6px">O texto fica guardado só neste navegador.</p></div>' +
          '<div class="cartao"><div class="barra" style="margin:0"><b>Conferidos</b><span class="espaco"></span><b id="revCont">' + feitos + " de " + total + "</b></div></div>" +
          B.REVISAO.map(function (b, bi) {
            return '<div class="acordeao aberto"><button class="cab" data-abrir><span class="em">' + esc(b.emoji || "") + '</span><span class="meio"><b>' + esc(b.bloco) + '</b></span><span class="seta-a">' + ico("chevron") + "</span></button>" +
              '<div class="corpo">' + b.itens.map(function (it, i) {
                var k = bi + ":" + i;
                return '<label class="check' + (revisaoMarcada[k] ? " feito" : "") + '"><input type="checkbox" data-r="' + k + '"' + (revisaoMarcada[k] ? " checked" : "") + '><span style="color:inherit"><b>' + esc(it.t) + "</b><span>" + esc(it.d || "") + "</span></span></label>";
              }).join("") + "</div></div>";
          }).join("");
        $("#roteiroTxt", alvo).oninput = function (e) { guardarRascunho(e.target.value); };
        alvo.onclick = function (e) { var ab = e.target.closest("[data-abrir]"); if (ab) ab.closest(".acordeao").classList.toggle("aberto"); };
        alvo.onchange = function (e) {
          var cx = e.target.closest("input[data-r]"); if (!cx) return;
          if (cx.checked) revisaoMarcada[cx.dataset.r] = true; else delete revisaoMarcada[cx.dataset.r];
          cx.closest(".check").classList.toggle("feito", cx.checked);
          var f = Object.keys(revisaoMarcada).length; $("#revCont", alvo).textContent = f + " de " + total;
        };
      }

      var VISTAS = { checklist: vistaChecklist, refs: vistaRefs, roteiros: vistaRoteiros, nichos: vistaNichos, revisar: vistaRevisar };
      el.innerHTML = '<div class="subabas" role="tablist">' + SUBS.map(function (s) { return '<button class="subaba' + (subAtual === s[0] ? " on" : "") + '" data-s="' + s[0] + '" role="tab">' + esc(s[1]) + "</button>"; }).join("") + '</div><div id="subCorpo"></div>';
      function mostrar() {
        $$(".subaba", el).forEach(function (b) { b.classList.toggle("on", b.dataset.s === subAtual); });
        var alvo = $("#subCorpo", el); alvo.onclick = null; alvo.onchange = null;
        VISTAS[subAtual](alvo);
      }
      $(".subabas", el).onclick = function (e) { var b = e.target.closest("[data-s]"); if (!b) return; subAtual = b.dataset.s; mostrar(); };
      mostrar();
    });
  });
})();
