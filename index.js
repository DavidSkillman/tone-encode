function tone(frequency) {
  // create web audio api context
  const audioCtx = new AudioContext();

  // create Oscillator node
  const oscillator = audioCtx.createOscillator();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime); // value in hertz
  oscillator.connect(audioCtx.destination);
  oscillator.start();
}

const MIN_DB = -60;  // Minimum decibel level
const MAX_DB = 0;    // Maximum decibel level (0 dBFS)

function calculateDecibels(dataArray) {
  // Calculate RMS (Root Mean Square) value
  const rms = Math.sqrt(
    dataArray.reduce((acc, val) => acc + val * val, 0) / dataArray.length
  );

  // Convert to decibels (dBFS - decibels relative to full scale)
  const dbfs = 20 * Math.log10(Math.max(rms, 1) / 255);

  // Clamp values between MIN_DB and MAX_DB
  return Math.max(MIN_DB, Math.min(MAX_DB, dbfs));
}

const MIN_DB_SPL = 30;        // Approximate minimum audible level
const REFERENCE_DB_SPL = 94;  // Standard reference level

function estimateDbSpl(dbfs) {
  return Math.max(MIN_DB_SPL, Math.round(REFERENCE_DB_SPL + dbfs));
}

let stream;

function animate(analyser, dataArray) {
  // Get current audio data
  analyser.getByteFrequencyData(dataArray);

  // Calculate level and update display
  //const rms = calculateRmsLevel(dataArray);
  //const normalizedLevel = Math.pow(rms / 255, 0.4) * 1.2;  // Smoother scaling
  //const level = Math.min(normalizedLevel, 1);  // Clamp to maximum

  console.log(dataArray.reduce((a, b) => Math.max(a, b)) / 255);

  // Schedule next frame
  requestAnimationFrame(() => animate(analyser, dataArray));
}

async function record() {
  // Prompt the user to use their microphone.
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });
  const audioContext = new AudioContext();
  const source = audioContext.createMediaStreamSource(stream);

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 32768; // For detailed analysis

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const gainNode = audioContext.createGain();
  gainNode.gain.value = 1000000; // boost signal
  source.connect(gainNode);
  gainNode.connect(analyser);

  const canvas = document.querySelector('canvas');
  const canvasCtx = canvas.getContext('2d');

  canvas.width = 800;
  canvas.height = 400;

  function draw() {
    requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray); // get frequency data

    canvasCtx.fillStyle = 'black';
    canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

    const barWidth = canvas.width / bufferLength;
    for(let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i];
      const hue = i / bufferLength * 360; // optional color mapping
      canvasCtx.fillStyle = `hsl(${hue}, 100%, 50%)`;
      canvasCtx.fillRect(i * barWidth, canvas.height - barHeight, barWidth, barHeight);
    }
  }

  draw();
}