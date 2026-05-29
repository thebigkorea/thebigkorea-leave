const API_URL = "https://script.google.com/macros/s/AKfycbx7Y5zaVU7kYTdFwdwhUgoKwqOGx55-8a0McZOmA42PpbU4WWJqYTFPeSH2oD4mOzd7/exec";

let currentAdminPassword = "";

/* =========================
   공통 API 호출
========================= */
async function api(action, data = {}) {
  const res = await fetch(API_URL, {
    method: "POST",
    body: JSON.stringify({
      action,
      data
    })
  });

  const json = await res.json();

  if (!json.success) {
    throw new Error(json.message || "처리 중 오류가 발생했습니다.");
  }

  return json.data;
}

/* =========================
   탭 전환
========================= */
function showTab(id, btn) {
  document.querySelectorAll(".card").forEach(el => {
    el.classList.add("hidden");
  });

  document.getElementById(id).classList.remove("hidden");

  document.querySelectorAll(".tab").forEach(el => {
    el.classList.remove("active");
  });

  if (btn) {
    btn.classList.add("active");
  }
}

/* =========================
   버튼 로딩
========================= */
function setLoading(id, text) {
  const btn = document.getElementById(id);

  if (!btn) return;

  btn.dataset.original = btn.textContent;
  btn.textContent = text;
  btn.disabled = true;
}

function clearLoading(id) {
  const btn = document.getElementById(id);

  if (!btn) return;

  btn.textContent = btn.dataset.original || "확인";
  btn.disabled = false;
}

/* =========================
   자동 사용일수
========================= */
function autoUsedDays() {
  const type = document.getElementById("leaveType")?.value;
  const used = document.getElementById("usedDays");

  if (!used) return;

  if (type === "오전 반차" || type === "오후 반차") {
    used.value = "0.5";
  } else if (
    (type === "연차" || type === "월차") &&
    !used.value
  ) {
    used.value = "1";
  }
}

/* =========================
   연월차 신청
========================= */
async function submitLeave() {
  setLoading("submitBtn", "신청 중...");

  autoUsedDays();

  try {
    const data = {
      workplace: document.getElementById("applyWorkplace")?.value || "",
      name: document.getElementById("applyName").value.trim(),
      phone: document.getElementById("applyPhone").value.trim(),
      type: document.getElementById("leaveType").value,
      startDate: document.getElementById("startDate").value,
      endDate: document.getElementById("endDate").value,
      usedDays: document.getElementById("usedDays").value,
      reason: document.getElementById("reason").value.trim()
    };

    const msg = await api("submitLeave", data);

    alert(msg);

    document.getElementById("leaveType").value = "";
    document.getElementById("startDate").value = "";
    document.getElementById("endDate").value = "";
    document.getElementById("usedDays").value = "";
    document.getElementById("reason").value = "";

  } catch (err) {
    alert(err.message);

  } finally {
    clearLoading("submitBtn");
  }
}

/* =========================
   직원 등록
========================= */
async function registerEmployee() {
  setLoading("regBtn", "등록 중...");

  try {
    const data = {
      workplace: document.getElementById("regWorkplace")?.value || "",
      name: document.getElementById("regName").value.trim(),
      phone: document.getElementById("regPhone").value.trim(),
      joinDate: document.getElementById("joinDate").value,
      baseLeave: document.getElementById("baseLeave").value
    };

    const msg = await api("registerEmployee", data);

    alert(msg);

    document.getElementById("regName").value = "";
    document.getElementById("regPhone").value = "";
    document.getElementById("joinDate").value = "";
    document.getElementById("baseLeave").value = "15";

  } catch (err) {
    alert(err.message);

  } finally {
    clearLoading("regBtn");
  }
}

