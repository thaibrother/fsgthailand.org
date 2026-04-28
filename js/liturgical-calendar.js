/* ──────────────────────────────────────────────────────────────────
 * liturgical-calendar.js — auto-update Catholic liturgical badge
 *
 * Computes for any date:
 *   - Liturgical season (Advent / Christmas / Lent / Easter / Ordinary)
 *   - Saint(s) of the day (universal calendar + Montfortian + Thai)
 *   - Special anniversaries / commemorations relevant to Brothers SG
 *
 * Usage in HTML:
 *   <div class="rome-cal-date"><span id="rc-date"></span></div>
 *   <div class="rome-cal-items">
 *     <span class="rc-tag" id="rc-season"></span>
 *     <span class="rc-tag" id="rc-saints"></span>
 *     <span class="rc-tag" id="rc-special"></span>
 *   </div>
 *   <script src="js/liturgical-calendar.js"></script>
 *
 * Dependencies: none (pure JS)
 * ────────────────────────────────────────────────────────────────── */

(function () {
  'use strict';

  // ─── Computus: Easter date (Western/Gregorian) ───
  function easterDate(year) {
    // Anonymous Gregorian algorithm
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(Date.UTC(year, month - 1, day));
  }

  function daysBetween(a, b) {
    return Math.round((b - a) / (1000 * 60 * 60 * 24));
  }

  function addDays(date, n) {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + n);
    return d;
  }

  // ─── Liturgical Season ───
  function getSeason(date) {
    const year = date.getUTCFullYear();
    const easter = easterDate(year);
    const ashWed = addDays(easter, -46);
    const pentecost = addDays(easter, 49);

    // Christmas season — Dec 25 to Baptism of the Lord (Sun after Epiphany)
    const christmas = new Date(Date.UTC(year, 11, 25));
    const epiphany = new Date(Date.UTC(year + 1, 0, 6));
    // Baptism of the Lord — Sunday after Epiphany (or Jan 9-13 range)
    let baptism = new Date(epiphany);
    while (baptism.getUTCDay() !== 0) baptism = addDays(baptism, 1);
    if (epiphany.getUTCDay() === 0) baptism = addDays(epiphany, 1); // Mon if Epiphany on Sun

    // Advent — 4 Sundays before Christmas
    let advent1 = new Date(christmas);
    while (advent1.getUTCDay() !== 0) advent1 = addDays(advent1, -1);
    advent1 = addDays(advent1, -21); // 4 Sundays before

    // Previous year's Baptism for Jan/early dates
    const prevYearChristmas = new Date(Date.UTC(year - 1, 11, 25));
    const prevYearEpiphany = new Date(Date.UTC(year, 0, 6));
    let prevYearBaptism = new Date(prevYearEpiphany);
    while (prevYearBaptism.getUTCDay() !== 0) prevYearBaptism = addDays(prevYearBaptism, 1);
    if (prevYearEpiphany.getUTCDay() === 0) prevYearBaptism = addDays(prevYearEpiphany, 1);

    let prevYearAdvent1 = new Date(prevYearChristmas);
    while (prevYearAdvent1.getUTCDay() !== 0) prevYearAdvent1 = addDays(prevYearAdvent1, -1);
    prevYearAdvent1 = addDays(prevYearAdvent1, -21);

    // Determine season
    if (date >= advent1 && date < christmas) {
      const week = Math.floor(daysBetween(advent1, date) / 7) + 1;
      return { name: 'Advent', label: 'Advent', week, color: '#5a3d7a' };
    }
    if ((date >= christmas) || (date >= new Date(Date.UTC(year, 0, 1)) && date <= prevYearBaptism)) {
      return { name: 'Christmas', label: 'Christmas Time', color: '#c9a74e' };
    }
    if (date >= ashWed && date < easter) {
      const week = Math.floor(daysBetween(ashWed, date) / 7) + 1;
      // First "week" is Ash Wed - 1st Sun of Lent (partial)
      return { name: 'Lent', label: 'Lent', week, color: '#5a2828' };
    }
    if (date >= easter && date <= pentecost) {
      // Easter Time — 7 weeks
      const week = Math.floor(daysBetween(easter, date) / 7) + 1;
      const labelMap = { 1: '1st', 2: '2nd', 3: '3rd', 4: '4th', 5: '5th', 6: '6th', 7: '7th', 8: '8th' };
      return {
        name: 'Easter',
        label: 'Easter',
        week,
        weekLabel: `${labelMap[week] || week + 'th'} Week`,
        color: '#c9a74e',
      };
    }
    // Ordinary Time
    return { name: 'Ordinary', label: 'Ordinary Time', color: '#2d5a1e' };
  }

  // ─── Saints Calendar ───
  // Format: 'MM-DD': [{name, type: 'feast'|'memorial'|'optional', source: 'universal'|'montfortian'|'thai'}]
  const SAINTS = {
    // ─── January ───
    '01-01': [{ name: 'Mary, Mother of God', type: 'solemnity' }],
    '01-02': [{ name: 'Sts. Basil the Great & Gregory Nazianzen', type: 'memorial' }],
    '01-04': [{ name: 'St. Elizabeth Ann Seton', type: 'optional' }],
    '01-06': [{ name: 'Epiphany of the Lord', type: 'solemnity' }],
    '01-17': [{ name: 'St. Anthony of Egypt', type: 'memorial' }],
    '01-21': [{ name: 'St. Agnes', type: 'memorial' }],
    '01-24': [{ name: 'St. Francis de Sales', type: 'memorial' }],
    '01-25': [{ name: 'Conversion of St. Paul', type: 'feast' }],
    '01-28': [{ name: 'St. Thomas Aquinas', type: 'memorial' }],
    '01-31': [
      { name: 'St. John Bosco', type: 'memorial' },
      { name: 'Birth of St. Louis-Marie de Montfort (1673)', type: 'montfortian' },
    ],

    // ─── February ───
    '02-02': [{ name: 'Presentation of the Lord', type: 'feast' }],
    '02-05': [{ name: 'St. Agatha', type: 'memorial' }],
    '02-10': [{ name: 'St. Scholastica', type: 'memorial' }],
    '02-11': [{ name: 'Our Lady of Lourdes', type: 'optional' }],
    '02-14': [{ name: 'Sts. Cyril & Methodius', type: 'memorial' }],
    '02-22': [{ name: 'Chair of St. Peter', type: 'feast' }],
    '02-25': [{ name: 'Bl. Sebastián de Aparicio', type: 'optional' }],

    // ─── March ───
    '03-07': [{ name: 'Sts. Perpetua & Felicity', type: 'memorial' }],
    '03-17': [{ name: 'St. Patrick', type: 'optional' }],
    '03-19': [{ name: 'St. Joseph, Spouse of BVM', type: 'solemnity' }],
    '03-25': [{ name: 'Annunciation of the Lord', type: 'solemnity' }],

    // ─── April ───
    '04-04': [{ name: 'St. Isidore of Seville', type: 'optional' }],
    '04-05': [{ name: 'St. Vincent Ferrer', type: 'optional' }],
    '04-07': [
      { name: 'St. John Baptist de la Salle', type: 'memorial' },
      { name: 'Daughters of Wisdom founded (1703)', type: 'montfortian' },
    ],
    '04-11': [{ name: 'St. Stanislaus', type: 'memorial' }],
    '04-13': [{ name: 'St. Martin I, Pope', type: 'optional' }],
    '04-16': [
      { name: 'St. Bernadette Soubirous', type: 'optional' },
      { name: 'Pope Benedict XVI birthday (1927)', type: 'special' },
    ],
    '04-21': [{ name: 'St. Anselm', type: 'optional' }],
    '04-23': [{ name: 'St. George (martyr)', type: 'optional' }],
    '04-25': [{ name: 'St. Mark, Evangelist', type: 'feast' }],
    '04-28': [
      { name: 'St. Louis-Marie de Montfort', type: 'memorial-montfortian' },
      { name: 'St. Peter Chanel', type: 'optional' },
      { name: 'St. Gianna Beretta Molla', type: 'optional' },
    ],
    '04-29': [{ name: 'St. Catherine of Siena', type: 'memorial' }],
    '04-30': [{ name: 'St. Pius V', type: 'optional' }],

    // ─── May ───
    '05-01': [{ name: 'St. Joseph the Worker', type: 'optional' }],
    '05-02': [{ name: 'St. Athanasius', type: 'memorial' }],
    '05-03': [{ name: 'Sts. Philip & James', type: 'feast' }],
    '05-08': [{ name: 'Brothers of Saint Gabriel — anniversary of Foundation (1705)', type: 'montfortian' }],
    '05-13': [{ name: 'Our Lady of Fatima', type: 'optional' }],
    '05-14': [{ name: 'St. Matthias', type: 'feast' }],
    '05-15': [{ name: 'St. Isidore the Farmer', type: 'optional' }],
    '05-22': [{ name: 'St. Rita of Cascia', type: 'optional' }],
    '05-26': [{ name: 'St. Philip Neri', type: 'memorial' }],
    '05-31': [{ name: 'Visitation of the BVM', type: 'feast' }],

    // ─── June ───
    '06-01': [{ name: 'St. Justin Martyr', type: 'memorial' }],
    '06-03': [{ name: 'Sts. Charles Lwanga & Companions', type: 'memorial' }],
    '06-05': [{ name: 'St. Boniface', type: 'memorial' }],
    '06-13': [{ name: 'St. Anthony of Padua', type: 'memorial' }],
    '06-21': [{ name: 'St. Aloysius Gonzaga', type: 'memorial' }],
    '06-24': [{ name: 'Nativity of St. John the Baptist', type: 'solemnity' }],
    '06-29': [{ name: 'Sts. Peter & Paul', type: 'solemnity' }],

    // ─── July ───
    '07-03': [{ name: 'St. Thomas, Apostle', type: 'feast' }],
    '07-11': [{ name: 'St. Benedict', type: 'memorial' }],
    '07-15': [{ name: 'St. Bonaventure', type: 'memorial' }],
    '07-16': [{ name: 'Our Lady of Mt. Carmel', type: 'optional' }],
    '07-22': [{ name: 'St. Mary Magdalene', type: 'feast' }],
    '07-25': [{ name: 'St. James, Apostle', type: 'feast' }],
    '07-26': [{ name: 'Sts. Joachim & Anne (parents of BVM)', type: 'memorial' }],
    '07-29': [{ name: 'St. Martha (& Mary, Lazarus)', type: 'memorial' }],
    '07-31': [{ name: 'St. Ignatius of Loyola', type: 'memorial' }],

    // ─── August ───
    '08-01': [{ name: 'St. Alphonsus Liguori', type: 'memorial' }],
    '08-04': [{ name: 'St. John Vianney', type: 'memorial' }],
    '08-06': [{ name: 'Transfiguration of the Lord', type: 'feast' }],
    '08-08': [{ name: 'St. Dominic', type: 'memorial' }],
    '08-10': [{ name: 'St. Lawrence, Deacon & Martyr', type: 'feast' }],
    '08-11': [{ name: 'St. Clare of Assisi', type: 'memorial' }],
    '08-14': [{ name: 'St. Maximilian Kolbe', type: 'memorial' }],
    '08-15': [{ name: 'Assumption of the BVM', type: 'solemnity' }],
    '08-20': [
      { name: 'St. Bernard of Clairvaux', type: 'memorial' },
      { name: 'Brothers SG arrive in Thailand (1901)', type: 'thai' },
    ],
    '08-22': [{ name: 'Queenship of the BVM', type: 'memorial' }],
    '08-24': [{ name: 'St. Bartholomew', type: 'feast' }],
    '08-27': [{ name: 'St. Monica', type: 'memorial' }],
    '08-28': [{ name: 'St. Augustine', type: 'memorial' }],
    '08-29': [{ name: 'Passion of St. John the Baptist', type: 'memorial' }],

    // ─── September ───
    '09-08': [{ name: 'Nativity of the BVM', type: 'feast' }],
    '09-13': [{ name: 'St. John Chrysostom', type: 'memorial' }],
    '09-14': [{ name: 'Exaltation of the Holy Cross', type: 'feast' }],
    '09-15': [{ name: 'Our Lady of Sorrows', type: 'memorial' }],
    '09-20': [{ name: 'Sts. Andrew Kim Taegon, Paul Chong & Korean Martyrs', type: 'memorial' }],
    '09-21': [{ name: 'St. Matthew, Apostle', type: 'feast' }],
    '09-23': [{ name: 'St. Pio of Pietrelcina (Padre Pio)', type: 'memorial' }],
    '09-29': [{ name: 'Sts. Michael, Gabriel & Raphael — Archangels', type: 'feast-montfortian' }],
    '09-30': [{ name: 'St. Jerome', type: 'memorial' }],

    // ─── October ───
    '10-01': [{ name: 'St. Thérèse of Lisieux', type: 'memorial' }],
    '10-02': [{ name: 'Holy Guardian Angels', type: 'memorial' }],
    '10-04': [{ name: 'St. Francis of Assisi', type: 'memorial' }],
    '10-07': [{ name: 'Our Lady of the Rosary', type: 'memorial' }],
    '10-15': [{ name: 'St. Teresa of Avila', type: 'memorial' }],
    '10-16': [{ name: 'St. Margaret Mary Alacoque', type: 'optional' }],
    '10-17': [{ name: 'St. Ignatius of Antioch', type: 'memorial' }],
    '10-18': [{ name: 'St. Luke, Evangelist', type: 'feast' }],
    '10-22': [{ name: 'St. John Paul II', type: 'optional' }],
    '10-28': [{ name: 'Sts. Simon & Jude', type: 'feast' }],
    '10-29': [{ name: 'Bl. Chiara Badano', type: 'optional' }],

    // ─── November ───
    '11-01': [{ name: 'All Saints', type: 'solemnity' }],
    '11-02': [{ name: 'All Souls', type: 'memorial' }],
    '11-09': [{ name: 'Dedication of the Lateran Basilica', type: 'feast' }],
    '11-21': [{ name: 'Presentation of the BVM', type: 'memorial' }],
    '11-22': [{ name: 'St. Cecilia', type: 'memorial' }],
    '11-25': [{ name: 'St. Catherine of Alexandria', type: 'optional' }],
    '11-30': [{ name: 'St. Andrew, Apostle', type: 'feast' }],

    // ─── December ───
    '12-03': [{ name: 'St. Francis Xavier', type: 'memorial' }],
    '12-06': [{ name: 'St. Nicholas of Myra', type: 'optional' }],
    '12-08': [{ name: 'Immaculate Conception of the BVM', type: 'solemnity' }],
    '12-09': [{ name: 'St. Juan Diego', type: 'optional' }],
    '12-12': [{ name: 'Our Lady of Guadalupe', type: 'optional' }],
    '12-13': [{ name: 'St. Lucy', type: 'memorial' }],
    '12-14': [{ name: 'St. John of the Cross', type: 'memorial' }],
    '12-25': [{ name: 'Nativity of the Lord', type: 'solemnity' }],
    '12-26': [{ name: 'St. Stephen, First Martyr', type: 'feast' }],
    '12-27': [{ name: 'St. John, Apostle & Evangelist', type: 'feast' }],
    '12-28': [{ name: 'Holy Innocents, Martyrs', type: 'feast' }],
  };

  // ─── Special days (one-off anniversaries, news) ───
  // Format: 'YYYY-MM-DD' => label
  const SPECIAL_BY_DATE = {
    '2026-04-28': '310th Anniversary — Death of our Founder',
    '2026-04-27': 'Pope Leo XIV recognizes 49 Brothers SG martyrs',
    '2026-04-05': 'Easter Sunday — Resurrection of the Lord',
    '2026-08-20': '125 Years — Brothers SG in Thailand',
  };

  // Format: 'MM-DD' => label (recurring annually)
  const SPECIAL_RECURRING = {
    '01-31': 'Birth of our Founder',
    '04-28': 'Death of our Founder — Patronal Day',
    '08-20': 'Brothers SG arrived in Thailand (1901)',
  };

  // ─── Pretty format ───
  function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return `${months[date.getMonth()]} ${date.getDate()} · ${days[date.getDay()]}`;
  }

  function pickPrimarySaint(saints) {
    if (!saints || !saints.length) return null;
    // priority: solemnity > feast > memorial-montfortian > montfortian > feast-montfortian > memorial > optional > thai
    const order = ['solemnity', 'feast', 'memorial-montfortian', 'montfortian', 'feast-montfortian', 'memorial', 'optional', 'thai', 'special'];
    const sorted = [...saints].sort((a, b) => {
      const ai = order.indexOf(a.type);
      const bi = order.indexOf(b.type);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    return sorted;
  }

  function getSeasonLabel(season) {
    if (season.name === 'Easter' && season.weekLabel) return `Easter — ${season.weekLabel}`;
    if (season.name === 'Lent' && season.week) return `Lent — Week ${season.week}`;
    if (season.name === 'Advent' && season.week) return `Advent — Week ${season.week}`;
    return season.label;
  }

  // ─── Main render ───
  function render(date) {
    date = date || new Date();
    const local = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const utc = new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));

    const mmdd = String(utc.getUTCMonth() + 1).padStart(2, '0') + '-' + String(utc.getUTCDate()).padStart(2, '0');
    const yyyymmdd = utc.getUTCFullYear() + '-' + mmdd;

    const season = getSeason(utc);
    const saintsToday = pickPrimarySaint(SAINTS[mmdd]);
    const specialOneOff = SPECIAL_BY_DATE[yyyymmdd];
    const specialRecurring = SPECIAL_RECURRING[mmdd];

    // Date
    const elDate = document.getElementById('rc-date');
    if (elDate) elDate.textContent = formatDate(local);

    // Season
    const elSeason = document.getElementById('rc-season');
    if (elSeason) {
      const inner = elSeason.innerHTML;
      const hasLabel = inner.includes('rc-label');
      elSeason.innerHTML = hasLabel
        ? `<span class="rc-label">Season</span> ${getSeasonLabel(season)}`
        : getSeasonLabel(season);
    }

    // Saints
    const elSaints = document.getElementById('rc-saints');
    if (elSaints) {
      let label = 'Feria';
      if (saintsToday && saintsToday.length) {
        // Show top 1-2 saints
        const top = saintsToday.slice(0, 2).map(s => s.name);
        label = top.join(' &middot; ');
      }
      const inner = elSaints.innerHTML;
      const hasLabel = inner.includes('rc-label');
      elSaints.innerHTML = hasLabel
        ? `<span class="rc-label">Saints</span> ${label}`
        : label;
    }

    // Special
    const elSpecial = document.getElementById('rc-special');
    if (elSpecial) {
      const special = specialOneOff || specialRecurring;
      if (special) {
        const inner = elSpecial.innerHTML;
        const hasLabel = inner.includes('rc-label');
        elSpecial.innerHTML = hasLabel
          ? `<span class="rc-label">Special</span> ${special}`
          : special;
        elSpecial.style.display = '';
      } else {
        elSpecial.style.display = 'none';
      }
    }
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => render());
  } else {
    render();
  }

  // Expose for debugging
  window.LiturgicalCalendar = { render, getSeason, easterDate, SAINTS };
})();
