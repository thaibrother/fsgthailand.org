/* ──────────────────────────────────────────────────────────────────
 * site-data.js — single source of truth for site numbers/labels
 *
 * Usage in HTML:
 *   <span data-fsg="schools.count"></span>
 *   <span data-fsg="brothers.thaiCount"></span>
 *   <span data-fsg="foundation.yearsInThailand"></span>
 *
 * Updates: change values here once → all pages reflect on load.
 * ────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  const NOW_YEAR = new Date().getFullYear();

  const DATA = {
    foundation: {
      name: 'Foundation of the Brothers of Saint Gabriel in Thailand',
      nameTh: 'มูลนิธิคณะเซนต์คาเบรียลแห่งประเทศไทย',
      establishedYear: 1901,
      get yearsInThailand() {
        return NOW_YEAR - this.establishedYear;
      },
    },
    schools: {
      count: 15,
      countLabel: '15 Schools',
      countLabelTh: 'สถาบันในเครือ 15 แห่ง',
      // historical context (e.g. supervision) — adjust per fiscal year
      supervised2568: 14, // ACEP เลื่อนไปปี 2569
    },
    brothers: {
      worldwideCountries: 40,
      // (อัพเดทค่าจริงจาก thaibrothers.net เมื่อพร้อม)
    },
    swis: {
      modules: '5 กลุ่มงาน',
      functions: '220 ฟังก์ชัน',
      kpis: 47,
      strategicPlanYears: 6,
    },
    montfortian: {
      founder: 'Saint Louis-Marie de Montfort',
      founderBornYear: 1673,
      founderDiedYear: 1716,
      get founderDeathAnniversary() {
        return NOW_YEAR - this.founderDiedYear;
      },
      congregations: 3, // FDLS, SMM, SG
      sgFoundedYear: 1705,
    },
  };

  // ─── Apply to DOM ───
  function apply() {
    document.querySelectorAll('[data-fsg]').forEach(el => {
      const path = el.getAttribute('data-fsg').split('.');
      let val = DATA;
      for (const p of path) {
        if (val == null) break;
        val = val[p];
      }
      if (val !== undefined && val !== null) {
        el.textContent = val;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }

  window.SiteData = DATA;
})();
