/* ==========================================================
   ABAS "MEU SITE": Portfólio e Marcas
   ========================================================== */
(function () {
  "use strict";
  var A = window.Admin, $ = A.$, $$ = A.$$, esc = A.esc, ico = A.ico;

  var NICHOS = ["Skincare", "Casa e decoração", "Fitness", "Viagem"];
  var FORMATOS = ["Reels", "Stories", "Foto", "Carrossel", "TikTok", "YouTube"];

  /* ==================== PORTFÓLIO ==================== */
  function formVideo(v, aoSalvar, maxOrdem) {
    var novo = !v;
    var vals = v || { visivel: true };
    A.formulario({
      titulo: novo ? "Novo vídeo" : "Editar vídeo",
      valores: vals,
      campos: [
        { n: "titulo", r: "Título", req: true },
        { n: "link", r: "Link do vídeo", t: "url", dica: "https://www.instagram.com/reel/..." },
        { n: "nicho", r: "Nicho", lista: NICHOS, meia: true },
        { n: "formato", r: "Formato", t: "select", meia: true, opcoes: [["", "Escolha"]].concat(FORMATOS.map(function (f) { return [f, f]; })) },
        { n: "marca", r: "Marca", meia: true },
        { n: "destaque", r: "Destaque", dica: "2,4M views", meia: true },
        { n: "capa", r: "Imagem de capa (opcional)", dica: "fotos/minha-capa.jpg ou um endereço de imagem" },
        { n: "visivel", r: "Mostrar no site", t: "checkbox" }
      ],
      apagar: novo ? null : function () { return A.gravar("videos", function (t) { return t.delete().eq("id", v.id); }).then(function (r) { if (!r.erro) { A.toast("Vídeo apagado."); aoSalvar(); } return !r.erro; }); },
      salvar: function (dados) {
        if (novo) dados.ordem = (maxOrdem || 0) + 1;
        return A.gravar("videos", function (t) { return novo ? t.insert(dados) : t.update(dados).eq("id", v.id); }).then(function (r) {
          if (!r.erro) { A.toast("Vídeo salvo."); aoSalvar(); }
          return !r.erro;
        });
      }
    });
  }

  A.aba("portfolio", "Portfólio", "portfolio", "meu site", function (el) {
    var d = new Date(); d.setDate(d.getDate() - 13);
    var ini = A.iso(d);
    return Promise.all([
      A.ler("visitas", function (q) { return q.gte("data", ini); }),
      A.ler("videos", function (q) { return q.order("ordem", { ascending: true }).order("id", { ascending: true }); })
    ]).then(function (r) {
      var visitas = r[0], videos = r[1];
      var hoje = A.hoje();
      var noAr = videos.filter(function (v) { return v.visivel && !v.exemplo; });
      var nichoTop = A.maisComum(noAr.map(function (v) { return v.nicho; }));
      var origemTop = A.maisComum(visitas.map(function (x) { return x.origem || "Direto"; }));
      var hojeN = visitas.filter(function (x) { return String(x.data).slice(0, 10) === hoje; }).length;

      /* 14 dias */
      var dias = [], porDia = {};
      visitas.forEach(function (x) { var k = String(x.data).slice(0, 10); porDia[k] = (porDia[k] || 0) + 1; });
      for (var i = 13; i >= 0; i--) { var dd = new Date(); dd.setDate(dd.getDate() - i); var k = A.iso(dd); dias.push({ k: k, n: porDia[k] || 0 }); }
      var maximo = dias.reduce(function (m, x) { return Math.max(m, x.n); }, 0);

      var grafico = visitas.length === 0
        ? '<p class="vazio">Quando as pessoas começarem a visitar o seu portfólio, as barras dos últimos 14 dias aparecem aqui.</p>'
        : '<div class="grafico">' + dias.map(function (x) {
            var h = maximo > 0 ? Math.max(2, Math.round((x.n / maximo) * 100)) : 2;
            return '<div class="col"><span class="n">' + (x.n || "") + '</span><div class="barra-g' + (x.n ? "" : " zero") + '" style="height:' + h + '%" title="' + A.fmtData(x.k) + ": " + x.n + ' visita(s)"></div></div>';
          }).join("") + '</div><div class="grafico-datas">' + dias.map(function (x) { return "<span>" + x.k.slice(8, 10) + "/" + x.k.slice(5, 7) + "</span>"; }).join("") + "</div>";

      /* de onde vêm */
      var contOrigem = {};
      visitas.forEach(function (x) { var o = x.origem || "Direto"; contOrigem[o] = (contOrigem[o] || 0) + 1; });
      var lista = Object.keys(contOrigem).sort(function (a, b) { return contOrigem[b] - contOrigem[a]; }).slice(0, 8);
      var origens = lista.length === 0
        ? '<p class="vazio">Quando as pessoas chegarem, você vê aqui se vieram do Instagram, do Google ou de um link direto.</p>'
        : lista.map(function (o) {
            var pc = Math.round((contOrigem[o] / visitas.length) * 100);
            return '<div class="origem"><span>' + esc(o) + '</span><b>' + contOrigem[o] + '</b><div class="fio"><i style="width:' + pc + '%"></i></div></div>';
          }).join("");

      el.innerHTML =
        '<div class="faixa-m">' +
          '<div><b>' + A.numero(visitas.length) + '</b><span>Visitas em 14 dias</span></div>' +
          '<div><b>' + A.numero(hojeN) + '</b><span>Visitas hoje</span></div>' +
          '<div><b>' + A.numero(noAr.length) + '</b><span>Vídeos no ar</span></div>' +
          '<div><b>' + esc(nichoTop || "Sem dados") + '</b><span>Nicho mais forte</span></div>' +
          '<div><b>' + esc(origemTop || "Sem dados") + '</b><span>De onde mais vêm</span></div>' +
        "</div>" +
        '<div class="dois"><div class="cartao"><h2>Visitas nos últimos 14 dias</h2>' + grafico + '</div>' +
        '<div class="cartao"><h2>Por onde chegaram</h2>' + origens + "</div></div>" +
        '<div class="cartao"><div class="barra"><h2 style="margin:0">Meus vídeos</h2><span class="espaco"></span>' +
          '<button class="bt bt-p" id="novoVideo">' + ico("mais") + "Adicionar vídeo</button></div>" +
          '<p class="nota" style="margin-bottom:8px">O olhinho mostra ou esconde do site. Arraste pela alcinha para mudar a ordem.</p>' +
          '<div class="rolagem"><table class="tab" id="tabVideos"><thead><tr><th style="width:30px"></th><th>Título</th><th>Nicho</th><th>Formato</th><th>Marca</th><th>Destaque</th><th style="width:120px"></th></tr></thead><tbody></tbody></table></div></div>';

      var lin = videos.slice();
      var corpo = $("#tabVideos tbody", el);
      function desenhar() {
        if (!lin.length) { corpo.innerHTML = '<tr><td colspan="7" class="vazio">Nenhum vídeo ainda. Clique em Adicionar vídeo.</td></tr>'; return; }
        corpo.innerHTML = lin.map(function (v) {
          return '<tr data-id="' + v.id + '">' +
            '<td><span class="alca" title="Arrastar" data-alca>' + ico("alca") + "</span></td>" +
            "<td><b>" + esc(v.titulo) + "</b>" + (v.exemplo ? '<span class="tag ex">exemplo</span>' : "") + "</td>" +
            "<td>" + esc(v.nicho || "") + "</td><td>" + esc(v.formato || "") + "</td><td>" + esc(v.marca || "") + "</td><td>" + esc(v.destaque || "") + "</td>" +
            '<td class="num">' +
              (v.link ? '<a class="ic-bt" href="' + esc(v.link) + '" target="_blank" rel="noopener" title="Abrir vídeo">' + ico("externo") + "</a>" : "") +
              '<button class="ic-bt" data-ver title="' + (v.visivel ? "Esconder do site" : "Mostrar no site") + '">' + ico(v.visivel ? "olho" : "olhoOff") + "</button>" +
              '<button class="ic-bt" data-editar title="Editar">' + ico("lapis") + "</button>" +
              '<button class="ic-bt" data-apagar title="Apagar">' + ico("lixeira") + "</button></td></tr>";
        }).join("");
      }
      desenhar();

      var recarregar = function () { A.recarregar(); };
      $("#novoVideo", el).onclick = function () {
        formVideo(null, recarregar, lin.reduce(function (m, v) { return Math.max(m, v.ordem || 0); }, 0));
      };
      corpo.addEventListener("click", function (e) {
        var tr = e.target.closest("tr[data-id]"); if (!tr) return;
        var v = lin.filter(function (x) { return String(x.id) === tr.dataset.id; })[0]; if (!v) return;
        if (e.target.closest("[data-editar]")) formVideo(v, recarregar);
        else if (e.target.closest("[data-apagar]")) {
          A.confirmar('Apagar o vídeo "' + v.titulo + '"?').then(function (sim) {
            if (sim) A.gravar("videos", function (t) { return t.delete().eq("id", v.id); }).then(function (x) { if (!x.erro) { A.toast("Vídeo apagado."); recarregar(); } });
          });
        } else if (e.target.closest("[data-ver]")) {
          A.gravar("videos", function (t) { return t.update({ visivel: !v.visivel }).eq("id", v.id); }).then(function (x) {
            if (!x.erro) { v.visivel = !v.visivel; desenhar(); A.toast(v.visivel ? "Agora aparece no site." : "Escondido do site."); }
          });
        }
      });

      /* arrastar para mudar a ordem (só pela alcinha) */
      var arrastado = null;
      corpo.addEventListener("mousedown", function (e) {
        var al = e.target.closest("[data-alca]");
        var tr = e.target.closest("tr[data-id]");
        $$("tr", corpo).forEach(function (t) { t.draggable = false; });
        if (al && tr) tr.draggable = true;
      });
      corpo.addEventListener("dragstart", function (e) {
        var tr = e.target.closest("tr[data-id]"); if (!tr) return;
        arrastado = tr.dataset.id; tr.classList.add("arrastando");
        if (e.dataTransfer) { e.dataTransfer.effectAllowed = "move"; e.dataTransfer.setData("text/plain", arrastado); }
      });
      corpo.addEventListener("dragover", function (e) {
        if (!arrastado) return; e.preventDefault();
        $$("tr.alvo", corpo).forEach(function (t) { t.classList.remove("alvo"); });
        var tr = e.target.closest("tr[data-id]"); if (tr && tr.dataset.id !== arrastado) tr.classList.add("alvo");
      });
      corpo.addEventListener("dragend", function () {
        arrastado = null;
        $$("tr", corpo).forEach(function (t) { t.classList.remove("alvo", "arrastando"); t.draggable = false; });
      });
      corpo.addEventListener("drop", function (e) {
        if (!arrastado) return; e.preventDefault();
        var alvo = e.target.closest("tr[data-id]");
        var de = lin.findIndex(function (x) { return String(x.id) === arrastado; });
        var para = alvo ? lin.findIndex(function (x) { return String(x.id) === alvo.dataset.id; }) : lin.length - 1;
        if (de < 0 || para < 0 || de === para) return;
        var item = lin.splice(de, 1)[0]; lin.splice(para, 0, item);
        desenhar();
        var mudou = [];
        lin.forEach(function (v, i) { if (v.ordem !== i) { v.ordem = i; mudou.push(v); } });
        Promise.all(mudou.map(function (v) { return A.gravar("videos", function (t) { return t.update({ ordem: v.ordem }).eq("id", v.id); }); }))
          .then(function () { A.toast("Ordem salva."); });
      });
    });
  });

  /* ==================== MARCAS ==================== */
  var SITUACOES = [["lead", "Lead"], ["conversando", "Conversando"], ["cliente", "Cliente"], ["parada", "Parada"]];
  function rotuloSit(s) { var x = SITUACOES.filter(function (o) { return o[0] === s; })[0]; return x ? x[1] : s || ""; }
  function limparInsta(s) {
    s = String(s || "").trim(); if (!s) return "";
    s = s.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").replace(/^@/, "");
    return s;
  }
  function zap(tel) {
    var d = String(tel || "").replace(/\D/g, ""); if (d.length < 8) return "";
    if (d.length <= 11) d = "55" + d;
    return "https://wa.me/" + d;
  }
  function formMarca(m, aoSalvar) {
    var novo = !m;
    A.formulario({
      titulo: novo ? "Nova marca" : "Editar marca",
      valores: m || { situacao: "lead", ultimo_contato: A.hoje() },
      campos: [
        { n: "nome", r: "Marca", req: true },
        { n: "instagram", r: "Instagram", dica: "@nomedamarca", meia: true },
        { n: "email", r: "E-mail", t: "email", meia: true },
        { n: "telefone", r: "Telefone / WhatsApp", t: "tel", dica: "(00) 00000-0000", meia: true },
        { n: "situacao", r: "Situação", t: "select", meia: true, opcoes: SITUACOES },
        { n: "ultimo_contato", r: "Último contato", t: "date", meia: true },
        { n: "obs", r: "Observação", t: "textarea" }
      ],
      apagar: novo ? null : function () { return A.gravar("marcas", function (t) { return t.delete().eq("id", m.id); }).then(function (r) { if (!r.erro) { A.toast("Marca apagada."); aoSalvar(); } return !r.erro; }); },
      salvar: function (d) {
        if (d.instagram) d.instagram = "@" + limparInsta(d.instagram);
        return A.gravar("marcas", function (t) { return novo ? t.insert(d) : t.update(d).eq("id", m.id); }).then(function (r) {
          if (!r.erro) { A.toast("Marca salva."); aoSalvar(); }
          return !r.erro;
        });
      }
    });
  }

  A.aba("marcas", "Marcas", "marcas", "meu site", function (el) {
    return A.ler("marcas", function (q) { return q.order("criado_em", { ascending: false }); }).then(function (marcas) {
      var busca = "", filtro = "todas";
      el.innerHTML =
        '<div class="barra">' +
          '<label class="campo-busca">' + ico("busca") + '<input id="mBusca" type="search" placeholder="Buscar por nome, @ ou e-mail" aria-label="Buscar"></label>' +
          '<div class="chips" id="mChips"></div><span class="espaco"></span>' +
          '<button class="bt bt-s" id="mCsv">' + ico("baixar") + "Baixar CSV</button>" +
          '<button class="bt bt-p" id="mNova">' + ico("mais") + "Adicionar marca</button></div>" +
        '<div class="cartao" style="padding:6px 6px"><div class="rolagem"><table class="tab"><thead><tr><th>Marca</th><th>Instagram</th><th>E-mail</th><th>Telefone</th><th>Situação</th><th>Observação</th><th>Último contato</th></tr></thead><tbody id="mCorpo"></tbody></table></div></div>' +
        '<p class="nota" id="mConta"></p>';

      function filtradas() {
        var q = busca.toLowerCase();
        return marcas.filter(function (m) {
          if (filtro !== "todas" && m.situacao !== filtro) return false;
          if (!q) return true;
          return [m.nome, m.instagram, m.email].join(" ").toLowerCase().indexOf(q) > -1;
        });
      }
      function chips() {
        $("#mChips", el).innerHTML = [["todas", "Todas"]].concat(SITUACOES).map(function (o) {
          return '<button class="chip' + (filtro === o[0] ? " on" : "") + '" data-f="' + o[0] + '">' + o[1] + "</button>";
        }).join("");
      }
      function tabela() {
        var l = filtradas();
        $("#mCorpo", el).innerHTML = l.length ? l.map(function (m) {
          var insta = limparInsta(m.instagram), w = zap(m.telefone);
          return '<tr class="clicavel" data-id="' + m.id + '">' +
            "<td><b>" + esc(m.nome) + "</b>" + (m.exemplo ? '<span class="tag ex">exemplo</span>' : "") + "</td>" +
            "<td>" + (insta ? '<a href="https://instagram.com/' + esc(insta) + '" target="_blank" rel="noopener" style="color:var(--rosa-esc);font-weight:700">@' + esc(insta) + "</a>" : "") + "</td>" +
            "<td>" + esc(m.email || "") + "</td>" +
            "<td>" + esc(m.telefone || "") + (w ? ' <a class="ic-bt" href="' + w + '" target="_blank" rel="noopener" title="Abrir WhatsApp" style="width:26px;height:26px;color:var(--verde)">' + ico("telefone") + "</a>" : "") + "</td>" +
            '<td><span class="pill p-' + esc(m.situacao) + '">' + esc(rotuloSit(m.situacao)) + "</span></td>" +
            '<td class="cortar" title="' + esc(m.obs || "") + '">' + esc(m.obs || "") + "</td>" +
            "<td>" + A.fmtData(m.ultimo_contato) + "</td></tr>";
        }).join("") : '<tr><td colspan="7" class="vazio">Nenhuma marca encontrada.</td></tr>';
        $("#mConta", el).textContent = l.length + " de " + marcas.length + " marca(s)";
      }
      chips(); tabela();
      $("#mBusca", el).oninput = function (e) { busca = e.target.value; tabela(); };
      $("#mChips", el).onclick = function (e) { var b = e.target.closest("[data-f]"); if (!b) return; filtro = b.dataset.f; chips(); tabela(); };
      $("#mNova", el).onclick = function () { formMarca(null, A.recarregar); };
      $("#mCorpo", el).onclick = function (e) {
        if (e.target.closest("a")) return;
        var tr = e.target.closest("tr[data-id]"); if (!tr) return;
        var m = marcas.filter(function (x) { return String(x.id) === tr.dataset.id; })[0];
        if (m) formMarca(m, A.recarregar);
      };
      $("#mCsv", el).onclick = function () {
        A.baixarCSV("marcas", [
          { t: "Marca", v: function (m) { return m.nome; } }, { t: "Instagram", v: function (m) { return m.instagram; } },
          { t: "E-mail", v: function (m) { return m.email; } }, { t: "Telefone", v: function (m) { return m.telefone; } },
          { t: "Situação", v: function (m) { return rotuloSit(m.situacao); } }, { t: "Observação", v: function (m) { return m.obs; } },
          { t: "Último contato", v: function (m) { return A.fmtData(m.ultimo_contato); } }
        ], filtradas());
      };
    });
  });
})();