/* =========================
   내 신청내역 조회
========================= */
async function loadMyHistory() {
  setLoading("historyBtn", "조회 중...");

  try {
    const data = {
      name: document.getElementById("historyName").value.trim(),
      phone: document.getElementById("historyPhone").value.trim()
    };

    const list = await api("getMyHistory", data);

    const box = document.getElementById("historyResult");

    box.innerHTML = "";

    if (!list.length) {
      box.innerHTML = `
        <div class="item">
          조회된 내역이 없습니다.
        </div>
      `;
      return;
    }

    list.forEach(item => {
      box.innerHTML += `
        <div class="item">
          <div>
            <strong>${item.type}</strong>
            <span class="badge">${item.status}</span>
          </div>

          <div>
            기간 :
            ${item.startDate} ~ ${item.endDate}
          </div>

          <div>
            사용일수 :
            ${item.usedDays}
          </div>

          <div>
            사유 :
            ${item.reason || "-"}
          </div>

          <div>
            신청일 :
            ${item.applyDate}
          </div>
        </div>
      `;
    });

  } catch (err) {
    alert(err.message);

  } finally {
    clearLoading("historyBtn");
  }
}

/* =========================
   잔여연차 조회
========================= */
async function checkBalance() {
  setLoading("balanceBtn", "조회 중...");

  try {
    const data = {
      name: document.getElementById("balanceName").value.trim(),
      phone: document.getElementById("balancePhone").value.trim()
    };

    const item = await api("getMyBalance", data);

    document.getElementById("balanceResult").innerHTML = `
      <div class="balance-box">
        <div>
          <strong>${item.name}</strong>
        </div>

        <div>
          입사일 :
          ${item.joinDate}
        </div>

        <div>
          기본연차 :
          ${item.baseLeave}일
        </div>

        <div>
          사용연차 :
          ${item.usedLeave}일
        </div>

        <div>
          <strong>
            잔여연차 :
            ${item.remainLeave}일
          </strong>
        </div>
      </div>
    `;

  } catch (err) {
    alert(err.message);

  } finally {
    clearLoading("balanceBtn");
  }
}

/* =========================
   관리자 신청목록
========================= */
async function loadAdminList() {
  setLoading("adminBtn", "조회 중...");

  try {
    currentAdminPassword =
      document.getElementById("adminPw").value;

    const list = await api("getAdminList", {
      password: currentAdminPassword
    });

    const box =
      document.getElementById("adminResult");

    box.innerHTML = "";

    if (!list.length) {
      box.innerHTML = `
        <div class="item">
          신청 내역이 없습니다.
        </div>
      `;
      return;
    }

    list.forEach(item => {

      const cls =
        item.status === "승인"
          ? "ok"
          : item.status === "반려"
          ? "no"
          : "";

      box.innerHTML += `
        <div class="item">

          <div>
            <strong>
              ${item.name}
            </strong>
            / ${item.phone}
          </div>

          <div>
            ${item.type}
            <span class="badge ${cls}">
              ${item.status}
            </span>
          </div>

          <div>
            기간 :
            ${item.startDate} ~ ${item.endDate}
          </div>

          <div>
            사용일수 :
            ${item.usedDays}
          </div>

          <div>
            사유 :
            ${item.reason || "-"}
          </div>

          <div>
            신청일 :
            ${item.applyDate}
          </div>

          <div>
            처리일 :
            ${item.processedAt || "-"}
          </div>

          <div class="admin-buttons">

            <button
              class="approve"
              onclick="changeStatus(${item.rowNumber}, '승인')">
              승인
            </button>

            <button
              class="reject"
              onclick="changeStatus(${item.rowNumber}, '반려')">
              반려
            </button>

          </div>

        </div>
      `;
    });

  } catch (err) {
    alert(err.message);

  } finally {
    clearLoading("adminBtn");
  }
}

/* =========================
   승인 / 반려
========================= */
async function changeStatus(rowNumber, status) {

  try {

    const msg = await api(
      "updateLeaveStatus",
      {
        rowNumber,
        status,
        password: currentAdminPassword
      }
    );

    alert(msg);

    loadAdminList();

  } catch (err) {

    alert(err.message);

  }
}

/* =========================
   서비스워커
========================= */
if ("serviceWorker" in navigator) {

  navigator.serviceWorker
    .register("service-worker.js");

}