// dateRange.js
// Sets up the min/max bounds for the date pickers and a sensible default range.
// APOD has existed daily since June 16, 1995, so that's our earliest valid date.
// No need to modify this file — script.js reads whatever values end up in the inputs.

document.addEventListener('DOMContentLoaded', () => {
  const startInput = document.getElementById('startDate');
  const endInput = document.getElementById('endDate');

  const APOD_START_DATE = new Date('1995-06-16T00:00:00');
  const today = new Date();

  const toISODate = (date) => date.toISOString().split('T')[0];

  const minDateStr = toISODate(APOD_START_DATE);
  const maxDateStr = toISODate(today);

  [startInput, endInput].forEach((input) => {
    input.setAttribute('min', minDateStr);
    input.setAttribute('max', maxDateStr);
  });

  // Default to the last 9 days so the gallery has something to show right away.
  const defaultStart = new Date();
  defaultStart.setDate(today.getDate() - 8);

  startInput.value = toISODate(defaultStart);
  endInput.value = maxDateStr;
});