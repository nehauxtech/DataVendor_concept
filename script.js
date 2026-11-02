/*
  Task listings concept. Plain JS, no build step. All data is invented.

  Flow: LISTINGS (data) -> applyView() filters, searches and sorts ->
  renderList() paints rows -> openPanel(id) paints the detail panel.
  UI state lives in `view` and `selectedId`. Everything else is derived.
*/
(function () {
  "use strict";

  /* ================= 1. Fake data ================= */

  var LISTINGS = [
    {
      id: "webhooks", title: "Repair failing payment webhooks in a Node service",
      summary: "Agents debug retries, signatures and idempotency in a small payments API.",
      vendor: "Halden Labs", area: "Coding", tasks: 90, total: 27000, grader: "tests",
      tests: "Whether an agent can find and fix a real bug in a backend service without breaking anything else.",
      bullets: ["Hidden unit tests check the webhook handler.", "A replay test sends the same event twice.", "The full test suite must still pass."],
      checks: [["Handler unit tests", 0.5], ["Duplicate event replay", 0.3], ["Existing suite passes", 0.2]],
      run: [["Read", "src/webhooks/handler.ts"], ["Run", "npm test webhooks"], ["Edit", "verifySignature() uses raw body"], ["Edit", "store event id before processing"], ["Run", "npm test"], ["Submit", "patch with 2 files changed"]],
      deciding: 3, reason: "Storing the event id first is what makes the replay test pass.",
      signals: { reviewed: "Yes, 2 experts", runs: "1,240", agree: "97%" },
      scope: { in: ["Container environment", "Hidden tests and grader", "Reference solutions"], out: ["Production data", "Human review per run"] }
    },
    {
      id: "ledgers", title: "Reconcile quarterly ledgers across three spreadsheets",
      summary: "Match transactions, flag mismatches and write a short variance note.",
      vendor: "Northgate Data", area: "Finance", tasks: 40, total: 14000, grader: "rubric",
      tests: "Whether an agent can line up records from messy sources and explain the gaps like an analyst would.",
      bullets: ["Matched totals are compared to an answer key.", "Flagged rows are checked for misses and false alarms.", "A rubric scores the variance note for clarity."],
      checks: [["Totals match key", 0.4], ["Flags are correct", 0.4], ["Note is clear", 0.2]],
      run: [["Open", "ledger_q2.xlsx"], ["Open", "bank_export.csv"], ["Join", "on date and amount"], ["Flag", "6 rows with no match"], ["Write", "variance_note.md"], ["Submit", "reconciled.xlsx"]],
      deciding: 3, reason: "Two flagged rows were real matches with rounded amounts.",
      signals: { reviewed: "Yes, 2 experts", runs: "620", agree: "91%" },
      scope: { in: ["Source spreadsheets", "Answer keys", "Scoring rubric"], out: ["Live accounting system", "Tax rules"] }
    },
    {
      id: "travel", title: "Book multi leg travel inside a mock airline site",
      summary: "Agents search, compare and book trips under budget and time rules.",
      vendor: "Pinecrest Works", area: "Browser", tasks: 60, total: 16800, grader: "tests",
      tests: "Whether an agent can complete a long booking flow on a website and respect every constraint.",
      bullets: ["The final booking is read from the site database.", "Price must stay under the stated budget.", "Layovers must meet the minimum time."],
      checks: [["Booking exists", 0.4], ["Under budget", 0.3], ["Layover rules met", 0.3]],
      run: [["Open", "mock airline search"], ["Search", "AUS to BOS, Fri"], ["Sort", "by price"], ["Select", "fare with 38 min layover"], ["Pay", "test card"], ["Submit", "booking ref QX42"]],
      deciding: 3, reason: "The layover is under the 45 minute rule, so that check fails.",
      signals: { reviewed: "Yes, 1 expert", runs: "410", agree: "99%" },
      scope: { in: ["Hosted mock site", "State checker", "Task prompts"], out: ["Real airline APIs", "Payment handling"] }
    },
    {
      id: "py-migrate", title: "Migrate a legacy Python package to Python 3.12",
      summary: "One large task. Update syntax, imports and packaging without changing behavior.",
      vendor: "Halden Labs", area: "Coding", tasks: 1, total: 1800, grader: "tests",
      tests: "Whether an agent can carry a long refactor to the end while keeping behavior the same.",
      bullets: ["The original test suite runs on Python 3.12.", "Behavior tests compare outputs before and after.", "The package must build and install cleanly."],
      checks: [["Suite runs on 3.12", 0.4], ["Outputs unchanged", 0.4], ["Builds and installs", 0.2]],
      run: [["Run", "test suite on Python 3.12"], ["Read", "setup.py"], ["Edit", "replace print statements"], ["Edit", "move to pyproject.toml"], ["Run", "pip install ."], ["Submit", "branch py312"]],
      deciding: 1, reason: "Running the old suite first showed which modules failed.",
      signals: { reviewed: "Yes, 3 experts", runs: "85", agree: "100%" },
      scope: { in: ["Full repository", "Behavior tests", "Reference branch"], out: ["Dependency upgrades", "Docs rewrite"] }
    },
    {
      id: "oncall", title: "Triage on call alerts from synthetic server logs",
      summary: "Agents read logs, pick the root cause and write a short incident note.",
      vendor: "Ferrow and Kade", area: "Ops", tasks: 120, total: 21600, grader: "rubric",
      tests: "Whether an agent can find the real cause of an outage among noisy signals.",
      bullets: ["The named root cause is compared to the injected fault.", "Evidence must cite the right log lines.", "A rubric scores the incident note."],
      checks: [["Correct root cause", 0.6], ["Cites evidence", 0.25], ["Clear note", 0.15]],
      run: [["Read", "alerts.json"], ["Grep", "ERROR in api.log"], ["Grep", "timeouts in db.log"], ["Decide", "connection pool exhausted"], ["Write", "incident.md"], ["Submit", "triage report"]],
      deciding: 3, reason: "The pool limit is the injected fault, so the main check passes.",
      signals: { reviewed: "Yes, 2 experts", runs: "980", agree: "88%" },
      scope: { in: ["Log bundles", "Fault manifest", "Scoring rubric"], out: ["Live paging tools", "Fix deployment"] }
    },
    {
      id: "sql", title: "Write SQL to answer analyst questions on a retail warehouse",
      summary: "Plain questions in, queries out. Results are checked against expected tables.",
      vendor: "Lumen Quarry", area: "Data", tasks: 200, total: 30000, grader: "tests",
      tests: "Whether an agent can turn a business question into a correct query on an unfamiliar schema.",
      bullets: ["The result table must match the expected rows.", "Column names and order are not scored.", "Queries must finish in under 10 seconds."],
      checks: [["Rows match", 0.7], ["Runs in time", 0.2], ["No writes to tables", 0.1]],
      run: [["Read", "schema.sql"], ["Ask", "top 5 stores by Q3 returns"], ["Query", "JOIN orders, returns"], ["Fix", "filter returns by date"], ["Run", "query, 5 rows"], ["Submit", "final query"]],
      deciding: 3, reason: "Without the date filter, two stores from Q2 slipped in.",
      signals: { reviewed: "Yes, 1 expert", runs: "3,400", agree: "99%" },
      scope: { in: ["Warehouse snapshot", "Questions and expected tables", "Checker script"], out: ["BI dashboards", "Real customer data"] }
    },
    {
      id: "trials", title: "Summarize clinical trial eligibility from long protocols",
      summary: "Agents pull inclusion and exclusion rules into a clear patient checklist.",
      vendor: "Kestrel Review", area: "Documents", tasks: 35, total: 17500, grader: "rubric",
      tests: "Whether an agent can read a dense document and list every rule that decides who can join.",
      bullets: ["Each rule is matched to an expert checklist.", "Missing or invented rules lose points.", "A rubric scores plain language."],
      checks: [["Rules found", 0.5], ["No invented rules", 0.3], ["Plain language", 0.2]],
      run: [["Open", "protocol_v7.pdf"], ["Find", "Section 5, Eligibility"], ["Extract", "14 inclusion rules"], ["Extract", "9 exclusion rules"], ["Write", "checklist.md"], ["Submit", "checklist"]],
      deciding: 3, reason: "One exclusion rule was in an appendix and the agent missed it.",
      signals: { reviewed: "Yes, 2 experts", runs: "260", agree: "84%" },
      scope: { in: ["Fictional protocols", "Expert checklists", "Scoring rubric"], out: ["Real patient data", "Medical advice"] }
    },
    {
      id: "a11y", title: "Fix accessibility bugs in a web checkout flow",
      summary: "Labels, focus order and contrast issues in a small shop front end.",
      vendor: "Tallow Studio", area: "Coding", tasks: 48, total: 12960, grader: "tests",
      tests: "Whether an agent can fix real accessibility issues without changing how the page looks.",
      bullets: ["An automated audit must report zero issues.", "A keyboard script completes checkout.", "Screenshots must match within a small tolerance."],
      checks: [["Audit passes", 0.4], ["Keyboard checkout works", 0.4], ["Looks unchanged", 0.2]],
      run: [["Run", "audit checkout page"], ["Edit", "add labels to 4 inputs"], ["Edit", "fix tab order in address form"], ["Edit", "raise button contrast"], ["Run", "keyboard script"], ["Submit", "patch"]],
      deciding: 2, reason: "The tab order fix is what lets the keyboard script finish.",
      signals: { reviewed: "Yes, 1 expert", runs: "530", agree: "96%" },
      scope: { in: ["App source", "Audit and keyboard scripts", "Baseline screenshots"], out: ["Design changes", "Screen reader testing by people"] }
    },
    {
      id: "receipts", title: "Fill tax forms from scanned receipts in a desktop app",
      summary: "Agents read receipts and enter the right totals into a form program.",
      vendor: "Brightwell Tasks", area: "Desktop", tasks: 25, total: 9500, grader: "rubric",
      tests: "Whether an agent can move between images and a desktop app and enter numbers without mistakes.",
      bullets: ["Field values are compared to an answer key.", "Each wrong field costs points.", "A reviewer rubric checks category choices."],
      checks: [["Totals correct", 0.5], ["Fields complete", 0.3], ["Categories right", 0.2]],
      run: [["Open", "receipts folder, 12 images"], ["Read", "receipt_04.png"], ["Type", "office supplies, 84.20"], ["Read", "receipt_09.png"], ["Type", "travel, 412.00"], ["Submit", "saved form"]],
      deciding: 4, reason: "This receipt was meals, not travel, so the category check drops.",
      signals: { reviewed: "Yes, 1 expert", runs: "190", agree: "90%" },
      scope: { in: ["VM image with the app", "Receipt images", "Answer keys"], out: ["Real tax software", "Filing"] }
    },
    {
      id: "merge", title: "Resolve merge conflicts across a large monorepo",
      summary: "One hard task with 31 conflicts across services, tests and config.",
      vendor: "Northgate Data", area: "Coding", tasks: 1, total: 1200, grader: "tests",
      tests: "Whether an agent can untangle many conflicts and keep every service working.",
      bullets: ["The repository must build with no conflict markers.", "Each service test suite must pass.", "Config values must match the target branch."],
      checks: [["Builds clean", 0.3], ["Service tests pass", 0.5], ["Config matches", 0.2]],
      run: [["Run", "git merge release/9"], ["List", "31 conflicted files"], ["Edit", "resolve billing service"], ["Edit", "resolve shared config"], ["Run", "make test"], ["Submit", "merge commit"]],
      deciding: 3, reason: "Keeping the old config value broke two service tests.",
      signals: { reviewed: "No", runs: "40", agree: "100%" },
      scope: { in: ["Repository snapshot", "Build and test scripts"], out: ["Reference solution", "CI setup"] }
    }
  ];

  /* ================= 1b. Quality data ================= */

  // Fake models. Names are invented.
  var MODELS = ["Atlas 1", "Nimbus 2 Mini", "Tern 3"];

  // Four QA checks run on every listing. Verified means every required and recommended check passed.
  var QA_CHECKS = [
    { name: "Environment builds and starts", level: "Required" },
    { name: "Grader passes on reference solutions", level: "Required" },
    { name: "Prompt matches what the grader checks", level: "Recommended" },
    { name: "No answer leaks into the prompt", level: "Recommended" }
  ];
  // Checks that failed per listing. A listing missing from QA_RESULTS has no QA agent results yet.
  var QA_FAILED = { travel: [2], trials: [3] };
  var QA_MISSING = ["merge"];

  // Model runs per listing: [model index, runs, passes, average reward]
  var RUNS = {
    "webhooks":     [[0, 5, 4, 0.82], [1, 3, 1, 0.41]],
    "ledgers":      [[0, 6, 4, 0.71], [1, 6, 3, 0.58]],
    "travel":       [[0, 4, 3, 0.76], [1, 4, 2, 0.55], [2, 4, 1, 0.33]],
    "py-migrate":   [[0, 1, 1, 1.00]],
    "oncall":       [[0, 10, 7, 0.74], [1, 10, 5, 0.56]],
    "sql":          [[0, 12, 11, 0.92], [1, 12, 9, 0.79], [2, 12, 7, 0.64]],
    "trials":       [[0, 1, 1, 0.88], [1, 1, 0, 0.40]],
    "a11y":         [[0, 6, 5, 0.86], [1, 6, 3, 0.61]],
    "receipts":     [[0, 4, 2, 0.64], [2, 4, 1, 0.47]],
    "merge":        [[0, 1, 1, 1.00]]
  };
  var FEW_RUNS = 3; // under this many runs, show "Limited data" and "Based on few runs"

  LISTINGS.forEach(function (l) {
    var failed = QA_FAILED[l.id] || [];
    l.qa = QA_MISSING.indexOf(l.id) !== -1 ? [] : QA_CHECKS.map(function (c, i) {
      return { name: c.name, level: c.level, pass: failed.indexOf(i) === -1 };
    });
    l.qaPassed = l.qa.filter(function (c) { return c.pass; }).length;
    l.verified = l.qa.length > 0 && l.qaPassed === l.qa.length;
    l.runs = RUNS[l.id].map(function (r) { return { model: MODELS[r[0]], runs: r[1], passes: r[2], reward: r[3] }; });
    l.runTotal = l.runs.reduce(function (s, r) { return s + r.runs; }, 0);
    l.passTotal = l.runs.reduce(function (s, r) { return s + r.passes; }, 0);
  });

  var GRADER_LABEL = { tests: "Tests decide the reward", rubric: "Rubric scored" };
  var AREAS = LISTINGS.map(function (l) { return l.area; }).filter(function (a, i, arr) { return arr.indexOf(a) === i; }).sort();

  /* ================= 2. Helpers ================= */

  var $ = function (id) { return document.getElementById(id); };
  var money = function (n) { return "$" + n.toLocaleString("en-US"); };
  var perTask = function (l) { return l.total / l.tasks; };
  var agreement = function (l) { return parseInt(l.signals.agree, 10); };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // Price always comes with its unit: "$27,000 for 90 tasks" and "$300 per task"
  function forTasks(l) { return "for " + l.tasks + (l.tasks === 1 ? " task" : " tasks"); }
  function perTaskText(l) {
    var p = perTask(l);
    return (p % 1 === 0 ? "" : "about ") + money(Math.round(p)) + " per task";
  }
  function pct(passes, runs) { return Math.round(passes / runs * 100); }
  function runsText(n) { return n + (n === 1 ? " run" : " runs"); }

  var live = $("live");
  var liveTimer = null;
  function announce(msg, delay) {
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () { live.textContent = ""; live.textContent = msg; }, delay || 50);
  }

  /* ================= 3. View state: search, filters, sort ================= */

  var view = { q: "", graders: [], price: "any", areas: [], verifiedOnly: false, sort: "recommended" };
  var selectedId = null;

  function matches(l) {
    var q = view.q.trim().toLowerCase();
    if (q && (l.title + " " + l.summary + " " + l.vendor + " " + l.area).toLowerCase().indexOf(q) === -1) return false;
    if (view.graders.length && view.graders.indexOf(l.grader) === -1) return false;
    if (view.areas.length && view.areas.indexOf(l.area) === -1) return false;
    if (view.verifiedOnly && !l.verified) return false;
    var p = perTask(l);
    if (view.price === "low" && !(p < 250)) return false;
    if (view.price === "mid" && !(p >= 250 && p <= 500)) return false;
    if (view.price === "high" && !(p > 500)) return false;
    return true;
  }

  var SORTS = {
    "recommended": null,
    "price-asc": function (a, b) { return perTask(a) - perTask(b); },
    "price-desc": function (a, b) { return perTask(b) - perTask(a); },
    "tasks-desc": function (a, b) { return b.tasks - a.tasks; },
    "agreement-desc": function (a, b) { return agreement(b) - agreement(a); }
  };

  function applyView() {
    var out = LISTINGS.filter(matches);
    if (SORTS[view.sort]) out = out.slice().sort(SORTS[view.sort]);
    return out;
  }

  function activeFilterCount() {
    return view.graders.length + view.areas.length + (view.verifiedOnly ? 1 : 0) + (view.price !== "any" ? 1 : 0);
  }

  /* ================= 4. List rendering ================= */

  var ICON_CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7"/></svg>';
  var ICON_STACK = '<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="3" width="10" height="4" rx="1"/><rect x="3" y="9" width="10" height="4" rx="1"/></svg>';
  var ICON_GRADE = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3 3 7-8"/></svg>';
  var ICON_WARN = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="5.5"/><path d="M8 5.5v3M8 10.8v.2"/></svg>';
  var ICON_VENDOR = '<svg viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="6" r="2.5"/><path d="M3.5 13c.8-2.2 2.5-3.3 4.5-3.3s3.7 1.1 4.5 3.3"/></svg>';

  // "4 of 4 checks passed" and "Model pass rate 62% (8 runs)"
  function qualityLine(l) {
    var checks = !l.qa.length
      ? '<span class="q-item q-none">' + ICON_WARN + "No QA agent results</span>"
      : '<span class="q-item' + (l.verified ? " q-ok" : " q-warn") + '">' + (l.verified ? ICON_CHECK : ICON_WARN) +
        l.qaPassed + " of " + l.qa.length + " checks passed</span>";
    var rate = '<span class="q-item">Model pass rate ' + pct(l.passTotal, l.runTotal) + "% (" + runsText(l.runTotal) + ")" +
      (l.runTotal < FEW_RUNS ? ' <span class="tag tag-limited">Limited data</span>' : "") + "</span>";
    return '<p class="quality">' + checks + rate + "</p>";
  }

  function renderList(opts) {
    var items = applyView();
    var list = $("listings");
    var total = LISTINGS.length;
    var filtered = view.q || activeFilterCount();

    $("filterCount").hidden = !activeFilterCount();
    $("filterCount").textContent = activeFilterCount();

    if (!items.length) {
      list.hidden = true;
      $("empty").hidden = false;
      $("resultLine").textContent = "0 of " + total + " listings";
      $("emptyText").textContent = view.q
        ? 'Nothing matches "' + view.q.trim() + '" with these filters.'
        : "No listing fits all of these filters.";
    } else {
      list.hidden = false;
      $("empty").hidden = true;
      $("resultLine").textContent = filtered ? items.length + " of " + total + " listings" : total + " listings";

      list.innerHTML = items.map(function (l) {
        var badge = l.verified
          ? '<button type="button" class="verified" data-verify="' + l.id + '" aria-haspopup="dialog" aria-expanded="false" aria-controls="popover">' + ICON_CHECK + 'Verified<span class="sr-only">, what this means</span></button>'
          : '<span class="unverified">Not verified</span>';
        return '<li class="row' + (l.id === selectedId ? " is-selected" : "") + '" data-id="' + l.id + '">' +
          '<div>' +
            '<h2 class="row-title"><button type="button" class="row-open" data-open="' + l.id + '" aria-controls="panel"' +
              (l.id === selectedId ? ' aria-current="true"' : "") + ">" + esc(l.title) + "</button></h2>" +
            '<p class="row-summary">' + esc(l.summary) + "</p>" +
            qualityLine(l) +
            '<div class="meta">' +
              '<span class="meta-item">' + ICON_VENDOR + esc(l.vendor) + "</span>" +
              '<span class="meta-item">' + ICON_STACK + l.tasks + (l.tasks === 1 ? " task" : " tasks") + "</span>" +
              '<span class="meta-item">' + ICON_GRADE + GRADER_LABEL[l.grader] + "</span>" +
              badge +
            "</div>" +
          "</div>" +
          '<div class="price"><span class="price-total">' + money(l.total) + ' <span class="price-for">' + forTasks(l) + '</span></span>' +
            '<span class="price-unit">' + perTaskText(l) + "</span></div>" +
        "</li>";
      }).join("") +
      // Visible end of list
      '<li class="list-end">' + (filtered
        ? (items.length === 1 ? "That's the only matching listing" : "You've seen all " + items.length + " matching listings")
        : "You've seen all " + total + " listings") + "</li>";
    }

    if (opts && opts.announce) {
      announce(items.length ? items.length + (items.length === 1 ? " listing" : " listings") + " shown" : "No listings match. Reset is available.", opts.delay);
    }
  }

  /* ================= 5. List interactions ================= */

  var listEl = $("listings");

  listEl.addEventListener("click", function (e) {
    var v = e.target.closest("[data-verify]");
    if (v) { e.stopPropagation(); togglePopover(v); return; }
    var row = e.target.closest(".row");
    if (row) openPanel(row.dataset.id, e.target.closest("[data-open]") || row.querySelector("[data-open]"));
  });

  // Up and Down move between rows, Home and End jump
  listEl.addEventListener("keydown", function (e) {
    var btn = e.target.closest("[data-open]");
    if (!btn) return;
    var all = Array.prototype.slice.call(listEl.querySelectorAll("[data-open]"));
    var i = all.indexOf(btn), next = null;
    if (e.key === "ArrowDown") next = all[i + 1];
    else if (e.key === "ArrowUp") next = all[i - 1];
    else if (e.key === "Home") next = all[0];
    else if (e.key === "End") next = all[all.length - 1];
    if (next) { e.preventDefault(); next.focus(); }
  });

  $("search").addEventListener("input", function (e) {
    view.q = e.target.value;
    renderList({ announce: true, delay: 500 }); // wait for typing to settle before announcing
  });
  $("sort").addEventListener("change", function (e) {
    view.sort = e.target.value;
    renderList();
    announce("Sorted by " + e.target.options[e.target.selectedIndex].text);
  });

  // "/" jumps to search, like many developer tools
  document.addEventListener("keydown", function (e) {
    if (e.key === "/" && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
      e.preventDefault(); $("search").focus();
    }
  });

  /* ================= 6. Filters ================= */

  $("areaList").innerHTML = AREAS.map(function (a) {
    return '<label><input type="checkbox" name="area" value="' + a + '"> ' + a + "</label>";
  }).join("");

  var filtersEl = $("filters"), filtersBtn = $("filtersBtn");
  function setFiltersOpen(open) {
    filtersEl.hidden = !open;
    filtersBtn.setAttribute("aria-expanded", String(open));
    if (open) filtersEl.querySelector("input").focus();
  }
  filtersBtn.addEventListener("click", function () { setFiltersOpen(filtersEl.hidden); });
  $("doneFilters").addEventListener("click", function () { setFiltersOpen(false); filtersBtn.focus(); });

  function readFilters() {
    var f = new FormData(filtersEl);
    view.graders = f.getAll("grader");
    view.areas = f.getAll("area");
    view.price = f.get("price") || "any";
    view.verifiedOnly = f.get("verified") === "yes";
  }
  filtersEl.addEventListener("change", function () { readFilters(); renderList({ announce: true }); });

  function clearFilters() { filtersEl.reset(); readFilters(); }
  $("clearFilters").addEventListener("click", function () { clearFilters(); renderList({ announce: true }); });
  $("resetAll").addEventListener("click", function () {
    clearFilters();
    view.q = ""; $("search").value = "";
    renderList({ announce: true });
    $("search").focus();
  });

  /* ================= 7. Verified popover ================= */
  // Opens on hover (pointer), on tap or click, and on Enter or Space (keyboard).
  // Hover opens it softly; a click or key press pins it open. Escape closes it.

  var pop = $("popover"), popTrigger = null, popPinned = false, hoverTimer = null;

  function showPopover(btn, pin) {
    clearTimeout(hoverTimer);
    if (popTrigger !== btn) closePopover(false);
    popTrigger = btn;
    popPinned = popPinned || pin;
    pop.dataset.id = btn.dataset.verify;
    pop.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    placePopover(btn);
    if (pin) $("popTitle").focus();
  }

  function togglePopover(btn) {
    // A tap after a hover pins it instead of closing it
    if (popTrigger === btn && !pop.hidden && popPinned) return closePopover(true);
    showPopover(btn, true);
  }

  // Fixed position under the badge, kept inside the viewport
  function placePopover(btn) {
    var r = btn.getBoundingClientRect(), w = pop.offsetWidth, h = pop.offsetHeight;
    var left = Math.min(Math.max(16, r.left), window.innerWidth - w - 16);
    var top = r.bottom + 8;
    if (top + h > window.innerHeight - 16) top = Math.max(16, r.top - h - 8);
    pop.style.left = left + "px";
    pop.style.top = top + "px";
  }

  function closePopover(returnFocus) {
    clearTimeout(hoverTimer);
    if (pop.hidden) return;
    pop.hidden = true;
    popPinned = false;
    if (popTrigger) {
      popTrigger.setAttribute("aria-expanded", "false");
      if (returnFocus && document.contains(popTrigger)) popTrigger.focus();
    }
    popTrigger = null;
  }

  // Hover with a mouse only. Touch uses the click path.
  listEl.addEventListener("pointerover", function (e) {
    var b = e.target.closest("[data-verify]");
    if (b && e.pointerType === "mouse") showPopover(b, false);
  });
  listEl.addEventListener("pointerout", function (e) {
    var b = e.target.closest("[data-verify]");
    if (b && e.pointerType === "mouse" && !popPinned) hoverTimer = setTimeout(function () { closePopover(false); }, 200);
  });
  pop.addEventListener("pointerenter", function () { clearTimeout(hoverTimer); });
  pop.addEventListener("pointerleave", function () {
    if (!popPinned) hoverTimer = setTimeout(function () { closePopover(false); }, 200);
  });

  $("popChecks").addEventListener("click", function () {
    var id = pop.dataset.id;
    closePopover(false);
    openPanel(id, null, "qa");
  });
  document.addEventListener("click", function (e) {
    if (!pop.hidden && !pop.contains(e.target) && !e.target.closest("[data-verify]")) closePopover(false);
  });
  window.addEventListener("resize", function () { closePopover(false); });
  window.addEventListener("scroll", function () { closePopover(false); }, true);
  // Tab out of the popover closes it
  pop.addEventListener("focusout", function (e) {
    if (e.relatedTarget && !pop.contains(e.relatedTarget) && e.relatedTarget !== popTrigger) closePopover(false);
  });

  /* ================= 8. Detail panel ================= */

  var panel = $("panel"), panelScrim = $("panelScrim"), returnTo = null;
  var drawerMode = window.matchMedia("(max-width: 1199px)");
  function byId(id) { return LISTINGS.filter(function (l) { return l.id === id; })[0]; }

  function openPanel(id, trigger, tab) {
    var l = byId(id);
    if (!l) return;
    selectedId = id;
    returnTo = trigger || null;

    $("pVendor").textContent = l.vendor + " · " + l.area;
    $("pTitle").textContent = l.title;
    $("pTests").textContent = l.tests;
    $("pGrader").textContent = GRADER_LABEL[l.grader];
    $("pBullets").innerHTML = l.bullets.map(function (b) { return "<li>" + esc(b) + "</li>"; }).join("");

    // Score preview switches, one per check
    $("pChecks").innerHTML = l.checks.map(function (c, i) {
      return '<li><label><input type="checkbox" class="switch" id="chk-' + i + '" data-w="' + c[1] + '" checked>' +
        '<span class="check-name">' + esc(c[0]) + '</span><span class="weight">' + c[1].toFixed(2) + "</span></label></li>";
    }).join("");
    updateScore(false);

    $("pRun").innerHTML = l.run.map(function (s, i) {
      var deciding = i === l.deciding;
      return '<li class="' + (deciding ? "is-deciding" : "") + '"><span><strong>' + esc(s[0]) + "</strong> <code>" + esc(s[1]) + "</code></span>" +
        (deciding ? '<span class="reason"><strong>Deciding step.</strong> ' + esc(l.reason) + "</span>" : "") + "</li>";
    }).join("");

    $("pSignals").innerHTML =
      "<div><dt>Expert reviewed</dt><dd>" + l.signals.reviewed + "</dd></div>" +
      "<div><dt>Test runs</dt><dd>" + l.signals.runs + "</dd></div>" +
      "<div><dt>Graders agree</dt><dd>" + l.signals.agree + "</dd></div>";

    $("pIn").innerHTML = l.scope.in.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");
    $("pOut").innerHTML = l.scope.out.map(function (s) { return "<li>" + esc(s) + "</li>"; }).join("");

    renderQa(l);
    renderRuns(l);

    $("pPrice").innerHTML = money(l.total) + ' <span class="price-for">' + forTasks(l) + "</span>";
    $("pUnit").textContent = perTaskText(l);
    $("confirm").hidden = true;

    panel.hidden = false;
    selectPanelTab(tab || "meta", false);
    $("panelBody").scrollTop = 0;
    syncDrawerMode();
    renderList();
    if (tab) $("ptab-" + tab).focus(); else $("pTitle").focus();
    announce("Details open for " + l.title);
  }

  function closePanel() {
    if (panel.hidden) return;
    panel.hidden = true;
    panelScrim.hidden = true;
    setBackgroundInert(false);
    var id = selectedId;
    selectedId = null;
    renderList();
    // Return focus to the row that opened the panel (the list was re-rendered)
    var back = listEl.querySelector('[data-open="' + id + '"]');
    (back || $("search")).focus();
  }

  // On narrow screens the panel is a modal drawer, so the page behind goes inert
  function setBackgroundInert(on) {
    $("main").inert = on;
    $("sidebar").inert = on;
  }
  function syncDrawerMode() {
    var asDrawer = drawerMode.matches && !panel.hidden;
    panelScrim.hidden = !asDrawer;
    panel.setAttribute("aria-modal", String(asDrawer));
    panel.setAttribute("role", asDrawer ? "dialog" : "complementary");
    setBackgroundInert(asDrawer);
  }
  if (drawerMode.addEventListener) drawerMode.addEventListener("change", syncDrawerMode);

  $("panelClose").addEventListener("click", closePanel);
  panelScrim.addEventListener("click", closePanel);

  // Live score: sum of weights for checks that are on
  function updateScore(say) {
    var boxes = $("pChecks").querySelectorAll(".switch");
    var score = 0;
    boxes.forEach(function (b) {
      if (b.checked) score += Number(b.dataset.w);
      b.closest("label").querySelector(".check-name").classList.toggle("check-off", !b.checked);
    });
    score = Math.round(score * 100) / 100;
    $("pScore").textContent = score.toFixed(2);
    $("pScoreBar").style.width = (score * 100) + "%";
    if (say) announce("Final score " + score.toFixed(2));
  }
  $("pChecks").addEventListener("change", function () { updateScore(true); });

  // Quality checks tab
  function renderQa(l) {
    $("pQaSummary").textContent = l.qa.length
      ? l.qaPassed + " of " + l.qa.length + " checks passed." + (l.verified ? " Every required and recommended check passed." : "")
      : "";
    $("pQaSummary").hidden = !l.qa.length;
    $("pQaEmpty").hidden = l.qa.length > 0;
    $("pQa").hidden = !l.qa.length;
    $("pQa").innerHTML = l.qa.map(function (c) {
      return '<li class="qa-row ' + (c.pass ? "is-pass" : "is-fail") + '">' +
        '<span class="qa-icon" aria-hidden="true">' + (c.pass ? ICON_CHECK : ICON_WARN) + "</span>" +
        '<span class="qa-name">' + esc(c.name) + '<span class="qa-level">' + c.level + "</span></span>" +
        '<span class="qa-state">' + (c.pass ? "Passed" : "Not passed") + "</span></li>";
    }).join("");
  }

  // Model runs tab
  function renderRuns(l) {
    var few = false;
    $("pRunsBody").innerHTML = l.runs.map(function (r) {
      var p = pct(r.passes, r.runs);
      var isFew = r.runs < FEW_RUNS;
      few = few || isFew;
      return "<tr>" +
        '<th scope="row">' + esc(r.model) + "</th>" +
        '<td><span class="bar-cell"><span class="mini-bar" aria-hidden="true"><span style="width:' + p + '%"></span></span>' + p + "%</span></td>" +
        "<td>" + r.runs + (isFew ? '<span class="few-note">Based on few runs</span>' : "") + "</td>" +
        "<td>" + r.reward.toFixed(2) + "</td></tr>";
    }).join("");
    $("pRunsNote").hidden = !few;
  }

  // Panel tabs: Metadata, Quality checks, Model runs
  var ptabs = Array.prototype.slice.call(document.querySelectorAll(".ptabs [role='tab']"));
  function selectPanelTab(key, focus) {
    ptabs.forEach(function (t) {
      var on = t.id === "ptab-" + key;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
      if (on && focus) t.focus();
    });
  }
  ptabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectPanelTab(t.id.replace("ptab-", ""), true); });
    t.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : e.key === "Home" ? 0 : e.key === "End" ? ptabs.length - 1 : null;
      if (n === null) return;
      e.preventDefault();
      selectPanelTab(ptabs[(n + ptabs.length) % ptabs.length].id.replace("ptab-", ""), true);
    });
  });

  // Buy now and Make an offer only show a calm note. Nothing is charged or sent.
  function confirmNote(html) {
    var c = $("confirm");
    c.innerHTML = html;
    c.hidden = false;
  }
  $("buyBtn").addEventListener("click", function () {
    var l = byId(selectedId);
    confirmNote("<strong>Ready to buy " + money(l.total) + " " + forTasks(l) + ".</strong> This is a concept, so nothing was charged.");
  });
  $("offerBtn").addEventListener("click", function () {
    var l = byId(selectedId);
    confirmNote("<strong>Offer started.</strong> In a real product you could name a price and " + esc(l.vendor) + " would reply. Nothing was sent.");
  });

  /* ================= 9. Tabs ================= */

  var tabs = Array.prototype.slice.call(document.querySelectorAll('.tabs [role="tab"]'));
  function selectTab(tab) {
    tabs.forEach(function (t) {
      var on = t === tab;
      t.setAttribute("aria-selected", String(on));
      t.tabIndex = on ? 0 : -1;
      $(t.getAttribute("aria-controls")).hidden = !on;
    });
    tab.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener("click", function () { selectTab(t); });
    t.addEventListener("keydown", function (e) {
      var n = e.key === "ArrowRight" ? i + 1 : e.key === "ArrowLeft" ? i - 1 : null;
      if (n === null) return;
      e.preventDefault();
      selectTab(tabs[(n + tabs.length) % tabs.length]);
    });
  });

  /* ================= 10. Mobile nav + Escape ================= */

  var sidebar = $("sidebar"), navScrim = $("navScrim"), navOpen = $("navOpen");
  function setNav(open) {
    sidebar.classList.toggle("is-open", open);
    navScrim.hidden = !open;
    navOpen.setAttribute("aria-expanded", String(open));
    (open ? $("navClose") : navOpen).focus();
  }
  navOpen.addEventListener("click", function () { setNav(true); });
  $("navClose").addEventListener("click", function () { setNav(false); });
  navScrim.addEventListener("click", function () { setNav(false); });
  document.querySelectorAll('a[href="#"]').forEach(function (a) { a.addEventListener("click", function (e) { e.preventDefault(); }); });

  // Escape closes the top-most layer first
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!pop.hidden) return closePopover(true);
    if (!filtersEl.hidden && filtersEl.contains(document.activeElement)) { setFiltersOpen(false); return filtersBtn.focus(); }
    if (sidebar.classList.contains("is-open")) return setNav(false);
    if (!panel.hidden) closePanel();
  });

  // Keep Tab inside the drawer while it is modal
  panel.addEventListener("keydown", function (e) {
    if (e.key !== "Tab" || panel.getAttribute("aria-modal") !== "true") return;
    var f = Array.prototype.filter.call(panel.querySelectorAll("button, input, [href]"), function (el) { return !el.disabled && el.offsetParent !== null; });
    if (!f.length) return;
    if (e.shiftKey && (document.activeElement === f[0] || document.activeElement === $("pTitle"))) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  /* ================= 11. Start ================= */
  renderList();
})();
