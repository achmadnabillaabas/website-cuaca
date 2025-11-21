// GANTI DENGAN API KEY OPENWEATHERMAP PUNYAMU
const API_KEY = "841424fc89a9a338c8855c101ff05d35";

/* =======================
   TANGGAL SEKARANG
   ======================= */
const dateEl = document.getElementById("dateNow");
dateEl.textContent = new Date().toLocaleDateString("id-ID", {
  weekday: "long",
  year: "numeric",
  month: "long",
  day: "numeric",
});

/* =======================
   DAFTAR IBU KOTA PROVINSI
   (bisa kamu edit sendiri nanti)
   ======================= */
const cityNames = [
  "Banda Aceh",
  "Medan",
  "Padang",
  "Pekanbaru",
  "Tanjung Pinang",
  "Jambi",
  "Palembang",
  "Bengkulu",
  "Bandar Lampung",
  "Serang",
  "Jakarta",
  "Bandung",
  "Semarang",
  "Yogyakarta",
  "Surabaya",
  "Denpasar",
  "Mataram",
  "Kupang",
  "Pontianak",
  "Palangkaraya",
  "Banjarmasin",
  "Samarinda",
  "Tanjung Selor",
  "Manado",
  "Palu",
  "Makassar",
  "Kendari",
  "Gorontalo",
  "Mamuju",
  "Ambon",
  "Ternate",
  "Jayapura",
  "Manokwari",
];

/* =======================
   FUNGSI PANGGIL CUACA
   ======================= */
async function getWeatherByCity(city) {
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
    city
  )}&appid=${API_KEY}&units=metric&lang=id`;

  const res = await fetch(url);
  const data = await res.json();
  return { ok: res.ok, data };
}

/* =======================
   RENDER CARD KOTA
   ======================= */
async function renderCityCards() {
  const container = document.getElementById("cityCards");

  for (const city of cityNames) {
    try {
      const { ok, data } = await getWeatherByCity(city);
      if (!ok) {
        console.warn("Gagal ambil data kota:", city, data.message);
        continue;
      }

      const card = document.createElement("div");
      card.className = "city-card";

      const name = `${data.name}, ${data.sys?.country || ""}`;
      const temp = Math.round(data.main.temp);
      const desc = data.weather[0].description;
      const icon = data.weather[0].icon;

      card.innerHTML = `
        <h3>${name}</h3>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
        <p class="city-temp">${temp}°C</p>
        <p class="city-desc">${desc}</p>
        <p class="city-time">Tekanan: ${data.main.pressure} hPa</p>
      `;

      container.appendChild(card);
    } catch (err) {
      console.error("Error kota:", city, err);
    }
  }
}

/* =======================
   SLIDER BUTTON (SCROLL)
   ======================= */
const wrapper = document.getElementById("citiesWrapper");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");

btnPrev.addEventListener("click", () => {
  wrapper.scrollBy({
    left: -260,
    behavior: "smooth",
  });
});

btnNext.addEventListener("click", () => {
  wrapper.scrollBy({
    left: 260,
    behavior: "smooth",
  });
});

/* =======================
   INISIALISASI
   ======================= */
renderCityCards();
