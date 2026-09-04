/* ================================================================
   Module 00 — ICL UNIVERSE DASHBOARD (hub)
================================================================ */
function renderDashboard() {
  const evTypeColor = {
    congress:  "#0071B0",  // STAAR blue — major events
    launch:    "#2472D3",  // teal — product launches
    training:  "#E78A27",  // orange — CME / webinar
    community: "#00D5E1",  // aqua — community
  };
  const eventsHTML = DATA.events.slice(0, 6).map(e => `
    <div class="dash-event" style="--accent:${evTypeColor[e.type] || '#6B7088'}">
      <div class="de-date">
        <div class="mo">${e.mo}</div>
        <div class="day">${e.day}</div>
      </div>
      <div class="de-body">
        <div class="de-tag">${e.type}</div>
        <div class="de-title">${e.title}</div>
        <div class="de-sub">${e.sub}</div>
      </div>
      <div class="de-time">${e.time}</div>
    </div>
  `).join("");

  return `
    ${moduleHead("00 · DASHBOARD", "ICL Universe at a glance", "What's happening with your patients — and what's happening across the ICL community.")}

    <!-- TWO-COLUMN DASHBOARD (My Patients 2/3 · Community 1/3) -->
    <div class="dash-top-grid">

      <!-- ============ MY PATIENTS (left 2/3) ============ -->
      <section class="dash-patients-col">
        <div class="dash-eyebrow">
          <span class="eb-ico" style="background:linear-gradient(135deg,#001E60,#0071B0)">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><circle cx="9" cy="7" r="4"/><path d="M17 11a4 4 0 100-8 4 4 0 000 8zM2 21v-2a4 4 0 014-4h6a4 4 0 014 4v2M21 21v-2a4 4 0 00-3-3.87"/></svg>
          </span>
          <div>
            <div class="eb-t">What's happening with my patients?</div>
            <div class="eb-s">Clinic-scoped — live OR, pipeline, events, and every patient on your queue.</div>
          </div>
        </div>

        <!-- KPI strip (fits in 2/3) -->
        <div class="grid grid-kpi" style="margin-top:12px;">
          <div class="card kpi">
            <span class="kpi-label">Active patients</span>
            <span class="kpi-value">1,248 <span class="kpi-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>+82</span></span>
            <span class="muted small">This month</span>
          </div>
          <div class="card kpi">
            <span class="kpi-label">Implants scheduled</span>
            <span class="kpi-value">34 <span class="unit">cases</span></span>
            <span class="muted small">Next 7 days</span>
          </div>
          <div class="card kpi">
            <span class="kpi-label">Vault Safety Range</span>
            <span class="kpi-value">100<span class="unit">%</span></span>
            <span class="muted small">All cases within safe vault range</span>
          </div>
          <div class="card kpi">
            <span class="kpi-label">Patient NPS</span>
            <span class="kpi-value">78 <span class="kpi-delta up"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>+6</span></span>
            <span class="muted small">Last 90 days</span>
          </div>
        </div>

        <!-- PATIENT TRELLO -->
        <div class="panel" style="margin-top:16px;">
          <div class="panel-head">
            <h3>Patient pipeline · Trello</h3>
            <span class="chip">Click a card to open the patient file</span>
          </div>
          <p class="muted" style="margin-bottom:6px">Every active patient across stages — one canonical record from consult to follow-up.</p>
          ${renderPatientTrello()}
        </div>

        <!-- OR schedule + Pipeline (2-col) -->
        <div class="mod-grid" style="grid-template-columns: 1.4fr 1fr; margin-top:16px;">
          <div class="panel">
            <div class="panel-head">
              <h3>Today's OR schedule</h3>
              <span class="chip live"><span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--green);margin-right:6px;vertical-align:middle"></span>Live</span>
            </div>
            <p class="muted" style="margin-bottom:12px">3 ICL cases · Dr. Roberto Zaldivar · Quirófano 2</p>
            <table class="tbl">
              <thead><tr><th>Time</th><th>Patient</th><th>Eye</th><th>Power</th><th>Status</th></tr></thead>
              <tbody>
                <tr><td>08:30</td><td>P. Martínez</td><td>OD / OS</td><td>-6.50 / -6.25</td><td><span class="status done"><span class="sdot"></span>Completed</span></td></tr>
                <tr><td>10:15</td><td>M. Herrera</td><td>OD / OS</td><td>-8.00 / -7.75</td><td><span class="status ok"><span class="sdot"></span>In OR</span></td></tr>
                <tr><td>12:00</td><td>L. Castro</td><td>OD / OS</td><td>-4.25 / -4.00</td><td><span class="status wait"><span class="sdot"></span>Pre-op</span></td></tr>
              </tbody>
            </table>
          </div>

          <div class="panel">
            <div class="panel-head"><h3>Pipeline</h3><span class="chip">7 days</span></div>
            <p class="muted" style="margin-bottom:12px">Patient flow by stage</p>
            <div style="display:flex; flex-direction:column; gap:12px;">
              <div class="prom-row good"><span class="lbl">Consult</span><span class="gauge"><span style="width:88%"></span></span><span class="val">124</span></div>
              <div class="prom-row mid"><span class="lbl">Biometry</span><span class="gauge"><span style="width:62%"></span></span><span class="val">87</span></div>
              <div class="prom-row mid"><span class="lbl">Sizing</span><span class="gauge"><span style="width:44%"></span></span><span class="val">62</span></div>
              <div class="prom-row warn"><span class="lbl">Scheduled</span><span class="gauge"><span style="width:24%"></span></span><span class="val">34</span></div>
            </div>
          </div>
        </div>

        <!-- Quick-access tiles -->
        <div class="mod-grid cols-3" style="margin-top:16px;">
          <button class="panel qa-tile" onclick="renderModule('order')">
            <div class="qa-ico" style="background:linear-gradient(135deg,#E78A27 0%,#0071B0 100%)">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a4 4 0 118 0v2"/></svg>
            </div>
            <div><div class="qa-ttl">Order · STAAR</div><div class="qa-sub">Lens pipeline · alerts · ETAs</div></div>
            <svg class="qa-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
          <button class="panel qa-tile" onclick="renderModule('analytics')">
            <div class="qa-ico" style="background:linear-gradient(135deg,#2472D3 0%,#00D5E1 100%)">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><path d="M3 3v18h18"/><path d="M7 14l4-4 4 4 6-6"/></svg>
            </div>
            <div><div class="qa-ttl">Clinic Analytics</div><div class="qa-sub">PROMs · outcomes · adherence</div></div>
            <svg class="qa-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
          <button class="panel qa-tile" onclick="renderModule('training')">
            <div class="qa-ico" style="background:linear-gradient(135deg,#00D5E1 0%,#009C76 100%)">
              <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2"><path d="M2 3h20v14H2zM2 21h20"/><path d="M10 7l4 3-4 3z" fill="currentColor"/></svg>
            </div>
            <div><div class="qa-ttl">Training · AI Coach</div><div class="qa-sub">Courses · masterclasses · CME</div></div>
            <svg class="qa-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </div>

        <!-- Next events (my clinic's calendar) -->
        <div class="panel" style="margin-top:16px;">
          <div class="panel-head">
            <h3>Next events</h3>
            <span class="chip ai">Congresses · Launches · Training</span>
          </div>
          <p class="muted" style="margin-bottom:12px">Upcoming industry milestones relevant to your clinic.</p>
          <div class="dash-events">${eventsHTML}</div>
        </div>
      </section>

      <!-- ============ COMMUNITY (right 1/3) ============ -->
      <aside class="dash-community-col">
        <div class="dash-eyebrow">
          <span class="eb-ico" style="background:linear-gradient(135deg,#00A6DC,#001E60)">
            <svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2a7 7 0 00-7 7v4a3 3 0 003 3h1v4l4-4h2a7 7 0 000-14z"/></svg>
          </span>
          <div>
            <div class="eb-t">What's happening in the ICL community?</div>
            <div class="eb-s">Across the EVO Connect network — cases, discussions, trending hashtags.</div>
          </div>
        </div>

        <div class="panel dash-comm-panel" style="margin-top:12px;">
          <button class="dash-open-community" onclick="renderModule('community')" style="width:100%;justify-content:center;margin-bottom:12px">
            Open full Community
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>

          <div class="dash-comm-section-head">Feed</div>
          <div class="dash-feed-list">
            ${DATA.feed.slice(0, 3).map(f => `
              <div class="dash-post" onclick="renderModule('community')">
                <div class="dash-post-head">
                  <div class="av">${f.av}</div>
                  <div class="nm-block">
                    <div class="nm">${f.name}${f.verified ? '<svg class="verified" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 2.3 3.3-.3.3 3.3L20.3 10l-2.3 2.4.3 3.3-3.3.3L12 18l-2.4-2-3.3-.3-.3-3.3L3.7 10l2.3-2.4-.3-3.3 3.3-.3zm-1 11.4l5-5-1.4-1.4-3.6 3.6-1.8-1.8-1.4 1.4 3.2 3.2z"/></svg>' : ''}</div>
                    <div class="meta">${f.role} · ${f.time} ago</div>
                  </div>
                </div>
                <div class="dash-post-body">${f.body}</div>
                ${f.hasMedia ? `
                  <div class="dash-post-media">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>
                    <span class="plabel">${f.mediaLabel}</span>
                  </div>` : ''}
                <div class="dash-post-stats">
                  <span><b>${f.likes}</b> likes</span>
                  <span><b>${f.comments}</b> comments</span>
                  <span><b>${f.shares}</b> shares</span>
                  <span style="margin-left:auto">${f.views} views</span>
                </div>
                <div class="dash-post-actions">
                  <button class="pact" onclick="event.stopPropagation(); renderModule('community')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78L12 21l8.84-8.61a5.5 5.5 0 000-7.78z"/></svg>
                    Like
                  </button>
                  <button class="pact" onclick="event.stopPropagation(); renderModule('community')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
                    Comment
                  </button>
                  <button class="pact" onclick="event.stopPropagation(); renderModule('community')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13"/></svg>
                    Share
                  </button>
                </div>
              </div>`).join("")}
          </div>

          <div class="dash-comm-section-head" style="margin-top:16px">Trending now</div>
          <div class="dash-comm-trending">
            ${DATA.trending.slice(0, 5).map(t => `
              <div class="dash-trend-item" onclick="renderModule('community')">
                <div class="cat">${t.cat}</div>
                <div class="tag">${t.tag}</div>
                <div class="posts">${t.posts}</div>
              </div>`).join("")}
          </div>
        </div>
      </aside>

    </div><!-- /.dash-top-grid -->
  `;
}

/* Shared module header */
function moduleHead(label, title, subtitle) {
  return `
    <div class="module-head">
      <div>
        <div class="label">${label}</div>
        <h2>${title}</h2>
        <p>${subtitle}</p>
      </div>
      <div class="actions">
        <button class="btn btn-ghost small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12M5 10l7 7 7-7M5 21h14"/></svg>Export</button>
        <button class="btn btn-primary small"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.3"><path d="M12 5v14M5 12h14"/></svg>New</button>
      </div>
    </div>
  `;
}
