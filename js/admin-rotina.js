/* ==========================================================
   ABAS "MINHA ROTINA": Calendário e Campanhas
   ========================================================== */
(function () {
  "use strict";
  var A = window.Admin, $ = A.$, $$ = A.$$, esc = A.esc, ico = A.ico;

  /* ==================== CALENDÁRIO ==================== */
  var TIPOS_CAL = [["gravar", "Gravar"], ["editar", "Editar"], ["postar", "Postar"]];
  var mesAtual = new Date(); mesAtual.setDate(1);
  var filtroCal = "todos";

  function formItemCal(item, dataInicial, depois) {
    var novo = !item;
    A.formulario({
      titulo: novo ? "Novo item no calendário" : "Editar item",
      valores: item || { tipo: "gravar", data: dataInicial || A.hoje(), status: "a fazer" },
      campos: [
        { n: "titulo", r: "O que é", req: true },
        { n: "marca", r: "Marca", meia: true },
        { n: "tipo", r: "Tipo", t: "select", meia: true, opcoes: TIPOS_CAL },
        { n: "data", r: "Data", t: "date", req: true, meia: true },
        { n: "status", r: "Situação", t: "select", meia: true, opcoes: [["a fazer", "A fazer"], ["feito", "Feito"]] }
      ],
      apagar: novo ? null : function () { return A.gravar("calendario", function (t) { return t.delete().eq("id", item.id); }).then(function (r) { if (!r.erro) { A.toast("Item apagado."); depois(); } return !r.erro; }); },
      salvar: function (d) {
        return A.gravar("calendario", function (t) { return novo ? t.insert(d) : t.update(d).eq("id", item.id); }).then(function (r) {
          if (!r.erro) { A.toast("Item salvo."); depois(); }
          return !r.erro;
        });
      }
    });
  }

  A.aba("calendario", "Calendário", "calendario", "minha rotina", function (el) {
    return Promise.all([
      A.ler("calendario", function (q) { return q.order("data", { ascending: true }); }),
      A.ler("campanhas", function (q) { return q.order("prazo", { ascending: true }); })
    ]).then(function (r) {
      var itens = r[0], campanhas = r[1].filter(function (c) { return c.prazo; });
      var hoje = A.hoje();

      /* junta os itens do calendário com os prazos das campanhas */
      function doDia(iso, incluirPrazos) {
        var lista = itens.filter(function (i) { return String(i.data).slice(0, 10) === iso && (filtroCal === "todos" || i.tipo === filtroCal); })
          .map(function (i) { return { tipo: i.tipo, titulo: i.titulo, feito: i.status === "feito", ex: i.exemplo, ref: i, origem: "cal" }; });
        if (incluirPrazos && filtroCal === "todos") {
          campanhas.filter(function (c) { return String(c.prazo).slice(0, 10) === iso; })
            .forEach(function (c) { lista.push({ tipo: "prazo", titulo: "Prazo: " + c.campanha, feito: c.status === "Entregue", ex: c.exemplo, ref: c, origem: "camp" }); });
        }
        return lista;
      }
      function abrirItem(x) {
        if (x.origem === "cal") formItemCal(x.ref, null, A.recarregar);
        else A.formCampanha(x.ref, A.recarregar);
      }
      function chipItem(x, i, iso) {
        return '<button class="it ' + x.tipo + (x.feito ? " feito" : "") + '" data-i="' + i + '" data-d="' + iso + '" title="' + esc(x.titulo) + '"><span>' + esc(x.titulo) + (x.ex ? " (exemplo)" : "") + "</span></button>";
      }

      var primeiro = new Date(mesAtual.getFullYear(), mesAtual.getMonth(), 1);
      var ultimo = new Date(mesAtual.getFullYear(), mesAtual.getMonth() + 1, 0);
      var comeco = new Date(primeiro); comeco.setDate(1 - ((primeiro.getDay() + 6) % 7)); /* segunda-feira */
      var totalDias = Math.ceil((((primeiro.getDay() + 6) % 7) + ultimo.getDate()) / 7) * 7;
      var celulas = "";
      for (var n = 0; n < totalDias; n++) {
        var d = new Date(comeco); d.setDate(comeco.getDate() + n);
        var iso = A.iso(d), fora = d.getMonth() !== mesAtual.getMonth();
        var lista = doDia(iso, true);
        celulas += '<div class="dia' + (fora ? " fora" : "") + (iso === hoje ? " hoje" : "") + '" data-dia="' + iso + '">' +
          '<span class="dn">' + d.getDate() + "</span>" +
          '<button class="mais-bt" data-novo="' + iso + '" title="Adicionar neste dia" aria-label="Adicionar neste dia">' + ico("mais") + "</button>" +
          lista.slice(0, 3).map(function (x, i) { return chipItem(x, i, iso); }).join("") +
          (lista.length > 3 ? '<button class="mais-n" data-dia-lista="' + iso + '">+' + (lista.length - 3) + " mais</button>" : "") + "</div>";
      }

      /* ficou pra trás */
      var atrasados = [];
      itens.forEach(function (i) { if (i.status !== "feito" && String(i.data).slice(0, 10) < hoje) atrasados.push({ data: String(i.data).slice(0, 10), titulo: i.titulo, marca: i.marca, tipo: i.tipo, ex: i.exemplo, ref: i, origem: "cal" }); });
      campanhas.forEach(function (c) { if (c.status !== "Entregue" && String(c.prazo).slice(0, 10) < hoje) atrasados.push({ data: String(c.prazo).slice(0, 10), titulo: "Prazo: " + c.campanha, marca: c.cliente, tipo: "prazo", ex: c.exemplo, ref: c, origem: "camp" }); });
      atrasados.sort(function (a, b) { return a.data < b.data ? -1 : 1; });

      var nomeMes = mesAtual.toLocaleDateString("pt-BR", { month: "long" }); nomeMes = nomeMes.charAt(0).toUpperCase() + nomeMes.slice(1) + " de " + mesAtual.getFullYear();
      el.innerHTML =
        '<div class="cal-cab">' +
          '<button class="bt bt-s" id="calAnt" aria-label="Mês anterior">' + ico("esq") + "</button>" +
          "<h2>" + esc(nomeMes) + "</h2>" +
          '<button class="bt bt-s" id="calProx" aria-label="Próximo mês">' + ico("dir") + "</button>" +
          '<button class="bt bt-s" id="calHoje">Este mês</button>' +
          '<div class="chips" id="calChips">' + [["todos", "Todos"]].concat(TIPOS_CAL).map(function (o) { return '<button class="chip' + (filtroCal === o[0] ? " on" : "") + '" data-f="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>" +
          '<span class="espaco" style="flex:1"></span><button class="bt bt-p" id="calNovo">' + ico("mais") + "Adicionar</button></div>" +
        '<div class="cal">' + ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map(function (s) { return '<div class="sem">' + s + "</div>"; }).join("") + celulas + "</div>" +
        '<div class="cartao" style="margin-top:16px"><h2>Ficou pra trás</h2>' +
          (atrasados.length ? atrasados.map(function (a, i) {
            var dias = A.diasEntre(a.data, hoje);
            return '<div class="atraso"><div><b>' + esc(a.titulo) + "</b>" + (a.ex ? '<span class="tag ex">exemplo</span>' : "") + '<div class="nota">' + esc(a.marca || "") + " " + A.fmtData(a.data) + '</div></div><div><span class="tag verm">há ' + dias + (dias === 1 ? " dia" : " dias") + '</span> <button class="ic-bt" data-atr="' + i + '" title="Abrir">' + ico("lapis") + "</button></div></div>";
          }).join("") : '<p class="vazio">Nada atrasado. Tudo em dia.</p>') + "</div>";

      /* eventos */
      $("#calAnt", el).onclick = function () { mesAtual.setMonth(mesAtual.getMonth() - 1); A.recarregar(); };
      $("#calProx", el).onclick = function () { mesAtual.setMonth(mesAtual.getMonth() + 1); A.recarregar(); };
      $("#calHoje", el).onclick = function () { mesAtual = new Date(); mesAtual.setDate(1); A.recarregar(); };
      $("#calNovo", el).onclick = function () { formItemCal(null, hoje, A.recarregar); };
      $("#calChips", el).onclick = function (e) { var b = e.target.closest("[data-f]"); if (!b) return; filtroCal = b.dataset.f; A.recarregar(); };
      $$("[data-atr]", el).forEach(function (b) { b.onclick = function () { var a = atrasados[+b.dataset.atr]; if (a.origem === "cal") formItemCal(a.ref, null, A.recarregar); else A.formCampanha(a.ref, A.recarregar); }; });

      function janelaDia(iso) {
        var lista = doDia(iso, true);
        var j = A.abrirJanela('<div class="jan-topo"><h3>' + esc(A.fmtData(iso)) + '</h3><button class="ic-bt" data-x aria-label="Fechar">' + ico("x") + "</button></div>" +
          lista.map(function (x, i) { return '<div class="atraso"><div>' + chipItem(x, i, iso).replace('class="it', 'style="max-width:340px" class="it') + '</div></div>'; }).join("") +
          '<div class="jan-pe"><span></span><button class="bt bt-p" data-add>' + ico("mais") + "Adicionar neste dia</button></div>", 420);
        $$(".it", j).forEach(function (b) { b.onclick = function () { j.fechar(); abrirItem(lista[+b.dataset.i]); }; });
        j.querySelector("[data-add]").onclick = function () { j.fechar(); formItemCal(null, iso, A.recarregar); };
      }
      $(".cal", el).onclick = function (e) {
        var chip = e.target.closest(".it");
        if (chip) { abrirItem(doDia(chip.dataset.d, true)[+chip.dataset.i]); return; }
        var mais = e.target.closest("[data-dia-lista]");
        if (mais) { janelaDia(mais.dataset.diaLista); return; }
        var add = e.target.closest("[data-novo]");
        if (add) { formItemCal(null, add.dataset.novo, A.recarregar); return; }
        var dia = e.target.closest(".dia");
        if (dia) formItemCal(null, dia.dataset.dia, A.recarregar);
      };
    });
  });

  /* ==================== CAMPANHAS ==================== */
  var STATUS = ["Briefing", "Roteiro", "Aprovação Roteiro", "Gravação", "Edição", "Aprovado", "Entregue"];
  var TIPOS_CAMP = ["Conteúdo", "Publicidade"];
  var ordem = { col: "prazo", dir: 1 };
  var filtroCamp = "todas";

  A.formCampanha = function (c, depois) {
    var novo = !c;
    A.formulario({
      titulo: novo ? "Nova campanha" : "Editar campanha",
      valores: c || { tipo: "Conteúdo", status: "Briefing", qtd: 1, pagamento: "pendente", ativa: true },
      campos: [
        { n: "campanha", r: "Campanha", req: true },
        { n: "cliente", r: "Cliente", meia: true },
        { n: "tipo", r: "Tipo", t: "select", meia: true, opcoes: TIPOS_CAMP.map(function (x) { return [x, x]; }) },
        { n: "status", r: "Status", t: "select", meia: true, opcoes: STATUS.map(function (x) { return [x, x]; }) },
        { n: "qtd", r: "Quantidade de vídeos", t: "number", meia: true },
        { n: "valor", r: "Valor (R$)", t: "number", meia: true },
        { n: "prazo", r: "Prazo", t: "date", meia: true },
        { n: "pagamento", r: "Pagamento", t: "select", meia: true, opcoes: [["pendente", "Pendente"], ["pago", "Pago"]] },
        { n: "ativa", r: "Campanha ativa", t: "checkbox" },
        { n: "favorita", r: "Destacar com estrela", t: "checkbox" }
      ],
      apagar: novo ? null : function () { return A.gravar("campanhas", function (t) { return t.delete().eq("id", c.id); }).then(function (r) { if (!r.erro) { A.toast("Campanha apagada."); depois(); } return !r.erro; }); },
      salvar: function (d) {
        d.qtd = d.qtd == null ? 0 : Math.round(d.qtd); d.valor = d.valor == null ? 0 : d.valor;
        return A.gravar("campanhas", function (t) { return novo ? t.insert(d) : t.update(d).eq("id", c.id); }).then(function (r) {
          if (!r.erro) { A.toast("Campanha salva."); depois(); }
          return !r.erro;
        });
      }
    });
  };

  A.aba("campanhas", "Campanhas", "campanhas", "minha rotina", function (el) {
    return A.ler("campanhas", function (q) { return q.order("criado_em", { ascending: false }); }).then(function (todas) {
      var hoje = A.hoje(), busca = "";
      /* números: a linha de exemplo não entra na conta */
      var reais = todas.filter(function (c) { return !c.exemplo; });
      var soma = function (l, f) { return l.reduce(function (s, x) { return s + (Number(f(x)) || 0); }, 0); };
      var valorTotal = soma(reais, function (c) { return c.valor; });
      var videosTotal = soma(reais, function (c) { return c.qtd; });
      var ticket = videosTotal > 0 ? valorTotal / videosTotal : null;
      var aReceber = soma(reais.filter(function (c) { return c.pagamento !== "pago"; }), function (c) { return c.valor; });
      var recebido = soma(reais.filter(function (c) { return c.pagamento === "pago"; }), function (c) { return c.valor; });

      el.innerHTML =
        '<div class="faixa-m k4">' +
          '<div><b>' + A.numero(reais.length) + '</b><span>Campanhas</span></div>' +
          '<div><b>' + A.numero(reais.filter(function (c) { return c.ativa; }).length) + '</b><span>Ativas</span></div>' +
          '<div><b>' + A.brl(valorTotal) + '</b><span>Valor total</span><small>' + (ticket === null ? "Ticket médio por vídeo: sem vídeos ainda" : "Ticket médio por vídeo: " + A.brl(ticket)) + "</small></div>" +
          '<div><b>' + A.brl(aReceber) + '</b><span>A receber</span><small>Já recebido: ' + A.brl(recebido) + "</small></div>" +
        "</div>" +
        '<div class="barra"><div class="chips" id="cFiltro">' + [["todas", "Todas"], ["ativas", "Ativas"], ["finalizadas", "Finalizadas"]].map(function (o) { return '<button class="chip' + (filtroCamp === o[0] ? " on" : "") + '" data-f="' + o[0] + '">' + o[1] + "</button>"; }).join("") + "</div>" +
          '<label class="campo-busca">' + ico("busca") + '<input id="cBusca" type="search" placeholder="Buscar campanha ou cliente" aria-label="Buscar"></label><span class="espaco"></span>' +
          '<button class="bt bt-s" id="cCsv">' + ico("baixar") + "Baixar</button>" +
          '<button class="bt bt-p" id="cNova">' + ico("mais") + "Adicionar campanha</button></div>" +
        '<div class="cartao" style="padding:6px 6px"><div class="rolagem"><table class="tab"><thead id="cCab"></thead><tbody id="cCorpo"></tbody></table></div></div>';

      var COLS = [
        { k: "favorita", t: "" }, { k: "campanha", t: "Campanha" }, { k: "cliente", t: "Cliente" }, { k: "tipo", t: "Tipo" },
        { k: "status", t: "Status" }, { k: "qtd", t: "Qtd", num: true }, { k: "valor", t: "Valor", num: true }, { k: "prazo", t: "Prazo" }, { k: "pagamento", t: "Pagamento" }
      ];
      function chave(c, k) {
        if (k === "status") return STATUS.indexOf(c.status);
        if (k === "favorita") return c.favorita ? 1 : 0;
        if (k === "qtd" || k === "valor") return Number(c[k]) || 0;
        if (k === "pagamento") return c.pagamento === "pago" ? 1 : 0;
        return String(c[k] == null ? "" : c[k]).toLowerCase();
      }
      function lista() {
        var q = busca.toLowerCase();
        var l = todas.filter(function (c) {
          if (filtroCamp === "ativas" && !c.ativa) return false;
          if (filtroCamp === "finalizadas" && c.ativa) return false;
          return !q || (c.campanha + " " + (c.cliente || "")).toLowerCase().indexOf(q) > -1;
        });
        l.sort(function (a, b) {
          var k = ordem.col;
          if (k === "prazo") { /* sem prazo vai sempre para o fim */
            if (!a.prazo && !b.prazo) return 0; if (!a.prazo) return 1; if (!b.prazo) return -1;
            return (a.prazo < b.prazo ? -1 : a.prazo > b.prazo ? 1 : 0) * ordem.dir;
          }
          var x = chave(a, k), y = chave(b, k);
          var r = typeof x === "string" ? x.localeCompare(y, "pt-BR") : x - y;
          return r * ordem.dir;
        });
        return l;
      }
      function cabecalho() {
        $("#cCab", el).innerHTML = "<tr>" + COLS.map(function (c) {
          var on = ordem.col === c.k;
          var seta = on ? (ordem.dir === 1 ? "▲" : "▼") : "↕";
          return '<th class="ord' + (on ? " on" : "") + (c.num ? " num" : "") + '" data-k="' + c.k + '" aria-sort="' + (on ? (ordem.dir === 1 ? "ascending" : "descending") : "none") + '">' + (c.k === "favorita" ? ico("estrela") : c.t) + '<span class="seta">' + seta + "</span></th>";
        }).join("") + "</tr>";
      }
      function aviso(c) {
        if (!c.prazo || c.status === "Entregue") return "";
        var d = A.diasEntre(hoje, String(c.prazo).slice(0, 10));
        if (d < 0) return '<span class="tag verm">atrasado ' + (-d) + (d === -1 ? " dia" : " dias") + "</span>";
        if (d <= 3) return '<span class="tag amar">' + (d === 0 ? "vence hoje" : "vence em " + d + (d === 1 ? " dia" : " dias")) + "</span>";
        return "";
      }
      function corpo() {
        var l = lista();
        $("#cCorpo", el).innerHTML = l.length ? l.map(function (c) {
          var si = Math.max(0, STATUS.indexOf(c.status));
          return '<tr class="clicavel' + (c.favorita ? " fav" : "") + '" data-id="' + c.id + '">' +
            '<td><button class="estrela' + (c.favorita ? " on" : "") + '" data-fav title="Destacar" aria-label="Destacar campanha">' + ico("estrela") + "</button></td>" +
            "<td><b>" + esc(c.campanha) + "</b>" + (c.exemplo ? '<span class="tag ex">exemplo</span>' : "") + "</td>" +
            "<td>" + esc(c.cliente || "") + "</td>" +
            '<td><span class="pill p-' + (c.tipo === "Publicidade" ? "publicidade" : "conteudo") + '">' + esc(c.tipo) + "</span></td>" +
            '<td><span class="pill p-s' + si + '">' + esc(c.status) + "</span></td>" +
            '<td class="num">' + A.numero(c.qtd) + '</td><td class="num">' + A.brl(c.valor) + "</td>" +
            "<td>" + A.fmtData(c.prazo) + aviso(c) + "</td>" +
            '<td><button class="pill p-' + (c.pagamento === "pago" ? "pago" : "pendente") + '" data-pag style="border:0" title="Clique para alternar">' + (c.pagamento === "pago" ? "Pago" : "Pendente") + "</button></td></tr>";
        }).join("") : '<tr><td colspan="9" class="vazio">Nenhuma campanha encontrada.</td></tr>';
      }
      cabecalho(); corpo();

      $("#cCab", el).onclick = function (e) {
        var th = e.target.closest("th[data-k]"); if (!th) return;
        if (ordem.col === th.dataset.k) ordem.dir *= -1; else { ordem.col = th.dataset.k; ordem.dir = 1; }
        cabecalho(); corpo();
      };
      $("#cFiltro", el).onclick = function (e) { var b = e.target.closest("[data-f]"); if (!b) return; filtroCamp = b.dataset.f; A.recarregar(); };
      $("#cBusca", el).oninput = function (e) { busca = e.target.value; corpo(); };
      $("#cNova", el).onclick = function () { A.formCampanha(null, A.recarregar); };
      $("#cCorpo", el).onclick = function (e) {
        var tr = e.target.closest("tr[data-id]"); if (!tr) return;
        var c = todas.filter(function (x) { return String(x.id) === tr.dataset.id; })[0]; if (!c) return;
        if (e.target.closest("[data-fav]")) {
          A.gravar("campanhas", function (t) { return t.update({ favorita: !c.favorita }).eq("id", c.id); }).then(function (r) { if (!r.erro) { c.favorita = !c.favorita; corpo(); } });
        } else if (e.target.closest("[data-pag]")) {
          var novoPag = c.pagamento === "pago" ? "pendente" : "pago";
          A.gravar("campanhas", function (t) { return t.update({ pagamento: novoPag }).eq("id", c.id); }).then(function (r) { if (!r.erro) { A.recarregar(); } });
        } else A.formCampanha(c, A.recarregar);
      };
      $("#cCsv", el).onclick = function () {
        A.baixarCSV("campanhas", [
          { t: "Campanha", v: function (c) { return c.campanha; } }, { t: "Cliente", v: function (c) { return c.cliente; } },
          { t: "Tipo", v: function (c) { return c.tipo; } }, { t: "Status", v: function (c) { return c.status; } },
          { t: "Qtd", v: function (c) { return c.qtd; } }, { t: "Valor", v: function (c) { return String(Number(c.valor || 0).toFixed(2)).replace(".", ","); } },
          { t: "Prazo", v: function (c) { return A.fmtData(c.prazo); } }, { t: "Pagamento", v: function (c) { return c.pagamento === "pago" ? "Pago" : "Pendente"; } }
        ], lista());
      };
    });
  });
})();
