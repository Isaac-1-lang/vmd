/* ==========================================================================
   Vehicle Sales Analytics — charts and theme switching.
   Chart colors are read from CSS custom properties on each canvas, so every
   chart matches the card (light or dark) it is drawn in.
   ========================================================================== */
(function () {
  "use strict";

  const dataEl = document.getElementById("chart-data");
  if (!dataEl || typeof Chart === "undefined") return;

  const D = JSON.parse(dataEl.textContent);
  const SELECTED_YEAR = JSON.parse(document.getElementById("selected-year").textContent);
  if (!D || !D.by_month) return;

  /* ------------------------------------------------------------------ */
  /* Formatting                                                          */
  /* ------------------------------------------------------------------ */
  const fmtNum = (v) => Math.round(v).toLocaleString("en-US");
  const fmtMoney = (v) => "$" + fmtNum(v);
  const fmtCompact = (v) => {
    const a = Math.abs(v);
    if (a >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
    if (a >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
    if (a >= 1e3) return "$" + (v / 1e3).toFixed(1) + "k";
    return "$" + Math.round(v);
  };
  const fmtAxisMoney = (v) => {
    const a = Math.abs(v);
    if (a >= 1e6) return "$" + (v / 1e6).toFixed(a >= 1e7 ? 0 : 1) + "M";
    if (a >= 1e3) return "$" + (v / 1e3).toFixed(0) + "k";
    return "$" + v;
  };
  const pretty = (s) => String(s).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  const METRIC_FORMAT = {
    count: { label: "Units", tick: fmtNum, value: fmtNum, total: fmtNum },
    revenue: { label: "Revenue", tick: fmtAxisMoney, value: fmtCompact, total: fmtCompact },
    profit: { label: "Profit", tick: fmtAxisMoney, value: fmtCompact, total: fmtCompact },
    avg_price: { label: "Avg price", tick: fmtAxisMoney, value: fmtMoney, total: fmtMoney },
  };

  /* ------------------------------------------------------------------ */
  /* Theme tokens                                                        */
  /* ------------------------------------------------------------------ */
  function tokens(el) {
    const cs = getComputedStyle(el);
    const v = (name) => cs.getPropertyValue(name).trim();
    return {
      dark: v("--scheme") === "dark",
      card: v("--card-bg"),
      text: v("--text"),
      text2: v("--text-2"),
      muted: v("--muted"),
      grid: v("--grid"),
      track: v("--track"),
      barBase: v("--bar-base"),
      accent: v("--accent"),
      tooltipBg: v("--tooltip-bg"),
      tooltipText: v("--tooltip-text"),
      series: [v("--s1"), v("--s2"), v("--s3"), v("--s4"), v("--s5"), v("--s6")],
    };
  }

  function alpha(hex, a) {
    const h = hex.replace("#", "");
    const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
    return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
  }

  function topIndexes(values, n) {
    return values
      .map((v, i) => [v, i])
      .sort((a, b) => b[0] - a[0])
      .slice(0, n)
      .map((p) => p[1]);
  }

  /* ------------------------------------------------------------------ */
  /* Plugin: selective value labels above highlighted bars               */
  /* ------------------------------------------------------------------ */
  const peakLabels = {
    id: "peakLabels",
    afterDatasetsDraw(chart, _args, opts) {
      if (!opts || !opts.indexes || !opts.indexes.length) return;
      const meta = chart.getDatasetMeta(opts.dataset || 0);
      if (meta.hidden) return;
      const values = chart.data.datasets[opts.dataset || 0].data;
      const { ctx } = chart;
      ctx.save();
      ctx.font = "700 11px 'Plus Jakarta Sans', sans-serif";
      ctx.fillStyle = opts.color;
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      opts.indexes.forEach((i) => {
        const el = meta.data[i];
        if (el) ctx.fillText(opts.format(values[i]), el.x, el.y - 5);
      });
      ctx.restore();
    },
  };
  Chart.register(peakLabels);

  /* ------------------------------------------------------------------ */
  /* Shared option builders                                              */
  /* ------------------------------------------------------------------ */
  Chart.defaults.font.family = "'Plus Jakarta Sans', system-ui, sans-serif";
  Chart.defaults.font.size = 11.5;
  Chart.defaults.animation.duration = 650;

  function tooltip(t, format) {
    return {
      backgroundColor: t.tooltipBg,
      titleColor: t.tooltipText,
      bodyColor: t.tooltipText,
      borderWidth: 0,
      padding: 10,
      cornerRadius: 10,
      boxPadding: 4,
      usePointStyle: true,
      titleFont: { weight: "700" },
      callbacks: format
        ? {
            label: (ctx) => {
              const p = ctx.parsed;
              const value = typeof p === "number" ? p : ctx.chart.options.indexAxis === "y" ? p.x : p.y ?? p.r;
              const name = typeof p === "number" ? ctx.label : ctx.dataset.label;
              return " " + (name ? name + ": " : "") + format(value, ctx);
            },
          }
        : {},
    };
  }

  function legend(t, show) {
    return {
      display: !!show,
      position: "top",
      align: "end",
      labels: {
        color: t.text2,
        usePointStyle: true,
        pointStyle: "rectRounded",
        boxWidth: 8,
        boxHeight: 8,
        padding: 14,
        font: { weight: "600" },
      },
    };
  }

  // Chart.js treats an explicit `callback: undefined` as "no formatter", so
  // only attach one when it is given.
  const withCallback = (ticks, fn) => (fn ? { ...ticks, callback: fn } : ticks);
  const axisTitle = (t, text) => (text ? { display: true, text, color: t.muted, font: { weight: "600" } } : { display: false });

  function axes(t, opts = {}) {
    const base = {
      x: {
        stacked: !!opts.stacked,
        grid: { display: !!opts.xGrid, color: t.grid, drawTicks: false },
        border: { display: false },
        ticks: withCallback({ color: t.muted, padding: 6, maxRotation: 0, autoSkipPadding: 10 }, opts.xTick),
        title: axisTitle(t, opts.xTitle),
      },
      y: {
        stacked: !!opts.stacked,
        beginAtZero: opts.beginAtZero !== false,
        grid: { color: t.grid, drawTicks: false },
        border: { display: false },
        ticks: withCallback({ color: t.muted, padding: 8, maxTicksLimit: 6 }, opts.yTick),
        title: axisTitle(t, opts.yTitle),
      },
    };
    if (opts.horizontal) {
      // swap the roles so the value axis is x
      return {
        x: base.y,
        y: { ...base.x, grid: { display: false }, ticks: { color: t.text2, padding: 6, font: { weight: "600" } } },
      };
    }
    return base;
  }

  function barDataset(t, data, color, extra = {}) {
    return {
      data,
      backgroundColor: color,
      hoverBackgroundColor: color,
      borderRadius: 4,
      borderSkipped: "start",
      maxBarThickness: 26,
      categoryPercentage: 0.72,
      barPercentage: 0.9,
      ...extra,
    };
  }

  function baseOptions(t, extra = {}) {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      layout: { padding: { top: 18 } },
      ...extra,
    };
  }

  function donut(el, t, labels, values, format) {
    return new Chart(el, {
      type: "doughnut",
      data: {
        labels: labels.map(pretty),
        datasets: [
          {
            data: values,
            backgroundColor: labels.map((_, i) => t.series[i % t.series.length]),
            borderColor: t.card,
            borderWidth: 2,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: "70%",
        layout: { padding: 6 },
        plugins: { legend: { display: false }, tooltip: tooltip(t, format) },
      },
    });
  }

  /* Bars in muted base color with the top-N highlighted in the accent. */
  function highlightColors(t, values, n) {
    const top = new Set(topIndexes(values, n));
    return values.map((_, i) => (top.has(i) ? t.series[0] : t.barBase));
  }

  /* ------------------------------------------------------------------ */
  /* Chart builders                                                      */
  /* ------------------------------------------------------------------ */
  const state = { month: "count", modelYear: "count", continent: "count" };

  const builders = {
    spark(el, t) {
      const tl = D.timeline;
      return new Chart(el, {
        type: "line",
        data: {
          labels: tl.labels,
          datasets: [
            {
              label: "Revenue",
              data: tl.revenue,
              borderColor: t.accent,
              borderWidth: 2,
              tension: 0.4,
              fill: true,
              backgroundColor: (ctx) => {
                const { chartArea, ctx: c } = ctx.chart;
                if (!chartArea) return alpha(t.accent, 0.2);
                const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                g.addColorStop(0, alpha(t.accent, 0.35));
                g.addColorStop(1, alpha(t.accent, 0));
                return g;
              },
              pointRadius: 0,
              pointHoverRadius: 5,
              pointHoverBackgroundColor: t.accent,
              pointHoverBorderColor: "#fff",
              pointHoverBorderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          scales: { x: { display: false }, y: { display: false, beginAtZero: false } },
          plugins: { legend: { display: false }, tooltip: tooltip(t, fmtCompact) },
        },
      });
    },

    month(el, t) {
      const metric = state.month;
      const values = D.by_month[metric];
      const fmt = METRIC_FORMAT[metric];
      const total = document.getElementById("month-total");
      if (total) total.textContent = fmt.total(values.reduce((a, b) => a + b, 0));
      return new Chart(el, {
        type: "bar",
        data: {
          labels: D.by_month.labels,
          datasets: [barDataset(t, values, highlightColors(t, values, 3), { label: fmt.label })],
        },
        options: baseOptions(t, {
          scales: axes(t, { yTick: fmt.tick }),
          plugins: {
            legend: legend(t, false),
            tooltip: tooltip(t, fmt.value),
            peakLabels: { indexes: topIndexes(values, 3), color: t.text, format: fmt.value },
          },
        }),
      });
    },

    radar(el, t) {
      const b = D.by_body;
      return new Chart(el, {
        type: "radar",
        data: {
          labels: b.labels,
          datasets: [
            {
              label: "Units",
              data: b.count,
              borderColor: t.series[0],
              backgroundColor: alpha(t.series[0], 0.22),
              borderWidth: 2,
              pointRadius: 3,
              pointBackgroundColor: t.series[0],
              pointBorderColor: t.card,
              pointBorderWidth: 2,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: tooltip(t, fmtNum) },
          scales: {
            r: {
              beginAtZero: true,
              angleLines: { color: t.grid },
              grid: { color: t.grid },
              pointLabels: { color: t.text2, font: { size: 11, weight: "600" } },
              ticks: { display: false, maxTicksLimit: 5 },
            },
          },
        },
      });
    },

    fuel(el, t) {
      return donut(el, t, D.by_fuel.labels, D.by_fuel.count, (v) => fmtNum(v) + " units");
    },

    body(el, t) {
      return donut(el, t, D.by_body.labels, D.by_body.revenue, fmtCompact);
    },

    compare(el, t) {
      const tl = D.timeline;
      const line = (label, data, color, fill) => ({
        label,
        data,
        borderColor: color,
        backgroundColor: fill ? alpha(color, 0.12) : color,
        fill: fill ? "origin" : false,
        borderWidth: 2,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: t.card,
        pointHoverBorderWidth: 2,
      });
      const chart = new Chart(el, {
        type: "line",
        data: {
          labels: tl.labels,
          datasets: [
            line("Revenue", tl.revenue, t.series[0], true),
            line("Cost", tl.cost, t.series[1], false),
            line("Profit", tl.profit, t.series[2], false),
          ],
        },
        options: baseOptions(t, {
          scales: axes(t, { yTick: fmtAxisMoney, xTick: function (v, i) { return tl.labels.length > 14 && i % 3 ? null : this.getLabelForValue(v); } }),
          // the colored toggles above the chart act as its legend
          plugins: { legend: legend(t, false), tooltip: tooltip(t, fmtCompact) },
        }),
      });
      document.querySelectorAll('.toggles[data-target="compare"] input').forEach((input) => {
        chart.setDatasetVisibility(+input.dataset.index, input.checked);
      });
      chart.update("none");
      return chart;
    },

    annual(el, t) {
      const y = D.by_year;
      const isSel = (label) => !SELECTED_YEAR || +label === SELECTED_YEAR;
      const colors = (c) => y.labels.map((l) => (isSel(l) ? c : alpha(c, 0.35)));
      return new Chart(el, {
        type: "bar",
        data: {
          labels: y.labels,
          datasets: [
            barDataset(t, y.revenue, colors(t.series[0]), { label: "Revenue", maxBarThickness: 16 }),
            barDataset(t, y.cost, colors(t.series[1]), { label: "Cost", maxBarThickness: 16 }),
          ],
        },
        options: baseOptions(t, {
          scales: axes(t, { yTick: fmtAxisMoney }),
          plugins: {
            legend: legend(t, true),
            tooltip: tooltip(t, fmtCompact),
            peakLabels: SELECTED_YEAR
              ? { indexes: [y.labels.indexOf(String(SELECTED_YEAR))], color: t.text, format: fmtCompact }
              : {},
          },
        }),
      });
    },

    modelYear(el, t) {
      const metric = state.modelYear;
      const fmt = METRIC_FORMAT[metric];
      const values = D.by_model_year[metric];
      return new Chart(el, {
        type: "bar",
        data: {
          labels: D.by_model_year.labels,
          datasets: [barDataset(t, values, highlightColors(t, values, 3), { label: fmt.label })],
        },
        options: baseOptions(t, {
          scales: axes(t, { yTick: fmt.tick, beginAtZero: metric === "count" }),
          plugins: {
            legend: legend(t, false),
            tooltip: tooltip(t, fmt.value),
            peakLabels: { indexes: topIndexes(values, 3), color: t.text, format: fmt.value },
          },
        }),
      });
    },

    condition(el, t) {
      return donut(el, t, D.by_condition.labels, D.by_condition.count, (v) => fmtNum(v) + " units");
    },

    engineTrans(el, t) {
      const et = D.engine_transmission;
      return new Chart(el, {
        type: "bar",
        data: {
          labels: et.labels.map(pretty),
          datasets: et.series.map((s, i) =>
            barDataset(t, s.data, t.series[i], {
              label: pretty(s.label),
              borderColor: t.card,
              borderWidth: { top: i === et.series.length - 1 ? 0 : 2 },
              borderSkipped: false,
              borderRadius: i === et.series.length - 1 ? { topLeft: 4, topRight: 4 } : 0,
            })
          ),
        },
        options: baseOptions(t, {
          scales: axes(t, { stacked: true, yTick: fmtNum }),
          plugins: { legend: legend(t, true), tooltip: tooltip(t, fmtNum) },
        }),
      });
    },

    seats(el, t) {
      const s = D.by_seats;
      return new Chart(el, {
        type: "bar",
        data: {
          labels: s.labels.map((l) => l + " seats"),
          datasets: [barDataset(t, s.count, t.series[1], { label: "Units" })],
        },
        options: baseOptions(t, {
          scales: axes(t, { yTick: fmtNum }),
          plugins: { legend: legend(t, false), tooltip: tooltip(t, fmtNum) },
        }),
      });
    },

    km(el, t) {
      const k = D.by_km;
      return new Chart(el, {
        type: "bar",
        data: { labels: k.labels, datasets: [barDataset(t, k.count, t.series[0], { label: "Units" })] },
        options: baseOptions(t, {
          scales: axes(t, { yTick: fmtNum }),
          plugins: { legend: legend(t, false), tooltip: tooltip(t, fmtNum) },
        }),
      });
    },

    scatter(el, t) {
      const pts = D.scatter;
      const c = D.correlation;
      const corr = c.matrix[c.labels.indexOf("kilometers_driven")][c.labels.indexOf("selling_price")];
      const corrEl = document.getElementById("km-corr");
      if (corrEl) corrEl.textContent = corr.toFixed(2);
      return new Chart(el, {
        type: "scatter",
        data: {
          datasets: [
            {
              label: "Sale",
              data: pts,
              backgroundColor: alpha(t.series[0], 0.45),
              borderColor: t.card,
              borderWidth: 1,
              pointRadius: 4,
              pointHoverRadius: 7,
              pointHoverBackgroundColor: t.series[0],
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "nearest", intersect: true },
          scales: axes(t, {
            xGrid: true,
            beginAtZero: false,
            xTitle: "Kilometers driven (thousands)",
            xTick: (v) => v + "k",
            yTick: fmtAxisMoney,
          }),
          plugins: {
            legend: legend(t, false),
            tooltip: {
              ...tooltip(t),
              callbacks: {
                title: (items) => items[0].raw.make,
                label: (ctx) => ` ${ctx.raw.x}k km · ${fmtMoney(ctx.raw.y)}`,
              },
            },
          },
        },
      });
    },

    gender(el, t) {
      return donut(el, t, D.by_gender.labels, D.by_gender.count, (v) => fmtNum(v) + " clients");
    },

    ageGender(el, t) {
      const ag = D.age_gender;
      return new Chart(el, {
        type: "bar",
        data: {
          labels: ag.labels,
          datasets: ag.series.map((s, i) => barDataset(t, s.data, t.series[i], { label: s.label, maxBarThickness: 22 })),
        },
        options: baseOptions(t, {
          scales: axes(t, { yTick: fmtNum, xTitle: "Age group" }),
          plugins: { legend: legend(t, true), tooltip: tooltip(t, fmtNum) },
        }),
      });
    },

    continent(el, t) {
      const metric = state.continent;
      const fmt = METRIC_FORMAT[metric];
      const c = D.by_continent;
      return new Chart(el, {
        type: "bar",
        data: {
          labels: c.labels,
          datasets: [barDataset(t, c[metric], highlightColors(t, c[metric], 1), { label: fmt.label, maxBarThickness: 18 })],
        },
        options: baseOptions(t, {
          indexAxis: "y",
          layout: { padding: { top: 4, right: 8 } },
          scales: axes(t, { horizontal: true, yTick: fmt.tick, beginAtZero: true }),
          plugins: { legend: legend(t, false), tooltip: tooltip(t, fmt.value) },
        }),
      });
    },

    income(el, t) {
      const inc = D.by_income;
      return new Chart(el, {
        type: "bar",
        data: {
          labels: inc.labels.map((l) => "$" + l),
          datasets: [barDataset(t, inc.count, t.series[1], { label: "Clients", categoryPercentage: 0.9, barPercentage: 0.96, maxBarThickness: 60 })],
        },
        options: baseOptions(t, {
          scales: axes(t, { yTick: fmtNum }),
          plugins: { legend: legend(t, false), tooltip: tooltip(t, fmtNum) },
        }),
      });
    },

    continentIncome(el, t) {
      const ci = D.continent_income;
      return new Chart(el, {
        type: "bar",
        data: {
          labels: ci.labels,
          datasets: [barDataset(t, ci.values, highlightColors(t, ci.values, 1), { label: "Avg income", maxBarThickness: 18 })],
        },
        options: baseOptions(t, {
          indexAxis: "y",
          layout: { padding: { top: 4, right: 8 } },
          scales: axes(t, { horizontal: true, yTick: fmtAxisMoney }),
          plugins: { legend: legend(t, false), tooltip: tooltip(t, fmtMoney) },
        }),
      });
    },

    season(el, t) {
      const s = D.by_season;
      return new Chart(el, {
        type: "bar",
        data: {
          labels: s.labels.map(pretty),
          datasets: [barDataset(t, s.count, s.labels.map((_, i) => t.series[i]), { label: "Units", maxBarThickness: 40 })],
        },
        options: baseOptions(t, {
          scales: axes(t, { yTick: fmtNum }),
          plugins: { legend: legend(t, false), tooltip: tooltip(t, fmtNum) },
        }),
      });
    },

    weekday(el, t) {
      const w = D.by_weekday;
      return new Chart(el, {
        type: "bar",
        data: {
          labels: w.labels,
          datasets: [barDataset(t, w.count, highlightColors(t, w.count, 2), { label: "Units" })],
        },
        options: baseOptions(t, {
          scales: axes(t, { yTick: fmtNum }),
          plugins: {
            legend: legend(t, false),
            tooltip: tooltip(t, fmtNum),
            peakLabels: { indexes: topIndexes(w.count, 2), color: t.text, format: fmtNum },
          },
        }),
      });
    },

    margin(el, t) {
      return histogram(el, t, D.margin_hist, t.series[0], "Sales");
    },

    priceHist(el, t) {
      return histogram(el, t, { ...D.price_hist, labels: D.price_hist.labels.map((l) => "$" + l) }, t.series[1], "Sales");
    },

    profitHist(el, t) {
      return histogram(el, t, { ...D.profit_hist, labels: D.profit_hist.labels.map((l) => "$" + l) }, t.series[0], "Sales");
    },

    priceCompare(el, t) {
      const m = D.by_manufacturer;
      return new Chart(el, {
        type: "bar",
        data: {
          labels: m.labels,
          datasets: [
            barDataset(t, m.avg_wholesale, t.series[1], { label: "Avg wholesale" }),
            barDataset(t, m.avg_price, t.series[0], { label: "Avg selling" }),
          ],
        },
        options: baseOptions(t, {
          scales: axes(t, { yTick: fmtAxisMoney }),
          plugins: { legend: legend(t, true), tooltip: tooltip(t, fmtMoney) },
        }),
      });
    },
  };

  function histogram(el, t, h, color, label) {
    return new Chart(el, {
      type: "bar",
      data: {
        labels: h.labels,
        datasets: [barDataset(t, h.count, color, { label, categoryPercentage: 0.94, barPercentage: 0.96, maxBarThickness: 60 })],
      },
      options: baseOptions(t, {
        scales: axes(t, { yTick: fmtNum, xTick: function (v, i) { return h.labels.length > 8 && i % 2 ? null : this.getLabelForValue(v); } }),
        plugins: { legend: legend(t, false), tooltip: tooltip(t, fmtNum) },
      }),
    });
  }

  /* ------------------------------------------------------------------ */
  /* Heatmaps (HTML tables, colored by the card's tokens)                */
  /* ------------------------------------------------------------------ */
  function heatTable(el, rows, cols, matrix, cellColor, cellText, title) {
    const head = "<tr><th></th>" + cols.map((c) => `<th scope="col">${pretty(c)}</th>`).join("") + "</tr>";
    const body = rows
      .map((r, i) =>
        `<tr><th scope="row">${pretty(r)}</th>` +
        matrix[i]
          .map((v, j) => {
            const { bg, fg } = cellColor(v, i, j);
            return `<td style="background:${bg};color:${fg}" title="${pretty(r)} × ${pretty(cols[j])}: ${title(v, i, j)}">${cellText(v, i, j)}</td>`;
          })
          .join("") +
        "</tr>"
      )
      .join("");
    el.innerHTML = `<table>${head}${body}</table>`;
  }

  const heatmaps = {
    makeBody(el, t) {
      const h = D.make_body;
      const flat = h.matrix.flat();
      const min = Math.min(...flat), max = Math.max(...flat);
      heatTable(
        el, h.rows, h.cols, h.matrix,
        (v) => {
          const k = max === min ? 1 : (v - min) / (max - min);
          const strength = 12 + k * 80;
          return {
            bg: `color-mix(in oklab, ${t.series[1]} ${strength}%, ${t.card})`,
            fg: strength > 55 ? "#fff" : t.text,
          };
        },
        (v) => fmtCompact(v),
        (v, i, j) => `${fmtMoney(v)} from ${fmtNum(h.counts[i][j])} sales`
      );
    },

    fuelEngine(el, t) {
      const h = D.fuel_engine;
      const flat = h.matrix.flat();
      const min = Math.min(...flat), max = Math.max(...flat);
      heatTable(
        el, h.rows, h.cols, h.matrix,
        (v) => {
          const k = max === min ? 1 : (v - min) / (max - min);
          const strength = 12 + k * 80;
          return {
            bg: `color-mix(in oklab, ${t.series[0]} ${strength}%, ${t.card})`,
            fg: strength > 55 ? "#fff" : t.text,
          };
        },
        (v) => fmtNum(v),
        (v) => `${fmtNum(v)} units`
      );
    },

    correlation(el, t) {
      const SHORT = {
        year: "Model yr", seating_capacity: "Seats", kilometers_driven: "Km",
        wholesale_price: "Wholesale", selling_price: "Price", client_age: "Age",
        estimated_income: "Income", profit: "Profit", margin_pct: "Margin %",
      };
      const c = { ...D.correlation, labels: D.correlation.labels.map((l) => SHORT[l] || l) };
      const cs = getComputedStyle(el);
      const neg = cs.getPropertyValue("--div-neg").trim();
      const pos = cs.getPropertyValue("--div-pos").trim();
      heatTable(
        el, c.labels, c.labels, c.matrix,
        (v) => {
          const strength = Math.min(Math.abs(v), 1) * 88;
          return {
            bg: `color-mix(in oklab, ${v < 0 ? neg : pos} ${strength}%, ${t.track})`,
            fg: strength > 50 ? "#fff" : t.text2,
          };
        },
        (v) => v.toFixed(2),
        (v) => `r = ${v.toFixed(3)}`
      );
    },
  };

  /* ------------------------------------------------------------------ */
  /* Rendering lifecycle                                                 */
  /* ------------------------------------------------------------------ */
  const instances = new Map();

  function renderPanel(panel) {
    if (!panel) return;
    panel.querySelectorAll("canvas[data-chart]").forEach((canvas) => {
      if (instances.has(canvas)) return;
      const build = builders[canvas.dataset.chart];
      if (build) instances.set(canvas, build(canvas, tokens(canvas)));
    });
    panel.querySelectorAll("[data-heatmap]").forEach((el) => {
      const build = heatmaps[el.dataset.heatmap];
      if (build) build(el, tokens(el));
    });
  }

  function rebuild(canvas) {
    const chart = instances.get(canvas);
    if (chart) chart.destroy();
    instances.delete(canvas);
    instances.set(canvas, builders[canvas.dataset.chart](canvas, tokens(canvas)));
  }

  function rebuildAll() {
    instances.forEach((chart) => chart.destroy());
    instances.clear();
    renderPanel(document.querySelector(".panel.is-active"));
  }

  /* Segmented controls ------------------------------------------------ */
  document.querySelectorAll(".segmented").forEach((group) => {
    group.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-metric]");
      if (!btn) return;
      group.querySelectorAll("button").forEach((b) => b.classList.toggle("is-active", b === btn));
      const target = group.dataset.target;
      state[target] = btn.dataset.metric;
      const canvas = document.querySelector(`canvas[data-chart="${target}"]`);
      if (canvas) rebuild(canvas);
    });
  });

  /* Compare toggles --------------------------------------------------- */
  document.querySelectorAll('.toggles[data-target="compare"] input').forEach((input) => {
    input.addEventListener("change", () => {
      const canvas = document.querySelector('canvas[data-chart="compare"]');
      const chart = instances.get(canvas);
      if (!chart) return;
      chart.setDatasetVisibility(+input.dataset.index, input.checked);
      chart.update();
    });
  });

  /* Theme switcher ---------------------------------------------------- */
  const themeButtons = document.querySelectorAll("[data-theme-set]");
  function markTheme() {
    const current = document.documentElement.getAttribute("data-theme");
    themeButtons.forEach((b) => b.classList.toggle("is-active", b.dataset.themeSet === current));
  }
  themeButtons.forEach((btn) =>
    btn.addEventListener("click", () => {
      document.documentElement.setAttribute("data-theme", btn.dataset.themeSet);
      try { localStorage.setItem("vd-theme", btn.dataset.themeSet); } catch (e) { /* storage unavailable */ }
      markTheme();
      rebuildAll();
    })
  );
  markTheme();

  /* Initial render ---------------------------------------------------- */
  renderPanel(document.querySelector(".panel.is-active"));
})();
