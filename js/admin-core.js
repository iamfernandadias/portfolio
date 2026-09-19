/* ==========================================================
   NÚCLEO DO PAINEL: ferramentas comuns, menu, avisos, janelas
   e acesso ao banco. As abas ficam nos outros arquivos.
   ========================================================== */
(function () {
  "use strict";
  var A = window.Admin = { abas: [], avisos: {} };

  /* ---------- ferramentas pequenas ---------- */
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  A.$ = $; A.$$ = $$;
  A.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  var esc = A.esc;
  A.pad = function (n) { return String(n).padStart(2, "0"); };
  A.iso = function (d) { return d.getFullYear() + "-" + A.pad(d.getMonth() + 1) + "-" + A.pad(d.getDate()); };
  A.hoje = function () { return A.iso(new Date()); };
  A.data = function (iso) { var p = String(iso).slice(0, 10).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); };
  A.diasEntre = function (a, b) { return Math.round((A.data(b) - A.data(a)) / 86400000); };
  A.fmtData = function (iso) { return iso ? String(iso).slice(8, 10) + "/" + String(iso).slice(5, 7) + "/" + String(iso).slice(0, 4) : ""; };
  A.brl = function (n) { return Number(n || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }); };
  A.numero = function (n) { return Number(n || 0).toLocaleString("pt-BR"); };
  A.maisComum = function (lista) {
    var cont = {}, melhor = null;
    lista.forEach(function (x) { if (!x) return; cont[x] = (cont[x] || 0) + 1; if (melhor === null || cont[x] > cont[melhor]) melhor = x; });
    return melhor;
  };

  /* ---------- ícones de traço ---------- */
  var IC = {
    portfolio: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    marcas: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    calendario: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    campanhas: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
    checklist: '<polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>',
    sair: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    mais: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    lapis: '<path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',
    lixeira: '<polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>',
    olho: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    olhoOff: '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',
    estrela: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    alca: '<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
    baixar: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    telefone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    instagram: '<rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>',
    esq: '<polyline points="15 18 9 12 15 6"/>',
    dir: '<polyline points="9 18 15 12 9 6"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    externo: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    busca: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    escudo: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>',
    alerta: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    chevron: '<polyline points="9 18 15 12 9 6"/>'
  };
  A.ico = function (n) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[n] || "") + "</svg>"; };
  var ico = A.ico;

  /* ---------- avisos do topo (o que faltou no banco) ---------- */
  function desenharAvisos() {
    var caixa = $("#avisos");
    if (!caixa) return;
    var chaves = Object.keys(A.avisos);
    caixa.innerHTML = chaves.map(function (k) {
      return '<div class="aviso">' + ico("alerta") + "<div>" + esc(A.avisos[k]) + "</div></div>";
    }).join("");
  }
  function registrarFalta(tabela, erro) {
    var cod = (erro && erro.code) || "";
    var msg = (erro && erro.message) || String(erro || "");
    var texto;
    if (cod === "42P01" || cod === "PGRST205" || /does not exist|could not find the table/i.test(msg)) {
      texto = 'Faltou a tabela "' + tabela + '" no banco. Rode o arquivo banco.sql no Supabase. O resto do painel continua funcionando.';
    } else if (cod === "42703" || cod === "PGRST204" || /column|schema cache/i.test(msg)) {
      texto = 'Falta um campo na tabela "' + tabela + '" (' + msg + "). Rode o banco.sql de novo no Supabase.";
    } else if (cod === "42501" || /permission|row-level security|not allowed/i.test(msg)) {
      texto = 'Sem permissão para a tabela "' + tabela + '". Confira se o banco.sql foi rodado e se o seu login é o e-mail certo.';
    } else if (/fetch|network|failed/i.test(msg)) {
      texto = 'Não consegui falar com o banco (tabela "' + tabela + '"). Confira a internet.';
    } else {
      texto = 'Não consegui usar a tabela "' + tabela + '": ' + msg;
    }
    A.avisos[tabela] = texto;
    desenharAvisos();
  }
  A.registrarFalta = registrarFalta;

  /* ---------- ler e gravar no banco (nunca deixa a tela em branco) ---------- */
  /* Lê tudo de uma tabela, de mil em mil linhas. Se der erro, avisa e devolve lista vazia. */
  A.ler = function (tabela, ajuste) {
    var pagina = 1000, todas = [];
    function passo(de) {
      var q = window.sb.from(tabela).select("*");
      if (ajuste) q = ajuste(q);
      q = q.range(de, de + pagina - 1);
      return Promise.resolve(q).then(function (r) {
        if (r.error) { registrarFalta(tabela, r.error); return todas; }
        todas = todas.concat(r.data || []);
        if ((r.data || []).length === pagina && de < 20000) return passo(de + pagina);
        delete A.avisos[tabela]; desenharAvisos();
        return todas;
      });
    }
    return passo(0).catch(function (e) { registrarFalta(tabela, e); return []; });
  };
  /* Grava (inserir, atualizar, apagar). "fn" recebe a tabela e devolve a operação. */
  A.gravar = function (tabela, fn) {
    return Promise.resolve().then(function () { return fn(window.sb.from(tabela)); }).then(function (r) {
      if (r.error) { registrarFalta(tabela, r.error); A.toast("Não consegui salvar. Veja o aviso no topo da página.", "erro"); return { erro: true }; }
      return { dados: r.data };
    }).catch(function (e) { registrarFalta(tabela, e); A.toast("Não consegui salvar. Veja o aviso no topo da página.", "erro"); return { erro: true }; });
  };

  /* ---------- mensagens rápidas ---------- */
  A.toast = function (texto, tipo) {
    var el = document.createElement("div");
    el.className = "toast" + (tipo === "erro" ? " erro" : "");
    el.textContent = texto;
    $("#toasts").appendChild(el);
    setTimeout(function () { el.remove(); }, 3600);
  };

  /* ---------- janelas ---------- */
  A.abrirJanela = function (html, largura) {
    var el = document.createElement("div");
    el.className = "veu";
    el.innerHTML = '<div class="janela" role="dialog" aria-modal="true" style="max-width:' + (largura || 520) + 'px">' + html + "</div>";
    document.body.appendChild(el);
    el.fechar = function () { el.remove(); };
    el.addEventListener("mousedown", function (e) { if (e.target === el) el.fechar(); });
    $$("[data-x]", el).forEach(function (b) { b.addEventListener("click", el.fechar); });
    return el;
  };
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var janelas = $$(".veu");
    if (janelas.length) janelas[janelas.length - 1].remove();
    else document.getElementById("app").classList.remove("gaveta");
  });
  A.confirmar = function (mensagem, botao) {
    return new Promise(function (resolve) {
      var el = A.abrirJanela('<div class="jan-topo"><h3>Tem certeza?</h3></div><p>' + esc(mensagem) + '</p><div class="jan-pe"><span></span><div><button class="bt bt-s" data-nao>Cancelar</button> <button class="bt bt-perigo" data-sim>' + esc(botao || "Apagar") + "</button></div></div>", 400);
      el.querySelector("[data-nao]").onclick = function () { el.fechar(); resolve(false); };
      el.querySelector("[data-sim]").onclick = function () { el.fechar(); resolve(true); };
      el.addEventListener("mousedown", function (e) { if (e.target === el) resolve(false); });
    });
  };

  /* ---------- formulário em janela ----------
     campos: { n:'nome do campo', r:'Rótulo', t:'text|email|tel|url|number|date|select|textarea|checkbox',
               req:true, opcoes:[[valor,rótulo]], lista:['sugestões'], dica:'texto de exemplo', meia:true } */
  A.formulario = function (cfg) {
    var v = cfg.valores || {};
    var corpo = cfg.campos.map(function (c, i) {
      var id = "f_" + c.n, val = v[c.n], h;
      if (c.t === "checkbox") {
        return '<div class="f-linha chk"><input type="checkbox" id="' + id + '"' + (val ? " checked" : "") + '><label for="' + id + '">' + esc(c.r) + "</label></div>";
      }
      if (c.t === "select") {
        h = '<select id="' + id + '">' + c.opcoes.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (String(val == null ? "" : val) === String(o[0]) ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select>";
      } else if (c.t === "textarea") {
        h = '<textarea id="' + id + '" placeholder="' + esc(c.dica || "") + '">' + esc(val || "") + "</textarea>";
      } else {
        h = '<input id="' + id + '" type="' + (c.t || "text") + '" value="' + esc(val == null ? "" : val) + '" placeholder="' + esc(c.dica || "") + '"' + (c.t === "number" ? ' step="any" min="0"' : "") + (c.lista ? ' list="dl_' + c.n + '"' : "") + ">" +
            (c.lista ? '<datalist id="dl_' + c.n + '">' + c.lista.map(function (x) { return '<option value="' + esc(x) + '">'; }).join("") + "</datalist>" : "");
      }
      return '<div class="f-linha" data-campo="' + c.n + '"><label for="' + id + '">' + esc(c.r) + (c.req ? " *" : "") + "</label>" + h + '<div class="f-erro" hidden></div></div>';
    }).join("");
    var el = A.abrirJanela('<div class="jan-topo"><h3>' + esc(cfg.titulo) + '</h3><button class="ic-bt" data-x aria-label="Fechar">' + ico("x") + '</button></div><form novalidate><div class="duas-col">' + corpo + '</div><div class="jan-pe">' +
      (cfg.apagar ? '<button type="button" class="bt bt-perigo" data-apagar>Apagar</button>' : "<span></span>") +
      '<div><button type="button" class="bt bt-s" data-x>Cancelar</button> <button type="submit" class="bt bt-p">' + esc(cfg.botao || "Salvar") + "</button></div></div></form>", cfg.largura || 520);
    /* campos de texto longo ocupam a linha toda */
    $$(".f-linha", el).forEach(function (l) {
      var c = cfg.campos.filter(function (x) { return x.n === l.dataset.campo; })[0];
      if (!c || !c.meia) l.style.gridColumn = "1 / -1";
    });
    $$(".f-linha.chk", el).forEach(function (l) { l.style.gridColumn = "1 / -1"; });
    var primeiro = el.querySelector("input:not([type=checkbox]),select,textarea");
    if (primeiro) primeiro.focus();
    var form = el.querySelector("form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var vals = {}, ok = true;
      cfg.campos.forEach(function (c) {
        var inp = el.querySelector("#f_" + c.n), val;
        if (c.t === "checkbox") val = inp.checked;
        else if (c.t === "number") val = inp.value === "" ? null : Number(inp.value);
        else { val = inp.value.trim(); if (val === "") val = null; }
        vals[c.n] = val;
        var er = el.querySelector('[data-campo="' + c.n + '"] .f-erro');
        if (er) er.hidden = true;
        if (c.req && (val === null || val === "")) {
          ok = false;
          if (er) { er.textContent = "Preencha este campo."; er.hidden = false; }
        }
      });
      if (!ok) return;
      var botao = form.querySelector('[type="submit"]');
      botao.disabled = true;
      Promise.resolve(cfg.salvar(vals)).then(function (r) {
        if (r === false) { botao.disabled = false; return; }
        el.fechar();
      }).catch(function () { botao.disabled = false; });
    });
    var ap = el.querySelector("[data-apagar]");
    if (ap) ap.addEventListener("click", function () {
      A.confirmar(cfg.msgApagar || "Apagar este item? Não dá para desfazer.").then(function (sim) {
        if (!sim) return;
        Promise.resolve(cfg.apagar()).then(function (r) { if (r !== false) el.fechar(); });
      });
    });
    return el;
  };

  /* ---------- baixar CSV (abre certinho no Excel, com acento) ---------- */
  A.baixarCSV = function (nome, colunas, linhas) {
    function cel(x) { x = x == null ? "" : String(x); return '"' + x.replace(/"/g, '""') + '"'; }
    var texto = colunas.map(function (c) { return cel(c.t); }).join(";") + "\r\n" +
      linhas.map(function (l) { return colunas.map(function (c) { return cel(c.v(l)); }).join(";"); }).join("\r\n");
    var blob = new Blob(["﻿" + texto], { type: "text/csv;charset=utf-8" });
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = nome + "-" + A.hoje() + ".csv";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000);
  };

  /* ---------- registrar abas ---------- */
  A.aba = function (id, titulo, icone, grupo, desenhar) { A.abas.push({ id: id, titulo: titulo, icone: icone, grupo: grupo, desenhar: desenhar }); };

  /* ---------- teste da tranca ----------
     Tenta ler cada tabela SEM login (como um visitante) e compara com o que você vê logada. */
  A.testarTranca = function () {
    var tabelas = ["videos", "marcas", "calendario", "campanhas", "marcados", "visitas"];
    var el = A.abrirJanela('<div class="jan-topo"><h3>Teste de segurança</h3><button class="ic-bt" data-x aria-label="Fechar">' + ico("x") + '</button></div><p class="nota" style="margin-bottom:10px">Tento ler cada tabela como um visitante, sem login. O certo é o visitante ver zero linhas em todas.</p><div id="resTranca">Testando...</div>', 560);
    Promise.all(tabelas.map(function (t) {
      var anonimo = fetch(window.BANCO.url + "/rest/v1/" + t + "?select=*&limit=5", { headers: { apikey: window.BANCO.chave } })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, status: r.status, j: j }; }); })
        .catch(function () { return { rede: true }; });
      var logada = Promise.resolve(window.sb.from(t).select("*", { count: "exact", head: true })).then(function (r) { return r; }).catch(function () { return { error: true }; });
      return Promise.all([anonimo, logada]).then(function (p) { return { t: t, a: p[0], l: p[1] }; });
    })).then(function (rs) {
      var aberta = false;
      var linhas = rs.map(function (x) {
        var vis, cor, txt;
        if (x.a.rede) { return '<div class="atraso"><b>' + x.t + '</b><span class="tag amar">sem internet</span></div>'; }
        if (!x.a.ok) {
          var codigo = x.a.j && x.a.j.code;
          if (codigo === "PGRST205" || codigo === "42P01") return '<div class="atraso"><b>' + x.t + '</b><span class="tag amar">tabela não existe, rode o banco.sql</span></div>';
          return '<div class="atraso"><b>' + x.t + '</b><span class="tag verm">erro ' + esc(x.a.status) + "</span></div>";
        }
        vis = Array.isArray(x.a.j) ? x.a.j.length : 0;
        var eu = x.l && typeof x.l.count === "number" ? x.l.count : null;
        if (vis > 0) { aberta = true; txt = "ABERTA: um visitante leu " + vis + " linha(s)"; cor = "verm"; }
        else if (eu > 0) { txt = "trancada (você vê " + eu + ", visitante vê 0)"; cor = "amar"; }
        else { txt = "trancada, mas sem dados para provar"; cor = "amar"; }
        if (cor === "amar" && vis === 0 && eu > 0) cor = "amar";
        return '<div class="atraso"><b>' + x.t + '</b><span class="tag ' + (vis > 0 ? "verm" : "amar") + '" style="' + (vis === 0 && eu > 0 ? "background:var(--verde-claro);color:var(--verde)" : "") + '">' + esc(txt) + "</span></div>";
      });
      $("#resTranca", el).innerHTML = linhas.join("") + (aberta ? '<p class="f-erro" style="margin-top:10px">Tem tabela aberta. Rode o banco.sql inteiro de novo no Supabase.</p>' : '<p class="nota" style="margin-top:10px">Se nenhuma linha estiver em vermelho, a tranca está funcionando.</p>');
    });
  };

  /* ---------- montar o painel ---------- */
  var atual = null;
  function desenharMenu(sessao) {
    var grupos = [["meu site", ["portfolio", "marcas"]], ["minha rotina", ["calendario", "campanhas", "checklist"]]];
    var html = '<div class="marca">Fernanda Dias</div>';
    grupos.forEach(function (g) {
      html += '<div class="grupo">' + g[0] + "</div>";
      g[1].forEach(function (id) {
        var a = A.abas.filter(function (x) { return x.id === id; })[0];
        if (a) html += '<button class="item" data-aba="' + a.id + '">' + ico(a.icone) + esc(a.titulo) + "</button>";
      });
    });
    html += '<div class="pe-lado"><div class="mail">' + esc(sessao.user.email) + '</div>' +
      '<button class="item" data-tranca>' + ico("escudo") + "Testar segurança</button>" +
      '<button class="item" data-sair>' + ico("sair") + "Sair</button></div>";
    $("#lado").innerHTML = html;
    $("#gavetaBt").innerHTML = ico("menu");
  }
  function abrirAba(id) {
    var a = A.abas.filter(function (x) { return x.id === id; })[0] || A.abas[0];
    if (!a) return;
    atual = a.id;
    $("#tituloAba").textContent = a.titulo;
    $$(".item[data-aba]").forEach(function (b) { b.classList.toggle("ativo", b.dataset.aba === a.id); });
    document.getElementById("app").classList.remove("gaveta");
    var caixa = $("#aba");
    caixa.innerHTML = '<p class="nota">Carregando...</p>';
    Promise.resolve().then(function () { return a.desenhar(caixa); }).catch(function (e) {
      caixa.innerHTML = '<div class="aviso erro">' + ico("alerta") + "<div>Não consegui abrir esta aba: " + esc(e && e.message || e) + ". As outras abas continuam funcionando.</div></div>";
      if (window.console) console.error(e);
    });
  }
  A.recarregar = function () { if (atual) abrirAba(atual); };

  A.iniciar = function (sessao) {
    desenharMenu(sessao);
    var app = document.getElementById("app");
    app.classList.add("pronto");
    $("#lado").addEventListener("click", function (e) {
      var b = e.target.closest("button"); if (!b) return;
      if (b.dataset.aba) { location.hash = "#/" + b.dataset.aba; }
      else if (b.hasAttribute("data-sair")) { window.sb.auth.signOut().then(function () { location.replace("../login/"); }); }
      else if (b.hasAttribute("data-tranca")) { app.classList.remove("gaveta"); A.testarTranca(); }
    });
    $("#gavetaBt").addEventListener("click", function () { app.classList.toggle("gaveta"); });
    $("#veuMenu").addEventListener("click", function () { app.classList.remove("gaveta"); });
    function rota() { abrirAba((location.hash.match(/#\/(\w+)/) || [])[1]); }
    window.addEventListener("hashchange", rota);
    if (window.FALHAS && window.FALHAS.length) {
      A.avisos.arquivos = "Não consegui carregar estes arquivos do painel: " + window.FALHAS.join(", ") + ". Confira se a pasta js foi publicada.";
      desenharAvisos();
    }
    rota();
  };
})();
