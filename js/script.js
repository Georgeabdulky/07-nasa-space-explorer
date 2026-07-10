// script.js
// Fetches NASA's Astronomy Picture of the Day (APOD) for a chosen date range
// and renders it as a gallery, with a modal detail view and a few extra touches.

// NOTE: This is a personal API key from api.nasa.gov. Client-side keys are
// visible to anyone who views the page source or the deployed site's JS file,
// which is normal for a static front-end project like this one — just don't
// reuse this key for anything sensitive, and you can always request a fresh
// one at api.nasa.gov if this one ever needs to be rotated.
const NASA_API_KEY = '8PIUudqDkakzyyFO79ubbhRlhg2RxSN55M0f3fgZ';
const APOD_URL = 'https://api.nasa.gov/planetary/apod';

const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const fetchButton = document.querySelector('.filters button');
const gallery = document.getElementById('gallery');
const factText = document.getElementById('factText');

const modal = document.getElementById('modal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

// ---- "Did You Know?" space facts ----------------------------------------

const SPACE_FACTS = [
  'A day on Venus is longer than its year — it takes 243 Earth days to rotate once, but only 225 to orbit the Sun.',
  'Neutron stars are so dense that a single teaspoon of their material would weigh about a billion tons.',
  'The footprints left by Apollo astronauts on the Moon will likely still be there in a million years, since there is no wind or water to erode them.',
  'One million Earths could fit inside the Sun.',
  'Space is completely silent because there is no atmosphere to carry sound waves.',
  'The largest known star, UY Scuti, is so big that it would take a commercial jet over 1,000 years to fly around it once.',
  'A full NASA spacesuit costs about as much as a small aircraft to build.',
  'Saturn could float in water because it is made mostly of gas and is less dense than water.',
  'The Milky Way and the Andromeda galaxy are on a collision course, but they won\u2019t merge for another 4 billion years.',
  'Astronauts can grow up to 2 inches taller in space because there\u2019s no gravity compressing their spine.',
  'The Hubble Space Telescope travels at roughly 17,000 miles per hour, orbiting Earth about every 95 minutes.',
  'There are more stars in the observable universe than grains of sand on every beach on Earth.'
];

function showRandomFact() {
  if (!factText) return;
  const fact = SPACE_FACTS[Math.floor(Math.random() * SPACE_FACTS.length)];
  factText.textContent = fact;
}

// ---- Helpers --------------------------------------------------------------

function toEmbedUrl(url) {
  // Converts a standard YouTube watch/short link into an embeddable one.
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtube.com')) {
      const videoId = parsed.searchParams.get('v');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (parsed.hostname.includes('youtu.be')) {
      const videoId = parsed.pathname.replace('/', '');
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
  } catch (err) {
    // If the URL doesn't parse cleanly, fall through and just use it as-is.
  }
  return url;
}

function formatDisplayDate(dateStr) {
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

// ---- Rendering --------------------------------------------------------------

function showLoading() {
  gallery.innerHTML = `
    <div class="placeholder loading-message">
      <div class="placeholder-icon">🔄</div>
      <p>Loading space photos…</p>
    </div>
  `;
}

function showError(message) {
  gallery.innerHTML = `
    <div class="placeholder error-message">
      <div class="placeholder-icon">⚠️</div>
      <p>${message}</p>
    </div>
  `;
}

function renderGallery(items) {
  if (!items.length) {
    showError('No entries found for that date range. Try a different range.');
    return;
  }

  gallery.innerHTML = '';

  // APOD returns entries oldest-first; show newest-first so the freshest photo leads.
  const sorted = [...items].sort((a, b) => (a.date < b.date ? 1 : -1));

  sorted.forEach((item) => {
    const card = document.createElement('div');
    card.className = 'gallery-item';

    const isVideo = item.media_type === 'video';
    const thumbSrc = isVideo ? (item.thumbnail_url || '') : item.url;

    card.innerHTML = `
      <div class="gallery-thumb">
        ${
          thumbSrc
            ? `<img src="${thumbSrc}" alt="${item.title}" loading="lazy" />`
            : `<div class="video-fallback"><span>🎬</span></div>`
        }
        ${isVideo ? '<span class="media-badge">VIDEO</span>' : ''}
      </div>
      <h3>${item.title}</h3>
      <p class="gallery-date">${formatDisplayDate(item.date)}</p>
    `;

    card.addEventListener('click', () => openModal(item));
    gallery.appendChild(card);
  });
}

function openModal(item) {
  const isVideo = item.media_type === 'video';

  modalBody.innerHTML = `
    <div class="modal-media">
      ${
        isVideo
          ? `<iframe src="${toEmbedUrl(item.url)}" title="${item.title}" allowfullscreen></iframe>`
          : `<img src="${item.hdurl || item.url}" alt="${item.title}" />`
      }
    </div>
    <h2>${item.title}</h2>
    <p class="modal-date">${formatDisplayDate(item.date)}</p>
    <p class="modal-explanation">${item.explanation}</p>
    ${item.copyright ? `<p class="modal-copyright">© ${item.copyright.trim()}</p>` : ''}
  `;

  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.add('hidden');
  modalBody.innerHTML = '';
  document.body.style.overflow = '';
}

modalClose.addEventListener('click', closeModal);
modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal();
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) closeModal();
});

// ---- Fetching --------------------------------------------------------------

async function fetchApod(startDate, endDate) {
  const params = new URLSearchParams({
    api_key: NASA_API_KEY,
    start_date: startDate,
    end_date: endDate,
    thumbs: 'true'
  });

  const response = await fetch(`${APOD_URL}?${params.toString()}`);

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('NASA\u2019s API rate limit was reached. Wait a bit and try again, or use your own API key.');
    }
    throw new Error('Something went wrong fetching data from NASA\u2019s API.');
  }

  const data = await response.json();
  // A single-day range returns an object instead of an array — normalize it.
  return Array.isArray(data) ? data : [data];
}

async function handleFetchClick() {
  const startDate = startInput.value;
  const endDate = endInput.value;

  if (!startDate || !endDate) {
    showError('Please choose both a start and an end date.');
    return;
  }

  if (startDate > endDate) {
    showError('Start date must be before the end date.');
    return;
  }

  fetchButton.disabled = true;
  showLoading();

  try {
    const items = await fetchApod(startDate, endDate);
    renderGallery(items);
  } catch (err) {
    showError(err.message || 'Unable to load images right now.');
  } finally {
    fetchButton.disabled = false;
  }
}

fetchButton.addEventListener('click', handleFetchClick);

// ---- Init --------------------------------------------------------------

showRandomFact();
handleFetchClick();